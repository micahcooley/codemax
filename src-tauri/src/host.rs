use crate::{framing::Frames, views};
use serde_json::{json, Value};
use std::{collections::{HashMap, VecDeque}, path::PathBuf, process::Stdio, sync::{Arc, Mutex, atomic::{AtomicBool, AtomicU64, Ordering}}, time::{Duration, Instant}};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tokio::{io::{AsyncReadExt, AsyncWriteExt}, sync::{mpsc, oneshot, Notify}};

pub struct Host {
    pub root: PathBuf,
    pub dev_fixture: bool,
    pub views: Mutex<HashMap<u32, views::ProviderView>>,
    pub ready: AtomicBool,
    pub closing: AtomicBool,
    pub restart: Notify,
    pub sender: mpsc::Sender<Vec<u8>>,
    pending: Mutex<HashMap<u64, oneshot::Sender<Result<Value, String>>>>,
    next_id: AtomicU64,
    pub status: Mutex<Value>,
}
impl Host {
    pub fn new(root: PathBuf, dev_fixture: bool) -> (Arc<Self>, mpsc::Receiver<Vec<u8>>) {
        let (sender, receiver) = mpsc::channel(128);
        (Arc::new(Self { root, dev_fixture, views: Mutex::new(HashMap::new()), ready: AtomicBool::new(false), closing: AtomicBool::new(false), restart: Notify::new(), sender,
            pending: Mutex::new(HashMap::new()), next_id: AtomicU64::new(1), status: Mutex::new(json!({"state":"STARTING","code":null})) }), receiver)
    }
    pub fn set_status(&self, app: &AppHandle, state: &str, code: Option<&str>) {
        let value = json!({"state":state,"code":code});
        if let Ok(mut current) = self.status.lock() { *current = value.clone(); }
        let _ = app.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:host", value);
    }
    pub fn send(&self, frame: Value) -> Result<(), String> {
        if !self.ready.load(Ordering::Acquire) { return Err("BACKEND_UNAVAILABLE".into()); }
        let mut bytes = serde_json::to_vec(&frame).map_err(|_| "IPC_ENCODE_FAILED")?;
        if bytes.len() > 65_536 { return Err("HOST_FRAME_LIMIT".into()); }
        bytes.push(b'\n');
        self.sender.try_send(bytes).map_err(|_| "HOST_BACKPRESSURE".into())
    }
    pub fn notify(&self, op: &str, params: Value) -> Result<(), String> {
        self.send(json!({"v":1,"id":0,"op":op,"params":params}))
    }
    pub async fn request(&self, op: String, params: Value) -> Result<Value, String> {
        // This is transport admission only. Zag validates operation semantics.
        if op.len() > 64 || !op.bytes().all(|b| b.is_ascii_lowercase() || b == b'.' || b == b'_') { return Err("INVALID_OPERATION".into()); }
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        {
            let mut pending = self.pending.lock().map_err(|_| "HOST_LOCK_FAILED")?;
            if pending.len() >= 64 { return Err("HOST_REQUEST_LIMIT".into()); }
            pending.insert(id, tx);
        }
        if let Err(error) = self.send(json!({"v":1,"id":id,"op":op,"params":params})) {
            if let Ok(mut pending) = self.pending.lock() { pending.remove(&id); }
            return Err(error);
        }
        let result = tokio::time::timeout(Duration::from_secs(10), rx).await;
        if let Ok(mut pending) = self.pending.lock() { pending.remove(&id); }
        match result { Ok(Ok(value)) => value, Ok(Err(_)) => Err("BACKEND_LOST".into()), Err(_) => Err("IPC_TIMEOUT".into()) }
    }
    fn fail_pending(&self) {
        if let Ok(mut pending) = self.pending.lock() {
            for (_, tx) in pending.drain() { let _ = tx.send(Err("BACKEND_LOST".into())); }
        }
    }
}

