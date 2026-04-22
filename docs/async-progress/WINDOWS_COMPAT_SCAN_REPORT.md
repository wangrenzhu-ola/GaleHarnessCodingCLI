# Windows Compatibility Scan Report

Generated: 2026-04-22T04:09:48.942Z

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Error | 100 |
| 🟡 Warn  | 155 |
| ℹ️ Info  | 3 |
| **Total** | **258** |

**Bash scripts found:** 15

- `plugins/galeharness-cli/agents/research/session-history-scripts/discover-sessions.sh`
- `plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh`
- `plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh`
- `plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh`
- `plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh`
- `plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh`
- `plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh`
- `plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh`
- `plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh`
- `plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh`
- `docs/specs/bugs/monitor-bugs.sh`
- `scripts/dev-sync-skills.sh`
- `scripts/setup.sh`
- `scripts/dev-unlink.sh`
- `scripts/dev-link.sh`

## Errors

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:213
- **Rule:** `command-v`
- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 PowerShell 中不兼`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:213
- **Rule:** `brew-install`
- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 PowerShell 中不兼`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:278
- **Rule:** `command-v`
- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、brew install、r`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:278
- **Rule:** `brew-install`
- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、brew install、r`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:152
- **Rule:** `command-v`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:152
- **Rule:** `brew-install`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:213
- **Rule:** `command-v`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:213
- **Rule:** `brew-install`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:215
- **Rule:** `command-v`
- **Line:** `- Get-Command 替代 command -v`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:216
- **Rule:** `brew-install`
- **Line:** `- winget install 替代 brew install`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:221
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Python 子进程**：避免 subprocess.run(["bash", ...])，改用 sys.executable 或跨平台工具。`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .qoder/repowiki/zh/content/Windows 兼容性.md:328
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Python 子进程调用 bash**：改为 sys.executable 或跨平台工具；避免 subprocess.run(["bash", ...]`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### plugins/galeharness-cli/agents/research/session-history-scripts/discover-sessions.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:37
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:48
- **Rule:** `command-v`
- **Line:** `if command -v timeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:53
- **Rule:** `command-v`
- **Line:** `if command -v gtimeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:58
- **Rule:** `command-v`
- **Line:** `if command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:67
- **Rule:** `python-subprocess-bash`
- **Line:** `proc = subprocess.Popen(["bash", "-c", command], start_new_session=True)`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### plugins/galeharness-cli/skills/agent-native-architecture/references/action-parity-discipline.md:284
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/test-xcode/SKILL.md:35
- **Rule:** `brew-install`
- **Line:** `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:22
- **Rule:** `command-v`
- **Line:** `if command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:36
- **Rule:** `command-v`
- **Line:** `if [ -z "$REVIEW_BASE_BRANCH" ] && command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:321
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:323
- **Rule:** `brew-install`
- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:431
- **Rule:** `brew-install`
- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:433
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:469
- **Rule:** `brew-install`
- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet/tap/vhs")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/SKILL.md:95
- **Rule:** `brew-install`
- **Line:** `This outputs JSON with boolean availability for each tool: `agent_browser`, `vhs`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:120
- **Rule:** `command-v`
- **Line:** `if command -v mise &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:139
- **Rule:** `command-v`
- **Line:** `if command -v direnv &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:42
- **Rule:** `command-v`
- **Line:** `if ! command -v jq >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-setup/SKILL.md:206
- **Rule:** `command-v`
- **Line:** `2. **If approved:** Run the install command using a shell execution tool. After `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/test-browser/SKILL.md:32
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTAL`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/test-browser/SKILL.md:44
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "NOT INSTALLED"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:59
- **Rule:** `command-v`
- **Line:** `!`command -v codex >/dev/null 2>&1 && echo "CODEX_AVAILABLE" || echo "CODEX_NOT_`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:62
- **Rule:** `brew-install`
- **Line:** `If it shows `CODEX_NOT_FOUND`, the Codex CLI is not installed. Emit "Codex CLI n`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:63
- **Rule:** `command-v`
- **Line:** `If it shows an unresolved command string, run `command -v codex` using a shell t`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/AGENTS.md:140
- **Rule:** `command-v`
- **Line:** `- [ ] **Pre-resolution exception:** `!` backtick pre-resolution commands run at `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### tests/pipeline-review-contract.test.ts:203
- **Rule:** `command-v`
- **Line:** `expect(content).toContain("command -v codex")`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### tests/windows-compat-scan.test.ts:25
- **Rule:** `command-v`
- **Line:** `expect(findRules(["if command -v node >/dev/null; then"], ".sh")).toEqual(["comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### tests/windows-compat-scan.test.ts:29
- **Rule:** `brew-install`
- **Line:** `expect(findRules(["brew install node"], ".sh")).toEqual(["brew-install"])`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### tests/windows-compat-scan.test.ts:85
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### tests/windows-compat-scan.test.ts:89
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### tests/windows-compat-scan.test.ts:93
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).toEqual(["pytho`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### tests/windows-compat-scan.test.ts:97
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'], ".py")).to`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### tests/windows-compat-scan.test.ts:101
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], ".py")).toEqu`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### tests/windows-compat-scan.test.ts:113
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], ".py")).toEqua`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### agents/review/windows-compat-reviewer.md:24
- **Rule:** `command-v`
- **Line:** `- **`command -v` in scripts or skill prose** — bash builtin; PowerShell uses `Ge`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### agents/review/windows-compat-reviewer.md:25
- **Rule:** `brew-install`
- **Line:** `- **`brew install` in documentation** — macOS-only; Windows needs `winget` or ma`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `command-v`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `brew-install`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:131
- **Rule:** `command-v`
- **Line:** `- `command -v` usage`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:132
- **Rule:** `brew-install`
- **Line:** `- `brew install` / `apt-get` / `yum``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:146
- **Rule:** `python-subprocess-bash`
- **Line:** `- Edge case: A Python file using `subprocess.run(["bash", "-c", ...])` is flagge`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### docs/specs/bugs/monitor-bugs.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:45
- **Rule:** `command-v`
- **Line:** `- **PowerShell syntax errors** — Attempting to run bash scripts in PowerShell pr`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:66
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:67
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:149
- **Rule:** `command-v`
- **Line:** `- Uses bash health-check script with `command -v` checks`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:161
- **Rule:** `command-v`
- **Line:** `2. **Bash Incompatibility Bypassed:** By detecting Windows via `$env:OS` early, `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integrations/windows-trae-setup-2026-04-17.md:49
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integrations/windows-trae-setup-2026-04-17.md:50
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md:98
- **Rule:** `command-v`
- **Line:** `| `command -v ffmpeg` in Bun tests | `command` is a shell builtin, not spawnable`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `command-v`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `brew-install`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:30
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:54
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:75
- **Rule:** `command-v`
- **Line:** `| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:76
- **Rule:** `brew-install`
- **Line:** `| `brew install -q` | `winget install` | ❌ 需重写 |`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:116
- **Rule:** `command-v`
- **Line:** `### `command -v`（14 处匹配）`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:121
- **Rule:** `brew-install`
- **Line:** `### `brew install`（4 处匹配）`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/dev-sync-skills.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/setup.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/setup.sh:52
- **Rule:** `command-v`
- **Line:** `if command -v git >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:56
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:57
- **Rule:** `brew-install`
- **Line:** `brew install git`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:61
- **Rule:** `brew-install`
- **Line:** `brew install git`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:70
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:90
- **Rule:** `command-v`
- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:98
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:99
- **Rule:** `brew-install`
- **Line:** `brew install python@3.12`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:112
- **Rule:** `brew-install`
- **Line:** `info "建议运行: brew install python@3.12"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:120
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:166
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:175
- **Rule:** `command-v`
- **Line:** `if command -v gale-knowledge &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:195
- **Rule:** `command-v`
- **Line:** `if command -v "$tool" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:198
- **Rule:** `brew-install`
- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:275
- **Rule:** `command-v`
- **Line:** `if command -v gale-harness >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/dev-unlink.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/windows-compat-scan.ts:59
- **Rule:** `command-v`
- **Line:** `suggestion: "`command -v` is a bash builtin. On PowerShell use `Get-Command`. In`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/dev-link.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

