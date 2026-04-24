#!/usr/bin/env bash
# GaleHarnessCLI 环境一键安装脚本 (macOS / Linux)
# 用法: bash scripts/setup.sh

set -euo pipefail

# =====================================================
#  Colors
# =====================================================
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
NC=$'\033[0m'

ok()     { echo -e "${GREEN}✓${NC} $1"; }
warn()   { echo -e "${YELLOW}⚠${NC} $1"; }
err()    { echo -e "${RED}✗${NC} $1"; }
info()   { echo -e "${CYAN}→${NC} $1"; }
header() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }

# =====================================================
#  OS Check
# =====================================================
OS="$(uname -s)"
if [ "$OS" != "Darwin" ] && [ "$OS" != "Linux" ]; then
  err "本脚本仅支持 macOS 和 Linux。请在 macOS 或 Linux 上运行，或使用 Windows PowerShell 脚本。"
  exit 1
fi

# Detect package manager and shell profile
PKG_MANAGER=""
INSTALL_CMD=""
if [ "$OS" = "Darwin" ]; then
  if command -v brew >/dev/null 2>&1; then
    PKG_MANAGER="brew"
    INSTALL_CMD="brew install"
  fi
else
  # Linux
  if command -v brew >/dev/null 2>&1; then
    PKG_MANAGER="brew"
    INSTALL_CMD="brew install"
  elif command -v apt-get >/dev/null 2>&1; then
    PKG_MANAGER="apt"
    INSTALL_CMD="sudo apt-get install -y"
  elif command -v dnf >/dev/null 2>&1; then
    PKG_MANAGER="dnf"
    INSTALL_CMD="sudo dnf install -y"
  elif command -v yum >/dev/null 2>&1; then
    PKG_MANAGER="yum"
    INSTALL_CMD="sudo yum install -y"
  elif command -v pacman >/dev/null 2>&1; then
    PKG_MANAGER="pacman"
    INSTALL_CMD="sudo pacman -S --noconfirm"
  fi
fi

SHELL_PROFILE=""
case "${SHELL##*/}" in
  zsh)  SHELL_PROFILE="$HOME/.zshrc" ;;
  bash) SHELL_PROFILE="$HOME/.bashrc" ;;
  *)    SHELL_PROFILE="$HOME/.profile" ;;
esac

# =====================================================
#  Banner
# =====================================================
echo -e "${BOLD}GaleHarnessCLI 环境一键安装 (macOS / Linux)${NC}"
echo "本脚本将自动检测并安装所有依赖。"
echo ""

# =====================================================
#  1. Git
# =====================================================
header "1. 检查 Git"
if command -v git >/dev/null 2>&1; then
  ok "Git 已安装 ($(git --version))"
else
  info "正在安装 Git..."
  if [ -n "$INSTALL_CMD" ]; then
    $INSTALL_CMD git
  else
    err "未找到可用的包管理器，请手动安装 Git"
    exit 1
  fi
  ok "Git 安装完成"
fi

# =====================================================
#  2. Bun
# =====================================================
header "2. 检查 Bun"
if command -v bun >/dev/null 2>&1; then
  ok "Bun 已安装 (v$(bun --version))"
else
  info "正在安装 Bun..."
  curl -fsSL https://bun.sh/install | bash
  ok "Bun 安装完成"
fi

# Ensure bun is in PATH for this session
if [ -d "$HOME/.bun/bin" ]; then
  export PATH="$HOME/.bun/bin:$PATH"
fi

# =====================================================
#  3. Python 3.9+
# =====================================================
header "3. 检查 Python"

PYTHON_CMD=""
for cmd in python3 python; do
  if command -v "$cmd" >/dev/null 2>&1; then
    PYTHON_CMD="$cmd"
    break
  fi
done

if [ -z "$PYTHON_CMD" ]; then
  info "正在安装 Python..."
  if [ "$PKG_MANAGER" = "brew" ]; then
    brew install python@3.12
  elif [ "$PKG_MANAGER" = "apt" ]; then
    sudo apt-get update && sudo apt-get install -y python3 python3-pip
  elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    $INSTALL_CMD python3 python3-pip
  elif [ "$PKG_MANAGER" = "pacman" ]; then
    $INSTALL_CMD python python-pip
  else
    err "未找到可用的包管理器，请手动安装 Python 3.9+"
    exit 1
  fi
  PYTHON_CMD="python3"
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -gt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 9 ]; }; then
  ok "Python 已安装 (${PYTHON_VERSION})"
