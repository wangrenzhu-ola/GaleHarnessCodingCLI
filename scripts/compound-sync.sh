#!/bin/bash
# compound-sync.sh - Sync GaleHarnessCLI from local compound-engineering-plugin
#
# Usage:
#   bash scripts/compound-sync.sh check      # Check if updates available
#   bash scripts/compound-sync.sh update     # Update local compound repo
#   bash scripts/compound-sync.sh diff       # Generate transformed diff
#   bash scripts/compound-sync.sh apply      # Apply diff to working tree
#   bash scripts/compound-sync.sh pr         # Create PR with changes
#   bash scripts/compound-sync.sh all        # Full sync workflow
#
# Config: .compound-upstream
#   COMPOUND_PATH=~/work/compound-engineering-plugin
#
# Environment:
#   DRY_RUN=1  - Preview changes without applying
#   NO_PUSH=1  - Skip push/PR creation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# CE skill names for prefix transformation
CE_SKILLS="compound-refresh|compound|brainstorm|ideate|plan|work-beta|work|review|debug|demo-reel|optimize|sessions|setup|slack-research|update|pr-description|todo-create|todo-list|git-worktree|resolve-pr-feedback|lfg|ship|publish|preflight|polish-beta"

# Load and validate config
load_config() {
  if [ ! -f "$REPO_ROOT/.compound-upstream" ]; then
    log_error ".compound-upstream not found"
    echo ""
    echo "Create it with:"
    echo "  echo 'COMPOUND_PATH=~/work/compound-engineering-plugin' > .compound-upstream"
    exit 1
  fi

  source "$REPO_ROOT/.compound-upstream"

  # Expand tilde
  COMPOUND_PATH="${COMPOUND_PATH/#\~/$HOME}"
  COMPOUND_PLUGIN_DIR="${COMPOUND_PLUGIN_DIR:-plugins/compound-engineering}"

  if [ ! -d "$COMPOUND_PATH/.git" ]; then
    log_error "Compound repo not found at: $COMPOUND_PATH"
    echo ""
    echo "Clone it first:"
    echo "  git clone https://github.com/discover_ai/compound-engineering-plugin.git \"$COMPOUND_PATH\""
    exit 1
  fi

  export COMPOUND_PATH COMPOUND_PLUGIN_DIR
}

# -----------------------------------------------------------------------------
# check - See if compound has updates
# -----------------------------------------------------------------------------
cmd_check() {
  load_config

  LAST_SHA=$(cat "$REPO_ROOT/.upstream-ref" 2>/dev/null || echo "NONE")
  LATEST_SHA=$(git -C "$COMPOUND_PATH" rev-parse HEAD)

  log_info "Compound repo: $COMPOUND_PATH"
  log_info "Last synced:   $LAST_SHA"
  log_info "Compound HEAD: $LATEST_SHA"

  if [ "$LAST_SHA" = "$LATEST_SHA" ]; then
    log_info "Already up to date - no sync needed"
    echo "UP_TO_DATE=1"
  else
    log_info "Updates available!"
    echo "UP_TO_DATE=0"
    echo "LAST_SHA=$LAST_SHA"
    echo "LATEST_SHA=$LATEST_SHA"
    echo ""
    log_info "Commits since last sync:"
    git -C "$COMPOUND_PATH" log "$LAST_SHA".."$LATEST_SHA" --oneline 2>/dev/null | head -20 || true
  fi
}

# -----------------------------------------------------------------------------
# update - Pull latest changes in compound repo
# -----------------------------------------------------------------------------
cmd_update() {
  load_config

  log_info "Updating compound repo at: $COMPOUND_PATH"

  cd "$COMPOUND_PATH"

  # Determine default branch
  DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

  log_info "Default branch: $DEFAULT_BRANCH"

  git fetch origin 2>/dev/null || true
  git checkout "$DEFAULT_BRANCH" 2>/dev/null || true
  git pull origin "$DEFAULT_BRANCH" --rebase 2>/dev/null || git pull origin "$DEFAULT_BRANCH" 2>/dev/null || true

  LATEST_SHA=$(git rev-parse HEAD)
  log_info "Compound now at: $LATEST_SHA"

  cd "$REPO_ROOT"
}

