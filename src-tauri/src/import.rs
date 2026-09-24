//! Cross-browser session import.
//!
//! Reads browsing sessions (cookies) and saved logins from the user's other
//! browsers and installs them into a Codemax provider's isolated profile,
//! only after explicit per-site consent in the UI.
//!
//! Design boundaries (see SECURITY.md):
//! - Source profiles are only ever read. SQLite stores are copied to a temp
//!   file first (never locked or modified); nothing is written back.
//! - Passwords never cross into the frontend, logs, snapshots, or disk. They
//!   live in a process-memory cache (zeroized on eviction) and are injected
//!   into the site's own login form on demand.
//! - Chromium encryption keys come from the macOS Keychain through the
//!   system consent prompt. Denial fails closed with a plain message.
//! - Safari passwords (Keychain ACLs deny third-party reads) and Firefox NSS
//!   logins (master-password keystore) are reported as unsupported, never
//!   attempted silently. Firefox and Safari passwords are out of scope.
//! - Cookie injection targets only the selected provider's isolated store,
//!   matched by domain. No blanket machine-access permission is added.
#[cfg(target_os = "macos")]
use rusqlite::{Connection, OpenFlags};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Manager, Webview};
use zeroize::Zeroizing;

#[cfg(target_os = "macos")]
use security_framework::passwords::get_generic_password;

// ---------------------------------------------------------------------------
// Browser detection
// ---------------------------------------------------------------------------

/// A detected desktop browser that can supply sessions for import.
pub struct BrowserSource {
    pub id: &'static str,
    pub label: &'static str,
    pub kind: SourceKind,
    pub base: PathBuf,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SourceKind {
    Safari,
    Chromium { service: &'static str, account: &'static str },
    Firefox,
}

impl SourceKind {
    fn name(&self) -> &'static str {
        match self {
            SourceKind::Safari => "safari",
            SourceKind::Chromium { .. } => "chromium",
            SourceKind::Firefox => "firefox",
        }
    }
    fn passwords_supported(&self) -> bool {
        matches!(self, SourceKind::Chromium { .. })
    }
}

struct KnownBrowser {
    id: &'static str,
    label: &'static str,
    kind: SourceKind,
    /// Profile base relative to $HOME; Firefox uses a glob below it.
    base_rel: &'static str,
    cookie_rel: &'static str,
    login_rel: Option<&'static str>,
    chromium_profile: Option<&'static str>,
}

#[cfg(target_os = "macos")]
const KNOWN_BROWSERS: &[KnownBrowser] = &[
    KnownBrowser {
        id: "safari",
        label: "Safari",
        kind: SourceKind::Safari,
        base_rel: "Library/Containers/com.apple.Safari/Data",
        cookie_rel: "Library/Cookies/Cookies.binarycookies",
        login_rel: None,
        chromium_profile: None,
    },
    KnownBrowser {
        id: "chrome",
        label: "Google Chrome",
        kind: SourceKind::Chromium { service: "Chrome Safe Storage", account: "Chrome" },
        base_rel: "Library/Application Support/Google/Chrome",
        cookie_rel: "Default/Cookies",
        login_rel: Some("Default/Login Data"),
        chromium_profile: Some("Default"),
    },
    KnownBrowser {
        id: "brave",
        label: "Brave",
        kind: SourceKind::Chromium { service: "Brave Safe Storage", account: "Brave" },
        base_rel: "Library/Application Support/BraveSoftware/Brave-Browser",
        cookie_rel: "Default/Cookies",
        login_rel: Some("Default/Login Data"),
        chromium_profile: Some("Default"),
    },
    KnownBrowser {
        id: "edge",
        label: "Microsoft Edge",
        kind: SourceKind::Chromium { service: "Microsoft Edge Safe Storage", account: "Microsoft Edge" },
        base_rel: "Library/Application Support/Microsoft Edge",
        cookie_rel: "Default/Cookies",
        login_rel: Some("Default/Login Data"),
        chromium_profile: Some("Default"),
    },
    KnownBrowser {
        id: "arc",
        label: "Arc",
        kind: SourceKind::Chromium { service: "Arc Safe Storage", account: "Arc" },
        base_rel: "Library/Application Support/Arc/User Data",
        cookie_rel: "Default/Cookies",
        login_rel: Some("Default/Login Data"),
        chromium_profile: Some("Default"),
    },
    KnownBrowser {
        id: "firefox",
        label: "Firefox",
        kind: SourceKind::Firefox,
        base_rel: "Library/Application Support/Firefox/Profiles",
        cookie_rel: "cookies.sqlite",
        login_rel: None,
        chromium_profile: None,
    },
];

fn home_dir() -> Option<PathBuf> {
    std::env::var("HOME").ok().map(PathBuf::from)
}

