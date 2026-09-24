#!/usr/bin/env bash
# Build the native Zag backend sidecar (bridge-zag).
#
# Linux x86_64 uses the pinned Zag compiler (zag-poc/znc), which emits Linux
# ELF objects, with the backend at its declared edition 2027.
#
# macOS (arm64) uses the pinned macOS compiler
# (.toolchain/zag-macos-arm64/znc, a signed ARM64 Mach-O build of the Zag
# selfhost taken from the local Zag checkout). The backend source is
# portable across both kernels: every raw syscall uses a Linux x86-64 tuple
# that the Mach-O encoder also admits (exact open/socket/send/recv/fcntl
# shapes, single-fd poll sleeps, newfstatat-projected stat checks,
# PID-file locking, /dev/urandom entropy, loopback-TCP private pairs).
# The macOS build compiles a shadow copy at edition 2026 because the newer
# compiler's edition-2027 ownership proofs reject the backend source; the
# Linux path is untouched.
#
# If the macOS compiler is absent, this script skips and the desktop app
# runs in its designed fallback browsing mode with the native local-tools
# sidecar (see scripts/build-local-tools.sh). A skip is not a failure.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
if [[ $(uname -s) == Darwin ]]; then
  ARCH=$(uname -m)
  [[ $ARCH == arm64 || $ARCH == x86_64 ]] || { echo "BLOCKED: unsupported macOS arch $ARCH." >&2; exit 77; }
  ZNC=${ZNC:-"$ROOT/.toolchain/zag-macos-arm64/znc"}
  if [[ ! -x "$ZNC" ]]; then
    echo 'SKIP: macOS Zag compiler not installed at .toolchain/zag-macos-arm64/znc.' >&2
    echo 'SKIP: macOS builds ship the app in fallback browsing mode with native local tools.' >&2
    exit 0
  fi
  # Tauri resolves the sidecar per Rust target triple.
  case "$ARCH" in
    arm64) TRIPLE="aarch64-apple-darwin" ;;
    x86_64) TRIPLE="x86_64-apple-darwin" ;;
  esac
  mkdir -p "$ROOT/build" "$ROOT/src-tauri/binaries"
  # Shadow build: same sources, edition override only. The repo tree keeps
  # edition 2027 for the Linux release path.
  SHADOW="$ROOT/build/backend-macos"
  rm -rf "$SHADOW"
  mkdir -p "$SHADOW"
  cp "$ROOT/backend/app.zag" "$ROOT/backend/main.zag" "$ROOT/backend/zag.mod" "$SHADOW/"
  for dir in browser core detector mcp protocol providers security server sessions storage telemetry tests tools; do
    cp -r "$ROOT/backend/$dir" "$SHADOW/"
  done
  sed -i '' 's/edition = "2027"/edition = "2026"/' "$SHADOW/zag.mod"
  ( cd "$SHADOW" && \
    "$ZNC" tests/unit.zag -o "$ROOT/build/zag-unit-macos" --target macos-arm64 && \
    "$ZNC" tests/discovery_mcp.zag -o "$ROOT/build/zag-discovery-mcp-unit-macos" --target macos-arm64 && \
    "$ZNC" tests/task_continuity.zag -o "$ROOT/build/zag-task-continuity-unit-macos" --target macos-arm64 && \
    "$ZNC" tests/site_detection.zag -o "$ROOT/build/zag-site-detection-macos" --target macos-arm64 && \
    "$ROOT/build/zag-task-continuity-unit-macos" && \
    "$ROOT/build/zag-discovery-mcp-unit-macos" && \
    "$ROOT/build/zag-site-detection-macos" && \
    "$ZNC" tests/file_probe.zag -o "$ROOT/build/zag-file-probe-unit-macos" --target macos-arm64 && \
    "$ZNC" tests/storage_probe.zag -o "$ROOT/build/zag-storage-probe-unit-macos" --target macos-arm64 )
  PROBE_ROOT=$(mktemp -d)
  trap 'rm -rf -- "$PROBE_ROOT"' EXIT
  chmod 700 "$PROBE_ROOT"
  "$ROOT/build/zag-file-probe-unit-macos" "$PROBE_ROOT"
  "$ROOT/build/zag-storage-probe-unit-macos" "$PROBE_ROOT"
  "$ROOT/build/zag-unit-macos"
  ( cd "$SHADOW" && "$ZNC" main.zag -o "$ROOT/build/bridge-zag-macos" --target macos-arm64 )
  python3 - "$ROOT/build/bridge-zag-macos" <<'VERIFY'
