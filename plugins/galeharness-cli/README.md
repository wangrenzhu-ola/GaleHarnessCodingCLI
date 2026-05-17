# Compounding Engineering Plugin

AI-powered development tools that get smarter with every use. Make each unit of engineering work easier than the last.

## Getting Started

After installing, run `/gh:setup` in any project. It diagnoses your environment, installs missing tools, and bootstraps project config in one interactive flow.

## HKTMemory Public Knowledge Root

Gale-managed memory calls use `gale-memory` as the runtime boundary. By default, task memory resolves to:

```text
~/.galeharness/knowledge/<project>/hkt-memory
```

Run `gale-memory status` to see the active root, source, and migration state. `status` only diagnoses; it does not copy legacy files.

Existing project-local `memory/` directories are copied into the public root by `gale-memory migrate` or task runtime on first migrating use, but they are not deleted or renamed. The copy-first migration preserves Markdown memories and the migration manifest while skipping derived caches such as `*.db`, vector stores, session transcript indexes, and `_lifecycle/events.jsonl`.

Override order: `gale-memory --memory-dir`, existing `HKT_MEMORY_DIR`, `memory.hkt_memory_dir` in `~/.galeharness/config.{json,yaml}`, then the derived public root. Bare `hkt-memory` keeps its upstream default path behavior; use `gale-memory` or set `HKT_MEMORY_DIR` when you want the public knowledge root.

## Document Language

Control the output language for workflow skills via `.compound-engineering/config.local.yaml`:

```yaml
language: zh-CN  # zh-CN (Chinese, default) or en (English)
```

**Affected skills:** `gh:brainstorm`, `gh:plan`, `gh:compound`, `gh:compound-refresh`, `gh:ideate`, `document-review`

**What gets translated:**
- Prose content: paragraphs, list items, table content
- Finding descriptions in document-review (including headless mode JSON)

**What stays in English:**
- Section headers (`## Problem Frame`, `## Requirements`, etc.)
- YAML frontmatter keys (`title`, `date`, `category`, etc.)
- Code blocks, inline code, file paths, URLs

**Default:** `zh-CN` when not configured. To opt out, set `language: en`.

## Components

| Component | Count |
|-----------|-------|
| Agents | 50+ |
| Skills | 42 |

## Recent upstream-sync highlights

The latest upstream capability sync improves long-lived PR feedback handling, cross-runtime web research, document-review auto-fix confidence, macOS Bash compatibility, worktree script resolution, and Codex `$CODEX_HOME` support.

## Skills

### Core Workflow

The primary entries form an end-to-end engineering chain:

```text
/gh:ideate -> /gh:brainstorm -> /gh:plan -> /gh:work or /gh:work-beta or /gh:work-x -> /gh:review -> /gh-demo-reel -> /gh:compound
```

Use the horizontal skills (`/gh:debug`, `/gh:optimize`, `/gh:simplify-code`, `/gh:product-pulse`, `/gh:sessions`, `/gh:slack-research`) when the situation calls for them rather than forcing every task through the full chain.

