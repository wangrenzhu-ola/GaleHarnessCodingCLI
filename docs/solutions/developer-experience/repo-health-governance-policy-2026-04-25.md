---
title: "Repo health governance policy: file taxonomy and advisory checker"
date: 2026-04-25
category: developer-experience
module: developer-tooling
problem_type: developer_experience
component: repo-health
severity: low
status: active
applies_when:
  - "New files are committed that may be runtime state, generated output, or accidental bloat"
  - "Repository size or file count grows unexpectedly"
  - "Developer wants to understand what belongs in the repo vs. what is local-only"
tags:
  - repo-health
  - governance
  - bloat-detection
  - advisory
  - developer-experience
---

# Repo health governance policy: file taxonomy and advisory checker

## Context

GaleHarnessCLI is a multi-surface repository containing CLI source, plugin workspaces, vendored dependencies, knowledge bases, and workflow artifacts. Over time, files that are runtime state, generated output, or local scratch can accumulate in the tracked tree, increasing clone size and creating noise in diffs.

This policy establishes a shared taxonomy for classifying repository files and an advisory checker that surfaces potential issues without deleting, moving, or blocking valid work.

## File Taxonomy

Every file in the repository belongs to one of these categories:

| Category | Description | Examples | Tracked? |
|---|---|---|---|
| source | Code, configuration, and build definitions authored by contributors | `src/**/*.ts`, `package.json`, `AGENTS.md` | Yes |
| generated | Output produced by tools from source inputs | `docs/async-progress/*.md`, compiled binaries | Generally no; exceptions need justification |
| runtime-state | Data created at runtime that changes with each execution | `memory/*.db`, `memory/_lifecycle/*` | Review case-by-case |
| durable-knowledge | Documented decisions, solutions, and patterns intended to persist | `docs/solutions/**`, `docs/specs/**` | Yes |
| workflow-draft | In-progress plans, brainstorms, and ideation docs | `docs/plans/**`, `docs/brainstorms/**`, `docs/ideation/**` | Yes, with lifecycle metadata |
| local-scratch | Temporary files consumed once and discarded | `.context/`, `.qoder/`, OS temp dirs | No |
| vendor | Third-party source vendored into the repo | `vendor/hkt-memory/` | Yes for source; no for build output or `node_modules/` |

## Advisory Checker

The checker (`scripts/check-repo-health.ts`) is a read-only tool that reports findings without modifying the repository. It:

- Scans tracked files via `git ls-files` for accidental bloat and runtime state candidates.
- Checks targeted local paths for ignored heavy artifacts.
- Reports aggregate docs lifecycle metadata status.
- Outputs human-readable text (default) or structured JSON (`--format json`).
- Always exits 0 unless the checker itself crashes.

### Severity Labels

| Label | Meaning |
|---|---|
| `high-confidence` | Almost certainly accidental; reviewer should prioritize |
| `review` | Needs human judgment; may be intentional |
| `info` | Advisory/informational only |

These labels are explicitly non-blocking. No severity level causes a non-zero exit code in the first version.

### Rules

| Rule | Severity | Category | What It Detects |
|---|---|---|---|
| `tracked-node-modules` | `high-confidence` | generated | Files under any `node_modules/` in the tracked tree |
| `tracked-ds-store` | `high-confidence` | local-scratch | `.DS_Store` files in the tracked tree |
| `tracked-release-archive` | `review` | generated | Release archives under path-scoped locations (conservative, not extension-only) |
| `tracked-runtime-db` | `review` | runtime-state | Database files under `memory/` |
| `tracked-lifecycle-state` | `review` | runtime-state | Lifecycle state files under `memory/_lifecycle/` |
| `tracked-large-generated` | `review` | generated | Tracked files above size threshold in generated-output paths |
| `docs-lifecycle-aggregate` | `info` | workflow-draft | Aggregate count of workflow docs missing lifecycle metadata |
| `local-heavy-path` | `info` | local-scratch | Ignored local paths with significant disk usage |
| `vendor-build-output` | `review` / `info` | vendor | Vendor dependency/build output (tracked vs. ignored) |

### Running the Checker

```bash
bun run repo:health                              # human-readable text
bun run scripts/check-repo-health.ts --format json  # structured JSON with schemaVersion
```

## Guidance

### What belongs in the tracked tree

- All source code, configuration, and build definitions.
- Durable knowledge (solutions, specs, patterns).
- Workflow drafts with lifecycle metadata (`status`, `date`, `title`).
- Vendor source code (not vendor `node_modules/` or build output).

### What should stay local-only

- `node_modules/` (managed by package manager).
- `.DS_Store`, `.Thumbs.db`, and other OS artifacts.
- `.context/` and `.qoder/` workflow scratch.
- Compiled binaries and release archives.
- Runtime databases unless explicitly justified.

### When a finding appears

1. Read the finding's `reason` and `suggestedAction`.
2. If the file is intentional, no action is needed -- the checker is advisory.
3. If the file is accidental, remove it from tracking in a follow-up PR.
4. For `review` findings, discuss with the team before acting.

## Why This Matters

Repository bloat increases clone time, wastes CI minutes, and makes it harder to distinguish real changes from noise. A shared taxonomy and advisory tool give the team a common vocabulary for discussing what belongs in the repo, without imposing enforcement before consensus exists.

## When to Apply

- Before creating a PR that adds new file types or large files.
- During periodic repo health reviews.
- When onboarding new contributors to explain repo structure.
- When evaluating whether `memory/`, `vendor/`, or generated output paths need policy changes.

## Related

- [docs/solutions/developer-experience/windows-compat-scan-side-effect-free-cli-2026-04-25.md](windows-compat-scan-side-effect-free-cli-2026-04-25.md) -- same pattern: advisory scanner, import-safe, side-effect-free
