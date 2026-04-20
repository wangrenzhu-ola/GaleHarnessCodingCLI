#!/usr/bin/env bash
# Restore gale-harness, compound-plugin, and gale-knowledge to the release version.
# Restores the saved symlinks from before dev-link was run.
# If no backup exists, falls back to reinstalling from the bun global cache.
set -euo pipefail

BIN_DIR="$HOME/.bun/bin"
GLOBAL_PKG="$HOME/.bun/install/global/node_modules/@gale/harness-cli/src/index.ts"

for bin in gale-harness compound-plugin gale-knowledge; do
  LINK="$BIN_DIR/$bin"
  BACKUP="$BIN_DIR/${bin}.release-target"

  # Remove the dev wrapper
  rm -f "$LINK"

  # Prefer saved backup target
  if [ -f "$BACKUP" ]; then
    saved_target="$(cat "$BACKUP")"
    ln -sf "$saved_target" "$LINK"
    echo "Restored $bin -> $saved_target (from backup)"
    # Clean up backup file after restore
    rm -f "$BACKUP"
  # Fall back to the global install path
  elif [ -f "$GLOBAL_PKG" ]; then
    ln -sf "../install/global/node_modules/@gale/harness-cli/src/index.ts" "$LINK"
    echo "Restored $bin -> ../install/global/node_modules/@gale/harness-cli/src/index.ts (from global install)"
  else
    echo "WARNING: No backup or global install found for $bin"
  fi
done

echo ""
echo "Release mode restored."
