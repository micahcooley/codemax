# Codemax — progressive workspace and task-continuity audit

## Delivery boundary

Version 0.1.0-dev.7. Based on local source commit `b943946487994422729131d85f8c17c4810648e2` from Codemax-UX-audit.zip. This package contains the full project, a freshly compiled Svelte frontend, source changes to the Zag backend and thin Tauri host, executable tests, actual compiled-UI screenshots and local Git recovery history. It is **not a native installer, a native-runtime certification or completion of the full original masterplan**.

This audit addresses the requested clean, progressively disclosed interface, registered providers on the left, easier coding-client setup, safer continuation and a useful variety of optional tools. The original masterplan remains unchanged in MASTERPLAN.md. Its Svelte / thin Tauri / authoritative Zag architecture is preserved.

## COMPLETED

### Default workspace

A left provider shelf displays only positively registered AI providers. An ordinary browser tab does not appear there. Registered providers remain available after their website tab closes. Opening a saved provider reuses/opens its website; provider settings are a separate secondary action. There are no sidebar tab close or reorder controls. The only browser tab strip is at the top.

The shelf collapses with its toolbar control or Ctrl+Shift+B. Its preference persists and native browser bounds expand accordingly. The inspector stays closed by default. Only Tools and Connect remain primary utilities; technical management pages are in the menu/palette. Provider settings do not duplicate the shelf with a second list when it is visible.

Routine task work is a quiet toolbar indicator. Required approvals, errors and safe pauses remain discoverable without opening every panel. The browser content remains the primary surface. Reduced motion, keyboard focus, navigation drafts, error persistence and destructive-action confirmation from the prior audit remain covered.

### Easier client connection

The default connection surface contains a coding-client selector, a website-model selector and one private-launch action. It starts the local gateway when needed, performs a real native health probe when running natively, revalidates the model/client/endpoint, retrieves the local bearer key and copies a shell-quoted command. OpenCode receives inline configuration; no existing config file is overwritten. Claude Code receives the selected website model through explicit environment settings. Other protocol choices produce a curl smoke request, not a fictional client installer.

The command requires the named external client to be installed. It contains a local access key, so clipboard, terminal history and same-user process/environment visibility are relevant. This key is not a provider API credential. A copied command or successful gateway health response does not claim the coding client is connected or that website inference succeeded.

Detailed configuration, local endpoint/key controls, export and manual setup remain accessible under Advanced rather than filling the initial screen. A delayed health result after page destruction or a changed model/endpoint/client can no longer trigger a late credential retrieval/copy.

### Tool variety without a wall of settings

The optional Tool library offers five pinned external-server definitions: project files, Git repositories, reading web pages, working notes and browser tools. The library, server editor, process consent, task composition and active-task view are mutually exclusive working surfaces. Catalogs, task budgets, raw arguments and alternative setup stay behind explicit controls.

Selecting a recipe only fills a draft. Saving does not run it. The native folder chooser returns a path only and is restricted to the trusted main webview. Server startup still requires separate executable/argv consent; tools start disabled, and tool calls require one-time or explicit broader task permission. No blanket machine-access permission was added.

Published pins are documented in TOOL_LIBRARY.md: filesystem/memory 2026.8.31; Git/Fetch 2026.8.18; Playwright MCP 0.0.82. Repository manifest version fields alone were insufficient publication evidence; the final recipes were corrected using official release and package records. No external package was installed or executed here. The library is not a collection of preinstalled tools or a transitive dependency lock.

Fetch retrieves a supplied URL and can reach local/internal addresses; it is not a public-only network sandbox or a bundled search-engine API. Playwright starts a separate isolated browser, not the signed-in Codemax provider tabs. Git's starting repository and the file server's own access controls are not misrepresented as Codemax operating-system confinement. Review destinations and trust the executable before connecting.

### Native task continuity implementation

The old built-in 20-turn / ten-minute terminal cutoff is replaced by an explicit work budget. Defaults are 100 model turns / 30 active minutes; Task options allows 10–500 turns and 5–240 active minutes. Approval/manual-result waiting is not active work. The budget pauses only at a safe boundary, never by canceling an executing tool because the budget crossed zero.

