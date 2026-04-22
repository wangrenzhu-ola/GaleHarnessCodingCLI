# Compounding Engineering Plugin

AI-powered development tools that get smarter with every use. Make each unit of engineering work easier than the last.

## Getting Started

After installing, run `/gh:setup` in any project. It diagnoses your environment, installs missing tools, and bootstraps project config in one interactive flow.

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
| Skills | 42+ |

## Skills

### Core Workflow

The primary entry points for engineering work, invoked as slash commands:

| Skill | Description |
|-------|-------------|
| `/gh:ideate` | Discover high-impact project improvements through divergent ideation and adversarial filtering |
| `/gh:brainstorm` | Explore requirements and approaches before planning |
| `/gh:plan` | Create structured plans for any multi-step task -- software features, research workflows, events, study plans -- with automatic confidence checking |
| `/gh:review` | Structured code review with tiered persona agents, confidence gating, and dedup pipeline |
| `/gh:work` | Execute work items systematically |
| `/gh:debug` | Systematically find root causes and fix bugs -- traces causal chains, forms testable hypotheses, and implements test-first fixes |
| `/gh:compound` | Document solved problems to compound team knowledge |
| `/gh:compound-refresh` | Refresh stale or drifting learnings and decide whether to keep, update, replace, or archive them |
| `/gh:optimize` | Run iterative optimization loops with parallel experiments, measurement gates, and LLM-as-judge quality scoring |

For `/gh:optimize`, see [`skills/gh-optimize/README.md`](./skills/gh-optimize/README.md) for usage guidance, example specs, and links to the schema and workflow docs.

### Research & Context

| Skill | Description |
|-------|-------------|
| `/gh:sessions` | Ask questions about session history across Claude Code, Codex, and Cursor |
| `/gh:slack-research` | Search Slack for interpreted organizational context -- decisions, constraints, and discussion arcs |

### Git Workflow

| Skill | Description |
|-------|-------------|
| `gh:pr-description` | Write or regenerate a value-first PR title and body from the current branch or a specified PR; used directly or by other skills |
| `git-clean-gone-branches` | Clean up local branches whose remote tracking branch is gone |
| `git-commit` | Create a git commit with a value-communicating message |
| `git-commit-push-pr` | Commit, push, and open a PR with an adaptive description; also update an existing PR description (delegates title/body generation to `gh:pr-description`) |
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

| Skill | Description |
|-------|-------------|
| `/gh-demo-reel` | Capture a visual demo reel (GIF demos, terminal recordings, screenshots) for PRs with project-type-aware tier selection |
| `/report-bug-ce` | Report a bug in the compound-engineering plugin |
| `/resolve-pr-feedback` | Resolve PR review feedback in parallel |
| `/sync` | Sync Claude Code config across machines |
| `/test-browser` | Run browser tests on PR-affected pages |
| `/test-xcode` | Build and test iOS apps on simulator using XcodeBuildMCP |
| `/gh:setup` | Diagnose environment, install missing tools, and bootstrap project config |
| `/gh:update` | Check compound-engineering plugin version and fix stale cache (Claude Code only) |

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
| `/gh:polish-beta` | Human-in-the-loop polish phase after /gh:review — verifies review + CI, starts a dev server from `.claude/launch.json`, generates a testable checklist, and dispatches polish sub-agents for fixes. Emits stacked-PR seeds for oversized work |
| `/lfg` | Full autonomous engineering workflow |

## Agents

Agents are specialized subagents invoked by skills — you typically don't call these directly.

### Review

| Agent | Description |
|-------|-------------|
| `agent-native-reviewer` | Verify features are agent-native (action + context parity) |
| `api-contract-reviewer` | Detect breaking API contract changes |
| `cli-agent-readiness-reviewer` | Evaluate CLI agent-friendliness against 7 core principles |
| `cli-readiness-reviewer` | CLI agent-readiness persona for gh:review (conditional, structured JSON) |
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
