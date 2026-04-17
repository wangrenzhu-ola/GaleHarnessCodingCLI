---
name: "hkt-memory"
description: "生产级长期记忆系统 v5.2.0，支持 L2→L1/L0 自动分层、MCP 协议、自动捕获与噪声过滤"
triggers:
  - memory
  - recall
  - store
  - retrieve
---

# HKT-Memory v5.2.0

> 自动分层长期记忆系统：L2 写入后自动触发 L1/L0 生成，支持 LLM 智能摘要、MCP 协议集成、Claude Code 钩子自动捕获与噪声过滤

## 核心特性

- **三层自动提取**：L2 存储后自动触发 L1/L0 生成
- **LLM 智能摘要**：结构化提取标题、要点、决策、行动项
- **混合检索**：向量相似度 + BM25 融合召回
- **Weibull 衰减**：基于访问频率/重要性的生命周期管理
- **多作用域隔离**：global/agent/project/user/session 维度
- **MCP 协议支持**：9+ 个 MCP 工具，兼容 Claude / Cursor 等客户端
- **Claude Code 钩子集成**：PreCompact 自动回忆、PostToolUse 自动捕获
- **噪声预过滤**：自动过滤问候语、确认词、纯 emoji 等低信息内容
- **REST API 语义端点**：`/store`、`/recall`、`/forget`、`/stats`

## 快速开始

```bash
# 设置 API Key（智谱AI，用于 LLM 摘要提取）
export ZHIPU_API_KEY="your-api-key"

# 存储记忆（自动三层）
uv run scripts/hkt_memory_v5.py store \
  --content "# 会议纪要\n\n讨论 API 设计，决定采用 RESTful" \
  --title "API设计评审" \
  --topic "meetings" \
  --layer all

# 检索记忆
uv run scripts/hkt_memory_v5.py retrieve --query "API设计" --layer all
```

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      HKT-Memory v5.0                        │
├─────────────────────────────────────────────────────────────┤
│  User Input                                                 │
│     │                                                       │
│     ▼                                                       │
│  ┌──────────────┐                                          │
│  │  Store L2    │ ◀── 完整内容存储                          │
│  └──────────────┘                                          │
│     │                                                       │
│     ▼                                                       │
│  ┌──────────────────┐                                      │
│  │  LayerTrigger    │ ◀── 自动触发器                        │
│  └──────────────────┘                                      │
│     │                                                       │
│     ├──▶ L1Extractor ──▶ 结构化摘要                         │
│     │                                                       │
│     └──▶ L0Extractor ──▶ 关键词 + 核心观点                   │
└─────────────────────────────────────────────────────────────┘

检索流程:
Query → Intent → QueryExpansion → Vector/BM25 → RRF Fusion → Cosine Re-score → Dedup/Guarantee → Lifecycle → MMR → Scope → Results
```

## 三层记忆

| 层 | 用途 | 内容 |
|----|------|------|
| **L0** | 最小索引 | 关键词、核心观点、来源引用 |
| **L1** | 结构化摘要 | 标题、一句话摘要、要点、决策、行动项、人员、主题、重要性 |
| **L2** | 完整内容 | 原始 Markdown 内容 |

## 命令参考

```bash
# 存储
uv run scripts/hkt_memory_v5.py store --content "..." --layer all
uv run scripts/hkt_memory_v5.py store --content "..." --layer L2    # 仅 L2

# 检索
uv run scripts/hkt_memory_v5.py retrieve --query "关键词" --layer all
uv run scripts/hkt_memory_v5.py retrieve --query "关键词" --layer L1

# 同步
uv run scripts/hkt_memory_v5.py sync --full       # 全量重建索引
uv run scripts/hkt_memory_v5.py rebuild           # 重建并压缩聚合文件

# 统计
uv run scripts/hkt_memory_v5.py stats

# 遗忘/恢复
uv run scripts/hkt_memory_v5.py forget --memory-id "xxx"
uv run scripts/hkt_memory_v5.py restore --memory-id "xxx"

# 重要性标记
uv run scripts/hkt_memory_v5.py pin --memory-id "xxx" --value true
uv run scripts/hkt_memory_v5.py importance --memory-id "xxx" --value high

# 反馈
uv run scripts/hkt_memory_v5.py feedback --label useful --memory-id "xxx"
uv run scripts/hkt_memory_v5.py feedback --label wrong --memory-id "xxx"

