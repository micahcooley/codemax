#!/usr/bin/env bash
# Build the actual Zag sidecar and native Tauri application on Linux x86_64.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'Linux x86_64 is required.' >&2; exit 77; }
for tool in node npm cargo rustc git python3 pkg-config; do
  command -v "$tool" >/dev/null || { echo "Missing prerequisite: $tool" >&2; exit 77; }
done
pkg-config --exists webkit2gtk-4.1 gtk+-3.0 || { echo 'Install WebKitGTK 4.1 and GTK 3 development packages first.' >&2; exit 77; }
if [[ ! -x ${ZNC:-.toolchain/zag/zag-poc/znc} ]]; then bash scripts/bootstrap-zag.sh; fi
npm install
bash scripts/package-linux.sh
