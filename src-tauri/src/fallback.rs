//! Embedded fallback gateway for development platforms where the Zag
//! sidecar cannot run (e.g. macOS arm64 dev). This is NOT release-qualified
//! and never replaces Zag on Linux x86_64. It exists so browsing, profiles
//! and sign-in keep working while the real backend is unavailable.
//!
//! Design:
//! - Persists only to `fallback-state.json`, never to Zag's `state.json`,
//!   `connection.json` or `local-token`.
//! - Snapshot shape matches the frontend validator: protocol 1,
//!   backend "zag", providers array, sessions array.
//! - Providers stay in BROWSING/UNCONFIGURED states; no models are invented,
//!   no HTTP gateway is claimed as running.
//! - All persistence is best-effort; failures surface as explicit errors.
use serde_json::{json, Value};
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};

const FALLBACK_FILE: &str = "fallback-state.json";
const VERSION: &str = "0.1.0-fallback-macos";

#[derive(Clone, Debug)]
pub struct FallbackModel {
    pub id: String,
    pub name: String,
}

#[derive(Clone, Debug)]
pub struct FallbackProvider {
    pub id: i32,
    pub label: String,
    pub origin: String,
    pub url: String,
    pub current_url: String,
    pub open_tab: bool,
    pub pinned: bool,
    pub last_seen: i64,
    /// Set when the page agent reports positive chat/model evidence. Models
    /// below always come from observed page facts, never invented.
    pub detected: bool,
    pub discovery_score: u32,
    pub discovery_reason: String,
    pub current_model: String,
    pub models: Vec<FallbackModel>,
    pub reasoning_observed: bool,
    /// Sticky sign-in/rate-limit signal from page observations, cleared on
    /// fresh open/navigate. Only LOGIN_REQUIRED or RATE_LIMITED, else empty.
    pub state_override: String,
}

#[derive(Debug)]
pub struct Store {
    pub next_id: i32,
    pub providers: Vec<FallbackProvider>,
    pub focused: i32,
    pub api_running: bool,
    pub port: i32,
}

impl Store {
    pub fn empty() -> Self {
        Self { next_id: 1, providers: Vec::new(), focused: 0, api_running: false, port: 7331 }
    }
}

/// Friendly display names for well-known chat websites, used only for the
/// workspace label when the user did not supply one. This never creates
/// model entries: models still come exclusively from observed page facts.
fn friendly_label(origin: &str) -> Option<&'static str> {
    match origin {
        "https://chatgpt.com" | "https://chat.openai.com" => Some("ChatGPT"),
        "https://claude.ai" => Some("Claude"),
        "https://gemini.google.com" => Some("Gemini"),
        "https://chat.deepseek.com" => Some("DeepSeek"),
        "https://chat.qwen.ai" | "https://chat.qwenlm.ai" => Some("Qwen"),
        "https://chat.z.ai" => Some("Z.ai"),
        "https://chat.stepfun.com" => Some("StepFun"),
        "https://kimi.moonshot.cn" | "https://kimi.ai" => Some("Kimi"),
        "https://agent.minimax.io" | "https://chat.minimax.io" => Some("MiniMax"),
        "https://copilot.microsoft.com" => Some("Copilot"),
        "https://github.com" => Some("GitHub Copilot"),
        "https://grok.com" => Some("Grok"),
        "https://www.perplexity.ai" | "https://perplexity.ai" => Some("Perplexity"),
        "https://meta.ai" | "https://www.meta.ai" => Some("Meta AI"),
        "https://chat.mistral.ai" => Some("Mistral"),
        _ => None,
    }
}

