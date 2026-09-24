use crate::host::Host;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{fs, path::{Path, PathBuf}, sync::{Arc, atomic::Ordering}, time::{Duration, Instant}};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Webview, WebviewUrl, webview::{DownloadEvent, NewWindowResponse, WebviewBuilder}};
use url::Url;

pub struct ProviderView { pub origin: String, pub profile: PathBuf, pub window_start: Instant, pub observations: u32, pub popup_until: Option<Instant>, pub download_until: Option<Instant>, pub last_url: String, pub zoom: f64, pub placed: Option<[i64; 4]>, pub shown: bool }

/// Desktop browser user agent so AI chat sites do not reject the embedded
/// WebKit view as an unknown bot. The UA always matches the underlying
/// engine: WKWebView on macOS advertises Safari, WebKitGTK elsewhere keeps
/// the Chrome token. A Chrome UA on top of WKWebView trips consistency
/// checks (notably Google's "browser is not secure" page on sign-in),
/// while a genuine engine-consistent desktop UA is accepted.
/// The origin isolation and observation model are unchanged; only the
/// advertised UA string changes.
///
/// The Safari version is read from the installed Safari bundle at runtime so
/// the string never goes stale: providers (especially Google) treat an
/// outdated browser version as a "less secure browser" signal regardless of
/// engine. A fixed recent fallback covers systems without a readable bundle.
pub fn provider_user_agent() -> String {
    if cfg!(target_os = "macos") {
        if let Some(version) = safari_bundle_version() {
            return format!("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Safari/605.1.15");
        }
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Safari/605.1.15".to_owned();
    }
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36".to_owned()
}

/// Best-effort Safari marketing version (e.g. "26.6.2"), read once per
/// process from the system Safari bundle. Returns None when unreadable so
/// callers fall back to a fixed recent string.
fn safari_bundle_version() -> Option<String> {
    static CACHED: std::sync::OnceLock<Option<String>> = std::sync::OnceLock::new();
    CACHED.get_or_init(|| {
        let bytes = std::fs::read("/Applications/Safari.app/Contents/Info.plist").ok()?;
        let text = String::from_utf8_lossy(&bytes);
        let marker = "<key>CFBundleShortVersionString</key>";
        let start = text.find(marker)? + marker.len();
        let string_open = text[start..].find("<string>")? + "<string>".len();
        let absolute = start + string_open;
        let end = text[absolute..].find("</string>")?;
        let version: String = text[absolute..absolute + end].trim().to_owned();
        if version.is_empty() || version.len() > 24 || !version.bytes().next().map(|b| b.is_ascii_digit()).unwrap_or(false) {
            return None;
        }
        Some(version)
    }).clone()
}

pub fn private_directory_path(app: &AppHandle) -> Result<PathBuf, String> {
    // Clone the root while the State guard lives, then drop it before IO.
    let root: PathBuf = {
        let host = app.state::<Arc<Host>>();
        host.root.clone()
    };
    let profiles = root.join("profiles");
    private_directory(&profiles)?;
    Ok(profiles)
}

pub fn insert_view(app: &AppHandle, id: u32, view: ProviderView) -> Result<(), String> {
    let host = app.state::<Arc<Host>>();
    let mut views = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?;
    if views.len() >= 16 {
        return Err("WEBVIEW_LIMIT".into());
    }
    views.insert(id, view);
    Ok(())
}

