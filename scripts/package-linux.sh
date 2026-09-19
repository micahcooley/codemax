#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
command -v cargo >/dev/null || { echo 'BLOCKED: Rust toolchain is missing.' >&2; exit 77; }
bash scripts/test-native.sh
npm run check
npm run build
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri -- build --bundles deb,appimage
printf 'Linux bundles: src-tauri/target/release/bundle\nLive website, harness, isolation and restart release gates remain separate.\n'
