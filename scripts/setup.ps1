# GaleHarnessCLI 环境一键安装脚本 (Windows)
# 用法: .\scripts\setup.ps1
# CI:  $env:GHALE_CI=1; .\scripts\setup.ps1   (非交互模式，跳过 Read-Host)

#Requires -Version 5.1

# 注意：使用 Continue 而非 Stop，避免非致命错误中断整个安装流程
$ErrorActionPreference = "Continue"

# CI 模式：通过环境变量 GHALE_CI=1 激活
# - 跳过交互式提示 (Read-Host)
# - 跳过 winget 安装 (CI Runner 已预装工具)
# - 使用环境变量配置 HKTMemory (无则使用文件模式)
# - 末尾追加 CLI 启动验证
$CI_MODE = [bool]($env:GHALE_CI -match "^[1YyTt]")

# 修正 Windows PowerShell 5.1 控制台编码，避免 Unicode 字符导致输出乱码或崩溃
if ($PSVersionTable.PSVersion.Major -lt 6) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
}

# =====================================================
#  Colors
# =====================================================
function ok($msg)     { Write-Host "[OK] $msg" -ForegroundColor Green }
function warn($msg)   { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function err($msg)    { Write-Host "[ERR] $msg" -ForegroundColor Red }
function info($msg)   { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function header($msg) { Write-Host "`n== $msg ==" -ForegroundColor Blue }

# =====================================================
#  Helpers
# =====================================================
function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Add-ToUserPath($path) {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$path*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$path", "User")
        $env:Path = "$env:Path;$path"
        ok "已添加到用户 PATH: $path"
    }
}

# =====================================================
#  Banner
# =====================================================
Write-Host ""
Write-Host "GaleHarnessCLI 环境一键安装 (Windows)" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "本脚本将自动检测并安装所有依赖。" -ForegroundColor Gray
Write-Host ""

# =====================================================
#  1. Git
# =====================================================
header "1. 检查 Git"
if (Test-Command "git") {
    ok "Git 已安装 ($(git --version))"
} elseif ($CI_MODE) {
    # CI Runner 应预装 Git，如果找不到则直接失败
    err "CI 模式下未检测到 Git，CI Runner 应预装此工具"
    exit 1
} else {
    info "正在通过 winget 安装 Git..."
    try {
        winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
        ok "Git 安装完成"
        warn "请重新打开 PowerShell 以使 Git 命令生效"
    } catch {
        err "Git 安装失败"
        info "请手动下载安装: https://git-scm.com/download/win"
        exit 1
    }
}

# =====================================================
#  2. Bun
# =====================================================
header "2. 检查 Bun"
if (Test-Command "bun") {
    ok "Bun 已安装 (v$(bun --version))"
} else {
    info "正在安装 Bun..."
    try {
        powershell -c "irm bun.sh/install.ps1|iex"
        ok "Bun 安装完成"
        Add-ToUserPath "$env:USERPROFILE\.bun\bin"
        $env:Path = "$env:Path;$env:USERPROFILE\.bun\bin"
        warn "已自动将 Bun 添加到用户 PATH，如仍找不到请重启 PowerShell"
    } catch {
        err "Bun 安装失败"
        info "请手动安装: https://bun.sh/"
        exit 1
    }
}

# =====================================================
#  3. Python 3.9+
# =====================================================
header "3. 检查 Python"

$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    if (Test-Command $cmd) {
        $pythonCmd = $cmd
        break
    }
}