| Skill | When to use it | Output / value |
|-------|----------------|----------------|
| `/gh:ideate` | You want grounded improvement ideas or alternative directions before committing to a requirement. | Ranked ideas with constraints, risks, and next-step candidates. |
| `/gh:brainstorm` | A request is still fuzzy and needs problem framing, assumptions, non-goals, and success criteria. | A requirement-quality brief that can feed `/gh:plan`. |
| `/gh:plan` | A requirement is ready to decompose into implementation steps or an existing plan needs deepening. | A structured plan with files, risks, tests, and confidence checks. |
| `/gh:work` | Execute a scoped development task or plan with normal quality gates. | Implemented code plus verification evidence. |
| `/gh:work-beta` | Execute work while conserving main-agent context via external delegation/Codex-assisted split work. | Same target as `/gh:work`, with beta delegation tradeoffs. |
| `/gh:work-x` | Execute iOS Swift/ObjC work where Morph-X blueprint constraints and similarity audit reduce template-code repetition risk. | iOS-focused implementation with Morph-X transform/audit evidence. |
| `/gh:debug` | Investigate errors, test failures, stack traces, or production symptoms where root cause is unknown. | Causal diagnosis, testable hypothesis, fix, and regression verification. |
| `/gh:debug-x` | Debug iOS Swift/ObjC issues under Morph-X blueprint constraints. | iOS root-cause fix plus similarity/safety audit. |
| `/gh:review` | Run independent pre-PR or PR review with tiered personas and confidence filtering. | Deduplicated findings, severity, confidence, and fix recommendations. |
| `/gh-demo-reel` | Capture visual or terminal evidence after a change is working and before/while preparing PR evidence. | GIF, screenshot, or terminal recording URL/path suitable for PR notes. |
| `/gh:compound` | A problem was solved and should become reusable team knowledge. | A durable learning/solution document for future retrieval. |
| `/gh:compound-refresh` | Existing `docs/solutions/` knowledge may be stale, duplicated, or drifting. | Keep/update/replace/archive decisions and refreshed docs. |
| `/gh:nexus` | Analyze repos with GitNexus code intelligence (symbols, cypher queries, impact analysis). | Indexed repo insights, symbol context, change-impact reports. |

For `/gh:optimize`, see [`skills/gh-optimize/README.md`](./skills/gh-optimize/README.md) for usage guidance, example specs, and links to the schema and workflow docs.

### Strategy, product, and quality helpers

| Skill | When to use it | Output / value |
|-------|----------------|----------------|
| `/gh:strategy` | A repo lacks a crisp product anchor, or the team needs to realign on problem, users, metrics, and tracks. | Creates or updates root `STRATEGY.md`; prefer before large multi-track work. |
| `/gh:product-pulse` | You need a time-windowed read-only pulse of user experience, errors, performance, and quality signals. | Product pulse report with risks, regressions, and follow-up candidates. |
| `/gh:simplify-code` | Recent changes work but feel too complex, duplicated, or hard to reuse. | Behavior-preserving simplification and clarity improvements. |
| `/gh:optimize` | There is a measurable target such as performance, search quality, prompt quality, ranking, or clustering. | Metric-driven optimization loop with parallel experiments and judge/measurement gates. |
| `/gh:polish-beta` | A PR or feature needs browser/dev-server polish after review and CI, especially UI/interaction cleanup. | Testable polish checklist and scoped fix dispatches; beta surface. |

### Workflow Guardrails

The core `gh:` workflow includes Karpathy-inspired guardrails without requiring a separate skill. `gh:brainstorm` challenges problem framing and separates assumptions, non-goals, and success criteria; `gh:plan` requires complexity to trace to requirements, risks, or constraints; `gh:work` keeps non-trivial execution tied to a minimal change contract and surgical diffs; `gh:review` checks diff hygiene against intent and plan scope.

For the source references and integration rationale, see `docs/brainstorms/2026-04-24-karpathy-guidelines-integration-requirements.md` and `docs/solutions/workflow-issues/karpathy-guidelines-workflow-guardrails-2026-04-24.md` in this repository.

### Research & Context

| Skill | When to use it | Output / value |
|-------|----------------|----------------|
| `/gh:sessions` | Ask questions about prior Claude Code, Codex, and Cursor coding-agent sessions for the current repo or topic. | Synthesized history, prior decisions, failures, and relevant evidence. |
| `/gh-session-inventory` | Internal/support skill for discovering session files and metadata before choosing sessions to inspect. | JSONL inventory with platform, branch/CWD hints, timestamps, and keyword match counts. |
| `/gh-session-extract` | Internal/support skill for extracting a confirmed relevant session's skeleton or error signals. | Bounded skeleton/error excerpts that avoid loading huge raw transcripts. |
| `/gh:slack-research` | Search Slack for interpreted organizational context -- decisions, constraints, and discussion arcs. | Digest of relevant messages with synthesized context, not a raw message dump. |

### Git Workflow

