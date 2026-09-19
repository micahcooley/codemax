# Masterplan implementation / evidence accounting

The current source implements the desktop/browser product paths listed below. Runtime qualification is recorded separately; no missing toolchain is represented as a successful native build.

| Phases | Implementation now present | Evidence boundary |
|---|---|---|
| 0–2 | Contracts, Zag sidecar/health/lifecycle, full browser workspace, navigation, profiles, view isolation commands | UI compiled and tested with host double; native OS path not executed |
| 3–5 | Bounded instrumentation, semantic symbolic detector/recorder, model registry | 22 actual-agent cases pass; Zag audited but not compiled |
| 6–7 | Deterministic provider, end-to-end action plumbing, Chat Completions/SSE | Browser and real loopback fixture HTTP tested separately; no live provider/harness |
| 8–9 | Canonical session receipts, conversation restore, cancellation, tool state machine, named choices | Native regression source present; browser 22-turn/cancellation verified |
| 10–11 | Anthropic Messages and Responses adapters on shared core | Native protocol fixture tests authored, not run |
| 12 | Unknown-site onboarding, custom model menus, control picker, connector import/export and rebinding | UI and browser tests pass; universal website compatibility not claimed |
| 13 | TNN shadow schema/parser and explicit safety boundary | No trained artifact or research campaign; production remains symbolic |
| 14–15 | Provenance-aware estimates, configured context admission, quotas, explicit new-session fallback | Synthetic quota/auth and UI cases pass; exact tokenizer/provider usage unavailable |
| 16 | Bounds, locks, crash supervision, failed-admission rollback, logs, profile clearing | Static/Chromium regressions pass; native stress/100 restarts not run |
| 17 | One-command Linux build, sidecar target layout, packaging workflow and local recovery bundle | Source plus compiled frontend delivered; no native installer or remote CI run |

Unsupported provider capabilities fail explicitly. They are not represented by hard-coded success responses. Earlier source-alpha status is retained under `history/source-alpha/`.
