# Browser workspace implementation

The default window is 1500 × 940 logical pixels, minimum 1000 × 680. Native provider content occupies the central rectangle; Svelte supplies title/tabs, address/navigation, sidebar, connection inspector, utilities and status bar. Opening menus/dialogs or utility views hides the native provider surface so it cannot cover trusted controls.

A subdued charcoal/sage palette, thin dividers, system typography and compact tables replace oversized dashboard cards. A light theme is also implemented. Layout settings remain presentation state; provider/session state is delivered by Zag snapshots. Theme, compact density, motion policy, API and profile settings persist through Zag.

The profile pane and inspector can collapse or resize with pointer/keyboard input. Bounds updates use ResizeObserver and animation-frame scheduling. Focus, back/forward, URL, reload, find, zoom, external open, native window controls, profile clear and one-shot popup/download permissions call host commands. Tabs reorder locally; profile state remains backend-owned.

Short transitions are used for chrome/menus/dialogs. Browser content itself is not animated. Reduced-motion preference and explicit motion setting suppress transitions. Buttons have accessible labels; the command palette supports keyboard navigation. Empty/error states represent actual missing state, not demo results.

Screens: Browser, Models, Sessions, Connect a client, Detector, Activity, Settings. Screenshots are compiled-Svelte Chromium captures with labelled fixture provider content. `tests/ui_browser.py` exercises the real components using a test host; native-window interaction is a separate check.