if (-not $pythonCmd) {
    if ($CI_MODE) {
        err "CI 模式下未检测到 Python，CI Runner 应预装此工具"
        exit 1
    }
    info "正在通过 winget 安装 Python 3.12..."
    try {
        winget install --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements --silent
        ok "Python 3.12 安装完成"
        warn "请重新打开 PowerShell 以使 python 命令生效"
    } catch {
        err "Python 安装失败"
        info "请手动安装: https://www.python.org/downloads/windows/"
        exit 1
    }
} else {
    $pythonVersionStr = & $pythonCmd --version 2>&1
    if ($pythonVersionStr -match "(\d+)\.(\d+)") {
        $pythonMajor = [int]$Matches[1]
        $pythonMinor = [int]$Matches[2]
        if ($pythonMajor -gt 3 -or ($pythonMajor -eq 3 -and $pythonMinor -ge 9)) {
            ok "Python 已安装 ($pythonVersionStr)"
        } else {
            err "Python 版本过低: $pythonVersionStr，需要 >= 3.9"
            info "建议运行: winget install --id Python.Python.3.12"
            exit 1
        }
    }
}

# =====================================================
#  4. uv
# =====================================================
header "4. 检查 uv"
if (Test-Command "uv") {
    ok "uv 已安装"
} elseif ($CI_MODE) {
    # CI 模式下尝试 pip 安装 uv，或跳过
    info "CI 模式：uv 未找到，尝试 pip 安装..."
    try {
        & $pythonCmd -m pip install uv 2>$null | Out-Null
        if (Test-Command "uv") {
            ok "uv 安装完成 (via pip)"
        } else {
            warn "CI 模式：uv 安装失败，将使用 pip 替代"
        }
    } catch {
        warn "CI 模式：uv 安装失败，将使用 pip 替代"
    }
} else {
    info "正在安装 uv..."
    try {
        irm https://astral.sh/uv/install.ps1 | iex
        ok "uv 安装完成"
        Add-ToUserPath "$env:USERPROFILE\.local\bin"
        $env:Path = "$env:Path;$env:USERPROFILE\.local\bin"
    } catch {
        err "uv 安装失败"
        info "请手动安装: https://docs.astral.sh/uv/getting-started/installation/"
    }
}

# =====================================================
#  5. Python Dependencies
# =====================================================
header "5. 安装 HKTMemory Python 依赖"
try {
    if (Test-Command "uv") {
        uv pip install openai requests tqdm | Out-Null
        ok "Python 依赖安装完成 (via uv)"
    } else {
        & $pythonCmd -m pip install openai requests tqdm | Out-Null
        ok "Python 依赖安装完成 (via pip)"
    }
} catch {
    warn "Python 依赖安装失败，请手动运行: uv pip install openai requests tqdm"
}

# =====================================================
#  6. HKTMemory Directory Structure
# =====================================================
header "6. 创建 HKTMemory 目录结构"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

New-Item -ItemType Directory -Force -Path "memory/L0-Abstract/topics" | Out-Null
New-Item -ItemType Directory -Force -Path "memory/L1-Overview/topics" | Out-Null
New-Item -ItemType Directory -Force -Path "memory/L2-Full/daily" | Out-Null
New-Item -ItemType Directory -Force -Path "memory/L2-Full/evergreen" | Out-Null
New-Item -ItemType Directory -Force -Path "memory/L2-Full/episodes" | Out-Null
New-Item -ItemType File -Force -Path "memory/L0-Abstract/index.md" | Out-Null
New-Item -ItemType File -Force -Path "memory/L1-Overview/index.md" | Out-Null
New-Item -ItemType File -Force -Path "memory/L2-Full/evergreen/MEMORY.md" | Out-Null
ok "HKTMemory 目录结构就绪"

# ── HKTMemory CLI installation (Windows) ──
Write-Host ""
info "Installing hkt-memory CLI for Windows..."

$hktCmdWrapper = Join-Path $repoRoot "vendor\hkt-memory\bin\hkt-memory.cmd"
$hktPythonScript = Join-Path $repoRoot "vendor\hkt-memory\scripts\hkt_memory_v5.py"

