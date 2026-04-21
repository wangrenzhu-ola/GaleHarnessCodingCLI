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

### Step 1: Read Local Baseline

- Read `.upstream-ref` for the last synced upstream commit.
- Read `.upstream-repo` for the local upstream checkout path, unless an explicit path is provided for this run.
- Treat the value in `.upstream-ref` as the start of the new batch, not as something to mutate immediately.

### Step 2: Generate A Per-Commit Batch

From the repository root, generate a dated batch under `.context/galeharness-cli/upstream-sync/`.

The batch should contain:
- `raw/NNNN-*.patch` for exact upstream provenance
- `adapted/NNNN-*.patch` for mechanical GaleHarnessCLI renames
- `commit-range.txt` with `baseline_before_batch`, `end_commit`, and `next_baseline_candidate`
- `README.md` with the patch table and worktree instructions

### Step 3: Review And Process One Patch At A Time

For each adapted patch:
- Review the paired raw patch to understand upstream intent
- Create an isolated worktree
- Apply exactly one adapted patch in that worktree
- Run focused verification for that patch's scope
- Commit and open a PR for that patch

Default operating model:
- one upstream commit -> one adapted patch
- one adapted patch -> one isolated worktree
- one adapted patch -> one PR

### Step 4: Re-apply GaleHarnessCLI-Specific Logic

Mechanical adaptation only handles naming and path rewrites. After a patch applies:

1. Re-apply `gh:` naming expectations not covered by raw text replacement
2. Re-inject HKTMemory workflow patches where upstream does not know about them
3. Update or add tests for the changed behavior
4. Run verification before creating the PR

### Step 5: Advance Baseline Only After The Batch Lands

Do not update `.upstream-ref` when the batch is merely generated.

Update `.upstream-ref` only after every patch in the batch has landed. The new value should be the batch's `next_baseline_candidate`, which is also the batch `end_commit`. That makes the recorded terminal commit the next run's starting baseline.

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