| Skill | Description |
|-------|-------------|
| `git-clean-gone-branches` | Clean up local branches whose remote tracking branch is gone |
| `git-commit` | Create a git commit with a value-communicating message |
| `git-commit-push-pr` | Commit, push, and open a PR with an adaptive description; also update an existing PR description, or generate a description on its own without committing |
| `git-worktree` | Manage Git worktrees for parallel development |

### Upstream Sync Workflow

GaleHarnessCLI maintains a local per-commit upstream sync workflow for bringing changes over from the reference upstream repo without collapsing everything into one giant diff.

Repository entry points:

```bash
bash scripts/upstream-sync/generate-batch.sh --upstream-repo /path/to/upstream-checkout
bash scripts/upstream-sync/apply-patch-to-worktree.sh .context/galeharness-cli/upstream-sync/<date>/adapted/<patch>.patch
```

What this workflow records:
- `commit-range.txt` records the batch start commit, end commit, and `next_baseline_candidate`
- `README.md` in the batch directory records the patch table and recommended worktree flow
- `.upstream-ref` remains the durable baseline and should be updated manually to the batch `next_baseline_candidate` only after the whole batch has landed

Recommended operating model:
- Generate one dated batch from `.upstream-ref` -> upstream HEAD
- Process one adapted patch per isolated worktree
- Open one PR per adapted patch
- After all PRs land, write the batch `end_commit` / `next_baseline_candidate` into `.upstream-ref`

### Workflow Utilities

| Skill | When to use it | Output / value |
|-------|----------------|----------------|
| `/report-bug-ce` | Report a bug in the compound-engineering plugin. | Structured bug report for plugin maintainers. |
| `/resolve-pr-feedback` | Triage and resolve PR review feedback in parallel. | Validated fixes or documented rejected feedback. |
| `/sync` | Sync Claude Code config across machines. | Updated local config state. |
| `/test-browser` | Run browser tests on pages affected by a PR or branch. | Browser-test evidence and failures. |
| `/test-xcode` | Build and test iOS apps on simulator using XcodeBuildMCP. | Xcode build/test evidence. |
| `/gh:setup` | Diagnose environment, install missing tools, and bootstrap project config. | Environment report and setup fixes. |
| `/gh:update` | Check compound-engineering plugin version and fix stale cache (Claude Code only). | Plugin update/cache status and remediation. |

### Development Frameworks

| Skill | Description |
|-------|-------------|
| `agent-native-architecture` | Build AI agents using prompt-native architecture |
| `dhh-rails-style` | Write Ruby/Rails code in DHH's 37signals style |
| `frontend-design` | Create production-grade frontend interfaces |

### Review & Quality

| Skill | Description |
|-------|-------------|
| `document-review` | Review documents using parallel persona agents for role-specific feedback |

### Content & Collaboration

| Skill | Description |
|-------|-------------|
| `proof` | Create, edit, and share documents via Proof collaborative editor |

### Automation & Tools

| Skill | Description |
|-------|-------------|
| `gemini-imagegen` | Generate and edit images using Google's Gemini API |

### Beta / Experimental

| Skill | Description |
|-------|-------------|
| `gh:polish-beta` | Human-in-the-loop polish phase after /gh:review — verifies review + CI, starts a dev server from `.claude/launch.json`, generates a testable checklist, and dispatches polish sub-agents for fixes. Emits stacked-PR seeds for oversized work |
| `/lfg` | Full autonomous engineering workflow |

### Morph-X CLI Utilities

`gale-harness audit --similarity <project>` scans Swift/ObjC source against configured baselines and reports statement, token, structural, and control-flow similarity risk. `gale-harness morph --apply <project>` selects a deterministic Morph-X blueprint/strategy and calls an optional SwiftSyntax adapter when configured. These tools are for reducing template-code repetition risk; they do not guarantee Apple App Review outcomes.

## Agents

Agents are specialized subagents invoked by skills — you typically don't call these directly.

### Review

