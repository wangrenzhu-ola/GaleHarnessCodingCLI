---
name: gh:setup
description: "Diagnose and configure compound-engineering environment. Checks CLI dependencies, plugin version, and repo-local config. Offers guided installation for missing tools. Use when troubleshooting missing tools, verifying setup, or before onboarding."
disable-model-invocation: true
---

# Compound Engineering Setup

## Interaction Method

Ask the user each question below using the platform's blocking question tool (e.g., `AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). If no structured question tool is available, present each question as a numbered list and wait for a reply before proceeding. For multiSelect questions, accept comma-separated numbers (e.g. `1, 3`). Never skip or auto-configure.

Interactive setup for compound-engineering — diagnoses environment health, cleans obsolete repo-local CE config, and helps configure required tools. Review agent selection is handled automatically by `gh:review`; project-specific review guidance belongs in `CLAUDE.md` or `AGENTS.md`.

## Phase 0: Detect Platform

Before any other step, determine whether this is a Windows environment.

Run the following detection. On Windows PowerShell, `$env:OS` is set to `Windows_NT`. On POSIX (macOS/Linux), it is unset.

**Windows detection:** Try running `$env:OS` in the current shell. If the output is `Windows_NT`, set `IS_WINDOWS=true` and follow the **Windows path** below. Otherwise, follow the **standard path**.

If shell detection is unavailable, ask the user: "Are you on Windows?" and route accordingly.

### Windows Path (PowerShell)

On Windows, `bash` is not available in the default Trae shell (PowerShell v5.x). Skip Steps 1-2 and run the following inline diagnostics instead.

Display: "Compound Engineering -- checking your environment (Windows)..."

Run each check and report results:

```powershell
# Check uv
Get-Command uv -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
```

```powershell
# Check gh
Get-Command gh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
```

```powershell
# Check jq
Get-Command jq -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
```

```powershell
# Check HKTMemory env vars
[System.Environment]::GetEnvironmentVariable("HKT_MEMORY_API_KEY"), `
[System.Environment]::GetEnvironmentVariable("HKT_MEMORY_BASE_URL"), `
[System.Environment]::GetEnvironmentVariable("HKT_MEMORY_MODEL")
```

For each missing tool, report it as yellow and provide the Windows install command:

| Tool | Windows install command |
|------|------------------------|
| uv | `irm https://astral.sh/uv/install.ps1 \| iex` |
| gh | `winget install GitHub.cli` |
| jq | `winget install jqlang.jq` |
| ffmpeg | `winget install Gyan.FFmpeg` |
| agent-browser | `npm install -g agent-browser` |

**Important -- uv PATH on Windows:** After installing uv on Windows, add `$env:USERPROFILE\.local\bin` to your system PATH if it is not already there. Without this, `uv` is installed but not discoverable by the Trae sandbox shell. To verify: open a new PowerShell window and run `uv --version`.

**HKTMemory env vars on Windows:** Set these in Windows System Properties -> Environment Variables (not just in the terminal session):
- `HKT_MEMORY_API_KEY` -- your API key
- `HKT_MEMORY_BASE_URL` -- `https://open.bigmodel.cn/api/paas/v4/`
- `HKT_MEMORY_MODEL` -- `embedding-3`

After installing uv and configuring env vars, restart Trae to ensure the sandbox picks up the updated PATH.

Display a summary of the inline diagnostic results (which tools were found, which are missing, env var status). Then proceed to **Phase 1 / Step 3: Evaluate Results** below for the completion check and next steps.

---

## Phase 1: Diagnose (standard path -- macOS/Linux)

### Step 1: Determine Plugin Version

Detect the installed compound-engineering plugin version by reading the plugin metadata or manifest. This is platform-specific -- use whatever mechanism is available (e.g., reading `plugin.json` from the plugin root or cache directory). If the version cannot be determined, skip this step.

If a version is found, pass it to the check script via `--version`. Otherwise omit the flag.

### Step 2: Run the Health Check Script

Before running the script, display: "Compound Engineering -- checking your environment..."

Run the bundled check script. Do not perform manual dependency checks -- the script handles all CLI tools, agent skills, repo-local CE file checks, and `.gitignore` guidance in one pass.

```bash
bash scripts/check-health --version VERSION
```

Or without version if Step 1 could not determine it:

```bash
bash scripts/check-health
```

Script reference: `scripts/check-health`

Display the script's output to the user.

### Step 3: Evaluate Results

**Platform detection (pre-resolved):**
- **macOS/Linux:** !`[ -n "${CLAUDE_PLUGIN_ROOT}" ] && echo "CLAUDE_CODE" || echo "OTHER"`
- **Windows:** !`if ($env:CLAUDE_PLUGIN_ROOT) { "CLAUDE_CODE" } else { "OTHER" }`

If the platform detection resolved to `CLAUDE_CODE`, this is a Claude Code session and `/gh:update` is available. Otherwise, omit any `/gh:update` references from output.

**For Windows users:** The inline diagnostic output from Phase 0 shows tool availability directly. A tool is missing if `Get-Command` returned nothing (blank line). For macOS/Linux users, check the health-check script output as described below.

After the diagnostic report, check whether:

- any CLI tools are missing:
  - **macOS/Linux:** reported as yellow in the script output
  - **Windows:** `Get-Command` returned no result for uv, gh, or jq
- any agent skills are missing:
  - **macOS/Linux:** reported as yellow in the Skills section
  - **Windows:** skip agent-skill checks for now
- `compound-engineering.local.md` is present and needs cleanup
- `.compound-engineering/config.local.yaml` does not exist or is not safely gitignored
- `.compound-engineering/config.local.example.yaml` is missing or outdated

If everything is installed, no repo-local cleanup is needed, and `.compound-engineering/config.local.yaml` already exists and is gitignored, display the tool and skill list and completion message. Parse the tool and skill names from the script output and list each with a green circle. Omit the Skills line if the Skills section is absent from the script output:

```
 ✅ Compound Engineering setup complete

    Tools:  🟢 agent-browser  🟢 gh  🟢 jq  🟢 vhs  🟢 silicon  🟢 ffmpeg  🟢 ast-grep
    Skills: 🟢 ast-grep
    Config: ✅

    Run /gh:setup anytime to re-check.
```

If this is a Claude Code session, append to the message: "Run /gh:update to grab the latest plugin version."

Stop here.

Otherwise proceed to Phase 2 to resolve any issues. Handle repo-local cleanup (Step 4) first, then config bootstrapping (Step 5), then missing dependencies (Step 6).

## Phase 2: Fix

### Step 4: Resolve Repo-Local CE Issues

Resolve the repository root (`git rev-parse --show-toplevel`). If `compound-engineering.local.md` exists at the repo root, explain that it is obsolete because review-agent selection is automatic and CE now uses `.compound-engineering/config.local.yaml` for any surviving machine-local state. Ask whether to delete it now. Use the repo-root path when deleting.

### Step 5: Bootstrap Project Config

Resolve the repository root (`git rev-parse --show-toplevel`). All paths below are relative to the repo root, not the current working directory.

**Example file (always refresh):** Copy `references/config-template.yaml` to `<repo-root>/.compound-engineering/config.local.example.yaml`, creating the directory if needed. This file is committed to the repo and always overwritten with the latest template so teammates can see available settings.

**Local config (create once):** If `.compound-engineering/config.local.yaml` does not exist, ask whether to create it:

```
Set up a local config file for this project?
This saves your Compound Engineering preferences (like which tools to use and how workflows behave).
Everything starts commented out -- you only enable what you need.

1. Yes, create it (Recommended)
2. No thanks
```

If the user approves, copy `references/config-template.yaml` to `<repo-root>/.compound-engineering/config.local.yaml`. If `.compound-engineering/config.local.yaml` is not already covered by `.gitignore`, offer to add the entry:

```text
.compound-engineering/*.local.yaml
```

If the local config already exists, check whether it is safely gitignored. If not, offer to add the `.gitignore` entry as above.

### Step 6: Offer Installation

Present the missing tools and skills using a multiSelect question with all items pre-selected. Use the install commands and URLs from the script's diagnostic output. Group items under `Tools:` and `Skills:` so the user can see which runtime each item targets; omit a group whose items are all installed.

```
The following items are missing. Select which to install:
(All items are pre-selected)

Tools:
  [x] agent-browser - Browser automation for testing and screenshots
  [x] gh - GitHub CLI for issues and PRs
  [x] jq - JSON processor
  [x] vhs (charmbracelet/vhs) - Create GIFs from CLI output
  [x] silicon (Aloxaf/silicon) - Generate code screenshots
  [x] ffmpeg - Video processing for feature demos
  [x] ast-grep - Structural code search using AST patterns

Skills:
  [x] ast-grep - Agent skill for structural code search with ast-grep
```

Only show items that are actually missing. Omit installed ones.

### Step 7: Install Selected Dependencies

For each selected dependency, in order:

1. **Show the install command** (from the diagnostic output) and ask for approval:

   ```
   Install agent-browser?
   Command: CI=true npm install -g agent-browser --no-audit --no-fund --loglevel=error && agent-browser install && npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y

   1. Run this command
   2. Skip - I'll install it manually
   ```

2. **If approved:** Run the install command using a shell execution tool. After the command completes, verify installation:
   - For a CLI tool, run the dependency's check command (e.g., `command -v agent-browser`).
   - For an agent skill, prefer `npx --yes skills list --global --json | jq -r '.[].name' | grep -qx <skill-name>` when `npx` is available; otherwise fall back to checking that `~/.claude/skills/<skill-name>` exists (file, directory, or symlink).

3. **If verification succeeds:** Report success.

4. **If verification fails or install errors:** Display the project URL as fallback and continue to the next dependency.

### Step 8: Summary

Display a brief summary:

```
 ✅ Compound Engineering setup complete

    Installed: agent-browser, gh, jq
    Skipped:   rtk

    Run /gh:setup anytime to re-check.
```

If this is a Claude Code session (per platform detection in Step 3), append: "Run /gh:update to grab the latest plugin version."


Agent skill detection checks CLI output first, then falls back to on-disk roots `~/.claude/skills/<skill-name>`, `~/.agents/skills/<skill-name>`, and `~/.codex/skills/<skill-name>` so Codex global skills are detected alongside Claude/Agents installs.
