#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'BLOCKED: unsupported target; Linux x86_64 only.' >&2; exit 77; }
ZNC=${ZNC:-"$ROOT/.toolchain/zag/zag-poc/znc"}
[[ -x "$ZNC" ]] || { echo 'BLOCKED: native Zag compiler missing. Run scripts/bootstrap-zag.sh on a network-enabled Linux host.' >&2; exit 77; }
ZNC=$(realpath "$ZNC")
mkdir -p "$ROOT/build" "$ROOT/src-tauri/binaries"
cd "$ROOT/backend"
# The nearest zag.mod selects edition 2027. No transpiler or foreign backend fallback.
"$ZNC" "$ROOT/backend/tests/unit.zag" -o "$ROOT/build/zag-unit"
"$ZNC" "$ROOT/backend/tests/file_probe.zag" -o "$ROOT/build/zag-file-probe-unit"
PROBE_ROOT=$(mktemp -d)
trap 'rm -rf -- "$PROBE_ROOT"' EXIT
chmod 700 "$PROBE_ROOT"
"$ROOT/build/zag-file-probe-unit" "$PROBE_ROOT"
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