/// Pure over a home directory so tests can point at fixtures.
#[cfg(target_os = "macos")]
fn scan_browsers(home: &Path) -> Vec<BrowserSource> {
    let mut out = Vec::new();
    for known in KNOWN_BROWSERS {
        if known.id == "firefox" {
            let profiles = home.join(known.base_rel);
            let mut candidates: Vec<PathBuf> = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&profiles) {
                for entry in entries.flatten() {
                    let dir = entry.path();
                    let name = entry.file_name().to_string_lossy().into_owned();
                    if dir.is_dir()
                        && (name.ends_with(".default-release") || name.ends_with(".default"))
                        && dir.join(known.cookie_rel).is_file()
                    {
                        candidates.push(dir);
                    }
                }
            }
            candidates.sort();
            if let Some(dir) = candidates.into_iter().next() {
                out.push(BrowserSource { id: known.id, label: known.label, kind: known.kind, base: dir });
            }
            continue;
        }
        if known.id == "safari" {
            // Container store first, legacy location as fallback.
            let container = home.join(known.base_rel).join(known.cookie_rel);
            if container.is_file() {
                out.push(BrowserSource {
                    id: known.id,
                    label: known.label,
                    kind: known.kind,
                    base: home.join(known.base_rel),
                });
                continue;
            }
            let legacy = home.join("Library/Cookies/Cookies.binarycookies");
            if legacy.is_file() {
                out.push(BrowserSource {
                    id: known.id,
                    label: known.label,
                    kind: known.kind,
                    base: home.join("Library/Cookies"),
                });
            }
            continue;
        }
        let base = home.join(known.base_rel);
        if base.join(known.cookie_rel).is_file() {
            out.push(BrowserSource { id: known.id, label: known.label, kind: known.kind, base });
        }
    }
    out
}

#[cfg(target_os = "macos")]
fn find_source(id: &str) -> Result<BrowserSource, String> {
    let home = home_dir().ok_or("HOME_UNAVAILABLE")?;
    scan_browsers(&home).into_iter().find(|s| s.id == id).ok_or_else(|| "BROWSER_NOT_FOUND".into())
}

// ---------------------------------------------------------------------------
// Imported values (never logged: no Debug impl on purpose)
// ---------------------------------------------------------------------------

pub struct ImportCookie {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub secure: bool,
    pub http_only: bool,
    pub expires: Option<SystemTime>,
}

/// Process-memory password cache. Keyed by browser, host and username.
/// Cleared only on process exit; entries never touch disk, logs or IPC.
#[cfg(target_os = "macos")]
static PASSWORD_CACHE: std::sync::LazyLock<Mutex<HashMap<String, (Zeroizing<Vec<u8>>, SystemTime)>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

#[cfg(target_os = "macos")]
fn cache_password(source: &str, host: &str, username: &str, password: Vec<u8>) {
    if let Ok(mut cache) = PASSWORD_CACHE.lock() {
        if cache.len() >= 64 {
            // Evict the oldest entry; passwords must not accumulate unbounded.
            if let Some(oldest) = cache.iter().min_by_key(|(_, (_, t))| *t).map(|(k, _)| k.clone()) {
                cache.remove(&oldest);
            }
        }
        cache.insert(format!("{source}\0{host}\0{username}"), (Zeroizing::new(password), SystemTime::now()));
    }
}

#[cfg(target_os = "macos")]
fn cached_password(source: &str, host: &str, username: &str) -> Option<Zeroizing<Vec<u8>>> {
    PASSWORD_CACHE
        .lock()
        .ok()?
        .get(&format!("{source}\0{host}\0{username}"))
        .map(|(pw, _)| pw.clone())
}

/// Cookie domain match: exact host or a subdomain of a (possibly dot-led)
/// cookie domain. Both sides are lowercased ASCII hostnames in practice.
fn domain_match(cookie_domain: &str, host: &str) -> bool {
    let domain = cookie_domain.trim_start_matches('.').to_lowercase();
    let host = host.to_lowercase();
    if domain.is_empty() || host.is_empty() {
        return false;
    }
    host == domain || host.ends_with(&format!(".{domain}"))
}

fn origin_host(origin: &str) -> Result<String, String> {
    url::Url::parse(origin)
        .ok()
        .and_then(|u| u.host_str().map(str::to_owned))
        .filter(|h| !h.is_empty() && h.len() <= 253)
        .ok_or_else(|| "INVALID_ORIGIN".into())
}

// ---------------------------------------------------------------------------
// Safari binarycookies
// ---------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn u32be_at(data: &[u8], off: usize) -> Option<u32> {
    data.get(off..off + 4).map(|s| u32::from_be_bytes([s[0], s[1], s[2], s[3]]))
}

#[cfg(target_os = "macos")]
fn f64be_at(data: &[u8], off: usize) -> Option<f64> {
    data.get(off..off + 8).map(|s| {
        f64::from_be_bytes([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]])
    })
}

