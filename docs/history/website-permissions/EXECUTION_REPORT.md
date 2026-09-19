# Website clients, file permissions and tab activity — 0.1.0-dev.3

## Delivered changes

The primary **Connect a client** screen now starts with the signed-in website and its observed model. It does not ask for a provider API key or a provider API base URL. An **Open Z.ai** action opens `https://chat.z.ai/`. Exact GLM-5.3-Flash selection is preferred only when it appears in the observed registry; no model or availability is invented. External coding-harness loopback configuration remains in an optional advanced disclosure. Its local token is still required for security and is not a provider credential.

The built-in file test has a complete Zag implementation: prepare a private synthetic file, request explicit consent, send an ordinary model request through the existing gateway/session/tool path over a private socketpair, validate and execute one exact file read, return the tool result in the same conversation, compare the final response with the random value, revoke and clean up. UI, private IPC, broker, session cleanup and build-time native test source are wired. No production Python or JavaScript filesystem backend is introduced.

Provider pages still receive only `provider_observe`. All custom Tauri commands are now listed in the build-time `AppManifest` so capability permissions also cover commands added in the preceding delivery. The trusted main webview is checked again inside each command. No new remote filesystem or shell permissions were granted.

## Permission policy

Only the app-created `bridge-probe.txt` is eligible. Consent is volatile, bound to a random test ID plus the exact provider and model, single-read, and expires after five minutes. The prompt does not initially contain the random value. `openat` resolves only the exact filename relative to a retained directory descriptor, with no-follow, close-on-exec and nonblocking flags; `fstat` verifies regular-file type, owner, restrictive mode, link count and size before a bounded read. Wrong identities, arbitrary paths, symlinks, hardlinks, special files, repeated reads and expired/revoked grants fail closed. The read must match the original synthetic content. Failure to remove the synthetic file is reported, not silently described as success.

The app creates and deletes its own test artifact. Model-requested writes, deletion, shell commands and general project/home-directory access are not granted. External coding tools remain responsible for their own workspace and command permissions; Bridge cannot claim to enforce another program's filesystem policy.

## Activity indicators

Every website tab and sidebar row has an accessible ring. Actual page-load events, bridge generation, visible enabled stop controls, and assistant `aria-busy` observations drive the busy state. Manual website typing is covered; unrelated background network traffic does not count. A stalled/incomplete mapping is stationary with a **Needs control mapping** label rather than an endless busy animation. Idle/sleeping states use stationary rings. Login, quota and mapping errors show a stationary attention state. Reduced-motion preferences disable rotation without removing the state label. Native completion clears stale busy state before a following tool-result turn is admitted.

## Executed evidence

| Check | Result | Scope |
|---|---|---|
| Svelte compilation | 24 modules, zero warnings | Actual local Svelte 5.48.0 compiler; compiled assets included |
| UI interactions | 15 passed | Actual compiled UI in Chromium; explicit Tauri/provider test doubles |
| Browser agent | 23 passed | Actual `browser/agent.js`, in-memory DOM/transport fixtures, including manual busy/idle and 22-turn continuity |
| Node suite | 20 passed | Six helper tests, three real local HTTP fixture tests, eleven static source/capability checks |
| File-permission cases | 26 passed | Real OS file operations on synthetic temp fixtures using an independent **test-only Python client**, not native Zag |
| Zag static audit | 32 modules; 3,300 qualified calls; no mismatches | Import/export/argument-count checks only, not compilation |
| Native Zag build | Blocked, exit 77 | Compiler absent; native file-probe unit source included in real build script |
| Rust/Tauri native build | Not executed | Cargo/rustc absent |

Detailed evidence is under `tests/evidence/`. The regular build script invokes both native Zag suites before packaging. Full TypeScript typechecking, Vite dependency installation, Zag types/ownership/code generation, native IPC enforcement, WebKitGTK behavior and installation remain unverified in this environment. Static checks do not establish those properties.

## Z.ai / GLM-5.3-Flash live test

In browser automation run `d37e7b98-5d12-4bd7-bcbc-3d96e49d377b`, the normal Z.ai chat website exposed and selected **GLM-5.3-Flash** without requiring login or CAPTCHA in that session. No provider API key was used. It returned this exact requested tool-shaped output:

```json
{"id":"bridge-read-probe","name":"read_file","arguments":{"path":"bridge-probe.txt"}}
```

That output was manually relayed to the local reference test client. Without consent it was denied. After an explicit synthetic-file grant, an actual local read succeeded; replay and malicious scope variations were refused. No personal/project file was inspected.

**The follow-up did not pass.** Run `550b9678-9249-4e62-a1c7-bac12b80968f` was a new website session. GLM declined the manually relayed result because it had no previous tool call in that conversation. There was no verified final echo. The first probe used bare JSON, not the production nonce-framed parser. These two live runs plus the local fixture test do **not** establish native app/harness end-to-end interoperability. The production test is authored to retain its actual conversation; that route needs a native run.

`tests/evidence/zai-live.json` preserves the observed results, including the failure. The automation tool reported screenshots within its runs but returned no reusable image. Packaged screenshots and the GIF are actual captures of the compiled Svelte UI with an explicitly labelled local test provider; they are not screenshots of Z.ai or a native Tauri executable.

## Delivery

The ZIP includes the entire revised source, built UI, tests, reports, screenshots/GIF and updated local Git recovery bundle. No native installer or remote GitHub commit is claimed. GitHub was used to inspect Zag filesystem primitives and the Tauri page-load API. The original masterplan is preserved. Previous reports are historical under `docs/history/`.