else
  err "Python 版本过低: ${PYTHON_VERSION}，需要 >= 3.9"
  info "建议运行: $INSTALL_CMD python3 (或等价命令)"
  exit 1
fi

# =====================================================
#  4. uv
# =====================================================
header "4. 检查 uv"
if command -v uv >/dev/null 2>&1; then
  ok "uv 已安装"
else
  info "正在安装 uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ok "uv 安装完成"
fi

# Ensure uv is in PATH for this session
if [ -d "$HOME/.local/bin" ]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

# =====================================================
#  5. Python Dependencies
# =====================================================
header "5. 安装 HKTMemory Python 依赖"
if uv pip install openai requests tqdm >/dev/null 2>&1; then
  ok "Python 依赖安装完成 (via uv)"
elif $PYTHON_CMD -m pip install openai requests tqdm >/dev/null 2>&1; then
  ok "Python 依赖安装完成 (via pip)"
else
  warn "Python 依赖安装失败，请手动运行: uv pip install openai requests tqdm"
fi

# =====================================================
#  6. HKTMemory Directory Structure
# =====================================================
header "6. 创建 HKTMemory 目录结构"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

mkdir -p memory/L0-Abstract/topics
mkdir -p memory/L1-Overview/topics
mkdir -p memory/L2-Full/daily
mkdir -p memory/L2-Full/evergreen
mkdir -p memory/L2-Full/episodes
touch memory/L0-Abstract/index.md
touch memory/L1-Overview/index.md
touch memory/L2-Full/evergreen/MEMORY.md
ok "HKTMemory 目录结构就绪"

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

# =====================================================
#  7. Project Dependencies & Global Link
# =====================================================
header "7. 安装项目依赖并全局链接"
if command -v bun >/dev/null 2>&1; then
  bun install >/dev/null 2>&1 && ok "项目依赖安装完成" || warn "bun install 失败，请手动运行"

  # bun link 创建的 symlink 依赖源文件有可执行权限，需要先 chmod +x
  chmod +x src/index.ts 2>/dev/null || true
  bun link >/dev/null 2>&1 && ok "gale-harness 已全局链接" || warn "bun link 失败，请手动运行"

  # ── 全局知识仓库初始化 ──
  header "初始化全局知识仓库..."
  if command -v gale-knowledge &>/dev/null; then
    gale-knowledge init 2>/dev/null
    if [ -d "$HOME/.galeharness/knowledge/.git" ]; then
      ok "全局知识仓库已初始化 (~/.galeharness/knowledge/)"
    else
      warn "知识仓库初始化失败，可稍后手动运行 gale-knowledge init"
    fi
  else
    warn "gale-knowledge 不在 PATH 中，请先确保 bun link 成功后重试"
  fi
else
  warn "Bun 未就绪，跳过项目依赖安装"
fi

# =====================================================
#  8. Optional Tools
# =====================================================
header "8. 检查可选工具"
optional_tools=("gh" "jq" "ffmpeg")
for tool in "${optional_tools[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    ok "${tool} 已安装"
  else
    if [ "$OS" = "Darwin" ]; then
      warn "${tool} 未安装 (可选，建议: brew install ${tool})"
    elif [ "$PKG_MANAGER" = "apt" ]; then
      warn "${tool} 未安装 (可选，建议: sudo apt-get install ${tool})"
    elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
      warn "${tool} 未安装 (可选，建议: sudo ${PKG_MANAGER} install ${tool})"
    elif [ "$PKG_MANAGER" = "pacman" ]; then
      warn "${tool} 未安装 (可选，建议: sudo pacman -S ${tool})"
    else
      warn "${tool} 未安装 (可选，请使用系统包管理器安装)"
    fi
  fi
done

# =====================================================
#  9. HKTMemory API Key (Interactive)
# =====================================================
header "9. 配置 HKTMemory"

echo ""
echo "HKTMemory 支持两种模式:"
echo "  1. API 模式 — 需要 API Key，向量检索功能完整"
echo "  2. 文件模式 — 无需 API，仅使用本地文件存储"
echo ""
read -r -p "是否使用 API 模式? (y/n，默认 y): " use_api
use_api=${use_api:-y}