## Warnings

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:213
- **Rule:** `mkdir-p`
- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 PowerShell 中不兼`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:214
- **Rule:** `process-env-home`
- **Line:** `- 硬编码 Unix 路径分隔符、process.env.HOME 使用等跨平台问题`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/开发者指南/开发环境搭建.md:278
- **Rule:** `mkdir-p`
- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、brew install、r`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .qoder/repowiki/zh/content/开发者指南/测试指南.md:366
- **Rule:** `mkdir-p`
- **Line:** `Check --> |否| Create["mkdir -p home"]`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .qoder/repowiki/zh/content/插件转换系统/权限管理系统.md:187
- **Rule:** `process-env-home`
- **Line:** `- Windows 脚本与路径问题：通过扫描器识别硬编码斜杠、process.env.HOME 使用等不兼容模式`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/插件转换系统/权限管理系统.md:351
- **Rule:** `process-env-home`
- **Line:** `- 使用 Windows 兼容扫描器检查硬编码斜杠、process.env.HOME 等`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/插件转换系统/权限管理系统.md:373
- **Rule:** `rm-rf`
- **Line:** `- 拒绝：Bash(rm -rf *)`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .qoder/repowiki/zh/content/Windows 兼容性.md:152
- **Rule:** `process-env-home`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/Windows 兼容性.md:158
- **Rule:** `source-bash`
- **Line:** `- source 命令误报和真实引用（大量警告）`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .qoder/repowiki/zh/content/Windows 兼容性.md:159
- **Rule:** `process-env-home`
- **Line:** `- 硬编码斜杠和 process.env.HOME 使用（警告和信息级别）`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/Windows 兼容性.md:213
- **Rule:** `source-bash`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .qoder/repowiki/zh/content/Windows 兼容性.md:220
- **Rule:** `source-bash`
- **Line:** `- . .\file.ps1 替代 source ./file`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/CHANGELOG.md:833
- **Rule:** `source-bash`
- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (skill-based >`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/research/framework-docs-researcher.md:33
- **Rule:** `source-bash`
- **Line:** `- Explore gem source code to understand internal implementations`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/research/framework-docs-researcher.md:59
- **Rule:** `source-bash`
- **Line:** `- Read through key source files related to the feature`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/research/framework-docs-researcher.md:89
- **Rule:** `source-bash`
- **Line:** `7. **References**: Links to documentation, GitHub issues, and source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/research/best-practices-researcher.md:64
- **Rule:** `source-bash`
- **Line:** `- Identify and analyze well-regarded open source projects that demonstrate the p`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/research/issue-intelligence-analyst.md:100
- **Rule:** `source-bash`
- **Line:** `5. Distinguish issue sources when relevant: bot/agent-generated issues (e.g., `a`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/review/security-reviewer.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secrets in code or logs** -- hardcoded API keys, tokens, or passwords in sou`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/review/data-migration-expert.md:38
- **Rule:** `source-bash`
- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers every branch (no `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/review/cli-agent-readiness-reviewer.md:3
- **Rule:** `source-bash`
- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent readiness us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/review/cli-agent-readiness-reviewer.md:11
- **Rule:** `source-bash`
- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI agent readiness `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/review/cli-agent-readiness-reviewer.md:58
- **Rule:** `source-bash`
- **Line:** `Evaluate in priority order: check for **Blockers** first across all principles, `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-work/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/git-commit/SKILL.md:70
- **Rule:** `source-bash`
- **Line:** `3. **Default: conventional commits** -- If neither source provides a pattern, us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/git-commit/SKILL.md:74
- **Rule:** `source-bash`
- **Line:** `Before staging everything together, scan the changed files for naturally distinc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/proof/references/hitl-review.md:24
- **Rule:** `source-bash`
- **Line:** `- `localPath`: the source file path (same as input)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/proof/SKILL.md:287
- **Rule:** `source-bash`
- **Line:** `- Use `/state` content as source of truth before editing`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:27
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:29
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=("$@")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:43
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:78
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=(".")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:44
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$(dirname "$exclude_file")"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:114
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:152
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:157
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:158
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path/$shared_file"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:181
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:211
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/gh-optimize/SKILL.md:284
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p .context/galeharness-cli/gh-optimize/<spec-name>/`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-optimize/SKILL.md:583
- **Rule:** `source-bash`
- **Line:** `1. **Re-read the experiment log from disk** — do not trust in-memory state. The `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/agent-native-architecture/references/shared-workspace-architecture.md:56
- **Rule:** `source-bash`
- **Line:** `- Single source of truth`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/agent-native-architecture/references/self-modification.md:24
- **Rule:** `source-bash`
- **Line:** `- Read and understand source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/agent-native-architecture/references/files-universal-interface.md:173
- **Rule:** `source-bash`
- **Line:** `Even if you need a database for performance, consider maintaining a file-based "`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/agent-native-architecture/references/agent-execution-patterns.md:153
- **Rule:** `source-bash`
- **Line:** `✅ [1] Find source materials`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-update/SKILL.md:64
- **Rule:** `rm-rf`
- **Line:** `rm -rf "<plugin-root-path>/cache/compound-engineering-plugin/compound-engineerin`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/todo-triage/SKILL.md:4
- **Rule:** `source-bash`
- **Line:** `argument-hint: "[findings list or source type]"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/andrew-kane-gem-writer/references/testing-patterns.md:76
- **Rule:** `source-bash`
- **Line:** `source "https://rubygems.org"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/andrew-kane-gem-writer/references/testing-patterns.md:85
- **Rule:** `source-bash`
- **Line:** `source "https://rubygems.org"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/every-style-editor/references/EVERY_WRITE_STYLE.md:245
- **Rule:** `source-bash`
- **Line:** `Use hyphens in compound adjectives, with the exception of adverbs (words ending `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/every-style-editor/references/EVERY_WRITE_STYLE.md:529
- **Rule:** `source-bash`
- **Line:** `add on (verb), add-on (noun, adjective), back end (noun), back-end (adjective), `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:245
- **Rule:** `source-bash`
- **Line:** `Use hyphens in compound adjectives, with the exception of adverbs (words ending `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:529
- **Rule:** `source-bash`
- **Line:** `add on (verb), add-on (noun, adjective), back end (noun), back-end (adjective), `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-debug/SKILL.md:134
- **Rule:** `source-bash`
- **Line:** `Read the relevant source files. Follow the execution path from entry point to wh`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:248
- **Rule:** `source-bash`
- **Line:** `For each topic cluster (docs sharing a problem domain), identify which doc is th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:539
- **Rule:** `source-bash`
- **Line:** `2. The subagent writes the new learning using the support files as the source of`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:221
- **Rule:** `source-bash`
- **Line:** `This path works with any ref — a SHA, `origin/main`, a branch name. Automated ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:335
- **Rule:** `source-bash`
- **Line:** `Understand what the change is trying to accomplish. The source of intent depends`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:435
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:634
- **Rule:** `source-bash`
- **Line:** `source = args.source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-slack-research/SKILL.md:38
- **Rule:** `source-bash`
- **Line:** `- **Findings organized by topic** with source channels and dates`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:232
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/git-worktree/SKILL.md:105
- **Rule:** `source-bash`
- **Line:** `- direnv auto-allow is skipped on non-trusted bases because `.envrc` can source `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-compound/SKILL.md:268
- **Rule:** `mkdir-p`
- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/todo-create/SKILL.md:59
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p .context/galeharness-cli/todos/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:52
- **Rule:** `bash-array`
- **Line:** `MATCHES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:130
- **Rule:** `bash-array`
- **Line:** `SIGNATURE_PATTERNS=(`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### plugins/galeharness-cli/skills/gh-brainstorm/references/visual-communication.md:21
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for simple flows — 5-15 nodes, no in-box annotations, st`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md:205
- **Rule:** `source-bash`
- **Line:** `1. **Verify before claiming** — When the brainstorm touches checkable infrastruc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:307
- **Rule:** `rm-rf`
- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:104
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/references/visual-communication.md:23
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for dependency graphs and interaction diagrams -- 5-15 n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:41
- **Rule:** `source-bash`
- **Line:** `1. **Use requirements as the source of truth** - If `gh:brainstorm` produced a r`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:115
- **Rule:** `source-bash`
- **Line:** `If multiple source documents match, ask which one to use using the platform's bl`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:129
- **Rule:** `source-bash`
- **Line:** `4. Use the source document as the primary input to planning and research`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:131
- **Rule:** `source-bash`
- **Line:** `6. Do not silently omit source content — if the origin document discussed it, th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/dhh-rails-style/references/architecture.md:479
- **Rule:** `source-bash`
- **Line:** `Events are the single source of truth:`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/onboarding/SKILL.md:35
- **Rule:** `source-bash`
- **Line:** `- Directory structure (top-level + one level into source directories)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/onboarding/SKILL.md:344
- **Rule:** `source-bash`
- **Line:** `Skip this for projects with fewer than ~10 source files where the directory tree`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:11
- **Rule:** `source-bash`
- **Line:** `Why a separate skill: several callers need the same writing logic without the si`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `Key JSON fields: `headRefOid` (PR head SHA — prefer over indexing into `commits``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:244
- **Rule:** `source-bash`
- **Line:** `- **When commits conflict, trust the final diff**: The commit list is supporting`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/release-metadata.test.ts:15
- **Rule:** `rm-rf`
- **Line:** `await Bun.$`rm -rf ${root}`.quiet()`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### tests/docs/02-SECURITY-TEST-CASES.md:22
- **Rule:** `rm-rf`
- **Line:** `3. Test with malicious input: `"; rm -rf /; "``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### tests/windows-compat-scan.test.ts:33
- **Rule:** `rm-rf`
- **Line:** `expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### tests/windows-compat-scan.test.ts:41
- **Rule:** `mkdir-p`
- **Line:** `expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-p"])`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### tests/windows-compat-scan.test.ts:45
- **Rule:** `hardcoded-slash`
- **Line:** `expect(findRules(["path.join('src', '/components')"], ".ts")).toEqual(["hardcode`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### tests/windows-compat-scan.test.ts:53
- **Rule:** `process-env-home`
- **Line:** `expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual(["process-en`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### tests/windows-compat-scan.test.ts:68
- **Rule:** `source-bash`
- **Line:** `test("source-bash detects source command", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/windows-compat-scan.test.ts:69
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bash"])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/windows-compat-scan.test.ts:72
- **Rule:** `source-bash`
- **Line:** `test("source-bash ignores source in comments", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/windows-compat-scan.test.ts:73
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["// source of truth"], ".ts")).toEqual([])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### agents/review/windows-compat-reviewer.md:18
- **Rule:** `hardcoded-slash`
- **Line:** `- **Hardcoded `/` in path construction** — `path.join("a", "/", "b")` defeats cr`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### agents/review/windows-compat-reviewer.md:19
- **Rule:** `process-env-home`
- **Line:** `- **`process.env.HOME` in new code** — undefined on Windows; use `os.homedir()` `
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### agents/review/windows-compat-reviewer.md:46
- **Rule:** `source-bash`
- **Line:** `- **`source` as a prose word** — "single source of truth" is not a bash command`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:128
- **Rule:** `source-bash`
- **Line:** `- Parse source files with lightweight line-by-line scanning (no heavy NLP).`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:183
- **Rule:** `source-bash`
- **Line:** `- Happy path: `path.win32.join('C:\\Users', 'hermes', 'config.yaml')` produces ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-20-001-feat-global-knowledge-repo-plan.md:53
- **Rule:** `source-bash`
- **Line:** `| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source of truth，索引是`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/brainstorms/2026-04-20-global-knowledge-repo-requirements.md:73
- **Rule:** `source-bash`
- **Line:** `- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/specs/kiro.md:168
- **Rule:** `source-bash`
- **Line:** `| Copied skills (pass-through) | Overwrite | Plugin is source of truth |`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/specs/bugs/BUG-014-shell-injection-protection.md:23
- **Rule:** `rm-rf`
- **Line:** `### 验证 14.1: 分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/PR31-TEST-REPORT.md:77
- **Rule:** `rm-rf`
- **Line:** `| TC-D-004 | D | `title="; rm -rf /;"` | spawnSync 数组参数 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:14
- **Rule:** `rm-rf`
- **Line:** `1. 执行 `rm -rf ~/.galeharness/knowledge`（确保干净环境，或使用 `export GALE_KNOWLEDGE_HOME=/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:92
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p /tmp/bad-repo/.git && chmod 000 /tmp/bad-repo/.git/config``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:545
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p ~/.galeharness/knowledge/node_modules/foo && echo "# bad" > ~/.gale`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:841
- **Rule:** `mkdir-p`
- **Line:** `3. `mkdir -p /tmp/gk-integration/my-project/plans``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### docs/specs/pr31-manual-testcases-team-d.md:76
- **Rule:** `rm-rf`
- **Line:** `### TC-D-004. [Shell 注入] — title 包含分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/pr31-manual-testcases-team-d.md:82
- **Rule:** `rm-rf`
- **Line:** `2. 调用 `commitKnowledgeChanges({ project: "test", type: "brainstorm", title: "; r`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/pr31-manual-testcases-team-d.md:87
- **Rule:** `rm-rf`
- **Line:** `- 最终 commit message 为 `docs(test/brainstorm): ; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/pr31-manual-testcases-team-d.md:564
- **Rule:** `rm-rf`
- **Line:** `| Shell 注入 | `title="; rm -rf /;"` | TC-D-004 | ✅ 已覆盖 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/specs/pr31-manual-testcases-team-e.md:472
- **Rule:** `source-bash`
- **Line:** `4. `source ~/.zshrc`（或对应 shell profile）`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md:53
- **Rule:** `source-bash`
- **Line:** `### 1. Use `git status` as the source of truth for working-tree cleanliness`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/claude-permissions-optimizer-classification-fix.md:294
- **Rule:** `rm-rf`
- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/*`)`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:89
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:97
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/script-first-skill-architecture.md:44
- **Rule:** `source-bash`
- **Line:** `3. **Single source of truth for rules.** Classification logic lives exclusively `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/script-first-skill-architecture.md:77
- **Rule:** `source-bash`
- **Line:** `- **Dual rule definitions.** Classification rules in both the script AND the SKI`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:48
- **Rule:** `source-bash`
- **Line:** `- **Assuming Codex skills support model overrides in frontmatter**: they don't —`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:147
- **Rule:** `source-bash`
- **Line:** `2. **Single source of truth:** The `CLAUDE_FAMILY_ALIASES` map in `src/utils/mod`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:53
- **Rule:** `source-bash`
- **Line:** `3. The source directories already use hyphens (`skills/ce-brainstorm/`), so the `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:95
- **Rule:** `source-bash`
- **Line:** `The core issue was a mismatch between the logical name domain (colons as namespa`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/workflow/todo-status-lifecycle.md:49
- **Rule:** `source-bash`
- **Line:** `No automated source creates `pending` todos. The `pending` status is exclusively`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/workflow/manual-release-please-github-releases.md:153
- **Rule:** `source-bash`
- **Line:** `- Root `CHANGELOG.md` is only a pointer to GitHub Releases and is not the canoni`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/agent-friendly-cli-principles.md:445
- **Rule:** `source-bash`
- **Line:** `- [Writing effective tools for agents — Anthropic Engineering](https://www.anthr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/agent-friendly-cli-principles.md:446
- **Rule:** `source-bash`
- **Line:** `- [Command Line Interface Guidelines](https://clig.dev/) — Primary source for CL`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/agent-friendly-cli-principles.md:452
- **Rule:** `source-bash`
- **Line:** `- [How to Write a Good Spec for AI Agents — Addy Osmani](https://addyosmani.com/`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:114
- **Rule:** `source-bash`
- **Line:** `- Strengths: renders as SVG in GitHub; source text readable as fallback in email`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:116
- **Rule:** `source-bash`
- **Line:** `- Use `TB` (top-to-bottom) direction for narrow rendering in both SVG and source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:151
- **Rule:** `source-bash`
- **Line:** `- Side-by-side diff views (source text appears as code block)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:152
- **Rule:** `source-bash`
- **Line:** `- Email/Slack notifications (source text is all that renders)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/developer-experience/local-dev-shell-aliases-zsh-and-bunx-fixes-2026-03-26.md:96
- **Rule:** `source-bash`
- **Line:** `3. **Grouped by intent, not mechanism**: "Local Development" is what the user ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/adding-converter-target-providers.md:404
- **Rule:** `source-bash`
- **Line:** `const source = path.join(personalSkillsDir, skill)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:32
- **Rule:** `mkdir-p`
- **Line:** `| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Directory -Force` |`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### docs/WINDOWS_COMPATIBILITY_REPORT.md:133
- **Rule:** `source-bash`
- **Line:** `扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `source` 命令。`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/dev-sync-skills.sh:2
- **Rule:** `source-bash`
- **Line:** `# Sync skills and agents from local source tree to installed environments.`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/dev-sync-skills.sh:17
- **Rule:** `bash-array`
- **Line:** `TARGETS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/dev-sync-skills.sh:36
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dest"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/dev-sync-skills.sh:42
- **Rule:** `source-bash`
- **Line:** `# Remove agents that exist in our source but were previously installed,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/dev-sync-skills.sh:45
- **Rule:** `source-bash`
- **Line:** `# Build list of agent filenames from source to know what we own`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/dev-sync-skills.sh:46
- **Rule:** `bash-array`
- **Line:** `owned_agents=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/setup.sh:152
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:153
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:154
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:155
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:156
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:193
- **Rule:** `bash-array`
- **Line:** `optional_tools=("gh" "jq" "ffmpeg")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/setup.sh:278
- **Rule:** `source-bash`
- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/setup.sh:294
- **Rule:** `source-bash`
- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/setup.sh:338
- **Rule:** `source-bash`
- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/windows-compat-scan.ts:89
- **Rule:** `process-env-home`
- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.homedir()` or a`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### scripts/dev-link.sh:2
- **Rule:** `source-bash`
- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local source tree fo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### AGENTS.md:95
- **Rule:** `source-bash`
- **Line:** `- Do not hand-add release entries to `CHANGELOG.md` or treat it as the canonical`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### AGENTS.md:167
- **Rule:** `source-bash`
- **Line:** `- **Unpredictable install paths:** Plugins installed from the marketplace are ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### src/commands/install.ts:309
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### src/commands/plugin-path.ts:37
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

## Info

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:347
- **Rule:** `colon-in-path`
- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:442
- **Rule:** `colon-in-path`
- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### tests/windows-compat-scan.test.ts:57
- **Rule:** `colon-in-path`
- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).toEqual(["col`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

---
*Run this scan anytime with: `bun run scripts/windows-compat-scan.ts`*