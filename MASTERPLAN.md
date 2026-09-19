# Desktop Application Masterplan — Svelte + Tauri + Zag AI Web Bridge

## 0. Product Mission

Build a polished desktop application that lets a user sign into AI chat websites through an integrated side browser and expose the models available through those websites as a normalized **localhost model provider** usable by coding harnesses and other compatible clients.

The application should feel like a native developer tool, not a browser-extension hack.

Core experience:

```text
Install app
   ↓
Open AI website in integrated browser
   ↓
Log in normally
   ↓
App detects available models/features
   ↓
Models appear in local provider registry
   ↓
User points coding harness at localhost
   ↓
Harness sees selectable models
   ↓
Requests route through corresponding logged-in web chat

```

The app must not attempt to circumvent provider quotas.

It uses the website access the user already possesses.

---

# 1. Technology Architecture

## Frontend

```text
Svelte 5
TypeScript
Vite

```

Use modern Svelte runes for new reactive code:

```text
$state
$derived
$effect
$props

```

Current Svelte guidance recommends runes mode for new code.

## Desktop shell

```text
Tauri v2

```

Tauri uses a Rust core process and OS webviews. Windows uses WebView2, macOS uses WKWebView, and Linux uses WebKitGTK, so browser behavior must be tested per platform rather than assumed identical.

## Production backend

```text
Zag

```

The Zag backend runs as a bundled sidecar/service.

Tauri v2 explicitly supports bundling external executables written in arbitrary languages and launching them as sidecars.

## Rust responsibility

Rust must remain extremely thin.

Allowed Rust responsibilities:

```text
start Zag sidecar
stop Zag sidecar
restart crashed Zag sidecar
create/manage Tauri webviews
apply Tauri security capabilities
bridge Tauri IPC ↔ Zag transport
platform-specific window APIs
platform keychain bridge if required
updater/bootstrap integration

```

Do **not** migrate application business logic into Rust merely because Tauri uses Rust.

The business backend belongs in Zag.

---

# 2. Current Zag Platform Constraint

The current Zag repository describes its supported native compiler path as x86-64 Linux-first.

Therefore:

### Product Stage 1

```text
Linux x86-64 first-class development target

```

### Product Stage 2

Windows/macOS become release targets only after one of these is qualified:

1. supported Zag native target for platform;
2. supported Zag cross-compilation path;
3. stable platform-specific Zag sidecar artifact.

Do not quietly replace the backend with TypeScript or Rust to claim cross-platform completion.

A platform is supported only when its **Zag backend actually runs there**.

---

# 3. Process Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     Tauri Application                    │
│                                                          │
│  ┌───────────────┐           ┌────────────────────────┐  │
│  │ Svelte UI     │           │ Remote AI Webviews     │  │
│  │               │           │                        │  │
│  │ providers     │           │ Z.ai                   │  │
│  │ models        │           │ Qwen                   │  │
│  │ harness setup │           │ DeepSeek               │  │
│  │ sessions      │           │ Gemini                 │  │
│  │ detector lab  │           │ ChatGPT / etc.         │  │
│  └───────┬───────┘           └──────────┬─────────────┘  │
│          │                              │                │
│          └───────────┬──────────────────┘                │
│                      ▼                                   │
│               thin Tauri core                           │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │ private IPC
                       ▼
              ┌─────────────────┐
              │   Zag Backend   │
              │                 │
              │ detector        │
              │ model registry  │
              │ session manager │
              │ protocol bridge │
              │ quota state     │
              │ HTTP provider   │
              └────────┬────────┘
                       │
             127.0.0.1:<dynamic/fixed>
                       │
      ┌────────────────┼──────────────────┐
      ▼                ▼                  ▼
 Claude Code        OpenCode          other harness

```

---

# 4. Browser Architecture

Tauri can create attached webviews that load remote URLs, which is suitable for a side-browser design.

Use two conceptual webview classes:

## Trusted application webview

Loads bundled Svelte application.

May access carefully scoped Tauri commands.

## Untrusted provider webviews

Load:

```text
https://chat.z.ai
https://chat.qwen.ai
https://chat.deepseek.com
...

