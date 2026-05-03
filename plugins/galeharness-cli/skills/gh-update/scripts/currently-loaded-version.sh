#!/usr/bin/env bash
set -o pipefail
if echo "${CLAUDE_SKILL_DIR:-}" | grep -q "/plugins/cache/.*/galeharness-cli/.*/skills/gh-update$"; then
  basename "$(dirname "$(dirname "${CLAUDE_SKILL_DIR}")")"
else
  echo '__GH_UPDATE_NOT_MARKETPLACE__'
fi