A work-budget pause retains the same in-memory task ID, conversation/session mapping, transcript and completed result. Continue task extends the budget rather than starting a new conversation. It clears broad grants. Resume requires the same task ID, unchanged catalog and valid provider/conversation. It does not replay a completed approval or repeat a tool with uncertain side effects. This is source implementation plus native regression source, **not an executed native guarantee**.

MCP tool calls now have five minutes of inactivity tolerance. Only matching call progress refreshes it; a separate one-hour absolute limit remains. Startup/initialization receive 120 seconds; catalog requests remain bounded at 30 seconds. Website generation has ten minutes of inactivity tolerance plus a separate one-hour cap. Non-empty generation deltas refresh inactivity; unrelated network traffic/SSE keepalives do not. Manually generating background tabs no longer qualify for idle suspension.

The MCP catalog now permits eight servers / 64 discovered tools per server, with at most 32 enabled tools and a 48 KiB definition budget per task. Frame, catalog, transcript and result bytes remain separately bounded. The host's larger envelope applies only to internal mcp.transport, not ordinary UI/provider requests. Schema hashes are cached at admission instead of rehashing every raw schema on each runner iteration.

## Audit defects found and corrected

| Finding | Correction and check |
|---|---|
| Duplicate browsing/management navigation | One top tab strip plus a distinct registered-provider shelf; positive/negative fixture admission and reopen/collapse tests. |
| Connect displayed multiple setup paths immediately | Two selectors / one launch button; all detailed controls collapsed; disclosure and negative-health tests. |
| Late asynchronous setup could copy a key after leaving Connect | Lifetime and selection checks before key/copy; delayed-response navigation test. |
| Tool library/editor still competed with the task form | Mutually exclusive task/library/editor/consent surfaces; library viewport screenshots and interaction tests. |
| Arbitrary turn/lifetime cutoff destroyed task state | Safe in-memory budget pause/resume in Zag; UI continuation tests and added native regression program. |
| Waiting for user approval could be charged when state changed | Clock tick at the approval/manual-continue boundary; native regression source distinguishes wait from work. |
| Progressing MCP calls hit a short timeout | Matched progress extends inactivity without extending an absolute ceiling. Native cases cover matching/nonmatching progress. |
| Larger catalog frames were rejected by the outer host transport | Bounded internal envelope expanded; provider/main arbitrary process-output injection remains forbidden. |
| Folder-picker command missing from native AppManifest ACL inventory | Added main-only declaration; security inventory test now passes. |
| Source manifest versions did not equal current published server versions | Recipes corrected from primary publication records; tests assert the final pins. |
| Background manual generation could be suspended as idle | Browser-busy state included in the suspension guard. Native execution still requires testing. |

## VERIFIED

All counts below come from the completed current receipt `tests/evidence/refinement-final-checks.json`, the named individual reports and captured command logs. No native or live-provider results are inferred from UI tests.

| Executed check | Result | Boundary |
|---|---:|---|
| Svelte 5.48.0 offline compilation | 31 application modules; zero component warnings | Real compiled module graph; normal Vite build and full svelte-check not executed. Installed compiler emits a harmless Node module-type warning, not a component warning. |
| Existing application UI suite | 15 passed | Real Chromium + compiled Svelte; explicit native/provider doubles. |
| Discovery/MCP UI suite | 12 passed | Same boundary. |
| Browser-chrome UI suite | 14 passed | Same boundary. |
| Prior whole-interface audit suite | 38 passed | Same boundary; updated navigation/disclosure paths. |
| New progressive-workspace suite | 24 passed | Includes race, privacy, disclosure, folder, safe-resume and three-viewport cases. |
| Total compiled-UI scenarios | **103 passed; zero failed** | No recorded JavaScript runtime errors. |
| Node tests | **32 passed; zero failed** | Helpers, local HTTP fixtures, static boundaries and seven launch/recipe/security tests. Generated Bash is actually executed against explicitly fake opencode/claude/curl programs; real harness compatibility is not established. |
| Browser instrumentation | **26 passed; zero failed** | Chromium DOM fixtures, including the existing 22-turn sequence; no live provider. |
| Zag import/export/qualified call audit | 37 modules; 4,411 qualified calls; no mismatch | Static only: not Zag types, ownership, capability proofs, codegen or execution. |
| TypeScript script parser | Passed | Syntax only, not full type checking. |

