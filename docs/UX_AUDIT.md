# UX audit — acceptance matrix

Basis: the supplied single-tab source archive, its compiled UI and the requested
normal-browser/low-setup workflow. This report does not infer behavior from a
static screenshot alone. See ../EXECUTION_REPORT.md for the source finding →
correction table and the distinction between native execution and fixture-tested
frontend behavior.

The main implementation changes are in src/lib/state/app.svelte.ts, src/App.svelte,
src/lib/components/Dialog.svelte, src/lib/components/ExternalClients.svelte,
src/lib/format.ts, src/screens and src/lib/design/app.css. No backend authority
was moved out of Zag.

## Executed acceptance checks

Every row below has an executable case in tests/ux_audit.py and a corresponding
result in tests/evidence/ux-audit.json. They exercise the actual compiled Svelte
application with only native IPC/provider responses replaced by explicit doubles.

| Case | Acceptance behavior | Result |
|---|---|---|
| UX-01 | Entering an existing origin preserves its path, query and fragment | PASS |
| UX-02 | Address parser distinguishes local hosts, search, unsafe schemes and credentials | PASS |
| UX-03 | Escape cancels address edits without navigation and restores tab focus | PASS |
| UX-04 | Find focuses immediately, supports reverse search and closes independently | PASS |
| UX-05 | Confirmation defaults to Cancel and traps browser shortcuts without destructive side effects | PASS |
| UX-06 | Command palette autofocus and keyboard selection remain visible while scrolling | PASS |
| UX-07 | Internal management navigation has predictable Back and Forward history | PASS |
| UX-08 | Page zoom readout follows each website instead of resetting on every switch | PASS |
| UX-09 | Copy feedback stays in the reserved footer, does not shift the website and expires | PASS |
| UX-10 | Disconnected state retains last-known profiles, labels staleness and blocks mutations | PASS |
| UX-11 | Loading an unavailable snapshot is not mislabeled as an empty workspace | PASS |
| UX-12 | Repeated identical actions in flight dispatch only one backend request | PASS |
| UX-13 | Errors survive unrelated successful actions and preserve path/message casing | PASS |
| UX-14 | Provider override drafts survive navigation and Reset does not mutate saved data | PASS |
| UX-15 | Provider edits are explicit; unchanged values cannot be resubmitted | PASS |
| UX-16 | Disabling a provider during work requires confirmation; Cancel restores the checkbox | PASS |
| UX-17 | Client setup includes working Start, health Check and confirmed Stop controls | PASS |
| UX-18 | A negative health result cannot produce a successful connection message | PASS |
| UX-19 | Unavailable explicit client model selection is not silently replaced by another model | PASS |
| UX-20 | Technical connection fields start collapsed; leaving the page hides revealed secrets | PASS |
| UX-21 | Ready filters and default-model actions respect model and provider exposure | PASS |
| UX-22 | Model filters persist, empty searches recover in place, and sorting toggles direction | PASS |
| UX-23 | Opening a session asks the backend for that conversation, not the provider homepage | PASS |
| UX-24 | Ending a session requires review and does not delete a website conversation | PASS |
| UX-25 | A failed session rename restores its saved value without a stale event error | PASS |
| UX-26 | Unsent tool task and server drafts survive navigation; invalid JSON is explained inline | PASS |
| UX-27 | Tool approvals remain visible while browsing and never auto-execute | PASS |
| UX-28 | A new or changed tool call resets the broader grant checkbox to Allow once | PASS |
| UX-29 | Removing a tool server requires confirmation without deleting its executable | PASS |
| UX-30 | Failed tool-server connection keeps the reviewed definition available for retry | PASS |
| UX-31 | Settings deep links open the right section, remember it and settle applied forms | PASS |
| UX-32 | Connector reset, diagnostic clearing and application close guard destructive effects | PASS |
| UX-33 | Filtered-empty Sessions and Activity recover without sending users into setup | PASS |
| UX-34 | All nine surfaces and five Settings sections stay bounded at three viewport sizes | PASS |
| UX-35 | Long provider labels, model names and identifiers cannot expand the whole window | PASS |
| UX-36 | Slow tab opening cannot override a newer tab or page selection | PASS |
| UX-37 | An in-flight confirmation cannot be half-dismissed; failures remain recoverable in its dialog | PASS |
| UX-38 | Reduced motion keeps readable working states without animation | PASS |

## Preserved boundaries

- A gateway Check validates the local listener; it is not a successful website or
  coding-client request. No alternative model is silently selected.
- Provider/model exposure and tool grants remain backend-authorized. Reviewing or
  dismissing an alert does not execute a tool. Stop/Deny remain available.
- Drafts are presentation state held in memory. Saved settings, admission, routing,
  permissions and sessions remain authoritative in Zag.
- A profile list on the Providers settings page is not another browser tab strip.
  Only the top browser strip switches open websites.

## Native checks not covered by this matrix

Run Tauri/WebKitGTK with the actual Zag sidecar to verify OS focus transfer,
webview placement while modal dialogs are open, native shortcut delivery, native
file dialogs, page history/zoom, login persistence and OS-level close/restart.
Exercise a real client request and same-conversation tool result cycle. A native
installer, multiple simultaneous conversations for the same origin, unrestricted
MCP transport parity, exhaustive accessibility certification and universal
website compatibility are not introduced or claimed by this UX revision.

The 800 × 640 layout pass is an extra stress check, not a change to the configured
1000 × 680 minimum native window size. Screenshots were visually inspected in
dark/light themes and with both full and compact application layouts.
