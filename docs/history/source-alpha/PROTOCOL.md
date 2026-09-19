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

**Nonce framing is not a security boundary against prompt injection.** Website/model output is untrusted, and the receiving harness must enforce its own tool permissions and confirmation rules. This application never executes the model's tools itself.

## Usage and errors

There is no admitted provider tokenizer. OpenAI-style usage may be null; Anthropic numeric counters use an estimated UTF-8-byte heuristic, with `X-Bridge-Usage-Provenance: estimated-utf8-bytes-or-unknown`. This is neither exact token usage nor a mathematical upper bound for every tokenizer. Context window, effective context and provider-reported usage remain null without evidence.

Error codes include AUTH_REQUIRED, PROVIDER_RATE_LIMITED, MODEL_UNAVAILABLE, MAPPING_BROKEN, CONTEXT_LIMIT, SITE_CHANGED, PROVIDER_CONVERSATION_LOST, SESSION_HISTORY_CONFLICT, BROWSER_ERROR, TIMEOUT and CANCELLED. Post-header stream failures emit an error event and close without a success terminal. A disconnected client triggers a stop action; actual website stop behavior requires live qualification.

If a client imposes stricter native formats or sends unsupported mandatory options, it is incompatible until an explicit adapter is implemented and tested. SDK examples in the UI are templates, not evidence that any named coding harness passed.