#[cfg(target_os = "macos")]
fn cstr_at(data: &[u8], off: usize, limit: usize) -> Option<String> {
    if off >= limit || limit > data.len() {
        return None;
    }
    let end = data.get(off..limit)?.iter().position(|&c| c == 0)?;
    if end == 0 || end > 4096 {
        return None;
    }
    std::str::from_utf8(&data[off..off + end]).ok().map(str::to_owned)
}

/// Mac absolute time (seconds since 2001-01-01) to SystemTime.
/// Non-positive values mean session cookies (no expiry).
#[cfg(target_os = "macos")]
fn mac_absolute_to_system_time(value: f64) -> Option<SystemTime> {
    if !value.is_finite() || value <= 0.0 || value > 4_000_000_000.0 {
        return None;
    }
    UNIX_EPOCH.checked_add(std::time::Duration::from_secs_f64(value + 978_307_200.0))
}

/// Parse a Cookies.binarycookies store. Bounds-checked throughout: a corrupt
/// file fails closed instead of panicking. Flag interpretation (secure bit 0,
/// httponly bit 2) follows the public format; both flags only widen or
/// narrow delivery on HTTPS origins, which covers every provider website.
#[cfg(target_os = "macos")]
fn parse_binarycookies(data: &[u8]) -> Result<Vec<ImportCookie>, String> {
    if data.len() < 8 || &data[0..4] != b"cook" {
        return Err("NOT_SAFARI_COOKIES".into());
    }
    let pages = u32be_at(data, 4).ok_or("TRUNCATED_HEADER")? as usize;
    if pages == 0 || pages > 4096 {
        return Err("PAGE_COUNT_LIMIT".into());
    }
    let mut sizes = Vec::with_capacity(pages);
    let mut cursor = 8usize;
    for _ in 0..pages {
        let size = u32be_at(data, cursor).ok_or("TRUNCATED_PAGE_TABLE")? as usize;
        if size < 16 || size > 32 * 1024 * 1024 {
            return Err("PAGE_SIZE_LIMIT".into());
        }
        sizes.push(size);
        cursor = cursor.saturating_add(4);
    }
    let mut out = Vec::new();
    for size in sizes {
        if cursor + size > data.len() {
            return Err("TRUNCATED_PAGE".into());
        }
        let page = &data[cursor..cursor + size];
        cursor += size;
        if page.len() < 12 || &page[0..4] != b"pbak" {
            return Err("PAGE_MAGIC_MISMATCH".into());
        }
        let count = u32be_at(page, 8).ok_or("TRUNCATED_PAGE_HEADER")? as usize;
        if count > 100_000 {
            return Err("COOKIE_COUNT_LIMIT".into());
        }
        for n in 0..count {
            let record_off = u32be_at(page, 12 + n * 4).ok_or("TRUNCATED_OFFSETS")? as usize;
            if let Some(cookie) = parse_binarycookies_record(page, record_off) {
                out.push(cookie);
            }
            if out.len() > 100_000 {
                return Err("COOKIE_COUNT_LIMIT".into());
            }
        }
    }
    Ok(out)
}

#[cfg(target_os = "macos")]
fn parse_binarycookies_record(page: &[u8], off: usize) -> Option<ImportCookie> {
    let size = u32be_at(page, off)? as usize;
    if size < 56 || off + size > page.len() {
        return None;
    }
    let end = off + size;
    let flags = u32be_at(page, off + 4)?;
    let domain = cstr_at(page, off + u32be_at(page, off + 12)? as usize, end)?;
    let name = cstr_at(page, off + u32be_at(page, off + 16)? as usize, end)?;
    let path = cstr_at(page, off + u32be_at(page, off + 20)? as usize, end).unwrap_or_else(|| "/".into());
    let value = cstr_at(page, off + u32be_at(page, off + 24)? as usize, end).unwrap_or_default();
    if domain.is_empty() || domain.len() > 253 || name.is_empty() || name.len() > 4096 || value.len() > 65536 {
        return None;
    }
    let expiry = f64be_at(page, off + 40).and_then(mac_absolute_to_system_time);
    if let Some(when) = expiry {
        if when <= SystemTime::now() {
            return None;
        }
    }
    Some(ImportCookie {
        name,
        value,
        domain,
        path: if path.is_empty() { "/".into() } else { path },
        secure: flags & 0x1 != 0,
        http_only: flags & 0x4 != 0,
        expires: expiry,
    })
}

#[cfg(target_os = "macos")]
fn safari_cookie_file(source: &BrowserSource) -> PathBuf {
    if source.id == "safari" && source.base.ends_with("Cookies") {
        source.base.join("Cookies.binarycookies")
    } else {
        source.base.join("Library/Cookies/Cookies.binarycookies")
    }
}

#[cfg(target_os = "macos")]
fn read_safari_cookies(source: &BrowserSource, host: &str) -> Result<Vec<ImportCookie>, String> {
    let path = safari_cookie_file(source);
    let data = std::fs::read(&path).map_err(|_| "BROWSER_STORE_UNREADABLE")?;
    if data.len() > 256 * 1024 * 1024 {
        return Err("STORE_SIZE_LIMIT".into());
    }
    Ok(parse_binarycookies(&data)?
        .into_iter()
        .filter(|c| domain_match(&c.domain, host))
        .collect())
}

