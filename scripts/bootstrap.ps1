# GaleHarnessCLI Windows 零依赖启动脚本
# 用途：在全新 Windows 上（无 Git）一键完成环境准备
# 运行方式：复制以下命令到 PowerShell 执行
#   irm https://cdn.jsdelivr.net/gh/wangrenzhu-ola/GaleHarnessCLI@main/scripts/bootstrap.ps1 | iex
#   irm https://raw.githubusercontent.com/wangrenzhu-ola/GaleHarnessCLI/main/scripts/bootstrap.ps1 | iex

$ErrorActionPreference = "Stop"

function ok($msg)     { Write-Host "✓ $msg" -ForegroundColor Green }
function warn($msg)   { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function err($msg)    { Write-Host "✗ $msg" -ForegroundColor Red }
function info($msg)   { Write-Host "→ $msg" -ForegroundColor Cyan }
function header($msg) { Write-Host "`n▶ $msg" -ForegroundColor Blue }

# =====================================================
#  Banner
# =====================================================
Write-Host ""
Write-Host "GaleHarnessCLI Windows 零依赖启动" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "本脚本适用于未安装 Git 的全新 Windows 环境。" -ForegroundColor Gray
Write-Host ""

# =====================================================
#  1. Ensure Git
# =====================================================
header "1. 检查 Git"

$gitAvailable = $false
foreach ($cmd in @("git", "C:\Program Files\Git\bin\git.exe", "C:\Program Files (x86)\Git\bin\git.exe")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $gitAvailable = $true
        break
    }
}

if ($gitAvailable) {
    ok "Git 已安装"
    # Fix Windows schannel TLS issue with GitHub
    info "配置 Git 使用 OpenSSL 后端（避免 schannel TLS 握手失败）..."
    git config --global http.sslBackend openssl 2>$null
    # Disable Git Credential Manager pop-ups for public repos
    info "禁用 Git Credential Manager 弹窗..."
    git config --global credential.helper "" 2>$null
} else {
    info "未检测到 Git，正在安装..."

    # Try winget first
    $wingetAvailable = [bool](Get-Command winget -ErrorAction SilentlyContinue)

    if ($wingetAvailable) {
        try {
            info "通过 winget 安装 Git..."
            winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
            ok "Git 安装完成（winget）"
        } catch {
            warn "winget 安装失败，尝试直接下载..."
            $wingetAvailable = $false
        }
    }

    if (-not $wingetAvailable) {
        # Download Git installer directly
        $gitInstaller = "$env:TEMP\Git-installer.exe"
        $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.49.0.windows.1/Git-2.49.0-64-bit.exe"

        info "正在下载 Git 安装包..."
        try {
            Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
            info "正在安装 Git（可能需要管理员权限）..."
            Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL" -Wait
            ok "Git 安装完成（离线包）"
        } catch {
            err "自动安装 Git 失败"
            Write-Host ""
            Write-Host "请手动完成以下步骤：" -ForegroundColor Yellow
            Write-Host "1. 访问 https://git-scm.com/download/win" -ForegroundColor White
            Write-Host "2. 下载并运行安装程序（全部默认选项即可）" -ForegroundColor White
            Write-Host "3. 重新打开 PowerShell" -ForegroundColor White
            Write-Host "4. 重新运行本脚本" -ForegroundColor White
            exit 1
        }
    }

    # Refresh PATH so git is available in this session
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

    # Configure Git to use OpenSSL backend (avoids schannel TLS handshake failures on Windows)
    info "配置 Git 使用 OpenSSL 后端..."
    git config --global http.sslBackend openssl 2>$null
    # Disable Git Credential Manager pop-ups for public repos
    info "禁用 Git Credential Manager 弹窗..."
    git config --global credential.helper "" 2>$null

    # Verify
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        err "Git 安装后仍无法找到"
        Write-Host "请重新打开 PowerShell 后重试。" -ForegroundColor Yellow
        exit 1
    }
}

# =====================================================
#  2. Clone Repository
# =====================================================
header "2. 克隆仓库"

$cloneDir = "$env:USERPROFILE\GaleHarnessCLI"
if (Test-Path "$cloneDir\.git") {
    info "仓库已存在，跳过克隆"
} else {
    if (Test-Path $cloneDir) {
        Remove-Item -Recurse -Force $cloneDir
    }

    # Query GitHub API for the latest release tag (shallow clone for speed)
    $repoUrl = "https://github.com/wangrenzhu-ola/GaleHarnessCLI.git"
    $apiTagsUrl = "https://api.github.com/repos/wangrenzhu-ola/GaleHarnessCodingCLI/tags?per_page=1"
    $cloneRef = "main"

    try {
        info "查询最新 release tag..."
        $tags = Invoke-RestMethod -Uri $apiTagsUrl -UseBasicParsing -TimeoutSec 10
        if ($tags -and $tags.Count -gt 0) {
            $cloneRef = $tags[0].name
            ok "最新版本: $cloneRef"
        } else {
            warn "未获取到 tag，将使用 main 分支"
        }
    } catch {
        warn "查询 tag 失败（可能是网络问题），将使用 main 分支"
    }

    # Clone with retry logic and OpenSSL backend to avoid schannel TLS failures
    $cloneSuccess = $false
    $maxAttempts = 3
    for ($i = 1; $i -le $maxAttempts; $i++) {
        info "克隆仓库 $cloneRef（尝试 $i / $maxAttempts）..."
        try {
            $gitArgs = @(
                "clone",
                "--config", "http.sslBackend=openssl",
                "--config", "credential.helper=",
                "--branch", $cloneRef,
                "--depth", "1",
                "--single-branch",
                $repoUrl,
                $cloneDir
            )
            & git @gitArgs 2>&1
            if ($LASTEXITCODE -eq 0) {
                $cloneSuccess = $true
                break
            }
        } catch {
            warn "克隆失败: $_"
        }
        if ($i -lt $maxAttempts) {
            warn "等待 3 秒后重试..."
            Start-Sleep -Seconds 3
        }
    }

    if (-not $cloneSuccess) {
        err "仓库克隆失败，已尝试 $maxAttempts 次"
        Write-Host ""
        Write-Host "可能的原因和解决方案：" -ForegroundColor Yellow
        Write-Host "• 网络不稳定：请检查网络连接后重试" -ForegroundColor White
        Write-Host "• GitHub 被墙：请尝试使用代理或镜像" -ForegroundColor White
        Write-Host "• 手动克隆：git config --global http.sslBackend openssl" -ForegroundColor White
        Write-Host "             git config --global credential.helper ''" -ForegroundColor White
        Write-Host "             git clone --depth 1 --branch main $repoUrl" -ForegroundColor White
        exit 1
    }

    ok "仓库克隆完成: $cloneDir"
}

# =====================================================
#  3. Run Setup
# =====================================================
header "3. 运行环境安装脚本"

Set-Location $cloneDir

if (Test-Path ".\scripts\setup.ps1") {
    ok "准备运行 setup.ps1..."
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    & ".\scripts\setup.ps1"
} else {
    err "未找到 setup.ps1"
    exit 1
}
