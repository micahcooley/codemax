# Codemax

A dedicated, browser-first desktop application that discovers AI websites as you browse and exposes their observed models to compatible coding clients. Website sessions and website quotas provide inference; no provider API credential is required.

**Delivery:** application source, compiled Svelte frontend, screenshots, tests, Linux build scripts and Git recovery bundle. Native Zag/Rust compilation and live interoperability remain unverified; no native installer is included. Read EXECUTION_REPORT.md before treating this as release-qualified.

## Daily use

Open a website in the address bar and sign in normally. Discovery follows the page and your model/reasoning controls without sending test prompts or opening menus. Ordinary websites remain browser tabs; only positive chat/model evidence admits a provider. Hidden capability data stays unknown until the website exposes it.

Open **Connect a client**, choose your client and a website model, then **Copy private launch command**. That action starts the local gateway when necessary, checks it, and produces a safely quoted command. Paste it into your terminal with the client already installed. No configuration-file overwrite is required. The command contains the local bearer key: clipboard and terminal history may retain it. Manual configuration, export and endpoint/key controls remain under Advanced. A successful gateway health check only verifies the local listener; it does not claim that the client is connected or that a website request succeeded. The localhost access token protects the client-to-Codemax connection, not access to a paid model API. The registry and generated configuration update as models are observed. A client that caches a fixed model list may need refresh/restart or an updated export.

**Providers** controls which sites and models are exposed. Context, tokenizer and reasoning evidence are visible; overrides, recorder tools and lifecycle settings are under Advanced. Turning off a site or model removes it from the gateway and revokes a conflicting active tool task.

**Tools & MCP** is a separate optional workflow. Open the on-demand Tool library for five pinned external-server recipes, or add/import your own stdio server through More setup. A recipe fills a draft only; review and authorize its executable before connection, select tools, and start a website task. Codemax inserts instructions, asks permission for calls, and returns results into the same conversation. Auto-continuation does not imply automatic execution permission. A broader per-tool grant for that one task is available under Advanced. Servers run as the user and must be trusted; this is not an OS sandbox. Direct remote MCP HTTP/SSE/OAuth is not implemented in this revision.

The synthetic file diagnostic now lives under Tools & MCP → Advanced. It is not required for everyday setup.

## Desktop workspace

A single top tab strip and address bar surround native provider webviews. A collapsible left shelf lists only positively registered providers, including those whose browser tabs are closed. It is not another tab strip: it has no tab close/reorder controls. Clicking a provider reuses or opens its website; its settings appear only on request. Ctrl+Shift+B toggles the shelf. Tools and Connect remain the two main toolbar utilities; the Codemax menu contains the other management pages. The optional connection inspector starts closed and its preference persists. The UI includes back/forward/reload, find, zoom, keyboard shortcuts, a command palette, reorderable tabs, an optional resizable inspector, light/dark themes and reduced motion. Spinning rings indicate loading/generation; stationary rings indicate idle/sleeping or attention states, with accessible labels. Automatic submission preserves unsent drafts and refuses a composer changed by the user.

Limits include 16 origin-isolated profiles, one provider conversation per profile, 32 models per profile, four external generations, and one built-in MCP task at a time. The product does not claim full Chromium parity, arbitrary extensions, multiple simultaneous same-origin conversations, universal provider compatibility or cross-platform qualification.

## Task continuity

The built-in runner now uses a 100-model-turn / 30-active-minute budget by default, configurable under Task options (10–500 turns; 5–240 active minutes). Approval/result waiting is not charged as active work. Exhaustion pauses at a safe boundary, retaining this run’s in-memory transcript, last result and conversation/session ID. **Continue task** extends its budget rather than creating a new task. It revokes broad tool grants and cannot replay a completed tool approval. This is not crash/restart recovery: native execution and the new native regression source remain unverified.

Actual tool progress can extend a five-minute MCP inactivity deadline, with an independent one-hour ceiling. Website generation gets ten minutes of inactivity tolerance and a one-hour ceiling. Quotas, lost authentication, finite context/byte limits, output errors and OS/process failures still require an honest stop or recovery; the application cannot guarantee uninterrupted agents. No automatic side-effect retry is added.

## Interaction behavior

Management pages have their own Back/Forward history. Find and the command palette autofocus; Escape cancels address edits or dismisses the current layer without closing the website underneath. Slow tab activation cannot steal a later selection.

