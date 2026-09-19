# Masterplan implementation and evidence accounting

Current revision: Codemax 0.1.0-dev.4. Source implementation and runtime qualification are separate. The original masterplan remains unchanged; this table does not mark the entire plan complete.

| Phases | Implementation present | Current evidence boundary |
|---|---|---|
| 0–2 | Contracts, Zag sidecar/lifecycle, desktop browser chrome, navigation, isolated profile commands | Compiled Svelte and host-double interaction tests; native OS path not executed |
| 3–5 | Bounded semantic/metadata observations, positive provider admission, current model/reasoning, exposure-filtered registry | 26 actual-agent Chromium cases; native admission tests authored, not executed |
| 6–7 | Deterministic provider, request actions, Chat Completions/SSE | Browser and real loopback HTTP fixtures tested separately; no live native provider/harness |
| 8–9 | Conversation receipts, restore/cancellation, streaming tool framing; MCP stdio client and same-session task runner | Browser 22-turn sequence; MCP UI tested; native MCP/permission/stdio regression sources not executed |
| 10–11 | Messages and Responses adapters using the same core | Native protocol integration source present, not executed |
| 12 | Browse-first unknown-site handling, provider settings, per-model exposure, correlated menus, optional recorder | 12 additional compiled-UI scenarios pass; generic detection accuracy on arbitrary live sites unverified |
| 13 | TNN shadow interface and admission boundary | No trained artifact admitted; production symbolic only |
| 14–15 | Unknown/reported/override context provenance, estimates, quota and explicit fallback | Synthetic auth/quota and metadata helper tests; no exact tokenizer implementation or universal effective-context inference |
| 16 | Bounded events/process transport, volatile permissions, draft preservation, crash/cleanup source | 25 Node tests, UI and Chromium checks; native stress/containment/100-restart gates not run |
| 17 | Linux build scripts, sidecar target packaging, local source-recovery bundle | Source plus compiled frontend delivered; no native installer or remote CI run |

## New workflow coverage

Normal browsing is not provider admission. Unknown tabs remain browsable without model exposure. Detector evidence, scan policy and exposure policy are separately represented. Model configuration uses observed, available and enabled models, not marketing-name guesses.

MCP tools are an optional local-client path. External harnesses still connect to the model-provider gateway and execute their own tools. The built-in MCP task supplies instructions and returns approved results without manual copy/paste. Local stdio servers must be explicitly trusted and their tools enabled. Direct remote MCP HTTP/SSE/OAuth and modern asynchronous/multi-round-trip features are not implemented in this bounded client.

## Evidence

See `../EXECUTION_REPORT.md`, `release-gates.json` and `../tests/evidence/`. Historical reports are preserved under `history/source-alpha/` and `history/website-permissions/`; their counts and claims must not be treated as current execution receipts.