The older 79 UI scenarios were retained, with selectors/actions updated for intentional disclosure changes. The new tests independently verify the initial collapsed state rather than opening everything and claiming cleanliness. Failures found during this audit (missing ACL, stale version expectation and earlier navigation assertions) were corrected and rerun; the complete final receipt has no unexpected exit.

`backend/tests/task_continuity.zag` adds native assertions for budgets, safe pause/resume identity, retained transcript/results, stale/duplicate approval refusal, catalog binding, waiting-time accounting and matched progress deadlines. `scripts/build-backend.sh` includes it. **That native test was not run**, and it is not part of the executed pass counts above.

## Screenshots

`screenshots/26-clean-browser.png`, `27-clean-connect.png`, `28-tool-library.png`, `29-safe-continuation.png`, and `30-clean-browser-light.png` are actual compiled Svelte screenshots rendered in Chromium. The provider content and native-host task states are deliberately labelled fixtures. They are not generated artwork, native Tauri/WebKit execution, real website inference, or evidence that Zag resumed a live task.

## FAILED / CURRENT BLOCKER

The fresh native build attempt exits **77** because the pinned Zag compiler is missing. Rust/Cargo and WebKitGTK build prerequisites are also unavailable in this runtime. Prerequisite and build logs are in the final receipt. There is no native executable or installer in this ZIP. Full TypeScript/Svelte type checking and the normal dependency-resolved Vite/Cargo build were not run.

Real coding clients, downloaded MCP servers, native dialogs/webviews, live website generation, actual OS grants, and a live same-conversation file/tool cycle remain unverified. Changes to the native transport and runner require native tests; they are not described as unchanged or implicitly safe because static checks passed.

## Remaining limitations

One profile per origin still limits simultaneous conversations from the same website. One built-in MCP task runs at a time. Safe task continuation is in memory while the application remains running, not durable task recovery across restart/crash. A terminal error/cancel still clears the volatile transcript. Broader tool grants expire/revoke and may require another approval.

Website quotas/authentication, provider redesigns, effective context limits, fixed transcript/result/stream buffers, user drafts, server failures and absolute operation ceilings can still interrupt work. The 100-turn default is a budget, not proof that every transcript fits every provider's context. Codemax does not silently switch models, replay uncertain side effects, restore permissions, start another conversation or circumvent quota to hide failures.

MCP remains local stdio. Direct remote HTTP/SSE/OAuth, full local JSON Schema validation, modern durable task handles, roots, sampling, elicitation and automatic embedded resource fetching are not implemented. Third-party executables and package-manager installation hooks run as the user and are not OS-sandboxed by these controls. The library supplies setup recipes, not all software prerequisites.

## NEXT CAUSAL STEP

On a provisioned Linux x86-64 graphical host, run `bash build-linux.sh`. Run the native unit programs including task_continuity.zag, the native MCP fixture integration, then a real website/harness tool cycle. Test long approval waits, a >30-second progressing MCP call, safe budget pause/resume, process loss and shutdown without duplicate side effects. A passing UI fixture does not replace these gates.

## REGRESSION STATUS / Recovery

Current executable regression checks pass within the stated boundaries. ZIP packaging verifies CRCs and every included-file checksum; PACKAGE_METADATA.json and the delivery receipt identify the final local commit and evidence. RECOVERY.bundle preserves complete local source history. Restore instructions are in docs/RECOVERY.md.

GitHub was used to inspect language and tool-server source/publication contracts. No remote repository push, live GitHub Actions run or new Google Drive upload is claimed for this revision. The deliverable is attached directly.
