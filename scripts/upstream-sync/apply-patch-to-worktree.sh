#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash scripts/upstream-sync/apply-patch-to-worktree.sh [--allow-main-worktree] [--3way] <path-to-adapted.patch>
EOF
}

ALLOW_MAIN_WORKTREE="false"
USE_3WAY="false"
PATCH_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-main-worktree)
      ALLOW_MAIN_WORKTREE="true"
      shift
      ;;
    --3way)
      USE_3WAY="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      PATCH_FILE="$1"
      shift
      ;;
  esac
done

if [[ -z "$PATCH_FILE" ]]; then
  usage >&2
  exit 1
fi

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Precheck failed: not inside a git repository." >&2
  echo "Next step: cd into the target worktree and re-run the command." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --path-format=absolute --show-toplevel)"
GIT_COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir)"
MAIN_WORKTREE_ROOT="$(dirname "$GIT_COMMON_DIR")"

# Smart patch resolution: if relative path fails in current dir, check if it exists in MAIN_WORKTREE_ROOT
if [[ "$PATCH_FILE" != /* ]]; then
  if [[ ! -f "$PATCH_FILE" ]] && [[ -f "$MAIN_WORKTREE_ROOT/$PATCH_FILE" ]]; then
    PATCH_FILE="$MAIN_WORKTREE_ROOT/$PATCH_FILE"
  fi
  # Convert to absolute path
  if [[ -f "$PATCH_FILE" ]]; then
    PATCH_FILE="$(cd "$(dirname "$PATCH_FILE")" && pwd)/$(basename "$PATCH_FILE")"
  fi
fi

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "Precheck failed: patch file not found: $PATCH_FILE" >&2
  echo "Expected layout: .context/galeharness-cli/upstream-sync/<date>/adapted/<patch>.patch" >&2
  exit 1
fi

WORKTREE_STATUS="$(git status --porcelain --untracked-files=all)"
if [[ -n "$WORKTREE_STATUS" ]]; then
  echo "Precheck failed: working tree is not clean." >&2
  echo "Next step: commit, stash, or move to a fresh worktree before applying patches." >&2
  exit 1
fi

if [[ "$REPO_ROOT" == "$MAIN_WORKTREE_ROOT" && "$ALLOW_MAIN_WORKTREE" != "true" ]]; then
  echo "Risk check failed: current directory is the main worktree." >&2
  echo "Next step: create an isolated worktree, for example:" >&2
  echo "  bash plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh create sync-$(basename "$PATCH_FILE" .patch)" >&2
  echo "If you intentionally want to continue here, re-run with --allow-main-worktree." >&2
  exit 1
fi

CHECK_OUTPUT="$(mktemp)"
cleanup() {
  rm -f "$CHECK_OUTPUT"
}
trap cleanup EXIT

# Construct apply command
APPLY_CMD=("git" "apply")
if [[ "$USE_3WAY" == "true" ]]; then
  APPLY_CMD+=("--3way")
fi

if ! "${APPLY_CMD[@]}" --check "$PATCH_FILE" >"$CHECK_OUTPUT" 2>&1; then
  echo "Patch preflight failed: git apply --check reported conflicts or drift." >&2
  cat "$CHECK_OUTPUT" >&2
  echo "Next step options:" >&2
  echo "  1. Inspect the raw patch for upstream intent." >&2
  echo "  2. Rebase or recreate the worktree from a cleaner base." >&2
  echo "  3. Mechanically adjust the adapted patch, then retry." >&2
  if [[ "$USE_3WAY" != "true" ]]; then
    echo "  4. Try re-running this script with the --3way flag to attempt a 3-way merge." >&2
  fi
  exit 1
fi

"${APPLY_CMD[@]}" "$PATCH_FILE"

echo "Patch applied successfully."
echo "Worktree: $REPO_ROOT"
echo "Patch: $PATCH_FILE"
echo "Next steps:"
echo "  1. Review with: git diff --stat && git diff"
echo "  2. Run focused tests for this patch."
echo "  3. Commit with a message derived from the upstream commit."