pub fn remove_view(app: &AppHandle, id: u32) {
    if let Some(host) = app.try_state::<Arc<Host>>() {
        if let Ok(mut views) = host.views.lock() {
            views.remove(&id);
        }
    }
}

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
    fs::set_permissions(path, fs::Permissions::from_mode(0o700)).map_err(|_| "DIRECTORY_MODE_FAILED".to_owned())
}
pub fn safe_provider_url(url: &Url, _dev: bool) -> bool {
    if !url.username().is_empty() || url.password().is_some() || url.host_str().is_none() { return false; }
    if url.scheme() == "https" {
        return !matches!(url.host_str(), Some("tauri.localhost" | "ipc.localhost" | "localhost" | "127.0.0.1" | "::1"));
    }
    false
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
        views.insert(id, ProviderView { origin: origin.clone(), profile: profile.clone(), window_start: Instant::now(), observations: 0, popup_until: None, download_until: None, last_url: String::new(), zoom: 1.0, placed: None, shown: false });
    }
    let config = serde_json::to_string(&json!({"origin":origin})).map_err(|_| "CONFIG_ENCODE_FAILED")?;
    let script = format!("Object.defineProperty(globalThis,'__BRIDGE_BOOT__',{{value:Object.freeze({config})}});\n{}\n{}", include_str!("../../browser/semantics.js"), include_str!("../../browser/agent.js"));
    let app_on_main = app.clone(); let app_for_events = app.clone(); let dev = host.dev_fixture;
    let host_events=host.clone(); let host_popup=host.clone(); let host_download=host.clone(); let popup_app=app.clone(); let download_app=app.clone();
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.run_on_main_thread(move || {
        let result = (|| -> Result<(), String> {
            let parent = app_on_main.get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
            let builder = WebviewBuilder::new(&label, WebviewUrl::External(url)).data_directory(profile)
                .initialization_script(&script).user_agent(&provider_user_agent()).devtools(true).focused(false)
                .on_navigation(move |next| safe_provider_url(next, dev))
                .on_download(move |_, event| {
                    match event {
                        DownloadEvent::Requested { url, destination } => {
                            let allowed=host_download.views.lock().ok().and_then(|mut all| all.get_mut(&id).and_then(|v| v.download_until.take())).is_some_and(|until| Instant::now()<until);
                            if !allowed || !safe_provider_url(&url, dev) {
                                let _=download_app.emit_to(tauri::EventTarget::Webview{label:"main".into()},"bridge:browser-error",json!({"provider_id":id,"code":"DOWNLOAD_PERMISSION_REQUIRED"})); return false;
                            }
                            let Ok(directory)=download_app.path().download_dir() else {return false;};
                            let name=destination.file_name().and_then(|n|n.to_str()).unwrap_or("download");
                            let clean:String=name.chars().filter(|c|c.is_ascii_alphanumeric()||matches!(*c,'.'|'-'|'_')).take(120).collect();
                            let nonce=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d|d.as_millis()).unwrap_or(0);
                            *destination=directory.join(format!("bridge-{nonce}-{}", if clean.is_empty(){"download"}else{&clean}));
                            if destination.exists() { return false; }
                            true
                        }
                        DownloadEvent::Finished {success,..} => {
                            let _=download_app.emit_to(tauri::EventTarget::Webview{label:"main".into()},"bridge:notice",json!({"message":if success {"Download saved to your Downloads folder."}else{"Download failed."}})); true
                        }
                        _ => false,
                    }
                })
                .on_new_window(move |url, _| {
                    let allowed=host_popup.views.lock().ok().and_then(|mut all|all.get_mut(&id).and_then(|v|v.popup_until.take())).is_some_and(|until|Instant::now()<until);
                    if allowed && safe_provider_url(&url,dev) { NewWindowResponse::Allow }
                    else {
                        let _=popup_app.emit_to(tauri::EventTarget::Webview{label:"main".into()},"bridge:browser-error",json!({"provider_id":id,"code":"POPUP_PERMISSION_REQUIRED"}));
                        NewWindowResponse::Deny
                    }
                })
                .on_page_load(move |view, payload| {
                    // Do not emit OAuth codes, credentials or full navigation URLs.
                    report_location(&view, &host_events, id);
                    let origin = view.url().ok().map(|url| url.origin().ascii_serialization());
                    let _ = app_for_events.emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:browser", json!({"provider_id":id,"origin":origin,"loading":matches!(payload.event(),tauri::webview::PageLoadEvent::Started)}));
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
    if value["name"] == "platform.settings" { return crate::platform::autostart(app,value["auto_start"].as_bool().ok_or("INVALID_AUTOSTART_STATE")?); }
    let id = provider_id(value)?; let label = format!("provider-{id}");
    match value["name"].as_str().unwrap_or("") {
        "browser.open" | "browser.navigate" => {
            let url = Url::parse(value["url"].as_str().ok_or("INVALID_PROVIDER_URL")?).map_err(|_| "INVALID_PROVIDER_URL")?;
            let origin = value["origin"].as_str().ok_or("INVALID_PROVIDER_ORIGIN")?.to_owned();
            if value["name"] == "browser.navigate" {
                if !safe_provider_url(&url,host.dev_fixture) || url.origin().ascii_serialization()!=origin {return Err("PROVIDER_URL_DENIED".into());}
                if let Some(view)=app.get_webview(&label) { view.navigate(url).map_err(|_|"NAVIGATION_FAILED")?;return Ok(()); }
            }
            open(app, host, id, url, origin).await
        }
        "browser.scan" => app.get_webview(&label).ok_or("PROVIDER_VIEW_CLOSED")?.eval("globalThis.__BRIDGE_RESCAN__?.()").map_err(|_| "RESCAN_FAILED".into()),
        "browser.close" | "browser.clear_profile" => {
            if let Some(view) = app.get_webview(&label) { if value["name"] == "browser.clear_profile" { view.clear_all_browsing_data().map_err(|_| "PROFILE_CLEAR_FAILED")?; } view.close().map_err(|_| "WEBVIEW_CLOSE_FAILED")?; }
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
    if !matches!(action["type"].as_str(), Some("discovery_policy" | "generate" | "stop" | "scan" | "pick" | "new_chat" | "inspect_menu")) { return Err("ACTION_DENIED".into()); }
    let view = app.get_webview(&format!("provider-{id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
    let actual = view.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
    let origin = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.get(&id).ok_or("UNKNOWN_VIEW")?.origin.clone();
    if actual.origin().ascii_serialization() != origin { return Err("PROVIDER_ORIGIN_CHANGED".into()); }
    let encoded = serde_json::to_string(action).map_err(|_| "ACTION_ENCODE_FAILED")?;
    if encoded.len() > 900_000 { return Err("ACTION_SIZE_LIMIT".into()); }
    // The sole eval template takes JSON data, never executable provider text.
    view.eval(format!("globalThis.__BRIDGE_EXECUTE__?.({encoded});")).map_err(|_| "ACTION_DISPATCH_FAILED".into())
}
#[derive(Deserialize)]
pub struct Bounds { pub provider_id: Option<u32>, pub x: f64, pub y: f64, pub width: f64, pub height: f64, pub visible: bool }
pub fn bounds(app: &AppHandle, host: &Arc<Host>, rect: Bounds) -> Result<(), String> {
    if ![rect.x, rect.y, rect.width, rect.height].iter().all(|n| n.is_finite()) { return Err("INVALID_BOUNDS".into()); }
    let parent = app.get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
    let scale = parent.scale_factor().map_err(|_| "WINDOW_SCALE_UNAVAILABLE")?;
    if !scale.is_finite() || scale <= 0.0 { return Err("WINDOW_SCALE_UNAVAILABLE".into()); }
    let size = parent.inner_size().map_err(|_| "WINDOW_SIZE_UNAVAILABLE")?.to_logical::<f64>(scale);
    // The frontend owns the layout (titlebar + toolbar offsets included). Clamp
    // only to the window so a stale measurement can never push the child offscreen.
    let x = rect.x.clamp(0.0, (size.width - 1.0).max(0.0)); let y = rect.y.clamp(0.0, (size.height - 1.0).max(0.0));
    let width = rect.width.clamp(1.0, (size.width - x).max(1.0)); let height = rect.height.clamp(1.0, (size.height - y).max(1.0));
    // Quantize to physical pixels. On macOS Retina (scale 2) a fractional CSS
    // rect would otherwise land between physical pixels and jitter/blur during
    // live resize. Snapping back to the pixel grid keeps geometry stable.
    let quant = [(x * scale).round() as i64, (y * scale).round() as i64,
        (width * scale).round().max(1.0) as i64, (height * scale).round().max(1.0) as i64];
    let (x, y, width, height) = (quant[0] as f64 / scale, quant[1] as f64 / scale, quant[2] as f64 / scale, quant[3] as f64 / scale);
    let ids: Vec<u32> = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?.keys().copied().collect();
    for id in ids {
        let Some(view) = app.get_webview(&format!("provider-{id}")) else { continue; };
        let want_visible = rect.visible && rect.provider_id == Some(id) && width > 4.0 && height > 4.0;
        // Skip redundant native calls: re-showing or re-moving an unchanged
        // child webview flickers and reorders it on macOS during live resize.
        let (placed, shown) = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?
            .get(&id).map(|v| (v.placed, v.shown)).unwrap_or((None, false));
        if placed == Some(quant) && shown == want_visible { continue; }
        if want_visible {
            if placed != Some(quant) || !shown {
                view.set_position(LogicalPosition::new(x, y)).map_err(|_| "VIEW_POSITION_FAILED")?;
                view.set_size(LogicalSize::new(width, height)).map_err(|_| "VIEW_SIZE_FAILED")?;
            }
            if !shown { view.show().map_err(|_| "VIEW_SHOW_FAILED")?; }
        } else if shown {
            view.hide().map_err(|_| "VIEW_HIDE_FAILED")?;
        }
        if let Ok(mut views) = host.views.lock() {
            if let Some(entry) = views.get_mut(&id) { entry.placed = Some(quant); entry.shown = want_visible; }
        }
    }
    Ok(())
}
#[tauri::command]
pub async fn provider_observe(webview: Webview, host: tauri::State<'_, Arc<Host>>, event: Value) -> Result<(), String> {
    let id = webview.label().strip_prefix("provider-").and_then(|id| id.parse::<u32>().ok()).ok_or("PROVIDER_VIEW_REQUIRED")?;
    let size = serde_json::to_vec(&event).map_err(|_| "INVALID_OBSERVATION")?.len();
    if size > 32768 || event["v"] != 1 || !event.is_object() { return Err("OBSERVATION_LIMIT".into()); }
    if !matches!(event["type"].as_str(), Some("capabilities" | "picked" | "shortcut" | "observation" | "network" | "generation_delta" | "generation_done" | "generation_error" | "action_result" | "quota" | "login_required" | "interaction" | "instrumentation_warning")) { return Err("OBSERVATION_TYPE_DENIED".into()); }
    let url = webview.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
    {
        let mut views = host.views.lock().map_err(|_| "HOST_LOCK_FAILED")?;
        let view = views.get_mut(&id).ok_or("UNKNOWN_VIEW")?;
        if url.origin().ascii_serialization() != view.origin { return Err("PROVIDER_ORIGIN_CHANGED".into()); }
        if view.window_start.elapsed() >= Duration::from_secs(1) { view.observations = 0; view.window_start = Instant::now(); }
        view.observations += 1; if view.observations > 256 { return Err("OBSERVATION_RATE_LIMIT".into()); }
    }
    report_location(&webview,host.inner(),id);
    if event["type"]=="shortcut" {
        // Named UI gestures only; the exact set is shared with the frontend
        // bridge contract and the agent forwarder. Arbitrary keys never pass.
        let key = event["key"].as_str().unwrap_or("");
        let tab_number = key.strip_prefix("tab-").filter(|n| n.len() == 1 && ('1'..='9').contains(&n.chars().next().unwrap_or('0')));
        if !matches!(key, "address" | "commands" | "close-tab" | "reopen-tab" | "new-tab" | "next-tab" | "prev-tab") && tab_number.is_none() {return Err("SHORTCUT_DENIED".into());}
        if let Some(main)=webview.app_handle().get_webview("main") {let _=main.set_focus();}
        let _=webview.app_handle().emit_to(tauri::EventTarget::Webview{label:"main".into()},"bridge:shortcut",json!({"key":event["key"]}));
        return Ok(());
    }
    // Fallback browsing records positive page evidence locally (observed
    // model facts, chat structure, sign-in/rate-limit signals) without
    // inventing models. Anything requiring inference still needs Zag.
    if host.is_fallback() {
        let changed = if let Ok(mut store) = host.fallback_store.try_lock() {
            crate::fallback::record_observation(&mut store, id as i32, &event)
        } else {
            false
        };
        if changed {
            if let Ok(store) = host.fallback_store.try_lock() {
                let data = crate::fallback::snapshot(&store);
                let _ = webview.app_handle().emit_to(tauri::EventTarget::Webview { label: "main".into() }, "bridge:snapshot", data);
            }
        }
        return Ok(());
    }
    if !host.ready.load(Ordering::Acquire) { return Err("BACKEND_UNAVAILABLE".into()); }
    host.notify("observation", json!({"provider_id":id,"event":event}))
}

// Only the native URL is authoritative. Query strings/fragments and auth paths
// never enter the detector, event log, or persistent conversation metadata.
fn report_location(view: &Webview, host: &Arc<Host>, id:u32) {
    let Ok(mut url)=view.url() else{return;};
    let path=url.path().to_ascii_lowercase();
    if ["oauth","callback","authorize","access_token","id_token","reset-password"].iter().any(|part|path.contains(part)){return;}
    url.set_query(None);url.set_fragment(None);
    if url.as_str().len()>2048 {return;}
    let changed=if let Ok(mut all)=host.views.lock(){
        if let Some(item)=all.get_mut(&id){
            if url.origin().ascii_serialization()!=item.origin || item.last_url==url.as_str(){false}
            else{item.last_url=url.to_string();true}
        }else{false}
    }else{false};
    if !changed { return; }
    if host.is_fallback() {
        // Keep fallback browsing state accurate without a sidecar round-trip.
        if let Ok(mut store) = host.fallback_store.try_lock() {
            if let Some(p) = store.providers.iter_mut().find(|p| p.id == id as i32) {
                // Only same-origin updates (views already enforces origin).
                if url.origin().ascii_serialization() == p.origin {
                    p.current_url = url.as_str().to_owned();
                }
            }
        }
        return;
    }
    let _=host.notify("browser.location",json!({"provider_id":id,"url":url.as_str()}));
}

#[tauri::command]
pub async fn browser_find(webview:Webview,host:tauri::State<'_,Arc<Host>>,provider_id:u32,query:String,backwards:bool)->Result<(),String>{
    trusted_main(&webview)?;
    if query.len()>256 {return Err("FIND_LIMIT".into());}
    if !host.views.lock().map_err(|_|"HOST_LOCK_FAILED")?.contains_key(&provider_id){return Err("UNKNOWN_VIEW".into());}
    let view=webview.app_handle().get_webview(&format!("provider-{provider_id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
    let encoded=serde_json::to_string(&query).map_err(|_|"FIND_ENCODE_FAILED")?;
    view.eval(format!("window.find({encoded},false,{backwards},true,false,false,false);")).map_err(|_|"FIND_FAILED".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn user_agent_matches_engine_and_stays_current() {
        let ua = provider_user_agent();
        // Engine-consistent desktop UA: Safari token on the WebKit engine.
        assert!(ua.starts_with("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) "));
        assert!(ua.contains("Version/") && ua.ends_with("Safari/605.1.15"));
        assert!(!ua.contains("Chrome/"), "a Chrome token on WKWebView trips provider bot checks");
        if let Some(bundle) = safari_bundle_version() {
            assert!(ua.contains(&format!("Version/{bundle}")), "UA tracks the installed Safari release");
        }
    }
}
