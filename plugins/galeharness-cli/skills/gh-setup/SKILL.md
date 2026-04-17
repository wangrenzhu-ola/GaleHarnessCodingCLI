---
name: gh-setup
description: "Diagnose and configure GaleHarnessCLI environment. Checks CLI dependencies, HKTMemory integration, plugin version, and repo-local config. Offers guided installation for missing tools. Use when troubleshooting missing tools, verifying setup, or before onboarding."
disable-model-invocation: true
---

# GaleHarnessCLI Setup

## Interaction Method

Ask the user each question below using the platform's blocking question tool (e.g., `AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini). If no structured question tool is available, present each question as a numbered list and wait for a reply before proceeding. For multiSelect questions, accept comma-separated numbers (e.g. `1, 3`). Never skip or auto-configure.

Interactive setup for GaleHarnessCLI — diagnoses environment health, installs HKTMemory vector knowledge base, configures memory API credentials, cleans obsolete repo-local config, and helps configure required tools. Review agent selection is handled automatically by `gh:review`; project-specific review guidance belongs in `CLAUDE.md` or `AGENTS.md`.

## Phase 1: Diagnose

### Step 1: Determine Plugin Version

Detect the installed GaleHarnessCLI plugin version by reading the plugin metadata or manifest. This is platform-specific -- use whatever mechanism is available (e.g., reading `plugin.json` from the plugin root or cache directory). If the version cannot be determined, skip this step.

If a version is found, pass it to the check script via `--version`. Otherwise omit the flag.

### Step 2: Run the Health Check Script

Before running the script, display: "GaleHarnessCLI -- checking your environment..."

Run the bundled check script. Do not perform manual dependency checks -- the script handles all CLI tools, repo-local config checks, HKTMemory status, and `.gitignore` guidance in one pass.

```bash
bash scripts/check-health --version VERSION
```

Or without version if Step 1 could not determine it:

```bash
bash scripts/check-health
```

Script reference: `scripts/check-health`

Display the script's output to the user.

### Step 2.5: HKTMemory Installation Check

Check if HKTMemory is installed by verifying the vendor directory exists:

```bash
[ -d "vendor/hkt-memory" ] && [ -f "vendor/hkt-memory/scripts/hkt_memory_v5.py" ]
```

If HKTMemory is not installed, display:

```
🔧 HKTMemory (vector knowledge base) is required for GaleHarnessCLI.
   This enables automatic memory storage and retrieval during compound workflows.
```

Run the HKTMemory installation:

```bash
bash vendor/hkt-memory/install.sh
```

If the install script doesn't exist, clone HKTMemory first:

```bash
mkdir -p vendor && git clone https://github.com/your-org/hkt-memory.git vendor/hkt-memory
bash vendor/hkt-memory/install.sh
```

### Step 2.6: HKTMemory Configuration

Check if HKTMemory environment variables are configured:

```bash
[ -n "$HKT_MEMORY_API_KEY" ] && [ -n "$HKT_MEMORY_BASE_URL" ]
```

If not configured, prompt the user interactively:

```
🔐 HKTMemory API Configuration

HKTMemory stores your solutions to a vector database for future retrieval.
Without this, GaleHarnessCLI will fall back to file-based storage only.

1. Use HKTMemory with vector search (Recommended)
2. Use file-based storage only (no vector search)
```

**If user selects option 1 (vector storage):**

Ask for HKT_MEMORY_API_KEY:
```
Enter your HKTMemory API Key (e.g., from Zhipu/OpenAI):
[Leave empty to skip and configure later]
```

Ask for HKT_MEMORY_BASE_URL:
```
Enter the API base URL:
1. Zhipu AI (https://open.bigmodel.cn/api/paas/v4/) - Recommended
2. OpenAI (https://api.openai.com/v1)
3. Custom URL
```

Ask for HKT_MEMORY_MODEL:
```
Enter the embedding model:
1. embedding-3 (Zhipu, Recommended)
2. text-embedding-3-small (OpenAI)
3. Custom model name
```

After collecting inputs, display the configuration:

```
📋 HKTMemory Configuration:
   API Key: ****${last4} [or "Not set"]
   Base URL: ${url}
   Model: ${model}

Save these to your shell profile (~/.zshrc or ~/.bash_profile)?
1. Yes, add export statements
2. No, I'll configure manually
```

If user approves, append to shell profile:
```bash
export HKT_MEMORY_API_KEY="${api_key}"
export HKT_MEMORY_BASE_URL="${base_url}"
export HKT_MEMORY_MODEL="${model}"
```

**If user selects option 2 (file-based only):**

Display:
```
⚠️  File-based storage selected.
   Solutions will be saved to docs/solutions/ but won't be searchable via vector similarity.
   Run /gh-setup again anytime to enable HKTMemory.
```

