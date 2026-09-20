# Revision 3 — website-first setup and bounded built-in file client

No provider API endpoint/key is used for website authentication. External local clients still use the loopback provider protocol and local authentication below. The setup UI now keeps those optional external-harness settings in an advanced disclosure.

New trusted private operations: `filesystem.prepare {provider_id, model}`, `filesystem.allow {test_id, confirmed:true}`, and `filesystem.revoke {test_id}`. None are public HTTP endpoints or provider-webview commands. `state.get` snapshots include `file_probe`: ID, state, provider/model, synthetic path, read/deny counts, grant, exact-proof status, cleanup status and error. They never include the random file value. States are IDLE, PERMISSION_REQUIRED, WAITING_FOR_TOOL, WAITING_FOR_REPLY, PASSED, FAILED and REVOKED.

The built-in client uses a private socketpair and ordinary authenticated Chat requests with a fixed one-file `read_file` schema and a random X-Bridge-Session. It appends the parsed assistant tool request and actual permitted result to the same history; only the verified suffix is forwarded. No fallback/model switch or conversation replacement is admitted. Its file broker executes only that single synthetic read, not arbitrary tools requested by external harnesses. Native execution remains unverified.

Provider snapshots add `browser_busy` for bounded visible stop/busy observations. Native page-load events carry `loading`. These are presentation/activity signals, not permission grants. Idle discovery that needs a mapping is not an active workload.

The older revision-2/alpha material follows as history. Where it says the app never executes any tool, the bounded synthetic-file client above is the only new exception; general file/shell execution remains delegated to each external harness.

---

# Protocol contract — implementation revision 2

The implementation remains a bounded compatibility subset, not a claim of complete wire parity with every hosted API or coding client. Unsupported controls are rejected rather than silently ignored.

## Revision 2 additions

All three routes share the Zag normalized request/session/tool core. Exact named tool choices restrict allowed tool names; `parallel_tool_calls:false` rejects a second call. Responses `reasoning.effort` and `metadata.bridge_reasoning` specify an exact observed website choice, not an assumed mapping from vendor terminology. Missing or ambiguous controls fail explicitly.

Chat `stream_options.include_usage` emits a final usage chunk when requested. All unavailable token accounting remains a UTF-8-byte estimate with explicit bridge provenance; it is not provider-reported exact usage. Context admission includes the configured nominal/user limit, retained estimate, new prompt, reserved output and safety allowance.

User content can include bounded base64 data-URI images/input files or Anthropic base64 image/document blocks. Supported declared media types: PNG, JPEG, WebP, GIF, PDF and plain text. There are at most four files; per-file encoded data is at most 131,072 characters and the browser batch is bounded to 190,000. Empty/noncanonical base64, URL retrieval, local paths, existing website-selected files, disallowed file controls and unsupported input acceptance are rejected. Bytes are never persisted; the canonical session record includes a digest. Attachments are sent only for the new message suffix.

Explicit session IDs and Responses previous-response IDs use persisted canonical-message receipts. Mismatched full histories, replaced system prefixes, lost conversations and cancelled/partially submitted turns cannot silently resume. Opt-in fallback is applied only before dispatch to a new conversation; it never rotates accounts, bypasses quotas or migrates an existing conversation.

Developer diagnostic endpoints are disabled unless the persisted developer setting is enabled. The normal local interface always requires its local key for model listing/inference. `/health` is public on loopback.

The detailed original bounded endpoint/framing contract follows. Where its descriptions of absent attachments, exact reasoning/named tool choice, or restart continuity differ, the revision-2 behavior above and the source are authoritative. No full native execution is claimed by this document.

---

# Protocol contract — source alpha

Protocol serializers and native integration tests are authored but **not compiled or wire-qualified in this delivery**. This is a compatibility subset, not a drop-in claim for Claude Code, Codex, OpenCode or every SDK version.

## Private host transport

The host launches the sidecar directly. stdin/stdout contain UTF-8, newline-delimited JSON with no provider token or password extraction. Frames are decoded only after the complete byte frame arrives. A first frame must be:

```json
{"type":"hello","protocol":1,"backend":"zag","version":"0.1.0-alpha.1","capabilities":["chat-subset","messages-subset","responses-subset","browser-evidence"]}
```

Host requests have `{"v":1,"id":1,"op":"state.get","params":{}}`. ID zero is a one-way observation. Replies have `type=reply`, `id`, `ok`, and either `data` or a bounded error code. Push snapshots use `{"type":"event","name":"snapshot","data":{...}}`. Host lifecycle events use `type=host`; validated browser actions use `type=action`.

