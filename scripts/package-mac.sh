#!/usr/bin/env bash
# Package Codemax for macOS (arm64/x86_64) as a .dmg.
# The Zag backend sidecar is Linux-only (the pinned znc compiler is a Linux
# x86_64 ELF that cannot execute or emit Mach-O), so the macOS app ships the
# native local-tools sidecar and runs the gateway in its designed fallback
# browsing mode. The bridge-zag stub is bundled as-is: it exits non-zero so
# the host reports SIDECAR_MISSING/LOST and the UI launches in fallback.
# No backend is faked.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
[[ $(uname -s) == Darwin ]] || { echo 'BLOCKED: macOS required.' >&2; exit 77; }
ARCH=$(uname -m)
[[ $ARCH == arm64 || $ARCH == x86_64 ]] || { echo "BLOCKED: unsupported arch $ARCH." >&2; exit 77; }
TRIPLE="$ARCH-apple-darwin"
command -v cargo >/dev/null || { echo 'BLOCKED: Rust toolchain is missing.' >&2; exit 77; }
bash scripts/build-local-tools.sh
# The bundled sidecar must be a real Mach-O binary, never the dev stub.
[[ -x src-tauri/binaries/codemax-local-tools-$TRIPLE ]] || { echo 'BLOCKED: local-tools sidecar missing.' >&2; exit 77; }
[[ $(file -b src-tauri/binaries/codemax-local-tools-$TRIPLE) == *Mach-O* ]] || { echo 'BLOCKED: local-tools sidecar is not a Mach-O binary.' >&2; exit 77; }
# Tauri resolves externalBin per target triple; the bridge-zag stub is a
# shell script, so copy it to the current triple if that entry is missing.
if [[ ! -f src-tauri/binaries/bridge-zag-$TRIPLE ]]; then
  [[ -f src-tauri/binaries/bridge-zag-aarch64-apple-darwin ]] || { echo 'BLOCKED: bridge-zag stub missing.' >&2; exit 77; }
  cp src-tauri/binaries/bridge-zag-aarch64-apple-darwin src-tauri/binaries/bridge-zag-$TRIPLE
fi
# Real black-box tests of the compiled macOS sidecar.
python3 tests/real/local_tools_test.py
bash scripts/test-native.sh
npm run check
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
if [[ ! -f src-tauri/icons/icon.icns ]]; then
  npm run tauri -- icon src-tauri/icons/icon.png
fi
npm run tauri -- build --bundles dmg
printf 'macOS bundle: src-tauri/target/release/bundle/dmg\nLive website, harness, isolation and restart release gates remain separate.\n'