```

These remote webviews must **not** receive unrestricted Tauri IPC.

Treat all provider pages as hostile/untrusted from the desktop application's security perspective.

Tauri v2 capabilities allow command access to be scoped by window/webview, so production permissions should follow least privilege.

---

# 5. Browser Instrumentation

Each provider webview receives an origin-scoped initialization script.

Tauri provides initialization scripts that execute before normal page scripts on desktop webviews.

Instrumentation responsibilities:

```text
DOM observations
accessibility-like semantic observations where available
fetch observation
XHR observation
WebSocket observation
SSE/EventSource observation
history/navigation
UI interactions
mutation summaries
stream state
visible response boundaries
model-control interactions

```

Do not dump every DOM mutation continuously.

Use bounded event summaries.

---

# 6. Instrumentation Privacy Rules

Instrumentation must explicitly refuse to capture:

```text
password fields
credit-card inputs
security codes
session cookies
authentication headers
raw browser credential stores
OAuth secrets

```

The application does not need them.

The browser webview itself owns provider authentication state.

The detector should receive semantic evidence such as:

```text
login_state = authenticated

```

rather than credentials.

---

# 7. Browser Profiles

Each provider should support a persistent profile.

Conceptually:

```text
profile/
  provider-id/
    webview-storage/
    metadata/

```

Goals:

- user logs in once;
- provider sessions survive restart where platform allows;
- providers remain isolated;
- clearing one provider does not destroy every login.

Tauri webview configuration supports separate data-directory concepts, but platform behavior must be verified individually.

---

# 8. Main UI Layout

Target a polished, dense developer-tool interface.

Default layout:

```text
┌─────────────────────────────────────────────────────────────────┐
│ App     Provider       Model         API ●      Settings        │
├───────────────┬─────────────────────────────────────┬───────────┤
│ Providers     │                                     │ Inspector │
│               │                                     │           │
│ ● Z.ai        │                                     │ Model     │
│ ● Qwen        │        Provider Web Browser         │ Context   │
│ ● DeepSeek    │                                     │ Reasoning │
│ ○ Gemini      │                                     │ Session   │
│ + Add site    │                                     │ Evidence  │
│               │                                     │           │
├───────────────┴─────────────────────────────────────┴───────────┤
│ localhost:7331     6 models     2 active sessions      Ready    │
└─────────────────────────────────────────────────────────────────┘

```

Panels should be collapsible.

The browser remains the central surface.

---

# 9. UI Design Principles

The application should look like a modern 2026 developer tool.

Avoid:

- giant rounded mobile cards everywhere;
- excessive gradients;
- pointless glass effects;
- 1990s browser chrome;
- oversized whitespace;
- excessive modal dialogs;
- full reloads for state changes;
- flashy animations interfering with browsing.

Prefer:

- crisp hierarchy;
- subtle depth;
- compact but readable controls;
- fast transitions;
- excellent typography;
- keyboard navigation;
- status conveyed by more than color;
- command palette;
- resizable panes;
- context menus;
- dense inspector views.

---

# 10. Required Screens

## 10.1 Home

Show:

```text
provider status
detected models
local API status
active sessions
recent failures
quota/limit signals

```

## 10.2 Provider Browser

Central browser + provider controls.

## 10.3 Models

Table:

```text
Provider
Model
Reasoning
Context
Tokenizer
Vision
Tools
Status
Confidence

```

## 10.4 Harness Setup

Generate configuration snippets for supported protocol modes.

## 10.5 Sessions

Display:

```text
harness session
provider
provider conversation
model
turn count
estimated context use
state

```

## 10.6 Detector Lab

Developer/research view:

```text
raw evidence
hypotheses
PAM outputs
network diffs
confidence
actions
connector mappings

```

## 10.7 Settings

Include:

```text
API port
local API token
auto-start
provider profiles
fallback behavior
logging
privacy
developer mode
TNN detector mode

```

---

# 11. Provider Onboarding

Workflow:

```text
Add Provider
   ↓
Enter URL
   ↓
Create isolated webview
   ↓
User logs in
   ↓
Detector observes page
   ↓
Detector finds prompt/model controls
   ↓