fn slug(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut last_dash = true;
    for c in input.chars().flat_map(|c| c.to_lowercase()) {
        if c.is_ascii_alphanumeric() {
            out.push(c);
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
        if out.len() >= 64 {
            break;
        }
    }
    while out.ends_with('-') {
        out.pop();
    }
    if out.is_empty() {
        "model".to_owned()
    } else {
        out
    }
}
fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn escape_json(s: &str) -> String {
    // Minimal JSON string escaping for our own persistence (labels/urls).
    let mut out = String::with_capacity(s.len() + 2);
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c.is_control() => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

pub fn load(root: &Path) -> Store {
    let path = root.join(FALLBACK_FILE);
    let bytes = std::fs::read(&path).unwrap_or_default();
    if bytes.is_empty() {
        return Store::empty();
    }
    let v: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    let mut store = Store::empty();
    if let Some(n) = v.get("next_provider_id").and_then(Value::as_i64) {
        if (1..1_000_000).contains(&n) {
            store.next_id = n as i32;
        }
    }
    if let Some(p) = v.get("port").and_then(Value::as_i64) {
        if (1024..=65535).contains(&p) {
            store.port = p as i32;
        }
    }
    if let Some(list) = v.get("providers").and_then(Value::as_array) {
        for item in list.iter().take(16) {
            let id = item.get("id").and_then(Value::as_i64).unwrap_or(0);
            let origin = item.get("origin").and_then(Value::as_str).unwrap_or("");
            let url = item.get("url").and_then(Value::as_str).unwrap_or("");
            let label = item.get("label").and_then(Value::as_str).unwrap_or("");
            if !(1..1_000_000).contains(&id) || origin.is_empty() || url.is_empty() || label.is_empty() {
                continue;
            }
            if origin.len() > 512 || url.len() > 2048 || label.len() > 240 {
                continue;
            }
            // Only restore https origins to match safe_provider_url.
            if !(origin.starts_with("https://") || origin.starts_with("http://127.0.0.1")) {
                continue;
            }
            let mut models = Vec::new();
            if let Some(list) = item.get("models").and_then(Value::as_array) {
                for m in list.iter().take(8) {
                    let mid = m.get("id").and_then(Value::as_str).unwrap_or("");
                    let name = m.get("name").and_then(Value::as_str).unwrap_or("");
                    if mid.is_empty()
                        || mid.len() > 128
                        || name.is_empty()
                        || name.chars().count() > 180
                    {
                        continue;
                    }
                    if models.iter().any(|e: &FallbackModel| e.id == mid) {
                        continue;
                    }
                    models.push(FallbackModel { id: mid.to_owned(), name: name.to_owned() });
                }
            }
            let state_override = match item.get("state_override").and_then(Value::as_str) {
                Some("LOGIN_REQUIRED") | Some("RATE_LIMITED") => {
                    item.get("state_override").and_then(Value::as_str).unwrap_or("").to_owned()
                }
                _ => String::new(),
            };
            let detected = item.get("detected").and_then(Value::as_bool).unwrap_or(false) && !models.is_empty();
            store.providers.push(FallbackProvider {
                id: id as i32,
                label: label.to_owned(),
                origin: origin.to_owned(),
                url: url.to_owned(),
                current_url: item
                    .get("current_url")
                    .and_then(Value::as_str)
                    .unwrap_or(url)
                    .to_owned(),
                open_tab: item.get("open_tab").and_then(Value::as_bool).unwrap_or(true),
                pinned: item.get("pinned").and_then(Value::as_bool).unwrap_or(false),
                last_seen: 0,
                detected,
                discovery_score: item
                    .get("discovery_score")
                    .and_then(Value::as_u64)
                    .map(|n| n.min(100) as u32)
                    .unwrap_or(0),
                discovery_reason: item
                    .get("discovery_reason")
                    .and_then(Value::as_str)
                    .filter(|r| r.chars().count() <= 300)
                    .unwrap_or("")
                    .to_owned(),
                current_model: String::new(),
                models,
                reasoning_observed: item.get("reasoning_observed").and_then(Value::as_bool).unwrap_or(false),
                state_override,
            });
            if store.next_id <= id as i32 {
                store.next_id = id as i32 + 1;
            }
        }
    }
    store
}

pub fn save(root: &Path, store: &Store) -> Result<(), String> {
    let mut s = String::from("{\"schema\":1,\"port\":");
    s.push_str(&store.port.to_string());
    s.push_str(",\"next_provider_id\":");
    s.push_str(&store.next_id.to_string());
    s.push_str(",\"providers\":[");
    for (i, p) in store.providers.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        let mut models_json = String::from("[");
        for (j, m) in p.models.iter().enumerate() {
            if j > 0 {
                models_json.push(',');
            }
            models_json.push_str(&format!(
                "{{\"id\":\"{}\",\"name\":\"{}\"}}",
                escape_json(&m.id),
                escape_json(&m.name)
            ));
        }
        models_json.push(']');
        s.push_str(&format!(
            "{{\"id\":{},\"origin\":\"{}\",\"url\":\"{}\",\"label\":\"{}\",\"current_url\":\"{}\",\"open_tab\":{},\"pinned\":{},\"detected\":{},\"discovery_score\":{},\"discovery_reason\":\"{}\",\"models\":{},\"reasoning_observed\":{},\"state_override\":\"{}\"}}",
            p.id,
            escape_json(&p.origin),
            escape_json(&p.url),
            escape_json(&p.label),
            escape_json(&p.current_url),
            if p.open_tab { "true" } else { "false" },
            if p.pinned { "true" } else { "false" },
            if p.detected { "true" } else { "false" },
            p.discovery_score,
            escape_json(&p.discovery_reason),
            models_json,
            if p.reasoning_observed { "true" } else { "false" },
            escape_json(&p.state_override),
        ));
    }
    s.push_str("]}");
    if s.len() > 1_048_576 {
        return Err("FALLBACK_STATE_LIMIT".into());
    }
    let path = root.join(FALLBACK_FILE);
    // Atomic write: temp file + rename, private permissions.
    use std::os::unix::fs::OpenOptionsExt;
    let tmp = root.join(format!(".fallback-state-{}-tmp", std::process::id()));
    let result = (|| -> Result<(), String> {
        let mut opts = std::fs::OpenOptions::new();
        opts.write(true).create_new(true).mode(0o600);
        use std::io::Write;
        let mut f = opts.open(&tmp).map_err(|_| "FALLBACK_SAVE_FAILED")?;
        f.write_all(s.as_bytes()).map_err(|_| "FALLBACK_SAVE_FAILED")?;
        f.sync_all().map_err(|_| "FALLBACK_SAVE_FAILED")?;
        drop(f);
        std::fs::rename(&tmp, &path).map_err(|_| "FALLBACK_SAVE_FAILED")?;
        Ok(())
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&tmp);
    }
    result
}

fn provider_json(p: &FallbackProvider) -> Value {
    let state = if !p.state_override.is_empty() {
        p.state_override.clone()
    } else if p.open_tab {
        "BROWSING".to_owned()
    } else {
        "UNCONFIGURED".to_owned()
    };
    let discovery_reason = if p.detected && !p.discovery_reason.is_empty() {
        p.discovery_reason.clone()
    } else if friendly_label(&p.origin).is_some() {
        "Known chat website. Sign in and open its model menu; observed models are listed here without verification. Full detection runs in the Zag backend on Linux.".to_owned()
    } else {
        "Fallback browsing mode. Open a model menu or sign in; observed models are listed here without verification. Full detection runs in the Zag backend on Linux.".to_owned()
    };
    // Observed page labels only: never enabled/available here because there
    // is no gateway to serve them. Unknown limits stay unknown.
    let models: Vec<Value> = p
        .models
        .iter()
        .map(|m| {
            json!({
                "id": m.id,
                "display_name": m.name,
                "enabled": false,
                "available": false,
                "confidence": "OBSERVED",
                "context": {"nominal": null, "effective": null, "source": "OBSERVED_LABEL_ONLY"},
                "tokenizer": {"mode": "unknown", "name": null},
                "tools": "emulated",
                "vision": null,
                "reasoning": if p.reasoning_observed {
                    json!({"supported": null, "control_observed": true})
                } else {
                    Value::Null
                }
            })
        })
        .collect();
    json!({
        "id": p.id,
        "label": p.label,
        "origin": p.origin,
        "url": p.url,
        "current_url": p.current_url,
        "open_tab": p.open_tab,
        "pinned": p.pinned,
        "detected": p.detected,
        "exposed": false,
        "scan_enabled": true,
        "dismissed": false,
        "discovery_score": p.discovery_score,
        "discovery_reason": discovery_reason,
        "current_model": p.current_model,
        "reasoning_modes": [],
        "context_hint": 0,
        "reasoning_value": "",
        "last_seen": p.last_seen,
        "active": false,
        "browser_busy": false,
        "state": state,
        "mapping_version": 0,
        "last_error": "",
        "mappings": {"prompt":0,"send":0,"response":0,"stop":0,"new_chat":0,"model":0,"reasoning":0,"attachment":0,"ephemeral":0},
        "model_locked": false,
        "reasoning_locked": false,
        "models": models
    })
}

pub fn snapshot(store: &Store) -> Value {
    let providers: Vec<Value> = store.providers.iter().map(provider_json).collect();
    json!({
        "protocol": 1,
        "backend": "zag",
        "version": VERSION,
        "api": {"host":"127.0.0.1","port":store.port,"running":false,"desired_port":store.port,"key_present":false},
        "providers": providers,
        "sessions": [],
        "mcp_servers": [],
        "mcp_run": {"turn_limit":100,"work_remaining_seconds":0,"can_resume":false,"id":"","state":"IDLE","provider_id":0,"model":"","turns":0,"calls":0,"auto_continue":false,"error":"","answer":"","call_id":"","tool":"","arguments":"","last_result":""},
        "detector": {"engine":"symbolic","tnn_artifact_loaded":false,"hybrid_qualified":false,"reason":"Fallback mode: Zag sidecar unavailable on this platform. Browsing only; use Linux x86_64 for the full gateway."},
        "settings": {"harness":"opencode","theme":"dark","compact":false,"restore_tabs":true,"auto_start":false,"idle_minutes":30,"logging":"INFO","fallback_enabled":false,"fallback_model":"","default_model":"","ephemeral_chats":false,"developer_mode":false,"raw_capture":false},
        "events": [],
        "developer_mode": false,
        "metrics": {"completed_requests":0,"failed_requests":0},
        "qualification": {"release":false,"live_provider_verified":false,"harness_verified":false,"native_build_evidence":"fallback mode is not release-qualified"}
    })
}

fn emit_snapshot(app: &AppHandle, store: &Store) {
    let data = snapshot(store);
    let _ = app.emit_to(
        tauri::EventTarget::Webview { label: "main".into() },
        "bridge:snapshot",
        data,
    );
}

fn find_index(store: &Store, id: i32) -> Option<usize> {
    store.providers.iter().position(|p| p.id == id)
}

fn parse_provider_id(params: &Value) -> Option<i32> {
    params
        .get("provider_id")
        .and_then(Value::as_i64)
        .filter(|id| (1..1_000_000).contains(id))
        .map(|id| id as i32)
}

fn safe_origin(url: &url::Url) -> Option<String> {
    if !url.username().is_empty() || url.password().is_some() || url.host_str().is_none() {
        return None;
    }
    if url.scheme() != "https" {
        return None;
    }
    if matches!(
        url.host_str(),
        Some("tauri.localhost" | "ipc.localhost" | "localhost" | "127.0.0.1" | "::1")
    ) {
        return None;
    }
    Some(url.origin().ascii_serialization())
}

/// Record a page-agent event into the fallback store so model detection
/// keeps working without the Zag sidecar. Only positive, bounded evidence
/// is recorded: model facts the page agent already redacted (names only),
/// structural chat evidence (composer/response/model control present), and
/// sign-in/rate-limit signals. Nothing is invented: no mappings, no context
/// limits, no gateway availability. Returns true when the visible snapshot
/// changed and should be re-emitted and persisted.
pub fn record_observation(store: &mut Store, id: i32, event: &Value) -> bool {
    let Some(p) = store.providers.iter_mut().find(|p| p.id == id) else {
        return false;
    };
    p.last_seen = now_ms();
    let mut changed = false;
    match event.get("type").and_then(Value::as_str).unwrap_or("") {
        "capabilities" => {
            if let Some(facts) = event.get("facts").and_then(Value::as_array) {
                for fact in facts.iter().take(16) {
                    let name = fact.get("model").and_then(Value::as_str).unwrap_or("").trim();
                    if name.is_empty() || name.chars().count() > 180 {
                        continue;
                    }
                    if p.models.iter().any(|m| m.name == name) {
                        continue;
                    }
                    if p.models.len() >= 8 {
                        break;
                    }
                    let mid = format!("p{}/{}", p.id, slug(name));
                    if p.models.iter().any(|m| m.id == mid) {
                        continue;
                    }
                    p.models.push(FallbackModel { id: mid, name: name.to_owned() });
                    changed = true;
                }
            }
            if !p.models.is_empty() {
                p.detected = true;
                let n = p.models.len();
                p.discovery_score = (p.discovery_score.max(75)).min(100);
                p.discovery_reason = format!(
                    "Observed {} website model{} on this device (unverified listing; no gateway). Full verification runs in the Zag backend on Linux.",
                    n,
                    if n == 1 { "" } else { "s" }
                );
                changed = true;
            }
        }
        "observation" => {
            let mut prompt = false;
            let mut response = false;
            let mut model_control = false;
            let mut reasoning = false;
            if let Some(controls) = event.get("controls").and_then(Value::as_array) {
                for c in controls.iter().take(128) {
                    if !c.get("visible").and_then(Value::as_bool).unwrap_or(false) {
                        continue;
                    }
                    if c.get("disabled").and_then(Value::as_bool).unwrap_or(false) {
                        continue;
                    }
                    if c.get("editable").and_then(Value::as_bool).unwrap_or(false) {
                        prompt = true;
                    }
                    if c.get("assistant").and_then(Value::as_bool).unwrap_or(false) {
                        response = true;
                    }
                    let role = c.get("role").and_then(Value::as_str).unwrap_or("");
                    let label = c.get("label").and_then(Value::as_str).unwrap_or("").to_lowercase();
                    let value = c.get("current_value").and_then(Value::as_str).unwrap_or("").to_lowercase();
                    if matches!(role, "button" | "combobox") && (label.contains("model") || value.contains("model")) {
                        model_control = true;
                    }
                    if matches!(role, "button" | "combobox" | "switch" | "checkbox")
                        && (label.contains("reason") || label.contains("think") || value.contains("reason") || value.contains("think"))
                    {
                        reasoning = true;
                    }
                }
            }
            if reasoning && !p.reasoning_observed {
                p.reasoning_observed = true;
                changed = true;
            }
            let kinds = [prompt && response, model_control, reasoning].iter().filter(|&&b| b).count();
            if kinds > 0 {
                let score = ((kinds * 25) as u32).min(100);
                if score > p.discovery_score {
                    p.discovery_score = score;
                    changed = true;
                }
            }
            if prompt && response && !p.detected {
                p.detected = true;
                if p.discovery_score < 25 {
                    p.discovery_score = 25;
                }
                p.discovery_reason = "Chat controls observed on this device; no model names yet. Open the website's model menu while signed in. Full detection runs in the Zag backend on Linux.".to_owned();
                changed = true;
            }
        }
        "quota" => {
            if p.state_override != "RATE_LIMITED" {
                p.state_override = "RATE_LIMITED".to_owned();
                changed = true;
            }
        }
        "login_required" => {
            if p.state_override != "LOGIN_REQUIRED" {
                p.state_override = "LOGIN_REQUIRED".to_owned();
                changed = true;
            }
        }
        "generation_error" => {
            let override_state = match event.get("code").and_then(Value::as_str).unwrap_or("") {
                "AUTH_REQUIRED" => "LOGIN_REQUIRED",
                "PROVIDER_RATE_LIMITED" => "RATE_LIMITED",
                _ => "",
            };
            if !override_state.is_empty() && p.state_override != override_state {
                p.state_override = override_state.to_owned();
                changed = true;
            }
        }
        _ => {}
    }
    changed
}

/// Handle a frontend op in fallback mode.
/// Returns Err("FALLBACK_NOT_HANDLED") when the op requires the real Zag
/// backend (model inference, MCP, sessions). The caller then falls through
/// to the sidecar path so the error stays explicit.
pub async fn handle(
    app: &AppHandle,
    root: &std::path::Path,
    store: &mut Store,
    op: &str,
    params: &Value,
) -> Result<Value, String> {
    match op {
        "state.get" => Ok(snapshot(store)),
        "workspace.focus" => {
            let id = params
                .get("provider_id")
                .and_then(Value::as_i64)
                .unwrap_or(0);
            if id == 0 {
                store.focused = 0;
                return Ok(Value::Null);
            }
            let pid = id as i32;
            if find_index(store, pid).is_none() {
                return Err("PROVIDER_NOT_FOUND".into());
            }
            store.focused = pid;
            if let Some(idx) = find_index(store, pid) {
                store.providers[idx].last_seen = now_ms();
            }
            Ok(Value::Null)
        }
        "provider.add" => {
            let url_s = params.get("url").and_then(Value::as_str).unwrap_or("");
            let label_s = params.get("label").and_then(Value::as_str).unwrap_or("");
            if url_s.is_empty() || url_s.len() > 2048 || label_s.len() > 120 {
                return Err("INVALID_PROVIDER_URL_OR_LABEL".into());
            }
            let url = url::Url::parse(url_s).map_err(|_| "INVALID_PROVIDER_URL_OR_LABEL")?;
            let origin = safe_origin(&url).ok_or("INVALID_PROVIDER_URL_OR_LABEL")?;
            if store.providers.iter().any(|p| p.origin == origin) {
                return Err("PROVIDER_ALREADY_EXISTS".into());
            }
            if store.providers.len() >= 16 {
                return Err("PROVIDER_LIMIT".into());
            }
            let label = if label_s.trim().is_empty() {
                friendly_label(&origin)
                    .map(str::to_owned)
                    .unwrap_or_else(|| url.host_str().unwrap_or("website").to_owned())
            } else {
                label_s.trim().to_owned()
            };
            // Basic label redaction parity: reject empty after trim.
            if label.is_empty() {
                return Err("INVALID_PROVIDER_URL_OR_LABEL".into());
            }
            let id = store.next_id;
            if id >= 1_000_000 {
                return Err("PROVIDER_LIMIT".into());
            }
            store.next_id += 1;
            let provider = FallbackProvider {
                id,
                label,
                origin: origin.clone(),
                url: url_s.to_owned(),
                current_url: url_s.to_owned(),
                open_tab: true,
                pinned: false,
                last_seen: now_ms(),
                detected: false,
                discovery_score: 0,
                discovery_reason: String::new(),
                current_model: String::new(),
                models: Vec::new(),
                reasoning_observed: false,
                state_override: String::new(),
            };
            store.providers.push(provider.clone());
            store.focused = id;
            let _ = save(root, store);
            // Open the native webview immediately so browsing works without Zag.
            open_native(app, &provider).await?;
            emit_snapshot(app, store);
            Ok(json!({"provider_id": id}))
        }
        "provider.open" => {
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let idx = find_index(store, pid).ok_or("PROVIDER_NOT_FOUND")?;
            store.providers[idx].open_tab = true;
            store.providers[idx].last_seen = now_ms();
            store.providers[idx].state_override.clear();
            store.focused = pid;
            let provider = store.providers[idx].clone();
            let _ = save(root, store);
            open_native(app, &provider).await?;
            emit_snapshot(app, store);
            Ok(Value::Null)
        }
        "provider.close" => {
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let idx = find_index(store, pid).ok_or("PROVIDER_NOT_FOUND")?;
            store.providers[idx].open_tab = false;
            if store.focused == pid {
                store.focused = 0;
            }
            let label = format!("provider-{pid}");
            if let Some(view) = app.get_webview(&label) {
                let _ = view.close();
            }
            let _ = save(root, store);
            emit_snapshot(app, store);
            Ok(Value::Null)
        }
        "provider.navigate" | "provider.home" => {
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let idx = find_index(store, pid).ok_or("PROVIDER_NOT_FOUND")?;
            let target_url = if op == "provider.home" {
                store.providers[idx].url.clone()
            } else {
                params.get("url").and_then(Value::as_str).unwrap_or("").to_owned()
            };
            if target_url.is_empty() || target_url.len() > 2048 {
                return Err("INVALID_PROVIDER_URL".into());
            }
            let url = url::Url::parse(&target_url).map_err(|_| "INVALID_PROVIDER_URL")?;
            let origin = safe_origin(&url).ok_or("NAVIGATION_ORIGIN_MISMATCH")?;
            if origin != store.providers[idx].origin {
                return Err("NAVIGATION_ORIGIN_MISMATCH".into());
            }
            store.providers[idx].current_url = target_url.clone();
            store.providers[idx].open_tab = true;
            store.providers[idx].last_seen = now_ms();
            store.providers[idx].state_override.clear();
            let label = format!("provider-{pid}");
            if let Some(view) = app.get_webview(&label) {
                view.navigate(url).map_err(|_| "NAVIGATION_FAILED")?;
            } else {
                let provider = store.providers[idx].clone();
                open_native(app, &provider).await?;
            }
            let _ = save(root, store);
            emit_snapshot(app, store);
            Ok(Value::Null)
        }
        "provider.clear_profile" | "provider.remove" => {
            // Both require explicit confirmation like Zag.
            let confirmed = params.get("confirmed").and_then(Value::as_bool).unwrap_or(false);
            if !confirmed {
                return Err("CONFIRMATION_REQUIRED".into());
            }
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let idx = find_index(store, pid).ok_or("PROVIDER_NOT_FOUND")?;
            let label = format!("provider-{pid}");
            if let Some(view) = app.get_webview(&label) {
                if op == "provider.clear_profile" {
                    let _ = view.clear_all_browsing_data();
                }
                let _ = view.close();
            }
            // Remove profile directory best-effort (constructed from validated id only).
            let profile = root.join("profiles").join(&label);
            let expected = root.join("profiles").join(&label);
            if profile == expected {
                if let Ok(meta) = std::fs::symlink_metadata(&profile) {
                    if !meta.file_type().is_symlink() {
                        let _ = std::fs::remove_dir_all(&profile);
                    }
                }
            }
            if op == "provider.remove" {
                store.providers.remove(idx);
            } else {
                store.providers[idx].open_tab = false;
                store.providers[idx].current_url = store.providers[idx].url.clone();
            }
            if store.focused == pid {
                store.focused = 0;
            }
            let _ = save(root, store);
            emit_snapshot(app, store);
            Ok(Value::Null)
        }
        "provider.update" => {
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let idx = find_index(store, pid).ok_or("PROVIDER_NOT_FOUND")?;
            if let Some(label) = params.get("label").and_then(Value::as_str) {
                if label.is_empty() || label.len() > 240 {
                    return Err("INVALID_PROVIDER_SETTINGS".into());
                }
                store.providers[idx].label = label.to_owned();
            }
            if let Some(pinned) = params.get("pinned").and_then(Value::as_bool) {
                store.providers[idx].pinned = pinned;
            }
            // Silently accept (and ignore) Zag-only keys so the same UI works
            // in both modes without forking the frontend.
            let _ = save(root, store);
            emit_snapshot(app, store);
            Ok(Value::Null)
        }
        "provider.rescan" => {
            let pid = parse_provider_id(params).ok_or("PROVIDER_NOT_FOUND")?;
            let label = format!("provider-{pid}");
            if let Some(view) = app.get_webview(&label) {
                let _ = view.eval("globalThis.__BRIDGE_RESCAN__?.()");
            }
            Ok(Value::Null)
        }
        "browser.location" => {
            if let Some(pid) = parse_provider_id(params) {
                if let Some(idx) = find_index(store, pid) {
                    if let Some(url_s) = params.get("url").and_then(Value::as_str) {
                        if url_s.len() <= 2048 {
                            if let Ok(url) = url::Url::parse(url_s) {
                                if let Some(origin) = safe_origin(&url) {
                                    if origin == store.providers[idx].origin {
                                        store.providers[idx].current_url = url_s.to_owned();
                                        store.providers[idx].last_seen = now_ms();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Ok(Value::Null)
        }
        "observation" | "browser.failed" => {
            // Browsing observations are accepted but do not invent models.
            if let Some(pid) = parse_provider_id(params) {
                if let Some(idx) = find_index(store, pid) {
                    store.providers[idx].last_seen = now_ms();
                }
            }
            Ok(Value::Null)
        }
        "settings.update" => {
            // Appearance prefs live in localStorage on the frontend in
            // fallback mode; acknowledge without claiming persistence of
            // routing policy that only Zag owns.
            if let Some(port) = params.get("port").and_then(Value::as_i64) {
                if !(1024..=65535).contains(&port) {
                    return Err("INVALID_PORT".into());
                }
                store.port = port as i32;
                let _ = save(root, store);
            }
            Ok(json!({"restart_required": false}))
        }
        "api.start" | "api.stop" => {
            // No loopback HTTP server in fallback; report accurately.
            store.api_running = false;
            Ok(Value::Null)
        }
        // Everything requiring inference, tools, sessions or keys needs Zag.
        _ => Err("FALLBACK_NOT_HANDLED".into()),
    }
}

/// Best-effort native open. Mirrors views::open admission without importing it
/// (keeps fallback decoupled from the Zag host-event path).
async fn open_native(app: &AppHandle, provider: &FallbackProvider) -> Result<(), String> {
    use tauri::{LogicalPosition, LogicalSize, WebviewUrl, webview::WebviewBuilder};
    use tauri::Manager;

    let url = url::Url::parse(&provider.current_url).map_err(|_| "INVALID_PROVIDER_URL")?;
    let origin = safe_origin(&url).ok_or("PROVIDER_URL_DENIED")?;
    if origin != provider.origin {
        return Err("PROVIDER_URL_DENIED".into());
    }
    let label: String = format!("provider-{}", provider.id);
    if app.get_webview(&label).is_some() {
        if let Some(view) = app.get_webview(&label) {
            let _ = view.eval("globalThis.__BRIDGE_RESCAN__?.()");
        }
        return Ok(());
    }
    let profiles = crate::views::private_directory_path(app)?;
    let profile = profiles.join(label.clone());
    crate::views::private_directory(&profile)?;
    crate::views::insert_view(
        app,
        provider.id as u32,
        crate::views::ProviderView {
            origin: origin.clone(),
            profile: profile.clone(),
            window_start: std::time::Instant::now(),
            observations: 0,
            popup_until: None,
            download_until: None,
            last_url: String::new(),
            zoom: 1.0,
            placed: None,
            shown: false,
        },
    )?;
    let config = serde_json::to_string(&serde_json::json!({"origin": origin}))
        .map_err(|_| "CONFIG_ENCODE_FAILED")?;
    let script = format!(
        "Object.defineProperty(globalThis,'__BRIDGE_BOOT__',{{value:Object.freeze({config})}});\n{}\n{}",
        include_str!("../../browser/semantics.js"),
        include_str!("../../browser/agent.js")
    );
    let ua: String = crate::views::provider_user_agent();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let app_on_main: AppHandle = app.clone();
    let app_for_events: AppHandle = app.clone();
    let pid = provider.id as u32;
    // All values moved into the main-thread closure must be owned ('static).
    // References to function locals (including &AppHandle) cannot escape.
    let label_thread: String = label.clone();
    let url_thread = url.clone();
    let profile_thread = profile.clone();
    app.run_on_main_thread(move || {
        let result = (|| -> Result<(), String> {
            use tauri::webview::NewWindowResponse;
            let parent = app_on_main.get_window("main").ok_or("MAIN_WINDOW_MISSING")?;
            let builder = WebviewBuilder::new(label_thread.as_str(), WebviewUrl::External(url_thread))
                .data_directory(profile_thread)
                .initialization_script(script.as_str())
                .user_agent(&ua)
                .devtools(true)
                .focused(false)
                .on_navigation(move |next| crate::views::safe_provider_url(next, false))
                .on_new_window(move |_url, _| NewWindowResponse::Deny)
                .on_page_load(move |view, payload| {
                    let origin = view.url().ok().map(|u| u.origin().ascii_serialization());
                    let _ = app_for_events.emit_to(
                        tauri::EventTarget::Webview { label: "main".into() },
                        "bridge:browser",
                        serde_json::json!({"provider_id": pid, "origin": origin, "loading": matches!(payload.event(), tauri::webview::PageLoadEvent::Started)}),
                    );
                });
            let view = parent
                .add_child(builder, LogicalPosition::new(80.0, 100.0), LogicalSize::new(1.0, 1.0))
                .map_err(|_| "WEBVIEW_CREATE_FAILED")?;
            view.hide().map_err(|_| "WEBVIEW_HIDE_FAILED")?;
            Ok(())
        })();
        let _ = tx.send(result);
    })
    .map_err(|_| "MAIN_THREAD_UNAVAILABLE")?;
    let result = rx.await.map_err(|_| "WEBVIEW_CREATE_CANCELLED")?;
    if result.is_err() {
        crate::views::remove_view(app, provider.id as u32);
    }
    result
}