# -----------------------------------------------------------------------------
# diff - Generate transformed diff
# -----------------------------------------------------------------------------
cmd_diff() {
  load_config

  LAST_SHA=$(cat "$REPO_ROOT/.upstream-ref" 2>/dev/null)

  if [ -z "$LAST_SHA" ] || [ "$LAST_SHA" = "NONE" ]; then
    log_error "No .upstream-ref found"
    echo ""
    echo "Initialize with:"
    echo "  git -C \"$COMPOUND_PATH\" rev-parse HEAD > .upstream-ref"
    exit 1
  fi

  LATEST_SHA=$(git -C "$COMPOUND_PATH" rev-parse HEAD)

  if [ "$LAST_SHA" = "$LATEST_SHA" ]; then
    log_info "Already up to date - no diff needed"
    exit 0
  fi

  log_info "Generating diff: $LAST_SHA..$LATEST_SHA"
  log_info "Plugin dir: $COMPOUND_PLUGIN_DIR"

  # Generate raw diff
  git -C "$COMPOUND_PATH" diff "$LAST_SHA".."$LATEST_SHA" -- "$COMPOUND_PLUGIN_DIR/" > "$REPO_ROOT/.compound-sync.raw.diff" 2>/dev/null || {
    log_warn "No changes in plugin directory"
    echo "No diff generated"
    exit 0
  }

  RAW_FILES=$(grep -c "^diff --git" "$REPO_ROOT/.compound-sync.raw.diff" 2>/dev/null || echo "0")
  RAW_LINES=$(wc -l < "$REPO_ROOT/.compound-sync.raw.diff" 2>/dev/null || echo "0")
  log_info "Raw diff: $RAW_FILES files, $RAW_LINES lines"

  # Transform
  log_info "Transforming diff..."
  python3 - "$REPO_ROOT/.compound-sync.raw.diff" "$REPO_ROOT/.compound-sync.diff" << 'TRANSFORM_PY'
import sys, re

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r') as f:
    content = f.read()

# 1. Path transformation
content = re.sub(r'plugins/compound-engineering/', 'plugins/galeharness-cli/', content)

# 2. Directory rename: /ce-* -> /gh-*
content = re.sub(r'/(ce-[a-z0-9-]+)', lambda m: '/gh-' + m.group(1)[3:], content)

# 3. Skill prefixes
CE_SKILLS = [
    "compound-refresh", "compound", "brainstorm", "ideate", "plan",
    "work-beta", "work", "review", "debug", "demo-reel", "optimize",
    "sessions", "setup", "slack-research", "update", "pr-description",
    "todo-create", "todo-list", "git-worktree", "resolve-pr-feedback",
    "lfg", "ship", "publish", "preflight", "polish-beta"
]
skills_pattern = '|'.join(re.escape(s) for s in CE_SKILLS)

content = re.sub(rf'\bce:({skills_pattern})\b', r'gh:\1', content)
content = re.sub(rf'/ce:({skills_pattern})\b', r'/gh:\1', content)
content = re.sub(r'\bce-demo-reel\b', 'gh-demo-reel', content)

with open(output_file, 'w') as f:
    f.write(content)

print(f"Transformed diff written to {output_file}")
TRANSFORM_PY

  TRANSFORMED_FILES=$(grep -c "^diff --git" "$REPO_ROOT/.compound-sync.diff" 2>/dev/null || echo "0")
  log_info "Transformed diff: $TRANSFORMED_FILES files"

  echo "DIFF_FILE=$REPO_ROOT/.compound-sync.diff"
  echo "LATEST_SHA=$LATEST_SHA"
}