User optionally interacts with page
   ↓
Detector learns mappings
   ↓
Provider becomes Ready

```

Unknown websites must be first-class.

Do not require a provider to exist in source code before opening it.

---

# 12. Provider State Machine

```text
UNCONFIGURED
   ↓
LOADING
   ↓
LOGIN_REQUIRED
   ↓
DISCOVERING
   ↓
READY
   ↓
RATE_LIMITED
   ↓
READY

or

READY
   ↓
BROKEN_MAPPING
   ↓
REDISCOVERING
   ↓
READY

```

Do not represent everything as:

```text
connected = true/false

```

---

# 13. Detector Architecture

The production detector consumes:

```text
DOM summaries
network events
control interactions
request/response diffs
visible labels
temporal relations
stream boundaries

```

Output:

```text
ProviderManifest

```

The implementation should support two detector engines:

```text
baseline symbolic detector
TNN detector

```

and eventually:

```text
hybrid detector

```

This allows the desktop app to continue functioning while TNN research progresses.

---

# 14. Detector Plugin Boundary

Define:

```text
DetectorEngine

```

interface conceptually as:

```text
observe(event)
propose_actions()
record_consequence()
get_manifest()
get_confidence()
serialize_state()
restore_state()

```

The UI does not know whether the implementation is:

```text
symbolic
TNN
hybrid
mock

```

---

# 15. Provider Manifest

Example:

```json
{
  "id": "zai-web",
  "origin": "https://chat.z.ai",
  "state": "READY",

  "models": [
    {
      "id": "glm-5.3",
      "display_name": "GLM-5.3",

      "reasoning": {
        "supported": true,
        "modes": ["normal", "thinking"]
      },

      "context": {
        "nominal": 131072,
        "effective": null,
        "confidence": "DISCOVERED"
      },

      "tokenizer": {
        "mode": "server_reported",
        "name": null
      }
    }
  ]
}

```

Everything uncertain must allow:

```text
null / UNKNOWN

```

---

# 16. Local Provider API

The Zag service owns the external localhost server.

Required endpoints:

```text
GET  /health
GET  /v1/models

POST /v1/chat/completions
POST /v1/responses
POST /v1/messages

```

Optional internal endpoints:

```text
GET  /bridge/providers
GET  /bridge/sessions
GET  /bridge/status

```

Never expose research/debug internals on the normal external interface unless developer mode explicitly enables them.

---

# 17. Authentication

On first launch generate:

```text
sk-local-<random>

```

The token is only for authenticating local clients.

It is not a provider credential.

Rules:

- bind only to loopback by default;
- never bind `0.0.0.0` automatically;
- require token for inference;
- display token only on explicit reveal;
- support token regeneration;
- terminate existing clients after regeneration if possible.

---

# 18. `/v1/models`

Normalize discovered models.

Example:

```json
{
  "object": "list",
  "data": [
    {
      "id": "zai/glm-5.3",
      "object": "model",
      "owned_by": "zai-web"
    },
    {
      "id": "qwen/qwen-max",
      "object": "model",
      "owned_by": "qwen-web"
    }
  ]
}

```

Internal metadata may contain much more than protocol-compatible output.

---

# 19. Normalized Request Model

Internally convert all external protocols into:

```text
NormalizedGenerationRequest

```

Fields:

```text
request_id
session_hint
model
messages[]
system
tools[]
tool_choice
temperature
max_output
reasoning
attachments[]
stream
metadata

```

Then convert provider output into:

```text
NormalizedGenerationEvent

```

such as:

```text
TEXT_DELTA
REASONING_DELTA
TOOL_CALL_START
TOOL_CALL_DELTA
TOOL_CALL_END
USAGE
DONE
ERROR

```

---

# 20. Session Manager

This is critical.

Maintain:

```text
Harness Session
       ↕
Provider Conversation

```

Example:

```text
Claude Code session 8AE4
     ↕
Z.ai conversation d813...

```

Avoid pasting the full conversation into a new web chat every request.

Persist mapping where safe.

---

# 21. Session State

```text
Session
  local_id
  client_type
  provider
  model
  provider_conversation_id
  created_at
  last_used
  context_estimate
  turn_count
  status

