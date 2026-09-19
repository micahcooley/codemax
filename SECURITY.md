# Security boundary

The Svelte application is trusted; provider pages are not. Native capabilities are scoped to the `main` webview rather than every webview in its window. Provider capabilities expose only bounded `provider_observe`. Every observation is checked against its native view, origin and document before Zag accepts it. Provider content cannot invoke shell commands, read arbitrary files or mutate app settings.

Provider cookies, passwords, authentication headers, credit-card fields and credential stores are never extracted. Login occurs within the native profile. Observations summarize semantic controls and bounded network metadata. Response text is captured only for an active generation in its mapped assistant region. Log export uses redacted, bounded metadata. Prompt text/tool results and attachment bytes are not persisted by Zag.

Client authentication uses a random local key. The server binds loopback only; HTTP parsing limits headers/bodies and rejects malformed/ambiguous requests. Key regeneration ends current inference. Quotas/auth failures stop without retries or account rotation. Explicit fallback is a user policy restricted to pre-dispatch new requests.

Browser actions have fixed operation types and mapped controls; there is no arbitrary-code executor exposed to the frontend or provider. Sensitive/destructive targets are rejected, and ambiguous mappings fail. The connector recorder writes exact semantic recipes, not user-supplied JavaScript. New document IDs invalidate old actions. Preparation cancellation is checked before prompt submission.

Attachment bytes must arrive from the authenticated API client in bounded canonical base64. No external URL is fetched, no local path is opened, and existing website-selected files are not read/replaced. Platform file upload failure does not become a simulated success. External opening strips URL query/fragment and rejects credential-like paths. Popup/download requests require a one-shot user-granted 60-second allowance; downloaded files are sanitized and never automatically executed.

State directories use restrictive permissions, a single-writer lock and atomic replacement. Digests verify history consistency; they are not encryption and can reveal guesses about low-entropy content to someone with filesystem access. Same-user/admin compromise, native WebKit bugs and full physical power-loss guarantees are outside the established evidence.

TNN output does not grant execution authority. Native security, OS profile isolation, live-site behavior and fuzzing remain unverified here. Executed static and Chromium fixture tests are catalogued in `EXECUTION_REPORT.md`.