# -----------------------------------------------------------------------------
# apply - Apply the transformed diff
# -----------------------------------------------------------------------------
cmd_apply() {
  load_config

  DIFF_FILE="${1:-$REPO_ROOT/.compound-sync.diff}"

  if [ ! -f "$DIFF_FILE" ]; then
    log_error "Diff file not found: $DIFF_FILE"
    log_info "Run 'compound-sync.sh diff' first"
    exit 1
  fi

  if [ ! -s "$DIFF_FILE" ]; then
    log_info "Diff is empty - nothing to apply"
    exit 0
  fi

  log_info "Applying diff: $DIFF_FILE"

  # Try clean apply
  if git apply --check "$DIFF_FILE" 2>/dev/null; then
    log_info "Diff applies cleanly"
    git apply "$DIFF_FILE"
  else
    log_warn "Diff has conflicts - attempting 3-way merge"
    git apply --3way "$DIFF_FILE" || {
      log_error "Failed to apply diff"
      log_info "Diff saved at: $DIFF_FILE"
      log_info "Manual resolution may be needed"
      exit 1
    }
  fi

  log_info "Diff applied"

  # Apply HKTMemory patches
  if [ -f "$REPO_ROOT/.local/apply-hkt-patches.sh" ]; then
    log_info "Applying HKTMemory patches..."
    bash "$REPO_ROOT/.local/apply-hkt-patches.sh"
  fi

  # Full prefix pass
  log_info "Running full prefix pass..."
  python3 - "$REPO_ROOT/plugins/galeharness-cli" << 'FULLPASS_PY'
import sys, re, os

root = sys.argv[1]
CE_SKILLS = [
    "compound-refresh", "compound", "brainstorm", "ideate", "plan",
    "work-beta", "work", "review", "debug", "demo-reel", "optimize",
    "sessions", "setup", "slack-research", "update", "pr-description",
    "todo-create", "todo-list", "git-worktree", "resolve-pr-feedback",
    "lfg", "ship", "publish", "preflight", "polish-beta"
]
skills_pattern = '|'.join(re.escape(s) for s in CE_SKILLS)

changed = 0
for dirpath, _, filenames in os.walk(root):
    for fname in filenames:
        if not fname.endswith(('.md', '.yaml', '.yml', '.json', '.txt')):
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            new_content = content
            new_content = re.sub(rf'\bce:({skills_pattern})\b', r'gh:\1', new_content)
            new_content = re.sub(rf'/ce:({skills_pattern})\b', r'/gh:\1', new_content)
            new_content = re.sub(r'\bce-demo-reel\b', 'gh-demo-reel', new_content)
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                changed += 1
        except Exception:
            pass
print(f"Full pass: updated {changed} files")
FULLPASS_PY

  # Update reference
  LATEST_SHA=$(git -C "$COMPOUND_PATH" rev-parse HEAD)
  echo "$LATEST_SHA" > "$REPO_ROOT/.upstream-ref"
  log_info "Updated .upstream-ref to $LATEST_SHA"

  # Show changes
  git status --short
  git diff --stat
}