Provider overrides use explicit Save/Reset. Unsent provider edits, tool tasks and server definitions survive navigation in memory, not across application restart. Model/session filters and the Settings section are retained during the app session. Failed saves keep the draft or restore the last saved value as appropriate.

Actions that stop work or remove saved state ask for confirmation. Cancel is initially focused; shortcuts cannot act on browser tabs behind a modal. Stop-task and Deny remain immediate. Tool approval requests stay visible outside the Tools page, while broader permission starts unchecked for each changed call.

Local gateway loss retains the last snapshot, clearly marked as stale, and blocks mutations. Small success notices use the fixed footer instead of shifting the remote website. A ready-model count includes only enabled, exposed and currently available models. Provider credentials remain in website storage; a localhost gateway does not imply that model inference is offline.

## Architecture

Svelte is presentation. Tauri/Rust is the thin webview, window, process and IPC host. **Zag owns discovery, registry, routing, protocol translation, permissions, MCP, task continuation and persistence.** Remote website pages receive only their observation channel and validated browser actions, not filesystem/shell commands. TNN remains gated pending a qualified artifact; symbolic discovery is the active implementation.

The external gateway supports `/v1/models`, `/v1/chat/completions`, `/v1/messages` and `/v1/responses` on authenticated loopback. The protocol subset and error behavior are documented in PROTOCOL.md. Backend source is not replaced by JavaScript/Rust to claim native verification.

## Build and run on Linux x86-64

Required: Node 22.12+, npm, Rust/Cargo, Git, Python 3, pkg-config, GTK 3 and WebKitGTK 4.1 development dependencies. A graphical session is required for the actual desktop.

```bash
bash build-linux.sh
```

The script obtains the pinned Zag toolchain, installs dependencies, runs native and frontend gates, and packages `.deb`/AppImage output under `src-tauri/target/release/bundle/`. It stops on failures. To develop after dependencies are installed:

```bash
bash scripts/build-backend.sh
npm run desktop
```

`backend/zag.mod` selects edition 2027. `scripts/bootstrap-zag.sh` pins Zag revision `abed8aa170ef1bc33e5aca68b99fcdd905a4545f`; `ZNC=/absolute/path/to/znc` selects a provisioned compiler. npm/Cargo lockfiles must be generated and reviewed on a network-enabled build host; reproducible native builds are not claimed.

## Tests and evidence

```bash
npm test
npm run build
python3 tests/ui_browser.py
python3 tests/codemax_ui.py
python3 tests/chrome_ui.py
python3 tests/ux_audit.py
python3 tests/progressive_ux.py
python3 tests/browser_dom.py
bash scripts/test-native.sh
```

The UI scripts above consume the included compiled module-graph distribution. `npm run build` is the separate normal Vite path, not the build used for this evidence. `scripts/build-offline.mjs` rebuilds the fixture-free module graph with an explicitly supplied trusted local Svelte ESM distribution (`SVELTE_RUNTIME_DIR`); the compiler itself is not redistributed.

The native test command requires the real Zag compiler. It includes discovery/MCP native unit tests and a stdio/synthetic-file round trip through the actual compiled backend, with explicit test browser/transport fixtures. That native suite has not run in this environment.

This revision has executable evidence for Svelte compilation (31 modules, zero component warnings), 103 compiled-UI scenarios across five suites, 26 browser-agent scenarios, and 32 Node/helper/HTTP/static/launch-command tests. The command tests execute Bash with explicit stub clients, not actual coding harnesses. Browser/UI fixtures do not establish native Tauri/WebKit, live model, MCP or harness correctness. See EXECUTION_REPORT.md and docs/release-gates.json.

## Documentation

- `docs/PROGRESSIVE_WORKSPACE.md`: current cleanliness/continuity audit and evidence.
- `TOOL_LIBRARY.md`: published version pins, prerequisites and trust limitations.
- `docs/UX_AUDIT.md`: source findings, implemented corrections, scenario-by-scenario evidence and remaining native checks.
- `docs/CODEMAX_WORKFLOW.md`: admission, low-setup UX and model-provider vs MCP distinction.
- `docs/MCP_CLIENT.md`: protocol, consent, limits and native validation instructions.
- `SECURITY.md`: browser and native trust boundaries.
- `PROTOCOL.md`: normalized model protocol and private operations.
- `docs/SOURCES.md`: primary reference research.
- `docs/RECOVERY.md`: restore the full local Git history from RECOVERY.bundle.

The compiled distribution excludes browser test fixtures. No production provider mock, extension manifest, broad remote-page privilege, guessed context limit or simulated native success is included.
