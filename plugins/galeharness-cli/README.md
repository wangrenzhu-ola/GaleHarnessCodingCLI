# GaleHarnessCLI Plugin

AI-powered development tools with **HKTMemory vector knowledge base** — every phase of the workflow reads from and writes to memory, creating a compounding knowledge system that gets smarter with every use.

## Workflow

```
Brainstorm -> Plan -> Work -> Review -> Compound -> Repeat
    ^
  Ideate (可选)
```

**Each phase automatically interacts with HKTMemory:**
- **Before execution**: Retrieve relevant memories from previous cycles
- **After completion**: Store new knowledge for future cycles

## Getting Started

After installing, run `/gh-setup` in any project. It:
- Diagnoses your environment
- **Installs HKTMemory vector knowledge base (required)**
- **Interactively configures HKTMemory API credentials** (with file-mode fallback)
- Installs missing tools
- Bootstraps project config
- Verifies HKTMemory connection

## Components

| Component | Count |
|-----------|-------|
| Agents | 50+ |
| Skills | 42+ |

## Skills

### Core Workflow (Memory-Enabled)

The primary entry points for engineering work, invoked as slash commands. **Every skill automatically retrieves memories before execution and stores new knowledge after completion.**

| Skill | Description | Memory Read | Memory Write |
|-------|-------------|-------------|--------------|
| `/gh:ideate` | Discover high-impact project improvements through divergent ideation and adversarial filtering | Past improvements | New opportunities |
| `/gh:brainstorm` | Explore requirements and approaches before planning | Related requirements | Requirements doc |
| `/gh:plan` | Create structured plans for any multi-step task with automatic confidence checking | Similar solutions | Technical plan |
| `/gh:work` | Execute work items systematically | Implementation patterns | Implementation summary |
| `/gh:review` | Structured code review with tiered persona agents, confidence gating, and dedup pipeline | Review patterns | Review findings |
| `/gh:compound` | Document solved problems to compound team knowledge | Related solutions | Complete knowledge |
| `/gh:compound-refresh` | Refresh stale or drifting learnings and decide whether to keep, update, replace, or archive them | Existing learnings | Updated learnings |
| `/gh:debug` | Systematically find root causes and fix bugs | Similar issues | Debug experience |
| `/gh:optimize` | Run iterative optimization loops with parallel experiments, measurement gates, and LLM-as-judge quality scoring | Optimization strategies | Optimization results |

**Cross-environment sync**: The `memory/` directory is committed to git, allowing knowledge to sync across environments.

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
| `git-commit-push-pr` | Commit, push, and open a PR with an adaptive description; also update an existing PR description (delegates title/body generation to `ce-pr-description`) |
| `git-worktree` | Manage Git worktrees for parallel development |

### Workflow Utilities

| Skill | Description |
|-------|-------------|
| `/gh:changelog` | Create engaging changelogs for recent merges |
| `/gh:demo-reel` | Capture a visual demo reel (GIF demos, terminal recordings, screenshots) for PRs with project-type-aware tier selection |
| `/gh:report-bug` | Report a bug in GaleHarnessCLI |
| `/resolve-pr-feedback` | Resolve PR review feedback in parallel |
| `/sync` | Sync Claude Code config across machines |
| `/test-browser` | Run browser tests on PR-affected pages |
| `/test-xcode` | Build and test iOS apps on simulator using XcodeBuildMCP |
| `/onboarding` | Generate `ONBOARDING.md` to help new contributors understand the codebase |
| `/gh-setup` | Diagnose environment, install HKTMemory, configure credentials, install missing tools, and bootstrap project config |
| `/gh-update` | Check GaleHarnessCLI plugin version and fix stale cache (Claude Code only) |
| `/todo-resolve` | Resolve todos in parallel |
| `/todo-triage` | Triage and prioritize pending todos |

### Development Frameworks

| Skill | Description |
|-------|-------------|
| `agent-native-architecture` | Build AI agents using prompt-native architecture |
| `andrew-kane-gem-writer` | Write Ruby gems following Andrew Kane's patterns |
| `dhh-rails-style` | Write Ruby/Rails code in DHH's 37signals style |
| `dspy-ruby` | Build type-safe LLM applications with DSPy.rb |
| `frontend-design` | Create production-grade frontend interfaces |

### Review & Quality

| Skill | Description |
|-------|-------------|
| `claude-permissions-optimizer` | Optimize Claude Code permissions from session history |
| `document-review` | Review documents using parallel persona agents for role-specific feedback |

### Content & Collaboration

| Skill | Description |
|-------|-------------|
| `gale-style-editor` | Review copy for Every's style guide compliance |
| `proof` | Create, edit, and share documents via Proof collaborative editor |
| `todo-create` | File-based todo tracking system |

### Automation & Tools

| Skill | Description |
|-------|-------------|
| `gemini-imagegen` | Generate and edit images using Google's Gemini API |

### Beta / Experimental

| Skill | Description |
|-------|-------------|
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
| `gale-dhh-rails-reviewer` | Rails review from DHH's perspective |
| `gale-julik-frontend-races-reviewer` | Review JavaScript/Stimulus code for race conditions |
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
claude /plugin install galeharness-cli
```

Then run `/gh-setup` to:
- Check your environment
- **Install HKTMemory (required)**
- **Configure HKTMemory credentials interactively**
- Install recommended tools

### HKTMemory Configuration

During setup, you'll be prompted for:
- `HKT_MEMORY_API_KEY` - Your API key (or skip for file-only mode)
- `HKT_MEMORY_BASE_URL` - API endpoint (default: https://open.bigmodel.cn/api/paas/v4/)
- `HKT_MEMORY_MODEL` - Embedding model (default: embedding-3)

**File-only mode**: If you don't have an API key, HKTMemory will work in file-only mode using local storage (`memory/` directory).

## Version History

See the repo root [CHANGELOG.md](../../CHANGELOG.md) for canonical release history.

## License

MIT