// ---------------------------------------------------------------------------
// Chromium (Chrome, Brave, Edge, Arc)
// ---------------------------------------------------------------------------

/// Copy a possibly-locked SQLite store to a temp file so the source profile
/// is only ever read, never locked or modified.
#[cfg(target_os = "macos")]
fn copy_store_to_temp(src: &Path, tag: &str) -> Result<PathBuf, String> {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dest = std::env::temp_dir().join(format!("codemax-import-{tag}-{nonce}-{}.db", std::process::id()));
    std::fs::copy(src, &dest).map_err(|_| "BROWSER_STORE_UNREADABLE")?;
    Ok(dest)
}

#[cfg(target_os = "macos")]
fn open_copy(src: &Path, tag: &str) -> Result<(Connection, PathBuf), String> {
    let dest = copy_store_to_temp(src, tag)?;
    let db = Connection::open_with_flags(&dest, OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|_| "STORE_OPEN_FAILED")?;
    Ok((db, dest))
}

/// Chromium timestamps: microseconds since 1601-01-01. Zero means session.
#[cfg(target_os = "macos")]
fn chromium_time_to_system_time(stamp: i64) -> Option<SystemTime> {
    if stamp <= 0 {
        return None;
    }
    let unix_micros = (stamp as i128) - 11_644_473_600_000_000i128;
    if unix_micros < 0 {
        return None;
    }
    UNIX_EPOCH.checked_add(std::time::Duration::from_micros(unix_micros as u64))
}

#[cfg(target_os = "macos")]
fn oscrypt_key(service: &str, account: &str) -> Result<Zeroizing<Vec<u8>>, String> {
    get_generic_password(service, account)
        .map(Zeroizing::new)
        .map_err(|_| format!("KEYCHAIN_ACCESS_DENIED: approve the macOS prompt for '{service}' to import from this browser"))
}

#[cfg(target_os = "macos")]
fn pbkdf2_sha1(password: &[u8], salt: &[u8], rounds: u32, out: &mut [u8]) -> Result<(), String> {
    use hmac::Hmac;
    use sha1::Sha1;
    pbkdf2::pbkdf2::<Hmac<Sha1>>(password, salt, rounds, out).map_err(|_| "KDF_FAILED")?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn pbkdf2_sha256(password: &[u8], salt: &[u8], rounds: u32, out: &mut [u8]) -> Result<(), String> {
    use hmac::Hmac;
    use sha2::Sha256;
    pbkdf2::pbkdf2::<Hmac<Sha256>>(password, salt, rounds, out).map_err(|_| "KDF_FAILED")?;
    Ok(())
}

/// v10: 'v10' + 16-byte IV + AES-128-CBC (PBKDF2-SHA1, saltysalt, 1003).
#[cfg(target_os = "macos")]
fn decrypt_v10(blob: &[u8], password: &[u8]) -> Result<Vec<u8>, String> {
    use cbc::cipher::{block_padding::Pkcs7, BlockDecryptMut, KeyIvInit};
    if blob.len() < 3 + 16 + 16 || &blob[0..3] != b"v10" {
        return Err("BAD_V10_SHAPE".into());
    }
    let mut key = [0u8; 16];
    pbkdf2_sha1(password, b"saltysalt", 1003, &mut key)?;
    let mut buffer = blob[19..].to_vec();
    cbc::Decryptor::<aes::Aes128>::new_from_slices(&key, &blob[3..19])
        .map_err(|_| "V10_KEY_ERROR")?
        .decrypt_padded_mut::<Pkcs7>(&mut buffer)
        .map(|plain| plain.to_vec())
        .map_err(|_| "V10_DECRYPT_FAILED".to_owned())
}

/// v11: 'v11' + 12-byte nonce + AES-256-GCM ciphertext. The exact KDF
/// parameters varied across Chromium releases, so audited candidates are
/// tried in order; GCM authentication decides, so a wrong guess can only
/// fail closed, never yield wrong plaintext.
#[cfg(target_os = "macos")]
fn decrypt_v11(blob: &[u8], password: &[u8]) -> Result<Vec<u8>, String> {
    use aes_gcm::{
        aead::{Aead, KeyInit},
        Aes256Gcm, Nonce,
    };
    if blob.len() < 3 + 12 + 16 || &blob[0..3] != b"v11" {
        return Err("BAD_V11_SHAPE".into());
    }
    let nonce = Nonce::from_slice(&blob[3..15]);
    let ciphertext = &blob[15..];
    let mut key32 = [0u8; 32];
    // Candidate 1: PBKDF2-SHA256, 10031 rounds.
    pbkdf2_sha256(password, b"saltysalt", 10031, &mut key32)?;
    if let Ok(plain) = Aes256Gcm::new_from_slice(&key32)
        .map_err(|_| "V11_KEY_ERROR")?
        .decrypt(nonce, ciphertext)
    {
        return Ok(plain);
    }
    // Candidate 2: PBKDF2-SHA1, 1003 rounds, 32-byte key.
    pbkdf2_sha1(password, b"saltysalt", 1003, &mut key32);
    Aes256Gcm::new_from_slice(&key32)
        .map_err(|_| "V11_KEY_ERROR")?
        .decrypt(nonce, ciphertext)
        .map_err(|_| "V11_DECRYPT_FAILED".into())
}

#[cfg(target_os = "macos")]
fn decrypt_chromium_value(blob: &[u8], password: &[u8]) -> Result<Vec<u8>, String> {
    if blob.len() >= 3 && &blob[0..3] == b"v10" {
        decrypt_v10(blob, password)
    } else if blob.len() >= 3 && &blob[0..3] == b"v11" {
        decrypt_v11(blob, password)
    } else {
        Err("UNKNOWN_VALUE_VERSION".into())
    }
}

#[cfg(target_os = "macos")]
struct ChromiumProfile {
    cookies_db: PathBuf,
    logins_db: Option<PathBuf>,
    service: &'static str,
    account: &'static str,
}

#[cfg(target_os = "macos")]
fn chromium_profile(source: &BrowserSource, wanted_profile: Option<&str>) -> Result<ChromiumProfile, String> {
    let known = KNOWN_BROWSERS.iter().find(|k| k.id == source.id).ok_or("BROWSER_NOT_FOUND")?;
    let profile = wanted_profile
        .filter(|p| !p.is_empty() && p.len() <= 64 && p.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == ' '))
        .unwrap_or(known.chromium_profile.unwrap_or("Default"));
    if profile.contains('/') || profile.contains('\\') || profile.contains('\0') || profile == "." || profile == ".." {
        return Err("INVALID_PROFILE".into());
    }
    let dir = source.base.join(profile);
    let cookies_db = dir.join("Cookies");
    if !cookies_db.is_file() {
        return Err("BROWSER_PROFILE_MISSING".into());
    }
    let logins_db = known
        .login_rel
        .map(|rel| source.base.join(rel))
        .filter(|p| p.is_file());
    let (service, account) = match known.kind {
        SourceKind::Chromium { service, account } => (service, account),
        _ => return Err("BROWSER_NOT_FOUND".into()),
    };
    Ok(ChromiumProfile { cookies_db, logins_db, service, account })
}