`provider.add`, `provider.open`, `provider.close`, `provider.rescan`, `provider.clear_profile`, `connector.record`, `connector.manual_model`, `detector.evidence`, `session.end`, `session.cancel`, `key.reveal`, `key.regenerate`, `settings.update` and `state.get` are trusted UI operations. Internal observation/browser-failure/shutdown operations are blocked in the generic UI proxy. Provider pages have only the bounded `provider_observe` command; their provider ID comes from the Rust caller identity, not their payload.

Key regeneration and profile clearing require an explicit `confirmed:true` operation. A profile-clear acknowledgement acknowledges backend admission; the host can still report a browser/storage error.

## Public loopback API

| Method and path | Authentication | Source behavior |
|---|---|---|
| GET `/health` | Not required | Process health; no account secrets |
| GET `/v1/models` | Required | Normalized observed/user-supplied IDs |
| POST `/v1/chat/completions` | Required | Chat subset, JSON or SSE |
| POST `/v1/messages` | Required | Anthropic Messages subset, JSON or SSE |
| POST `/v1/responses` | Required | Responses subset, JSON or SSE |

Authentication is `Authorization: Bearer sk-local-...` or `x-api-key: sk-local-...`. Supplying both requires both to be valid. The key authenticates this local service only; it is not an upstream credential. A client may use `X-Bridge-Session` or `metadata.bridge_session` to identify a session. Public `/bridge/*` debug endpoints are not enabled.

Only 127.0.0.1 is bound. The Host header must be `127.0.0.1:<port>` or `localhost:<port>`. Browser Origin requests and inappropriate Fetch-Metadata requests are rejected. There is no CORS opt-in. POST uses `application/json` with explicit Content-Length; chunked request bodies, pipelining, transfer encoding, unsupported content types and `Expect` are rejected. These constraints exclude some HTTP clients unless configured appropriately.

## Accepted generation subset

Common top-level fields: `model`, `stream`, `tools`, `tool_choice`, `metadata`. `metadata.bridge_session` is used; other metadata is not persisted or echoed as a general metadata store.

Chat adds `messages`, `max_tokens` or `max_completion_tokens` (not both), and `n=1`. Messages adds `messages`, `system`, required `max_tokens`. Responses adds `input`, `instructions`, `previous_response_id`, and `max_output_tokens`.

Text messages and supported text/tool content blocks are normalized. Image/audio/video/file content is rejected, not silently discarded. Existing Chat function calls/results, Anthropic tool-use/result blocks, and Responses function-call/output items have normalization paths. Tool lists accept at most 32 uniquely named functions and object parameter schemas. Calls accept at most 16 unique IDs per generation. JSON Schema argument validation still belongs in the receiving harness; the bridge checks framing, name, ID and JSON-object structure, not a complete schema dialect.

Unknown top-level fields are rejected. In particular temperature, top_p, reasoning, thinking, response_format, stop, logprobs, seed, attachments, provider-built-in tools, multi-variant generation, store/background/service-tier controls and unsupported stream options cannot be advertised as supported.

Tool choice supports string `auto`, `none`, `required`; Anthropic additionally supports `{ "type":"auto" }` and `{ "type":"any" }`. Forced selection of a named function is not implemented. The generic executor can actuate a native HTML model select but does not qualify arbitrary custom menus, reasoning modes or attachments.

`max_*` is a validated **advisory instruction to the website model**, not an exact provider-enforced token limit. The independent hard generated-output limit is measured in bytes. System/developer/tool roles are serialized as message records inside a web prompt; they do not become provider-native hidden/system roles. No enforcement-equivalence claim is made.

## Session contract

One active provider conversation is mapped to one live harness session. A new session requires a confirmed/discovered New Chat control. Exact canonical prior history plus the assistant result can be stripped so only the suffix is submitted. An explicit bridge session or Responses previous-response ID permits incremental user/tool turns, subject to the session checks.

Ambiguous history, model/provider mismatches, lost website state and concurrent use return conflicts rather than replaying the conversation. Current policy permits one active generation per provider; clients must end the previous session before moving that provider to a different live conversation. Session metadata survives restart, but live history/provider restoration does not. Restored sessions are `PROVIDER_LOST`.

## Streaming and tool framing

Visible assistant changes produce generation deltas. The browser agent checks append-only prefixes, splits UTF-8 safely and refuses rewritten output instead of duplicating text. A rewrite/error never counts as normal completion. Zag parses deltas and emits protocol frames incrementally.

