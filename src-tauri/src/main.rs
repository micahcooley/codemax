#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg(not(all(target_os = "linux", target_arch = "x86_64")))]
compile_error!("This source alpha targets Linux x86_64 only. Other native backends are not qualified.");
mod framing;
mod host;
mod views;
use std::sync::{Arc, atomic::Ordering};
use serde_json::{json, Value};
use tauri::{Manager, Webview, WebviewUrl};
use host::Host;

#[tauri::command]
async fn bridge_request(webview: Webview, host: tauri::State<'_, Arc<Host>>, op: String, params: Value) -> Result<Value, String> {
    views::trusted_main(&webview)?;
    // Internal-only frames cannot be forged through the otherwise trusted UI
    // proxy. Domain authorization and validation still reside in Zag.
    if matches!(op.as_str(), "observation" | "browser.failed" | "shutdown") { return Err("INTERNAL_OPERATION".into()); }
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
        "back" => view.eval("history.back()"), "forward" => view.eval("history.forward()"), "reload" => view.eval("location.reload()"),
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
        .invoke_handler(tauri::generate_handler![bridge_request, views::provider_observe, browser_bounds, browser_control, backend_restart, host_status])
        .setup(|app| {
            let root = app.path().app_local_data_dir()?.join("state");
            views::private_directory(&root).map_err(std::io::Error::other)?;
            let dev_fixture = cfg!(debug_assertions) && std::env::var("BRIDGE_DEV_FIXTURE").as_deref() == Ok("1");
            let (host, receiver) = Host::new(root, dev_fixture); app.manage(host.clone());
            tauri::WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .enable_clipboard_access().title("Desktop AI Bridge").inner_size(1440.0, 920.0).min_inner_size(980.0, 680.0)
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
        .expect("Desktop AI Bridge host initialization failed");
}
