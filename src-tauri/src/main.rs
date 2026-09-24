#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg(not(any(all(target_os = "linux", target_arch = "x86_64"), target_os = "macos", target_os = "windows")))]
compile_error!("This application targets Linux x86_64, macOS (arm64/x86_64), and Windows.");
mod fallback;
mod framing;
mod import;
mod mcp_transport;
mod host;
mod views;
mod platform;
use std::sync::{Arc, atomic::Ordering};
use serde_json::Value;
use tauri::{Manager, Webview, WebviewUrl};
use host::Host;

#[tauri::command]
async fn bridge_request(webview: Webview, host: tauri::State<'_, Arc<Host>>, op: String, params: Value) -> Result<Value, String> {
    views::trusted_main(&webview)?;
    // Internal-only frames cannot be forged through the otherwise trusted UI
    // proxy. Domain authorization and validation still reside in Zag.
    if matches!(op.as_str(), "observation" | "browser.failed" | "browser.location" | "mcp.transport" | "shutdown") { return Err("INTERNAL_OPERATION".into()); }
    // Fallback browsing mode serves website lifecycle locally while Zag is
    // unavailable. Anything requiring inference/MCP/sessions returns an
    // immediate explicit error instead of inventing capabilities or timing
    // out against a dead sidecar pipe.
    if host.is_fallback() {
        let app_handle = webview.app_handle().clone();
        let root = host.root.clone();
        let mut store = host.fallback_store.lock().await;
        let result = fallback::handle(&app_handle, &root, &mut store, &op, &params).await;
        match result {
            Ok(value) => return Ok(value),
            Err(e) if e == "FALLBACK_NOT_HANDLED" => return Err("FALLBACK_MODE".into()),
            Err(e) => return Err(e),
        }
    }
    host.request(op, params).await
}
#[tauri::command]
async fn browser_bounds(webview: Webview, host: tauri::State<'_, Arc<Host>>, bounds: views::Bounds) -> Result<(), String> {
    views::trusted_main(&webview)?; views::bounds(webview.app_handle(), host.inner(), bounds)
}
#[tauri::command]
async fn browser_control(webview: Webview, host: tauri::State<'_, Arc<Host>>, provider_id: u32, action: String) -> Result<(), String> {
    views::trusted_main(&webview)?;
    if !host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.contains_key(&provider_id) { return Err("UNKNOWN_VIEW".into()); }
    let view = webview.app_handle().get_webview(&format!("provider-{provider_id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
    match action.as_str() {
        "back" => view.eval("history.back()"), "forward" => view.eval("history.forward()"), "reload" => view.reload(),
        "zoom_in" | "zoom_out" | "zoom_reset" => {
            let zoom={let mut all=host.views.lock().map_err(|_|"HOST_LOCK_FAILED")?;let item=all.get_mut(&provider_id).ok_or("UNKNOWN_VIEW")?;
                item.zoom=if action=="zoom_reset"{1.0}else{(item.zoom+if action=="zoom_in"{0.1}else{-0.1}).clamp(0.5,2.0)};item.zoom};
            view.set_zoom(zoom)
        }
        "popup_once" | "download_once" => {
            let mut all=host.views.lock().map_err(|_|"HOST_LOCK_FAILED")?;let item=all.get_mut(&provider_id).ok_or("UNKNOWN_VIEW")?;
            let until=Some(std::time::Instant::now()+std::time::Duration::from_secs(60));
            if action=="popup_once"{item.popup_until=until;}else{item.download_until=until;} return Ok(());
        }
        "inspect" => {
            // In fallback browsing mode there is no Zag snapshot; developer
            // page inspection stays gated on real developer_mode only.
            let developer = if host.is_fallback() {
                false
            } else {
                let snapshot=host.request("state.get".into(),serde_json::json!({})).await?;
                snapshot["developer_mode"]==true
            };
            if !developer{return Err("DEVELOPER_MODE_REQUIRED".into());}
            if view.is_devtools_open(){view.close_devtools();}else{view.open_devtools();} return Ok(());
        }
        "external" => {
            let mut url=view.url().map_err(|_|"VIEW_URL_UNAVAILABLE")?;url.set_query(None);url.set_fragment(None);
            if !views::safe_provider_url(&url,host.dev_fixture) || ["oauth","callback","authorize","token"].iter().any(|part|url.path().to_ascii_lowercase().contains(part)){return Err("EXTERNAL_URL_DENIED".into());}
            #[cfg(target_os = "macos")]
            {
                let mut child = std::process::Command::new("/usr/bin/open").arg(url.as_str()).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).spawn().map_err(|_|"EXTERNAL_BROWSER_FAILED")?;
                std::thread::spawn(move || { let _ = child.wait(); });
                return Ok(());
            }
            #[cfg(target_os = "windows")]
            {
                let mut child = std::process::Command::new("cmd").args(["/C", "start", "", url.as_str()]).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).spawn().map_err(|_|"EXTERNAL_BROWSER_FAILED")?;
                std::thread::spawn(move || { let _ = child.wait(); });
                return Ok(());
            }
            #[cfg(target_os = "linux")]
            {
                let mut child = std::process::Command::new("/usr/bin/xdg-open").arg(url.as_str()).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).spawn().map_err(|_|"EXTERNAL_BROWSER_FAILED")?;
                std::thread::spawn(move || { let _ = child.wait(); });
                return Ok(());
            }
        }
        _ => return Err("BROWSER_ACTION_DENIED".into()),
    }.map_err(|_| "BROWSER_ACTION_FAILED".into())
}
#[tauri::command]
async fn backend_restart(webview: Webview, host: tauri::State<'_, Arc<Host>>) -> Result<(), String> {
    views::trusted_main(&webview)?; host.restart.notify_one(); Ok(())
}
#[tauri::command]
async fn host_status(webview: Webview, host: tauri::State<'_, Arc<Host>>) -> Result<Value, String> {
    views::trusted_main(&webview)?; host.status.lock().map(|state| state.clone()).map_err(|_| "HOST_LOCK_FAILED".into())
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![bridge_request, views::provider_observe, browser_bounds, browser_control, backend_restart, host_status, views::browser_find, platform::window_control, platform::document_export, platform::document_import, platform::directory_pick, platform::gateway_probe, import::browser_list_sources, import::browser_site_data, import::browser_import_cookies, import::browser_fill_login])
        .setup(|app| {
            let root = app.path().app_local_data_dir()?.join("state");
            views::private_directory(&root).map_err(std::io::Error::other)?;
            let dev_fixture = false;
            let (host, receiver) = Host::new(root, dev_fixture); app.manage(host.clone());
            tauri::WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .enable_clipboard_access().title("Codemax").decorations(false).inner_size(1500.0, 940.0).min_inner_size(1000.0, 680.0)
                .on_navigation(|url| (url.scheme() == "tauri" && url.host_str() == Some("localhost")) || (cfg!(debug_assertions) && url.scheme() == "http" && url.host_str() == Some("127.0.0.1") && url.port() == Some(1420)))
                .build()?;
            tauri::async_runtime::spawn(host::supervise(app.handle().clone(), host, receiver));
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" { return; }
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let host = window.state::<Arc<Host>>();
                if !host.closing.swap(true, Ordering::AcqRel) {
                    api.prevent_close(); host.restart.notify_one(); let app = window.app_handle().clone();
                    tauri::async_runtime::spawn(async move { tokio::time::sleep(std::time::Duration::from_millis(1100)).await; app.exit(0); });
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("Codemax host initialization failed");
}
