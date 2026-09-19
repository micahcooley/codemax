# Masterplan phase accounting

A source path is not a passed release gate. No native feature below is described as runtime verified solely because it was authored.

| Phase | Source delivered | Gate status |
|---|---|---|
| 0 — repository/contracts | Original masterplan; architecture, protocol, security, UI and provenance documents; local repository/package preparation | Local source complete; no remote GitHub push |
| 1 — skeleton | Svelte entry, Tauri shell, Zag process, handshake/health/lifecycle source | Native launch/healthy/shutdown NOT RUN |
| 2 — side browser | Attached provider views, navigation, per-provider data paths and explicit manual-login flow | Real native login/profile persistence/isolation NOT RUN; some navigation controls absent |
| 3 — instrumentation | DOM summaries, fetch/XHR/WS/EventSource metadata, safe deltas and bounded observation channel | Chromium in-memory agent tests PASS; WebKitGTK/performance/HTTP-browser tests NOT QUALIFIED |
| 4 — generic detector | Zag symbolic DOM baseline and user-confirmed semantic recipes | Zag detector NOT COMPILED; no learned network diffs |
| 5 — model registry | Normalized Zag model registry and `/v1/models` path | Native endpoint NOT RUN |
| 6 — complete provider | Deterministic fake provider and generic executor | No live provider qualified |
| 7 — OpenAI chat | Chat subset translation, streaming/source examples | No real client/harness qualification |
| 8 — continuity | In-memory Zag history matching, session IDs and metadata persistence | 22-turn browser-agent fixture PASS only; native 20-turn session test NOT RUN; live restore absent |
| 9 — tools | Native framing parser, serializers and fixed-file native fixture test source | Native tool parser/test NOT RUN; real harness tool cycle NOT RUN |
| 10 — Anthropic | Messages subset translator/serializer | Native/client compatibility NOT RUN |
| 11 — Responses | Responses subset translator/serializer | Native/client compatibility NOT RUN |
| 12 — unknown site | HTTPS onboarding, generic controls and semantic recorder source | Unknown live websites/custom editors NOT QUALIFIED |
| 13 — TNN | Bounded shadow decoder and proposed research envelope | No artifact loaded; no prediction experiment; hybrid disabled |
| 14 — context/accounting | Explicit null context, estimated byte accounting and provenance | No exact tokenizer/calibration/provider-usage discovery |
| 15 — quotas | Stop-on-quota/auth states; no fallback/account rotation | Synthetic agent cases PASS; native/live cases NOT RUN |
| 16 — hardening | Bounded queues, state-file checks, cancellations, locks, crashes/backoff source and test scaffolding | 100 restarts, native fuzzing, memory/performance, parallel-provider stress NOT RUN |
| 17 — packaging | Linux scripts, target sidecar layout, CI workflow source, source ZIP | No compiled installer; GitHub execution blocked |

## Next causal work after restoring a capable environment

1. Compile the pinned Zag native unit suite. Fix actual compiler diagnostics before interpreting source checks as native validity.
2. Compile/run the actual Zag gateway fixture; inspect authentication, tools, 22-turn session, SSE and disconnect reports.
3. Resolve dependencies, run Svelte checking/build and Rust host tests; fix actual frontend/host diagnostics.
4. Run Tauri/WebKitGTK mock-provider UI, resize/modal/permission/profile-isolation and crash tests.
5. Qualify one authorized real website and one named coding harness, including repeated permitted tool cycles, stop and 20+ turns.
6. Implement/qualify restart restoration, missing executor/UI controls and hardening. Only then build/sign release installers.

These steps are not scheduled, running in the background, or already completed.
