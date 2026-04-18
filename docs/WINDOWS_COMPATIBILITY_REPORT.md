# Windows 兼容性报告

Generated: 2026-04-18
Source: `scripts/windows-compat-scan.ts`

## 执行摘要

| 指标 | 数量 |
|------|------|
| 🔴 Error | 45 |
| 🟡 Warn | 106 |
| ℹ️ Info | 0 |
| **总计** | **151** |
| Bash 脚本数 | 12 |

---

## 关键 Bash 脚本 PowerShell 兼容性分析

### 1. `vendor/hkt-memory/install.sh`

**功能：** HKTMemory v5 安装脚本 — 检查 Python 版本、uv 可用性、安装依赖、创建目录结构、检查 API key。

**PowerShell 兼容性：** ❌ 完全不兼容

| bash 代码 | PowerShell 等价物 | 状态 |
|-----------|-------------------|------|
| `#!/bin/bash` | N/A | ❌ 不可用 |
| `python3 --version` | `python --version` 或 `py --version` | ⚠️ 命令名可能不同 |
| `command -v uv` | `Get-Command uv` | ❌ 需重写 |
| `pip3 install openai requests tqdm` | `pip install openai requests tqdm` | ⚠️ 命令名可能不同 |
| `mkdir -p memory/L0-Abstract/topics` | `New-Item -ItemType Directory -Force` | ❌ 需重写 |
| `$ZHIPU_API_KEY` / `$OPENAI_API_KEY` | `$env:ZHIPU_API_KEY` / `$env:OPENAI_API_KEY` | ⚠️ 语法不同 |

**Windows 影响：**
- 这是用户首次设置 HKTMemory 的入口脚本
- Windows 用户完全无法运行此脚本
- 但 `gh:setup` SKILL.md 已通过 PowerShell 内联探测替代了此脚本的功能

**建议：** 无需重写 install.sh — 已有 `gh:setup` Windows 路径覆盖其功能。但应在文档中明确说明 Windows 用户应运行 `gh:setup` 而非 `install.sh`。

---

### 2. `vendor/hkt-memory/deploy.sh`

**功能：** HKTMemory v5 部署脚本 — rsync 同步文件、运行 stats 验证。

**PowerShell 兼容性：** ❌ 完全不兼容

| bash 代码 | PowerShell 等价物 | 状态 |
|-----------|-------------------|------|
| `#!/bin/bash` | N/A | ❌ 不可用 |
| `rsync -a --delete` | `robocopy /MIR` 或 `xcopy /E /I /Y` | ❌ 需重写 |
| `command -v uv` | `Get-Command uv` | ❌ 需重写 |
| `date +%Y%m%d-%H%M%S` | `Get-Date -Format "yyyyMMdd-HHmmss"` | ⚠️ 语法不同 |
| `cp -R` | `Copy-Item -Recurse` | ⚠️ 语法不同 |

**Windows 影响：**
- 这是 contributor/维护者使用的脚本，非用户安装路径
- Windows 贡献者无法运行部署流程

**建议：** 低优先级 — 该脚本主要用于 HKTMemory 插件分发，不阻塞普通用户工作流。

---

### 3. `plugins/galeharness-cli/skills/gh-setup/scripts/check-health`

**功能：** 环境健康检查 — 检测 agent-browser、gh、jq、vhs、silicon、ffmpeg 等工具安装状态。

**PowerShell 兼容性：** ❌ 完全不兼容

| bash 代码 | PowerShell 等价物 | 状态 |
|-----------|-------------------|------|
| `#!/usr/bin/env bash` | N/A | ❌ 不可用 |
| `command -v "$name"` | `Get-Command "$name"` | ❌ 需重写 |
| `brew install -q` | `winget install` | ❌ 需重写 |
| `IFS='|'` 数组解析 | `$entry.Split('|')` | ❌ 需重写 |
| `git check-ignore` | `git check-ignore` ✅ | ✅ 可用 |
| `diff -q` | `Compare-Object` 或 `fc` | ⚠️ 需适配 |

**Windows 影响：**
- `gh:setup` 是用户 onboarding 的第一个接触点
- Windows 用户运行 `bash scripts/check-health` 会直接报错
- 但 `gh:setup` SKILL.md 已有 Windows 探测路径（PowerShell 内联 `Get-Command`）

