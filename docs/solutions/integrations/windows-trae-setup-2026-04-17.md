---
title: "Windows Trae IDE setup: uv PATH and bash compatibility"
date: 2026-04-17
category: integration-issues
module: galeharness-cli-skills
problem_type: integration_issue
component: hkt-memory, gh-setup
symptoms:
  - "HKTMemory calls silently fail -- all gh: skills skip memory operations"
  - "gh:setup crashes with 'bash: command not found' or similar"
  - "uv not found when running uv run vendor/hkt-memory/scripts/hkt_memory_v5.py"
  - "check-health script produces no output or PowerShell syntax errors"
root_cause: config_error
resolution_type: documentation
severity: high
related_components:
  - skills/gh-setup
  - vendor/hkt-memory
  - all six core skills (gh:brainstorm, gh:plan, gh:work, gh:review, gh:compound, gh:ideate)
---

# Windows Trae IDE Setup: uv PATH and Bash Compatibility

## Problem

Windows users running GaleHarnessCLI skills in Trae IDE encounter two distinct failures:

1. **All HKTMemory operations silently fail.** All 6 core skills (`gh:brainstorm`, `gh:plan`, `gh:work`, `gh:review`, `gh:compound`, `gh:ideate`) invoke `uv run vendor/hkt-memory/scripts/hkt_memory_v5.py`. When `uv` is not in PATH, the call fails and the skill silently skips memory operations. No error is surfaced to the user because the skills are designed to continue on HKTMemory failure.

2. **`gh:setup` crashes immediately.** The setup skill runs `bash scripts/check-health`. Trae on Windows defaults to PowerShell v5.x. `bash` is not available in the sandbox shell. The script never runs, and the diagnostic output is empty.

## Root Cause

**Two separate issues:**

### Issue 1: uv not in PATH on Windows

`uv` does fully support Windows -- `uv run` and PEP 723 inline script metadata work identically across platforms. The failure is that:

- Windows users typically do not have `uv` installed
- Even when installed via `irm https://astral.sh/uv/install.ps1 | iex`, uv lands in `%USERPROFILE%\.local\bin` which is **not in PATH by default**
- Trae's AI sandbox does not inherit user-defined terminal profiles or `$PROFILE` customizations

### Issue 2: bash scripts incompatible with PowerShell

`vendor/hkt-memory/install.sh`, `vendor/hkt-memory/deploy.sh`, and `plugins/galeharness-cli/skills/gh-setup/scripts/check-health` are all bash scripts using:
- `#!/usr/bin/env bash`
- bash arrays (`deps=(...)`)
- `command -v` (no PowerShell equivalent)
- `brew install` (macOS/Linux package manager)
- Process substitution and `IFS` splitting

PowerShell v5.x cannot run any of these.

## Resolution

### Step 1: Install uv on Windows

Open PowerShell (not the Trae sandbox -- use a standalone PowerShell window) and run:

```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

### Step 2: Add uv to PATH

After installation, add `%USERPROFILE%\.local\bin` to your system PATH:

1. Open **System Properties** -> **Advanced** -> **Environment Variables**
2. Under "User variables", find `Path` and click **Edit**
3. Add `%USERPROFILE%\.local\bin` as a new entry
4. Click OK and restart Trae

To verify: open a new PowerShell window and run `uv --version`.

### Step 3: Configure HKTMemory environment variables

Set these as **system-level** environment variables (not session-only -- Trae's sandbox must see them):

| Variable | Value |
|----------|-------|
| `HKT_MEMORY_API_KEY` | Your API key |
| `HKT_MEMORY_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` |
| `HKT_MEMORY_MODEL` | `embedding-3` |

Set via System Properties -> Environment Variables -> New (under User variables).

### Step 4: Restart Trae

Trae's sandbox shell is spawned once at startup. Changes to PATH and environment variables are only picked up after a full Trae restart.

### Step 5: Verify HKTMemory

In the Trae sandbox terminal, run:

```powershell
uv run vendor/hkt-memory/scripts/hkt_memory_v5.py stats
```

If this returns stats output, HKTMemory is functional and all 6 core skills will use it.

## Known Limitations (as of 2026-04-17)

| Component | Status |
|-----------|--------|
| `gh:brainstorm`, `gh:plan`, `gh:work`, `gh:review`, `gh:compound`, `gh:ideate` | Work after uv + PATH fix |
| `gh:setup` -- HKTMemory env var guidance | Handled via inline PowerShell path added in SKILL.md |
| `gh:setup` -- `check-health` bash script | Not functional on PowerShell -- diagnostic output unavailable. Use inline PowerShell probes from gh:setup Windows path instead |
| `vendor/hkt-memory/install.sh` | Bash-only -- run under Git Bash or WSL2 if needed, or skip (uv install handles dependencies automatically) |
| `git-worktree`, `gh:optimize`, `gh:polish-beta` | May have additional bash dependencies not yet audited |

## Future Work

See `docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md` for the full option space:

- **check-health.ps1** -- PowerShell companion to the bash health-check script (Medium complexity)
- **TypeScript HKTMemory client** -- Replace Python/uv entirely with a Bun-native HTTP client (Medium-High)
- **MCP server** -- Wrap HKTMemory as a Trae-native MCP tool (High complexity)

## Background

The original compound-engineering-plugin (upstream) has no Windows support. This is GaleHarnessCLI's divergence: the uv + Python toolchain is well-supported on Windows once installed, making a working Windows path achievable with setup guidance alone. The bash script dependency in `gh:setup` is the harder problem requiring a `check-health.ps1` or equivalent.
