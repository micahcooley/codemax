"""Actual local file-I/O security test, NOT a replacement production backend.

The first request is copied verbatim from the recorded live Z.ai UI probe.
A test-only client exercises the native broker's one-file policy against real
OS files. It does not execute Zag or claim an end-to-end native app test.
Only synthetic files under tempfile.TemporaryDirectory are ever opened.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import secrets
import stat
import tempfile
import time
from dataclasses import dataclass

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'tests/evidence'
LIVE_REQUEST = '{"id":"bridge-read-probe","name":"read_file","arguments":{"path":"bridge-probe.txt"}}'
LIVE_RUN = 'd37e7b98-5d12-4bd7-bcbc-3d96e49d377b'

class Denied(Exception):
    pass

@dataclass
class Grant:
    job: str
    provider: str
    model: str
    expires: float
    allowed: bool = False
    consumed: bool = False

class TestClient:
    """Independent reference for adversarial OS fixtures, not production code."""
    def __init__(self, root: Path):
        self.root = root
        self.directory = os.open(root, os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC)
        self.secret = ('BRIDGE_PROBE_' + secrets.token_hex(32)).encode()
        fd = os.open('bridge-probe.txt', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=self.directory)
        try:
            with os.fdopen(fd, 'wb', closefd=False) as stream:
                stream.write(self.secret)
                stream.flush()
                os.fsync(fd)
        finally:
            os.close(fd)
        self.grant = Grant('test-' + secrets.token_hex(16), 'https://chat.z.ai', 'GLM-5.3-Flash', time.monotonic() + 300)
        self.reads = 0

    def authorize(self):
        self.grant.allowed = True

    def request(self, raw: str, *, job: str | None = None, provider: str | None = None, model: str | None = None) -> str:
        def unique_object(pairs):
            result = {}
            for key, value in pairs:
                if key in result:
                    raise Denied('duplicate JSON key')
                result[key] = value
            return result
        try:
            req = json.loads(raw, object_pairs_hook=unique_object)
        except (ValueError, TypeError):
            raise Denied('invalid JSON')
        grant = self.grant
        if not isinstance(req, dict) or set(req) != {'id', 'name', 'arguments'}:
            raise Denied('tool shape')
        if req['name'] != 'read_file' or req['arguments'] != {'path': 'bridge-probe.txt'}:
            raise Denied('tool scope')
        if not grant.allowed or grant.consumed or time.monotonic() >= grant.expires:
            raise Denied('no current one-read grant')
        if (job or grant.job, provider or grant.provider, model or grant.model) != (grant.job, grant.provider, grant.model):
            raise Denied('grant identity')
        grant.consumed = True
        grant.allowed = False
        fd = -1
        try:
            fd = os.open('bridge-probe.txt', os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK, dir_fd=self.directory)
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077 or info.st_uid != os.getuid() or info.st_nlink != 1 or info.st_size >= 128:
                raise Denied('file type, owner, permissions, link count or size')
            data = os.read(fd, 128)
            if data != self.secret:
                raise Denied('not the original synthetic canary')
            self.reads += 1
            return data.decode('ascii')
        except OSError as exc:
            raise Denied(f'OS refusal: {exc.errno}') from exc
        finally:
            if fd >= 0:
                os.close(fd)

    def close(self):
        os.close(self.directory)


def main():
    results = []
    value = None
    def record(name, fn):
        fn()
        results.append({'name': name, 'status': 'PASS'})
        print('PASS', name)
    def refused(client, raw=LIVE_REQUEST, **kwargs):
        try:
            client.request(raw, **kwargs)
        except Denied:
            return
        raise AssertionError('Request was not refused')
    with tempfile.TemporaryDirectory(prefix='bridge-permission-fixture-') as base:
        root = Path(base)
        os.chmod(root, 0o700)
        c = TestClient(root)
        try:
            record('live-model read_file request denied before consent', lambda: refused(c))
            assert c.reads == 0
            c.authorize()
            record('wrong test identity refused', lambda: refused(c, job='another-test'))
            record('wrong provider refused', lambda: refused(c, provider='https://other.test'))
            record('wrong model refused', lambda: refused(c, model='different-model'))
            for name, path in [('parent traversal', '../probe.txt'), ('absolute path', '/etc/passwd'), ('encoded traversal', '%2e%2e/probe.txt'), ('NUL path', 'bridge-probe.txt\0'), ('different filename', 'project.txt')]:
                raw = json.dumps({'id':'bad', 'name':'read_file', 'arguments':{'path':path}})
                record(name+' refused without opening path', lambda raw=raw: refused(c, raw))
            for name in ('write_file', 'shell', 'delete_file'):
                record(name+' refused', lambda name=name: refused(c,json.dumps({'id':'bad','name':name,'arguments':{'path':'bridge-probe.txt'}})))
            record('extra tool argument refused', lambda: refused(c,'{"id":"bad","name":"read_file","arguments":{"path":"bridge-probe.txt","command":"anything"}}'))
            record('duplicate argument key refused', lambda: refused(c,'{"id":"bad","name":"read_file","arguments":{"path":"other","path":"bridge-probe.txt"}}'))
            record('malformed request refused', lambda: refused(c,'{"name":'))
            value = c.request(LIVE_REQUEST)
            record('actual approved OS read matches fresh random file bytes', lambda: (_ for _ in ()).throw(AssertionError('canary mismatch')) if value.encode()!=c.secret or c.reads!=1 else None)
            record('replay denied after one read', lambda: refused(c))
            assert c.reads == 1 and not c.grant.allowed
        finally:
            c.close()
    assert not root.exists()
    record('synthetic fixture directory removed after test', lambda: None)

    for case in ['symlink','hardlink','FIFO','world-readable','oversized','changed-content','expired','revoked']:
        with tempfile.TemporaryDirectory(prefix='bridge-negative-fixture-') as base:
            root = Path(base); os.chmod(root,0o700); c=TestClient(root)
            try:
                c.authorize(); file=root/'bridge-probe.txt'
                if case in ['symlink','hardlink','FIFO']:
                    file.unlink()
                    if case=='FIFO':os.mkfifo(file,0o600)
                    else:
                        target=root/'synthetic-other.txt';target.write_bytes(c.secret);target.chmod(0o600)
                        if case=='symlink':file.symlink_to(target)
                        else:os.link(target,file)
                elif case=='world-readable':file.chmod(0o644)
                elif case=='oversized':file.write_bytes(b'x'*256)
                elif case=='changed-content':file.write_bytes(b'not-the-original-nonce')
                elif case=='expired':c.grant.expires=time.monotonic()-1
                elif case=='revoked':c.grant.allowed=False
                record(case+' denied, zero file reads returned', lambda: refused(c))
                assert c.reads==0
            finally:c.close()
    receipt = {
        'kind':'LIVE_WEBSITE_OUTPUT_MANUALLY_RELAYED_TO_LOCAL_PYTHON_TEST_CLIENT',
        'native_zag_executed':False, 'native_tauri_executed':False,
        'live_web_run_id':LIVE_RUN,'selected_model':'GLM-5.3-Flash','provider':'https://chat.z.ai/',
        'website_request':json.loads(LIVE_REQUEST),'actual_local_read':True,
        'permission':'explicit synthetic fixture grant; one read; no project/home/shell access',
        'file_result':value,'file_sha256':hashlib.sha256(value.encode()).hexdigest(),
        'fixture_deleted':True,'results':results,
        'limitation':'The reference client executes real OS operations, not Zag. The browser bridge and native app are not run end-to-end here.'
    }
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE/'file-permission-probe.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('SYNTHETIC_RESULT_FOR_WEBSITE',value)

if __name__=='__main__':main()
