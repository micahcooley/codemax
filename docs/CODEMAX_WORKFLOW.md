# Codemax: browse, discover, connect

## Daily workflow

Launch the dedicated desktop browser. Enter a website address or search in the address bar. Sign in using the website's ordinary interface. The native webview owns the login session; Codemax does not extract cookies, passwords, or authorization headers.

Discovery is passive and event-driven. It observes bounded semantic controls, model and reasoning selections, assistant response regions, and whitelisted capability fields from website requests/responses. There is no periodic test prompt, automatic menu-opening loop, subscription purchase, or attempt to bypass a quota. Opening a hidden model menu normally gives the observer additional evidence.

A browser profile is not automatically a model provider. Before automatic admission the Zag detector requires an unambiguous chat composer and send action, observed model identity, and independent conversation evidence. A generic page region, search field, login form, model-shaped phrase, or opened domain alone is insufficient. The detector has no rule that declares all Google pages providers or excludes all Google pages from being legitimate AI chats. Admission depends on evidence, not brand recognition.

Once a site is ready, its enabled observed models enter the authenticated local registry. Open **Connect a client**, select the client format, and use its generated connection details. Subsequent website interactions update the registry and the displayed configuration. The application does not secretly modify third-party configuration files. A client with a static/cached model list may require refresh, restart, or a new export.

This is a normal desktop browser workspace, not an extension. Source constraints remain: Linux x86-64, up to 16 origin-isolated profiles, one active provider conversation per profile, up to 32 models per profile. It is not a full Chromium replacement, does not promise multiple simultaneous same-origin provider tabs, and does not claim compatibility with every website.

## What counts as evidence

| Evidence | Interpretation |
|---|---|
| Composer + send only | Candidate; not enough to expose a model |
| Model selector with exact choices | Observed available choices, subject to website state |
| Assistant log/response semantics | Independent conversation evidence |
| New-chat + reasoning + model controls | Alternative chat-structure evidence, alongside response mapping |
| Generic main/page region | Can bound execution output; not proof of chat on its own |
| Ordinary search form or login form | Browsing/sign-in only; no inferred provider |
| Explicit context field scoped to a known model | Website-reported nominal limit, not effective budget |
| Tokenizer identity | A name only; not proof that an exact tokenizer is installed |
| Unexposed information | Unknown |

Custom popover choices must be associated with their actual model/reasoning control through ARIA relationships or a recent user-opened menu. An unrelated open settings menu must not become a model catalog. Native select choices are observed directly; disabled choices are not available. Models keep stable registry IDs and exposure preferences when menus close. New documents require fresh availability observations. Selection is revalidated at execution; stale mappings fail rather than selecting a substitute model.

Capability metadata is intentionally conservative: small, explicitly bounded JSON; scalar whitelisted fields; explicit model binding; no guessed context from a model name or token count from text length presented as exact. Request metadata recognizes actual observed selection when messages and a model are present. Response metadata is read only from same-origin metadata-shaped endpoints with bounded declared length and a bounded clone read. This will miss some websites' data rather than inspect arbitrary payloads. Reasoning choices exposed by controls are actionable; network reasoning scalar evidence does not invent missing controls.

## Provider settings

**Providers** lists admitted, non-dismissed sites. Its default surface exposes the site and model toggles, passive-discovery switch, current model, reasoning choices, and capability provenance.

**Advanced** contains a display-name override, user-supplied context budget, preferred reasoning value, mappings/recorder, rescan, keep-awake behavior, and the option to treat a site as ordinary browsing. User overrides remain distinguishable from observed facts. A previously detected but currently offline site may remain in settings for management without appearing as an available model in the gateway.

Disabling exposure removes the site from the live registry. Disabling an individual model excludes that model. Pausing discovery stops semantic observation after the new-document handshake; the backend independently ignores disabled discovery. Dismissal persists until the user resumes discovery. Disabling an active model/site or losing a task's conversation revokes its local MCP task.

## Harness mode and website-tools mode are different

In **harness mode**, the selected coding client uses the model-provider API. The client receives tool calls, runs tools under its own permissions, and sends results back. The local token authenticates that client to Codemax; it is not a paid API credential or a website credential. Website sessions and website quota still supply inference.

In **website-tools mode**, Codemax itself is the MCP client. In Tools & MCP the user connects trusted tools, enables specific tools, and starts a bounded task with an observed website model. Codemax supplies tool instructions and manages the continuation. There is no separate model API key to enter for this built-in task flow.

Merely adding an MCP server to an external harness does not replace that harness's model. The two connections must not be presented as interchangeable.

## Browsing while a task runs

The active website remains visible. Loading and generation rings spin; idle rings remain stationary; reduced-motion preferences retain meaningful static labels. Background network activity alone does not indicate a running model.

Automatic insertion refuses to overwrite an unsent user draft. If the composer changes before the send action, the automatic send is refused. Leaving the task conversation or revoking its model invalidates a pending tool approval. Cancellation stops generation and revokes volatile tool grants. These are intended source behaviors with Chromium browser-agent verification; native runtime qualification is tracked separately in EXECUTION_REPORT.md.

## Implementation boundary

`backend/detector/symbolic.zag` owns admission and manifests. `backend/providers/registry.zag` owns exposure and model IDs. `backend/mcp/` owns MCP protocol, consent, task state and continuation. Svelte renders backend state and submits commands. Rust creates native webviews and transports bounded bytes to explicitly trusted stdio processes. The browser script observes and performs validated DOM actions; it does not own the registry, routing or permissions.

Reference research is recorded in SOURCES.md. Product rules here derive from the user's clarified workflow; passing screenshots or source audits is not evidence that every native or live-provider path works.
