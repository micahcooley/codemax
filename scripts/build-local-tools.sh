#!/usr/bin/env bash
# Build the native local-tools sidecar for the current platform.
# Linux x86_64 and macOS (arm64/x86_64) are supported. The C source ports
# the Linux containment primitives (openat2, renameat2, getrandom, prctl)
# to macOS equivalents (fd-relative O_NOFOLLOW walk, renameatx_np, getentropy)
# and proves them with a startup probe on each platform.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
OS=$(uname -s)
ARCH=$(uname -m)
mkdir -p "$ROOT/build" "$ROOT/src-tauri/binaries"
case "$OS" in
  Linux)
    [[ "$ARCH" == x86_64 ]] || { echo "local-tools: only Linux x86_64 is supported (got $ARCH)." >&2; exit 77; }
    cc -std=c17 -O2 -g -fstack-protector-strong -D_FORTIFY_SOURCE=3 -Wall -Wextra -Werror \
      "$ROOT/native/local-tools.c" -o "$ROOT/build/codemax-local-tools" \
      $(pkg-config --cflags json-c) -L"$(pkg-config --variable=libdir json-c)" -Wl,-Bstatic -ljson-c -Wl,-Bdynamic -Wl,-z,relro,-z,now
    install -m755 "$ROOT/build/codemax-local-tools" "$ROOT/src-tauri/binaries/codemax-local-tools-x86_64-unknown-linux-gnu"
    ;;
  Darwin)
    [[ "$ARCH" == arm64 || "$ARCH" == x86_64 ]] || { echo "local-tools: unsupported macOS arch $ARCH." >&2; exit 77; }
    command -v pkg-config >/dev/null || { echo 'local-tools: missing pkg-config (brew install pkg-config json-c)' >&2; exit 77; }
    pkg-config --exists json-c || { echo 'local-tools: missing json-c (brew install json-c)' >&2; exit 77; }
    # Apple Clang supports -D_FORTIFY_SOURCE=3 on recent Xcode; fall back to 2.
    FORTIFY=3
    echo 'int main(void){return 0;}' | cc -x c - -D_FORTIFY_SOURCE=3 -o /dev/null 2>/dev/null || FORTIFY=2
    cc -std=c17 -O2 -g -fstack-protector-strong -D_FORTIFY_SOURCE="$FORTIFY" -Wall -Wextra -Werror \
      "$ROOT/native/local-tools.c" -o "$ROOT/build/codemax-local-tools" \
      $(pkg-config --cflags --libs json-c)
    TRIPLE="$ARCH-apple-darwin"
    install -m755 "$ROOT/build/codemax-local-tools" "$ROOT/src-tauri/binaries/codemax-local-tools-$TRIPLE"
    ;;
  *)
    echo "local-tools: unsupported OS $OS." >&2; exit 77
    ;;
esac
# Smoke test: --version exits 0 only if the platform containment probe passes.
"$ROOT/build/codemax-local-tools" --version