#[cfg(target_os = "macos")]
fn read_chromium_cookies(source: &BrowserSource, host: &str) -> Result<Vec<ImportCookie>, String> {
    let profile = chromium_profile(source, None)?;
    let (db, _temp) = open_copy(&profile.cookies_db, "cookies")?;
    let _cleanup = TempCleanup(_temp);
    // The encryption key is only fetched when an encrypted value is met, so
    // previews of plaintext-only profiles never trigger a keychain prompt.
    let mut key: Option<Zeroizing<Vec<u8>>> = None;
    let mut stmt = db
        .prepare("SELECT host_key, name, value, path, expires_utc, is_secure, is_httponly, encrypted_value FROM cookies")
        .map_err(|_| "STORE_QUERY_FAILED")?;
    let now = SystemTime::now();
    let mut out = Vec::new();
    let rows = stmt.query([]).map_err(|_| "STORE_QUERY_FAILED")?;
    let mut rows = rows;
    while let Some(row) = rows.next().map_err(|_| "STORE_ROW_FAILED")? {
        let domain: String = row.get(0).map_err(|_| "STORE_ROW_FAILED")?;
        if !domain_match(&domain, host) {
            continue;
        }
        let name: String = row.get(1).map_err(|_| "STORE_ROW_FAILED")?;
        let plain: String = row.get(2).map_err(|_| "STORE_ROW_FAILED")?;
        let path: String = row.get(3).map_err(|_| "STORE_ROW_FAILED")?;
        let expires_utc: i64 = row.get(4).map_err(|_| "STORE_ROW_FAILED")?;
        let secure: i64 = row.get(5).map_err(|_| "STORE_ROW_FAILED")?;
        let http_only: i64 = row.get(6).map_err(|_| "STORE_ROW_FAILED")?;
        let encrypted: Vec<u8> = row.get(7).map_err(|_| "STORE_ROW_FAILED")?;
        if name.is_empty() || name.len() > 4096 {
            continue;
        }
        let value = if encrypted.len() >= 3 && (encrypted.starts_with(b"v10") || encrypted.starts_with(b"v11")) {
            if key.is_none() {
                key = Some(oscrypt_key(profile.service, profile.account)?);
            }
            let key = key.as_ref().ok_or("KEYCHAIN_ACCESS_FAILED")?;
            let bytes = decrypt_chromium_value(&encrypted, key).map_err(|_| "COOKIE_DECRYPT_FAILED")?;
            String::from_utf8(bytes).map_err(|_| "COOKIE_DECODE_FAILED")?
        } else if !plain.is_empty() {
            plain
        } else {
            continue;
        };
        if value.len() > 65536 {
            continue;
        }
        let expires = chromium_time_to_system_time(expires_utc);
        if let Some(when) = expires {
            if when <= now {
                continue;
            }
        }
        out.push(ImportCookie {
            name,
            value,
            domain: domain.trim_start_matches('.').to_owned(),
            path: if path.is_empty() { "/".into() } else { path },
            secure: secure != 0,
            http_only: http_only != 0,
            expires,
        });
        if out.len() > 100_000 {
            return Err("COOKIE_COUNT_LIMIT".into());
        }
    }
    Ok(out)
}

