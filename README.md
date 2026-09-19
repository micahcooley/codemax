# Desktop AI Bridge

A browser-first Linux desktop application: open AI chat websites in isolated native webviews, sign in normally, discover their controls and models, and route compatible local clients through an authoritative Zag gateway.

**This delivery contains the application source, the compiled Svelte frontend, screenshots, tests, build scripts and Git recovery history. It does not contain a compiled native installer.** Zag and Rust compilation still need to run on a provisioned Linux x86_64 machine. The browser UI itself was compiled and exercised in Chromium.

## Browser workspace

The browser occupies the central window. Tabs, address bar, navigation, find, zoom, profile controls and a compact inspector surround the website; the seven application views are working interfaces rather than dashboard mockups. Resizable/collapsible panes, keyboard commands, a command palette, light/dark themes and reduced-motion support are included.

- **Native shell:** attached provider webviews, persistent profile directories, window controls, sidecar supervision, scoped IPC, file dialogs and one-shot popup/download permissions.
- **Zag application backend:** provider/model registry, generic symbolic discovery, recorded connector mappings, private state, local API authentication, HTTP/SSE, three protocol adapters, tool framing, session receipts, context admission, quota detection and explicit pre-dispatch fallback.
- **Browser execution:** exact model/reasoning selection, new conversation, prompt submission, incremental response capture, stop, safe inline attachments, semantic rebinding and interactive control picking.
- **Utility views:** searchable models/sessions, client configuration and key controls, activity logs, connector inspection/import/export and persistent settings.

## Build on Linux x86_64

Install Node 22.12+, npm, Rust/Cargo, Git, Python 3, pkg-config and the Tauri Linux development dependencies (WebKitGTK 4.1 and GTK 3 headers). A graphical desktop session is needed to run the app.

```bash
bash build-linux.sh
```

The script fetches the pinned Zag toolchain, installs frontend dependencies, compiles/runs Zag unit and gateway tests, checks/builds the frontend, runs Rust tests and creates `.deb`/AppImage bundles. It stops on a failed prerequisite or test. Output is under `src-tauri/target/release/bundle/`.

For development after prerequisites and `npm install`:

```bash
bash scripts/build-backend.sh
npm run desktop
```

`backend/zag.mod` selects Zag edition 2027. `scripts/bootstrap-zag.sh` pins compiler source revision `abed8aa170ef1bc33e5aca68b99fcdd905a4545f` and verifies the committed compiler Git blob. `ZNC=/absolute/path/to/znc` selects an existing compiler. No foreign-language production-backend fallback is used. Dependency lockfiles need to be generated and reviewed on the build host; this is not a reproducible-binary claim.

## Use

Open a website from **Add website**, sign in in its native webview, and let discovery identify controls. Use **Detector** to pick or record controls when a site needs help. In **Connect a client**, copy the local endpoint and revealed key, select an observed model, and use the appropriate client snippet. The default gateway is `127.0.0.1:7331`; it never automatically binds a public interface. Keys are not provider credentials.

The production window contains no preview host, fake provider registry, extension manifest, or iframe provider implementation. `tests/fixtures/` contains explicitly isolated test doubles; `dist/` does not.

## Executed checks

| Check | Result |
|---|---|
| Actual Svelte compilation | 22 application modules; zero component warnings |
| Compiled UI interaction tests | 13 passed |
| Actual browser-agent tests | 22 passed, including a 22-turn conversation sequence |
| Node/helper/HTTP/static tests | 17 passed |
| Static Zag import/symbol/arity audit | 30 modules, 2,988 qualified calls; no mismatches |
| Native Zag build attempt | Exit 77: compiler absent |
| Rust/Tauri native build | Not run: toolchain absent |

Tests above do not establish live provider compatibility, native WebKitGTK profile isolation, or real coding-harness interoperability. Screenshots show the compiled UI with a labelled deterministic provider fixture—not a live account or a native Tauri run. See `EXECUTION_REPORT.md` and `PROTOCOL.md` for exact scope and limitations.

## Package contents

`src/` Svelte UI · `dist/` compiled UI · `src-tauri/` native host · `backend/` Zag service · `browser/` instrumentation/executor · `screenshots/` UI captures · `tests/` regressions/evidence · `MASTERPLAN.md` unchanged original plan · `RECOVERY.bundle` local Git history.

TNN production control remains gated because this package has no admitted trained detector artifact. The symbolic path operates independently; no invented predictions or qualification results are used. Context/tokenizer values remain unknown unless evidence or explicit user settings exist. See `docs/TNN_HANDOFF.md`.
