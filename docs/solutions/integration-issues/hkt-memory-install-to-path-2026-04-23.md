---
title: "hkt-memory CLI 未正确安装到 PATH 导致技能静默失败"
date: "2026-04-23"
category: "integration-issues"
problem_type: "integration_issue"
severity: "high"
module: "vendor/hkt-memory"
component: "tooling"
tags:
  - hkt-memory
  - PATH
  - install
  - setup
  - cli-integration
  - windows-compat
root_cause: "incomplete_setup"
resolution_type: "environment_setup"
---

# hkt-memory CLI 未正确安装到 PATH 导致技能静默失败

## Problem

gh:debug、gh:plan、gh:work 等 8 个 GaleHarnessCLI 技能直接调用 `hkt-memory` 命令，期望它在 PATH 上。部分环境中 HKT 环境变量（HKT_MEMORY_API_KEY、HKT_MEMORY_BASE_URL、HKT_MEMORY_MODEL）配置正确，但 CLI 本身未安装到 PATH，导致 HKTMemory 向量存储集成静默失败——用户无法感知。

## Symptoms

- `hkt-memory stats` → `command not found`
- 技能中的 `hkt-memory retrieve` / `store` / `session-search` 调用静默失败
- HKTMemory 环境变量全部配置正确但向量功能不生效
- 直接调用 vendor 内 Python 脚本（`uv run vendor/hkt-memory/scripts/hkt_memory_v5.py stats`）能正常工作

## What Didn't Work

1. **仅配置环境变量**：HKT_MEMORY_API_KEY/BASE_URL/MODEL 全部正确，但 hkt-memory 命令不在 PATH 上，配置层正确≠调用链路通
2. **依赖 bun link**：setup.sh 通过 bun link 创建了主 CLI 的链接，但 hkt-memory 是独立的 Python CLI 工具，不在 bun link 覆盖范围内（session history: 之前尝试过仅通过 `bun link` 方案链接 CLI 工具，但 hkt-memory 作为独立 Python 工具不在此覆盖范围内）
3. **假设 install.sh 已运行**：技能文档假设用户已运行 `bash vendor/hkt-memory/install.sh`，但 setup.sh 未自动调用它
4. **Windows 完全缺失**：Windows 没有任何 hkt-memory 的命令入口，setup.ps1 未处理

## Solution

修复提交：`61c0014`（分支 `fix/hkt-memory-install-to-path`，PR #47）

### 1. `vendor/hkt-memory/install.sh` — 添加安装自检

在 symlink 创建后新增 post-install verification 步骤：

```bash
# ── Post-install verification ──
echo ""
echo "Verifying hkt-memory installation..."
if command -v hkt-memory &>/dev/null; then
  echo "✅ hkt-memory is available: $(command -v hkt-memory)"
else
  echo "⚠️  hkt-memory is NOT on PATH after installation."
  echo "   Symlink created at: $INSTALL_DIR/hkt-memory"
  echo "   Make sure $INSTALL_DIR is in your PATH."
  echo "   Add to your shell profile: export PATH=\"$INSTALL_DIR:\$PATH\""
fi
```

### 2. `scripts/setup.sh` — 显式调用 install.sh 并验证 PATH

在 HKTMemory 目录结构就绪后新增安装步骤：

```bash
# ── HKTMemory CLI installation ──
echo ""
info "Installing hkt-memory CLI to PATH..."
bash "$REPO_ROOT/vendor/hkt-memory/install.sh"

# Verify hkt-memory is on PATH
if command -v hkt-memory &>/dev/null; then
  ok "hkt-memory CLI is ready ($(command -v hkt-memory))"
else
  warn "hkt-memory not found on PATH after install."
  warn "You may need to restart your shell or run: source $SHELL_PROFILE"
  warn "Skills that use HKTMemory (gh:debug, gh:plan, etc.) will not work without it."
fi
```

### 3. `scripts/setup.ps1` — 新增 Windows hkt-memory.cmd 安装逻辑

检测 → 复制 → PATH → 验证，完整闭环：