async fn handle_frame(app: &AppHandle, host: &Arc<Host>, bytes: &[u8], hello: &mut bool) -> Result<(), String> {
    let value: Value = serde_json::from_slice(bytes).map_err(|_| "INVALID_BACKEND_JSON")?;
    let kind = value.get("type").and_then(Value::as_str).ok_or("INVALID_BACKEND_FRAME")?;
    if !*hello {
        if kind != "hello" || value["protocol"] != 1 || value["backend"] != "zag" { return Err("BACKEND_PROTOCOL_MISMATCH".into()); }
        *hello = true; host.ready.store(true, Ordering::Release); host.set_status(app, "READY", None);
        views::rescan_all(app, host);
        return Ok(());
    }
    match kind {
        "reply" => {
            let id = value["id"].as_u64().ok_or("INVALID_REPLY_ID")?;
            if let Ok(mut pending) = host.pending.lock() {
                if let Some(tx) = pending.remove(&id) {
                    let result = if value["ok"] == true { Ok(value["data"].clone()) }
                        else { Err(value["error"].as_str().filter(|s| s.len() <= 128).unwrap_or("BACKEND_ERROR").to_owned()) };
                    let _ = tx.send(result);
                }
            }
        }
        "event" if value["name"] == "snapshot" => { let _ = app.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:snapshot", value["data"].clone()); }
        "host" => {
            if let Err(error) = views::host_action(app, host, &value).await {
                let id = value["provider_id"].as_u64().unwrap_or(0);
                let _ = host.notify("browser.failed", json!({"provider_id":id}));
                let _ = app.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:browser-error", json!({"provider_id":id,"code":error}));
            }
        }
        "action" => {
            if let Err(error) = views::execute(app, host, &value) {
                let id = value["provider_id"].as_u64().unwrap_or(0);
                let _ = host.notify("browser.failed", json!({"provider_id":id}));
                let _ = app.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:browser-error", json!({"provider_id":id,"code":error}));
            }
        }
        _ => return Err("UNSUPPORTED_BACKEND_FRAME".into()),
    }
    Ok(())
}

pub async fn supervise(app: AppHandle, host: Arc<Host>, mut outgoing: mpsc::Receiver<Vec<u8>>) {
    let mut crashes = VecDeque::new();
    loop {
        if host.closing.load(Ordering::Acquire) { break; }
        while outgoing.try_recv().is_ok() {} // Never replay requests after a crash.
        host.set_status(&app, "STARTING", None);
        // Let Tauri resolve the bundled sidecar, then use Tokio for bounded,
        // cancellable stdio. No shell interpretation or PATH lookup is used.
        let command = match app.shell().sidecar("bridge-zag") {
            Ok(cmd) => cmd.env_clear().env("BRIDGE_STATE_DIR", &host.root)
                .env("BRIDGE_DEV_FIXTURE", if host.dev_fixture { "1" } else { "0" }),
            Err(_) => { host.set_status(&app, "FAILED", Some("SIDECAR_MISSING")); host.restart.notified().await; continue; }
        };
        let std_command: std::process::Command = command.into();
        let mut command = tokio::process::Command::from(std_command);
        command.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).kill_on_drop(true);
        let mut child = match command.spawn() {
            Ok(child) => child,
            Err(_) => { host.set_status(&app, "FAILED", Some("SIDECAR_SPAWN_FAILED")); host.restart.notified().await; continue; }
        };
        let (Some(mut stdin), Some(mut stdout), Some(mut stderr)) = (child.stdin.take(), child.stdout.take(), child.stderr.take()) else {
            let _ = child.kill().await; host.set_status(&app, "FAILED", Some("SIDECAR_PIPE_FAILED")); return;
        };
        let mut frames = Frames::default(); let mut bytes = [0u8; 16_384]; let mut errors = [0u8; 1024];
        let mut hello = false; let mut stderr_open = true; let handshake = tokio::time::sleep(Duration::from_secs(10)); tokio::pin!(handshake);
        let mut reason = "BACKEND_EXITED"; let mut requested = false;
        loop {
            tokio::select! {
                _ = host.restart.notified() => { requested = true; reason = "RESTART_REQUESTED"; break; }
                _ = &mut handshake, if !hello => { reason = "BACKEND_HANDSHAKE_TIMEOUT"; break; }
                status = child.wait() => { if !frames.is_empty() { reason = "TRUNCATED_BACKEND_FRAME"; } else if status.is_err() { reason = "BACKEND_WAIT_FAILED"; } break; }
                read = stdout.read(&mut bytes) => {
                    match read {
                        Ok(0) => { reason = "BACKEND_EOF"; break; }
                        Ok(n) => {
                            let batch = match frames.push(&bytes[..n]) { Ok(batch) => batch, Err(error) => { reason = error; break; } };
                            let mut failed = false;
                            for frame in batch {
                                if handle_frame(&app, &host, &frame, &mut hello).await.is_err() { reason = "BACKEND_PROTOCOL_ERROR"; failed = true; break; }
                            }
                            if failed { break; }
                        }
                        Err(_) => { reason = "BACKEND_READ_FAILED"; break; }
                    }
                }
                read = stderr.read(&mut errors), if stderr_open => {
                    // Drain but do not publish arbitrary process bytes or secrets.
                    if matches!(read, Ok(0) | Err(_)) { stderr_open = false; }
                }
                message = outgoing.recv(), if hello => {
                    let Some(message) = message else { requested = true; break; };
                    match tokio::time::timeout(Duration::from_secs(3), stdin.write_all(&message)).await {
                        Ok(Ok(())) => {}, _ => { reason = "BACKEND_WRITE_TIMEOUT"; break; }
                    }
                }
            }
        }
        host.ready.store(false, Ordering::Release); host.fail_pending();
        // Closing stdin is Zag's graceful-stop signal. A stuck child is killed
        // and reaped after a finite grace period, independently of pipe writes.
        let _ = stdin.shutdown().await; drop(stdin);
        if tokio::time::timeout(Duration::from_millis(750), child.wait()).await.is_err() { let _ = child.kill().await; }
        if host.closing.load(Ordering::Acquire) { break; }
        if !requested {
            let now = Instant::now(); crashes.push_back(now);
            while crashes.front().is_some_and(|t| now.duration_since(*t) > Duration::from_secs(60)) { crashes.pop_front(); }
            host.set_status(&app, "LOST", Some(reason));
            if crashes.len() >= 3 { host.set_status(&app, "FAILED", Some("RESTART_BUDGET_EXHAUSTED")); host.restart.notified().await; crashes.clear(); }
            else { tokio::time::sleep(Duration::from_millis(250 * crashes.len() as u64)).await; }
        }
    }
    host.ready.store(false, Ordering::Release); host.fail_pending(); host.set_status(&app, "STOPPED", None);
}