if (Test-Path $hktCmdWrapper) {
    # Prefer ~/.bun/bin, then ~/.local/bin, create if needed
    $hktInstallDir = $null
    foreach ($candidate in @("$env:USERPROFILE\.bun\bin", "$env:USERPROFILE\.local\bin")) {
        if (Test-Path $candidate -PathType Container) {
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

    # Persist HKT_MEMORY_SCRIPT so the copied wrapper can locate the Python
    # script even when run outside the repo (Strategy 3 in hkt-memory.cmd).
    # Also update the current session.
    [Environment]::SetEnvironmentVariable("HKT_MEMORY_SCRIPT", $hktPythonScript, "User")
    $env:HKT_MEMORY_SCRIPT = $hktPythonScript
    ok "HKT_MEMORY_SCRIPT set to $hktPythonScript"

    # Ensure install dir is in PATH
    Add-ToUserPath $hktInstallDir
    $env:Path = "$env:Path;$hktInstallDir"

    # Verify: actually execute hkt-memory to confirm the wrapper resolves
    # the Python script and runs successfully.
    $hktVerifyOutput = & "$destCmd" stats 2>&1
    $hktVerifyExit = $LASTEXITCODE
    if ($hktVerifyExit -eq 0) {
        ok "hkt-memory CLI is ready"
    } else {
        warn "hkt-memory command failed (exit $hktVerifyExit). Output:"
        warn "$hktVerifyOutput"
        warn "Skills that use HKTMemory (gh:debug, gh:plan, etc.) will not work without it."
    }
} else {
    warn "hkt-memory.cmd wrapper not found at $hktCmdWrapper, skipping PATH install"
}

# =====================================================
#  7. Project Dependencies & Global Link
# =====================================================
header "7. 安装项目依赖并全局链接"
if (Test-Command "bun") {
    try {
        bun install | Out-Null
        ok "项目依赖安装完成"
    } catch {
        warn "bun install 失败，请手动运行"
    }

    try {
        bun link | Out-Null
        ok "gale-harness 已全局链接"
    } catch {
        warn "bun link 失败，请手动运行"
    }

    # ── 全局知识仓库初始化 ──
    Write-Host ""
    Write-Host "=== 初始化全局知识仓库 ===" -ForegroundColor Cyan
    $gkCmd = Get-Command gale-knowledge -ErrorAction SilentlyContinue
    if ($gkCmd) {
        $initResult = & gale-knowledge init 2>&1
        if ($LASTEXITCODE -eq 0) {
            ok "全局知识仓库已初始化 (~/.galeharness/knowledge/)"
        } else {
            warn "知识仓库初始化失败，可稍后手动运行 gale-knowledge init"
        }
    } else {
        warn "gale-knowledge 不在 PATH 中，请确保 bun link 成功"
    }
} else {
    warn "Bun 未就绪，跳过项目依赖安装"
}

# =====================================================
#  8. Optional Tools
# =====================================================
header "8. 检查可选工具"
$optionalTools = @(
    @{ Name = "gh"; InstallCmd = "winget install --id GitHub.cli" },
    @{ Name = "jq"; InstallCmd = "winget install --id jqlang.jq" },
    @{ Name = "ffmpeg"; InstallCmd = "winget install --id Gyan.FFmpeg" }
)
foreach ($tool in $optionalTools) {
    if (Test-Command $tool.Name) {
        ok "$($tool.Name) 已安装"
    } else {
        warn "$($tool.Name) 未安装 (可选，建议运行: $($tool.InstallCmd))"
    }
}

# =====================================================
#  9. HKTMemory API Key (Interactive / CI)
# =====================================================
header "9. 配置 HKTMemory"

if ($CI_MODE) {
    # CI 模式：优先使用环境变量，无则自动切换文件模式
    if ($env:HKT_MEMORY_API_KEY) {
        ok "CI 模式：检测到 HKT_MEMORY_API_KEY 环境变量"
    } else {
        info "CI 模式：未检测到 API Key，自动启用文件模式"
        $env:HKT_MEMORY_FILE_MODE = "true"
    }
} else {
    Write-Host ""
    Write-Host "HKTMemory 支持两种模式:" -ForegroundColor White
    Write-Host "  1. API 模式 — 需要 API Key，向量检索功能完整"
    Write-Host "  2. 文件模式 — 无需 API，仅使用本地文件存储"
    Write-Host ""

    $useApi = Read-Host "是否使用 API 模式? (y/n，默认 y)"
    if ([string]::IsNullOrWhiteSpace($useApi)) { $useApi = "y" }

    if ($useApi -match "^[Yy]") {
        $secureApiKey = Read-Host "请输入 HKT_MEMORY_API_KEY" -AsSecureString
        $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureApiKey))

        [Environment]::SetEnvironmentVariable("HKT_MEMORY_API_KEY", $apiKey, "User")
        [Environment]::SetEnvironmentVariable("HKT_MEMORY_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/", "User")
        [Environment]::SetEnvironmentVariable("HKT_MEMORY_MODEL", "embedding-3", "User")

        $env:HKT_MEMORY_API_KEY = $apiKey
        $env:HKT_MEMORY_BASE_URL = "https://open.bigmodel.cn/api/paas/v4/"
        $env:HKT_MEMORY_MODEL = "embedding-3"

        ok "API 配置已写入用户环境变量"
    } else {
        [Environment]::SetEnvironmentVariable("HKT_MEMORY_FILE_MODE", "true", "User")
        $env:HKT_MEMORY_FILE_MODE = "true"
        ok "文件模式已启用，配置已写入用户环境变量"
    }
}