if [[ "$use_api" =~ ^[Yy] ]]; then
  read -r -s -p "请输入 HKT_MEMORY_API_KEY: " api_key
  echo ""

  # Write to shell profile
  {
    echo ""
    echo "# HKTMemory Configuration (auto-generated by setup.sh)"
    echo "export HKT_MEMORY_API_KEY=\"${api_key}\""
    echo "export HKT_MEMORY_BASE_URL=\"https://open.bigmodel.cn/api/paas/v4/\""
    echo "export HKT_MEMORY_MODEL=\"embedding-3\""
  } >> "$SHELL_PROFILE"

  # Export for current session
  export HKT_MEMORY_API_KEY="$api_key"
  export HKT_MEMORY_BASE_URL="https://open.bigmodel.cn/api/paas/v4/"
  export HKT_MEMORY_MODEL="embedding-3"

  ok "API 配置已写入 ${SHELL_PROFILE}"
else
  {
    echo ""
    echo "# HKTMemory Configuration (auto-generated by setup.sh)"
    echo "export HKT_MEMORY_FILE_MODE=true"
  } >> "$SHELL_PROFILE"

  export HKT_MEMORY_FILE_MODE=true
  ok "文件模式已启用，配置已写入 ${SHELL_PROFILE}"
fi

# =====================================================
#  10. PATH Setup (bun bin)
# =====================================================
header "10. 配置 PATH"
if ! grep -q '\.bun/bin' "$SHELL_PROFILE" 2>/dev/null; then
  {
    echo ""
    echo "# Bun (auto-generated by setup.sh)"
    echo 'export PATH="$HOME/.bun/bin:$PATH"'
  } >> "$SHELL_PROFILE"
  ok "Bun PATH 已写入 ${SHELL_PROFILE}"
else
  ok "Bun PATH 已存在"
fi

if ! grep -q '\.local/bin' "$SHELL_PROFILE" 2>/dev/null; then
  {
    echo ""
    echo "# uv tools (auto-generated by setup.sh)"
    echo 'export PATH="$HOME/.local/bin:$PATH"'
  } >> "$SHELL_PROFILE"
  ok "uv PATH 已写入 ${SHELL_PROFILE}"
else
  ok "uv PATH 已存在"
fi

# =====================================================
#  Verify gale-harness works in this session
# =====================================================
header "验证全局 CLI"
if command -v gale-harness >/dev/null 2>&1; then
  ok "gale-harness 命令在当前会话可用"
else
  warn "gale-harness 在当前会话还不可用（需要 source shell profile）"
fi

# =====================================================
#  Summary & Self-Check
# =====================================================
header "安装完成！"

cat << EOF

${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${GREEN}  ✅ GaleHarnessCLI 环境安装完成${NC}

${YELLOW}⚠  重要：请立即执行以下命令使配置生效${NC}

     ${CYAN}source ${SHELL_PROFILE}${NC}

   或者直接${BOLD}重新打开终端${NC}。

   原因：脚本已把 Bun 和 uv 的 PATH 写入了你的 shell 配置，
         但当前终端会话需要重新加载才能识别 ${CYAN}gale-harness${NC} 命令。

${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${BOLD}  自检清单 — 配置生效后，依次运行以下命令验证:${NC}

  ${CYAN}bun --version${NC}
    → 期望: 1.x.x

  ${CYAN}python3 --version${NC}
    → 期望: Python 3.9+

  ${CYAN}uv --version${NC}
    → 期望: uv x.x.x

  ${CYAN}gale-harness --help${NC}
    → 期望: 显示 CLI 帮助信息

  ${CYAN}gale-knowledge resolve-path --type solutions${NC}
    → 期望: 输出全局知识仓库路径

  ${CYAN}gale-memory --help${NC}
    → 期望: 显示 task memory helper 帮助信息

  ${CYAN}hkt-memory stats${NC}
    → 期望: HKTMemory 统计信息

  ${CYAN}bun test${NC}
    → 期望: 测试通过

${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${BOLD}  全局使用:${NC}

  安装到所有检测到的平台:
    ${CYAN}gale-harness install ./plugins/galeharness-cli --to all${NC}

  同步个人配置:
    ${CYAN}gale-harness sync${NC}

${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

EOF

ok "全部完成！执行 ${CYAN}source ${SHELL_PROFILE}${NC} 后立即可用。"
