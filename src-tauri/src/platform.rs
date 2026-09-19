//! Desktop-only adapters. Decisions and persisted preferences remain in Zag.
use crate::{host::Host, views};
use serde_json::{json, Value};
use std::{fs, io::Read, path::PathBuf, sync::Arc, time::{Duration, Instant}};
use tauri::{Manager, Webview};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

pub fn autostart(app: &tauri::AppHandle, enabled: bool) -> Result<(), String> {
    use std::os::unix::fs::OpenOptionsExt;
    use std::io::Write;
    let directory = app.path().config_dir().map_err(|_| "CONFIG_DIRECTORY_UNAVAILABLE")?.join("autostart");
    views::private_directory(&directory)?;
    let path = directory.join("com.sylorlabs.desktopaibridge.desktop");
    if let Ok(meta) = fs::symlink_metadata(&path) {
        if meta.file_type().is_symlink() || !meta.is_file() { return Err("AUTOSTART_PATH_DENIED".into()); }
    }
    if !enabled {
        if path.exists() { fs::remove_file(path).map_err(|_| "AUTOSTART_REMOVE_FAILED")?; }
        return Ok(());
    }
    let executable = if let Some(image) = std::env::var_os("APPIMAGE") {
        let image = PathBuf::from(image);
        if !image.is_absolute() || !image.is_file() { return Err("APPIMAGE_PATH_INVALID".into()); }
        image
    } else { std::env::current_exe().map_err(|_| "EXECUTABLE_PATH_UNAVAILABLE")? };
    let text = executable.to_str().ok_or("EXECUTABLE_PATH_ENCODING")?;
    if text.chars().any(char::is_control) { return Err("EXECUTABLE_PATH_DENIED".into()); }
    // Desktop Entry Exec quoting is not a shell command. Escape its field codes.
    let quoted = text.replace('\\', "\\\\\\\\").replace('"', "\\\"").replace('`', "\\`").replace('$', "\\$").replace('%', "%%");
    let contents = format!("[Desktop Entry]\nType=Application\nName=Desktop AI Bridge\nExec=\"{quoted}\"\nTerminal=false\nX-GNOME-Autostart-enabled=true\n");
    let temporary = path.with_extension(format!("desktop-{}-tmp", std::process::id()));
    let result = (|| -> Result<(), String> {
        let mut file = fs::OpenOptions::new().write(true).create_new(true).mode(0o600).open(&temporary).map_err(|_| "AUTOSTART_WRITE_FAILED")?;
        file.write_all(contents.as_bytes()).map_err(|_| "AUTOSTART_WRITE_FAILED")?;
        file.sync_all().map_err(|_| "AUTOSTART_SYNC_FAILED")?;
        fs::rename(&temporary, &path).map_err(|_| "AUTOSTART_RENAME_FAILED")?;
        Ok(())
    })();
    if result.is_err() { let _ = fs::remove_file(temporary); }
    result
}

#[tauri::command]
pub async fn window_control(webview: Webview, action: String) -> Result<Value, String> {
    views::trusted_main(&webview)?;
    let window = webview.app_handle().get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
    match action.as_str() {
        "minimize" => window.minimize(),
        "maximize" => {
            if window.is_maximized().map_err(|_| "WINDOW_STATE_FAILED")? { window.unmaximize() } else { window.maximize() }
        }
        "close" => window.close(),
        "drag" => window.start_dragging(),
        "state" => Ok(()),
        _ => return Err("WINDOW_ACTION_DENIED".into()),
    }.map_err(|_| "WINDOW_ACTION_FAILED")?;
    Ok(json!({"maximized":window.is_maximized().unwrap_or(false)}))
}

#[tauri::command]
pub async fn document_export(webview: Webview, name: String, content: String) -> Result<bool, String> {
    views::trusted_main(&webview)?;
    if content.len() > 1_048_576 || name.len() > 96 || !name.ends_with(".json") ||
        !name.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.'|b'-'|b'_')) {
        return Err("EXPORT_LIMIT".into());
    }
    let _: Value = serde_json::from_str(&content).map_err(|_| "EXPORT_REQUIRES_JSON")?;
    let Some(file) = rfd::AsyncFileDialog::new().set_title("Export from Desktop AI Bridge")
        .set_file_name(&name).add_filter("JSON", &["json"]).save_file().await else { return Ok(false); };
    file.write(content.as_bytes()).await.map_err(|_| "EXPORT_WRITE_FAILED")?;
    Ok(true)
}

#[tauri::command]
pub async fn document_import(webview: Webview) -> Result<Option<Value>, String> {
    views::trusted_main(&webview)?;
    let Some(file) = rfd::AsyncFileDialog::new().set_title("Import a connector")
        .add_filter("Connector JSON", &["json"]).pick_file().await else { return Ok(None); };
    let path: PathBuf = file.path().to_owned();
    // Bound the read itself, not only a metadata check that could race a writer.
    let bytes = tauri::async_runtime::spawn_blocking(move || {
        let file = fs::File::open(path).map_err(|_| "IMPORT_READ_FAILED")?;
        let mut bytes = Vec::new(); file.take(65_537).read_to_end(&mut bytes).map_err(|_| "IMPORT_READ_FAILED")?;
        if bytes.len() > 65_536 { return Err("IMPORT_SIZE_LIMIT"); } Ok(bytes)
    }).await.map_err(|_| "IMPORT_TASK_FAILED")??;
    let data: Value = serde_json::from_slice(&bytes).map_err(|_| "IMPORT_INVALID_JSON")?;
    Ok(Some(data)) // Zag performs connector schema/origin/action validation.
}

#[tauri::command]
pub async fn gateway_probe(webview: Webview, host: tauri::State<'_, Arc<Host>>) -> Result<Value, String> {
    views::trusted_main(&webview)?;
    let state = host.request("state.get".into(), json!({})).await?;
    let port = state["api"]["port"].as_u64().filter(|p| (1024..=65535).contains(p)).ok_or("INVALID_GATEWAY_PORT")? as u16;
    let started = Instant::now();
    let result = tokio::time::timeout(Duration::from_secs(4), async move {
        let mut stream = tokio::net::TcpStream::connect((std::net::Ipv4Addr::LOCALHOST, port)).await.map_err(|_| "GATEWAY_CONNECT_FAILED")?;
        let request = format!("GET /health HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n");
        stream.write_all(request.as_bytes()).await.map_err(|_| "GATEWAY_WRITE_FAILED")?;
        let mut bytes=Vec::new(); stream.take(8193).read_to_end(&mut bytes).await.map_err(|_| "GATEWAY_READ_FAILED")?;
        if bytes.len()>8192 { return Err("GATEWAY_RESPONSE_LIMIT"); }
        let response=String::from_utf8(bytes).map_err(|_| "GATEWAY_INVALID_RESPONSE")?;
        let (headers, body)=response.split_once("\r\n\r\n").ok_or("GATEWAY_INVALID_RESPONSE")?;
        if !headers.starts_with("HTTP/1.1 200 ") { return Err("GATEWAY_HEALTH_FAILED"); }
        let health:Value=serde_json::from_str(body).map_err(|_| "GATEWAY_INVALID_RESPONSE")?;
        if health["backend"]!="zag" || health["protocol"]!=1 { return Err("GATEWAY_PROTOCOL_MISMATCH"); }
        Ok(health)
    }).await.map_err(|_| "GATEWAY_TIMEOUT")?.map_err(str::to_owned)?;
    Ok(json!({"healthy":true,"round_trip_ms":started.elapsed().as_millis(),"health":result}))
}
