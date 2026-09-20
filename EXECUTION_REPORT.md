# Codemax — single-tab browser UX correction

## Completed

The duplicated vertical website list and permanent workspace navigation rail
were removed from source and the compiled frontend, not merely collapsed.
Browser tabs have one home: the top tab strip. The website occupies the full
content width by default. Providers, Tools and Connect are compact toolbar
utilities; other management views are in the Codemax menu and command palette.
The connection inspector is still available, closed by default and resizable.

Right-click / Shift-F10 on a top tab retains pin/keep-awake, reorder, close,
connector inspection, profile clearing and removal. Destructive confirmations
are unchanged. Keyboard tab navigation, single selected-tab state and active-tab
scrolling are implemented. Internal pages display `codemax://...`; Ctrl-W closes
the internal page rather than the underlying website. Closing the selected site
selects its neighboring tab. Closed profiles remain in the provider registry.

Old layout preferences migrate without bringing back duplicate rails. Menu
focus/keyboard navigation and viewport-bounded placement are implemented.
Trusted menus hide the remote native surface until dismissal. Loading/generation
rings still spin only for work; idle and attention indicators remain stationary.
The offline build now removes stale compiled source modules before compilation.

## Verified in this revision

| Check | Result | Evidence and scope |
|---|---:|---|
| Svelte component/rune compilation | 27 modules; zero component warnings | frontend-build.json; real local compiler/runtime |
| New single-tab UI suite | 14 passed | single-tab-ui.json; compiled components + explicit native/website doubles |
| Existing application UI suite | 15 passed | ui-browser.json; navigation selectors migrated, original feature checks retained |
| Existing discovery/MCP UI suite | 12 passed | codemax-ui.json; exposure, permissions and continuation presentation |
| Node helper/HTTP/static suite | 25 passed | node-current.log; not a native execution test |
| Browser-agent suite | 26 passed | browser-dom-tests.json; same production script, controlled fixtures |

Screenshots 12–14 are actual compiled-interface Chromium captures, using the
labelled local test website and explicit native-host double. They are not AI
concept renders and do not depict a native Tauri execution. Full-width native
bounds messages, inspector collapse, menus and minimum 1000 × 680 layout are
checked through the host double. The tab test also exercises sixteen open tabs.

## Corrections during verification

The first menu test exposed an accessible name containing an incidental model
count; explicit menu labels now keep names stable. The new reorder assertion
was corrected to match the existing insert-before-target operation. Unknown
internal-page errors now use a named error code to preserve the intended message.
All three compiled-UI suites were rerun after the final source changes.

## Unverified and unchanged

This is a source-plus-compiled-frontend delivery, not a native installer. npm
registry resolution failed (EAI_AGAIN); the existing trusted local Svelte 5.48.0
compiler/runtime supplied the offline build. A normal Vite/svelte-check build,
Zag compilation, Rust compilation and native desktop execution were not verified.
No live website/MCP/tool/harness request was made in this revision. No remote
GitHub commit, Actions run, or Drive upload is claimed.

Backend Zag, browser instrumentation and Tauri/Rust source remain byte-for-byte
unchanged from the supplied discovery/MCP package. The previous implementation
scope and limitations are preserved in docs/history/discovery-mcp-closeout.md.
Full product release gates remain open; this revision does not relabel them.

## Recovery

RECOVERY.bundle includes the previous Git history and this local UX commit.
MANIFEST.sha256 covers delivered contents except the two packaging metadata
files. PACKAGE_METADATA.json and the external delivery receipt identify the
commit, tests and archive verification. `npm run test:chrome` runs the new suite
after the frontend is compiled in the documented offline module layout.
