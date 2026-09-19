# Implementation delivery — September 19, 2026

## Delivered

Version `0.1.0-dev.2` replaces the supplied source-alpha interface and fills its desktop/browser/backend wiring gaps. It contains source and a built frontend, not a native executable. The original masterplan is preserved byte-for-byte.

The central surface is an attached native provider webview. The production application has no extension and no provider iframe. Rust handles OS/webview/process boundaries; Zag remains authoritative for providers, detection, configuration, sessions, routing and protocol logic.

### Changes in this round

Browser-first chrome with reorderable tabs, address/navigation controls, native find/zoom, persistent workspace layout, resizable/collapsible panes, keyboard shortcuts, command palette, theme/density/reduced-motion settings and scoped window controls. Every application view has data/actions connected to the host/backend interfaces.

Completed profile management, native data clearing, pinned/idle suspension rules, connector pick/record/import/export/reset, fixed-model declarations, exact custom-menu and reasoning selection, client snippets/key reveal/copy/regeneration, gateway probe, session rename/search/resume/end, bounded activity log/export, and settings persistence.

Added durable conversation URLs and per-canonical-message SHA-256 receipts. Restart recovery verifies the prefix rather than storing/replaying transcripts. Interrupted or cancelled turns are expired; failed pre-dispatch admission rolls back the new session slot. Old response IDs and conflicting histories fail explicitly.

Added bounded client-supplied inline attachments, exact named tool choice, single-tool policy, per-request reasoning selection, explicit estimated streaming usage, context admission, developer-only diagnostic endpoints and opt-in pre-dispatch fallback. Provider pages do not grant model capabilities by naming them.

Fixed the UI subscription being removed at startup, native autostart path selection for AppImage, state-restore provider-ID handling, malformed base64 acceptance, and cancellation during asynchronous preparation. Expanded real browser regressions and native test source.

## Verified here

| Evidence | Result | Exact scope |
|---|---|---|
| `tests/evidence/frontend-build.json` | PASS | Actual Svelte 5.48.0 compiler, 22 application modules, zero component warnings; local offline ESM build |
| `tests/evidence/ui-browser.json` | 13 PASS | Compiled Svelte UI in Chromium with explicit native-host/provider test doubles |
| `tests/evidence/browser-dom-tests.json` | 22 PASS | Actual injected agent with in-memory DOM/network fixtures; includes a 22-turn sequence, Unicode deltas, quota/auth errors, cancellation, redesign, inline files, custom menus, reasoning and picking |
| `tests/evidence/node-current.log` | 17 PASS | Six helpers, three actual loopback HTTP fixture tests, eight static configuration/source checks |
| `tests/evidence/zag-static-contracts.json` | PASS | 30 Zag source modules and 2,988 qualified import/symbol/argument-count checks—not compilation |
| `tests/evidence/typescript-syntax.json` | PASS | TypeScript parser on scripts; not a full Svelte typecheck |

Screenshots in `screenshots/` are rendered captures of this compiled interface. Their provider content and state are labelled fixtures. No generated design image is represented as a running app.

## Not verified here

`tests/evidence/native-build-current.log` records build exit 77 because the Zag executable is absent. Cargo/rustc are absent, and package/compiler downloads could not be completed in this environment. Native Zag/Rust compilation, WebKitGTK behavior, native attachment support, real profile persistence/isolation, live model access, a real coding harness, 100 restarts and installation remain host-side checks. The static audits cannot catch every type, ABI, ownership or runtime defect.

The actual Svelte compilation succeeded using an existing local compiler, not npm/Vite. No native installer or lockfile-resolved reproducible build is claimed. `build-linux.sh` runs the complete real build path on a provisioned Linux x86_64 host and stops on failures.

## Feature boundaries, not simulated success

TNN/hybrid control requires a qualified research artifact that is not in this package. The running discovery path is symbolic. Provider-native tool calls, exact tokenizers, unexposed context limits, arbitrary sampling controls, unknown iframe/shadow-root editors, audio and video are not fabricated. Protocol requests outside the implemented subset are rejected. The generic executor works with observable semantic controls and user-recorded mappings; support for every arbitrary website is not claimed.

Files are client-supplied bounded base64 data, not paths or fetched URLs. Website upload controls and platform File/DataTransfer behavior must allow the operation; failures remain visible. Model/tool/usage support in this document must not be confused with provider-native capabilities.

## GitHub / delivery

GitHub was used to inspect the pinned Zag revision and official Tauri/Svelte source contracts. The current GitHub connector exposes no write/create action; earlier attempts returned 403. Changes are committed locally and preserved in the recovery bundle; no remote push or Actions run is claimed. The current Drive connector exposes read actions, not file upload/share actions, so this revision is attached directly rather than represented by the old Drive file.

Earlier alpha reports remain under `docs/history/source-alpha/` and are historical, not the current result. Release qualification remains separate in `docs/release-gates.json`.
