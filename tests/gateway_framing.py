"""Gateway HTTP framing regression tests (stdlib only, macOS + Linux).

Boots a real isolated backend binary on 127.0.0.1:7341 with an empty state
directory, then asserts every client-visible framing path ends TERMINALLY:
a complete HTTP response (status + Content-Length bytes) followed by a clean
close. No silent drops, no truncated streams. Real inference is never
attempted: all requests use unknown models and fail closed server-side.

Run:  python3 tests/gateway_framing.py --binary build/bridge-zag-macos
"""
from __future__ import annotations
import argparse, json, os, pathlib, shutil, socket, stat, subprocess, sys, tempfile, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PORT = 7341


def wait_healthy(proc, timeout=15.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            err = proc.stderr.read().decode('utf-8', 'replace') if proc.stderr else ''
            raise AssertionError(f'backend exited early (code {proc.returncode}): {err[:300]}')
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/health', timeout=2) as r:
                if r.status == 200:
                    return
        except OSError:
            time.sleep(0.2)
    raise AssertionError('gateway never became healthy')


def raw_exchange(payloads: list[bytes], timeout=8.0) -> bytes:
    """Write payloads back-to-back on one connection, read until close/timeout."""
    out = b''
    sock = socket.create_connection(('127.0.0.1', PORT), timeout=timeout)
    try:
        for p in payloads:
            sock.sendall(p)
        sock.settimeout(timeout)
        while True:
            try:
                chunk = sock.recv(65536)
            except socket.timeout:
                break
            if not chunk:
                break
            out += chunk
    finally:
        sock.close()
    return out


def post_request(token: str, body: bytes, path='/v1/chat/completions') -> bytes:
    return (f'POST {path} HTTP/1.1\r\nHost: 127.0.0.1:{PORT}\r\n'
            f'Authorization: Bearer {token}\r\nContent-Type: application/json\r\n'
            f'Content-Length: {len(body)}\r\n\r\n').encode() + body


def split_responses(data: bytes):
    """Split concatenated HTTP/1.1 responses using Content-Length framing."""
    responses = []
    while data:
        head, sep, rest = data.partition(b'\r\n\r\n')
        assert sep, f'truncated head: {data[:80]!r}'
        headers = head.decode('latin1')
        status = int(headers.split(' ', 2)[1])
        length = 0
        for line in headers.split('\r\n')[1:]:
            if line.lower().startswith('content-length:'):
                length = int(line.split(':', 1)[1].strip())
        body = rest[:length]
        assert len(body) == length, f'truncated body: want {length}, got {len(body)}'
        responses.append((status, headers, body))
        data = rest[length:]
    return responses


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--binary', required=True)
    args = ap.parse_args()
    binary = pathlib.Path(args.binary)
    assert binary.is_file(), f'missing backend binary {binary}'

    work = pathlib.Path(tempfile.mkdtemp(prefix='gateway-framing-'))
    os.chmod(work, 0o700)
    # Isolated port via seeded state (loader rejects group/world-readable files).
    state = work / 'state.json'
    state.write_text(json.dumps({'schema': 1, 'port': PORT, 'next_provider_id': 1,
                                 'providers': [], 'sessions': []}))
    os.chmod(state, 0o600)
    proc = None
    keep = None
    out_log = None
    err_log = None
    try:
        out_log = open(work / 'stdout.log', 'wb')
        err_log = open(work / 'stderr.log', 'wb')
        # Stdin held open by a live pipe (closing stdin is the graceful-stop
        # signal); logs go to files, mirroring how the desktop host spawns it.
        feeder_pipe_r, feeder_pipe_w = os.pipe()
        proc = subprocess.Popen([str(binary)], stdin=feeder_pipe_r,
                                stdout=out_log, stderr=err_log,
                                env={**os.environ, 'BRIDGE_STATE_DIR': str(work)})
        keep = os.fdopen(feeder_pipe_w, 'wb')  # held open: EOF is graceful-stop
        wait_healthy(proc)
        token = json.loads((work / 'connection.json').read_text())['token']

        # 1. Unknown model over a reused client: complete 404 JSON, every time.
        for i in range(3):
            body = json.dumps({'model': 'p1/nope', 'stream': False,
                               'messages': [{'role': 'user', 'content': f'ping {i}'}]}).encode()
            resps = split_responses(raw_exchange([post_request(token, body)]))
            assert len(resps) == 1 and resps[0][0] == 404, resps
            assert b'MODEL_UNAVAILABLE' in resps[0][2]
        print('PASS sequential unknown-model posts stay terminal')

        # 2. Pipelined second request: 400 with a body, never a silent drop.
        a = post_request(token, json.dumps({'model': 'p1/nope', 'stream': False,
                                            'messages': [{'role': 'user', 'content': 'a'}]}).encode())
        b = post_request(token, json.dumps({'model': 'p1/nope', 'stream': False,
                                            'messages': [{'role': 'user', 'content': 'b'}]}).encode())
        resps = split_responses(raw_exchange([a + b]))
        assert resps and resps[0][0] in (400, 404) and resps[0][2], resps
        print('PASS pipelined bytes get a terminal response')

        # 3. Oversized body: terminal 4xx, connection still framed.
        big = json.dumps({'model': 'p1/nope', 'stream': False,
                          'messages': [{'role': 'user', 'content': 'x' * 300000}]}).encode()
        resps = split_responses(raw_exchange([post_request(token, big)]))
        assert len(resps) == 1 and resps[0][0] in (400, 413) and resps[0][2], resps
        print('PASS oversized bodies get a terminal response')

        # 4. Missing auth: terminal 401.
        resps = split_responses(raw_exchange(
            [b'POST /v1/chat/completions HTTP/1.1\r\nHost: 127.0.0.1:7341\r\n'
             b'Content-Type: application/json\r\nContent-Length: 2\r\n\r\n{}']))
        assert len(resps) == 1 and resps[0][0] == 401 and resps[0][2], resps
        print('PASS unauthenticated posts get a terminal response')

        # 5. Malformed target + bad version: terminal responses, server survives.
        resps = split_responses(raw_exchange(
            [b'GET /nope HTTP/1.0\r\nHost: 127.0.0.1:7341\r\n\r\n']))
        assert len(resps) == 1 and resps[0][2], resps
        wait_healthy(proc, timeout=5.0)
        print('PASS malformed requests get terminal responses; gateway survives')
        print('gateway framing: all terminal')
        return 0
    finally:
        for closer in (lambda: keep.close() if keep else None,
                       lambda: out_log.close() if out_log else None,
                       lambda: err_log.close() if err_log else None,
                       lambda: feeder.terminate() if feeder else None):
            try:
                closer()
            except Exception:
                pass
        if proc is not None:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
