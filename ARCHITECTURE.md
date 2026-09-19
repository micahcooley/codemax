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


## Revision 3 built-in client

`backend/security/file_probe.zag` owns the synthetic-file test state machine and volatile one-read grant. `backend/app.zag` connects its private socketpair to the existing HTTP connection slots. UI operations stay in the main Tauri webview; Rust forwards them and does not implement filesystem business policy. The broker is not a public endpoint and does not give provider pages OS commands. A separate Python test-only reference client exercises real adversarial filesystem fixtures, clearly separated from native evidence.

Tab status combines native page-load events, authoritative gateway activity, and sanitized semantic busy controls. Model discovery status is not automatically ongoing work. No network heartbeat or repeated UI polling is used to manufacture busy state.

## Codemax discovery and MCP amendment

Browser profiles and admitted providers are distinct. `Provider.detected` records positive evidence; `exposed`, `dismissed`, `scan_enabled`, model `enabled` and fresh `available` state govern publication. Svelte derives detected/exposed views rather than inventing model entries. Network metadata is explicit and model-scoped, with unknown and user override provenance preserved.

`backend/mcp/hub.zag` owns stdio MCP negotiation/catalog/call state. `backend/mcp/runner.zag` owns a bounded permissioned website task and its volatile transcript/grants. It uses a private nonblocking socketpair client into the same Zag generation/session path as external model clients. It does not implement a separate model backend. `src-tauri/src/mcp_transport.rs` only starts user-confirmed programs and transports bounded stdio frames; it does not decide permissions or execute model-generated shell text.

MCP tools/consent/continuation are available through the trusted main UI's private operations. Remote provider observation cannot invoke those operations. Tasks are bound to exact server epochs/catalogs/model/session and revalidated at approval. A lost conversation, disabled provider/model or changed catalog revokes the task. Detailed scope and intentionally unnegotiated capabilities are in `docs/MCP_CLIENT.md`.
