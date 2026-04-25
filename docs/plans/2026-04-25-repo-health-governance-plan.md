---
title: "GaleHarness repo health governance first PR plan"
type: feat
status: approved
date: 2026-04-25
origin: "external Hermes brainstorm: galeharness-repo-health-2026-04-25"
document_review_required: true
document_review_status: complete
---

## Objective

Establish a low-risk repo-health governance baseline for GaleHarnessCLI: document the taxonomy, add a read-only advisory checker, and make repo bloat/state drift visible without deleting, rewriting, or blocking valid work.

The first PR is a **minimal advisory baseline** only. It creates visibility and shared language. It does not clean files, change ignore policy, rewrite history, or enforce CI failures.

## Constraints

- Do not delete, move, truncate, or auto-fix repository content.
- Keep the checker read-only and advisory; default exit code 0.
- Treat `docs/solutions/`, `docs/plans/`, `memory/`, and `vendor/` as protected knowledge/source surfaces until policy is confirmed.
- Use repo-relative paths in all reports.
- Findings are metadata-only: path, rule, category, severity, reason, suggestedAction, optional size/count. No file contents, env values, DB contents, or secrets.
- Do not add a blocking CI gate in the first PR.
- Do not modify `.github/workflows/ci.yml`.
- Local scans must be targeted, capped, use `lstat` (no symlink traversal), and report capped/approximate summaries only.
- Release archive rule must be path-scoped and conservative/advisory; no extension-only blocking.
- Docs lifecycle checks are aggregate/advisory only; avoid per-file noisy missing-metadata flood.

## Proposed First PR Scope

1. Add a durable repo-health policy document:
   - `docs/solutions/developer-experience/repo-health-governance-policy-2026-04-25.md`

2. Add a read-only advisory checker:
   - `scripts/check-repo-health.ts`

3. Add focused tests:
   - `tests/repo-health-check.test.ts`

4. Add a low-risk package script:
   - `package.json`: `repo:health`

5. Do not modify `.github/workflows/ci.yml` in the first PR.

## Implementation Steps

1. Write the policy doc with the taxonomy:
   - source
   - generated output
   - runtime state
   - durable knowledge
   - workflow drafts
   - local scratch
   - vendor source vs vendor build/dependency output

2. Implement checker types and pure scan functions in `scripts/check-repo-health.ts`.
   - Follow the existing pattern from `scripts/windows-compat-scan.ts`: exported functions, testable pure logic, CLI guarded by `import.meta.main`.

3. Implement tracked-file checks using `git ls-files -z`.
   - Detect high-confidence accidental bloat patterns.
   - Detect tracked runtime/state candidates.
   - Detect large tracked files above advisory thresholds.

4. Implement targeted local ignored-artifact checks.
   - Check known paths such as `.context/`, `.qoder/`, `.worktrees/`, `test-gh-local`, `vendor/taskboard/node_modules/`, and `node_modules/`.
   - Report approximate size/count only.
   - Use `lstat` (no symlink traversal), capped directory walk.

5. Implement docs lifecycle advisory checks.
   - Scan `docs/brainstorms/`, `docs/plans/`, and `docs/ideation/`.
   - Aggregate advisory only: report count of docs missing lifecycle metadata, not per-file findings.
   - Report as `info`, never blocking.

6. Render stable text output and optional JSON output.
   - Text for humans.
   - JSON for future CI or PR-comment automation; include `schemaVersion` field.
   - Default exit code should be `0` unless the checker itself crashes.

7. Add `package.json` script:
   - `repo:health`: `bun run scripts/check-repo-health.ts`

8. Add tests using temp git repositories or injected scanner seams.
   - Avoid depending on the real repo state.
   - Cover path normalization, severity, report shape, no-write behavior, and no content leakage.

## Severity Labels

Use non-enforcement severity labels to avoid implying blocking behavior in an advisory-only tool:

| Label | Meaning |
|---|---|
| `high-confidence` | Almost certainly accidental; reviewer should prioritize |
| `review` | Needs human judgment; may be intentional |
| `info` | Advisory/informational only |

## Files to Add/Change

