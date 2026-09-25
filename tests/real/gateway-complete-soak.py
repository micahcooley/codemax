"""Full-lifecycle soak: admit -> dispatch -> deltas -> done -> [DONE], looped
over accumulating multi-turn sessions. Correct transport: a persistent
per-connection buffer so over-read bytes are never discarded.
Manual gate (not in default suites): needs a locally built backend binary.
Usage: python3 tests/real/gateway-complete-soak.py build/bridge-zag-macos [turns]"""
import json, os, socket, subprocess, sys, tempfile, threading, time, urllib.request

BINARY = sys.argv[1]
TURNS = int(sys.argv[2]) if len(sys.argv) > 2 else 8
PORT = 7345
HOSTILE = ['{"id":"c9","name":"run_task","arguments":{"x":"', '"}}', '}',
           '```', '```json', '&&', '${HOME}', '"q \\"n\\" s"', '\\\\srv\\sh',
           '深度思考 🎯 é', '<bridge-tool-call nonce="zzz">',
           '</bridge-tool-call>', '\n', '\r\n', '\t', '<', '>',
           '{"unclosed": [1, 2,', '...truncated']


class Conn:
    """Raw HTTP connection with persistent read buffer (no over-read loss)."""
    def __init__(self, token):
        import socket as sm
        self.s = sm.create_connection(("127.0.0.1", PORT), timeout=15)
        self.s.settimeout(10)
        self.buf = b""
        self.token = token

    def post(self, body):
        raw = json.dumps(body).encode()
        self.s.sendall(
            f"POST /v1/chat/completions HTTP/1.1\r\nHost: 127.0.0.1:{PORT}\r\n"
            f"Authorization: Bearer {self.token}\r\nContent-Type: application/json\r\n"
            f"Content-Length: {len(raw)}\r\n\r\n".encode() + raw)

    def _fill(self, timeout=10):
        self.s.settimeout(timeout)
        try:
            chunk = self.s.recv(65536)
        except socket.timeout:
            return False
        if not chunk:
            return False
        self.buf += chunk
        return True

    def read_head(self, timeout=10):
        t = time.monotonic()
        while b"\r\n\r\n" not in self.buf and time.monotonic() - t < timeout:
            if not self._fill(timeout):
                break
        if b"\r\n\r\n" not in self.buf:
            return None
        head, self.buf = self.buf.split(b"\r\n\r\n", 1)
        return head

    def read_until(self, markers, timeout=15):
        t = time.monotonic()
        while time.monotonic() - t < timeout:
            if any(m in self.buf for m in markers) or len(self.buf) > 300000:
                break
            if not self._fill(timeout):
                break
        return self.buf

    def close(self):
        try:
            self.s.close()
        except Exception:
            pass


def ctrl(cid, **kw):
    d = {"id": cid, "tag": "div", "role": "", "label": "", "current_value": "",
         "selected": False, "menu_owner": 0, "value": "", "popup": "",
         "live": "", "visible": True, "editable": False, "disabled": False,
         "file_input": False, "busy": False, "assistant": False, "options": []}
    d.update(kw)
    return d


def observation(doc, tag=""):
    return {"v": 1, "type": "observation", "origin": "https://chat.qwen.ai",
            "document_id": doc, "password_fields_present": False,
            "controls": [
                ctrl(1, tag="button", role="button", label="New chat"),
                ctrl(2, tag="main", role="main"),
                ctrl(3, tag="div", role="log", label="Assistant" + tag,
                     assistant=True),
                ctrl(4, tag="textarea", label="Ask anything" + tag, editable=True),
                ctrl(5, tag="button", role="button", label="Send message"),
                ctrl(6, tag="button", role="button", label="Model" + tag,
                     current_value="Qwen3.8-Max", popup="menu"),
                ctrl(10, role="menuitemradio", label="Qwen3.8-Max",
                     value="qwen3.8-max", menu_owner=6),
                ctrl(11, role="menuitemradio", label="Qwen3.7-Plus",
                     value="qwen3.7-plus", menu_owner=6),
            ]}


