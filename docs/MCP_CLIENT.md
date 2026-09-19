# Built-in MCP client and website task runner

## Reference and scope

MCP SuperAssistant documents tool-call detection, execution, result insertion, auto-execute and auto-submit in an extension plus proxy. Codemax implements that workflow in its desktop architecture, alongside a separate model gateway. This is a design/implementation distinction, not a verified performance or reliability superiority claim. References: the MCP SuperAssistant README and official quick-start guide, linked in SOURCES.md.

The current client supports user-confirmed **local stdio** servers. It does not treat a remote HTTP/SSE URL as a command, silently import authentication environment variables, install servers in the background, or claim remote MCP/OAuth support. Existing installed servers can be entered directly or imported from `mcpServers` command/arguments entries. Servers requiring extra credentials must be provisioned by the user outside automatic import; no credentials are scavenged from other apps.

## Sequence and actual ownership

1. The user configures a command and JSON argv, then separately consents to launching that exact executable and arguments.
2. Rust starts the child with separate arguments, no shell interpretation, a private working directory, bounded stdio, and a minimal environment.
3. Zag negotiates capabilities/version and discovers the tool catalog. Every tool starts disabled. The user enables the tools to offer the website model.
4. The user starts a task in Tools & MCP. Zag freezes the model, server epochs, exact tool names/schemas/enabled state, and a unique task/session ID. It automatically builds the instruction/tool context and sends the first request through the existing normalized HTTP/session path.
5. Browser execution selects the requested observed model/reasoning controls, starts the conversation, inserts the prompt, sends, and captures output. It preserves drafts and refuses modified composers.
6. A complete, nonce-framed tool call is parsed by Zag. It must name one of the enabled tools and have bounded JSON-object arguments. The user reviews server, tool, exact arguments, and website result destination.
7. After approval, Zag sends `tools/call` through the stdio transport. The result becomes untrusted role-tool content. It is never evaluated as executable code or followed as an embedded resource URL.
8. The result is returned through the same task/session and receipt-checked conversation. With automatic continuation enabled, the next message is inserted/sent automatically. With it disabled, the user chooses **Insert result and send**.

Only a user-started task owns this automation. Ordinary text on a visited page cannot start a native process or authorize tools. Automatic task execution is not an ambient listener that grants filesystem access to arbitrary website chats.

## Consent semantics

**Allow once** applies only to the pending task ID and call ID, the frozen model/session, the enabled tool and connection/catalog binding, and the exact already-decoded arguments. The pending state is consumed when dispatched. A stale response, repeated approval, replaced call, disconnected server, changed observed catalog, disabled model/provider, or lost conversation cannot reuse that approval.

**Allow this tool for the rest of this task** is an optional Advanced control. It permits subsequent calls to the same tool **with different arguments** during that one task. It is deliberately labelled as broader than an exact-file/path grant. It is not on by default and does not persist across task completion, cancellation, timeout, reconnect or restart.

Tool-server descriptions and read-only hints are untrusted metadata, not permission grants. The client checks identities, argument-object structure and size; the server owns its tool's complete JSON Schema validation. No full local JSON Schema validator is claimed.

Process trust and tool-call consent are separate. An MCP server is a local executable running as the user. A malicious trusted executable could read files, use the network, or escape its process group independently of a tool call. Codemax's approval UI is **not an OS sandbox for that executable**. Use servers that the user trusts, with their own restricted directory settings or a separately provisioned sandbox.

## Versions and supported operations

The native source handles legacy MCP initialization/initialized and tool list/call exchanges for negotiated versions 2024-11-05, 2025-03-26, 2025-06-18, and 2025-11-25. The initial version offer is 2025-11-25. A numeric `-32601` method-not-found response triggers explicit 2026-07-28 `server/discover`, checks the offered supported versions, and supplies per-request protocol/client metadata. A non-complete 2026 result is not accepted as a finished call.

Supported operations: initialize/discovery, ping, tools/list pagination, tools/call, and received legacy `notifications/tools/list_changed`. List changes invalidate enabled choices and task bindings. There is no 2026 subscriptions/listen implementation; an unannounced catalog mutation cannot be detected magically. Reconnect to refresh such catalogs. Sampling, roots, elicitation, async task handles, multi-round-trip results, resource fetching, remote HTTP/SSE transports and OAuth are not negotiated. Unsupported server requests receive a method error; unsupported call results fail visibly. These protocol paths have native test source, not a native-runtime conformance certification.

Plain content/structured result JSON is supplied as text to the website. Image/audio/resource blocks are not automatically rendered as model vision/audio input. Embedded links are not fetched. A web-search-capable tool can return its actual results; no fabricated search is substituted when one is absent.

## Limits and failure handling

Four configured servers, 16 tools per server, eight catalog pages, 32 argv values, 32 KiB stdio frames, 8 KiB tool arguments, 20 KiB tool results, one active built-in task, one tool call per model turn, 20 model turns and a ten-minute task lifetime. Aggregate request, transcript, definition and binding buffers are separately bounded; a large tool catalog may reach a byte limit before the count limit.

Connect timeout: 15 seconds. MCP request timeout: 30 seconds. Stdio write timeout: three seconds. The transport has a bounded queue and output-rate limit. It drains/discards stderr rather than exposing possible secrets. Stop uses an independent cancellation notification, closes input, then terminates remaining process-group descendants with a bounded grace period. This is not protection against malicious process-group escape or an OS guarantee against kernel stalls.

Task transcripts and broad per-task grants are volatile. Ordinary gateway session metadata/history receipts are persisted by the existing session manager, not a second MCP plaintext transcript. Tool server command/argv configuration is private persisted data; do not place secrets in arguments. Reopening the application does not silently relaunch an executable or restore tool grants.

## Validation on a provisioned Linux host

```bash
bash scripts/test-native.sh
```

This builds/runs native ordinary, file-permission and discovery/MCP unit programs, then the native gateway and `tests/native_mcp.py` integration suites. `native_mcp.py` requires the actual Zag ELF. It launches a real independent Node stdio test server, reads a synthetic file only after native authorization, returns its unpredictable bytes through the same native session, and checks revocation after disabling the model. Browser events and Rust transport are test doubles in that suite; it is not a live website or Tauri test.

For the next boundary, run the actual Tauri desktop and a user-trusted MCP server against an authenticated website. Verify model selection, approvals, repeated results, cancellation, navigation, process exit and quota failure. This release candidate does not claim that native/live check has happened.
