# Codemax browse-to-discover + MCP implementation

## Delivery status

Application implementation revision, with compiled Svelte frontend. Not a compiled native installer, a live interoperability certification, or a claim that the complete masterplan is release-qualified.

User requirement: ordinary browsing/sign-in should passively discover genuine AI providers; expose selected models to the chosen harness; provide clean provider settings and advanced controls; insert instructions and send results for permissioned MCP tools. The original MASTERPLAN.md is preserved. The revised product workflow is in docs/CODEMAX_WORKFLOW.md.

## Completed source changes

- Browser profiles are distinct from admitted model providers. New addresses are ordinary browsing until Zag has independent composer/send, model and conversation evidence. A search box, main region, login form or model mention is insufficient.
- Continuous event-driven discovery observes native and correlated custom model/reasoning controls, current selection and explicit per-model context/tokenizer metadata. It does not send test prompts, open menus autonomously, read credentials, or invent hidden capabilities.
- Provider settings control site/model exposure, scan pause, dismissal/resume, context/reasoning overrides, mappings and lifecycle. Advanced controls stay collapsed. Unknown/website-reported/user-supplied facts remain distinguishable.
- Harness selection persists. Generated OpenCode/Claude Code/Chat/Responses/Messages configurations use the live exposed registry. Connection details are primary, not hidden behind a mandatory file test. Static client catalogs may require refresh/export; client model-provider APIs and MCP are separate paths.
- Zag MCP client: user-confirmed stdio configuration, legacy negotiation and bounded 2026 discovery, catalog/pagination, per-tool enabling, call correlation, pending approval, once/per-task grants, result handling and same-session continuation. Rust only transports process bytes and manages lifecycle.
- Built-in tasks automatically insert tool instructions and optionally auto-send results. A user must start a task. Ordinary webpage text never authorizes local tools.
- Pending approval is revalidated at the execution boundary. Catalog/epoch changes, lost conversations, disabled exposure, cancellation and expiry revoke grants. No grants survive restart.
- Browser automation now refuses to overwrite an unsent draft or submit a composer changed by the user before sending. Passive scan pause/resume is exercised in Chromium.
- Native regression source covers admission/exposure and MCP negotiation/permission rules. A native integration driver with an independent stdio/file fixture is included; it does not replace the production backend with Python.

## Verified in this execution environment

| Check | Result | Scope |
|---|---:|---|
| Svelte compilation | 27 application modules, zero component warnings | Actual Svelte 5.48.0 compiler and bundled runtime; offline build |
| Existing compiled-UI suite | 15 passed | Actual compiled Svelte, explicit Tauri/native-state test double |
| New Codemax UI suite | 12 passed | Admission presentation, exposure/config updates, consent controls, escaping, responsive layout |
| Browser-agent suite | 26 passed | Actual agent in Chromium with in-memory website/network fixtures; includes 22-turn sequence |
| Node suite | 25 passed | 11 pure helper cases, 3 real local HTTP fixture cases, 11 static boundary cases |
| Zag source contract audit | 4,255 calls across 35 modules; no mismatches | Imports, symbols and qualified-call arity only; not compilation |
| New native harness scripts | Python syntax checked | Not execution of the native integration |
| MCP fixture script | Node syntax checked | Independent test-server source, not production-client execution |

Evidence is in tests/evidence/frontend-build.json, ui-browser.json, codemax-ui.json, browser-dom-tests.json, node-current.log, and zag-static-contracts.json. Screenshots are actual compiled UI captures with labelled test provider/native-host doubles, not generated concept images and not native Tauri screenshots.

## Failed attempts and unverified boundaries

The native build was attempted and exited **77** because the Zag compiler is absent. `tests/evidence/native-build-current.log` records the failure. Rust/Cargo are also absent. Native source was reviewed but not compiled, linked or executed. Static import/arity checks do not prove type, ownership, ABI, effect, syscall or runtime correctness.

Consequently native MCP protocol/stdio execution, real website-to-MCP-to-local-file continuation, Tauri/WebKitGTK login isolation, live provider detection accuracy, real coding harness interoperability, process containment, crash stress and native Linux packaging remain unverified. Ordinary fixture success is not a substitute for these gates. No live Z.ai or other model request was made during this revision.

The built-in MCP client presently supports local stdio, not direct remote HTTP/SSE/OAuth. It is not a sandbox for trusted server executables. Tool arguments are structurally bounded; full schema validation belongs to the server. 2026 change subscriptions and asynchronous/multi-round-trip capabilities are not negotiated. No training/TNN production admission occurred. No universal website/harness compatibility or measured superiority to MCP SuperAssistant is claimed.

## Bugs found and repaired during this round

- Every opened address previously looked like a provider; registration and admission are now separate.
- Generic page regions and unrelated menus could contribute misleading detector evidence; they are not sufficient for admission and menu ownership is correlated.
- Routine harness connection details were buried behind the diagnostic workflow; setup and diagnostics are now separate.
- A nested diagnostic scroll container interfered with UI interaction; fixed and regression suite passed.
- MCP fallback initially used an unsigned-only JSON numeric helper for -32601; it now checks the exact numeric error spelling, with native regression source.
- Pending approvals initially relied on a later tick to notice changed exposure/session; exact-boundary revalidation added.
- Composer insertion could replace unsent work; preservation and pre-send equality checks added and browser-tested.

## Sources and recovery

MCP SuperAssistant's README/official quick start, official MCP legacy lifecycle and 2026 architecture, and OpenCode provider documentation were inspected. References and limitations are in docs/SOURCES.md. The original masterplan is the product basis; external documentation informed protocol/UI changes, not proof of the application's runtime.

A local commit and full Git recovery bundle accompany this revision. No remote GitHub commit, CI run, Drive upload or native installer is claimed for this round. ZIP/checksum verification is recorded in PACKAGE_METADATA.json and the external delivery receipt.
