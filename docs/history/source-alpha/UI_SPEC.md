# UI implementation specification

Status: authored Svelte 5 source; not compiled, rendered or interactively tested as a complete application here.

## Layout and visual language

Desktop-first dark developer workspace: compact 61 px header, labelled navigation rail, scrollable main region and 28 px status footer. Typography uses system fallbacks; no font binaries or remote font requests are bundled. Muted indigo/neutral surfaces, 5–7 px component corners, fine borders and measured spacing avoid excessive gradients or glass effects. Tables use provenance labels as well as state colors.

Overview surfaces backend/API state, provider counts, model counts and active requests. It does not insert fake providers or model names. An explicit source-alpha qualification notice remains visible.

Provider Browser centers a native child webview, with collapsible provider and evidence panes. Pane widths accept pointer and arrow-key resizing. The UI supplies back/forward/reload, provider selection, close and rescan. Native views are hidden before modal dialogs so provider pixels do not cover trusted controls. Actual stacking, keyboard focus and window geometry need native testing.

Models displays provider, model, reasoning observation, unknown context, estimated tokenizer, unknown vision, emulated tools, status and provenance. User-supplied labels are not promoted to discovered model identities.

Harness Setup generates escaped API templates and endpoint/model selection. The local key is never interpolated into snippets. Protocol subsets and unverified named-harness status are explicit.

Sessions shows real snapshot metadata, byte-based estimates, cancellation/end controls and restart-loss states. No fabricated conversation IDs or completed turns are displayed.

Detector Lab displays an explicitly requested sanitized DOM snapshot. Users can select a node and confirm semantic mapping recipes. A manually selected model label is marked USER SUPPLIED. TNN/hybrid modes are shown as unavailable pending artifact and research qualification; there is no fake toggle that changes only a frontend label.

Settings manages port updates, temporary token reveal/copy/regeneration, backend restart, selected-profile clearing and interface density. Destructive operations use native-hidden confirmation dialogs. Unsupported auto-start/updater/privacy-capture modes are not presented as working switches.

## Interaction and accessibility

Ctrl/Cmd+K opens the command palette. Escape closes native dialogs. Focus-visible outlines and real button/input labels are present. Dialogs use the browser dialog element, keyboard focus and restoration. Motion respects prefers-reduced-motion. Core status uses text in addition to colored dots. Responsive styles compact the rail and stack information panels.

Keyboard/screen-reader semantics, full Svelte component compilation and application screenshots require further verification. `tests/evidence/fixture-provider-browser.png` documents only the test website. Do not use that image as evidence of a built product UI.

## Explicit missing UI/platform work

External-open/home/copy-current-navigation URL controls, context menus, dynamic background-view suspension, profile export/import, updater/auto-start, a full network-diff inspector and qualified rich-editor/custom-model recorder are not complete. Snapshot provenance and no-fake-backend behavior take precedence over decorative connected states.