```

Possible state:

```text
ACTIVE
IDLE
CONTEXT_WARNING
PROVIDER_LOST
RATE_LIMITED
EXPIRED

```

---

# 22. Context Management

Track:

```text
nominal_context
effective_context
estimated_used
reported_used
reserved_output
safety_margin

```

If provider token usage exists, prefer it.

Otherwise:

```text
exact local tokenizer
   ↓
known tokenizer family
   ↓
calibrated estimator
   ↓
conservative approximation

```

Never present an estimate as exact.

---

# 23. Tool Call Bridge

Coding harness support requires structured tool calls.

Pipeline:

```text
provider model
   ↓
tool representation
   ↓
Zag parser
   ↓
normalized tool event
   ↓
OpenAI/Anthropic protocol
   ↓
coding harness
   ↓
tool executes
   ↓
tool result
   ↓
provider conversation

```

Tool syntax must use a robust streaming state machine.

Do not use one giant regular expression.

---

# 24. Tool Protocol

Internally support a canonical framing format.

Example concept:

```text
<bridge-tool-call>
{...}
</bridge-tool-call>

```

Requirements:

- escaping;
- partial-stream parsing;
- malformed call recovery;
- multiple calls;
- nested JSON;
- explicit IDs;
- cancellation;
- maximum payload limits.

Eventually use provider-native structured tools where a website genuinely supports them.

---

# 25. Browser Request Execution

The provider executor should know how to perform normalized operations:

```text
select_model
select_reasoning
new_chat
send_message
read_stream
stop
regenerate
attach_file
continue_conversation

```

The executor should consume detector-discovered mappings rather than hard-coded site-specific code whenever possible.

---

# 26. Generic Connector

Every provider starts from a generic connector.

```text
GenericConnector
  manifest
  action mappings
  evidence references

```

Only create provider patches where absolutely necessary.

Provider patch examples may handle:

```text
weird iframe
custom editor
nonstandard streaming
unusual authentication flow

```

but should not duplicate the entire core.

---

# 27. Connector Package Format

Conceptual:

```text
connectors/
  provider-id/
    manifest.json
    mappings.json
    patch.zag
    tests/

```

Generated connector state belongs in app data rather than source when learned dynamically.

---

# 28. Automatic Connector Recorder

Build an interactive recorder.

User can select:

```text
Create Connector

```

The application observes:

```text
user opens model menu
user selects model
user types prompt
user sends
response appears
user toggles reasoning

```

and derives candidate mappings.

UI:

```text
Detected

✓ Prompt input
✓ Send action
✓ Response container
✓ Model selector
✓ 6 model options
✓ Reasoning control
? Context limit
? Tokenizer

```

---

# 29. Network Observation Strategy

Observe:

```text
fetch
XHR
WebSocket
EventSource

```

Capture only metadata needed by the detector.

Store bounded representations:

```text
method
URL pattern
content type
body structural summary
response structural summary
changed fields
timing
correlation IDs

```

Raw payload storage should be opt-in developer/research mode.

---

# 30. DOM Observation Strategy

Avoid full DOM snapshots for every mutation.

Use:

```text
interactive elements
roles
labels
text around controls
contenteditable
buttons
menus
comboboxes
selected states
response regions
mutation summaries

```

This improves performance and reduces accidental capture of unrelated page content.

---

# 31. Side Browser Navigation

Support:

```text
back
forward
reload
home
open externally
copy URL
dev inspector toggle
new provider tab
close tab

```

Tabs should correspond to provider browser sessions.

---

# 32. Multi-Webview Layout

Tauri supports multiple webviews, including attached remote webviews.

Preferred architecture:

```text
one local Svelte app webview
+
one active provider webview
+
optional background provider webviews

```

Avoid keeping dozens of active remote webviews running without need.

Suspend or unload idle providers.

---

# 33. Security Model

Trust boundaries:

```text
Svelte UI           trusted
Tauri core          highly trusted
Zag backend         highly trusted
Provider webviews   untrusted
Harness clients     partially trusted
Website data        untrusted