import pathlib,struct,sys
b=pathlib.Path(sys.argv[1]).read_bytes()
assert struct.unpack_from('<I',b,0)[0]==0xfeedfacf, 'Expected Mach-O ARM64 sidecar'
assert struct.unpack_from('<I',b,4)[0]&0x01000000!=0, 'Expected ARM64 cputype flag'
VERIFY
  install -m 755 "$ROOT/build/bridge-zag-macos" "$ROOT/src-tauri/binaries/bridge-zag-$TRIPLE"
  shasum -a 256 "$ROOT/build/bridge-zag-macos" > "$ROOT/build/bridge-zag-macos.sha256"
  echo "macOS Zag backend built and native-tested: src-tauri/binaries/bridge-zag-$TRIPLE"
  echo 'Run scripts/test-native.sh and all desktop/provider release gates next.'
  exit 0
fi
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'BLOCKED: unsupported target; Linux x86_64 only.' >&2; exit 77; }
ZNC=${ZNC:-"$ROOT/.toolchain/zag/zag-poc/znc"}
[[ -x "$ZNC" ]] || { echo 'BLOCKED: native Zag compiler missing. Run scripts/bootstrap-zag.sh on a network-enabled Linux host.' >&2; exit 77; }
ZNC=$(realpath "$ZNC")
mkdir -p "$ROOT/build" "$ROOT/src-tauri/binaries"
cd "$ROOT/backend"
# The nearest zag.mod selects edition 2027. No transpiler or foreign backend fallback.
"$ZNC" "$ROOT/backend/tests/unit.zag" -o "$ROOT/build/zag-unit"
"$ZNC" "$ROOT/backend/tests/discovery_mcp.zag" -o "$ROOT/build/zag-discovery-mcp-unit"
"$ZNC" "$ROOT/backend/tests/task_continuity.zag" -o "$ROOT/build/zag-task-continuity-unit"
"$ZNC" "$ROOT/backend/tests/site_detection.zag" -o "$ROOT/build/zag-site-detection-unit"
"$ROOT/build/zag-task-continuity-unit"
"$ROOT/build/zag-discovery-mcp-unit"
"$ROOT/build/zag-site-detection-unit"
"$ZNC" "$ROOT/backend/tests/file_probe.zag" -o "$ROOT/build/zag-file-probe-unit"
"$ZNC" "$ROOT/backend/tests/storage_probe.zag" -o "$ROOT/build/zag-storage-probe-unit"
PROBE_ROOT=$(mktemp -d)
trap 'rm -rf -- "$PROBE_ROOT"' EXIT
chmod 700 "$PROBE_ROOT"
"$ROOT/build/zag-file-probe-unit" "$PROBE_ROOT"
"$ROOT/build/zag-storage-probe-unit" "$PROBE_ROOT"
"$ROOT/build/zag-unit"
"$ZNC" "$ROOT/backend/main.zag" -o "$ROOT/build/bridge-zag"
python3 - "$ROOT/build/bridge-zag" <<'VERIFY'
import pathlib,struct,sys
b=pathlib.Path(sys.argv[1]).read_bytes()
assert b[:5]==b'\x7fELF\x02' and b[5]==1 and struct.unpack_from('<H',b,18)[0]==62, 'Expected ELF64 x86_64 sidecar'
VERIFY
install -m 755 "$ROOT/build/bridge-zag" "$ROOT/src-tauri/binaries/bridge-zag-x86_64-unknown-linux-gnu"
sha256sum "$ROOT/build/bridge-zag" > "$ROOT/build/bridge-zag.sha256"
echo 'Native unit program completed. Run scripts/test-native.sh and all desktop/provider release gates next.'