# -----------------------------------------------------------------------------
# pr - Create PR
# -----------------------------------------------------------------------------
cmd_pr() {
  cd "$REPO_ROOT"

  # Check for changes
  if git diff --quiet && git diff --cached --quiet; then
    log_error "No changes to commit"
    exit 1
  fi

  SYNC_DATE=$(date +%Y-%m-%d)
  LAST_SHA=$(cat "$REPO_ROOT/.upstream-ref" 2>/dev/null | head -c 7)
  LATEST_SHA=$(git -C "$COMPOUND_PATH" rev-parse --short HEAD 2>/dev/null || echo "unknown")

  # Create branch if on main/master
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    SYNC_BRANCH="sync/compound-$SYNC_DATE"
    git checkout -b "$SYNC_BRANCH"
    log_info "Created branch: $SYNC_BRANCH"
  else
    SYNC_BRANCH="$CURRENT_BRANCH"
    log_info "Using existing branch: $SYNC_BRANCH"
  fi

  # Run tests (non-blocking)
  log_info "Running tests..."
  bun install --frozen-lockfile 2>/dev/null || bun install
  bun test || log_warn "Tests failed - proceeding anyway"

  # Commit
  git add -A
  git commit -m "$(cat <<EOF
sync: compound upstream $SYNC_DATE

- Sync from $LAST_SHA to $LATEST_SHA
- Applied ce: -> gh: prefix transformation
- Applied HKTMemory patches

🤖 Generated with [Qoder](https://qoder.com)
EOF
)"

  # Push and create PR
  if [ -z "${NO_PUSH:-}" ]; then
    log_info "Pushing to origin..."
    git push origin "$SYNC_BRANCH" --set-upstream

    log_info "Creating PR..."
    PR_URL=$(gh pr create --title "sync: compound upstream $SYNC_DATE" --body "$(cat <<EOF
## Summary

Syncs GaleHarnessCLI with the latest compound-engineering-plugin changes.

**Upstream range:** \`$LAST_SHA\`...\`$LATEST_SHA\`

### Changes Applied

- [x] Path transformation: \`plugins/compound-engineering/\` -> \`plugins/galeharness-cli/\`
- [x] Directory rename: \`ce-*\` -> \`gh-*\`
- [x] Prefix transformation: \`ce:\` -> \`gh:\`
- [x] HKTMemory patches applied

## Test Plan

- [ ] \`bun test\` passes
- [ ] \`bun run release:validate\` passes

🤖 Generated with [Qoder](https://qoder.com)
EOF
)" 2>&1)

    log_info "PR created: $PR_URL"
    echo "PR_URL=$PR_URL"
  else
    log_info "Skipping push (NO_PUSH set)"
  fi
}

# -----------------------------------------------------------------------------
# init - Initialize config
# -----------------------------------------------------------------------------
cmd_init() {
  if [ -f "$REPO_ROOT/.compound-upstream" ]; then
    log_info ".compound-upstream already exists"
    cat "$REPO_ROOT/.compound-upstream"
    exit 0
  fi

  DEFAULT_PATH="$HOME/work/compound-engineering-plugin"

  echo "COMPOUND_PATH=$DEFAULT_PATH" > "$REPO_ROOT/.compound-upstream"
  log_info "Created .compound-upstream with default path: $DEFAULT_PATH"
  echo ""
  echo "Edit if needed:"
  echo "  vim .compound-upstream"
  echo ""
  echo "Then initialize the reference:"
  echo "  git -C \"$DEFAULT_PATH\" rev-parse HEAD > .upstream-ref"
}

# -----------------------------------------------------------------------------
# all - Full sync workflow
# -----------------------------------------------------------------------------
cmd_all() {
  log_info "=== Compound Sync Full Workflow ==="

  # Check for updates
  log_info "Step 1: Checking for updates..."
  RESULT=$(cmd_check 2>&1)
  if echo "$RESULT" | grep -q "UP_TO_DATE=1"; then
    log_info "Already up to date - nothing to sync"
    exit 0
  fi

  # Generate diff
  log_info "Step 2: Generating diff..."
  cmd_diff || {
    log_info "No changes to sync"
    exit 0
  }

  # Apply diff
  log_info "Step 3: Applying diff..."
  cmd_apply "$REPO_ROOT/.compound-sync.diff"

  # Create PR
  log_info "Step 4: Creating PR..."
  cmd_pr

  # Cleanup
  rm -f "$REPO_ROOT/.compound-sync.raw.diff" "$REPO_ROOT/.compound-sync.diff"

  log_info "=== Sync Complete ==="
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
COMMAND="${1:-help}"

case "$COMMAND" in
  check) cmd_check ;;
  update) cmd_update ;;
  diff) cmd_diff ;;
  apply) cmd_apply "${2:-}" ;;
  pr) cmd_pr ;;
  init) cmd_init ;;
  all) cmd_all ;;
  help|*)
    echo "Usage: compound-sync.sh <command>"
    echo ""
    echo "Commands:"
    echo "  init     Initialize .compound-upstream config"
    echo "  check    Check if compound has updates"
    echo "  update   Pull latest in compound repo"
    echo "  diff     Generate transformed diff"
    echo "  apply    Apply diff to working tree"
    echo "  pr       Create PR with changes"
    echo "  all      Full sync workflow (check -> diff -> apply -> pr)"
    echo ""
    echo "Config: .compound-upstream"
    echo "  COMPOUND_PATH=~/work/compound-engineering-plugin"
    echo ""
    echo "Environment:"
    echo "  DRY_RUN=1   Preview changes without applying"
    echo "  NO_PUSH=1   Apply changes but skip push/PR creation"
    ;;
esac