```

Rules:

- remote provider pages never get arbitrary Tauri commands;
- Zag validates every message from instrumentation;
- harness parameters are bounded;
- only loopback API by default;
- no provider cookie exfiltration;
- no shell command execution from provider content;
- no arbitrary filesystem access from provider pages;
- webview-specific Tauri capability scopes.

---

# 34. Tauri Permissions

Use minimum capability sets.

Tauri v2's capability system can restrict which webviews access which commands.

Example philosophy:

```text
main-ui:
    app commands
    window controls

provider-*:
    no general shell
    no filesystem
    no arbitrary Tauri invoke

```

Never enable broad permissions for convenience.

---

# 35. Zag Backend Modules

Suggested architecture:

```text
backend/
  main.zag

  server/
    http.zag
    auth.zag
    sse.zag
    routing.zag

  protocol/
    normalized.zag
    openai.zag
    responses.zag
    anthropic.zag

  providers/
    registry.zag
    connector.zag
    executor.zag

  browser/
    evidence.zag
    events.zag
    actions.zag

  detector/
    symbolic.zag
    tnn_bridge.zag
    hybrid.zag

  sessions/
    manager.zag
    context.zag
    mapping.zag

  tools/
    parser.zag
    state_machine.zag

  storage/
    config.zag
    database.zag
    state.zag

  security/
    local_token.zag
    validation.zag
    redaction.zag

  telemetry/
    log.zag
    metrics.zag

```

---

# 36. Rust Host Modules

Keep small:

```text
src-tauri/
  src/
    main.rs
    sidecar.rs
    webviews.rs
    permissions.rs
    ipc_proxy.rs
    platform.rs

```

If this directory becomes large, investigate whether Zag functionality has incorrectly migrated into Rust.

---

# 37. Svelte Project Structure

```text
src/
  lib/
    components/
      browser/
      providers/
      models/
      sessions/
      inspector/
      settings/
      common/

    state/
      providers.svelte.ts
      models.svelte.ts
      sessions.svelte.ts
      app.svelte.ts

    api/
      backend.ts
      tauri.ts

    types/
      provider.ts
      model.ts
      session.ts
      evidence.ts

    design/
      tokens.css
      typography.css
      motion.css

  routes/
    +layout.svelte
    +page.svelte
    providers/
    models/
    sessions/
    harness/
    detector/
    settings/

```

Use SvelteKit only if routing/build ergonomics justify it; the application should still produce static client assets for Tauri.

---

# 38. State Management

Use Svelte 5 reactive modules.

Separate:

```text
persistent backend state

```

from:

```text
ephemeral UI state

```

Do not duplicate authoritative provider/session state across frontend stores.

Frontend should subscribe to backend events and derive display state.

---

# 39. Event Bus

Backend → UI events:

```text
provider.updated
provider.login_required
provider.ready
provider.rate_limited
model.discovered
model.changed
session.started
session.updated
session.ended
backend.status
detector.progress
detector.hypothesis
error

```

Avoid polling every 500 ms.

---

# 40. Internal Zag ↔ Tauri Transport

Preferred:

```text
local private socket / pipe

```

or controlled loopback transport.

Tauri UI should call thin Rust commands.

Rust forwards requests to Zag.

External harnesses independently connect to Zag's localhost HTTP server.

This keeps:

```text
frontend

```

from becoming the backend.

---

# 41. Sidecar Lifecycle

Startup:

```text
Tauri starts
→ generate/locate private IPC endpoint
→ launch Zag sidecar
→ perform handshake
→ verify protocol version
→ wait for healthy
→ unlock UI

```

Shutdown:

```text
request graceful backend shutdown
→ wait bounded time
→ terminate if necessary

```

Crash:

```text
detect
→ preserve crash metadata
→ restart
→ restore persistent state
→ reconnect UI

```

---

# 42. Backend Handshake

Example:

```json
{
  "protocol": 1,
  "backend": "zag",
  "version": "0.1.0",
  "capabilities": [
    "openai",
    "anthropic",
    "browser-evidence"
  ]
}

```

Reject incompatible protocol versions.

---

# 43. Storage

Persistent data:

```text
settings
provider manifests
connector mappings
session metadata
detector learned state
TNN state references
model metadata
local API token

