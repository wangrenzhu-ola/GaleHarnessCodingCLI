---
date: 2026-04-17
topic: windows-trae-compatibility
focus: Windows Trae IDE users cannot use gh: skills — uv not in PATH, bash scripts fail on PowerShell
---

# Ideation: Windows Trae Compatibility

## Codebase Context

**Project shape:** TypeScript/Bun CLI that converts Claude Code plugins to other agent platforms. Includes vendored HKTMemory v5.0 (Python/uv) and `gh:` prefix skills.

**Key research findings:**
- `uv run` and PEP 723 inline metadata work identically on Windows — the blocker is uv not in PATH, not missing platform support
- Trae on Windows defaults to **PowerShell v5.x** — bash is not available by default. The AI sandbox does not inherit user terminal profiles
- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `brew install` — completely broken on PowerShell
- Original compound-engineering-plugin has **zero Windows support** — we would be first movers
- Existing Windows fix already in repo: `sanitizePathName()` handles colon-in-filename for gh: skills
- All 6 core skills use `uv run vendor/hkt-memory/scripts/hkt_memory_v5.py` — works once uv is installed
- Trae forum confirms default shell is PowerShell 5.x with encoding issues; sandbox does not inherit terminal profile

**Affected skills:** gh:brainstorm, gh:plan, gh:work, gh:review, gh:compound, gh:ideate (all HKTMemory calls), gh:setup (check-health script)

## Ranked Ideas

### 1. `gh:setup` Windows inline detection path + uv install guidance
**Description:** Add platform detection early in `gh:setup` SKILL.md. When `$env:OS` is `Windows_NT`, skip `bash scripts/check-health`, emit inline PowerShell probe commands (`Get-Command uv`, `Get-Command gh`, `Test-Path .gitignore`), and output `irm https://astral.sh/uv/install.ps1 | iex` when uv is missing.
**Rationale:** `gh:setup` is the onboarding entry point. A SKILL.md branch costs nothing to ship — no new files, no bash changes, zero macOS/Linux regression. Windows users get actionable instructions on first run instead of a bash error.
**Downsides:** Guidance only — does not auto-execute installation. Depends on user running the PowerShell command manually.
**Confidence:** 88%
**Complexity:** Low
**Status:** Unexplored

### 2. `docs/solutions/integrations/windows-trae-setup.md` knowledge doc
**Description:** Persist the research findings as a solution doc: uv installation on Windows, PATH configuration (`%USERPROFILE%\.local\bin`), env var setup, which skills are immediately usable after uv install, known limitations (check-health bash). Serves both users and future contributors.
**Rationale:** Zero-cost, immediate value. Answers "what do I do first on Windows?" and documents the current state as institutional knowledge.
**Downsides:** Documentation alone doesn't fix the root issue — needs to accompany technical changes.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 3. `check-health.ps1` companion script
**Description:** Add `plugins/galeharness-cli/skills/gh-setup/scripts/check-health.ps1` as a PowerShell equivalent of the bash script. Uses `Get-Command`, `git rev-parse`, `winget install` commands. `gh:setup` SKILL.md selects script by platform.
**Rationale:** Zero regression on macOS/Linux. Windows users get actual diagnostic output and native install commands.
**Downsides:** Two parallel implementations to maintain; new dependencies must be added in both places.
**Confidence:** 82%
**Complexity:** Medium
**Status:** Unexplored

### 4. HKTMemory TypeScript/HTTP client (remove Python dependency)
**Description:** The env vars `HKT_MEMORY_BASE_URL` + `HKT_MEMORY_API_KEY` point to an HTTP endpoint. A `vendor/hkt-memory/client.ts` using `fetch` would implement store/retrieve/stats without Python or uv. All 6 skills replace `uv run hkt_memory_v5.py` with `bun run vendor/hkt-memory/client.ts`.
**Rationale:** Eliminates Python + uv entirely. Bun is already required — zero new install cost. Faster cold start than uv.
**Downsides:** Needs spike to understand full API contract. Local vector store logic may not map cleanly to HTTP calls — HKTMemory may use local file storage, not just a remote API.
**Confidence:** 70%
**Complexity:** Medium-High
**Status:** Unexplored

### 5. HKTMemory MCP Server (Trae-native integration)
**Description:** Implement `mcp/hkt-memory-server.ts` exposing store/retrieve/stats as MCP tools. Trae agent calls MCP tools instead of shelling out, bypassing uv/bash entirely.
**Rationale:** MCP is Trae's native tool interface — no shell execution required. Future-proof for other MCP-first platforms.
**Downsides:** Highest implementation cost. Requires TypeScript reimplementation of HKTMemory logic or API wrapping. MCP server needs process management.
**Confidence:** 65%
**Complexity:** High
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | devcontainer.json | Bypasses the problem; Windows users want local execution |
| 2 | `runCommand` CLI abstraction | Skills invoke uv via shell prose, not the CLI — abstraction doesn't reach the call site |
| 3 | `gh:review` bash `$()` replacement | Independent issue, not in scope of Windows/HKTMemory feedback |
| 4 | Add `trae` to `syncTargets` | Correct fix but unrelated to Windows runtime failure |
| 5 | `--trae-home` CLI flag | Correct but lower priority than runtime failure |
| 6 | Replace `deploy.sh` with Bun | Not on user install path; contributor-only concern |
| 7 | Platform filter tags to block skills | Blocking is worse than fixing; bad user experience |
| 8 | Post-install Windows PATH note | Not valuable enough as standalone change |
| 9 | Git Bash detection and reuse | Unstable — Git install paths vary; simpler to guide uv install directly |

## Session Log
- 2026-04-17: Initial ideation — ~28 candidates generated across 3 parallel agents, 5 survivors after adversarial filtering. Immediate action: implement idea #1 + #2 (fast path to unblock users). Ideas #3–5 queued for follow-up planning.
