# Windows Compatibility Scan Report

Generated: 2026-04-24T08:12:57.421Z

## Summary

| Severity | Count |
|----------|-------|
| [ERR] Error | 615 |
| [WARN] Warn  | 783 |
| [INFO] Info  | 15 |
| **Total** | **1413** |

**Bash scripts found:** 56

- `plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh`
- `plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh`
- `plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh`
- `plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh`
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
- `scripts/install-release.sh`
- `scripts/upstream-sync/generate-batch.sh`
- `scripts/upstream-sync/apply-patch-to-worktree.sh`
- `scripts/dev-link.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh`
- `.worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh`
- `.worktrees/plan/platform-capability-manifest/docs/specs/bugs/monitor-bugs.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/setup.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/dev-unlink.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/upstream-sync/generate-batch.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/upstream-sync/apply-patch-to-worktree.sh`
- `.worktrees/plan/platform-capability-manifest/scripts/dev-link.sh`
- `.worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh`
- `.worktrees/plan/platform-capability-manifest/vendor/hkt-memory/deploy.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/docs/specs/bugs/monitor-bugs.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/dev-unlink.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/generate-batch.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/apply-patch-to-worktree.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/scripts/dev-link.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh`
- `.worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/deploy.sh`

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

### .qoder/repowiki/zh/content/Windows 兼容性.md:216
- **Rule:** `command-v`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:216
- **Rule:** `brew-install`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:278
- **Rule:** `command-v`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:278
- **Rule:** `brew-install`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:280
- **Rule:** `command-v`
- **Line:** `- Get-Command 替代 command -v`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .qoder/repowiki/zh/content/Windows 兼容性.md:281
- **Rule:** `brew-install`
- **Line:** `- winget install 替代 brew install`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .qoder/repowiki/zh/content/Windows 兼容性.md:286
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Python 子进程**：避免 subprocess.run(["bash", ...])，改用 sys.executable 或跨平台工具。`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .qoder/repowiki/zh/content/Windows 兼容性.md:553
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Python 子进程调用 bash**：改为 sys.executable 或跨平台工具；避免 subprocess.run(["bash", ...]`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .qoder/repowiki/zh/content/支持的平台/支持的平台.md:413
- **Rule:** `brew-install`
- **Line:** `E --> |"是"| F["PKG_MANAGER='brew'<br/>INSTALL_CMD='brew install'"]`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/agents/framework-docs-researcher.md:16
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/agents/best-practices-researcher.md:64
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

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

### plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

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

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:324
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:326
- **Rule:** `brew-install`
- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:434
- **Rule:** `brew-install`
- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:436
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:472
- **Rule:** `brew-install`
- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet/tap/vhs")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/gh-demo-reel/SKILL.md:107
- **Rule:** `brew-install`
- **Line:** `This outputs JSON with boolean availability for each tool: `agent_browser`, `vhs`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:126
- **Rule:** `command-v`
- **Line:** `if command -v mise &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:139
- **Rule:** `command-v`
- **Line:** `if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]]; then`
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

### plugins/galeharness-cli/skills/gh-setup/SKILL.md:215
- **Rule:** `command-v`
- **Line:** `- For a CLI tool, run the dependency's check command (e.g., `command -v agent-br`
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
- **Line:** `If it shows `CODEX_NOT_FOUND` or anything else, the Codex CLI is not installed o`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### plugins/galeharness-cli/AGENTS.md:146
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

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:52
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:53
- **Rule:** `command-v`
- **Line:** `echo "✅ hkt-memory is available: $(command -v hkt-memory)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:73
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:74
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:188
- **Rule:** `command-v`
- **Line:** `| install.sh 只创建 symlink 不验证 | 添加 `command -v hkt-memory` 自检 |`
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

