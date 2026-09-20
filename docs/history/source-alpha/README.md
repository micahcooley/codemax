# Desktop AI Bridge — 0.1.0-alpha.1

**Source alpha. Not an installer, completed masterplan, qualified native build, or verified live AI-provider bridge.**

This package implements source for the uploaded **Svelte 5 + Tauri 2 + Zag** desktop architecture. It also contains deterministic browser instrumentation tests, mock network providers, native integration-test source, a pinned Zag toolchain reference, build scripts and explicit release gates.

The native Zag and Rust programs and Svelte application **could not be compiled in the execution environment**. Those sources may still contain compiler, integration or runtime defects. Successful JavaScript fixture tests do not establish native application correctness. Read [EXECUTION_REPORT.md](EXECUTION_REPORT.md) before using this package.

## What is actually verified here

| Check executed | Result | Scope |
|---|---|---|
| Node tests | 17 passed / 0 failed | Six browser helper tests, three actual loopback HTTP fixture-provider tests, eight static source/security-boundary checks |
| Chromium DOM tests | 17 passed / 0 failed | Actual `browser/agent.js`; in-memory DOM, network and storage fixtures; includes a 22-turn browser-agent sequence |
| Chromium HTTP navigation | Blocked | Administrator URL policy blocked the local fixture; no policy was modified |
| Native Zag / gateway integration | Blocked | No executable Zag compiler / gateway binary |
| Rust / Svelte / Tauri builds | Blocked | Rust, WebKitGTK development libraries and npm dependencies unavailable; package network requests failed |
| Live provider / real coding harness / full UI smoke | Not run | No qualification claimed |

Raw reports are in `tests/evidence/`. `fixture-provider-browser.png` is a screenshot of the **test website**, not of a compiled Svelte/Tauri application.

## Architecture preserved

```text
Svelte UI                       Native provider webviews (untrusted)
  │ scoped commands               │ bounded observations / DOM response deltas
  └──────────────── Tauri host ────┘
                      │ private, bounded stdin/stdout frames
                      ▼
                    Zag
       HTTP • sessions • protocols • detector • tokens • state
                      │
             127.0.0.1:7331 by default
                      │
             API-compatible local clients
```

The mock provider and Python tests are **test infrastructure only**. There is no TypeScript, Python or Rust replacement production gateway. The Zig/Zag compiler is not emulated.

## Directory map

`backend/` is the authoritative Zag source. `src/` contains the seven Svelte screens and reactive presentation state. `src-tauri/` contains process/webview orchestration and capability configuration. `browser/agent.js` is injected into allowed provider origins. `fixture-provider/` is the local deterministic website. `tests/` and `scripts/` contain test/build tools. `MASTERPLAN.md` is the original plan, preserved unchanged.

## Development on a suitably provisioned Linux x86_64 host

Prerequisites: Node 22.12 or later; npm; current stable Rust and Cargo; Git; Python 3; Tauri Linux dependencies including WebKitGTK 4.1 development headers; and the pinned native Zag compiler. A graphical Linux session is required for interactive desktop verification. Chromium/Playwright fixture tests do not replace WebKitGTK tests.

```bash
python3 scripts/doctor.py
bash scripts/bootstrap-zag.sh
npm install
bash scripts/test-native.sh
npm run check
npm run build
npm test
npm run tauri -- dev
```

The first doctor call exits **77** when prerequisites are absent. Stop on failed compilation or test gates; do not assume later commands succeeded. The bootstrap script pins `Sylorlabs/zag` commit `abed8aa170ef1bc33e5aca68b99fcdd905a4545f` and verifies the committed compiler Git blob. It requires authorized network access. A user-supplied native compiler can be selected through `ZNC=/absolute/path/to/znc`, but that changes toolchain provenance and must be recorded independently.

The compiler runs with `backend/zag.mod` selecting **edition 2027**. `scripts/build-backend.sh` first compiles/runs the native unit program, then builds the sidecar, validates its ELF architecture and installs the Tauri target-triple filename. These build scripts have **not passed a native build in this delivery**.

The alpha dependency versions are constrained by package manifests but **no resolved, qualified npm or Cargo lockfiles are included**. Resolve/review dependencies and commit lockfiles before release. Do not call this archive a fully reproducible binary build.

### Deterministic fixture workflow

```bash
npm test
python3 -m pip install playwright
python3 -m playwright install chromium
# Set CHROMIUM to the installed executable if /usr/bin/chromium is absent.
npm run test:browser:dom
npm run test:browser
```

`test:browser:dom` uses explicit in-memory fixtures and is the suite that passed here. `test:browser` navigates to the actual local HTTP fixture and was blocked here. The scripts preserve failures instead of silently downgrading the scope.

To inspect the test website manually, run `npm run mock` and open `http://127.0.0.1:7340/`. For native development with that one HTTP exception, launch `BRIDGE_DEV_FIXTURE=1 npm run tauri -- dev`. The Rust host ignores this exception in release builds. The public fixture password/card values are synthetic privacy-test canaries, not account credentials.

### Native packaging

```bash
bash scripts/package-linux.sh
```

Successful output belongs under `src-tauri/target/release/bundle/`. There are **no native installers in this source archive**. Windows/macOS are not supported targets. The included GitHub workflow is source only: it was not pushed or dispatched because the GitHub integration refused the attempted write/Actions operation.

## Intended first native qualification path

Compile and run Zag unit/gateway tests, typecheck/build the Svelte UI, run Rust host tests, open the Tauri UI against the mock provider, then validate one authorized real website and one real coding harness. Complete all gates in `docs/release-gates.json` before changing the source-alpha label. The currently supplied release gate intentionally fails.

Unknown context windows and tokenizer identities stay unknown. Token accounting is an explicitly labelled UTF-8-byte heuristic. Tool calls are emulated framing, not proof of native provider tool support. Provider quotas stop requests; there is no automatic account rotation or quota bypass.
