#!/bin/bash

set -e

SOURCE_DIR="${1:-.claude/skills/hkt-memory}"
TARGET_DIR="${2:-.trae/skills/hkt-memory}"
BACKUP_DIR="backups/hkt-memory-$(date +%Y%m%d-%H%M%S)"

echo "======================================"
echo "HKT-Memory v5 Deployment"
echo "======================================"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo "Backup: $BACKUP_DIR"
echo

if [ ! -d "$SOURCE_DIR" ]; then
    echo "✗ Source directory not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/scripts/hkt_memory_v5.py" ]; then
    echo "✗ v5 main script not found in source"
    exit 1
fi

mkdir -p "$BACKUP_DIR"
if [ -d "$TARGET_DIR" ]; then
    cp -R "$TARGET_DIR"/. "$BACKUP_DIR"/
    echo "✓ Backup completed"
else
    echo "✓ Target does not exist, skip backup copy"
fi

mkdir -p "$TARGET_DIR"
rsync -a --delete \
  --exclude ".venv/" \
  --exclude "__pycache__/" \
  --exclude ".DS_Store" \
  "$SOURCE_DIR"/ "$TARGET_DIR"/
echo "✓ Files synchronized"

cd "$TARGET_DIR"
if command -v uv >/dev/null 2>&1; then
    uv run scripts/hkt_memory_v5.py stats >/dev/null
else
    python3 scripts/hkt_memory_v5.py stats >/dev/null
fi
echo "✓ Deployment verification passed"

echo
echo "Done."
echo "Quick test:"
echo "  uv run $TARGET_DIR/scripts/hkt_memory_v5.py test"
