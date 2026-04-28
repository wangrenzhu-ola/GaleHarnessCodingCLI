#!/usr/bin/env bash
set -euo pipefail

common=$(git rev-parse --git-common-dir 2>/dev/null) || true
if [ -z "${common:-}" ]; then
  basename "$(git rev-parse --show-toplevel 2>/dev/null)" || true
  exit 0
fi

case "$common" in
  /*)
    basename "$(dirname "$common")" || true
    ;;
  *)
    basename "$(git rev-parse --show-toplevel 2>/dev/null)" || true
    ;;
esac