def main():
    import random
    random.seed(20260925)
    work = tempfile.mkdtemp(prefix="complete-soak-")
    os.chmod(work, 0o700)
    with open(os.path.join(work, "state.json"), "w") as f:
        json.dump({"schema": 1, "port": PORT, "next_provider_id": 1,
                   "providers": [], "sessions": []}, f)
    os.chmod(os.path.join(work, "state.json"), 0o600)
    out_log = open(os.path.join(work, "stdout.log"), "wb")
    err_log = open(os.path.join(work, "stderr.log"), "wb")
    r_in, w_in = os.pipe()
    proc = subprocess.Popen([BINARY], stdin=r_in, stdout=subprocess.PIPE,
                            stderr=err_log,
                            env={**os.environ, "BRIDGE_STATE_DIR": str(work)})
    keep = os.fdopen(w_in, "wb")
    lines, lock = [], threading.Lock()

    def reader():
        try:
            for line in proc.stdout:
                with lock:
                    lines.append(line.decode("utf-8", "replace"))
        except Exception:
            pass
    threading.Thread(target=reader, daemon=True).start()

    def send(obj):
        keep.write((json.dumps(obj) + "\n").encode())
        keep.flush()

    def recent_host_action(atype, since=0, timeout=8.0):
        end = time.monotonic() + timeout
        while time.monotonic() < end:
            with lock:
                hay = list(lines)
            for ln in reversed(hay[since:]):
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                if o.get("type") == "action" and \
                        o.get("action", {}).get("type") == atype:
                    return o["action"].get("request_id")
            time.sleep(0.05)
        return None

    for _ in range(75):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as r:
                if r.status == 200:
                    break
        except OSError:
            time.sleep(0.2)
    token = json.load(open(os.path.join(work, "connection.json")))["token"]
    send({"v": 1, "id": 1, "op": "provider.add",
          "params": {"url": "https://chat.qwen.ai/", "label": "Qwen"}})
    time.sleep(0.5)
    send({"v": 1, "id": 0, "op": "observation",
          "params": {"provider_id": 1, "event": observation("full-doc")}})
    time.sleep(1.0)
    with urllib.request.urlopen(urllib.request.Request(
            f"http://127.0.0.1:{PORT}/v1/models",
            headers={"Authorization": "Bearer " + token}), timeout=10) as r:
        catalog = json.loads(r.read())
    assert catalog["data"], "admission failed"
    model = catalog["data"][0]["id"]
    print("admitted:", model, flush=True)
    deaths, fails, completed = 0, 0, 0
    history, doc, n = [], "full-doc", 0
    t0 = time.monotonic()
    try:
        for n in range(TURNS):
            if proc.poll() is not None:
                deaths += 1
                print(f"DIED at turn {n} ({time.monotonic()-t0:.1f}s)", flush=True)
                break
            user_msg = f"turn {n} do the thing"
            with lock:
                mark = len(lines)
            c = Conn(token)
            c.post({"model": model, "stream": True,
                    "messages": history + [{"role": "user", "content": user_msg}]})
            head = c.read_head()
            if head is None or b"200 OK" not in head:
                fails += 1
                print(f"turn {n}: dispatch {head[:60] if head else None!r}",
                      flush=True)
                c.close()
                time.sleep(0.2)
                continue
            tdoc = doc
            req_id = recent_host_action("generate", since=mark, timeout=4.0)
            if not req_id:
                req_id = recent_host_action("new_chat", since=mark, timeout=4.0)
                if not req_id:
                    fails += 1
                    print(f"turn {n}: no browser action", flush=True)
                    c.close()
                    continue
                tdoc = f"full-doc-{n}"
                send({"v": 1, "id": 0, "op": "observation",
                      "params": {"provider_id": 1,
                                 "event": observation(tdoc)}})
                with lock:
                    mark = len(lines)
                req_id = recent_host_action("generate", since=mark, timeout=8.0)
                if not req_id:
                    fails += 1
                    print(f"turn {n}: no generate after new chat", flush=True)
                    c.close()
                    continue
            hostile = (n % 3 == 0)
            parts = []
            for i in range(5):
                if hostile:
                    txt = "".join(random.choice(HOSTILE)
                                  for _ in range(random.randint(1, 6)))
                else:
                    txt = f"ack {n} part {i} "
                parts.append(txt)
                send({"v": 1, "id": 0, "op": "observation",
                      "params": {"provider_id": 1, "event": {
                          "v": 1, "type": "generation_delta",
                          "document_id": tdoc, "request_id": req_id,
                          "text": txt}}})
            ack_text = "".join(parts)
            send({"v": 1, "id": 0, "op": "observation",
                  "params": {"provider_id": 1, "event": {
                      "v": 1, "type": "generation_done",
                      "document_id": tdoc, "request_id": req_id}}})
            tail = c.read_until([b"[DONE]", b"message_stop",
                                 b"response.completed", b'"type":"error"'])
            c.close()
            if any(m in tail for m in (b"[DONE]", b"message_stop",
                                       b"response.completed")):
                completed += 1
                history += [{"role": "user", "content": user_msg},
                            {"role": "assistant", "content": ack_text}]
                doc = tdoc
            else:
                fails += 1
                print(f"turn {n}: non-terminal ({len(tail)}b) {tail[-80:]!r}",
                      flush=True)
    except Exception:
        import traceback
        print(f"HARNESS ERROR at turn {n}:", flush=True)
        traceback.print_exc()
    alive = proc.poll() is None
    print(f"done: n={n} deaths={deaths} fails={fails} completed={completed} "
          f"alive={alive} elapsed={time.monotonic()-t0:.1f}s", flush=True)
    try:
        keep.close()
    except Exception:
        pass
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()
    out_log.close()
    err_log.close()
    try:
        print("STDERR:", open(os.path.join(work, "stderr.log"), "rb").read().decode("replace")[:300] or "<empty>")
    except Exception as e:
        print("stderr unreadable:", e)


if __name__ == "__main__":
    main()