```

Avoid storing:

```text
provider passwords
raw cookies
full request dumps

```

unless a specific research mode deliberately and safely requires them.

---

# 44. Logging

Levels:

```text
ERROR
WARN
INFO
DEBUG
TRACE

```

Default logging must redact:

```text
Authorization
Cookie
Set-Cookie
password
tokens
sensitive form values

```

Logs should be useful enough to diagnose connector failures without leaking accounts.

---

# 45. Quota and Limit Detection

Track provider-visible states:

```text
AVAILABLE
SOFT_LIMIT
RATE_LIMITED
DAILY_LIMIT
COOLDOWN
UNKNOWN

```

Never attempt automatic quota circumvention.

Optional routing:

```text
selected model limited
→ notify client

or, if user enables fallback:
→ use configured alternate model

```

Fallback must be explicit user policy.

---

# 46. Routing Policies

Later support:

```text
manual
first_available
best_free
coding
fastest
reasoning
vision
fallback_chain

```

But the initial release should prioritize explicit model selection over clever routing.

Reliability first.

---

# 47. Harness Configuration Screen

Display:

```text
Endpoint:
http://127.0.0.1:7331/v1

API key:
sk-local-••••••••

Models:
zai/glm-5.3
qwen/...

```

Provide copy buttons and provider-specific snippets.

Do not require users to manually inspect config files.

---

# 48. Streaming

SSE must stream incrementally to clients.

Pipeline:

```text
website mutation/network event
→ provider response parser
→ normalized delta
→ HTTP SSE
→ harness

```

Do not wait for the entire website response before returning it.

---

# 49. Cancellation

When client disconnects or sends cancellation:

```text
client cancellation
→ session manager
→ provider executor
→ click/trigger website stop control
→ mark generation cancelled

```

Avoid zombie generations consuming website quota.

---

# 50. Error Model

Normalize failures:

```text
AUTH_REQUIRED
PROVIDER_RATE_LIMITED
MODEL_UNAVAILABLE
MAPPING_BROKEN
CONTEXT_LIMIT
SITE_CHANGED
BACKEND_ERROR
BROWSER_ERROR
TIMEOUT
CANCELLED

```

Return protocol-compatible errors while preserving rich internal diagnostics.

---

# 51. Performance Targets

Initial engineering targets:

```text
UI interactions              < 50 ms perceived
backend command overhead     negligible relative to provider
stream forwarding            near-real-time
idle CPU                     near zero
event buffers                bounded
no unbounded DOM history
no busy-loop polling

```

The website itself may be slow; the bridge should not add visible lag.

---

# 52. Test Infrastructure

Build fake AI providers.

Each mock site should emulate:

```text
login
model selector
reasoning selector
chat
SSE
WebSocket
context error
quota message
site redesign

```

Run them locally.

This makes end-to-end tests deterministic.

---

# 53. Zag Unit Tests

Cover:

```text
JSON
HTTP
SSE
protocol translation
session state
tool parser
stream parser
model registry
auth validation
detector event decoding
redaction
error translation

```

---

# 54. Frontend Tests

Test:

```text
provider cards
model tables
session view
browser controls
settings
error states
keyboard navigation
responsive pane sizes

```

Use component tests plus full application smoke tests.

---

# 55. Browser Integration Tests

Mock provider scenarios:

```text
normal chat
slow stream
broken stream
model switch
reasoning switch
login expiration
rate limit
DOM redesign
WebSocket transport
navigation
provider crash

```

---

# 56. Security Tests

Required:

```text
remote page attempts Tauri invoke
remote page attempts file read
malformed backend IPC
malformed harness payload
oversized request
invalid JSON
path traversal
header injection
local API missing key
non-loopback bind refusal
sensitive log redaction

```

---

# 57. Phase 0 — Repository + Contracts

Deliver:

```text
MASTERPLAN.md
ARCHITECTURE.md
PROTOCOL.md
SECURITY.md
UI_SPEC.md

