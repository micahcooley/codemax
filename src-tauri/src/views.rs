use crate::host::Host;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{fs, path::{Path, PathBuf}, sync::{Arc, atomic::Ordering}, time::{Duration, Instant}};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Webview, WebviewUrl, webview::{NewWindowResponse, WebviewBuilder}};
use url::Url;

pub struct ProviderView { pub origin: String, pub profile: PathBuf, pub window_start: Instant, pub observations: u32 }

pub fn private_directory(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::{DirBuilderExt, MetadataExt, PermissionsExt};
    if let Ok(meta) = fs::symlink_metadata(path) {
        if meta.file_type().is_symlink() || !meta.is_dir() { return Err("UNSAFE_DATA_DIRECTORY".into()); }
    } else {
        fs::DirBuilder::new().recursive(true).mode(0o700).create(path).map_err(|_| "DIRECTORY_CREATE_FAILED")?;
    }
    let meta = fs::symlink_metadata(path).map_err(|_| "DIRECTORY_STAT_FAILED")?;
    // Compare the directory owner to the owner of a new application-controlled
    // private file, without assuming the UID or changing somebody else's mode.
    let marker = path.join(format!(".owner-check-{}", std::process::id()));
    use std::os::unix::fs::OpenOptionsExt;
    let file = fs::OpenOptions::new().write(true).create_new(true).mode(0o600).open(&marker).map_err(|_| "DIRECTORY_OWNER_CHECK_FAILED")?;
    let owner = file.metadata().map_err(|_| "DIRECTORY_OWNER_CHECK_FAILED")?.uid();
    drop(file); let _ = fs::remove_file(&marker);
    if meta.uid() != owner { return Err("DIRECTORY_OWNER_MISMATCH".into()); }
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| "DIRECTORY_MODE_FAILED")
}
fn safe_provider_url(url: &Url, dev: bool) -> bool {
    if !url.username().is_empty() || url.password().is_some() || url.host_str().is_none() { return false; }
    if url.scheme() == "https" {
        return !matches!(url.host_str(), Some("tauri.localhost" | "ipc.localhost" | "localhost" | "127.0.0.1" | "::1"));
    }
    dev && url.scheme() == "http" && url.host_str() == Some("127.0.0.1") && url.port() == Some(7340)
}
pub fn trusted_main(view: &Webview) -> Result<(), String> {
    if view.label() != "main" { return Err("TRUSTED_UI_REQUIRED".into()); }
    let url = view.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
    let trusted = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (cfg!(debug_assertions) && url.scheme() == "http" && url.host_str() == Some("127.0.0.1") && url.port() == Some(1420));
    if trusted { Ok(()) } else { Err("TRUSTED_UI_REQUIRED".into()) }
}
fn provider_id(value: &Value) -> Result<u32, String> {
    value["provider_id"].as_u64().filter(|id| *id > 0 && *id < 1_000_000).map(|id| id as u32).ok_or_else(|| "INVALID_PROVIDER_ID".into())
}
async fn open(app: &AppHandle, host: &Arc<Host>, id: u32, url: Url, origin: String) -> Result<(), String> {
    if !safe_provider_url(&url, host.dev_fixture) || url.origin().ascii_serialization() != origin { return Err("PROVIDER_URL_DENIED".into()); }
    let label = format!("provider-{id}");
    if let Some(view) = app.get_webview(&label) { view.eval("globalThis.__BRIDGE_RESCAN__?.()").map_err(|_| "RESCAN_FAILED")?; return Ok(()); }
    let profiles = host.root.join("profiles"); private_directory(&profiles)?;
    let profile = profiles.join(label.clone()); private_directory(&profile)?;
    {
        let mut views = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?;
        if views.len() >= 16 { return Err("WEBVIEW_LIMIT".into()); }
        views.insert(id, ProviderView { origin: origin.clone(), profile: profile.clone(), window_start: Instant::now(), observations: 0 });
    }
    let config = serde_json::to_string(&json!({"origin":origin})).map_err(|_| "CONFIG_ENCODE_FAILED")?;
    let script = format!("Object.defineProperty(globalThis,'__BRIDGE_BOOT__',{{value:Object.freeze({config})}});\n{}", include_str!("../../browser/agent.js"));
    let app_on_main = app.clone(); let app_for_events = app.clone(); let dev = host.dev_fixture;
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.run_on_main_thread(move || {
        let result = (|| -> Result<(), String> {
            let parent = app_on_main.get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
            let builder = WebviewBuilder::new(&label, WebviewUrl::External(url)).data_directory(profile)
                .initialization_script(&script).devtools(false).focused(false)
                .on_navigation(move |next| safe_provider_url(next, dev))
                .on_download(|_, _| false)
                .on_new_window(|_, _| NewWindowResponse::Deny)
                .on_page_load(move |view, _| {
                    // Do not emit OAuth codes, credentials or full navigation URLs.
                    let origin = view.url().ok().map(|url| url.origin().ascii_serialization());
                    let _ = app_for_events.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:browser", json!({"provider_id":id,"origin":origin}));
                });
            let view = parent.add_child(builder, LogicalPosition::new(80.0, 100.0), LogicalSize::new(1.0, 1.0)).map_err(|_| "WEBVIEW_CREATE_FAILED")?;
            view.hide().map_err(|_| "WEBVIEW_HIDE_FAILED")?;
            Ok(())
        })(); let _ = tx.send(result);
    }).map_err(|_| "MAIN_THREAD_UNAVAILABLE")?;
    let result = rx.await.map_err(|_| "WEBVIEW_CREATE_CANCELLED")?;
    if result.is_err() { if let Ok(mut views) = host.views.lock() { views.remove(&id); } }
    result
}
pub fn rescan_all(app: &AppHandle, host: &Arc<Host>) {
    let ids: Vec<u32> = host.views.lock().map(|views| views.keys().copied().collect()).unwrap_or_default();
    for id in ids { if let Some(view) = app.get_webview(&format!("provider-{id}")) { let _ = view.eval("globalThis.__BRIDGE_RESCAN__?.()"); } }
}
pub async fn host_action(app: &AppHandle, host: &Arc<Host>, value: &Value) -> Result<(), String> {
    let id = provider_id(value)?; let label = format!("provider-{id}");
    match value["name"].as_str().unwrap_or("") {
        "browser.open" => {
            let url = Url::parse(value["url"].as_str().ok_or("INVALID_PROVIDER_URL")?).map_err(|_| "INVALID_PROVIDER_URL")?;
            let origin = value["origin"].as_str().ok_or("INVALID_PROVIDER_ORIGIN")?.to_owned();
            open(app, host, id, url, origin).await
        }
        "browser.scan" => app.get_webview(&label).ok_or("PROVIDER_VIEW_CLOSED")?.eval("globalThis.__BRIDGE_RESCAN__?.()").map_err(|_| "RESCAN_FAILED".into()),
        "browser.close" | "browser.clear_profile" => {
            if let Some(view) = app.get_webview(&label) { view.close().map_err(|_| "WEBVIEW_CLOSE_FAILED")?; }
            let profile = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.remove(&id).map(|view| view.profile)
                .unwrap_or_else(|| host.root.join("profiles").join(&label));
            if value["name"] == "browser.clear_profile" && profile.exists() {
                // This path is constructed exclusively from a validated integer.
                let expected = host.root.join("profiles").join(label);
                if profile != expected || fs::symlink_metadata(&profile).map_err(|_| "PROFILE_STAT_FAILED")?.file_type().is_symlink() { return Err("PROFILE_PATH_DENIED".into()); }
                fs::remove_dir_all(profile).map_err(|_| "PROFILE_CLEAR_FAILED")?;
            }
            Ok(())
        }
        _ => Err("HOST_ACTION_DENIED".into()),
    }
}
pub fn execute(app: &AppHandle, host: &Arc<Host>, frame: &Value) -> Result<(), String> {
    let id = provider_id(frame)?; let action = frame.get("action").ok_or("ACTION_REQUIRED")?;
    if !matches!(action["type"].as_str(), Some("generate" | "stop" | "scan")) { return Err("ACTION_DENIED".into()); }
    let view = app.get_webview(&format!("provider-{id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
    let actual = view.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
    let origin = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.get(&id).ok_or("UNKNOWN_VIEW")?.origin.clone();
    if actual.origin().ascii_serialization() != origin { return Err("PROVIDER_ORIGIN_CHANGED".into()); }
    let encoded = serde_json::to_string(action).map_err(|_| "ACTION_ENCODE_FAILED")?;
    if encoded.len() > 900_000 { return Err("ACTION_SIZE_LIMIT".into()); }
    // The sole eval template takes JSON data, never executable provider text.
    view.eval(&format!("globalThis.__BRIDGE_EXECUTE__?.({encoded});")).map_err(|_| "ACTION_DISPATCH_FAILED".into())
}
#[derive(Deserialize)]
pub struct Bounds { pub provider_id: Option<u32>, pub x: f64, pub y: f64, pub width: f64, pub height: f64, pub visible: bool }
pub fn bounds(app: &AppHandle, host: &Arc<Host>, rect: Bounds) -> Result<(), String> {
    if ![rect.x, rect.y, rect.width, rect.height].iter().all(|n| n.is_finite()) { return Err("INVALID_BOUNDS".into()); }
    let parent = app.get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
    let scale = parent.scale_factor().map_err(|_| "WINDOW_SCALE_UNAVAILABLE")?;
    let size = parent.inner_size().map_err(|_| "WINDOW_SIZE_UNAVAILABLE")?.to_logical::<f64>(scale);
    let x = rect.x.clamp(64.0, (size.width - 1.0).max(64.0)); let y = rect.y.clamp(80.0, (size.height - 1.0).max(80.0));
    let width = rect.width.clamp(1.0, (size.width - x).max(1.0)); let height = rect.height.clamp(1.0, (size.height - y).max(1.0));
    let ids: Vec<u32> = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.keys().copied().collect();
    for id in ids {
        if let Some(view) = app.get_webview(&format!("provider-{id}")) {
            if rect.visible && rect.provider_id == Some(id) && width > 4.0 && height > 4.0 {
                view.set_position(LogicalPosition::new(x, y)).map_err(|_| "VIEW_POSITION_FAILED")?;
                view.set_size(LogicalSize::new(width, height)).map_err(|_| "VIEW_SIZE_FAILED")?;
                view.show().map_err(|_| "VIEW_SHOW_FAILED")?;
            } else { view.hide().map_err(|_| "VIEW_HIDE_FAILED")?; }
        }
    }
    Ok(())
}
#[tauri::command]
pub async fn provider_observe(webview: Webview, host: tauri::State<'_, Arc<Host>>, event: Value) -> Result<(), String> {
    let id = webview.label().strip_prefix("provider-").and_then(|id| id.parse::<u32>().ok()).ok_or("PROVIDER_VIEW_REQUIRED")?;
    if !host.ready.load(Ordering::Acquire) { return Err("BACKEND_UNAVAILABLE".into()); }
    let size = serde_json::to_vec(&event).map_err(|_| "INVALID_OBSERVATION")?.len();
    if size > 32768 || event["v"] != 1 || !event.is_object() { return Err("OBSERVATION_LIMIT".into()); }
    if !matches!(event["type"].as_str(), Some("observation" | "network" | "generation_delta" | "generation_done" | "generation_error" | "action_result" | "quota" | "login_required" | "interaction" | "instrumentation_warning")) { return Err("OBSERVATION_TYPE_DENIED".into()); }
    let url = webview.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
    {
        let mut views = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?;
        let view = views.get_mut(&id).ok_or("UNKNOWN_VIEW")?;
        if url.origin().ascii_serialization() != view.origin { return Err("PROVIDER_ORIGIN_CHANGED".into()); }
        if view.window_start.elapsed() >= Duration::from_secs(1) { view.observations = 0; view.window_start = Instant::now(); }
        view.observations += 1; if view.observations > 256 { return Err("OBSERVATION_RATE_LIMIT".into()); }
    }
    host.notify("observation", json!({"provider_id":id,"event":event}))
}
