# Architecture and source ownership

Status: source implementation, not native/runtime qualification. The uploaded MASTERPLAN is the requirement; deviations below are explicit.

## Presentation

`src/App.svelte` owns navigation/dialog presentation. `lib/state/app.svelte.ts` uses Svelte runes for ephemeral route/pane/UI state and a received backend snapshot. Provider/model/session data comes from Zag push snapshots; the frontend does not own a substitute authoritative registry. `lib/api/bridge.ts` uses scoped Tauri invoke/events. Opening Vite in a normal browser displays a native-host-required state, not fabricated providers or inference responses.

Seven screens are authored: Overview, Provider Browser, Models, Harness Setup, Sessions, Detector Lab and Settings. Native child views are hidden before modal dialogs, on route changes and during host failures. A ResizeObserver and animation-frame coalescing transmit bounded logical view coordinates. There is no 500 ms frontend polling loop.

## Desktop orchestration

`src-tauri/src/host.rs` resolves the external sidecar with Tauri's shell plugin, converts the resolved command to Tokio process plumbing, clears inherited environment variables, and exposes only state-directory/development-fixture settings. It owns stdio framing, bounded queues, a versioned handshake, crash backoff and pending-request rejection. It does not parse/translate provider API requests.

`views.rs` constructs data-directory-separated provider webviews, scopes their initialization scripts to configured origins, blocks automatic downloads and new windows, validates the calling webview for observations, and forwards typed data. Tauri events are addressed to `EventTarget::Webview { label: "main" }`, not an ambiguous parent window label. Capabilities apply to `webviews`, not all child views of a permitted `window`.

This source uses Tauri's **unstable** multi-webview API. Its actual behavior, WebKitGTK profile isolation and render/resize geometry need native qualification. Browser-based tests of Chromium cannot establish those claims. OAuth flows that require popups may fail under the current intentionally strict new-window policy.

## Authoritative Zag service

`backend/app.zag` integrates the event loop and admission decisions. `core/json.zag` has a bounded strict parser and canonicalizer. `server/` owns nonblocking Linux IPv4 loopback sockets, strict HTTP/1.1 request parsing, SSE and client buffers. `protocol/normalized.zag` normalizes the documented subsets and rejects unsupported controls; `protocol/wire.zag` serializes the three response formats.

`providers/registry.zag` owns provider/model state. `browser/evidence.zag` rebuilds a whitelisted observation object; raw payloads never become stored evidence. `detector/symbolic.zag` and `recorder.zag` infer and user-confirm semantic control mappings. `sessions/manager.zag` owns transcript matching and per-provider conversation state. `tools/parser.zag` is a bounded, incremental nonce-scoped JSON framing parser. `storage/` persists metadata and local-token files using owned private paths, exclusive temporary files and atomic replacement.

The service is Linux x86_64 only and uses explicit Linux syscalls. Native ownership/resource, ABI, parser and scheduler correctness remain unverified until compiled and exercised. It is not represented as cross-platform source qualification.

## Resource bounds

| Resource | Source limit |
|---|---|
| Providers / discovered models | 16 / 32 per provider |
| HTTP clients / active generations | 32 / 4 globally; one generation per provider |
| Sessions | 128 retained records |
| HTTP header bytes / fields | 16 KiB / 64 |
| HTTP JSON body | 1 MiB |
| JSON depth / token count | 32 / 8192 |
| Incoming browser observation | 32 KiB |
| Main-to-sidecar host message / host queue | 64 KiB / 128 messages |
| Sidecar-to-host framed message | 1 MiB |
| Prompt / raw generated output | 128 KiB / 128 KiB |
| HTTP active stream pressure | 512 KiB |
| Tool-frame pending payload / calls | 64 KiB / 16 per generation |
| Request / generation timeout | 10 seconds / 120 seconds |
| Active SSE heartbeat | 15 seconds |

These are implementation constants, not measured performance results. Thread/process scheduling, memory use and timeouts need native tests.

## Persistence and recovery

The host creates private data directories. Zag verifies ownership/type/permissions and obtains an advisory instance lock before loading state. State includes providers, confirmed mapping recipes, a manually supplied model label, port configuration and session metadata. The local API token is a separate 0600 file. Browser authentication remains in the webview's native profile storage.

**Full provider conversation restoration across restart is not implemented.** Gateway message bodies are kept in memory only. Restored session metadata is marked `PROVIDER_LOST`; requests are not silently replayed. Restoring live conversation identity reliably is a remaining release gate, not an incidental setting.

## Detector and TNN boundary

The production baseline currently consumes DOM semantics, not learned network request diffs. The browser emits bounded fetch/XHR/WebSocket/EventSource metadata, but the Zag app deliberately does not retain or route raw network diagnostics until a bounded diagnostic schema is qualified.

A bounded TNN shadow-result decoder and a proposed research envelope are included. **No trained TNN artifact is loaded, no shadow comparison campaign ran, and hybrid control is disabled.** There is no working TNN inference plugin masquerading as an enabled mode.

## Key deviations from the complete plan

A live website is not yet qualified. Custom rich editors/model menus, attachment upload, provider-native tools, measured context/tokenizers, reasoning-mode actuation, external navigation controls, updater/auto-start, idle-view suspension, full recorder interaction causality and persistent live conversation restoration remain incomplete. The seven UI screens are source, not verified native UI execution. See `docs/PHASE_STATUS.md` and the execution report.

Implementation references and retrieved primary documentation are listed in `docs/SOURCES.md`.