#[cfg(target_os = "macos")]
struct TempCleanup(PathBuf);
#[cfg(target_os = "macos")]
impl Drop for TempCleanup {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

#[cfg(target_os = "macos")]
struct RawLogin {
    username: String,
    password: Zeroizing<Vec<u8>>,
    last_used: i64,
}

#[cfg(target_os = "macos")]
fn read_chromium_logins(source: &BrowserSource, host: &str) -> Result<Vec<RawLogin>, String> {
    let profile = chromium_profile(source, None)?;
    let logins_db = profile.logins_db.ok_or("LOGINS_UNAVAILABLE")?;
    let (db, _temp) = open_copy(&logins_db, "logins")?;
    let _cleanup = TempCleanup(_temp);
    let mut key: Option<Zeroizing<Vec<u8>>> = None;
    let mut stmt = db
        .prepare("SELECT origin_url, username_value, password_value, date_last_used FROM logins WHERE blacklisted_by_user = 0")
        .map_err(|_| "STORE_QUERY_FAILED")?;
    let mut out = Vec::new();
    let rows = stmt.query([]).map_err(|_| "STORE_QUERY_FAILED")?;
    let mut rows = rows;
    while let Some(row) = rows.next().map_err(|_| "STORE_ROW_FAILED")? {
        let origin_url: String = row.get(0).map_err(|_| "STORE_ROW_FAILED")?;
        let row_host = match url::Url::parse(&origin_url).ok().and_then(|u| u.host_str().map(str::to_owned)) {
            Some(h) => h,
            None => continue,
        };
        if row_host.to_lowercase() != host.to_lowercase() {
            continue;
        }
        let username: String = row.get(1).map_err(|_| "STORE_ROW_FAILED")?;
        let encrypted: Vec<u8> = row.get(2).map_err(|_| "STORE_ROW_FAILED")?;
        let last_used: i64 = row.get(3).unwrap_or(0);
        if username.is_empty() || username.len() > 512 || encrypted.is_empty() {
            continue;
        }
        if key.is_none() {
            key = Some(oscrypt_key(profile.service, profile.account)?);
        }
        let key = key.as_ref().ok_or("KEYCHAIN_ACCESS_FAILED")?;
        let bytes = decrypt_chromium_value(&encrypted, key).map_err(|_| "LOGIN_DECRYPT_FAILED")?;
        if bytes.is_empty() || bytes.len() > 4096 {
            continue;
        }
        out.push(RawLogin { username, password: Zeroizing::new(bytes), last_used });
        if out.len() > 10_000 {
            return Err("LOGIN_COUNT_LIMIT".into());
        }
    }
    out.sort_by(|a, b| b.last_used.cmp(&a.last_used));
    Ok(out)
}

// ---------------------------------------------------------------------------
// Firefox
// ---------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn read_firefox_cookies(source: &BrowserSource, host: &str) -> Result<Vec<ImportCookie>, String> {
    let db_path = source.base.join("cookies.sqlite");
    if !db_path.is_file() {
        return Err("BROWSER_PROFILE_MISSING".into());
    }
    let (db, _temp) = open_copy(&db_path, "ffcookies")?;
    let _cleanup = TempCleanup(_temp);
    let mut stmt = db
        .prepare("SELECT name, value, host, path, expiry, isSecure, isHttpOnly FROM moz_cookies")
        .map_err(|_| "STORE_QUERY_FAILED")?;
    let now = SystemTime::now();
    let mut out = Vec::new();
    let rows = stmt.query([]).map_err(|_| "STORE_QUERY_FAILED")?;
    let mut rows = rows;
    while let Some(row) = rows.next().map_err(|_| "STORE_ROW_FAILED")? {
        let name: String = row.get(0).map_err(|_| "STORE_ROW_FAILED")?;
        let value: String = row.get(1).map_err(|_| "STORE_ROW_FAILED")?;
        let domain: String = row.get(2).map_err(|_| "STORE_ROW_FAILED")?;
        let path: String = row.get(3).map_err(|_| "STORE_ROW_FAILED")?;
        let expiry: i64 = row.get(4).map_err(|_| "STORE_ROW_FAILED")?;
        let secure: i64 = row.get(5).map_err(|_| "STORE_ROW_FAILED")?;
        let http_only: i64 = row.get(6).map_err(|_| "STORE_ROW_FAILED")?;
        if name.is_empty() || name.len() > 4096 || value.len() > 65536 || !domain_match(&domain, host) {
            continue;
        }
        let expires = if expiry <= 0 {
            None
        } else {
            UNIX_EPOCH.checked_add(std::time::Duration::from_secs(expiry as u64))
        };
        if let Some(when) = expires {
            if when <= now {
                continue;
            }
        }
        out.push(ImportCookie {
            name,
            value,
            domain: domain.trim_start_matches('.').to_owned(),
            path: if path.is_empty() { "/".into() } else { path },
            secure: secure != 0,
            http_only: http_only != 0,
            expires,
        });
        if out.len() > 100_000 {
            return Err("COOKIE_COUNT_LIMIT".into());
        }
    }
    Ok(out)
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn cookies_for_origin(source: &BrowserSource, host: &str) -> Result<Vec<ImportCookie>, String> {
    match source.kind {
        SourceKind::Safari => read_safari_cookies(source, host),
        SourceKind::Chromium { .. } => read_chromium_cookies(source, host),
        SourceKind::Firefox => read_firefox_cookies(source, host),
    }
}

#[cfg(target_os = "macos")]
fn cookie_expiry_time(expires: &Option<SystemTime>) -> Option<time::OffsetDateTime> {
    let duration = (*expires)?.duration_since(UNIX_EPOCH).ok()?;
    time::OffsetDateTime::UNIX_EPOCH
        .checked_add(time::Duration::seconds(duration.as_secs() as i64))
        .and_then(|t| t.checked_add(time::Duration::nanoseconds(duration.subsec_nanos() as i64)))
}

/// Inject cookies into the provider webview's isolated store. Returns the
/// number installed; individual set failures (e.g. races with expiry) do
/// not abort the batch.
#[cfg(target_os = "macos")]
fn install_cookies(view: &Webview, cookies: &[ImportCookie]) -> usize {
    use tauri::webview::cookie::{Cookie as WryCookie, Expiration};
    let mut installed = 0usize;
    for cookie in cookies {
        let mut builder = WryCookie::build((cookie.name.clone(), cookie.value.clone()))
            .domain(cookie.domain.clone())
            .path(cookie.path.clone());
        builder = builder.secure(cookie.secure).http_only(cookie.http_only);
        if let Some(when) = cookie_expiry_time(&cookie.expires) {
            builder = builder.expires(Expiration::DateTime(when));
        }
        if view.set_cookie(builder.build()).is_ok() {
            installed += 1;
        }
    }
    installed
}

/// Login fill script with JSON-embedded credentials: no string surgery, no
/// breakout. Fills the nearest preceding text field plus the first visible
/// password field, then leaves submission to the user on the site's button.
#[cfg(target_os = "macos")]
fn fill_login_script(username: &str, password: &[u8]) -> Result<String, String> {
    let password_text = std::str::from_utf8(password).map_err(|_| "LOGIN_DECODE_FAILED")?;
    let user_json = serde_json::to_string(username).map_err(|_| "LOGIN_ENCODE_FAILED")?;
    let pass_json = serde_json::to_string(password_text).map_err(|_| "LOGIN_ENCODE_FAILED")?;
    Ok(format!(
        r#"(()=>{{const pw=[...document.querySelectorAll('input[type="password"]')].find(e=>e.offsetParent!==null)||document.querySelector('input[type="password"]');if(!pw)return;const all=[...document.querySelectorAll('input')];const user=[...all].reverse().find(e=>e!==pw&&/^(text|email|)$/i.test(e.type||'')&&!e.disabled);const set=(el,v)=>{{const proto=Object.getPrototypeOf(el);const desc=Object.getOwnPropertyDescriptor(proto,'value')||Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');if(!desc||!desc.set)return false;desc.set.call(el,v);el.dispatchEvent(new Event('input',{{bubbles:true}}));el.dispatchEvent(new Event('change',{{bubbles:true}}));return true;}};if(user)set(user,{user});set(pw,{pass});}})()"#,
        user = user_json,
        pass = pass_json
    ))
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Browsers on this machine that can supply sessions. Never touches logins,
/// cookies or the keychain; safe to call for discovery.
#[tauri::command]
pub async fn browser_list_sources(webview: Webview) -> Result<Value, String> {
    crate::views::trusted_main(&webview)?;
    #[cfg(target_os = "macos")]
    {
        let home = home_dir().ok_or("HOME_UNAVAILABLE")?;
        let list: Vec<Value> = scan_browsers(&home)
            .into_iter()
            .map(|s| {
                json!({"browser": s.id, "label": s.label, "kind": s.kind.name(), "passwords": s.kind.passwords_supported()})
            })
            .collect();
        return Ok(Value::Array(list));
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = webview;
        return Err("UNSUPPORTED_PLATFORM".into());
    }
}

/// What a browser holds for one website origin: cookie count plus login
/// usernames. Values and passwords never cross IPC.
#[tauri::command]
pub async fn browser_site_data(webview: Webview, browser: String, origin: String) -> Result<Value, String> {
    crate::views::trusted_main(&webview)?;
    #[cfg(target_os = "macos")]
    {
        if browser.len() > 32 {
            return Err("INVALID_BROWSER".into());
        }
        let source = find_source(&browser)?;
        let host = origin_host(&origin)?;
        // Note: encrypted Chromium profiles prompt for the macOS keychain
        // here, on first contact. Denial fails closed below.
        let cookies = cookies_for_origin(&source, &host)?;
        let mut domains: Vec<String> = cookies.iter().map(|c| c.domain.clone()).collect();
        domains.sort();
        domains.dedup();
        let logins = if source.kind.passwords_supported() {
            match read_chromium_logins(&source, &host) {
                Ok(entries) => {
                    let mut out = Vec::new();
                    for entry in entries {
                        cache_password(source.id, &host, &entry.username, entry.password.to_vec());
                        out.push(json!({"username": entry.username}));
                        if out.len() >= 64 {
                            break;
                        }
                    }
                    out
                }
                // A locked keychain must not hide the cookie preview.
                Err(_) => Vec::new(),
            }
        } else {
            Vec::new()
        };
        return Ok(json!({"cookies": cookies.len(), "domains": domains, "logins": logins}));
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (webview, browser, origin);
        return Err("UNSUPPORTED_PLATFORM".into());
    }
}

/// Install a browser's cookies for one origin into one provider's isolated
/// store. Requires the website tab to be open.
#[tauri::command]
pub async fn browser_import_cookies(webview: Webview, provider_id: u32, browser: String) -> Result<Value, String> {
    crate::views::trusted_main(&webview)?;
    #[cfg(target_os = "macos")]
    {
        if browser.len() > 32 {
            return Err("INVALID_BROWSER".into());
        }
        let app = webview.app_handle().clone();
        let view = app.get_webview(&format!("provider-{provider_id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
        let source = find_source(&browser)?;
        let origin = view.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
        if origin.username() != "" || origin.password().is_some() {
            return Err("VIEW_URL_DENIED".into());
        }
        let host = origin.host_str().ok_or("VIEW_URL_DENIED")?.to_owned();
        // Only install cookies that belong to the website currently open in
        // that tab; cross-origin cookies from the bundle never transfer.
        let cookies = cookies_for_origin(&source, &host)?;
        let total = cookies.len();
        if total > 100_000 {
            return Err("COOKIE_COUNT_LIMIT".into());
        }
        let installed = install_cookies(&view, &cookies);
        return Ok(json!({"imported": installed, "total": total}));
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (webview, provider_id, browser);
        return Err("UNSUPPORTED_PLATFORM".into());
    }
}

/// Fill a previously listed login into the open website's own sign-in form.
/// The password travels Rust-memory to page DOM only; submission stays with
/// the user on the website's button.
#[tauri::command]
pub async fn browser_fill_login(webview: Webview, provider_id: u32, browser: String, username: String) -> Result<Value, String> {
    crate::views::trusted_main(&webview)?;
    #[cfg(target_os = "macos")]
    {
        if browser.len() > 32 || username.is_empty() || username.len() > 512 {
            return Err("INVALID_LOGIN".into());
        }
        let app = webview.app_handle().clone();
        let view = app.get_webview(&format!("provider-{provider_id}")).ok_or("PROVIDER_VIEW_CLOSED")?;
        let source = find_source(&browser)?;
        if !source.kind.passwords_supported() {
            return Err("LOGINS_UNSUPPORTED".into());
        }
        let origin = view.url().map_err(|_| "VIEW_URL_UNAVAILABLE")?;
        let host = origin.host_str().ok_or("VIEW_URL_DENIED")?.to_owned();
        let password = match cached_password(source.id, &host, &username) {
            Some(pw) => pw,
            None => {
                // Cache miss (e.g. after restart): re-read from disk, which
                // may prompt for the keychain again.
                let entries = read_chromium_logins(&source, &host)?;
                let mut found = None;
                for entry in entries {
                    if entry.username == username {
                        found = Some(entry.password.clone());
                    }
                    cache_password(source.id, &host, &entry.username, entry.password.to_vec());
                }
                found.ok_or("LOGIN_NOT_FOUND")?
            }
        };
        let script = fill_login_script(&username, &password)?;
        view.eval(&script).map_err(|_| "FILL_FAILED")?;
        return Ok(Value::Null);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (webview, provider_id, browser, username);
        return Err("UNSUPPORTED_PLATFORM".into());
    }
}