# 测试
uv run scripts/hkt_memory_v5.py test

# 启动 MCP HTTP 服务
uv run scripts/hkt_memory_v5.py serve --host 127.0.0.1 --port 8765
```

## MCP 与 REST API

HKT-Memory v5.2.0 内置 MCP HTTP 服务器，提供语义化 REST 端点：

```bash
curl -X POST http://localhost:8765/store \
  -H 'Content-Type: application/json' \
  -d '{"content":"会议纪要","topic":"meetings"}'

curl -X POST http://localhost:8765/recall \
  -H 'Content-Type: application/json' \
  -d '{"query":"API设计","layer":"all","limit":5}'

curl http://localhost:8765/stats
```

同时支持标准 MCP JSON-RPC 2.0 `stdio` 模式，可直接接入 Claude Code `--mcp-server` 配置。

## Claude Code 自动钩子

项目已包含 `.claude/settings.json` 配置，支持：

- **PreCompact**：会话压缩前自动调用 `auto_recall.py`，注入相关历史记忆
- **PostToolUse**：工具调用后自动调用 `auto_capture.py`，将新信息写入 `session:<id>` scope

## 触发条件（Claude Code Skills 集成）

| 触发条件 | 动作 |
|----------|------|
| 用户要求"记住/存档/沉淀"偏好、决策、约束 | `store --layer all` |
| 需要回忆历史上下文 | `retrieve --layer all` |
| 需要按主题聚合信息 | `store/retrieve --topic <topic>` |
| 需要全量重建索引与摘要 | `sync --full` |
| 需要检查健康状态 | `stats` |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ZHIPU_API_KEY` | 智谱 AI API Key | - |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `L1_EXTRACTOR_PROVIDER` | LLM 提供商 | `zhipu` |
| `HKT_MEMORY_DIR` | 记忆存储目录 | `memory` |
| `HKT_MEMORY_LIFECYCLE_ENABLED` | 启用生命周期 | `true` |
| `HKT_MAX_TOKENS` | auto_recall 输出 token 上限 | `512` |
| `HKT_QUERY` / `CLAUDE_CONTEXT` | auto_recall 查询词来源 | - |

## 项目结构

```
HKTMemory/
├── scripts/                    # CLI 入口
│   ├── hkt_memory_v5.py      # 主脚本
│   └── hkt_memory_v4.py      # 兼容 v4
├── layers/                     # 三层存储
│   ├── l0_abstract.py        # L0 抽象层
│   ├── l1_overview.py        # L1 概述层
│   ├── l2_full.py            # L2 完整层
│   └── manager_v5.py         # 分层管理器
├── extractors/                # 提取器
│   ├── l0_extractor.py       # L0 关键词提取
│   ├── l1_extractor.py      # L1 LLM 提取
│   └── trigger.py            # 层间触发器
├── retrieval/                 # 检索管道
│   ├── adaptive_retriever.py # 自适应查询分析
│   ├── hybrid_fusion.py      # 向量+BM25 融合
│   ├── bm25_index.py         # BM25 索引
│   └── mmr_diversifier.py    # MMR 多样性
├── lifecycle/                 # 生命周期
│   ├── memory_lifecycle.py   # 生命周期管理
│   ├── tier_manager.py       # 层 级 管理
│   └── weibull_decay.py      # Weibull 衰减模型
├── reranker/                  # 重排
├── scopes/                    # 作用域隔离
├── governance/                # 治理
│   ├── errors.py             # 错误跟踪
│   └── learnings.py          # 学习跟踪
├── vector_store/             # 向量存储
├── mcp/                      # MCP 协议服务
├── filters/                  # 噪声预过滤
├── hooks/                    # Claude Code 自动钩子
│   ├── auto_recall.py        # 自动回忆
│   └── auto_capture.py       # 自动捕获
├── tests/                    # 测试
└── config/                   # 配置
```

## 文档

- [README_v5.md](./README_v5.md) - 详细文档
- [API.md](./API.md) - API 参考
- [DESIGN.md](./DESIGN.md) - 架构设计
- [MIGRATION_v4_to_v5.md](./MIGRATION_v4_to_v5.md) - v4 迁移指南

## 版本

**当前版本**: v5.2.0
