#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'Linux x86_64 required' >&2; exit 77; }
mkdir -p "$ROOT/build" "$ROOT/src-tauri/binaries"
cc -std=c17 -O2 -g -fstack-protector-strong -D_FORTIFY_SOURCE=3 -Wall -Wextra -Werror \
  "$ROOT/native/local-tools.c" -o "$ROOT/build/codemax-local-tools" \
  $(pkg-config --cflags json-c) -L"$(pkg-config --variable=libdir json-c)" -Wl,-Bstatic -ljson-c -Wl,-Bdynamic -Wl,-z,relro,-z,now
install -m755 "$ROOT/build/codemax-local-tools" "$ROOT/src-tauri/binaries/codemax-local-tools-x86_64-unknown-linux-gnu"
"$ROOT/build/codemax-local-tools" --version
