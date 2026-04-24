---
name: gh:work-x
description: Execute iOS Swift/ObjC work with Morph-X blueprint, transform, audit, and memory fingerprinting to reduce template-code repetition risk.
argument-hint: "[Plan doc path or description of iOS work. Blank to auto use latest plan doc]"
---

# Work-X Execution Command

Execute work with the normal shipping discipline, plus Morph-X safeguards for iOS Swift/ObjC output. This reduces template-code repetition risk; it does not guarantee App Review success and does not replace real product, UI, content, metadata, or feature differentiation.

## Input Document

<input_document> #$ARGUMENTS </input_document>

## Execution Workflow

### Phase 0: Input Triage

Determine how to proceed from `<input_document>`.

**Plan document:** read it completely in Phase 1 and treat it as a decision artifact.

**Bare prompt:** scan likely files, nearby tests, and local conventions; classify scope:

| Complexity | Signals | Action |
|-----------|---------|--------|
| Trivial | 1-2 files, no behavioral change | Setup, apply directly, and run relevant tests if behavior changed |
| Small / Medium | Clear scope, under ~10 files | Build a task list, then execute |
| Large | Cross-cutting, architecture, auth/payments/migrations, 10+ files | Recommend planning/brainstorming; if proceeding, build tasks carefully |

<!-- HKT-PATCH:gale-task-start -->
### Phase 0.1: Task Lifecycle Start

Run:

```bash
gale-task log skill_started --skill gh:work-x --title "${ARGUMENTS:-work-x}" 2>/dev/null || true
```

If `gale-task` is unavailable, skip silently. This must never block execution.
<!-- /HKT-PATCH:gale-task-start -->

<!-- HKT-PATCH:phase-0.6 -->
### Phase 0.6: HKTMemory Retrieve

Before choosing a blueprint, retrieve related implementation context and historical Morph-X fingerprints:

```bash
hkt-memory retrieve \
  --query "<task summary, iOS components, Swift/ObjC files, prior blueprint or strategy tags>" \
  --layer all --limit 10 --min-similarity 0.35 \
  --vector-weight 0.7 --bm25-weight 0.3
```

Use results only as context: extract constraints, avoided patterns, and prior blueprint/strategy fingerprints. Do not copy historical code shape. If no results or any command error occurs, proceed silently without blocking.
<!-- /HKT-PATCH:phase-0.6 -->

<!-- HKT-PATCH:phase-0.6b -->
### Phase 0.6b: HKTMemory Session Search

Query related work sessions:

```bash
hkt-memory session-search \
  --query "gh:work-x <task title or iOS feature summary>" \
  --limit 5
```

Use returned sessions as supplementary context for blueprint selection. If unavailable, continue silently; session search is non-blocking.
<!-- /HKT-PATCH:phase-0.6b -->

### Phase 1: Quick Start

1. **Read Plan and Clarify** when a plan/spec path was provided.
   - Read the full document, including requirements, scope boundaries, implementation units, files, test scenarios, verification, and deferred unknowns.
   - Ask only when ambiguity blocks correct execution.
   - Get user approval to proceed when the source workflow requires it.

2. **Setup Environment**
   - Check the current branch and default branch.
   - If already on a meaningful feature branch, continue unless the user asks otherwise.
   - If on the default branch, create a feature branch or worktree unless the user explicitly confirms working on the default branch.
   - Respect workspace safety: do not overwrite uncommitted user work.

3. **Create Task List**
   - Derive tasks from implementation units, dependencies, file ownership, tests, and verification.
   - Preserve plan U-IDs in task names.
   - Include quality checks and relevant tests.

4. **Choose Execution Strategy**
   - Use inline execution for small work or interactive tasks.
   - Use serial subagents for dependent multi-unit work.
   - Use parallel subagents only after checking file ownership overlap; do not stage, commit, or run the full suite inside parallel workers.

### Phase 1.5: Morph-X Blueprint Constraints

Before writing or changing Swift/ObjC code:

1. Load `.morph-config.yaml` from the target iOS project root if present. If missing, use in-memory defaults and record `config_source: default`.
2. Build a blueprint prompt block from: project seed, feature intent, retrieved historical fingerprints, blacklisted pattern tags, existing architecture, and local test/build constraints.
3. Select a blueprint that differs from recently used strategy fingerprints across:
   - state management
   - module boundaries
   - file splitting
   - protocol or abstraction boundaries
   - error handling
   - data-flow organization
4. Write the constraints into the task notes before implementation. The constraints should guide original structure; they must not request cosmetic churn or semantic changes.
5. If config, CLI, or memory retrieval is unavailable, continue with a manual blueprint summary and mark Morph-X as degraded, not failed.

### Phase 2: Execute

For each task:

1. Mark it in progress.
2. Read relevant files and local patterns.
3. Find adjacent tests before editing.
4. Implement with existing conventions and the Phase 1.5 blueprint constraints.
5. Run a System-Wide Test Check: if shared contracts or user-facing behavior changed, choose a relevant broader test target; otherwise run focused tests.
6. Assess quality before moving on: behavior covered, edge cases considered, no unrelated refactors, no user work overwritten.

### Phase 3: Morph-X Apply and Similarity Audit

After Swift/ObjC code is produced and before final summary:

1. Apply safe transformation when the CLI is available:
   ```bash
   gale-harness morph --apply --config .morph-config.yaml --report .morph-report.json
   ```
   The transform must be semantics-preserving. If the command, SwiftSyntax, or ObjC adapter is unavailable, skip the transform, record the reason, and continue to audit fallback.

2. Audit similarity:
   ```bash
   gale-harness audit --similarity --config .morph-config.yaml --report .morph-audit.json
   ```
   Include AST/structure fingerprint, token n-gram, statement Jaccard, and control-flow approximation results when available. Missing baselines or tools are non-blocking and should be reported as degraded signals.

3. Handle thresholds:
   - Default behavior is warn, not block.
   - If `.morph-config.yaml` configures a blocking threshold and the audit exceeds it, stop before finalizing code and ask the user how to proceed.
   - Never claim the audit proves App Review compliance.

4. Run focused compile/test verification appropriate to the changed iOS project when available. If no Xcode or Swift test target is runnable, state the gap.

<!-- HKT-PATCH:phase-4.5 -->
### Phase 4.5: HKTMemory Store

After implementation and Morph-X audit, store a concise memory record:

```bash
hkt-memory store \
  --content "<summary with repo-relative files, blueprint constraints, strategy fingerprint, audit status, degraded fallback notes>" \
  --title "<work-x title>" \
  --topic "work-x morph blueprint strategy fingerprint" \
  --layer all
```

Store only summaries, tags, and fingerprints; do not store full source code. On error, note it as non-blocking and do not fail the workflow.
<!-- /HKT-PATCH:phase-4.5 -->

### Phase 5: Close

Return:

```text
## Work-X Summary
**Completed**: [what changed]
**Blueprint**: [constraints and strategy fingerprint]
**Morph Apply**: [report path or degraded reason]
**Similarity Audit**: [report path, threshold result, blocking/warning decision]
**Tests**: [commands run and results]
**Compliance Boundary**: Reduces template-code repetition risk; does not guarantee App Review success.
```

<!-- HKT-PATCH:gale-task-end -->
Run `gale-task log skill_completed 2>/dev/null || true`. If unavailable, skip silently.
<!-- /HKT-PATCH:gale-task-end -->
