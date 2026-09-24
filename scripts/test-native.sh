#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
bash "$ROOT/scripts/build-backend.sh"
if [[ $(uname -s) == Darwin ]]; then
  echo 'SKIP: native Zag gateway/MCP tests need the Linux backend sidecar.' >&2
  exit 0
fi
python3 "$ROOT/tests/native_gateway.py" --binary "$ROOT/build/bridge-zag"
python3 "$ROOT/tests/native_mcp.py" --binary "$ROOT/build/bridge-zag"