Chat uses chat.completion.chunk deltas, a finish reason and `[DONE]`. Anthropic uses message_start, content_block events and message_delta/message_stop. Responses uses response.created/in_progress, output item/content/text/function events and response.completed. Runtime SDK conformance remains unverified.

Emulated tool syntax is:

```text
<bridge-tool-call nonce="PER_REQUEST_RANDOM_NONCE">{"id":"call_1","name":"read_file","arguments":{"path":"example.txt"}}</bridge-tool-call>
```

The incremental parser tracks JSON nesting, string escapes, fragmented openers/closers, code fences, duplicate IDs, allowlisted tool names and payload limits. Wrong-nonce/escaped/fenced examples are text. Malformed or unfinished frames recover as literal text rather than executable events. Valid arguments are emitted only after the complete frame validates; argument bytes are not forwarded before validation.

**Nonce framing is not a security boundary against prompt injection.** Website/model output is untrusted, and the receiving harness must enforce its own tool permissions and confirmation rules. The public model gateway returns tool calls to the external harness and never executes that harness's tools. The separately user-started built-in MCP runner can execute explicitly approved local MCP calls, as specified below.

## Usage and errors

There is no admitted provider tokenizer. OpenAI-style usage may be null; Anthropic numeric counters use an estimated UTF-8-byte heuristic, with `X-Bridge-Usage-Provenance: estimated-utf8-bytes-or-unknown`. This is neither exact token usage nor a mathematical upper bound for every tokenizer. Context window, effective context and provider-reported usage remain null without evidence.

Error codes include AUTH_REQUIRED, PROVIDER_RATE_LIMITED, MODEL_UNAVAILABLE, MAPPING_BROKEN, CONTEXT_LIMIT, SITE_CHANGED, PROVIDER_CONVERSATION_LOST, SESSION_HISTORY_CONFLICT, BROWSER_ERROR, TIMEOUT and CANCELLED. Post-header stream failures emit an error event and close without a success terminal. A disconnected client triggers a stop action; actual website stop behavior requires live qualification.

If a client imposes stricter native formats or sends unsupported mandatory options, it is incompatible until an explicit adapter is implemented and tested. SDK examples in the UI are templates, not evidence that any named coding harness passed.

## Codemax private MCP / discovery operations

`provider.update` adds optional booleans `exposed`, `scan_enabled`, `dismissed`. `model.update` takes `provider_id`, exact registry `model`, and `enabled`. Browser `capabilities` observations are document/origin bound and whitelisted; see `schemas/capabilities.schema.json`.

Trusted UI-only operations: `mcp.server.add` (label, command, JSON string-array args), `.connect` (server_id, confirmed), `.disconnect`, `.remove` (confirmed), `mcp.tool.update` (alias in `tool`, enabled), `mcp.run.start` (provider_id, model, task, auto_continue, optional turn_budget and work_minutes), `.approve` (run_id, call_id, confirmed, allow_run), `.cancel` (run_id), `.continue` (run_id), `.resume` (run_id). Snapshot fields `mcp_servers` and `mcp_run` provide bounded state. These are **not public model HTTP endpoints** and do not turn Codemax into a remotely exposed MCP server.

`mcp.transport` accepts only id-zero internal host notifications bound to server ID and connection epoch. Zag emits `type:mcp` frames with start/write/stop transport actions. The Rust transport supplies connected/line/closed/error events. No provider page or main-UI proxy can supply arbitrary process output.

MCP task states: IDLE, GENERATING, PERMISSION_REQUIRED, EXECUTING_TOOL, RESULT_READY, PAUSED, COMPLETED, FAILED, CANCELLED. One-time approval is consumed on dispatch; auto_continue controls result submission, not tool permissions. Refer to `docs/MCP_CLIENT.md` for version, transport and byte/count limits.

## Progressive task snapshot additions

`mcp_run.turn_limit`, `work_remaining_seconds`, and `can_resume` distinguish active work from user waiting and safe pauses. `can_resume` is not execution permission: resume revalidates the exact run, catalog, provider and conversation. It only supports the in-memory work-budget pause. `mcp_servers[].progress_message` is bounded untrusted display text. Matching progress does not imply tool success or bypass the one-hour call ceiling.

The new `directory_pick` native command belongs to the trusted main webview ACL/AppManifest only. It returns a user-selected absolute path or null, never file contents. It is unrelated to the external model HTTP API and is unavailable to provider pages.