```

Freeze basic interfaces before building features.

---

# 58. Phase 1 — Skeleton

Deliver:

- Tauri shell;
- Svelte UI;
- Zag sidecar;
- health handshake;
- clean startup/shutdown;
- local API `/health`.

No provider work yet.

Gate:

```text
launch → healthy → shutdown

```

must be deterministic.

---

# 59. Phase 2 — Side Browser

Deliver:

- remote webview;
- address/provider control;
- navigation;
- persistent provider session;
- provider list;
- login experience.

No detector yet.

---

# 60. Phase 3 — Instrumentation

Deliver:

- initialization script;
- DOM summaries;
- fetch/XHR capture;
- WebSocket/SSE metadata;
- interaction events;
- Zag evidence receiver.

Gate:

Instrumentation must not noticeably degrade website responsiveness.

---

# 61. Phase 4 — Generic Detector

Deliver symbolic baseline:

```text
prompt input
send control
response region
model selector
reasoning selector

```

Use this to unblock product work while TNN research proceeds.

---

# 62. Phase 5 — Model Registry

Deliver:

```text
GET /v1/models

```

Models update live as detector discovers them.

---

# 63. Phase 6 — One Complete Provider

Choose one provider as the vertical slice.

Implement:

```text
login
discovery
model selection
prompt
stream
session continuation
stop
localhost API

```

Do not support ten half-working providers.

One complete end-to-end provider first.

---

# 64. Phase 7 — OpenAI-Compatible Chat

Deliver:

```text
POST /v1/chat/completions
stream=true

```

Connect a real compatible harness/client.

Gate:

multi-turn coding conversation survives.

---

# 65. Phase 8 — Session Continuity

Implement stable mapping between harness and website conversation.

Gate:

20+ turn session without repeatedly replaying full history unnecessarily.

---

# 66. Phase 9 — Tools

Implement canonical tool bridge.

Gate:

Harness can:

```text
request tool
execute tool
return result
continue model response

```

for repeated cycles.

---

# 67. Phase 10 — Anthropic Compatibility

Add:

```text
POST /v1/messages

```

Translate to normalized internal representation.

Do not create separate provider implementations for every API format.

---

# 68. Phase 11 — Responses API

Add:

```text
POST /v1/responses

```

using same normalized core.

---

# 69. Phase 12 — Unknown Website Flow

Enable:

```text
Add any AI chat URL

```

Generic detector attempts discovery.

If incomplete:

```text
interactive recorder

```

helps learn missing mappings.

---

# 70. Phase 13 — TNN Integration

Plug in research detector interface.

Modes:

```text
Symbolic
TNN Shadow
Hybrid

```

### TNN Shadow

TNN makes predictions but cannot control production.

Compare:

```text
production mapping
vs
TNN mapping

```

### Hybrid

Only after research qualification.

---

# 71. Phase 14 — Context + Token Accounting

Add:

```text
context limits
usage display
token-source provenance
remaining estimate

```

UI should communicate:

```text
Exact
Provider-reported
Calibrated
Estimated
Unknown

```

---

# 72. Phase 15 — Quota Awareness

Detect provider messages and states.

Display in sidebar.

Optional fallback only after explicit user configuration.

---

# 73. Phase 16 — Production Hardening

Test:

```text
100 app restarts
sidecar crashes
browser crashes
expired login
network disconnect
provider redesign
malformed website response
rapid cancellation
parallel sessions

```

No unrecoverable corruption.

---

# 74. Phase 17 — Packaging

Linux first.

Bundle Zag sidecar through Tauri's external binary mechanism. Tauri requires target-triple-specific sidecar binaries for each packaged platform.

Do not advertise Windows/macOS until corresponding Zag binaries pass all backend gates.

---

# 75. Release Quality Gate

Before `v0.1.0`:

### Browser

```text
login survives restart
navigation reliable
provider isolation works

```

### API

```text
models endpoint
chat completions
streaming
cancellation
multi-turn

```

### Harness

At least one real coding harness completes:

```text
prompt
file/tool cycle
follow-up
continued session

```

### UI

No placeholder screens.

### Security

No broad remote-page privileges.

### Backend

Core business logic actually runs in Zag.

---

# 76. Post-v0.1 Features

After reliability:

```text
provider fallback chains
parallel model querying
consensus
model comparison
provider health scoring
automatic rediscovery
TNN learned connectors
profile import/export
session search
model capability benchmark

