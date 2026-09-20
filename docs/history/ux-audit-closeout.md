# Codemax — whole-interface UX audit and correction

## Completed

The tab-only fix was followed by a source-and-interaction audit across all nine
surfaces: Browser, Providers, Models, Sessions, Connect a client, Tools & MCP,
Detector, Activity, and Settings. The single top browser tab strip is retained.

| Audit finding | Implemented correction |
|---|---|
| Client configuration had no inline gateway start/check path. | Choose a client, Start/Check the local connection, copy its configuration on the same page. Technical protocol/endpoint/token controls remain collapsed. |
| An unavailable chosen model could fall through to another model. | Preserve the explicit selection and block config until the user chooses an available model. |
| A failed health response could appear successful. | Check the returned health value; label success as local gateway reachability, not website/client interoperability. |
| Provider overrides and tool/server drafts disappeared between pages. | Keep drafts in process memory, with explicit Save/Reset and retryable failed forms. Never save task text in browser localStorage. |
| Discovered models were counted as ready regardless of exposure. | Derive ready state from provider admission, exposure, readiness and model enablement/availability. |
| Ending sessions, clearing diagnostics, resetting mappings and removing servers were too immediate. | Add scoped confirmations with accurate consequences; Cancel is the initial focus. |
| Website close, gateway stop or an exposure change could interrupt current work without review. | Confirm relevant interruptions. The custom application-close control also checks active work. |
| Tool approvals could be missed when browsing another page. | Keep a tool-count badge and compact task strip visible outside Tools. No execution occurs just because an alert appears. |
| A broader grant checkbox could carry over to a changed call. | Reset it when the call ID, tool or arguments change; the default remains Allow once. |
| Back/Forward, Find and palette focus behaved inconsistently on internal pages. | Separate management history, focus search fields, keep keyboard selections visible, and restore focus on dismissal. |
| Ctrl-W/T/L could operate behind dialogs; Escape could close a busy modal without settling state. | Block background browser shortcuts and prevent half-dismissal while confirmation is executing. |
| Opening an existing origin discarded the requested route. | Navigate the retained profile to the actual path/query/fragment. |
| Session Open went to the provider rather than the saved conversation. | Call session.resume and then focus its associated profile. |
| Late tab-open responses could override newer navigation. | Ignore stale activation completions. |
| Copy confirmations changed the website rectangle. | Place transient success notices in a fixed-height footer and expire them. |
| Backend loss looked like a new empty workspace. | Retain the last snapshot, mark it stale, block mutations, and link to runtime recovery. |
| Failed operations lost errors after unrelated successful operations. | Keep useful errors; preserve human message/path casing and show modal errors inside the modal. |
| Repeated clicks dispatched duplicate identical operations. | Coalesce identical in-flight requests and expose busy/disabled states. |
| Filters, settings sections and zoom readouts reset unexpectedly. | Retain view filters/section, show per-profile zoom, and let filtered-empty lists recover in place. |
| Ready/sleep/pin/local-only labels were misleading. | Use availability-aware counts, keep-awake wording, and “Local gateway · websites online.” |
| Dense metadata, long names and code could be hard to read or widen the layout. | Increase faint-text contrast/secondary type size, wrap long strings, bound code/table scrolling, preserve reduced motion and remove duplicate dividers. |

## Verified

| Executed check | Result | Evidence |
|---|---:|---|
| Actual Svelte component/rune compilation | 27 application modules, zero component warnings | tests/evidence/frontend-build.json |
| New UX audit suite | 38 passed, 0 failed, no recorded JS runtime errors | tests/evidence/ux-audit.json |
| Retained application UI suite | 15 passed | tests/evidence/ui-browser.json |
| Retained discovery/MCP UI suite | 12 passed | tests/evidence/codemax-ui.json |
| Retained single-tab UI suite | 14 passed | tests/evidence/single-tab-ui.json |
| Node helper, real local HTTP and static boundary cases | 25 passed | tests/evidence/node-current.log |
| Actual browser instrumentation with controlled DOM/network fixtures | 26 passed | tests/evidence/browser-dom-tests.json |
| TypeScript syntax-only parse | Passed | tests/evidence/typescript-syntax.json |
| Zag static import/symbol/arity audit | 4,255 qualified calls across 35 modules; no mismatches | tests/evidence/zag-static-contracts.json |
| Native/backend/browser source comparison | 51 files byte-identical to supplied previous ZIP | tests/evidence/native-source-unchanged.json |

There are **79 compiled-UI scenarios in total**, not 79 native desktop tests.
The 38-case UX audit includes a layout sweep of all nine surfaces and all five
Settings sections at 1500 × 980, 1000 × 680, and an extra 800 × 640 viewport,
plus long-name stress checks. The configured native minimum remains 1000 × 680.

The compiler/runtime is the real locally available Svelte 5.48.0 distribution,
with TypeScript 5.8.3 and Chromium 144.0.7559.96. Test host responses and website
data are explicit doubles; application components, event handlers, reactive
state and CSS are the production implementation. No native success or actual
website execution is simulated in the production build.

## Failed and corrected during development

Earlier selectors needed updating for the newly collapsed technical sections
and explicit confirmation steps. Three initial fault-injection cases incorrectly
returned an arrow-function assignment to Playwright evaluate; Playwright invoked
it immediately. The test setup was corrected and every final UI suite rerun. An
initial externally time-limited audit was also rerun to completion. Development
captures are kept separately in tests/evidence/ux-development/.

## Current blocker and claim boundary

This is **full application source plus a compiled frontend**, not a native
installer or a fully release-qualified application. A fresh prerequisite check
exited 77: local Zag, Rust/Cargo, project npm dependencies and WebKitGTK development
dependencies are not all provisioned. See tests/evidence/ux-prerequisites.json.
No native compilation, live provider request, live MCP execution, actual client
interoperability, GitHub push or Drive upload is claimed in this revision.

Normal Vite/svelte-check, OS webview keyboard/focus/zoom behavior, provider login
restoration, native file dialogs, and window-manager close handling still need
native validation. The new close confirmation covers the custom application
close control; it is not evidence of intercepting every OS shutdown path.

A provider still has one retained browser profile/conversation per origin. This
UX pass does not add multiple simultaneous same-origin conversation tabs. Drafts
are retained across page changes only, not process termination. The UI audit is
not an exhaustive accessibility conformance audit or a guarantee that no UX bugs
remain. New tools or files did not receive any broader native permissions.

## Next causal step

Provision the documented Linux toolchains and run the existing native build,
window/webview and actual-client gates against this source revision. Current
release gates remain recorded in docs/release-gates.json; no failure was relabeled
as a pass to publish this source package.

## Regression status and recovery

All four final compiled-interface suites passed after the last source changes.
Zag, browser instrumentation and Tauri/Rust remain unchanged, preserving their
previously documented behavior and unresolved native qualification gates.
The original masterplan and historical closeouts are retained.

RECOVERY.bundle contains local history including this revision. The archive’s
MANIFEST.sha256 covers all included files except MANIFEST.sha256 and
PACKAGE_METADATA.json. Package metadata records the local commit and evidence;
checksums establish byte integrity, not native correctness.

## Screenshots

20-ux-providers.png, 21-ux-connect.png, 22-ux-permission.png,
23-ux-browser-approval.png, 24-ux-providers-light.png and 25-ux-compact.png
are current Chromium captures of the actual compiled interface. Provider names,
model availability and tool calls in them are labelled test fixtures. They are
not generated design images or a native Tauri/live-provider run.