Add:
- `docs/solutions/developer-experience/repo-health-governance-policy-2026-04-25.md`
- `scripts/check-repo-health.ts`
- `tests/repo-health-check.test.ts`

Modify:
- `package.json`

Do not change in first PR:
- `.gitignore`
- `.github/workflows/ci.yml`
- `memory/`
- `vendor/`
- existing tracked docs or reports

## Checker Design

Finding shape:

```ts
type RepoHealthFinding = {
  path: string
  category: "source" | "generated" | "runtime-state" | "durable-knowledge" | "workflow-draft" | "local-scratch" | "vendor"
  severity: "high-confidence" | "review" | "info"
  rule: string
  reason: string
  suggestedAction: string
  size?: number
  count?: number
  capped?: boolean
}
```

JSON output envelope:

```ts
type RepoHealthReport = {
  schemaVersion: 1
  generatedAt: string
  findings: RepoHealthFinding[]
  localArtifacts: LocalArtifactSummary[]
  docsLifecycle: DocsLifecycleSummary
}
```

Initial rules:

| Rule | Severity | Notes |
|---|---|---|
| tracked `node_modules/` | `high-confidence` | Accidental bloat |
| tracked `.DS_Store` | `high-confidence` | Local artifact |
| tracked release archives | `review` | Path-scoped, conservative; no extension-only matching |
| tracked runtime DB under `memory/*.db` | `review` | Policy question, not auto-cleanup |
| tracked lifecycle state files | `review` | Especially `memory/_lifecycle/*` |
| large tracked generated reports | `review` | Example: `docs/async-progress/*.md` above threshold |
| workflow docs missing lifecycle fields | `info` | Aggregate advisory only |
| ignored local heavy paths | `info` | Report local footprint only |
| vendor dependency/build output | `review` if tracked, `info` if ignored local | Preserve vendor source |

CLI behavior:
- `bun run scripts/check-repo-health.ts`
- `bun run scripts/check-repo-health.ts --format json`
- no write mode because first version should not write reports at all

## CI Strategy

First PR:
- Do not add CI enforcement.
- Keep `repo:health` as a local/manual advisory command.

Follow-up PR:
- Add a warning-only CI step if baseline output is stable and cheap.
- Use `continue-on-error: true`.
- Prefer JSON artifact or log summary over PR failure.

## Tests / Verification

Targeted:
- `bun test tests/repo-health-check.test.ts`
- `bun run repo:health`

Regression:
- `bun test`
- `bun run release:validate`

Test scenarios:
- tracked `node_modules/foo.js` reports `high-confidence`
- tracked `memory/vector_store.db` reports `review`
- tracked `docs/solutions/...` is not treated as disposable
- ignored `vendor/taskboard/node_modules/` reports local footprint without deletion advice
- docs lifecycle uses aggregate `info` advisory
- JSON output contains repo-relative paths only and `schemaVersion`
- report does not include file contents

## Rollback Strategy

Rollback is simple: revert the policy doc, checker script, tests, and package script. Since the first PR does not alter CI, ignore rules, tracked state, vendor content, or memory files, rollback has no data migration or cleanup component.

## Risks / Open Questions

- `memory/` may mix durable knowledge and runtime state; policy must be confirmed before any ignore/tracking change.
- `vendor/taskboard/` may be required as source, but dependency/build output should likely remain local.
- Docs lifecycle rules can become noisy if too strict; start with aggregate advisory metadata only.
- Size thresholds need calibration against current repo reality.
- `.upstream-ref` and `.upstream-repo` are workflow metadata; checker should report for policy review, not prescribe deletion.
- CI warning output could become log noise if added before baseline review.

## Document Review Answers

1. First PR is local-only; no CI changes.
2. `docs/solutions/developer-experience/` is confirmed as the right home.
3. Recommended lifecycle fields: `status`, `date`, `title` at minimum.
4. Tracked `memory/*.db` classified as `review`.
5. Large tracked generated report threshold: conservative (100 KB default).
6. `vendor/taskboard/` status deferred; checker reports for review, not deletion.
7. Checker defaults to exit 0; non-zero exit deferred to future CI gate mode.