```powershell
# ── HKTMemory CLI installation (Windows) ──
Write-Host ""
info "Installing hkt-memory CLI for Windows..."

$hktCmdWrapper = Join-Path $repoRoot "vendor\hkt-memory\bin\hkt-memory.cmd"
if (Test-Path $hktCmdWrapper) {
    # Prefer ~/.bun/bin, then ~/.local/bin, create if needed
    $hktInstallDir = $null
    foreach ($candidate in @("$env:USERPROFILE\.bun\bin", "$env:USERPROFILE\.local\bin")) {
        if (Test-Path $candidate) {
            $hktInstallDir = $candidate
            break
        }
    }
    if (-not $hktInstallDir) {
        $hktInstallDir = "$env:USERPROFILE\.bun\bin"
        New-Item -ItemType Directory -Force -Path $hktInstallDir | Out-Null
        info "Created $hktInstallDir for hkt-memory"
    }

    $destCmd = Join-Path $hktInstallDir "hkt-memory.cmd"
    Copy-Item -Path $hktCmdWrapper -Destination $destCmd -Force
    ok "hkt-memory.cmd -> $destCmd"

    # Ensure install dir is in PATH
    Add-ToUserPath $hktInstallDir
    $env:Path = "$env:Path;$hktInstallDir"

    # Verify
    if (Test-Command "hkt-memory") {
        ok "hkt-memory CLI is ready"
    } else {
        warn "hkt-memory not found on PATH. Restart PowerShell or add $hktInstallDir to PATH."
        warn "Skills that use HKTMemory (gh:debug, gh:plan, etc.) will not work without it."
    }
} else {
    warn "hkt-memory.cmd wrapper not found at $hktCmdWrapper, skipping PATH install"
}
```

### 4. `vendor/hkt-memory/bin/hkt-memory.cmd` — 新建 Windows 原生 CMD wrapper

采用与 bash wrapper 相同的三步搜索策略（Git repo root → 脚本相对路径 → HKT_MEMORY_SCRIPT 环境变量）：

```cmd
@echo off
setlocal

REM hkt-memory - Windows wrapper for vendor/hkt-memory/scripts/hkt_memory_v5.py
REM
REM Search order:
REM   1. Git repo root + vendor path
REM   2. Relative to this script's own location
REM   3. HKT_MEMORY_SCRIPT env var

set "HKT_SCRIPT="

REM Strategy 1: Git repo root + vendor path
for /f "tokens=*" %%g in ('git rev-parse --show-toplevel 2^>nul') do set "GIT_ROOT=%%g"
if defined GIT_ROOT if exist "%GIT_ROOT%\vendor\hkt-memory\scripts\hkt_memory_v5.py" (
    set "HKT_SCRIPT=%GIT_ROOT%\vendor\hkt-memory\scripts\hkt_memory_v5.py"
    goto :found
)

REM Strategy 2: Relative to this script's own location
set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%..") do set "PARENT=%%~fi"
if exist "%PARENT%\scripts\hkt_memory_v5.py" (
    set "HKT_SCRIPT=%PARENT%\scripts\hkt_memory_v5.py"
    goto :found
)

REM Strategy 3: HKT_MEMORY_SCRIPT env var
if defined HKT_MEMORY_SCRIPT if exist "%HKT_MEMORY_SCRIPT%" (
    set "HKT_SCRIPT=%HKT_MEMORY_SCRIPT%"
    goto :found
)

echo Error: Could not find hkt_memory_v5.py
echo Searched:
echo   1. Git repo root vendor\ path
echo   2. Relative to wrapper script (%PARENT%\scripts\)
echo   3. HKT_MEMORY_SCRIPT env var
echo Install via: bash vendor\hkt-memory\install.sh
exit /b 2

:found
where uv >nul 2>nul
if %errorlevel% equ 0 (
    uv run "%HKT_SCRIPT%" %*
) else (
    python "%HKT_SCRIPT%" %*
)
```

## Why This Works

根因是安装流程存在三个断点：

| 断点 | 修复 |
|------|------|
| install.sh 只创建 symlink 不验证 | 添加 `command -v hkt-memory` 自检 |
| setup.sh 不调用 install.sh | 显式调用并验证 PATH |
| Windows 无命令入口 | 新建 hkt-memory.cmd + setup.ps1 安装 |

修复后，无论用户运行 `setup.sh`（macOS/Linux）还是 `setup.ps1`（Windows），hkt-memory 都会被正确安装到 PATH 并通过自检验证。技能层（8 个 SKILL.md）零修改——它们正确地假设 hkt-memory 在 PATH 上。

## Prevention

1. install.sh 末尾的自检确保每次安装都会验证 CLI 可用性
2. setup.sh/setup.ps1 统一调用 install.sh，避免安装步骤遗漏
3. Windows 原生 .cmd wrapper 消除了跨平台盲区
4. 技能的"静默失败"设计（`If no results or command error, proceed silently`）仍然保留——但现在安装流程确保命令可用，静默失败只在真正的网络/API 问题时触发

## Related

- PR #47: fix(hkt-memory): ensure CLI is properly installed to PATH during setup
- PR #37: feat(hktmemory): integrate HKTMemory PR #2
- `docs/solutions/integration-issues/hktmemory-pr2-vendor-sync-session-search-integration-2026-04-22.md`
- `docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md`