# =====================================================
#  Summary & Self-Check
# =====================================================
header "安装完成！"

if ($CI_MODE) {
    # ── CI 模式：CLI 启动验证 ──
    Write-Host ""
    info "CI 模式：验证 CLI 可正常启动..."

    $cliOk = $true

    # 验证 gale-harness
    try {
        $ghResult = & gale-harness --help 2>&1
        if ($LASTEXITCODE -eq 0) {
            ok "gale-harness CLI 启动正常"
        } else {
            err "gale-harness CLI 启动失败 (exit code: $LASTEXITCODE)"
            $cliOk = $false
        }
    } catch {
        err "gale-harness CLI 启动异常: $_"
        $cliOk = $false
    }

    # 验证 gale-knowledge
    try {
        $gkResult = & gale-knowledge --help 2>&1
        if ($LASTEXITCODE -eq 0) {
            ok "gale-knowledge CLI 启动正常"
        } else {
            err "gale-knowledge CLI 启动失败 (exit code: $LASTEXITCODE)"
            $cliOk = $false
        }
    } catch {
        err "gale-knowledge CLI 启动异常: $_"
        $cliOk = $false
    }

    if (-not $cliOk) {
        err "CI 验证失败：CLI 无法正常启动"
        exit 1
    }

    ok "CI 验证通过：CLI 可正常启动"
} else {
    Write-Host @"

-----------------------------------------------------------------

  GaleHarnessCLI 环境安装完成

请重新打开 PowerShell，或运行以下命令使配置生效:
  `$env:Path = [Environment]::GetEnvironmentVariable("Path", "User")

-----------------------------------------------------------------
  自检清单 — 请依次运行以下命令验证:

  bun --version
    -> 期望: 1.x.x

  python --version
    -> 期望: Python 3.9+

  uv --version
    -> 期望: uv x.x.x

  gale-harness --help
    -> 期望: 显示 CLI 帮助信息

  gale-knowledge resolve-path --type solutions
    -> 期望: 输出全局知识仓库路径

  hkt-memory stats
    -> 期望: HKTMemory 统计信息

  bun test
    -> 期望: 测试通过

-----------------------------------------------------------------
  全局使用:

  安装到目标平台:
    gale-harness install ./plugins/galeharness-cli --to all

  同步个人配置:
    gale-harness sync

-----------------------------------------------------------------

"@ -ForegroundColor White
}

ok "全部完成！"
