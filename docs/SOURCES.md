# Source provenance and primary references

Retrieved during the execution ending September 19, 2026. URLs are development references, not runtime dependencies. Product requirements come from the user-uploaded MASTERPLAN.md, not from these external documents. External APIs were consulted for syntax/contracts; the application's runtime is not certified by those documents.

- User artifact: `/mnt/data/Pasted markdown.md`, copied unchanged as MASTERPLAN.md.
- Zag repository and pinned revision: https://github.com/Sylorlabs/zag/tree/abed8aa170ef1bc33e5aca68b99fcdd905a4545f
- Zag runtime primitive declarations: https://github.com/Sylorlabs/zag/blob/abed8aa170ef1bc33e5aca68b99fcdd905a4545f/zag-poc/std/rt.zag
- Zag native IPv4 reference: https://github.com/Sylorlabs/zag/blob/abed8aa170ef1bc33e5aca68b99fcdd905a4545f/zag-poc/std/net_ipv4.zag
- Zag bootstrap entry: https://github.com/Sylorlabs/zag/blob/abed8aa170ef1bc33e5aca68b99fcdd905a4545f/zag-poc/bootstrap.sh
- Svelte 5 overview/runes: https://svelte.dev/docs/svelte/overview
- Tauri sidecars: https://v2.tauri.app/develop/sidecar/
- Tauri capabilities and Linux caveat: https://v2.tauri.app/security/capabilities/
- Tauri explicit application commands: https://docs.rs/tauri-build/latest/tauri_build/struct.AppManifest.html
- Tauri WebviewBuilder, inspected version 2.11.5: https://docs.rs/tauri/latest/tauri/webview/struct.WebviewBuilder.html
- Tauri WebviewWindowBuilder and clipboard option: https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html
- Tauri shell process Command conversion, inspected 2.3.6: https://docs.rs/tauri-plugin-shell/latest/tauri_plugin_shell/process/struct.Command.html
- OpenAI Chat API primary reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- OpenAI streaming reference: https://developers.openai.com/api/docs/guides/streaming-responses
- Anthropic streaming reference: https://platform.claude.com/docs/en/build-with-claude/streaming

The protocol implementation intentionally covers only the subset listed in PROTOCOL.md. No model identity/context size/provider capability has been taken from an illustrative masterplan example and passed off as discovered data. No actual provider login, model call, quota test or current provider terms review took place in this environment.

GitHub read access succeeded. The attempted Actions job rerun returned HTTP 403, “Resource not accessible by integration.” Earlier write/branch attempts were also reported unavailable; no repository change, branch or workflow run is claimed in this delivery.


## Completion-round source checks

- Exact Svelte runtime license: https://github.com/sveltejs/svelte/blob/svelte@5.48.0/LICENSE.md
- Tauri event target and callback teardown contract: https://github.com/tauri-apps/tauri/blob/tauri-v2.11.5/packages/api/src/event.ts
- Native shell Command-to-std::process::Command conversion: https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/shell/src/process/mod.rs
- Client configuration contracts consulted: https://opencode.ai/docs/providers/ and https://code.claude.com/docs/en/llm-gateway

These external references informed implementation; the attached user masterplan defines product requirements. Current connector discovery provided GitHub/Drive reads but no create/upload/share actions. Only local commits and direct attachment are claimed for the revised delivery.

## Codemax discovery / MCP round

The user clarified browse-first admission, provider exposure controls, persisted harness selection and automatic permissioned tool-result continuation. These additions are product requirements, not claims copied from a competitor.

Primary materials read during this round:

- MCP SuperAssistant repository README (GitHub read action), blob `930941e035cf135509916ebf8dbe31e731b1c021`: `https://github.com/srbhptl39/MCP-SuperAssistant/blob/main/README.md`
- Official quick start: `https://mcpsuperassistant.ai/docs/getting-started/quick-start-guide`
- Legacy MCP lifecycle: `https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle`
- Current architecture/discovery examples: `https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture`
- OpenCode provider configuration: `https://opencode.ai/docs/providers/`

The reference extension documents automatic tool detection, execution, result insertion and submission through MCP/proxy connections. Codemax's source keeps the same conceptual loop in its desktop/Zag architecture, separate from the model gateway. The official MCP materials distinguish tools/context exchange from model selection and illustrate version/capability discovery and tool messages. OpenCode documentation informed generated provider settings. This research is not a test of Codemax native interoperability, nor a benchmark establishing it is better than the reference project.

No live provider request occurred in this round. Prior website-only probes are historical, separately labelled evidence. The native stdio client is narrower than a full MCP implementation: see MCP_CLIENT.md.
