# Browser workspace implementation

The default window is 1500 × 940 logical pixels, minimum 1000 × 680. Native provider content occupies the central rectangle; Svelte supplies title/tabs, address/navigation, sidebar, connection inspector, utilities and status bar. Opening menus/dialogs or utility views hides the native provider surface so it cannot cover trusted controls.

A subdued charcoal/sage palette, thin dividers, system typography and compact tables replace oversized dashboard cards. A light theme is also implemented. Layout settings remain presentation state; provider/session state is delivered by Zag snapshots. Theme, compact density, motion policy, API and profile settings persist through Zag.

The profile pane and inspector can collapse or resize with pointer/keyboard input. Bounds updates use ResizeObserver and animation-frame scheduling. Focus, back/forward, URL, reload, find, zoom, external open, native window controls, profile clear and one-shot popup/download permissions call host commands. Tabs reorder locally; profile state remains backend-owned.

Short transitions are used for chrome/menus/dialogs. Browser content itself is not animated. Reduced-motion preference and explicit motion setting suppress transitions. Buttons have accessible labels; the command palette supports keyboard navigation. Empty/error states represent actual missing state, not demo results.

Screens: Browser, Providers, Tools & MCP, Models, Sessions, Connect a client, Detector, Activity, Settings. Screenshots are compiled-Svelte Chromium captures with labelled fixture provider content. `tests/ui_browser.py` exercises the real components using a test host; native-window interaction is a separate check.


## Codemax workflow revision

Normal address entry opens a browser profile, not a provider setup wizard. The sidebar lists browser tabs; Providers only lists positively admitted chat sites. Site/model exposure and “Keep discovering” are separate switches. Context and tokenizer details say Unknown unless a specific evidence source exists. Provider mappings, overrides and process details are collapsed under Advanced.

Connect a client is the routine harness screen: browse/sign in, detect models, choose a client and copy/save its generated configuration. It explains that the loopback token authenticates the local gateway, not a paid website API. Client choice persists. The diagnostic file test is optional and belongs under Tools & MCP.

Tools & MCP uses an explicit task surface. Installed stdio programs require process-trust consent; tools are initially disabled. The active call shows its exact arguments and destination website. Allow once is the default. An advanced grant authorizes that exact tool, with potentially different future arguments, only for the remaining task. Automatic result submission is independent of execution permission. Untrusted results render as text.

Tab rings rotate for actual load/discovery/generation activity, remain still when idle, and respect reduced motion. Passive metadata observations alone do not imply generation. Browser automation leaves unsent user drafts intact. These behaviors are source contracts and fixture-tested UI/DOM paths; native window/webview qualification is a separate gate.