### scripts/setup.sh:37
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:39
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:43
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:45
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:46
- **Rule:** `command-v`
- **Line:** `elif command -v apt-get >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:49
- **Rule:** `command-v`
- **Line:** `elif command -v dnf >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:52
- **Rule:** `command-v`
- **Line:** `elif command -v yum >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:55
- **Rule:** `command-v`
- **Line:** `elif command -v pacman >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:79
- **Rule:** `command-v`
- **Line:** `if command -v git >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:96
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:116
- **Rule:** `command-v`
- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:125
- **Rule:** `brew-install`
- **Line:** `brew install python@3.12`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:155
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:203
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:204
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:215
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:224
- **Rule:** `command-v`
- **Line:** `if command -v gale-knowledge &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:244
- **Rule:** `command-v`
- **Line:** `if command -v "$tool" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/setup.sh:248
- **Rule:** `brew-install`
- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### scripts/setup.sh:334
- **Rule:** `command-v`
- **Line:** `if command -v gale-harness >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/dev-unlink.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/install-release.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/install-release.sh:19
- **Rule:** `command-v`
- **Line:** `if ! command -v "$1" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/install-release.sh:69
- **Rule:** `command-v`
- **Line:** `if command -v gale-harness >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/install-release.sh:70
- **Rule:** `command-v`
- **Line:** `dirname "$(command -v gale-harness)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/upstream-sync/generate-batch.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### scripts/upstream-sync/generate-batch.sh:7
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### scripts/upstream-sync/apply-patch-to-worktree.sh:1
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

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/framework-docs-researcher.md:16
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/best-practices-researcher.md:64
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:37
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:48
- **Rule:** `command-v`
- **Line:** `if command -v timeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:53
- **Rule:** `command-v`
- **Line:** `if command -v gtimeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:58
- **Rule:** `command-v`
- **Line:** `if command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:67
- **Rule:** `python-subprocess-bash`
- **Line:** `proc = subprocess.Popen(["bash", "-c", command], start_new_session=True)`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/agent-native-architecture/references/action-parity-discipline.md:284
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/test-xcode/SKILL.md:35
- **Rule:** `brew-install`
- **Line:** `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:22
- **Rule:** `command-v`
- **Line:** `if command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:36
- **Rule:** `command-v`
- **Line:** `if [ -z "$REVIEW_BASE_BRANCH" ] && command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:324
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:326
- **Rule:** `brew-install`
- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:434
- **Rule:** `brew-install`
- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:436
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:472
- **Rule:** `brew-install`
- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet/tap/vhs")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/SKILL.md:107
- **Rule:** `brew-install`
- **Line:** `This outputs JSON with boolean availability for each tool: `agent_browser`, `vhs`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:126
- **Rule:** `command-v`
- **Line:** `if command -v mise &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:139
- **Rule:** `command-v`
- **Line:** `if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]]; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:42
- **Rule:** `command-v`
- **Line:** `if ! command -v jq >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-setup/SKILL.md:215
- **Rule:** `command-v`
- **Line:** `- For a CLI tool, run the dependency's check command (e.g., `command -v agent-br`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/test-browser/SKILL.md:32
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTAL`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/test-browser/SKILL.md:44
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "NOT INSTALLED"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:59
- **Rule:** `command-v`
- **Line:** `!`command -v codex >/dev/null 2>&1 && echo "CODEX_AVAILABLE" || echo "CODEX_NOT_`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:62
- **Rule:** `brew-install`
- **Line:** `If it shows `CODEX_NOT_FOUND` or anything else, the Codex CLI is not installed o`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/AGENTS.md:146
- **Rule:** `command-v`
- **Line:** `- [ ] **Pre-resolution exception:** `!` backtick pre-resolution commands run at `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/tests/pipeline-review-contract.test.ts:203
- **Rule:** `command-v`
- **Line:** `expect(content).toContain("command -v codex")`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:25
- **Rule:** `command-v`
- **Line:** `expect(findRules(["if command -v node >/dev/null; then"], ".sh")).toEqual(["comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:29
- **Rule:** `brew-install`
- **Line:** `expect(findRules(["brew install node"], ".sh")).toEqual(["brew-install"])`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:85
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:89
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:93
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).toEqual(["pytho`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:97
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'], ".py")).to`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:101
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], ".py")).toEqu`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:113
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], ".py")).toEqua`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/agents/review/windows-compat-reviewer.md:24
- **Rule:** `command-v`
- **Line:** `- **`command -v` in scripts or skill prose** — bash builtin; PowerShell uses `Ge`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/agents/review/windows-compat-reviewer.md:25
- **Rule:** `brew-install`
- **Line:** `- **`brew install` in documentation** — macOS-only; Windows needs `winget` or ma`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:39
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:48
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:48
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:49
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:53
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:53
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:58
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:58
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:59
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:63
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:63
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:68
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:68
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:69
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:73
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:73
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:78
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Get-Command 替代 command -v``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:79
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:83
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- winget install 替代 brew install``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:88
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- **Python 子进程**：避免 subprocess.run(["bash", ...])，改用 sys.executable`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:93
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- **Python 子进程调用 bash**：改为 sys.executable 或跨平台工具；避免 subprocess.run(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:103
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:104
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:118
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v timeout >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:119
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:123
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gtimeout >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:124
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:128
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:129
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:133
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `proc = subprocess.Popen(["bash", "-c", command], start_new_session=`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:143
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:158
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gh >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:159
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:163
- **Rule:** `command-v`
- **Line:** `- **Line:** `if [ -z "$REVIEW_BASE_BRANCH" ] && command -v gh >/dev/null 2>&1; t`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:164
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:168
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:173
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:178
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:183
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:188
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:203
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v mise &>/dev/null; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:204
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:208
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:209
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:233
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v jq >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:234
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:239
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:243
- **Rule:** `command-v`
- **Line:** `- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Installed" || ech`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:244
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:248
- **Rule:** `command-v`
- **Line:** `- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "N`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:249
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:253
- **Rule:** `command-v`
- **Line:** `- **Line:** `!`command -v codex >/dev/null 2>&1 && echo "CODEX_AVAILABLE" || ech`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:254
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:264
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:268
- **Rule:** `command-v`
- **Line:** `- **Line:** `expect(content).toContain("command -v codex")``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:269
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:273
- **Rule:** `command-v`
- **Line:** `- **Line:** `expect(findRules(["if command -v node >/dev/null; then"], ".sh")).t`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:274
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:278
- **Rule:** `brew-install`
- **Line:** `- **Line:** `expect(findRules(["brew install node"], ".sh")).toEqual(["brew-inst`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:283
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".p`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:288
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".p`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:293
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).to`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:298
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:303
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], `
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:308
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], "`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:313
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **`command -v` in scripts or skill prose** — bash builtin; PowerS`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:314
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:318
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **`brew install` in documentation** — macOS-only; Windows needs ``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:324
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:333
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` usage``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:334
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:338
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` / `apt-get` / `yum```
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:343
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- Edge case: A Python file using `subprocess.run(["bash", "-c", ...`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:354
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:358
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` (no PowerShell equivalent)``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:359
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:363
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` (macOS/Linux package manager)``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:368
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Uses bash health-check script with `command -v` checks``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:369
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:374
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:378
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` (no PowerShell equivalent)``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:379
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:383
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` (macOS/Linux package manager)``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:388
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v ffmpeg` in Bun tests | `command` is a shell builtin, `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:389
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:393
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:394
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:398
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:403
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:404
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:408
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:409
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:413
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:414
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:418
- **Rule:** `brew-install`
- **Line:** `- **Line:** `| `brew install -q` | `winget install` | ❌ 需重写 |``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:423
- **Rule:** `command-v`
- **Line:** `- **Line:** `### `command -v`（14 处匹配）``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:424
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:428
- **Rule:** `brew-install`
- **Line:** `- **Line:** `### `brew install`（4 处匹配）``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:443
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v git >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:444
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:448
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v brew >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:449
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:453
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install git``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:458
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install git``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:463
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v bun >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:464
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:468
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:469
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:473
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v brew >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:474
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:478
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install python@3.12``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:483
- **Rule:** `brew-install`
- **Line:** `- **Line:** `info "建议运行: brew install python@3.12"``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:488
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v uv >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:489
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:493
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v bun >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:494
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:498
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gale-knowledge &>/dev/null; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:499
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:503
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v "$tool" >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:504
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:508
- **Rule:** `brew-install`
- **Line:** `- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:513
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gale-harness >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:514
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:528
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:529
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:538
- **Rule:** `command-v`
- **Line:** `- **Line:** `suggestion: "`command -v` is a bash builtin. On PowerShell use `Get`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:539
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:560
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:560
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:585
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:585
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:600
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:600
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `command-v`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `brew-install`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:131
- **Rule:** `command-v`
- **Line:** `- `command -v` usage`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:132
- **Rule:** `brew-install`
- **Line:** `- `brew install` / `apt-get` / `yum``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:146
- **Rule:** `python-subprocess-bash`
- **Line:** `- Edge case: A Python file using `subprocess.run(["bash", "-c", ...])` is flagge`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/plan/platform-capability-manifest/docs/specs/bugs/monitor-bugs.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:45
- **Rule:** `command-v`
- **Line:** `- **PowerShell syntax errors** — Attempting to run bash scripts in PowerShell pr`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:66
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:67
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:149
- **Rule:** `command-v`
- **Line:** `- Uses bash health-check script with `command -v` checks`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:161
- **Rule:** `command-v`
- **Line:** `2. **Bash Incompatibility Bypassed:** By detecting Windows via `$env:OS` early, `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:52
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:53
- **Rule:** `command-v`
- **Line:** `echo "✅ hkt-memory is available: $(command -v hkt-memory)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:73
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:74
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:188
- **Rule:** `command-v`
- **Line:** `| install.sh 只创建 symlink 不验证 | 添加 `command -v hkt-memory` 自检 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/windows-trae-setup-2026-04-17.md:49
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/windows-trae-setup-2026-04-17.md:50
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md:98
- **Rule:** `command-v`
- **Line:** `| `command -v ffmpeg` in Bun tests | `command` is a shell builtin, not spawnable`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `command-v`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `brew-install`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:30
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:54
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:75
- **Rule:** `command-v`
- **Line:** `| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:76
- **Rule:** `brew-install`
- **Line:** `| `brew install -q` | `winget install` | ❌ 需重写 |`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:116
- **Rule:** `command-v`
- **Line:** `### `command -v`（14 处匹配）`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:121
- **Rule:** `brew-install`
- **Line:** `### `brew install`（4 处匹配）`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:37
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:39
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:43
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:45
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:46
- **Rule:** `command-v`
- **Line:** `elif command -v apt-get >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:49
- **Rule:** `command-v`
- **Line:** `elif command -v dnf >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:52
- **Rule:** `command-v`
- **Line:** `elif command -v yum >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:55
- **Rule:** `command-v`
- **Line:** `elif command -v pacman >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:79
- **Rule:** `command-v`
- **Line:** `if command -v git >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:96
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:116
- **Rule:** `command-v`
- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:125
- **Rule:** `brew-install`
- **Line:** `brew install python@3.12`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:155
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:203
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:204
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:215
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:224
- **Rule:** `command-v`
- **Line:** `if command -v gale-knowledge &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:244
- **Rule:** `command-v`
- **Line:** `if command -v "$tool" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:248
- **Rule:** `brew-install`
- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:334
- **Rule:** `command-v`
- **Line:** `if command -v gale-harness >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/dev-unlink.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/scripts/upstream-sync/generate-batch.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/scripts/upstream-sync/generate-batch.sh:7
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/upstream-sync/apply-patch-to-worktree.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/scripts/windows-compat-scan.ts:59
- **Rule:** `command-v`
- **Line:** `suggestion: "`command -v` is a bash builtin. On PowerShell use `Get-Command`. In`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/scripts/dev-link.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:18
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:78
- **Rule:** `command-v`
- **Line:** `if ! command -v hkt-memory >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:86
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:87
- **Rule:** `command-v`
- **Line:** `echo "✅ hkt-memory is available: $(command -v hkt-memory)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/deploy.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/deploy.sh:44
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/framework-docs-researcher.md:16
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/best-practices-researcher.md:64
- **Rule:** `command-v`
- **Line:** `- **`ctx7` CLI** via shell (`ctx7 library <name> [query]`, `ctx7 docs <libraryId`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:37
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:48
- **Rule:** `command-v`
- **Line:** `if command -v timeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:53
- **Rule:** `command-v`
- **Line:** `if command -v gtimeout >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:58
- **Rule:** `command-v`
- **Line:** `if command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh:67
- **Rule:** `python-subprocess-bash`
- **Line:** `proc = subprocess.Popen(["bash", "-c", command], start_new_session=True)`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/agent-native-architecture/references/action-parity-discipline.md:284
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/test-xcode/SKILL.md:35
- **Rule:** `brew-install`
- **Line:** `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-session-inventory/scripts/discover-sessions.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:22
- **Rule:** `command-v`
- **Line:** `if command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh:36
- **Rule:** `command-v`
- **Line:** `if [ -z "$REVIEW_BASE_BRANCH" ] && command -v gh >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:324
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:326
- **Rule:** `brew-install`
- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:434
- **Rule:** `brew-install`
- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:436
- **Rule:** `brew-install`
- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:472
- **Rule:** `brew-install`
- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet/tap/vhs")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/SKILL.md:107
- **Rule:** `brew-install`
- **Line:** `This outputs JSON with boolean availability for each tool: `agent_browser`, `vhs`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:126
- **Rule:** `command-v`
- **Line:** `if command -v mise &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:139
- **Rule:** `command-v`
- **Line:** `if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]]; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-port.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/resolve-package-manager.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/read-launch-json.sh:42
- **Rule:** `command-v`
- **Line:** `if ! command -v jq >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-setup/SKILL.md:215
- **Rule:** `command-v`
- **Line:** `- For a CLI tool, run the dependency's check command (e.g., `command -v agent-br`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/test-browser/SKILL.md:32
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTAL`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/test-browser/SKILL.md:44
- **Rule:** `command-v`
- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "NOT INSTALLED"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:59
- **Rule:** `command-v`
- **Line:** `!`command -v codex >/dev/null 2>&1 && echo "CODEX_AVAILABLE" || echo "CODEX_NOT_`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:62
- **Rule:** `brew-install`
- **Line:** `If it shows `CODEX_NOT_FOUND` or anything else, the Codex CLI is not installed o`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/AGENTS.md:146
- **Rule:** `command-v`
- **Line:** `- [ ] **Pre-resolution exception:** `!` backtick pre-resolution commands run at `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/tests/pipeline-review-contract.test.ts:203
- **Rule:** `command-v`
- **Line:** `expect(content).toContain("command -v codex")`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:25
- **Rule:** `command-v`
- **Line:** `expect(findRules(["if command -v node >/dev/null; then"], ".sh")).toEqual(["comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:29
- **Rule:** `brew-install`
- **Line:** `expect(findRules(["brew install node"], ".sh")).toEqual(["brew-install"])`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:85
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:89
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".py")).toEqual(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:93
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).toEqual(["pytho`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:97
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'], ".py")).to`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:101
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], ".py")).toEqu`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:113
- **Rule:** `python-subprocess-bash`
- **Line:** `expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], ".py")).toEqua`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/agents/review/windows-compat-reviewer.md:24
- **Rule:** `command-v`
- **Line:** `- **`command -v` in scripts or skill prose** — bash builtin; PowerShell uses `Ge`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/agents/review/windows-compat-reviewer.md:25
- **Rule:** `brew-install`
- **Line:** `- **`brew install` in documentation** — macOS-only; Windows needs `winget` or ma`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:39
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:48
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:48
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:49
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:53
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:53
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:58
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:58
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:59
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:63
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:63
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:68
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:68
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:69
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:73
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:73
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:78
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Get-Command 替代 command -v``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:79
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:83
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- winget install 替代 brew install``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:88
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- **Python 子进程**：避免 subprocess.run(["bash", ...])，改用 sys.executable`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:93
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- **Python 子进程调用 bash**：改为 sys.executable 或跨平台工具；避免 subprocess.run(`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:103
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:104
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:118
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v timeout >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:119
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:123
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gtimeout >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:124
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:128
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:129
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:133
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `proc = subprocess.Popen(["bash", "-c", command], start_new_session=`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:143
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:158
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gh >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:159
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:163
- **Rule:** `command-v`
- **Line:** `- **Line:** `if [ -z "$REVIEW_BASE_BRANCH" ] && command -v gh >/dev/null 2>&1; t`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:164
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:168
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:173
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffprobe is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:178
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("silicon is not installed. Install with: brew install silicon")`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:183
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("ffmpeg is not installed. Install with: brew install ffmpeg")``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:188
- **Rule:** `brew-install`
- **Line:** `- **Line:** `die("vhs is not installed. Install with: brew install charmbracelet`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:203
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v mise &>/dev/null; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:204
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:208
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v direnv &>/dev/null && [[ -f "$worktree_path/.envrc" ]`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:209
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:233
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v jq >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:234
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:239
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:243
- **Rule:** `command-v`
- **Line:** `- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Installed" || ech`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:244
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:248
- **Rule:** `command-v`
- **Line:** `- **Line:** `command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "N`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:249
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:253
- **Rule:** `command-v`
- **Line:** `- **Line:** `!`command -v codex >/dev/null 2>&1 && echo "CODEX_AVAILABLE" || ech`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:254
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:264
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:268
- **Rule:** `command-v`
- **Line:** `- **Line:** `expect(content).toContain("command -v codex")``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:269
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:273
- **Rule:** `command-v`
- **Line:** `- **Line:** `expect(findRules(["if command -v node >/dev/null; then"], ".sh")).t`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:274
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:278
- **Rule:** `brew-install`
- **Line:** `- **Line:** `expect(findRules(["brew install node"], ".sh")).toEqual(["brew-inst`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:283
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".p`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:288
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".p`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:293
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).to`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:298
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:303
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], `
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:308
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], "`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:313
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **`command -v` in scripts or skill prose** — bash builtin; PowerS`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:314
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:318
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **`brew install` in documentation** — macOS-only; Windows needs ``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:324
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:333
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` usage``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:334
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:338
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` / `apt-get` / `yum```
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:343
- **Rule:** `python-subprocess-bash`
- **Line:** `- **Line:** `- Edge case: A Python file using `subprocess.run(["bash", "-c", ...`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:354
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:358
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` (no PowerShell equivalent)``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:359
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:363
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` (macOS/Linux package manager)``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:368
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Uses bash health-check script with `command -v` checks``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:369
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:374
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:378
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `command -v` (no PowerShell equivalent)``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:379
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:383
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- `brew install` (macOS/Linux package manager)``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:388
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v ffmpeg` in Bun tests | `command` is a shell builtin, `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:389
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:393
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:394
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:398
- **Rule:** `command-v`
- **Line:** `- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `comm`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:403
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:404
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:408
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:409
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:413
- **Rule:** `command-v`
- **Line:** `- **Line:** `| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:414
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:418
- **Rule:** `brew-install`
- **Line:** `- **Line:** `| `brew install -q` | `winget install` | ❌ 需重写 |``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:423
- **Rule:** `command-v`
- **Line:** `- **Line:** `### `command -v`（14 处匹配）``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:424
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:428
- **Rule:** `brew-install`
- **Line:** `- **Line:** `### `brew install`（4 处匹配）``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:443
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v git >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:444
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:448
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v brew >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:449
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:453
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install git``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:458
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install git``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:463
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v bun >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:464
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:468
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:469
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:473
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v brew >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:474
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:478
- **Rule:** `brew-install`
- **Line:** `- **Line:** `brew install python@3.12``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:483
- **Rule:** `brew-install`
- **Line:** `- **Line:** `info "建议运行: brew install python@3.12"``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:488
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v uv >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:489
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:493
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v bun >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:494
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:498
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gale-knowledge &>/dev/null; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:499
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:503
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v "$tool" >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:504
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:508
- **Rule:** `brew-install`
- **Line:** `- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:513
- **Rule:** `command-v`
- **Line:** `- **Line:** `if command -v gale-harness >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:514
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:528
- **Rule:** `command-v`
- **Line:** `- **Line:** `if ! command -v python3 >/dev/null 2>&1; then``
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:529
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:538
- **Rule:** `command-v`
- **Line:** `- **Line:** `suggestion: "`command -v` is a bash builtin. On PowerShell use `Get`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:539
- **Rule:** `command-v`
- **Line:** `- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `command-v`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:560
- **Rule:** `command-v`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:560
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- 使用 scripts/windows-compat-scan.ts 扫描并修复 Bash shebang、command -v、b`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:585
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:585
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:600
- **Rule:** `command-v`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:600
- **Rule:** `brew-install`
- **Line:** `- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `command-v`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:28
- **Rule:** `brew-install`
- **Line:** `- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:131
- **Rule:** `command-v`
- **Line:** `- `command -v` usage`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:132
- **Rule:** `brew-install`
- **Line:** `- `brew install` / `apt-get` / `yum``
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:146
- **Rule:** `python-subprocess-bash`
- **Line:** `- Edge case: A Python file using `subprocess.run(["bash", "-c", ...])` is flagge`
- **Suggestion:** Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/bugs/monitor-bugs.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:45
- **Rule:** `command-v`
- **Line:** `- **PowerShell syntax errors** — Attempting to run bash scripts in PowerShell pr`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:66
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:67
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:149
- **Rule:** `command-v`
- **Line:** `- Uses bash health-check script with `command -v` checks`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md:161
- **Rule:** `command-v`
- **Line:** `2. **Bash Incompatibility Bypassed:** By detecting Windows via `$env:OS` early, `
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:52
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:53
- **Rule:** `command-v`
- **Line:** `echo "✅ hkt-memory is available: $(command -v hkt-memory)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:73
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:74
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:188
- **Rule:** `command-v`
- **Line:** `| install.sh 只创建 symlink 不验证 | 添加 `command -v hkt-memory` 自检 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/windows-trae-setup-2026-04-17.md:49
- **Rule:** `command-v`
- **Line:** `- `command -v` (no PowerShell equivalent)`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/windows-trae-setup-2026-04-17.md:50
- **Rule:** `brew-install`
- **Line:** `- `brew install` (macOS/Linux package manager)`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md:98
- **Rule:** `command-v`
- **Line:** `| `command -v ffmpeg` in Bun tests | `command` is a shell builtin, not spawnable`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `command-v`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/ideation/2026-04-17-windows-trae-compatibility-ideation.md:16
- **Rule:** `brew-install`
- **Line:** `- `check-health` bash script uses `#!/bin/bash`, bash arrays, `command -v`, `bre`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:30
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:54
- **Rule:** `command-v`
- **Line:** `| `command -v uv` | `Get-Command uv` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:75
- **Rule:** `command-v`
- **Line:** `| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:76
- **Rule:** `brew-install`
- **Line:** `| `brew install -q` | `winget install` | ❌ 需重写 |`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:116
- **Rule:** `command-v`
- **Line:** `### `command -v`（14 处匹配）`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:121
- **Rule:** `brew-install`
- **Line:** `### `brew install`（4 处匹配）`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:37
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:39
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:43
- **Rule:** `command-v`
- **Line:** `if command -v brew >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:45
- **Rule:** `brew-install`
- **Line:** `INSTALL_CMD="brew install"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:46
- **Rule:** `command-v`
- **Line:** `elif command -v apt-get >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:49
- **Rule:** `command-v`
- **Line:** `elif command -v dnf >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:52
- **Rule:** `command-v`
- **Line:** `elif command -v yum >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:55
- **Rule:** `command-v`
- **Line:** `elif command -v pacman >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:79
- **Rule:** `command-v`
- **Line:** `if command -v git >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:96
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:116
- **Rule:** `command-v`
- **Line:** `if command -v "$cmd" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:125
- **Rule:** `brew-install`
- **Line:** `brew install python@3.12`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:155
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:203
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:204
- **Rule:** `command-v`
- **Line:** `ok "hkt-memory CLI is ready ($(command -v hkt-memory))"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:215
- **Rule:** `command-v`
- **Line:** `if command -v bun >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:224
- **Rule:** `command-v`
- **Line:** `if command -v gale-knowledge &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:244
- **Rule:** `command-v`
- **Line:** `if command -v "$tool" >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:248
- **Rule:** `brew-install`
- **Line:** `warn "${tool} 未安装 (可选，建议: brew install ${tool})"`
- **Suggestion:** `brew` is macOS-only. On Windows use `winget install` or document manual installation steps.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:334
- **Rule:** `command-v`
- **Line:** `if command -v gale-harness >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-unlink.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/generate-batch.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/generate-batch.sh:7
- **Rule:** `command-v`
- **Line:** `if ! command -v python3 >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/apply-patch-to-worktree.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/windows-compat-scan.ts:59
- **Rule:** `command-v`
- **Line:** `suggestion: "`command -v` is a bash builtin. On PowerShell use `Get-Command`. In`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-link.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/usr/bin/env bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:18
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:78
- **Rule:** `command-v`
- **Line:** `if ! command -v hkt-memory >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:86
- **Rule:** `command-v`
- **Line:** `if command -v hkt-memory &>/dev/null; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:87
- **Rule:** `command-v`
- **Line:** `echo "✅ hkt-memory is available: $(command -v hkt-memory)"`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/deploy.sh:1
- **Rule:** `bash-shebang`
- **Line:** `#!/bin/bash`
- **Suggestion:** Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/deploy.sh:44
- **Rule:** `command-v`
- **Line:** `if command -v uv >/dev/null 2>&1; then`
- **Suggestion:** `command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.

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

### .qoder/repowiki/zh/content/开发者指南/测试指南.md:391
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

### .qoder/repowiki/zh/content/Windows 兼容性.md:216
- **Rule:** `process-env-home`
- **Line:** `- **检测规则**：覆盖 shebang、command -v、brew install、rm -rf、mkdir -p、硬编码斜杠、process.env.`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/Windows 兼容性.md:222
- **Rule:** `source-bash`
- **Line:** `- source 命令误报和真实引用（大量警告）`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .qoder/repowiki/zh/content/Windows 兼容性.md:223
- **Rule:** `process-env-home`
- **Line:** `- 硬编码斜杠和 process.env.HOME 使用（警告和信息级别）`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .qoder/repowiki/zh/content/Windows 兼容性.md:278
- **Rule:** `source-bash`
- **Line:** `- **shebang 与命令替换**：Bash 的 #!/bin/bash、command -v、brew install、rm -rf、mkdir -p、I`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .qoder/repowiki/zh/content/Windows 兼容性.md:285
- **Rule:** `source-bash`
- **Line:** `- . .\file.ps1 替代 source ./file`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .qoder/repowiki/zh/content/支持的平台/支持的平台.md:480
- **Rule:** `source-bash`
- **Line:** `source ~/.zshrc  # 或 ~/.bashrc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/CHANGELOG.md:894
- **Rule:** `source-bash`
- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (skill-based >`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/security-reviewer.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secrets in code or logs** -- hardcoded API keys, tokens, or passwords in sou`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/framework-docs-researcher.md:14
- **Rule:** `source-bash`
- **Line:** `1. **Documentation Gathering** (source preference order):`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/framework-docs-researcher.md:36
- **Rule:** `source-bash`
- **Line:** `- Explore gem source code to understand internal implementations`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/framework-docs-researcher.md:62
- **Rule:** `source-bash`
- **Line:** `- Read through key source files related to the feature`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/framework-docs-researcher.md:92
- **Rule:** `source-bash`
- **Line:** `7. **References**: Links to documentation, GitHub issues, and source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/data-migration-expert.md:38
- **Rule:** `source-bash`
- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers every branch (no `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/best-practices-researcher.md:66
- **Rule:** `source-bash`
- **Line:** `- Identify and analyze well-regarded open source projects that demonstrate the p`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/issue-intelligence-analyst.md:103
- **Rule:** `source-bash`
- **Line:** `5. Distinguish issue sources when relevant: bot/agent-generated issues (e.g., `a`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/swift-ios-reviewer.md:26
- **Rule:** `source-bash`
- **Line:** `Incorrect use of `@State`, `@StateObject`, `@ObservedObject`, `@EnvironmentObjec`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:3
- **Rule:** `source-bash`
- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent readiness us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:11
- **Rule:** `source-bash`
- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI agent readiness `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:58
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

### plugins/galeharness-cli/skills/proof/SKILL.md:309
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

### plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:245
- **Rule:** `source-bash`
- **Line:** `Use hyphens in compound adjectives, with the exception of adverbs (words ending `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:529
- **Rule:** `source-bash`
- **Line:** `add on (verb), add-on (noun, adjective), back end (noun), back-end (adjective), `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/document-review/references/review-output-template.md:120
- **Rule:** `source-bash`
- **Line:** `- **Count invariant.** The `Findings` column in Coverage continues to equal Auto`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-debug/references/investigation-techniques.md:305
- **Rule:** `source-bash`
- **Line:** `- Search every relevant log source for that identifier — correlation ID, request`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-debug/SKILL.md:128
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

### plugins/galeharness-cli/skills/compound-sync/SKILL.md:29
- **Rule:** `source-bash`
- **Line:** `Use the upstream sync CLI as the source of truth for batch generation, per-commi`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:222
- **Rule:** `source-bash`
- **Line:** `This path works with any ref — a SHA, `origin/main`, a branch name. Automated ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:351
- **Rule:** `source-bash`
- **Line:** `Understand what the change is trying to accomplish. The source of intent depends`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-review/SKILL.md:451
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/gh-demo-reel/references/tier-terminal-recording.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secret exposure points** -- Any step that could surface a credential: env ex`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:637
- **Rule:** `source-bash`
- **Line:** `source = args.source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-slack-research/SKILL.md:38
- **Rule:** `source-bash`
- **Line:** `- **Findings organized by topic** with source channels and dates`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:62
- **Rule:** `source-bash`
- **Line:** `for source in "$GIT_ROOT"/.env*; do`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:179
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### plugins/galeharness-cli/skills/git-worktree/SKILL.md:54
- **Rule:** `source-bash`
- **Line:** `- **Other branches** (feature branches, PR review branches): configs are compare`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-compound/SKILL.md:268
- **Rule:** `mkdir-p`
- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/``
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

### plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md:212
- **Rule:** `source-bash`
- **Line:** `1. **Verify before claiming** — When the brainstorm touches checkable infrastruc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:306
- **Rule:** `rm-rf`
- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:103
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

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:130
- **Rule:** `source-bash`
- **Line:** `4. Use the source document as the primary input to planning and research`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/gh-plan/SKILL.md:132
- **Rule:** `source-bash`
- **Line:** `6. Do not silently omit source content — if the origin document discussed it, th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### plugins/galeharness-cli/skills/dhh-rails-style/references/architecture.md:479
- **Rule:** `source-bash`
- **Line:** `Events are the single source of truth:`
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

### tests/hkt-memory-compounding.test.ts:81
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrieve[\\s\\S]*?)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/hkt-memory-compounding.test.ts:83
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[\\s\\S]*?)\\n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### tests/hkt-memory-compounding.test.ts:84
- **Rule:** `source-bash`
- **Line:** `: new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " session-search[\\s\`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

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

### docs/plans/2026-04-24-001-feat-upstream-sync-cli-automation-plan.md:201
- **Rule:** `source-bash`
- **Line:** `-> write state.json (primary source of truth)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-23-001-feat-cli-self-update-plan.md:81
- **Rule:** `mkdir-p`
- **Line:** `1. mkdir -p /tmp/galeharness-build`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### docs/plans/2026-04-24-001-feat-ios-morph-x-skills-plan.md:82
- **Rule:** `source-bash`
- **Line:** `- SwiftSyntax 是 Swift 官方生态中用于解析、检查、生成和转换 Swift source 的库，适合作为 Swift AST 安全变换的基础。`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:96
- **Rule:** `source-bash`
- **Line:** `- Generate filename: `<sanitized-branch>-<YYYYMMDD-HHMMSS>.<ext>` where ext come`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:111
- **Rule:** `source-bash`
- **Line:** `- Error path: source file does not exist — exits with error message`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-24-002-feat-platform-capability-manifest-plan.md:378
- **Rule:** `source-bash`
- **Line:** `- **State lifecycle risks:** `copySkillDir` 只改输出目录文件；源 plugin skill/agent 文件保持不变`
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

### docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:87
- **Rule:** `source-bash`
- **Line:** `- `anthropics/claude-plugins-official/plugins/code-review/commands/code-review.m`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:511
- **Rule:** `source-bash`
- **Line:** `- **External canonical referengh:** `https://github.com/anthropics/claude-code/b`
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

### docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:77
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:41
- **Rule:** `source-bash`
- **Line:** `- The generated docs no longer faithfully represented GaleHarnessCLI source exam`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:81
- **Rule:** `source-bash`
- **Line:** `- copied reference Markdown files still preserve source examples such as `/gh:pl`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:85
- **Rule:** `source-bash`
- **Line:** ``SKILL.md` is the runtime instruction surface that Codex needs to adapt. Referen`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/integration-issues/codex-skill-description-limit-2026-04-24.md:35
- **Rule:** `source-bash`
- **Line:** `- The failure affected pass-through skills such as `proof`, where the source ski`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md:53
- **Rule:** `source-bash`
- **Line:** `### 1. Use `git status` as the source of truth for working-tree cleanliness`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### docs/solutions/skill-design/claude-permissions-optimizer-classification-fix.md:294
- **Rule:** `rm-rf`
- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/*`)`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### docs/solutions/skill-design/confidence-anchored-scoring-2026-04-21.md:197
- **Rule:** `source-bash`
- **Line:** `- The skill operates on user input where the user IS the source of truth (e.g., `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

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

### docs/solutions/adding-converter-target-providers.md:410
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

### scripts/dev-sync-skills.sh:38
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dest"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/dev-sync-skills.sh:44
- **Rule:** `source-bash`
- **Line:** `# Remove agents that exist in our source but were previously installed,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/dev-sync-skills.sh:47
- **Rule:** `bash-array`
- **Line:** `owned_agents=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/dev-sync-skills.sh:48
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$target/agents"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:187
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:188
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:189
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:190
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:191
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/setup.sh:207
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/setup.sh:242
- **Rule:** `bash-array`
- **Line:** `optional_tools=("gh" "jq" "ffmpeg")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/setup.sh:337
- **Rule:** `source-bash`
- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/setup.sh:353
- **Rule:** `source-bash`
- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/setup.sh:397
- **Rule:** `source-bash`
- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### scripts/install-release.sh:94
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$tmpdir"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### scripts/install-release.sh:104
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$install_dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### scripts/upstream-sync/apply-patch-to-worktree.sh:90
- **Rule:** `bash-array`
- **Line:** `APPLY_CMD=("git" "apply")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### scripts/windows-compat-scan.ts:89
- **Rule:** `process-env-home`
- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.homedir()` or a`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### scripts/dev-link.sh:2
- **Rule:** `source-bash`
- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local source tree fo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/CHANGELOG.md:881
- **Rule:** `source-bash`
- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (skill-based >`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/security-reviewer.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secrets in code or logs** -- hardcoded API keys, tokens, or passwords in sou`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/framework-docs-researcher.md:14
- **Rule:** `source-bash`
- **Line:** `1. **Documentation Gathering** (source preference order):`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/framework-docs-researcher.md:36
- **Rule:** `source-bash`
- **Line:** `- Explore gem source code to understand internal implementations`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/framework-docs-researcher.md:62
- **Rule:** `source-bash`
- **Line:** `- Read through key source files related to the feature`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/framework-docs-researcher.md:92
- **Rule:** `source-bash`
- **Line:** `7. **References**: Links to documentation, GitHub issues, and source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/data-migration-expert.md:38
- **Rule:** `source-bash`
- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers every branch (no `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/best-practices-researcher.md:66
- **Rule:** `source-bash`
- **Line:** `- Identify and analyze well-regarded open source projects that demonstrate the p`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/issue-intelligence-analyst.md:103
- **Rule:** `source-bash`
- **Line:** `5. Distinguish issue sources when relevant: bot/agent-generated issues (e.g., `a`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/swift-ios-reviewer.md:26
- **Rule:** `source-bash`
- **Line:** `Incorrect use of `@State`, `@StateObject`, `@ObservedObject`, `@EnvironmentObjec`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:3
- **Rule:** `source-bash`
- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent readiness us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:11
- **Rule:** `source-bash`
- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI agent readiness `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:58
- **Rule:** `source-bash`
- **Line:** `Evaluate in priority order: check for **Blockers** first across all principles, `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-work/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-commit/SKILL.md:70
- **Rule:** `source-bash`
- **Line:** `3. **Default: conventional commits** -- If neither source provides a pattern, us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-commit/SKILL.md:74
- **Rule:** `source-bash`
- **Line:** `Before staging everything together, scan the changed files for naturally distinc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/proof/references/hitl-review.md:24
- **Rule:** `source-bash`
- **Line:** `- `localPath`: the source file path (same as input)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/proof/SKILL.md:309
- **Rule:** `source-bash`
- **Line:** `- Use `/state` content as source of truth before editing`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:27
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:29
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=("$@")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:43
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:78
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=(".")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:44
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$(dirname "$exclude_file")"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:114
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:152
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:157
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:158
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path/$shared_file"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:181
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:211
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/SKILL.md:284
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p .context/galeharness-cli/gh-optimize/<spec-name>/`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-optimize/SKILL.md:583
- **Rule:** `source-bash`
- **Line:** `1. **Re-read the experiment log from disk** — do not trust in-memory state. The `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/agent-native-architecture/references/shared-workspace-architecture.md:56
- **Rule:** `source-bash`
- **Line:** `- Single source of truth`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/agent-native-architecture/references/self-modification.md:24
- **Rule:** `source-bash`
- **Line:** `- Read and understand source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/agent-native-architecture/references/files-universal-interface.md:173
- **Rule:** `source-bash`
- **Line:** `Even if you need a database for performance, consider maintaining a file-based "`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/agent-native-architecture/references/agent-execution-patterns.md:153
- **Rule:** `source-bash`
- **Line:** `✅ [1] Find source materials`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:245
- **Rule:** `source-bash`
- **Line:** `Use hyphens in compound adjectives, with the exception of adverbs (words ending `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:529
- **Rule:** `source-bash`
- **Line:** `add on (verb), add-on (noun, adjective), back end (noun), back-end (adjective), `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/document-review/references/review-output-template.md:120
- **Rule:** `source-bash`
- **Line:** `- **Count invariant.** The `Findings` column in Coverage continues to equal Auto`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-debug/references/investigation-techniques.md:305
- **Rule:** `source-bash`
- **Line:** `- Search every relevant log source for that identifier — correlation ID, request`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-debug/SKILL.md:145
- **Rule:** `source-bash`
- **Line:** `Read the relevant source files. Follow the execution path from entry point to wh`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:248
- **Rule:** `source-bash`
- **Line:** `For each topic cluster (docs sharing a problem domain), identify which doc is th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:539
- **Rule:** `source-bash`
- **Line:** `2. The subagent writes the new learning using the support files as the source of`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/compound-sync/SKILL.md:29
- **Rule:** `source-bash`
- **Line:** `Use the upstream sync CLI as the source of truth for batch generation, per-commi`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/SKILL.md:222
- **Rule:** `source-bash`
- **Line:** `This path works with any ref — a SHA, `origin/main`, a branch name. Automated ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/SKILL.md:351
- **Rule:** `source-bash`
- **Line:** `Understand what the change is trying to accomplish. The source of intent depends`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-review/SKILL.md:451
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/references/tier-terminal-recording.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secret exposure points** -- Any step that could surface a credential: env ex`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:637
- **Rule:** `source-bash`
- **Line:** `source = args.source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-slack-research/SKILL.md:38
- **Rule:** `source-bash`
- **Line:** `- **Findings organized by topic** with source channels and dates`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:62
- **Rule:** `source-bash`
- **Line:** `for source in "$GIT_ROOT"/.env*; do`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:179
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/git-worktree/SKILL.md:54
- **Rule:** `source-bash`
- **Line:** `- **Other branches** (feature branches, PR review branches): configs are compare`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-compound/SKILL.md:268
- **Rule:** `mkdir-p`
- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:52
- **Rule:** `bash-array`
- **Line:** `MATCHES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:130
- **Rule:** `bash-array`
- **Line:** `SIGNATURE_PATTERNS=(`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-brainstorm/references/visual-communication.md:21
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for simple flows — 5-15 nodes, no in-box annotations, st`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md:212
- **Rule:** `source-bash`
- **Line:** `1. **Verify before claiming** — When the brainstorm touches checkable infrastruc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:306
- **Rule:** `rm-rf`
- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:103
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-plan/references/visual-communication.md:23
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for dependency graphs and interaction diagrams -- 5-15 n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-plan/SKILL.md:41
- **Rule:** `source-bash`
- **Line:** `1. **Use requirements as the source of truth** - If `gh:brainstorm` produced a r`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-plan/SKILL.md:115
- **Rule:** `source-bash`
- **Line:** `If multiple source documents match, ask which one to use using the platform's bl`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-plan/SKILL.md:130
- **Rule:** `source-bash`
- **Line:** `4. Use the source document as the primary input to planning and research`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-plan/SKILL.md:132
- **Rule:** `source-bash`
- **Line:** `6. Do not silently omit source content — if the origin document discussed it, th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/dhh-rails-style/references/architecture.md:479
- **Rule:** `source-bash`
- **Line:** `Events are the single source of truth:`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:11
- **Rule:** `source-bash`
- **Line:** `Why a separate skill: several callers need the same writing logic without the si`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `Key JSON fields: `headRefOid` (PR head SHA — prefer over indexing into `commits``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:244
- **Rule:** `source-bash`
- **Line:** `- **When commits conflict, trust the final diff**: The commit list is supporting`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/release-metadata.test.ts:15
- **Rule:** `rm-rf`
- **Line:** `await Bun.$`rm -rf ${root}`.quiet()`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/tests/docs/02-SECURITY-TEST-CASES.md:22
- **Rule:** `rm-rf`
- **Line:** `3. Test with malicious input: `"; rm -rf /; "``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/tests/hkt-memory-compounding.test.ts:81
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrieve[\\s\\S]*?)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/hkt-memory-compounding.test.ts:83
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[\\s\\S]*?)\\n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/hkt-memory-compounding.test.ts:84
- **Rule:** `source-bash`
- **Line:** `: new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " session-search[\\s\`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:33
- **Rule:** `rm-rf`
- **Line:** `expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:41
- **Rule:** `mkdir-p`
- **Line:** `expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-p"])`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:45
- **Rule:** `hardcoded-slash`
- **Line:** `expect(findRules(["path.join('src', '/components')"], ".ts")).toEqual(["hardcode`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:53
- **Rule:** `process-env-home`
- **Line:** `expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual(["process-en`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:68
- **Rule:** `source-bash`
- **Line:** `test("source-bash detects source command", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:69
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bash"])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:72
- **Rule:** `source-bash`
- **Line:** `test("source-bash ignores source in comments", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:73
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["// source of truth"], ".ts")).toEqual([])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/agents/review/windows-compat-reviewer.md:18
- **Rule:** `hardcoded-slash`
- **Line:** `- **Hardcoded `/` in path construction** — `path.join("a", "/", "b")` defeats cr`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/plan/platform-capability-manifest/agents/review/windows-compat-reviewer.md:19
- **Rule:** `process-env-home`
- **Line:** `- **`process.env.HOME` in new code** — undefined on Windows; use `os.homedir()` `
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/agents/review/windows-compat-reviewer.md:46
- **Rule:** `source-bash`
- **Line:** `- **`source` as a prose word** — "single source of truth" is not a bash command`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:555
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 硬编码 Unix 路径分隔符、process.env.HOME 使用等跨平台问题``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:556
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:565
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `Check --> |否| Create["mkdir -p home"]``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:570
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- Windows 脚本与路径问题：通过扫描器识别硬编码斜杠、process.env.HOME 使用等不兼容模式``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:571
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:575
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 使用 Windows 兼容扫描器检查硬编码斜杠、process.env.HOME 等``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:576
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:580
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- 拒绝：Bash(rm -rf *)``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:586
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:590
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- source 命令误报和真实引用（大量警告）``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:595
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 硬编码斜杠和 process.env.HOME 使用（警告和信息级别）``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:596
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:605
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- . .\file.ps1 替代 source ./file``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:610
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:620
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Explore gem source code to understand internal implementations``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:625
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Read through key source files related to the feature``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:630
- **Rule:** `source-bash`
- **Line:** `- **Line:** `7. **References**: Links to documentation, GitHub issues, and sourc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:635
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers ever`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:640
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Identify and analyze well-regarded open source projects that demo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:655
- **Rule:** `source-bash`
- **Line:** `- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:660
- **Rule:** `source-bash`
- **Line:** `- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI age`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:675
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. **Default: conventional commits** -- If neither source provides `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:685
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- `localPath`: the source file path (same as input)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:690
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Use `/state` content as source of truth before editing``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:715
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$(dirname "$exclude_file")"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:720
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$WORKTREE_DIR"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:725
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dir"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:730
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dir"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:735
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path/$shared_file"``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:740
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:745
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:750
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p .context/galeharness-cli/gh-optimize/<spec-name>/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:760
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Single source of truth``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:765
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Read and understand source files``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:775
- **Rule:** `source-bash`
- **Line:** `- **Line:** `✅ [1] Find source materials``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:780
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "<plugin-root-path>/cache/compound-engineering-plugin/compou`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:800
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Read the relevant source files. Follow the execution path from entr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:810
- **Rule:** `source-bash`
- **Line:** `- **Line:** `2. The subagent writes the new learning using the support files as `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:820
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Understand what the change is trying to accomplish. The source of i`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:825
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:830
- **Rule:** `source-bash`
- **Line:** `- **Line:** `source = args.source``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:835
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **Findings organized by topic** with source channels and dates``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:840
- **Rule:** `source-bash`
- **Line:** `- **Line:** `for source in "$GIT_ROOT"/.env*; do``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:845
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$WORKTREE_DIR"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:855
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:880
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:895
- **Rule:** `source-bash`
- **Line:** `- **Line:** `1. **Use requirements as the source of truth** - If `gh:brainstorm``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:900
- **Rule:** `source-bash`
- **Line:** `- **Line:** `If multiple source documents match, ask which one to use using the `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:905
- **Rule:** `source-bash`
- **Line:** `- **Line:** `4. Use the source document as the primary input to planning and res`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:910
- **Rule:** `source-bash`
- **Line:** `- **Line:** `6. Do not silently omit source content — if the origin document dis`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:915
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Events are the single source of truth:``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:935
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `await Bun.$`rm -rf ${root}`.quiet()``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:940
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `3. Test with malicious input: `"; rm -rf /; "```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:945
- **Rule:** `source-bash`
- **Line:** `- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrie`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:950
- **Rule:** `source-bash`
- **Line:** `- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:955
- **Rule:** `source-bash`
- **Line:** `- **Line:** `: new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " sessio`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:960
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:965
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:970
- **Rule:** `hardcoded-slash`
- **Line:** `- **Line:** `expect(findRules(["path.join('src', '/components')"], ".ts")).toEqu`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:975
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:976
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:980
- **Rule:** `source-bash`
- **Line:** `- **Line:** `test("source-bash detects source command", () => {``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:985
- **Rule:** `source-bash`
- **Line:** `- **Line:** `expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bas`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:990
- **Rule:** `source-bash`
- **Line:** `- **Line:** `test("source-bash ignores source in comments", () => {``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:995
- **Rule:** `source-bash`
- **Line:** `- **Line:** `expect(findRules(["// source of truth"], ".ts")).toEqual([])``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1000
- **Rule:** `hardcoded-slash`
- **Line:** `- **Line:** `- **Hardcoded `/` in path construction** — `path.join("a", "/", "b"`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1005
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- **`process.env.HOME` in new code** — undefined on Windows; use `o`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1006
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1010
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **`source` as a prose word** — "single source of truth" is not a `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1015
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Parse source files with lightweight line-by-line scanning (no hea`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1025
- **Rule:** `source-bash`
- **Line:** `- **Line:** `| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1030
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1035
- **Rule:** `source-bash`
- **Line:** `- **Line:** `| Copied skills (pass-through) | Overwrite | Plugin is source of tr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1040
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `### 验证 14.1: 分号命令分隔符 `; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1045
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `| TC-D-004 | D | `title="; rm -rf /;"` | spawnSync 数组参数 |``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1050
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `1. 执行 `rm -rf ~/.galeharness/knowledge`（确保干净环境，或使用 `export GALE_KNO`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1055
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `1. `mkdir -p /tmp/bad-repo/.git && chmod 000 /tmp/bad-repo/.git/con`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1060
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `1. `mkdir -p ~/.galeharness/knowledge/node_modules/foo && echo "# b`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1065
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `3. `mkdir -p /tmp/gk-integration/my-project/plans```
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1070
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `### TC-D-004. [Shell 注入] — title 包含分号命令分隔符 `; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1080
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- 最终 commit message 为 `docs(test/brainstorm): ; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1085
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `| Shell 注入 | `title="; rm -rf /;"` | TC-D-004 | ✅ 已覆盖 |``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1090
- **Rule:** `source-bash`
- **Line:** `- **Line:** `4. `source ~/.zshrc`（或对应 shell profile）``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1095
- **Rule:** `source-bash`
- **Line:** `- **Line:** `### 1. Use `git status` as the source of truth for working-tree cle`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1100
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1105
- **Rule:** `source-bash`
- **Line:** `- **Line:** `src/              Application source code``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1110
- **Rule:** `source-bash`
- **Line:** `- **Line:** `src/              Application source code``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1115
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. **Single source of truth for rules.** Classification logic lives`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1130
- **Rule:** `source-bash`
- **Line:** `- **Line:** `2. **Single source of truth:** The `CLAUDE_FAMILY_ALIASES` map in ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1135
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. The source directories already use hyphens (`skills/ce-brainstor`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1155
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- [Command Line Interface Guidelines](https://clig.dev/) — Primary `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1165
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Strengths: renders as SVG in GitHub; source text readable as fall`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1175
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Side-by-side diff views (source text appears as code block)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1180
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Email/Slack notifications (source text is all that renders)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1190
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = path.join(personalSkillsDir, skill)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1195
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Direct`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1200
- **Rule:** `source-bash`
- **Line:** `- **Line:** `扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `s`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1205
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Sync skills and agents from local source tree to installed enviro`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1215
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dest"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1220
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Remove agents that exist in our source but were previously instal`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1230
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$target/agents"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1235
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L0-Abstract/topics``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1240
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L1-Overview/topics``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1245
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/daily``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1250
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/evergreen``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1255
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/episodes``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1265
- **Rule:** `source-bash`
- **Line:** `- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1270
- **Rule:** `source-bash`
- **Line:** `- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1275
- **Rule:** `source-bash`
- **Line:** `- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1285
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.ho`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1286
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1290
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local s`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1305
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = resolveGitHubSource()``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1310
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = resolveGitHubSource()``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-24-001-feat-upstream-sync-cli-automation-plan.md:201
- **Rule:** `source-bash`
- **Line:** `-> write state.json (primary source of truth)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-23-001-feat-cli-self-update-plan.md:81
- **Rule:** `mkdir-p`
- **Line:** `1. mkdir -p /tmp/galeharness-build`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:96
- **Rule:** `source-bash`
- **Line:** `- Generate filename: `<sanitized-branch>-<YYYYMMDD-HHMMSS>.<ext>` where ext come`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:111
- **Rule:** `source-bash`
- **Line:** `- Error path: source file does not exist — exits with error message`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-24-002-feat-platform-capability-manifest-plan.md:378
- **Rule:** `source-bash`
- **Line:** `- **State lifecycle risks:** `copySkillDir` 只改输出目录文件；源 plugin skill/agent 文件保持不变`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:128
- **Rule:** `source-bash`
- **Line:** `- Parse source files with lightweight line-by-line scanning (no heavy NLP).`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:183
- **Rule:** `source-bash`
- **Line:** `- Happy path: `path.win32.join('C:\\Users', 'hermes', 'config.yaml')` produces ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-20-001-feat-global-knowledge-repo-plan.md:53
- **Rule:** `source-bash`
- **Line:** `| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source of truth，索引是`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:87
- **Rule:** `source-bash`
- **Line:** `- `anthropics/claude-plugins-official/plugins/code-review/commands/code-review.m`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:511
- **Rule:** `source-bash`
- **Line:** `- **External canonical referengh:** `https://github.com/anthropics/claude-code/b`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/brainstorms/2026-04-20-global-knowledge-repo-requirements.md:73
- **Rule:** `source-bash`
- **Line:** `- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/specs/kiro.md:168
- **Rule:** `source-bash`
- **Line:** `| Copied skills (pass-through) | Overwrite | Plugin is source of truth |`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/specs/bugs/BUG-014-shell-injection-protection.md:23
- **Rule:** `rm-rf`
- **Line:** `### 验证 14.1: 分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/PR31-TEST-REPORT.md:77
- **Rule:** `rm-rf`
- **Line:** `| TC-D-004 | D | `title="; rm -rf /;"` | spawnSync 数组参数 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:14
- **Rule:** `rm-rf`
- **Line:** `1. 执行 `rm -rf ~/.galeharness/knowledge`（确保干净环境，或使用 `export GALE_KNOWLEDGE_HOME=/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:92
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p /tmp/bad-repo/.git && chmod 000 /tmp/bad-repo/.git/config``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:545
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p ~/.galeharness/knowledge/node_modules/foo && echo "# bad" > ~/.gale`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:841
- **Rule:** `mkdir-p`
- **Line:** `3. `mkdir -p /tmp/gk-integration/my-project/plans``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/specs/pr31-manual-testcases-team-d.md:76
- **Rule:** `rm-rf`
- **Line:** `### TC-D-004. [Shell 注入] — title 包含分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/pr31-manual-testcases-team-d.md:82
- **Rule:** `rm-rf`
- **Line:** `2. 调用 `commitKnowledgeChanges({ project: "test", type: "brainstorm", title: "; r`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/pr31-manual-testcases-team-d.md:87
- **Rule:** `rm-rf`
- **Line:** `- 最终 commit message 为 `docs(test/brainstorm): ; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/pr31-manual-testcases-team-d.md:564
- **Rule:** `rm-rf`
- **Line:** `| Shell 注入 | `title="; rm -rf /;"` | TC-D-004 | ✅ 已覆盖 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/specs/pr31-manual-testcases-team-e.md:472
- **Rule:** `source-bash`
- **Line:** `4. `source ~/.zshrc`（或对应 shell profile）`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:77
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:41
- **Rule:** `source-bash`
- **Line:** `- The generated docs no longer faithfully represented GaleHarnessCLI source exam`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:81
- **Rule:** `source-bash`
- **Line:** `- copied reference Markdown files still preserve source examples such as `/gh:pl`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/codex-copied-skill-reference-markdown-rewrite-boundary-2026-04-24.md:85
- **Rule:** `source-bash`
- **Line:** ``SKILL.md` is the runtime instruction surface that Codex needs to adapt. Referen`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integration-issues/codex-skill-description-limit-2026-04-24.md:35
- **Rule:** `source-bash`
- **Line:** `- The failure affected pass-through skills such as `proof`, where the source ski`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md:53
- **Rule:** `source-bash`
- **Line:** `### 1. Use `git status` as the source of truth for working-tree cleanliness`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/claude-permissions-optimizer-classification-fix.md:294
- **Rule:** `rm-rf`
- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/*`)`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/confidence-anchored-scoring-2026-04-21.md:197
- **Rule:** `source-bash`
- **Line:** `- The skill operates on user input where the user IS the source of truth (e.g., `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:89
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:97
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/script-first-skill-architecture.md:44
- **Rule:** `source-bash`
- **Line:** `3. **Single source of truth for rules.** Classification logic lives exclusively `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/skill-design/script-first-skill-architecture.md:77
- **Rule:** `source-bash`
- **Line:** `- **Dual rule definitions.** Classification rules in both the script AND the SKI`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:48
- **Rule:** `source-bash`
- **Line:** `- **Assuming Codex skills support model overrides in frontmatter**: they don't —`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:147
- **Rule:** `source-bash`
- **Line:** `2. **Single source of truth:** The `CLAUDE_FAMILY_ALIASES` map in `src/utils/mod`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:53
- **Rule:** `source-bash`
- **Line:** `3. The source directories already use hyphens (`skills/ce-brainstorm/`), so the `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:95
- **Rule:** `source-bash`
- **Line:** `The core issue was a mismatch between the logical name domain (colons as namespa`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/workflow/manual-release-please-github-releases.md:153
- **Rule:** `source-bash`
- **Line:** `- Root `CHANGELOG.md` is only a pointer to GitHub Releases and is not the canoni`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/agent-friendly-cli-principles.md:445
- **Rule:** `source-bash`
- **Line:** `- [Writing effective tools for agents — Anthropic Engineering](https://www.anthr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/agent-friendly-cli-principles.md:446
- **Rule:** `source-bash`
- **Line:** `- [Command Line Interface Guidelines](https://clig.dev/) — Primary source for CL`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/agent-friendly-cli-principles.md:452
- **Rule:** `source-bash`
- **Line:** `- [How to Write a Good Spec for AI Agents — Addy Osmani](https://addyosmani.com/`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:114
- **Rule:** `source-bash`
- **Line:** `- Strengths: renders as SVG in GitHub; source text readable as fallback in email`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:116
- **Rule:** `source-bash`
- **Line:** `- Use `TB` (top-to-bottom) direction for narrow rendering in both SVG and source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:151
- **Rule:** `source-bash`
- **Line:** `- Side-by-side diff views (source text appears as code block)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:152
- **Rule:** `source-bash`
- **Line:** `- Email/Slack notifications (source text is all that renders)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/developer-experience/local-dev-shell-aliases-zsh-and-bunx-fixes-2026-03-26.md:96
- **Rule:** `source-bash`
- **Line:** `3. **Grouped by intent, not mechanism**: "Local Development" is what the user ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/solutions/adding-converter-target-providers.md:410
- **Rule:** `source-bash`
- **Line:** `const source = path.join(personalSkillsDir, skill)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:32
- **Rule:** `mkdir-p`
- **Line:** `| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Directory -Force` |`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/docs/WINDOWS_COMPATIBILITY_REPORT.md:133
- **Rule:** `source-bash`
- **Line:** `扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `source` 命令。`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:2
- **Rule:** `source-bash`
- **Line:** `# Sync skills and agents from local source tree to installed environments.`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:17
- **Rule:** `bash-array`
- **Line:** `TARGETS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:38
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dest"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:44
- **Rule:** `source-bash`
- **Line:** `# Remove agents that exist in our source but were previously installed,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:47
- **Rule:** `bash-array`
- **Line:** `owned_agents=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/scripts/dev-sync-skills.sh:48
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$target/agents"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:187
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:188
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:189
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:190
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:191
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:207
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:242
- **Rule:** `bash-array`
- **Line:** `optional_tools=("gh" "jq" "ffmpeg")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:337
- **Rule:** `source-bash`
- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:353
- **Rule:** `source-bash`
- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/setup.sh:397
- **Rule:** `source-bash`
- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/scripts/upstream-sync/apply-patch-to-worktree.sh:90
- **Rule:** `bash-array`
- **Line:** `APPLY_CMD=("git" "apply")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/scripts/windows-compat-scan.ts:89
- **Rule:** `process-env-home`
- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.homedir()` or a`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/plan/platform-capability-manifest/scripts/dev-link.sh:2
- **Rule:** `source-bash`
- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local source tree fo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/AGENTS.md:95
- **Rule:** `source-bash`
- **Line:** `- Do not hand-add release entries to `CHANGELOG.md` or treat it as the canonical`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/AGENTS.md:167
- **Rule:** `source-bash`
- **Line:** `- **Unpredictable install paths:** Plugins installed from the marketplace are ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/MIGRATION_v4_to_v5.md:230
- **Rule:** `rm-rf`
- **Line:** `rm -rf memory`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/layers/l0_abstract.py:240
- **Rule:** `source-bash`
- **Line:** `source = source_line.split(":", 1)[1].strip() if ":" in source_line else ""`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/layers/l0_abstract.py:243
- **Rule:** `source-bash`
- **Line:** `'id': memory_id or source or header,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:31
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:32
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:33
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:34
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:35
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/install.sh:71
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$INSTALL_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/tests/test_memory_lifecycle.py:192
- **Rule:** `bash-array`
- **Line:** `content=(`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/tests/test_memory_lifecycle.py:195
- **Rule:** `rm-rf`
- **Line:** `"rm -rf /tmp/hktmemory-cache"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/tests/test_recall_orchestrator.py:92
- **Rule:** `source-bash`
- **Line:** `content="最近在排查 orchestrator 的 source priority。",`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/docs/plans/hktmemory-hermes-rd-memory-improvement-plan.md:101
- **Rule:** `source-bash`
- **Line:** `- [ ] 明确旧链路与新链路的 source of truth，必要时提供迁移与兼容策略`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/docs/plans/hktmemory-hermes-rd-memory-improvement-plan.md:114
- **Rule:** `source-bash`
- **Line:** `- [ ] Session memory 只有一套明确的 source of truth，不出现并行 recent/session 双体系`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/docs/solutions/best-practices/hktmemory-pr2-session-search-critical-bugs-2026-04-21.md:249
- **Rule:** `source-bash`
- **Line:** `# Narrow fallback: both source AND scope must match`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/vector_store/store.py:143
- **Rule:** `source-bash`
- **Line:** `source TEXT,     -- 来源文件`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/vector_store/sqlite_backend.py:52
- **Rule:** `source-bash`
- **Line:** `source TEXT,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/hooks/auto_recall.py:99
- **Rule:** `source-bash`
- **Line:** `source = m.get("source", "")`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/scripts/l0_abstract.py:209
- **Rule:** `source-bash`
- **Line:** `source = source_line.split(':', 1)[1].strip() if ':' in source_line else ''`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/deploy.sh:27
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$BACKUP_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/vendor/hkt-memory/deploy.sh:35
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$TARGET_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/plan/platform-capability-manifest/src/commands/install.ts:328
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/plan/platform-capability-manifest/src/commands/plugin-path.ts:37
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/CHANGELOG.md:894
- **Rule:** `source-bash`
- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (skill-based >`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/security-reviewer.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secrets in code or logs** -- hardcoded API keys, tokens, or passwords in sou`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/framework-docs-researcher.md:14
- **Rule:** `source-bash`
- **Line:** `1. **Documentation Gathering** (source preference order):`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/framework-docs-researcher.md:36
- **Rule:** `source-bash`
- **Line:** `- Explore gem source code to understand internal implementations`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/framework-docs-researcher.md:62
- **Rule:** `source-bash`
- **Line:** `- Read through key source files related to the feature`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/framework-docs-researcher.md:92
- **Rule:** `source-bash`
- **Line:** `7. **References**: Links to documentation, GitHub issues, and source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/data-migration-expert.md:38
- **Rule:** `source-bash`
- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers every branch (no `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/best-practices-researcher.md:66
- **Rule:** `source-bash`
- **Line:** `- Identify and analyze well-regarded open source projects that demonstrate the p`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/issue-intelligence-analyst.md:103
- **Rule:** `source-bash`
- **Line:** `5. Distinguish issue sources when relevant: bot/agent-generated issues (e.g., `a`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/swift-ios-reviewer.md:26
- **Rule:** `source-bash`
- **Line:** `Incorrect use of `@State`, `@StateObject`, `@ObservedObject`, `@EnvironmentObjec`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:3
- **Rule:** `source-bash`
- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent readiness us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:11
- **Rule:** `source-bash`
- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI agent readiness `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/agents/cli-agent-readiness-reviewer.md:58
- **Rule:** `source-bash`
- **Line:** `Evaluate in priority order: check for **Blockers** first across all principles, `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/README.md:146
- **Rule:** `source-bash`
- **Line:** ``gale-harness audit --similarity <project>` scans Swift/ObjC source against conf`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-debug-x/SKILL.md:154
- **Rule:** `source-bash`
- **Line:** `Store only summaries, tags, and fingerprints; do not store full source code. On `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-commit/SKILL.md:70
- **Rule:** `source-bash`
- **Line:** `3. **Default: conventional commits** -- If neither source provides a pattern, us`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-commit/SKILL.md:74
- **Rule:** `source-bash`
- **Line:** `Before staging everything together, scan the changed files for naturally distinc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/proof/references/hitl-review.md:24
- **Rule:** `source-bash`
- **Line:** `- `localPath`: the source file path (same as input)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/proof/SKILL.md:309
- **Rule:** `source-bash`
- **Line:** `- Use `/state` content as source of truth before editing`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:27
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:29
- **Rule:** `bash-array`
- **Line:** `SHARED_FILES=("$@")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:43
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh:78
- **Rule:** `bash-array`
- **Line:** `SCAN_PATHS=(".")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:44
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$(dirname "$exclude_file")"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:114
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:152
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:157
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dir"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:158
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path/$shared_file"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:181
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh:211
- **Rule:** `rm-rf`
- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/SKILL.md:284
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p .context/galeharness-cli/gh-optimize/<spec-name>/`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-optimize/SKILL.md:583
- **Rule:** `source-bash`
- **Line:** `1. **Re-read the experiment log from disk** — do not trust in-memory state. The `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/agent-native-architecture/references/shared-workspace-architecture.md:56
- **Rule:** `source-bash`
- **Line:** `- Single source of truth`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/agent-native-architecture/references/self-modification.md:24
- **Rule:** `source-bash`
- **Line:** `- Read and understand source files`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/agent-native-architecture/references/files-universal-interface.md:173
- **Rule:** `source-bash`
- **Line:** `Even if you need a database for performance, consider maintaining a file-based "`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/agent-native-architecture/references/agent-execution-patterns.md:153
- **Rule:** `source-bash`
- **Line:** `✅ [1] Find source materials`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:245
- **Rule:** `source-bash`
- **Line:** `Use hyphens in compound adjectives, with the exception of adverbs (words ending `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gale-style-editor/references/EVERY_WRITE_STYLE.md:529
- **Rule:** `source-bash`
- **Line:** `add on (verb), add-on (noun, adjective), back end (noun), back-end (adjective), `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/document-review/references/review-output-template.md:120
- **Rule:** `source-bash`
- **Line:** `- **Count invariant.** The `Findings` column in Coverage continues to equal Auto`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-debug/references/investigation-techniques.md:305
- **Rule:** `source-bash`
- **Line:** `- Search every relevant log source for that identifier — correlation ID, request`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-debug/SKILL.md:145
- **Rule:** `source-bash`
- **Line:** `Read the relevant source files. Follow the execution path from entry point to wh`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:248
- **Rule:** `source-bash`
- **Line:** `For each topic cluster (docs sharing a problem domain), identify which doc is th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md:539
- **Rule:** `source-bash`
- **Line:** `2. The subagent writes the new learning using the support files as the source of`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/compound-sync/SKILL.md:29
- **Rule:** `source-bash`
- **Line:** `Use the upstream sync CLI as the source of truth for batch generation, per-commi`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/SKILL.md:222
- **Rule:** `source-bash`
- **Line:** `This path works with any ref — a SHA, `origin/main`, a branch name. Automated ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/SKILL.md:351
- **Rule:** `source-bash`
- **Line:** `Understand what the change is trying to accomplish. The source of intent depends`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-review/SKILL.md:451
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/references/tier-terminal-recording.md:18
- **Rule:** `source-bash`
- **Line:** `- **Secret exposure points** -- Any step that could surface a credential: env ex`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:637
- **Rule:** `source-bash`
- **Line:** `source = args.source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-slack-research/SKILL.md:38
- **Rule:** `source-bash`
- **Line:** `- **Findings organized by topic** with source channels and dates`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:62
- **Rule:** `source-bash`
- **Line:** `for source in "$GIT_ROOT"/.env*; do`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh:179
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$WORKTREE_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/git-worktree/SKILL.md:54
- **Rule:** `source-bash`
- **Line:** `- **Other branches** (feature branches, PR review branches): configs are compare`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-x/SKILL.md:77
- **Rule:** `source-bash`
- **Line:** `- Get user approval to proceed when the source workflow requires it.`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-x/SKILL.md:158
- **Rule:** `source-bash`
- **Line:** `Store only summaries, tags, and fingerprints; do not store full source code. On `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-compound/SKILL.md:268
- **Rule:** `mkdir-p`
- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:52
- **Rule:** `bash-array`
- **Line:** `MATCHES=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-polish-beta/scripts/detect-project-type.sh:130
- **Rule:** `bash-array`
- **Line:** `SIGNATURE_PATTERNS=(`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-brainstorm/references/visual-communication.md:21
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for simple flows — 5-15 nodes, no in-box annotations, st`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md:212
- **Rule:** `source-bash`
- **Line:** `1. **Verify before claiming** — When the brainstorm touches checkable infrastruc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md:306
- **Rule:** `rm-rf`
- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:103
- **Rule:** `source-bash`
- **Line:** `- If the plan includes sections such as `Implementation Units`, `Work Breakdown``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-plan/references/visual-communication.md:23
- **Rule:** `source-bash`
- **Line:** `- **Mermaid** (default) for dependency graphs and interaction diagrams -- 5-15 n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-plan/SKILL.md:41
- **Rule:** `source-bash`
- **Line:** `1. **Use requirements as the source of truth** - If `gh:brainstorm` produced a r`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-plan/SKILL.md:115
- **Rule:** `source-bash`
- **Line:** `If multiple source documents match, ask which one to use using the platform's bl`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-plan/SKILL.md:130
- **Rule:** `source-bash`
- **Line:** `4. Use the source document as the primary input to planning and research`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-plan/SKILL.md:132
- **Rule:** `source-bash`
- **Line:** `6. Do not silently omit source content — if the origin document discussed it, th`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/dhh-rails-style/references/architecture.md:479
- **Rule:** `source-bash`
- **Line:** `Events are the single source of truth:`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:11
- **Rule:** `source-bash`
- **Line:** `Why a separate skill: several callers need the same writing logic without the si`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:123
- **Rule:** `source-bash`
- **Line:** `Key JSON fields: `headRefOid` (PR head SHA — prefer over indexing into `commits``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-pr-description/SKILL.md:244
- **Rule:** `source-bash`
- **Line:** `- **When commits conflict, trust the final diff**: The commit list is supporting`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/morph-metrics.test.ts:15
- **Rule:** `source-bash`
- **Line:** `const source = ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/morph-metrics.test.ts:78
- **Rule:** `source-bash`
- **Line:** `for (const source of cases) {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/release-metadata.test.ts:15
- **Rule:** `rm-rf`
- **Line:** `await Bun.$`rm -rf ${root}`.quiet()`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/tests/audit-command.test.ts:39
- **Rule:** `source-bash`
- **Line:** `const source = "import Foundation\nstruct Loader { func run() { if true { print(`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/audit-command.test.ts:72
- **Rule:** `source-bash`
- **Line:** `const source = "struct Demo { func run() { return } }\n"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/docs/02-SECURITY-TEST-CASES.md:22
- **Rule:** `rm-rf`
- **Line:** `3. Test with malicious input: `"; rm -rf /; "``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/tests/morph-fingerprints.test.ts:29
- **Rule:** `source-bash`
- **Line:** `const source = ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/hkt-memory-compounding.test.ts:81
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrieve[\\s\\S]*?)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/hkt-memory-compounding.test.ts:83
- **Rule:** `source-bash`
- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[\\s\\S]*?)\\n`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/hkt-memory-compounding.test.ts:84
- **Rule:** `source-bash`
- **Line:** `: new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " session-search[\\s\`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:33
- **Rule:** `rm-rf`
- **Line:** `expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:41
- **Rule:** `mkdir-p`
- **Line:** `expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-p"])`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:45
- **Rule:** `hardcoded-slash`
- **Line:** `expect(findRules(["path.join('src', '/components')"], ".ts")).toEqual(["hardcode`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:53
- **Rule:** `process-env-home`
- **Line:** `expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual(["process-en`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:68
- **Rule:** `source-bash`
- **Line:** `test("source-bash detects source command", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:69
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bash"])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:72
- **Rule:** `source-bash`
- **Line:** `test("source-bash ignores source in comments", () => {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:73
- **Rule:** `source-bash`
- **Line:** `expect(findRules(["// source of truth"], ".ts")).toEqual([])`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/agents/review/windows-compat-reviewer.md:18
- **Rule:** `hardcoded-slash`
- **Line:** `- **Hardcoded `/` in path construction** — `path.join("a", "/", "b")` defeats cr`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/codex/feat-ios-morph-x-plan/agents/review/windows-compat-reviewer.md:19
- **Rule:** `process-env-home`
- **Line:** `- **`process.env.HOME` in new code** — undefined on Windows; use `os.homedir()` `
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/agents/review/windows-compat-reviewer.md:46
- **Rule:** `source-bash`
- **Line:** `- **`source` as a prose word** — "single source of truth" is not a bash command`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:38
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:43
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:550
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `- Bash shebang、command -v、brew install、rm -rf、mkdir -p 等 Unix 特性在 P`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:555
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 硬编码 Unix 路径分隔符、process.env.HOME 使用等跨平台问题``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:556
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:565
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `Check --> |否| Create["mkdir -p home"]``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:570
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- Windows 脚本与路径问题：通过扫描器识别硬编码斜杠、process.env.HOME 使用等不兼容模式``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:571
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:575
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 使用 Windows 兼容扫描器检查硬编码斜杠、process.env.HOME 等``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:576
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:580
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- 拒绝：Bash(rm -rf *)``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:586
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:590
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- source 命令误报和真实引用（大量警告）``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:595
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- 硬编码斜杠和 process.env.HOME 使用（警告和信息级别）``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:596
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:605
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- . .\file.ps1 替代 source ./file``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:610
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Phase 3: Synthesizes all findings with clear source attribution (`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:620
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Explore gem source code to understand internal implementations``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:625
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Read through key source files related to the feature``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:630
- **Rule:** `source-bash`
- **Line:** `- **Line:** `7. **References**: Links to documentation, GitHub issues, and sourc`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:635
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- [ ] For each CASE/IF mapping, confirm the source data covers ever`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:640
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Identify and analyze well-regarded open source projects that demo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:655
- **Rule:** `source-bash`
- **Line:** `- **Line:** `description: "Reviews CLI source code, plans, or specs for AI agent`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:660
- **Rule:** `source-bash`
- **Line:** `- **Line:** `You review CLI **source code**, **plans**, and **specs** for AI age`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:675
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. **Default: conventional commits** -- If neither source provides `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:685
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- `localPath`: the source file path (same as input)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:690
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Use `/state` content as source of truth before editing``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:715
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$(dirname "$exclude_file")"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:720
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$WORKTREE_DIR"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:725
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dir"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:730
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dir"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:735
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path/$shared_file"``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:740
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:745
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "$worktree_path" 2>/dev/null || true``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:750
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p .context/galeharness-cli/gh-optimize/<spec-name>/``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:760
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Single source of truth``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:765
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Read and understand source files``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:775
- **Rule:** `source-bash`
- **Line:** `- **Line:** `✅ [1] Find source materials``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:780
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf "<plugin-root-path>/cache/compound-engineering-plugin/compou`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:800
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Read the relevant source files. Follow the execution path from entr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:810
- **Rule:** `source-bash`
- **Line:** `- **Line:** `2. The subagent writes the new learning using the support files as `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:820
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Understand what the change is trying to accomplish. The source of i`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:825
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p ".context/galeharness-cli/gh-review/$RUN_ID"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:830
- **Rule:** `source-bash`
- **Line:** `- **Line:** `source = args.source``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:835
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **Findings organized by topic** with source channels and dates``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:840
- **Rule:** `source-bash`
- **Line:** `- **Line:** `for source in "$GIT_ROOT"/.env*; do``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:845
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$WORKTREE_DIR"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:855
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:880
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `rm -rf .context/galeharness-cli/codex-delegation/<run-id>/``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:895
- **Rule:** `source-bash`
- **Line:** `- **Line:** `1. **Use requirements as the source of truth** - If `gh:brainstorm``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:900
- **Rule:** `source-bash`
- **Line:** `- **Line:** `If multiple source documents match, ask which one to use using the `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:905
- **Rule:** `source-bash`
- **Line:** `- **Line:** `4. Use the source document as the primary input to planning and res`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:910
- **Rule:** `source-bash`
- **Line:** `- **Line:** `6. Do not silently omit source content — if the origin document dis`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:915
- **Rule:** `source-bash`
- **Line:** `- **Line:** `Events are the single source of truth:``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:935
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `await Bun.$`rm -rf ${root}`.quiet()``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:940
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `3. Test with malicious input: `"; rm -rf /; "```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:945
- **Rule:** `source-bash`
- **Line:** `- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrie`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:950
- **Rule:** `source-bash`
- **Line:** `- **Line:** `? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:955
- **Rule:** `source-bash`
- **Line:** `- **Line:** `: new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " sessio`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:960
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:965
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:970
- **Rule:** `hardcoded-slash`
- **Line:** `- **Line:** `expect(findRules(["path.join('src', '/components')"], ".ts")).toEqu`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:975
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:976
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:980
- **Rule:** `source-bash`
- **Line:** `- **Line:** `test("source-bash detects source command", () => {``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:985
- **Rule:** `source-bash`
- **Line:** `- **Line:** `expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bas`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:990
- **Rule:** `source-bash`
- **Line:** `- **Line:** `test("source-bash ignores source in comments", () => {``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:995
- **Rule:** `source-bash`
- **Line:** `- **Line:** `expect(findRules(["// source of truth"], ".ts")).toEqual([])``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1000
- **Rule:** `hardcoded-slash`
- **Line:** `- **Line:** `- **Hardcoded `/` in path construction** — `path.join("a", "/", "b"`
- **Suggestion:** Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1005
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `- **`process.env.HOME` in new code** — undefined on Windows; use `o`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1006
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1010
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **`source` as a prose word** — "single source of truth" is not a `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1015
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Parse source files with lightweight line-by-line scanning (no hea`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1025
- **Rule:** `source-bash`
- **Line:** `- **Line:** `| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1030
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1035
- **Rule:** `source-bash`
- **Line:** `- **Line:** `| Copied skills (pass-through) | Overwrite | Plugin is source of tr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1040
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `### 验证 14.1: 分号命令分隔符 `; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1045
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `| TC-D-004 | D | `title="; rm -rf /;"` | spawnSync 数组参数 |``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1050
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `1. 执行 `rm -rf ~/.galeharness/knowledge`（确保干净环境，或使用 `export GALE_KNO`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1055
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `1. `mkdir -p /tmp/bad-repo/.git && chmod 000 /tmp/bad-repo/.git/con`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1060
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `1. `mkdir -p ~/.galeharness/knowledge/node_modules/foo && echo "# b`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1065
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `3. `mkdir -p /tmp/gk-integration/my-project/plans```
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1070
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `### TC-D-004. [Shell 注入] — title 包含分号命令分隔符 `; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1080
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- 最终 commit message 为 `docs(test/brainstorm): ; rm -rf /;```
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1085
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `| Shell 注入 | `title="; rm -rf /;"` | TC-D-004 | ✅ 已覆盖 |``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1090
- **Rule:** `source-bash`
- **Line:** `- **Line:** `4. `source ~/.zshrc`（或对应 shell profile）``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1095
- **Rule:** `source-bash`
- **Line:** `- **Line:** `### 1. Use `git status` as the source of truth for working-tree cle`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1100
- **Rule:** `rm-rf`
- **Line:** `- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1105
- **Rule:** `source-bash`
- **Line:** `- **Line:** `src/              Application source code``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1110
- **Rule:** `source-bash`
- **Line:** `- **Line:** `src/              Application source code``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1115
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. **Single source of truth for rules.** Classification logic lives`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1130
- **Rule:** `source-bash`
- **Line:** `- **Line:** `2. **Single source of truth:** The `CLAUDE_FAMILY_ALIASES` map in ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1135
- **Rule:** `source-bash`
- **Line:** `- **Line:** `3. The source directories already use hyphens (`skills/ce-brainstor`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1155
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- [Command Line Interface Guidelines](https://clig.dev/) — Primary `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1165
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Strengths: renders as SVG in GitHub; source text readable as fall`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1175
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Side-by-side diff views (source text appears as code block)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1180
- **Rule:** `source-bash`
- **Line:** `- **Line:** `- Email/Slack notifications (source text is all that renders)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1190
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = path.join(personalSkillsDir, skill)``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1195
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Direct`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1200
- **Rule:** `source-bash`
- **Line:** `- **Line:** `扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `s`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1205
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Sync skills and agents from local source tree to installed enviro`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1215
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$dest"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1220
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Remove agents that exist in our source but were previously instal`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1230
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p "$target/agents"``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1235
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L0-Abstract/topics``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1240
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L1-Overview/topics``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1245
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/daily``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1250
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/evergreen``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1255
- **Rule:** `mkdir-p`
- **Line:** `- **Line:** `mkdir -p memory/L2-Full/episodes``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1265
- **Rule:** `source-bash`
- **Line:** `- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1270
- **Rule:** `source-bash`
- **Line:** `- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1275
- **Rule:** `source-bash`
- **Line:** `- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1285
- **Rule:** `process-env-home`
- **Line:** `- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.ho`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1286
- **Rule:** `process-env-home`
- **Line:** `- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()``
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1290
- **Rule:** `source-bash`
- **Line:** `- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local s`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1305
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = resolveGitHubSource()``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1310
- **Rule:** `source-bash`
- **Line:** `- **Line:** `const source = resolveGitHubSource()``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-24-001-feat-upstream-sync-cli-automation-plan.md:201
- **Rule:** `source-bash`
- **Line:** `-> write state.json (primary source of truth)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-23-001-feat-cli-self-update-plan.md:81
- **Rule:** `mkdir-p`
- **Line:** `1. mkdir -p /tmp/galeharness-build`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:96
- **Rule:** `source-bash`
- **Line:** `- Generate filename: `<sanitized-branch>-<YYYYMMDD-HHMMSS>.<ext>` where ext come`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-22-001-feat-demo-reel-local-save-plan.md:111
- **Rule:** `source-bash`
- **Line:** `- Error path: source file does not exist — exits with error message`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-24-002-feat-platform-capability-manifest-plan.md:378
- **Rule:** `source-bash`
- **Line:** `- **State lifecycle risks:** `copySkillDir` 只改输出目录文件；源 plugin skill/agent 文件保持不变`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:128
- **Rule:** `source-bash`
- **Line:** `- Parse source files with lightweight line-by-line scanning (no heavy NLP).`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-18-001-feat-windows-deploy-verification-plan.md:183
- **Rule:** `source-bash`
- **Line:** `- Happy path: `path.win32.join('C:\\Users', 'hermes', 'config.yaml')` produces ``
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-20-001-feat-global-knowledge-repo-plan.md:53
- **Rule:** `source-bash`
- **Line:** `| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source of truth，索引是`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:87
- **Rule:** `source-bash`
- **Line:** `- `anthropics/claude-plugins-official/plugins/code-review/commands/code-review.m`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/plans/2026-04-21-002-refactor-gh-review-precision-and-validation-plan.md:511
- **Rule:** `source-bash`
- **Line:** `- **External canonical referengh:** `https://github.com/anthropics/claude-code/b`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/brainstorms/2026-04-20-global-knowledge-repo-requirements.md:73
- **Rule:** `source-bash`
- **Line:** `- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/kiro.md:168
- **Rule:** `source-bash`
- **Line:** `| Copied skills (pass-through) | Overwrite | Plugin is source of truth |`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/bugs/BUG-014-shell-injection-protection.md:23
- **Rule:** `rm-rf`
- **Line:** `### 验证 14.1: 分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/PR31-TEST-REPORT.md:77
- **Rule:** `rm-rf`
- **Line:** `| TC-D-004 | D | `title="; rm -rf /;"` | spawnSync 数组参数 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:14
- **Rule:** `rm-rf`
- **Line:** `1. 执行 `rm -rf ~/.galeharness/knowledge`（确保干净环境，或使用 `export GALE_KNOWLEDGE_HOME=/`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:92
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p /tmp/bad-repo/.git && chmod 000 /tmp/bad-repo/.git/config``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:545
- **Rule:** `mkdir-p`
- **Line:** `1. `mkdir -p ~/.galeharness/knowledge/node_modules/foo && echo "# bad" > ~/.gale`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/gale-knowledge-cli-manual-testcases-team-b.md:841
- **Rule:** `mkdir-p`
- **Line:** `3. `mkdir -p /tmp/gk-integration/my-project/plans``
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/pr31-manual-testcases-team-d.md:76
- **Rule:** `rm-rf`
- **Line:** `### TC-D-004. [Shell 注入] — title 包含分号命令分隔符 `; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/pr31-manual-testcases-team-d.md:82
- **Rule:** `rm-rf`
- **Line:** `2. 调用 `commitKnowledgeChanges({ project: "test", type: "brainstorm", title: "; r`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/pr31-manual-testcases-team-d.md:87
- **Rule:** `rm-rf`
- **Line:** `- 最终 commit message 为 `docs(test/brainstorm): ; rm -rf /;``
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/pr31-manual-testcases-team-d.md:564
- **Rule:** `rm-rf`
- **Line:** `| Shell 注入 | `title="; rm -rf /;"` | TC-D-004 | ✅ 已覆盖 |`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/specs/pr31-manual-testcases-team-e.md:472
- **Rule:** `source-bash`
- **Line:** `4. `source ~/.zshrc`（或对应 shell profile）`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md:77
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integration-issues/codex-skill-description-limit-2026-04-24.md:35
- **Rule:** `source-bash`
- **Line:** `- The failure affected pass-through skills such as `proof`, where the source ski`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md:53
- **Rule:** `source-bash`
- **Line:** `### 1. Use `git status` as the source of truth for working-tree cleanliness`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/claude-permissions-optimizer-classification-fix.md:294
- **Rule:** `rm-rf`
- **Line:** `- Explicit safe-listing of temp directory operations (`rm -rf /tmp/*`)`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/confidence-anchored-scoring-2026-04-21.md:197
- **Rule:** `source-bash`
- **Line:** `- The skill operates on user input where the user IS the source of truth (e.g., `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:89
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md:97
- **Rule:** `source-bash`
- **Line:** `src/              Application source code`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/script-first-skill-architecture.md:44
- **Rule:** `source-bash`
- **Line:** `3. **Single source of truth for rules.** Classification logic lives exclusively `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/skill-design/script-first-skill-architecture.md:77
- **Rule:** `source-bash`
- **Line:** `- **Dual rule definitions.** Classification rules in both the script AND the SKI`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:48
- **Rule:** `source-bash`
- **Line:** `- **Assuming Codex skills support model overrides in frontmatter**: they don't —`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md:147
- **Rule:** `source-bash`
- **Line:** `2. **Single source of truth:** The `CLAUDE_FAMILY_ALIASES` map in `src/utils/mod`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:53
- **Rule:** `source-bash`
- **Line:** `3. The source directories already use hyphens (`skills/ce-brainstorm/`), so the `
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md:95
- **Rule:** `source-bash`
- **Line:** `The core issue was a mismatch between the logical name domain (colons as namespa`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/workflow/manual-release-please-github-releases.md:153
- **Rule:** `source-bash`
- **Line:** `- Root `CHANGELOG.md` is only a pointer to GitHub Releases and is not the canoni`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/agent-friendly-cli-principles.md:445
- **Rule:** `source-bash`
- **Line:** `- [Writing effective tools for agents — Anthropic Engineering](https://www.anthr`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/agent-friendly-cli-principles.md:446
- **Rule:** `source-bash`
- **Line:** `- [Command Line Interface Guidelines](https://clig.dev/) — Primary source for CL`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/agent-friendly-cli-principles.md:452
- **Rule:** `source-bash`
- **Line:** `- [How to Write a Good Spec for AI Agents — Addy Osmani](https://addyosmani.com/`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:114
- **Rule:** `source-bash`
- **Line:** `- Strengths: renders as SVG in GitHub; source text readable as fallback in email`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:116
- **Rule:** `source-bash`
- **Line:** `- Use `TB` (top-to-bottom) direction for narrow rendering in both SVG and source`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:151
- **Rule:** `source-bash`
- **Line:** `- Side-by-side diff views (source text appears as code block)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/best-practices/conditional-visual-aids-in-generated-documents-2026-03-29.md:152
- **Rule:** `source-bash`
- **Line:** `- Email/Slack notifications (source text is all that renders)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/developer-experience/local-dev-shell-aliases-zsh-and-bunx-fixes-2026-03-26.md:96
- **Rule:** `source-bash`
- **Line:** `3. **Grouped by intent, not mechanism**: "Local Development" is what the user ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/solutions/adding-converter-target-providers.md:410
- **Rule:** `source-bash`
- **Line:** `const source = path.join(personalSkillsDir, skill)`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:32
- **Rule:** `mkdir-p`
- **Line:** `| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Directory -Force` |`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/docs/WINDOWS_COMPATIBILITY_REPORT.md:133
- **Rule:** `source-bash`
- **Line:** `扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `source` 命令。`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:2
- **Rule:** `source-bash`
- **Line:** `# Sync skills and agents from local source tree to installed environments.`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:17
- **Rule:** `bash-array`
- **Line:** `TARGETS=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:38
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$dest"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:44
- **Rule:** `source-bash`
- **Line:** `# Remove agents that exist in our source but were previously installed,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:47
- **Rule:** `bash-array`
- **Line:** `owned_agents=()`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-sync-skills.sh:48
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$target/agents"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:187
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:188
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:189
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:190
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:191
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:207
- **Rule:** `source-bash`
- **Line:** `warn "You may need to restart your shell or run: source $SHELL_PROFILE"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:242
- **Rule:** `bash-array`
- **Line:** `optional_tools=("gh" "jq" "ffmpeg")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:337
- **Rule:** `source-bash`
- **Line:** `warn "gale-harness 在当前会话还不可用（需要 source shell profile）"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:353
- **Rule:** `source-bash`
- **Line:** `${CYAN}source ${SHELL_PROFILE}${NC}`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/setup.sh:397
- **Rule:** `source-bash`
- **Line:** `ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/upstream-sync/apply-patch-to-worktree.sh:90
- **Rule:** `bash-array`
- **Line:** `APPLY_CMD=("git" "apply")`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/windows-compat-scan.ts:89
- **Rule:** `process-env-home`
- **Line:** `suggestion: "`process.env.HOME` is undefined on Windows. Use `os.homedir()` or a`
- **Suggestion:** `process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.

### .worktrees/codex/feat-ios-morph-x-plan/scripts/dev-link.sh:2
- **Rule:** `source-bash`
- **Line:** `# Link gale-harness, compound-plugin, and gale-knowledge to local source tree fo`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/AGENTS.md:95
- **Rule:** `source-bash`
- **Line:** `- Do not hand-add release entries to `CHANGELOG.md` or treat it as the canonical`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/AGENTS.md:167
- **Rule:** `source-bash`
- **Line:** `- **Unpredictable install paths:** Plugins installed from the marketplace are ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/MIGRATION_v4_to_v5.md:230
- **Rule:** `rm-rf`
- **Line:** `rm -rf memory`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/layers/l0_abstract.py:240
- **Rule:** `source-bash`
- **Line:** `source = source_line.split(":", 1)[1].strip() if ":" in source_line else ""`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/layers/l0_abstract.py:243
- **Rule:** `source-bash`
- **Line:** `'id': memory_id or source or header,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:31
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L0-Abstract/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:32
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L1-Overview/topics`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:33
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/daily`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:34
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/evergreen`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:35
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p memory/L2-Full/episodes`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/install.sh:71
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$INSTALL_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/tests/test_memory_lifecycle.py:192
- **Rule:** `bash-array`
- **Line:** `content=(`
- **Suggestion:** Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/tests/test_memory_lifecycle.py:195
- **Rule:** `rm-rf`
- **Line:** `"rm -rf /tmp/hktmemory-cache"`
- **Suggestion:** `rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/tests/test_recall_orchestrator.py:92
- **Rule:** `source-bash`
- **Line:** `content="最近在排查 orchestrator 的 source priority。",`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/docs/plans/hktmemory-hermes-rd-memory-improvement-plan.md:101
- **Rule:** `source-bash`
- **Line:** `- [ ] 明确旧链路与新链路的 source of truth，必要时提供迁移与兼容策略`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/docs/plans/hktmemory-hermes-rd-memory-improvement-plan.md:114
- **Rule:** `source-bash`
- **Line:** `- [ ] Session memory 只有一套明确的 source of truth，不出现并行 recent/session 双体系`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/docs/solutions/best-practices/hktmemory-pr2-session-search-critical-bugs-2026-04-21.md:249
- **Rule:** `source-bash`
- **Line:** `# Narrow fallback: both source AND scope must match`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/vector_store/store.py:143
- **Rule:** `source-bash`
- **Line:** `source TEXT,     -- 来源文件`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/vector_store/sqlite_backend.py:52
- **Rule:** `source-bash`
- **Line:** `source TEXT,`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/hooks/auto_recall.py:99
- **Rule:** `source-bash`
- **Line:** `source = m.get("source", "")`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/scripts/l0_abstract.py:209
- **Rule:** `source-bash`
- **Line:** `source = source_line.split(':', 1)[1].strip() if ':' in source_line else ''`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/deploy.sh:27
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$BACKUP_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/vendor/hkt-memory/deploy.sh:35
- **Rule:** `mkdir-p`
- **Line:** `mkdir -p "$TARGET_DIR"`
- **Suggestion:** `mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/report.ts:39
- **Rule:** `source-bash`
- **Line:** `warnings: [`No baseline source available for ${input.path}; similarity metrics w`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/config.ts:41
- **Rule:** `source-bash`
- **Line:** `const source = hasConfig ? "file" : "default"`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/config.ts:183
- **Rule:** `source-bash`
- **Line:** `if (source === "default" || seedInput === undefined || seedInput === null || see`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/files.ts:60
- **Rule:** `source-bash`
- **Line:** `return sources.map((source) => ({ source }))`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/files.ts:69
- **Rule:** `source-bash`
- **Line:** `if (!fallback) return { source }`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/morph/metrics.ts:24
- **Rule:** `source-bash`
- **Line:** `const source = createSourceFingerprint(sourcePath, sourceText, {`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/install.ts:328
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/morph.ts:20
- **Rule:** `source-bash`
- **Line:** `description: "Project directory or source file to process",`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/morph.ts:29
- **Rule:** `source-bash`
- **Line:** `description: "Baseline directory or source file. Overrides .morph-config.yaml ba`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/plugin-path.ts:37
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/audit.ts:19
- **Rule:** `source-bash`
- **Line:** `description: "Project directory or source file to scan",`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/audit.ts:28
- **Rule:** `source-bash`
- **Line:** `description: "Baseline directory or source file. Overrides .morph-config.yaml ba`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### .worktrees/codex/feat-ios-morph-x-plan/src/commands/audit.ts:112
- **Rule:** `source-bash`
- **Line:** `console.log("No Swift/ObjC source files found.")`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### AGENTS.md:95
- **Rule:** `source-bash`
- **Line:** `- Do not hand-add release entries to `CHANGELOG.md` or treat it as the canonical`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### AGENTS.md:167
- **Rule:** `source-bash`
- **Line:** `- **Unpredictable install paths:** Plugins installed from the marketplace are ca`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### src/commands/install.ts:328
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

### src/commands/plugin-path.ts:37
- **Rule:** `source-bash`
- **Line:** `const source = resolveGitHubSource()`
- **Suggestion:** `source` is a bash command. In PowerShell use `. .\file.ps1`. In Bun/Node.js use `import` or `require`.

## Info

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:350
- **Rule:** `colon-in-path`
- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:445
- **Rule:** `colon-in-path`
- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### tests/windows-compat-scan.test.ts:57
- **Rule:** `colon-in-path`
- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).toEqual(["col`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:350
- **Rule:** `colon-in-path`
- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:445
- **Rule:** `colon-in-path`
- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/tests/windows-compat-scan.test.ts:57
- **Rule:** `colon-in-path`
- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).toEqual(["col`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1317
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")``
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1322
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")``
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/plan/platform-capability-manifest/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1327
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:350
- **Rule:** `colon-in-path`
- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/plugins/galeharness-cli/skills/gh-demo-reel/scripts/capture-demo.py:445
- **Rule:** `colon-in-path`
- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/tests/windows-compat-scan.test.ts:57
- **Rule:** `colon-in-path`
- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).toEqual(["col`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1317
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `out = os.path.join(tmpdir, f"frame_{i:03d}.png")``
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1322
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `out_png = os.path.join(tmpdir, f"frame_{i:03d}.png")``
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

### .worktrees/codex/feat-ios-morph-x-plan/docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md:1327
- **Rule:** `colon-in-path`
- **Line:** `- **Line:** `expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).`
- **Suggestion:** Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.

---
*Run this scan anytime with: `bun run scripts/windows-compat-scan.ts`*