### Step 3: Evaluate Results

**Platform detection (pre-resolved):** !`[ -n "${CLAUDE_PLUGIN_ROOT}" ] && echo "CLAUDE_CODE" || echo "OTHER"`

If the line above resolved to `CLAUDE_CODE`, this is a Claude Code session and `/gh-update` is available. Otherwise, omit any `/gh-update` references from output.

After the diagnostic report, check whether:

- any dependencies are missing (reported as yellow in the script output)
- `galeharness-cli.local.md` is present and needs cleanup
- `.galeharness-cli/config.local.yaml` does not exist or is not safely gitignored
- `.galeharness-cli/config.local.example.yaml` is missing or outdated

If everything is installed, no repo-local cleanup is needed, and `.galeharness-cli/config.local.yaml` already exists and is gitignored, display the tool list and completion message. Parse the tool names from the script output and list each with a green circle:

```
 ✅ GaleHarnessCLI setup complete

    Tools: 🟢 agent-browser  🟢 gh  🟢 jq  🟢 vhs  🟢 silicon  🟢 ffmpeg
    HKTMemory: 🟢 [or ⚪️ if using file-only mode]
    Config: ✅

    Run /gh-setup anytime to re-check.
```

If this is a Claude Code session, append to the message: "Run /gh-update to grab the latest plugin version."

Stop here.

Otherwise proceed to Phase 2 to resolve any issues. Handle repo-local cleanup (Step 4) first, then config bootstrapping (Step 5), then missing dependencies (Step 6).

## Phase 2: Fix

### Step 4: Resolve Repo-Local Config Issues

Resolve the repository root (`git rev-parse --show-toplevel`). If `galeharness-cli.local.md` exists at the repo root, explain that it is obsolete because review-agent selection is automatic and GaleHarnessCLI now uses `.galeharness-cli/config.local.yaml` for any surviving machine-local state. Ask whether to delete it now. Use the repo-root path when deleting.

### Step 5: Bootstrap Project Config

Resolve the repository root (`git rev-parse --show-toplevel`). All paths below are relative to the repo root, not the current working directory.

**Example file (always refresh):** Copy `references/config-template.yaml` to `<repo-root>/.galeharness-cli/config.local.example.yaml`, creating the directory if needed. This file is committed to the repo and always overwritten with the latest template so teammates can see available settings.

**Local config (create once):** If `.galeharness-cli/config.local.yaml` does not exist, ask whether to create it:

```
Set up a local config file for this project?
This saves your GaleHarnessCLI preferences (like which tools to use and how workflows behave).
Everything starts commented out -- you only enable what you need.

1. Yes, create it (Recommended)
2. No thanks
```

If the user approves, copy `references/config-template.yaml` to `<repo-root>/.galeharness-cli/config.local.yaml`. If `.galeharness-cli/config.local.yaml` is not already covered by `.gitignore`, offer to add the entry:

```text
.galeharness-cli/*.local.yaml
```

If the local config already exists, check whether it is safely gitignored. If not, offer to add the `.gitignore` entry as above.

### Step 6: Offer Installation

Present the missing dependencies using a multiSelect question with all items pre-selected. Use the install commands and URLs from the script's diagnostic output.

```
The following tools are missing. Select which to install:
(All items are pre-selected)

Recommended:
  [x] agent-browser - Browser automation for testing and screenshots
  [x] gh - GitHub CLI for issues and PRs
  [x] jq - JSON processor
  [x] vhs (charmbracelet/vhs) - Create GIFs from CLI output
  [x] silicon (Aloxaf/silicon) - Generate code screenshots
  [x] ffmpeg - Video processing for feature demos
```

Only show dependencies that are actually missing. Omit installed ones.

### Step 7: Install Selected Dependencies

For each selected dependency, in order:

1. **Show the install command** (from the diagnostic output) and ask for approval:

   ```
   Install agent-browser?
   Command: CI=true npm install -g agent-browser --no-audit --no-fund --loglevel=error && agent-browser install && npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y

   1. Run this command
   2. Skip - I'll install it manually
   ```

2. **If approved:** Run the install command using a shell execution tool. After the command completes, verify installation by running the dependency's check command (e.g., `command -v agent-browser`).

3. **If verification succeeds:** Report success.

4. **If verification fails or install errors:** Display the project URL as fallback and continue to the next dependency.

### Step 8: Summary

Display a brief summary:

```
 ✅ GaleHarnessCLI setup complete

    Installed: agent-browser, gh, jq
    Skipped:   rtk

    Run /gh-setup anytime to re-check.
```

If this is a Claude Code session (per platform detection in Step 3), append: "Run /gh-update to grab the latest plugin version."
