#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'BLOCKED: Linux x86_64 is required.' >&2; exit 77; }
PIN=abed8aa170ef1bc33e5aca68b99fcdd905a4545f
BLOB=611b7f0c215385b7d3073bbebbf6078224c70b4c
DEST="$ROOT/.toolchain/zag"
command -v git >/dev/null || { echo 'BLOCKED: git is required.' >&2; exit 77; }
mkdir -p "$ROOT/.toolchain"
if [[ ! -d "$DEST/.git" ]]; then
  [[ ! -e "$DEST" ]] || { echo 'Refusing to overwrite an existing non-Git toolchain directory.' >&2; exit 1; }
  git init "$DEST"
  git -C "$DEST" remote add origin https://github.com/Sylorlabs/zag.git
fi
[[ $(git -C "$DEST" remote get-url origin) == https://github.com/Sylorlabs/zag.git ]] || { echo 'Toolchain origin mismatch.' >&2; exit 1; }
git -C "$DEST" fetch --depth=1 origin "$PIN"
git -C "$DEST" checkout --detach "$PIN"
[[ $(git -C "$DEST" rev-parse HEAD) == "$PIN" ]] || exit 1
[[ $(git hash-object "$DEST/zag-poc/znc") == "$BLOB" ]] || { echo 'Pinned compiler blob mismatch.' >&2; exit 1; }
chmod +x "$DEST/zag-poc/znc"
printf 'Pinned Zag compiler: %s\n' "$DEST/zag-poc/znc"
printf 'Repository provenance does not substitute for compiling and running this application.\n'
