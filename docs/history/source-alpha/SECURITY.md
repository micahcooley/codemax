# Security model and review boundaries

This is an **unqualified source alpha**, not a security-audited application. Static checks and synthetic Chromium tests passed; native Tauri/WebKitGTK/Zag isolation and malformed-input tests have not run. Do not deploy it as a public gateway or a trusted production credential container.

## Trust boundaries

The bundled Svelte UI, thin Rust orchestration and Zag backend are trusted application components. Provider pages, subframes, browser events, model output and local clients are untrusted. Only the operating system's normal native webview storage owns provider authentication. Browser instrumentation does not read document.cookie, authentication headers, browser credential stores, password fields, card/security-code inputs or request/response bodies for capture.

The generic provider command can deliver observations; it cannot execute shell commands, read files, access the local API key or call general UI commands. Main permissions are scoped to the `main` webview, not its parent window. Host events explicitly target that webview. Remote capabilities have no event-listen, shell, filesystem or generic bridge-request grant.

### Important limitations

Tauri's documented Linux remote-origin behavior cannot distinguish some iframe callers from the containing window. Accordingly, the provider observation channel is treated as forgeable hostile input even with an origin check. Structural source checks do not prove native permission enforcement. Test real `invoke`/event/file-read attacks on WebKitGTK before release.

Initialization runs in a page environment controlled by the website. A malicious page can forge labels, functions or response contents, or withhold observations. Origin/document correlation and bounded schemas are not proof that the semantic evidence is truthful. The app must remain limited to approved interaction types; arbitrary JavaScript selectors or OS commands cannot be accepted from learned output.

No redactor can identify every possible secret disguised as ordinary visible text. The source minimizes capture, rejects known-sensitive fields and masks recognizable token patterns, but does not claim perfect secret detection on malicious websites. Actual conversation content must pass through the gateway to serve the client; that is not the same as diagnostic capture. It is kept in bounded process memory, not persisted as a default trace.

## Local gateway

The Linux listener is hard-coded to IPv4 loopback. Authorization applies to models and inference. First-use keys use Linux getrandom; files are private, owner-checked and symlink-resistant at the final path. Key regeneration invalidates clients after persisting the new value. Host and Origin checks limit browser-based localhost attacks. There are no arbitrary filesystem endpoints, provider-cookie export, automatic credential extraction or shell evaluation.

An authorized local OS user can ordinarily inspect their own processes, clipboard and files. This design does not protect against a compromised user account or kernel. The API key is encrypted neither by a keychain nor at rest beyond filesystem permissions in this alpha. UI reveal lasts 15 seconds; copying deliberately places it on the system clipboard. Do not place keys into shared logs or source files.

## Bounds and recovery

All host/event/HTTP/generation buffers have explicit caps. Duplicate JSON keys, malformed UTF-8, oversized payloads and invalid header structures are rejected in the Zag source. Incoming frames and pending requests are bounded. Cancellation and timeout issue provider stop actions. Native parser/ownership/overflow behavior still requires compilation, fuzzing and sanitizer-equivalent tests where supported.

State writes use exclusive randomly named temporary files, fsync and atomic rename; an advisory lock prevents two compliant sidecars from writing one state root. These Linux ABI paths are not executed by the current JavaScript tests. Parent-directory filesystem attacks and WebKitGTK cache/profile-close timing require further native hardening tests. Memory overwriting is best effort, not compiler-guaranteed secure erasure.

## Browser action policy

The generic executor accepts only bounded generate/stop/scan data, rechecks sensitive target classes and document IDs, and checks configured origin. Downloads and new-window requests are denied. Navigation allows ordinary HTTPS authentication redirects but instrumentation is origin-scoped. Billing/security/account-deletion actions are not supported. Custom connector recipes store tag/role/label semantics, not arbitrary scripts or executable selectors.

Automatic fallback and account/identity rotation are disabled. Visible quota/authentication errors halt work. An explicit user rescan does not authorize bypassing provider restrictions. Use only accounts and website interactions the user is permitted to use; this package does not determine a provider's current contractual permissions.

## Tool and research policy

A parsed tool event is sent to the external client; it is never executed by the bridge. The client must validate parameters and permissions and handle prompt injection. TNN shadow outputs are proposed data only. No TNN artifact is admitted; hybrid/learned automatic control is disabled.

## Required native release security tests

Verify remote invoke/file/event access denial, forged/malformed IPC, invalid/oversized HTTP, bad auth and token rotation, DNS rebinding headers, path/symlink manipulation, stream floods, provider navigation races, clipboard/profile separation, corrupted state, repeated crash recovery and key/log privacy on the actual supported native platform. Add measured evidence to release gates, not just an assertion that these paths compile.
