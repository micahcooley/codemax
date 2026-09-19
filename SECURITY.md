# Security boundary

The Svelte application is trusted; provider pages are not. Native capabilities are scoped to the `main` webview rather than every webview in its window. Provider capabilities expose only bounded `provider_observe`. Every observation is checked against its native view, origin and document before Zag accepts it. Provider content cannot invoke shell commands, read arbitrary files or mutate app settings.

Provider cookies, passwords, authentication headers, credit-card fields and credential stores are never extracted. Login occurs within the native profile. Observations summarize semantic controls and bounded network metadata. Response text is captured only for an active generation in its mapped assistant region. Log export uses redacted, bounded metadata. Prompt text/tool results and attachment bytes are not persisted by Zag.

Client authentication uses a random local key. The server binds loopback only; HTTP parsing limits headers/bodies and rejects malformed/ambiguous requests. Key regeneration ends current inference. Quotas/auth failures stop without retries or account rotation. Explicit fallback is a user policy restricted to pre-dispatch new requests.

Browser actions have fixed operation types and mapped controls; there is no arbitrary-code executor exposed to the frontend or provider. Sensitive/destructive targets are rejected, and ambiguous mappings fail. The connector recorder writes exact semantic recipes, not user-supplied JavaScript. New document IDs invalidate old actions. Preparation cancellation is checked before prompt submission.

Attachment bytes must arrive from the authenticated API client in bounded canonical base64. No external URL is fetched, no local path is opened, and existing website-selected files are not read/replaced. Platform file upload failure does not become a simulated success. External opening strips URL query/fragment and rejects credential-like paths. Popup/download requests require a one-shot user-granted 60-second allowance; downloaded files are sanitized and never automatically executed.

State directories use restrictive permissions, a single-writer lock and atomic replacement. Digests verify history consistency; they are not encryption and can reveal guesses about low-entropy content to someone with filesystem access. Same-user/admin compromise, native WebKit bugs and full physical power-loss guarantees are outside the established evidence.

TNN output does not grant execution authority. Native security, OS profile isolation, live-site behavior and fuzzing remain unverified here. Executed static and Chromium fixture tests are catalogued in `EXECUTION_REPORT.md`.


## Built-in synthetic-file client (revision 3)

The general provider gateway still does not execute external clients' arbitrary tools. Its one built-in test client is a deliberately separate, permissioned Zag component. The trusted UI can prepare a synthetic file, then must explicitly approve a single read bound to that test/provider/model. Preparation is not consent. The webpage never receives `filesystem.*` IPC or direct file APIs. The internal client goes through the normal authenticated protocol/parser/session path over a private socketpair, without asking the user to copy a local key.

The allowlist admits only `read_file` with exactly one `path` argument equal to `bridge-probe.txt`. No normalization makes other paths eligible. The volatile grant expires, is consumed before I/O, and is not persisted. A retained directory descriptor, O_NOFOLLOW/O_NONBLOCK, owner/mode/type/link/size checks and comparison against the independently generated value constrain the read. The model is not trusted to report that a file was accessed. Proof requires the actual broker read plus an exact final match. Cleanup failure is surfaced. The app's own synthetic-file creation/removal is not model write/delete authority.

External harnesses retain their own file, folder and command policy. There is no blanket machine-access toggle. Native enforcement is authored and statically checked but not executed here; the actual OS adversarial cases run in an independent test-only client. See the execution report for that distinction and the failed new-session live follow-up.

## MCP process trust and task grants

MCP server startup requires explicit user confirmation of executable and separate argv. Merely visiting a website, discovering a provider, importing a config or receiving a model tool call cannot launch a server. The browser-observation command cannot submit `mcp.transport`; only the host's internal pipe events can. The trusted UI proxy also rejects that internal operation.

A connected server starts with every tool disabled. Enabled schemas may be shared with the selected website during a user-started task. Calls require a pending task/call ID, valid model/conversation, unchanged server epoch/catalog binding and either one-time consent or an explicitly selected broader per-tool grant for that one task. The broader grant permits differing arguments and is not misrepresented as a path sandbox. No grant is persisted. Catalog/connection changes, navigation loss, disabled exposure, cancellation and expiry revoke it.

Third-party MCP servers are user-trusted executables, **not OS-sandboxed** by Codemax. Minimal inherited environment and bounded process-group cleanup do not stop malicious local code from using the user's filesystem/network or escaping a process group. Do not approve untrusted executables. No automatic import of environment secrets, remote OAuth, roots, sampling or embedded link fetch is enabled. Tool descriptions and returned content are untrusted data; full tool JSON Schema validation remains the server's responsibility.

Automatic browser execution checks for an existing draft and composer changes before send. Failures preserve user text rather than spending quota on a changed message. The security claims here describe source boundaries and the verified Chromium helper cases, not a completed native security audit.
