# Application architecture

```
Trusted Svelte UI ── scoped commands/events ── Thin Tauri host
                                                │
                     attached provider webviews │ private stdio
                     (untrusted origins)        ▼
                                              Zag
                                   detector / profiles / settings
                                   HTTP / protocols / tools
                                   registry / sessions / receipts
                                                │
                                        127.0.0.1 API
```

## Responsibilities

`src/` contains presentation and ephemeral tab/layout state only. No frontend production HTTP server or fake backend exists. `src/lib/api/native.ts` implements the small Tauri IPC/event boundary; `bridge.ts` subscribes to targeted snapshots and browser/host events.

`src-tauri/` owns native webviews, individual storage directories, view rectangles, window/file APIs, popup/download permissions, and the Zag child process. Its bounded stdio protocol has a startup version handshake, request IDs, reply timeouts, bounded queues and restart supervision. Pending client work is failed rather than replayed after a crash. Provider pages receive only the observation command, never general app/shell/filesystem access.

`backend/` is edition-2027 Zag. It owns private-state locking/atomic file replacement, token generation, loopback admission, HTTP parsing, routing, protocol normalization, SSE, tool parsing, canonical session receipts, settings and provider state. The external interface uses a token distinct from provider authentication. Diagnostics require authenticated clients plus developer mode.

`browser/agent.js` performs origin/document-scoped observation and validated DOM execution. It does not read cookies or authorization headers. Semantic controls and user-confirmed recipes rebind after navigation/redesign. Exact model/reasoning selection, prompt/send, response boundaries, stop and client-supplied attachments are performed inside the provider page, without transferring its credentials.

## State and continuity

Provider storage is retained by its native webview profile. Zag persists metadata, settings, connector recipes, conversation URLs and per-message SHA-256 receipt sequences—not prompts/tool-result transcripts. Receipts verify the client-supplied canonical prefix; only new messages are submitted. On restart the matching provider conversation must be restored before continuation. Cancelled or uncertain turns are expired instead of replayed.

Writes preserve a prior complete main state until the new receipt files and state are written. Missing/corrupt state, origin conflicts, ambiguous controls and incompatible histories fail explicitly. This is application-level durability source, not a claim of proven power-loss durability or resistance to a hostile local administrator.

## Bounds

The process admits at most 32 HTTP clients, four active generations and one active generation per provider. Provider/session/model catalogs and metadata buffers have explicit limits; body, output, tool and inline-file limits are enforced. Idle unpinned provider views can be closed while their profile data remains. No busy-loop UI polling is used.

TNN prediction parsing and safety authority remain separate; the symbolic engine works without a TNN artifact. Research qualification is not silently inferred from the presence of integration source.

## Build and evidence

`build-linux.sh` uses native Zag and Tauri, with no Rust/JavaScript substitution for the gateway. `dist/` is the compiled frontend; it cannot perform native operations when opened as an ordinary webpage. `tests/fixtures/` is separate test infrastructure. See `EXECUTION_REPORT.md` for executed versus native-unverified checks.
