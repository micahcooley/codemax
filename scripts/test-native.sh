#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
bash "$ROOT/scripts/build-backend.sh"
python3 "$ROOT/tests/native_gateway.py" --binary "$ROOT/build/bridge-zag"
python3 "$ROOT/tests/native_mcp.py" --binary "$ROOT/build/bridge-zag"
