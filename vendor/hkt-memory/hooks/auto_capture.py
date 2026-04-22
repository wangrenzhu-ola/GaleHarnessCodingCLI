#!/usr/bin/env python3
"""
auto_capture.py — Claude Code PostToolUse hook

工具调用结束后自动捕获内容写入 session scope 记忆。
在 --promote 模式下，将 session scope 提升至 user scope。

环境变量:
    HKT_CONTENT        当前轮次内容（PostToolUse 时由钩子提供）
    HKT_SESSION_ID     会话 ID（用于 scope 命名）
    HKT_MEMORY_DIR     记忆存储目录（默认: ./memory）
    HKT_TOPIC          主题标签（默认: session）

命令行参数:
    --promote           将 session scope 记忆提升到 user scope（会话结束时触发）
"""

import argparse
import os
import sys
from pathlib import Path

_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


def main():
    parser = argparse.ArgumentParser(description="HKTMemory auto-capture hook")
    parser.add_argument("--promote", action="store_true",
                        help="提升 session scope 记忆到 user scope（会话结束时触发）")
    args = parser.parse_args()

    memory_dir = os.environ.get("HKT_MEMORY_DIR", "memory")
    session_id = os.environ.get("HKT_SESSION_ID", "default")
    topic = os.environ.get("HKT_TOPIC", "session")

    try:
        from config.loader import ConfigLoader
        from layers.manager_v5 import LayerManagerV5

        config = ConfigLoader(_ROOT).load()
        auto_capture_cfg = config.get("automation", {}).get("auto_capture", {})
        if not auto_capture_cfg.get("enabled", True):
            sys.exit(0)

        layers = LayerManagerV5(Path(memory_dir), config=config)

        if args.promote:
            _promote_session(layers, session_id)
        else:
            _capture(layers, session_id, topic, auto_capture_cfg)

    except Exception as e:
        sys.stderr.write(f"[auto_capture] error: {e}\n")
        sys.exit(0)


def _capture(layers, session_id: str, topic: str, cfg: dict):
    content = os.environ.get("HKT_CONTENT", "").strip()
    if not content:
        return

    max_chars = cfg.get("max_chars", 2000)
    if len(content) > max_chars:
        content = content[:max_chars]

    result = layers.store_session_transcript(
        content=content,
        session_id=session_id,
        topic=topic,
        task_id=os.environ.get("HKT_TASK_ID"),
        project=os.environ.get("HKT_PROJECT"),
        branch=os.environ.get("HKT_BRANCH"),
        pr_id=os.environ.get("HKT_PR_ID"),
        source="auto_capture",
        source_mode=os.environ.get("HKT_SOURCE_MODE", "direct"),
    )

    # 将 filter 信息写到 stderr 供调试
    if result.get("filtered"):
        sys.stderr.write(f"[auto_capture] filtered: {result.get('reason')}\n")


def _promote_session(layers, session_id: str):
    """将 session:<id> scope 中 importance>medium 的记忆复制到 user scope"""
    scope = f"session:{session_id}"
    manifest = layers.lifecycle._manifest

    promoted = 0
    for memory_id, entry in manifest.items():
        if entry.get("scope") != scope:
            continue
        if entry.get("status") != "active":
            continue
        importance = entry.get("importance", "medium")
        if importance not in ("high",):
            continue

        # 读取 L2 内容并以 user scope 重新存储
        try:
            l2_entry = layers.l2.get_entry(memory_id)
            if not l2_entry:
                continue
            content = l2_entry.get("content", "")
            if not content:
                continue
            layers.store(
                content=content,
                title=l2_entry.get("title", ""),
                topic=l2_entry.get("topic", "session"),
                layer="L2",
                metadata={"scope": "user", "source": "promoted_from_session"},
                auto_extract=False,
            )
            promoted += 1
        except Exception as e:
            sys.stderr.write(f"[auto_capture] promote error for {memory_id}: {e}\n")

    sys.stdout.write(f"[auto_capture] promoted {promoted} memories from {scope} to user scope\n")


if __name__ == "__main__":
    main()
