#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to run scripts/upstream-sync/generate-batch.py" >&2
  exit 1
fi

python3 "$SCRIPT_DIR/generate-batch.py" "$@"