# Browser workspace implementation

The default window is 1500 × 940 logical pixels, minimum 1000 × 680. Native provider content occupies the central rectangle; Svelte supplies title/tabs, address/navigation, optional connection inspector, utility buttons and status bar. Opening menus/dialogs or utility views hides the native provider surface so it cannot cover trusted controls.

A subdued charcoal/sage palette, thin dividers, system typography and compact tables replace oversized dashboard cards. A light theme is also implemented. Layout settings remain presentation state; provider/session state is delivered by Zag snapshots. Theme, compact density, motion policy, API and profile settings persist through Zag.

A collapsible registered-provider shelf is visible on the left by default. Only positively detected providers appear there; it is not an open-tab list and has no close/reorder controls. The single top strip remains the only browser tab navigation. The inspector can collapse or resize with pointer/keyboard input and starts closed. Bounds updates use ResizeObserver and animation-frame scheduling. Focus, back/forward, URL, reload, find, zoom, external open, native window controls, profile clear and one-shot popup/download permissions call host commands. Tabs reorder locally; profile state remains backend-owned.

Short transitions are used for chrome/menus/dialogs. Browser content itself is not animated. Reduced-motion preference and explicit motion setting suppress transitions. Buttons have accessible labels; the command palette supports keyboard navigation. Empty/error states represent actual missing state, not demo results.

Screens: Browser, Providers, Tools & MCP, Models, Sessions, Connect a client, Detector, Activity, Settings. Screenshots are compiled-Svelte Chromium captures with labelled fixture provider content. `tests/ui_browser.py` exercises the real components using a test host; native-window interaction is a separate check.


## Codemax workflow revision

Normal address entry opens a browser profile, not a provider setup wizard. Only the top strip lists open browser tabs. Providers is a settings page that lists positively admitted chat sites, including retained profiles whose tabs are closed. Site/model exposure and “Keep discovering” are separate switches. Context and tokenizer details say Unknown unless a specific evidence source exists. Provider mappings, overrides and process details are collapsed under Advanced.

Connect a client is the routine harness screen: browse/sign in, detect models, choose a client and copy/save its generated configuration. It explains that the loopback token authenticates the local gateway, not a paid website API. Client choice persists. The diagnostic file test is optional and belongs under Tools & MCP.

Tools & MCP uses an explicit task surface. Installed stdio programs require process-trust consent; tools are initially disabled. The active call shows its exact arguments and destination website. Allow once is the default. An advanced grant authorizes that exact tool, with potentially different future arguments, only for the remaining task. Automatic result submission is independent of execution permission. Untrusted results render as text.

Tab rings rotate for actual load/discovery/generation activity, remain still when idle, and respect reduced motion. Passive metadata observations alone do not imply generation. Browser automation leaves unsent user drafts intact. These behaviors are source contracts and fixture-tested UI/DOM paths; native window/webview qualification is a separate gate.


## Single-tab navigation correction

There is exactly one browser tablist, above the address bar. No vertical tab list,
icon rail, sidebar toggle, or duplicate website switcher is rendered. Removing
that UI does not remove profiles, discovered providers, model exposure, or MCP.

Providers, Tools and Connect appear as compact toolbar actions. Other pages are
available from the Codemax menu and command palette. Internal pages show their
own `codemax://` location rather than impersonating the selected website's URL.
Ctrl-W returns from an internal page without closing that website. Unknown
internal locations show a local error rather than opening a provider.

Tab actions move to right-click / Shift-F10 on the top tab. Menu access to pin,
close, connector inspection, profile clearing and website removal is retained.
Profile clearing/removal keep the existing confirmations. Tab arrow/Home/End
navigation, Ctrl-Tab/reverse, Ctrl-1..9, reorder and active-tab scrolling use the
same top strip. Closing the selected website chooses its next neighbor, then
its previous neighbor. Closed profiles remain available in provider settings.

The v2 layout stores only inspector width/visibility and tab ordering. A v1
layout migrates its width and order but drops the old forced-open panes. Menu
placement is bounded by the viewport; opening either trusted menu hides the
remote native surface, and closing restores it. Neither menu receives tool
execution authority. Working/idle/attention rings remain in the top strip.

Regression evidence: `tests/evidence/single-tab-ui.json` and the two existing
compiled-UI suites. These execute compiled Svelte with native-host doubles.
They do not qualify native Tauri/WebKit behavior or live provider execution.


## Whole-interface UX audit

The single top tab strip remains. This revision audits Browser, Providers, Models,
Sessions, Connect, Tools & MCP, Detector, Activity and Settings, including the five
Settings sections. The observed problems and test mapping are in docs/UX_AUDIT.md.

- Internal navigation is independent of native website history. Opening a saved
  session calls session.resume for its recorded conversation; ordinary provider
  opening is not a substitute. Existing-origin address navigation retains path,
  query and fragment.
- Frontend drafts and filters are ephemeral presentation state. Backend snapshots
  remain authoritative. Save/Reset are explicit where multiple fields are edited.
  A failed action is not reported as success and unrelated successes do not hide
  its error. Duplicate identical in-flight requests are coalesced.
- New destructive confirmations protect client-session end, connector reset,
  diagnostic clear, MCP server removal, gateway stop, active-work exposure changes,
  active-tab close and the custom application close control. Safe Cancel receives
  focus; Escape cannot half-dismiss a modal during an in-flight operation.
- Tool-call arguments and result destination are visible before approval. The
  optional broader task grant resets on a changed call. A toolbar count and compact
  task strip keep waiting approval visible on other pages without granting it.
- Client setup provides Start, Check, Stop and configuration on one page. Detailed
  local endpoint/token/protocol controls are collapsed. The health-check label says
  exactly what was verified and unavailable explicit model choices are not silently
  replaced. Revealed secrets are cleared on departure and after 30 seconds.
- Readiness derives from backend availability/exposure state, not discovery alone.
  Offline snapshots are marked stale, not replaced with onboarding emptiness.
- Small notices occupy a reserved footer and expire. Error recovery actions open
  the relevant setting or permission control. Metadata contrast, focus targets,
  long-name wrapping and bounded code/table scrolling are improved.

Compiled-layout checks cover 1500 × 980, the native minimum 1000 × 680, and an
extra 800 × 640 stress viewport. The latter does not change the configured native
minimum. These are Chromium/component checks, not native screen-reader, OS-window
manager, native webview or live-provider qualification.

## Progressive workspace (dev.7)

Daily browsing exposes the provider shelf, one tab strip, address/navigation and two utilities (Tools, Connect). The inspector and technical management pages stay closed unless requested. Provider advanced mappings and discovery settings are folded; when the shelf is visible, Providers does not render a second list beside it.

Connect defaults to two selectors and one private-launch button. The old full configuration surface is retained under Advanced. Nothing claims the external client connected merely because setup was copied. Leaving the page invalidates delayed setup/copy work.

Tools uses mutually exclusive working surfaces: task composition, optional library, server-definition editor, process consent, or active task. Active tasks hide catalogs and setup and surface only the relevant progress/result/approval/continuation controls. Ordinary generation uses a quiet toolbar indicator; a required approval or budget pause remains visible while browsing. Catalogs and task budgets are folded by default. Tool library recipes are list rows, not a dashboard of cards.

Permission and error visibility are not sacrificed to cosmetic cleanliness. Folder choice, server start and tool execution are separate authority steps. Cancel, Stop and Deny remain readily available. Native provider bounds exclude the shelf and update on collapse; the trusted chrome never overlays an unhidden privileged native dialog with a webpage.
