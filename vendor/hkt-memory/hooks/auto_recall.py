#!/usr/bin/env python3
"""
auto_recall.py — Claude Code PreCompact hook

会话开始时自动注入历史记忆。从 HKTMemory 检索相关记忆并输出到 stdout，
Claude Code 将其注入 system prompt。

环境变量:
    HKT_QUERY          用于检索的查询词（优先）
    HKT_MEMORY_DIR     记忆存储目录（默认: ./memory）
    HKT_MAX_TOKENS     输出 token 上限（默认: 512）
    CLAUDE_CONTEXT     备用查询上下文（取前 100 字）
"""

import os
import sys
from pathlib import Path

# 允许从项目根目录运行
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# 问候语检测列表
_GREETINGS = {
    "你好", "在吗", "hello", "hi", "hey", "ok", "好的", "嗯", "哦", "啊",
    "哈哈", "谢谢", "感谢", "再见", "bye", "goodbye", "晚安", "早安",
    "早上好", "下午好", "晚上好",
}


def _is_greeting(text: str) -> bool:
    cleaned = text.strip().lower().rstrip("!！。，,.")
    return cleaned in _GREETINGS or len(cleaned) < 3


def _estimate_tokens(text: str) -> int:
    """粗估 token 数：1 token ≈ 4 chars（英文），中文约 2 chars/token"""
    return max(1, len(text) // 3)


def _truncate_to_tokens(memories: list, max_tokens: int) -> list:
    """按 token 上限截断结果列表，保留最高相关性（靠前）的记忆"""
    kept = []
    total = 0
    for m in memories:
        content = m.get("summary", m.get("content", ""))
        tokens = _estimate_tokens(content)
        if total + tokens > max_tokens:
            break
        kept.append(m)
        total += tokens
    return kept


def main():
    memory_dir = os.environ.get("HKT_MEMORY_DIR", "memory")
    max_tokens = int(os.environ.get("HKT_MAX_TOKENS", "512"))

    # 确定查询词
    query = os.environ.get("HKT_QUERY", "").strip()
    if not query:
        ctx = os.environ.get("CLAUDE_CONTEXT", "").strip()
        query = ctx[:100] if ctx else ""

    if not query or _is_greeting(query):
        # 无有效查询，静默退出（不注入任何内容）
        sys.exit(0)

    try:
        from scripts.hkt_memory_v5 import HKTMv5

        memory = HKTMv5(memory_dir=memory_dir)
        top_k = memory.config.get("automation", {}).get("auto_recall", {}).get("top_k", 5)
        mode = os.environ.get("HKT_RECALL_MODE", "implement")
        result = memory.orchestrate_recall(
            query=query,
            mode=mode,
            limit=top_k,
            session_id=os.environ.get("HKT_SESSION_ID"),
            task_id=os.environ.get("HKT_TASK_ID"),
            project=os.environ.get("HKT_PROJECT"),
            branch=os.environ.get("HKT_BRANCH"),
            pr_id=os.environ.get("HKT_PR_ID"),
            token_budget=max_tokens,
        )

        flat = result.get("results", [])

        flat = _truncate_to_tokens(flat, max_tokens)

        if not flat:
            sys.exit(0)

        lines = ["## 相关历史记忆\n"]
        for m in flat:
            title = m.get("title", m.get("id", "记忆"))
            content = m.get("summary", m.get("content", ""))[:300]
            source = m.get("source", "")
            layer = m.get("layer", "")
            badge = layer or source
            why = m.get("why", "")
            detail = f"\n  原因: {why}" if why else ""
            lines.append(f"- **{title}** [{badge}]\n  {content}{detail}\n")

        print("".join(lines), end="")

    except Exception as e:
        # 钩子失败不应阻塞 Claude Code，静默退出
        sys.stderr.write(f"[auto_recall] error: {e}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
