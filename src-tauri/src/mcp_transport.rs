//! Transport only. Zag supplies user-confirmed executable/argv, owns MCP
//! negotiation/catalog/permissions, and decides when a tool call is allowed.
//! Remote provider webviews have no command exposing this module.
use std::{process::Stdio, sync::{Arc, atomic::Ordering}, time::{Duration, Instant}};
use serde_json::{json, Value};
use tokio::{io::{AsyncReadExt, AsyncWriteExt}, sync::mpsc};
use crate::host::Host;

pub enum Control { Write(Vec<u8>) }
pub struct ProcessHandle { pub epoch: String, pub sender: mpsc::Sender<Control>, pub stop: Arc<tokio::sync::Notify> }

// Own one process group. Even if the async task is dropped or a wrapper exits
// while leaving descendants, Drop terminates the group. Not an OS sandbox:
// a malicious trusted executable can escape its group or use the user's files.
struct Group(i32);
impl Drop for Group {
    fn drop(&mut self) {
        extern "C" { fn kill(pid: i32, signal: i32) -> i32; }
        if self.0 > 0 { unsafe { let _ = kill(-self.0, 9); } }
    }
}
fn notify(host: &Host, id: u32, epoch: &str, event: &str, line: Option<&str>) -> Result<(), String> {
    let mut value = json!({"server_id":id,"epoch":epoch,"event":event});
    if let Some(line) = line { value["line"] = Value::String(line.to_owned()); }
    host.notify("mcp.transport", value)
}
pub fn stop_all(host: &Host) {
    if let Ok(mut processes) = host.mcp.lock() {
        for (_, process) in processes.drain() { process.stop.notify_one(); }
        // Dropping the last sender also terminates a blocked/full-queue actor.
    }
}
pub fn handle(host: &Arc<Host>, frame: &Value) -> Result<(), String> {
    let id = frame["server_id"].as_u64().filter(|id| *id > 0 && *id < 100_000).ok_or("MCP_INVALID_ID")? as u32;
    let epoch = frame["epoch"].as_str().filter(|e| (20..128).contains(&e.len()) && e.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')).ok_or("MCP_INVALID_EPOCH")?.to_owned();
    match frame["action"].as_str() {
        Some("start") => {
            let mut program = frame["command"].as_str().filter(|s| !s.is_empty() && s.len() < 2048 && !s.chars().any(char::is_control)).ok_or("MCP_INVALID_EXECUTABLE")?.to_owned();
            // A fixed built-in identifier resolves only to the installed sibling.
            // Neither the webpage nor the frontend can supply a substitute path.
            if program == "builtin:local-tools" {
                use std::os::unix::fs::MetadataExt;
                let exe = std::env::current_exe().map_err(|_| "MCP_INSTALL_LOCATION_UNKNOWN")?;
                let path = exe.parent().ok_or("MCP_INSTALL_LOCATION_UNKNOWN")?.join("codemax-local-tools");
                let meta = std::fs::symlink_metadata(&path).map_err(|_| "BUILTIN_TOOLS_NOT_INSTALLED")?;
                if !meta.is_file() || meta.file_type().is_symlink() || meta.mode() & 0o6022 != 0 { return Err("BUILTIN_TOOLS_UNSAFE_FILE".into()); }
                program = path.to_str().ok_or("MCP_INSTALL_PATH_INVALID")?.to_owned();
            }
            let raw = frame["args"].as_array().filter(|a| a.len() <= 32).ok_or("MCP_INVALID_ARGV")?;
            let args: Vec<String> = raw.iter().map(|v| v.as_str().filter(|s| !s.contains('\0') && s.len() <= 4000).map(str::to_owned).ok_or("MCP_INVALID_ARGUMENT")).collect::<Result<_, _>>()?;
            if args.iter().map(String::len).sum::<usize>() > 4096 { return Err("MCP_ARGV_LIMIT".into()); }
            let (sender, receiver) = mpsc::channel(16);
            let stop = Arc::new(tokio::sync::Notify::new());
            {
                let mut processes = host.mcp.lock().map_err(|_| "MCP_LOCK_FAILED")?;
                if processes.contains_key(&id) || processes.len() >= 8 { return Err("MCP_PROCESS_LIMIT".into()); }
                processes.insert(id, ProcessHandle { epoch: epoch.clone(), sender, stop: stop.clone() });
            }
            let host = host.clone();
            tauri::async_runtime::spawn(async move {
                let result = run(host.clone(), id, &epoch, &program, &args, receiver, stop).await;
                let _ = notify(&host, id, &epoch, if result.is_ok() { "closed" } else { "error" }, None);
                if let Ok(mut processes) = host.mcp.lock() {
                    if processes.get(&id).is_some_and(|p| p.epoch == epoch) { processes.remove(&id); }
                };
            });
        }
        Some("write") => {
            let line = frame["line"].as_str().filter(|s| s.len() <= 131_072 && !s.contains('\n') && !s.contains('\r')).ok_or("MCP_INVALID_FRAME")?;
            let processes = host.mcp.lock().map_err(|_| "MCP_LOCK_FAILED")?;
            let process = processes.get(&id).filter(|p| p.epoch == epoch).ok_or("MCP_STALE_PROCESS")?;
            let mut bytes = line.as_bytes().to_vec(); bytes.push(b'\n');
            process.sender.try_send(Control::Write(bytes)).map_err(|_| "MCP_BACKPRESSURE")?;
        }
        Some("stop") => {
            let mut processes = host.mcp.lock().map_err(|_| "MCP_LOCK_FAILED")?;
            if processes.get(&id).is_some_and(|p| p.epoch == epoch) {
                if let Some(process) = processes.remove(&id) { process.stop.notify_one(); }
            }
        }
        _ => return Err("MCP_UNKNOWN_TRANSPORT_ACTION".into()),
    }
    Ok(())
}
async fn run(host: Arc<Host>, id: u32, epoch: &str, program: &str, args: &[String], mut control: mpsc::Receiver<Control>, stop: Arc<tokio::sync::Notify>) -> Result<(), String> {
    use std::os::unix::process::CommandExt;
    let cwd = host.root.join("mcp-processes");
    std::fs::create_dir_all(&cwd).map_err(|_| "MCP_WORK_DIRECTORY_FAILED")?;
    let mut command = tokio::process::Command::new(program);
    command.args(args).current_dir(cwd).env_clear().stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).kill_on_drop(true);
    // Runtime locations only. Do not automatically pass provider tokens or
    // arbitrary parent environment secrets to third-party code.
    for name in ["PATH", "HOME", "TMPDIR", "LANG", "XDG_CONFIG_HOME", "XDG_CACHE_HOME", "XDG_RUNTIME_DIR"] {
        if let Some(value) = std::env::var_os(name) { command.env(name, value); }
    }
    command.as_std_mut().process_group(0);
    let mut child = command.spawn().map_err(|_| "MCP_SPAWN_FAILED")?;
    let _group = Group(child.id().ok_or("MCP_CHILD_ID_MISSING")? as i32);
    let (Some(mut stdin), Some(mut stdout), Some(mut stderr)) = (child.stdin.take(), child.stdout.take(), child.stderr.take()) else { let _ = child.kill().await; return Err("MCP_PIPE_FAILED".into()); };
    let mut line = Vec::with_capacity(131_072); let mut buffer = [0u8; 8192]; let mut errors = [0u8; 4096];
    let mut error_open = true; let mut tick = Instant::now(); let mut window_bytes = 0usize;
    notify(&host, id, epoch, "connected", None)?;
    let outcome = loop {
        if host.closing.load(Ordering::Acquire) { break Ok(()); }
        tokio::select! {
            _ = stop.notified() => break Ok(()),
            item = control.recv() => match item {
                Some(Control::Write(bytes)) => if !matches!(tokio::time::timeout(Duration::from_secs(3), stdin.write_all(&bytes)).await, Ok(Ok(()))) { break Err("MCP_WRITE_FAILED".into()); },
                None => break Ok(()),
            },
            read = stdout.read(&mut buffer) => match read {
                Ok(0) => break if line.is_empty() { Ok(()) } else { Err("MCP_TRUNCATED_FRAME".into()) },
                Ok(n) => {
                    if tick.elapsed() >= Duration::from_secs(1) { tick = Instant::now(); window_bytes = 0; }
                    window_bytes += n;
                    if window_bytes > 1_048_576 { break Err("MCP_OUTPUT_RATE_LIMIT".into()); }
                    let mut error = None;
                    for byte in &buffer[..n] {
                        if *byte == b'\n' {
                            if line.last() == Some(&b'\r') { line.pop(); }
                            match std::str::from_utf8(&line) {
                                Ok(text) if !text.is_empty() => if notify(&host, id, epoch, "line", Some(text)).is_err() { error = Some("MCP_HOST_BACKPRESSURE"); break; },
                                _ => { error = Some("MCP_INVALID_UTF8_OR_EMPTY_FRAME"); break; }
                            }
                            line.clear();
                        } else {
                            if line.len() >= 131_072 { error = Some("MCP_FRAME_LIMIT"); break; }
                            line.push(*byte);
                        }
                    }
                    if let Some(error) = error { break Err(error.into()); }
                }
                Err(_) => break Err("MCP_READ_FAILED".into()),
            },
            read = stderr.read(&mut errors), if error_open => {
                // Discard untrusted diagnostics instead of exposing tokens.
                match read { Ok(0) | Err(_) => error_open = false, Ok(n) => {
                    if tick.elapsed() >= Duration::from_secs(1) { tick = Instant::now(); window_bytes = 0; }
                    window_bytes += n; if window_bytes > 1_048_576 { break Err("MCP_OUTPUT_RATE_LIMIT".into()); }
                }}
            },
            status = child.wait() => break if status.is_ok() && line.is_empty() { Ok(()) } else { Err("MCP_CHILD_EXITED".into()) },
        }
    };
    let _ = stdin.shutdown().await; drop(stdin);
    if tokio::time::timeout(Duration::from_millis(300), child.wait()).await.is_err() { let _ = child.kill().await; }
    outcome
}
