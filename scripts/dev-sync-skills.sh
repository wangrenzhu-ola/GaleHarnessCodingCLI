#!/usr/bin/env bash
# Sync skills and agents from local source tree to installed environments.
# Works with dev-link.sh: after dev-link activates the local CLI,
# run this to refresh the skill/agent files so changes take effect immediately.
# Run from repo root or pass the repo path as $1.
set -euo pipefail

REPO_ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SKILLS_SRC="$REPO_ROOT/plugins/galeharness-cli/skills"
AGENTS_SRC="$REPO_ROOT/plugins/galeharness-cli/agents"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "ERROR: $SKILLS_SRC not found. Are you in the GaleHarnessCLI repo?"
  exit 1
fi

TARGETS=()
[ -d "$HOME/.qoder/skills" ] && TARGETS+=("$HOME/.qoder")
[ -d "$HOME/.claude/skills" ] && TARGETS+=("$HOME/.claude")
[ -d "$HOME/.trae/skills" ] && TARGETS+=("$HOME/.trae")
[ -d "$HOME/.kimi/skills" ] && TARGETS+=("$HOME/.kimi")

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "ERROR: No installed environments found (~/.qoder, ~/.claude, ~/.trae, or ~/.kimi)."
  echo "Run 'compound-plugin install' first."
  exit 1
fi

for target in "${TARGETS[@]}"; do
  name=$(basename "$target")

  # Sync skills: per-skill rsync with --delete to clean stale files,
  # but only inside each skill's own directory (won't touch other plugins).
  skill_count=0
  for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name=$(basename "$skill_dir")
    dest="$target/skills/$skill_name"
    mkdir -p "$dest"
    rsync -a --delete --exclude '.git' "$skill_dir" "$dest/"
    skill_count=$((skill_count + 1))
  done

  # Sync agents: support both category-subdir and flat layout
  # Remove agents that exist in our source but were previously installed,
  # then copy fresh versions. Don't touch agents from other plugins.
  agent_count=0
  owned_agents=()
  mkdir -p "$target/agents"
  for category_dir in "$AGENTS_SRC"/*/; do
    for agent_file in "$category_dir"*.md; do
      [ -f "$agent_file" ] || continue
      owned_agents+=("$(basename "$agent_file")")
      cp "$agent_file" "$target/agents/"
      agent_count=$((agent_count + 1))
    done
  done
  # Also pick up .md files directly under AGENTS_SRC (flat layout)
  for agent_file in "$AGENTS_SRC"/*.md; do
    [ -f "$agent_file" ] || continue
    owned_agents+=("$(basename "$agent_file")")
    cp "$agent_file" "$target/agents/"
    agent_count=$((agent_count + 1))
  done

  # Remove previously installed agents that no longer exist in source
  for installed in "$target/agents/"*.md; do
    [ -f "$installed" ] || continue
    base=$(basename "$installed")
    found=false
    if [ ${#owned_agents[@]} -gt 0 ]; then
      for owned in "${owned_agents[@]}"; do
        if [ "$base" = "$owned" ]; then found=true; break; fi
      done
    fi
    if [ "$found" = false ]; then
      # Only remove if we previously installed it (check for our signature header)
      if head -5 "$installed" | grep -q 'galeharness-cli'; then
        rm "$installed"
      fi
    fi
  done

  echo "$name: synced $skill_count skills, $agent_count agents"
done

echo ""
echo "Done. Restart your agent to load updated skills."
