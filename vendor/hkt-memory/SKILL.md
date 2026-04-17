---
name: "hkt-memory"
description: "生产级长期记忆系统 v5.0，支持 L2→L1/L0 自动分层与智能摘要提取"
triggers:
  - memory
  - recall
  - store
  - retrieve
---

# HKT-Memory v5.0

> 自动分层存储：L2 写入后触发 L1/L0 生成  
> 核心闭环：存储 → 分层提取 → 检索

## Quick Reference

| 触发条件 | 动作 |
|----------|------|
| 用户要求“记住/存档/沉淀”偏好、决策、约束 | 执行 `store --layer all`，自动写入三层 |
| 需要回忆历史上下文 | 执行 `retrieve --layer all` |
| 需要按主题聚合信息 | 执行 `store/retrieve --topic <topic>` |
| 需要全量重建索引与摘要 | 执行 `sync --full` |
| 需要检查健康状态 | 执行 `stats` |

## 30秒上手

```bash
cd .claude/skills/hkt-memory
bash install.sh

uv run scripts/hkt_memory_v5.py store \
  --content "用户偏好使用 Python" \
  --title "开发偏好" \
  --topic "preferences" \
  --layer all

uv run scripts/hkt_memory_v5.py retrieve \
  --query "Python 偏好" \
  --layer all
```

## 核心命令

```bash
uv run scripts/hkt_memory_v5.py store --content "..." --layer all
uv run scripts/hkt_memory_v5.py retrieve --query "..." --layer all
uv run scripts/hkt_memory_v5.py sync --full
uv run scripts/hkt_memory_v5.py stats
uv run scripts/hkt_memory_v5.py test
```

## AGENTS.md 集成

```markdown
## 记忆集成 (HKT-Memory v5.0)

对话前检索:
uv run scripts/hkt_memory_v5.py retrieve --query "<当前话题>" --layer all --limit 3

对话后存储:
uv run scripts/hkt_memory_v5.py store --content "<关键决策>" --title "<标题>" --layer all
```

## 文档

- [README_v5.md](./README_v5.md)
- [API.md](./API.md)
- [MIGRATION_v4_to_v5.md](./MIGRATION_v4_to_v5.md)

**当前版本**: v5.0
