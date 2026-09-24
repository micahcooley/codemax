#!/usr/bin/env bash
# Local macOS CI: runs the same steps as .github/workflows/macos.yml on this
# machine, so you can validate without pushing to GitHub Actions.
# The Zag backend steps are no-ops on macOS (the pinned znc compiler is a
# Linux x86_64 ELF that cannot execute or emit Mach-O); the scripts skip with
# an explanation and the app runs in its designed fallback browsing mode.
# No backend is faked.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$ROOT"
[[ $(uname -s) == Darwin ]] || { echo 'BLOCKED: macOS required.' >&2; exit 77; }
ARCH=$(uname -m)
[[ $ARCH == arm64 || $ARCH == x86_64 ]] || { echo "BLOCKED: unsupported arch $ARCH." >&2; exit 77; }
step() { printf '\n=== %s ===\n' "$1"; }
step 'Native dependencies'
command -v brew >/dev/null || { echo 'BLOCKED: Homebrew is missing (https://brew.sh).' >&2; exit 77; }
brew install pkg-config json-c
step 'JavaScript dependencies'
npm install
step 'Environment check'
npm run doctor
step 'Native project tools'
npm run test:real-tools
step 'Frontend'
npm run check && npm run build
step 'JavaScript and security boundaries'
npm test
step 'Koryphaios adapter'
node scripts/compile-koryphaios-adapter.mjs
node --test tests/real/koryphaios.test.mjs
step 'Zag source contracts'
npm run check:zag-contracts
step 'Zag backend (expected skip on macOS)'
npm run build:backend && npm run test:native
step 'Tauri host'
cargo test --manifest-path src-tauri/Cargo.toml
step 'macOS packages'
npm run package:mac
step 'Artifacts'
rm -rf ci-artifacts/codemax-macos
mkdir -p ci-artifacts/codemax-macos
cp -R src-tauri/target/release/bundle/. ci-artifacts/codemax-macos/
printf '\nLocal macOS CI passed. Artifacts: ci-artifacts/codemax-macos\n'
