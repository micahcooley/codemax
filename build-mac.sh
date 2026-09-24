#!/usr/bin/env bash
# Full macOS build entrypoint (arm64/x86_64).
# The Zag backend sidecar is Linux-only (the pinned znc compiler is a Linux
# x86_64 ELF that cannot execute or emit Mach-O), so the macOS app ships the
# native local-tools sidecar and runs the gateway in its designed fallback
# browsing mode. No backend is faked.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Darwin ]] || { echo 'BLOCKED: macOS required.' >&2; exit 77; }
ARCH=$(uname -m)
[[ $ARCH == arm64 || $ARCH == x86_64 ]] || { echo "BLOCKED: unsupported arch $ARCH." >&2; exit 77; }
cd "$ROOT"
npm install
python3 scripts/doctor.py
bash scripts/build-local-tools.sh
bash scripts/build-backend.sh
npm run check
npm run build
npm test
command -v cargo >/dev/null || { echo 'BLOCKED: Rust toolchain is missing.' >&2; exit 77; }
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri -- build --bundles app
printf 'macOS app bundle: src-tauri/target/release/bundle/macos\nZag backend sidecar is Linux-only; macOS runs fallback browsing mode.\n'