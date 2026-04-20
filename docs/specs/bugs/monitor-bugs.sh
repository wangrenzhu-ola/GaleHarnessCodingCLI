#!/bin/bash
# Bug 修复监控脚本 - PR #31
# 用法: bash docs/specs/bugs/monitor-bugs.sh

BUG_DIR="docs/specs/bugs"
LOG_FILE="$BUG_DIR/monitor.log"

echo "🚀 Bug 修复监控启动 - PR #31" | tee -a "$LOG_FILE"
echo "按 Ctrl+C 停止" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # 获取最新提交
  LATEST_COMMITS=$(git log --oneline -5 --grep="fix\|BUG" 2>/dev/null || echo "无法获取提交")
  
  # 获取测试状态
  TEST_STATUS=$(bun test 2>&1 | grep -E "pass|fail|expect" | tail -3 || echo "测试运行失败")
  
  # 检查未跟踪文件
  UNTRACKED=$(git status --short "$BUG_DIR" 2>/dev/null | wc -l | tr -d ' ')
  
  # 输出到终端和日志
  {
    echo "========================================"
    echo "📅 $TIMESTAMP"
    echo "========================================"
    echo ""
    echo "📝 最近修复提交:"
    echo "$LATEST_COMMITS"
    echo ""
    echo "🧪 测试状态:"
    echo "$TEST_STATUS"
    echo ""
    echo "📁 Bug 目录未跟踪变更: $UNTRACKED 个文件"
    echo ""
    echo "下次检查: 60秒后..."
    echo ""
  } | tee -a "$LOG_FILE"
  
  sleep 60
done