**建议：** 
- 短期：`gh:setup` 的 SKILL.md Windows 路径已足够
- 中期：写一个 `check-health.ps1` 作为完整诊断工具（ideation #3）

---

## 其他 Bash 脚本（12 个总览）

| 脚本 | 用途 | Windows 影响 | 优先级 |
|------|------|-------------|--------|
| `vendor/hkt-memory/install.sh` | HKTMemory 安装 | 高 — 用户首次设置 | 中（已有 SKILL.md 替代） |
| `vendor/hkt-memory/deploy.sh` | HKTMemory 部署 | 低 — 仅维护者使用 | 低 |
| `plugins/galeharness-cli/skills/gh-setup/scripts/check-health` | 环境诊断 | 高 — onboarding | 中（已有 SKILL.md 替代） |
| `plugins/galeharness-cli/skills/gh-optimize/scripts/parallel-probe.sh` | 并行实验探测 | 中 — gh:optimize 用户 | 低 |
| `plugins/galeharness-cli/skills/gh-optimize/scripts/experiment-worktree.sh` | 实验 worktree 管理 | 中 — gh:optimize 用户 | 低 |
| `plugins/galeharness-cli/skills/gh-optimize/scripts/measure.sh` | 性能测量 | 中 — gh:optimize 用户 | 低 |
| `plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh` | 解析 review base 分支 | 中 — gh:review 用户 | 中 |
| `plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh` | Git worktree 管理 | 中 — git-worktree 用户 | 低 |
| `plugins/galeharness-cli/skills/gh-polish-beta/scripts/*.sh` (4 个) | 项目类型检测/端口解析 | 中 — gh:polish-beta 用户 | 低 |
| `plugins/galeharness-cli/agents/research/session-history-scripts/discover-sessions.sh` | 发现历史 session | 低 — 内部工具 | 低 |

---

## 按错误类型分类

### bash shebang（12 个脚本，45 处匹配）
所有 `.sh` 文件在 Windows PowerShell 上均无法直接执行。解决方案：
- **用户路径：** 通过 SKILL.md 内联 PowerShell 命令替代（已完成）
- **贡献者路径：** 安装 Git Bash 或 WSL2 运行 bash 脚本

### `command -v`（14 处匹配）
出现在 install.sh、deploy.sh、check-health、resolve-base.sh 及多个 SKILL.md 的 bash 示例中。
- 在 SKILL.md 中：已存在 Windows 路径（PowerShell `Get-Command`）
- 在 .sh 脚本中：必须在 PowerShell 中重写

### `brew install`（4 处匹配）
出现在 check-health、test-xcode SKILL.md、gh-demo-reel SKILL.md。
- macOS-only 包管理器
- Windows 等价物：`winget install`（系统级）或 `scoop install`（用户级）

### `rm -rf` / `mkdir -p`（12 处匹配）
出现在 optimize scripts、hkt-memory install/deploy、gh-update SKILL.md、MIGRATION_v4_to_v5.md。
- `rm -rf` → `Remove-Item -Recurse -Force`
- `mkdir -p` → `New-Item -ItemType Directory -Force`
- 在 Bun/Node.js 代码中：使用 `fs.rmSync(dir, { recursive: true })` 和 `fs.mkdirSync(dir, { recursive: true })`

### `source`（大量误报 + 少量真实引用）
扫描器将 Markdown 中的 "source" 单词（如 "single source of truth"）误报为 bash `source` 命令。
- 真实 bash `source` 引用：install.sh、deploy.sh、check-health 中的确存在
- 误报：大量 SKILL.md 和 docs 中的 "source" 一词多义

---

## 零成本验证建议

1. **静态扫描器已就绪**：`bun run scripts/windows-compat-scan.ts` — 每次 PR 前运行
2. **path.win32 测试已存在**：`tests/path-sanitization.test.ts` — 验证 colon 路径在 Windows 下安全
3. **文档替代已就绪**：`gh:setup` 的 Windows PowerShell 路径替代了 bash 脚本
4. **下一步**：将 `windows-compat-scan.ts` 加入 `bun test` 或 pre-commit hook，确保新增 bash 脚本或跨平台问题被自动发现
