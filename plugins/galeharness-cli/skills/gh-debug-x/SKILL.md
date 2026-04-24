---
name: gh:debug-x
description: Debug and fix iOS Swift/ObjC bugs with Morph-X blueprint, transform, audit, and memory fingerprinting to reduce template-code repetition risk.
argument-hint: "[issue reference, error message, test path, or iOS broken behavior]"
---

# Debug-X and Fix

Find the root cause first, then fix it with normal debug discipline plus Morph-X safeguards for iOS Swift/ObjC changes. This reduces template-code repetition risk; it does not guarantee App Review success and does not replace genuine product, UI, content, metadata, or feature differentiation.

<bug_description> #$ARGUMENTS </bug_description>

## Core Principles

1. **Investigate before fixing.** Do not propose a fix until the causal chain from trigger to symptom has no gaps.
2. **Predictions for uncertain links.** If a causal link is uncertain, state a prediction and test it.
3. **One change at a time.** Avoid shotgun debugging.
4. **When stuck, diagnose why.** Do not keep trying unrelated fixes.

## Execution Flow

<!-- HKT-PATCH:gale-task-start -->
### Phase -1: Task Lifecycle Start

Run:

```bash
gale-task log skill_started --skill gh:debug-x --title "<bug-description>" 2>/dev/null || true
```

If `gale-task` is unavailable, skip silently. This must never block debugging.
<!-- /HKT-PATCH:gale-task-start -->

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Triage | Parse input, fetch issue if referenced, retrieve memory |
| 1 | Investigate | Reproduce the bug and trace the code path |
| 2 | Root Cause | Test hypotheses, enforce causal chain gate |
| 3 | Fix | Test-first fix with Morph-X blueprint constraints |
| 4 | Morph-X | Apply transform, audit similarity, store fingerprints |
| 5 | Close | Structured summary and handoff |

### Phase 0: Triage

Parse the input and create a clear problem statement.

If the input references an issue tracker, fetch the issue when possible and extract symptoms, expected behavior, reproduction steps, and environment details. If the tracker cannot be fetched, ask the user for the relevant issue content.

<!-- HKT-PATCH:phase-0.4 -->
### Phase 0.4: HKTMemory Retrieve

Retrieve related bugs, root causes, implementation constraints, and prior Morph-X blueprint/strategy fingerprints:

```bash
memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
[ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
hkt-memory retrieve \
  --query "<error, symptom, iOS component, Swift/ObjC file, blueprint or strategy tags>" \
  --layer all --limit 10 --min-similarity 0.35 \
  --vector-weight 0.7 --bm25-weight 0.3
```

Use results as context only. They may inform hypotheses and blueprint constraints, but do not copy historical code structure. If retrieval fails or returns nothing, proceed silently without blocking investigation.
<!-- /HKT-PATCH:phase-0.4 -->

<!-- HKT-PATCH:phase-0.4b -->
### Phase 0.4b: HKTMemory Session Search

Search related historical debug sessions:

```bash
memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
[ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
hkt-memory session-search \
  --query "gh:debug-x <error message or bug summary>" \
  --limit 5
```

Use returned sessions as supplementary context. If unavailable, continue silently; session search is non-blocking.
<!-- /HKT-PATCH:phase-0.4b -->

Ask questions only when ambiguity blocks investigation. If the user mentions prior failed attempts, ask what was tried before reproducing.

### Phase 1: Investigate

1. Reproduce the bug with the smallest reliable command, test, UI path, or issue steps.
2. If it cannot be reproduced after 2-3 attempts, document attempts and identify missing conditions.
3. Trace the code path from symptom backward to the first invalid state.
4. Check recent changes in relevant files and available logs, error trackers, browser console, database state, or Xcode output.
5. Do not stop at the first suspicious function; root cause is where bad state originates.

### Phase 2: Root Cause

Form ranked hypotheses. For each:

- State what is wrong and where.
- Explain the causal chain from trigger to symptom.
- For uncertain links, state a prediction and test it.

**Causal chain gate:** Do not proceed to Phase 3 until the full causal chain has no gaps, unless the user explicitly authorizes proceeding with the best available hypothesis.

Present findings before fixing: root cause, proposed fix, files likely to change, tests to add or update, and whether existing tests should have caught the bug.

### Phase 3: Fix with Morph-X Blueprint Constraints

If the user chose diagnosis-only handoff, skip the fix and move to close.

Before writing Swift/ObjC fix code:

1. Check `git status` and protect uncommitted user work.
2. Load `.morph-config.yaml` from the target iOS project root if present; otherwise use in-memory defaults.
3. Build a blueprint prompt block from the root cause, project seed, local architecture, retrieved historical fingerprints, blacklisted pattern tags, and test/build constraints.
4. Choose constraints that avoid recently used strategy fingerprints across state management, module boundaries, file splitting, protocol boundaries, error handling, and data flow.
5. If config, CLI, or memory is unavailable, continue with a manual blueprint summary and mark Morph-X as degraded.

Then fix test-first:

1. Write or identify a failing test for the root cause.
2. Verify it fails for the right reason.
3. Implement the minimal fix using the blueprint constraints.
4. Verify the focused test passes.
5. Run the relevant broader test target when the changed surface warrants it.

### Phase 4: Morph-X Apply and Similarity Audit

After the fix is implemented:

1. Apply safe transformation when available:
   ```bash
   gale-harness morph --apply --config .morph-config.yaml --report .morph-report.json
   ```
   The transform must preserve semantics. If the command, SwiftSyntax, or ObjC support is unavailable, skip it, record the degraded reason, and continue.

2. Run similarity audit:
   ```bash
   gale-harness audit --similarity --config .morph-config.yaml --report .morph-audit.json
   ```
   Capture AST/structure fingerprint, token n-gram, statement Jaccard, and control-flow approximation metrics when available. Missing baselines or tools are non-blocking degraded signals.

3. Handle thresholds:
   - Default behavior is warning-only.
   - If `.morph-config.yaml` sets a blocking threshold and the audit exceeds it, pause and ask the user how to proceed.
   - Do not claim the audit proves App Review compliance.

<!-- HKT-PATCH:phase-4.5 -->
### Phase 4.5: HKTMemory Store

After diagnosis, or after the fix and Morph-X audit when a fix was applied, store a concise memory record:

```bash
memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
[ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
hkt-memory store \
  --content "<bug, root cause, fix or diagnosis-only result, repo-relative files, blueprint constraints, strategy fingerprint, audit status, degraded fallback notes>" \
  --title "<debug-x bug title>" \
  --topic "debug-x morph blueprint strategy fingerprint" \
  --layer all
```

Store only summaries, tags, and fingerprints; do not store full source code. On error, note it as non-blocking and do not fail the debug workflow.
<!-- /HKT-PATCH:phase-4.5 -->

### Phase 5: Close

Return:

```text
## Debug-X Summary
**Problem**: [what was broken]
**Root Cause**: [full causal chain with file references]
**Fix**: [what changed or diagnosis only]
**Blueprint**: [constraints and strategy fingerprint]
**Morph Apply**: [report path or degraded reason]
**Similarity Audit**: [report path, threshold result, blocking/warning decision]
**Tests**: [commands run and results]
**Compliance Boundary**: Reduces template-code repetition risk; does not guarantee App Review success.
```

Handoff options: commit the fix, document as a learning, post findings to the issue, view in Proof, or done.

<!-- HKT-PATCH:gale-task-end -->
Run `gale-task log skill_completed 2>/dev/null || true`. If unavailable, skip silently.
<!-- /HKT-PATCH:gale-task-end -->
