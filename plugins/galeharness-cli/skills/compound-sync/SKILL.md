---
name: compound-sync
description: "Sync GaleHarnessCLI skills with latest changes from the reference upstream repo. Use when you need to pull upstream updates, review what changed, apply gh: renames, and re-inject HKTMemory patches. Triggers: 'sync upstream', 'update skills', 'pull latest changes', 'upstream diff'."
---

# Compound Sync

Sync GaleHarnessCLI with upstream compound-engineering-plugin changes through per-commit patch batches.

## Upstream Reference

**Current baseline:** Read from `.upstream-ref` in repo root.

```bash
cat .upstream-ref
```

GaleHarnessCLI was forked from EveryInc/compound-engineering-plugin at the commit recorded in `.upstream-ref`. All subsequent changes are independent developments.

## When to Use

- Pull latest upstream compound-engineering changes
- Review upstream diff before applying
- Re-apply gh: prefix renames after upstream sync
- Re-inject HKTMemory patches after sync

## Workflow

Use the upstream sync CLI as the source of truth for batch generation, per-commit worktrees, PR creation, state transitions, cleanup, and `.upstream-ref` updates.

### Step 1: Initialize The Batch

From the repository root, run:

```bash
python3 scripts/upstream-sync/sync-cli.py init
python3 scripts/upstream-sync/sync-cli.py status
```

The CLI reads `.upstream-ref` and `.upstream-repo`, generates a dated batch under `.context/galeharness-cli/upstream-sync/`, and writes workflow state under `.context/galeharness-cli/upstream-sync/state.json`.

If `init` reports no new upstream commits, stop. Do not mutate `.upstream-ref` manually.

### Step 2: Process One Commit

Start exactly one pending upstream commit:

```bash
python3 scripts/upstream-sync/sync-cli.py next
```

The CLI creates an isolated worktree, applies one adapted patch, runs verification, commits the result, pushes the branch, and opens a PR. Treat the generated PR as the review boundary for that upstream commit.

Default operating model:
- one upstream commit -> one adapted patch
- one adapted patch -> one isolated worktree
- one adapted patch -> one PR

### Step 3: Re-apply GaleHarnessCLI-Specific Logic

Mechanical adaptation only handles naming and path rewrites. In the generated worktree or PR:

1. Re-apply `gh:` naming expectations not covered by raw text replacement
2. Re-inject HKTMemory workflow patches where upstream does not know about them
3. Update or add tests for the changed behavior
4. Run focused verification before the PR lands

### Step 4: Resume Or Skip

After the PR is merged, return to the original worktree and run:

```bash
python3 scripts/upstream-sync/sync-cli.py resume
python3 scripts/upstream-sync/sync-cli.py status
```

`resume` verifies the PR target, reconciles upstream ancestry, updates `.upstream-ref` for the merged upstream commit, cleans up the worktree, and returns the workflow to `idle` for the next explicit `next` command. It does not automatically start the next commit.

If a commit must be abandoned, run:

```bash
python3 scripts/upstream-sync/sync-cli.py skip --reason "short reason"
```

For an open or closed PR that needs cleanup, use:

```bash
python3 scripts/upstream-sync/sync-cli.py skip --force-cleanup --reason "short reason"
```

The CLI validates branch ownership before deleting remote branches.

### Step 5: Complete The Batch

Repeat `next` -> PR review/merge -> `resume` until `status` reports `complete`.

Do not hand-edit `.upstream-ref`. The CLI advances it only after each corresponding PR is confirmed merged and upstream ancestry checks pass.

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
- This skill provides an Agent-driven batch workflow instead of a direct git merge
- Always review upstream changes before applying; not every upstream commit will be mechanically clean
- The batch directory is local workflow state under `.context/`, not a Git-tracked artifact