```

---

# 77. Features Explicitly Deferred

Do not derail v0.1 with:

```text
cloud sync
social features
mobile
remote hosted gateway
marketplace
multi-user server
team management
complex billing

```

The product is a local desktop bridge first.

---

# 78. UX Acceptance Standard

The app should require roughly:

```text
install
→ login
→ copy endpoint/key
→ select model in harness

```

Everything else should be optional advanced functionality.

No 30-step setup wizard.

---

# 79. Crash Philosophy

One provider failing must not kill:

```text
other providers
Zag API
main UI
active unrelated sessions

```

Tauri's multi-process design is useful here; keep failures isolated where possible.

---

# 80. Update Philosophy

Every provider mapping has:

```text
version
last_verified
evidence
health

```

When website behavior changes:

```text
mapping fails
→ mark degraded
→ trigger rediscovery
→ compare new mapping
→ recover

```

Do not silently generate incorrect requests.

---

# 81. App/TNN Integration Contract

The desktop app sends:

```text
ObservationEvent

```

The TNN detector returns:

```text
DiscoveryManifest
InvestigationAction[]

```

The product executes only actions permitted by its safety policy.

TNN never directly controls the OS/browser without the app's action validator.

---

# 82. Action Validator

Production validator rejects:

```text
password edits
billing actions
account deletion
security setting changes
external downloads without permission
unsupported navigation
quota-bypass attempts

```

TNN proposes.

Product policy decides whether an action is executable.

---

# 83. Development Agent Rules

The desktop-app agent must:

1. Read this masterplan before changes.
2. Keep the Zag backend authoritative.
3. Keep Rust thin.
4. Never move functionality to frontend merely because it is easier.
5. Build vertical slices, not disconnected components.
6. Test every feature in the real UI.
7. Preserve security boundaries.
8. Maintain mock providers.
9. Update architecture docs when interfaces change.
10. Avoid TODO-based fake completion.
11. Do not call a feature done because it compiles.
12. Verify actual harness interoperability.

---

# 84. Required Progress Report Format

After each major implementation round:

```text
COMPLETED
- ...

VERIFIED
- ...

FAILED
- ...

CURRENT BLOCKER
- ...

NEXT CAUSAL STEP
- ...

REGRESSION STATUS
- ...

```

No vague:

```text
"mostly done"

```

---

# 85. Definition of Product Success

The application succeeds when a user can:

1. Install the app.
2. Open an arbitrary supported AI chat website inside it.
3. Sign in normally.
4. Have the app discover available models and relevant controls.
5. See those models in a polished UI.
6. Start the Zag localhost provider.
7. Connect a coding harness through a normal provider endpoint.
8. Select a detected web model.
9. Run a multi-turn coding-agent session.
10. Receive streamed responses.
11. Execute structured tool cycles.
12. Continue the same provider conversation.
13. Stop generation.
14. Detect provider rate limits.
15. Recover from common website changes.
16. Preserve login/session state across application restart.
17. Run without a giant laggy browser-extension architecture.
18. Keep provider credentials inside provider browser storage rather than extracting them.
19. Use TNN detection once the research gates qualify it.
20. Keep the core routing, protocol, detection integration, session management, and provider logic in Zag.

---

# 86. Final Architecture Goal

The finished product should look conceptually simple from the outside:

```text
AI websites you already use
          │
          ▼
┌────────────────────────┐
│   Desktop AI Bridge    │
│                        │
│ Browser                │
│ Detection              │
│ Sessions               │
│ Zag provider gateway   │
└───────────┬────────────┘
            │
      localhost API
            │
            ▼
   coding harness of choice

```

But internally it should maintain strict boundaries:

```text
Svelte      = presentation
Tauri/Rust  = desktop orchestration
Zag         = production backend
PAM/TNN     = learned discovery intelligence
Webviews    = provider execution environment

```

That boundary is non-negotiable because it keeps the application maintainable while simultaneously turning the detector into a genuine TNN research target rather than burying intelligence inside ad-hoc frontend scripts.