| Agent | Description |
|-------|-------------|
| `agent-native-reviewer` | Verify features are agent-native (action + context parity) |
| `api-contract-reviewer` | Detect breaking API contract changes |
| `architecture-strategist` | Analyze architectural decisions and compliance |
| `code-simplicity-reviewer` | Final pass for simplicity and minimalism |
| `correctness-reviewer` | Logic errors, edge cases, state bugs |
| `data-integrity-guardian` | Database migrations and data integrity |
| `data-migration-expert` | Validate ID mappings match production, check for swapped values |
| `data-migrations-reviewer` | Migration safety with confidence calibration |
| `deployment-verification-agent` | Create Go/No-Go deployment checklists for risky data changes |
| `dhh-rails-reviewer` | Rails review from DHH's perspective |
| `julik-frontend-races-reviewer` | Review JavaScript/Stimulus code for race conditions |
| `gale-rails-reviewer` | Rails code review with strict conventions |
| `gale-python-reviewer` | Python code review with strict conventions |
| `gale-typescript-reviewer` | TypeScript code review with strict conventions |
| `maintainability-reviewer` | Coupling, complexity, naming, dead code |
| `pattern-recognition-specialist` | Analyze code for patterns and anti-patterns |
| `performance-oracle` | Performance analysis and optimization |
| `performance-reviewer` | Runtime performance with confidence calibration |
| `reliability-reviewer` | Production reliability and failure modes |
| `schema-drift-detector` | Detect unrelated schema.rb changes in PRs |
| `security-reviewer` | Exploitable vulnerabilities with confidence calibration |
| `security-sentinel` | Security audits and vulnerability assessments |
| `swift-ios-reviewer` | Swift and iOS code review -- SwiftUI state, retain cycles, concurrency, Core Data threading, accessibility |
| `testing-reviewer` | Test coverage gaps, weak assertions |
| `project-standards-reviewer` | CLAUDE.md and AGENTS.md compliance |
| `adversarial-reviewer` | Construct failure scenarios to break implementations across component boundaries |

### Document Review

| Agent | Description |
|-------|-------------|
| `coherence-reviewer` | Review documents for internal consistency, contradictions, and terminology drift |
| `design-lens-reviewer` | Review plans for missing design decisions, interaction states, and AI slop risk |
| `feasibility-reviewer` | Evaluate whether proposed technical approaches will survive contact with reality |
| `product-lens-reviewer` | Challenge problem framing, evaluate scope decisions, surface goal misalignment |
| `scope-guardian-reviewer` | Challenge unjustified complexity, scope creep, and premature abstractions |
| `security-lens-reviewer` | Evaluate plans for security gaps at the plan level (auth, data, APIs) |
| `adversarial-document-reviewer` | Challenge premises, surface unstated assumptions, and stress-test decisions |

### Research

| Agent | Description |
|-------|-------------|
| `best-practices-researcher` | Gather external best practices and examples |
| `framework-docs-researcher` | Research framework documentation and best practices |
| `git-history-analyzer` | Analyze git history and code evolution |
| `issue-intelligence-analyst` | Analyze GitHub issues to surface recurring themes and pain patterns |
| `learnings-researcher` | Search institutional learnings for relevant past solutions |
| `repo-research-analyst` | Research repository structure and conventions |
| `session-historian` | Search prior Claude Code, Codex, and Cursor sessions for related investigation context |
| `slack-researcher` | Search Slack for organizational context relevant to the current task |
| `web-researcher` | Perform structured external web research for prior art, market signals, and cross-domain analogies |

### Design

| Agent | Description |
|-------|-------------|
| `design-implementation-reviewer` | Verify UI implementations match Figma designs |
| `design-iterator` | Iteratively refine UI through systematic design iterations |
| `figma-design-sync` | Synchronize web implementations with Figma designs |

### Workflow

| Agent | Description |
|-------|-------------|
| `pr-comment-resolver` | Address PR comments and implement fixes |
| `spec-flow-analyzer` | Analyze user flows and identify gaps in specifications |

### Docs

| Agent | Description |
|-------|-------------|
| `ankane-readme-writer` | Create READMEs following Ankane-style template for Ruby gems |

## Installation

```bash
claude /plugin install compound-engineering
```

Then run `/gh:setup` to check your environment and install recommended tools.

## Version History

See the repo root [CHANGELOG.md](../../CHANGELOG.md) for canonical release history.

## License

MIT
