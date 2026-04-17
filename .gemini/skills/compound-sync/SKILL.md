---
name: compound-sync
description: "Sync GaleHarnessCLI skills with latest changes from the reference upstream repo. Use when you need to pull upstream updates, review what changed, apply gh: renames, and re-inject HKTMemory patches. Triggers: 'sync upstream', 'update skills', 'pull latest changes', 'upstream diff'."
---

# Compound Sync

Sync GaleHarnessCLI with upstream compound-engineering-plugin changes.

## Upstream Reference

**Current upstream commit:** `ee86dc3379a75c859313d3c93c7cba6789957947` (2026-04-15)

This is the baseline commit from EveryInc/compound-engineering-plugin that GaleHarnessCLI was forked from. All subsequent changes in GaleHarnessCLI are independent developments.

## When to Use

- Pull latest upstream compound-engineering changes
- Review upstream diff before applying
- Re-apply gh: prefix renames after upstream sync
- Re-inject HKTMemory patches after sync

## Workflow

### Step 1: Check Upstream Status

Compare current baseline with upstream HEAD:

```bash
# Fetch upstream without merging
git fetch https://github.com/EveryInc/compound-engineering-plugin.git main

# Show commits since baseline
git log ee86dc3379a75c859313d3c93c7cba6789957947..FETCH_HEAD --oneline
```

### Step 2: Review Changes

For each upstream commit, review the diff to understand:
- What skills/agents changed
- Breaking changes that need attention
- New features to adopt

### Step 3: Apply Sync

Run the sync script (if available) or manually:

```bash
# If scripts/sync-from-upstream.sh exists
bash scripts/sync-from-upstream.sh
```

### Step 4: Re-apply Transformations

After syncing upstream:

1. **Rename ce: → gh:** prefixes
2. **Re-inject HKTMemory patches** (Phase 0.4 retrieve, Phase 2.3 store)
3. **Update test fixtures**
4. **Run tests** to verify

### Step 5: Update Baseline

After successful sync, update the reference:

```bash
# Update .upstream-ref with new commit
echo "<new-commit-id>" > .upstream-ref

# Update this SKILL.md upstream commit line
```

## HKTMemory Patches to Re-apply

After each upstream sync, these patches must be re-applied:

### gh:compound skill
- Phase 0.4: HKTMemory retrieve before research
- Phase 2.3: HKTMemory store after solution documented

### learnings-researcher agent
- Step 0: HKTMemory vector search before grep-first filtering

### gh:brainstorm, gh:plan, gh:work, gh:review
- Per-phase HKTMemory read/write (see each skill's HKTMemory sections)

## Notes

- GaleHarnessCLI is now fully independent (upstream remote removed)
- This skill provides Agent-driven diff workflow instead of direct git merge
- Always review upstream changes before applying — not all changes may be relevant
