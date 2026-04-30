# HKT-Memory v5.3.0 - 自动分层存储系统

> 修复了 v4 的核心问题：L2 写入后自动触发 L1/L0 生成，并新增面向 GaleHarnessCodingCLI 的结构化 task memory runtime

---

## ✅ 核心修复

| 问题 | v4 行为 | v5 修复 |
|------|---------|---------|
| **L1 不触发** | 需要 `session_id`/`project_id` | ✅ 自动从内容提取 |
| **L0 不触发** | 仅在 `layer=all` 时触发 | ✅ L2 后自动触发 |
| **摘要质量** | 简单截断 | ✅ LLM 智能提取 |
| **分层完整性** | 20% | ✅ 100% |

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      HKT-Memory v5.0                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Input                                                 │
│     │                                                       │
│     ▼                                                       │
│  ┌──────────────┐                                          │
│  │  Store L2    │ ◀── 完整内容存储到 daily/evergreen       │
│  └──────────────┘                                          │
│     │                                                       │
│     │ 触发                                                    │
│     ▼                                                       │
│  ┌──────────────────┐                                      │
│  │  LayerTrigger    │ ◀── 自动触发器                        │
│  │  - on_l2_stored  │                                      │
│  └──────────────────┘                                      │
│     │                                                       │
│     ├──▶ ┌─────────────┐                                   │
│     │    │ L1Extractor │ ◀── LLM/规则提取结构化摘要         │
│     │    └─────────────┘                                   │
│     │         │                                             │
│     │         ▼                                             │
│     │    topics/tools.md                                    │
│     │                                                       │
│     └──▶ ┌─────────────┐                                   │
│          │ L0Extractor │ ◀── 提取关键词 + 核心观点          │
│          └─────────────┘                                   │
│               │                                             │
│               ▼                                             │
│          topics/tools.md + index.md                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 环境设置

```bash
# 设置智谱 AI API Key（用于智能摘要）
export ZHIPU_API_KEY="your-api-key"

# 或使用 OpenAI
export OPENAI_API_KEY="your-api-key"
export L1_EXTRACTOR_PROVIDER="openai"
```

### 2. 存储记忆（自动三层）

```bash
cd /Users/wangrenzhu/work/MyBoss/.claude/skills/hkt-memory

uv run scripts/hkt_memory_v5.py store \
  --content "# 会议纪要\n\n讨论了 API 设计...\n\n## 决策\n- 采用 RESTful" \
  --title "API设计评审" \
  --topic "meetings" \
  --layer all
```

**输出**:
```
📝 存储记忆...
   Layer: all
   Topic: meetings
   
🔄 LayerTrigger: L2 存储完成，触发分层提取...
📋 Step 1/2: 提取 L1 摘要...
   ✅ L1 生成完成: l1-2026-04-08-1234
🔖 Step 2/2: 提取 L0 索引...
   ✅ L0 生成完成: l0-2026-04-08-5678

✅ 存储完成!
   L2: 2026-04-08-xxx
   L1: l1-2026-04-08-1234
   L0: l0-2026-04-08-5678
```

### 3. 检索记忆

```bash
uv run scripts/hkt_memory_v5.py retrieve \
  --query "API设计" \
  --layer all \
  --min-similarity 0.35 \
  --vector-weight 0.7 \
  --bm25-weight 0.3 \
  --debug
```

- 默认使用工业级混合检索 pipeline：意图识别 →（可选）查询扩展 → Vector/BM25 并行召回 → RRF 融合 → Cosine 精排 → 去重/保证摘要 → 生命周期排序
- `retrieval.fusion_method` 默认 `rrf`，当未配置 embedding Key 或向量库不可用时自动降级为 `weighted`（仅 BM25 / 旧权重融合路径）
- `--debug` 会输出融合方法、扩展查询、命中解释等信息

### 4. 全量同步（迁移旧数据）

```bash
uv run scripts/hkt_memory_v5.py sync --full
```

---

## 📂 文件结构

```
memory/
├── L0-Abstract/
│   ├── index.md              # 主索引（表格 + 列表）
│   └── topics/
│       ├── meetings.md       # 按主题聚合
│       └── tools.md
├── L1-Overview/
│   ├── index.md              # 主题列表
│   └── topics/
│       ├── meetings.md       # 结构化摘要
│       │   ### API设计评审
│       │   - **时间**: 2026-04-08
│       │   - **摘要**: ...
│       │   - **重要性**: high
│       │   **关键要点**:
│       │   - 要点1
│       │   - 要点2
│       │   **决策记录**:
│       │   - 采用 RESTful
│       │   **行动项**:
│       │   - [ ] 编写文档 (@张三, 明天)
│       └── tools.md
├── L2-Full/
│   ├── daily/                # 完整 Markdown
│   ├── evergreen/
│   └── episodes/
└── layer_relationships.json  # 层间关系映射
```

---

## 📋 L1 摘要结构

使用 LLM 提取以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 标题 | "API设计评审" |
| `summary` | 一句话摘要 | "讨论订单API设计方案" |
| `key_points` | 关键要点（5条） | ["采用 RESTful", "使用 JWT"] |
| `decisions` | 决策记录 | ["确定使用 PostgreSQL"] |
| `action_items` | 行动项 | [{"task": "写文档", "owner": "张三", "due": "明天"}] |
| `people` | 涉及人员 | ["张三", "李四"] |
| `topics` | 主题标签 | ["api", "设计"] |
| `importance` | 重要性 | high/medium/low |

---

## 🔧 命令参考

```bash
# 存储
hkt_memory_v5.py store --content "..." --layer all
hkt_memory_v5.py store --content "..." --layer L2    # 仅 L2
hkt_memory_v5.py store --content "..." --topic tools

# 检索
hkt_memory_v5.py retrieve --query "关键词"
hkt_memory_v5.py retrieve --query "关键词" --layer L1
hkt_memory_v5.py retrieve --query "关键词" --topic meetings

# 同步
hkt_memory_v5.py sync              # 增量同步
hkt_memory_v5.py sync --full       # 全量重新生成
hkt_memory_v5.py rebuild           # 物理重建并压缩 L0/L1 聚合文件

# 统计
hkt_memory_v5.py stats

# 遗忘
hkt_memory_v5.py forget --memory-id "2026-04-09-120000"
hkt_memory_v5.py forget --memory-id "2026-04-09-120000" --force

# 恢复
hkt_memory_v5.py restore --memory-id "2026-04-09-120000"

# 清理事件
hkt_memory_v5.py cleanup --dry-run
hkt_memory_v5.py cleanup --scope "topic:tools"

# pinned / importance
hkt_memory_v5.py pin --memory-id "2026-04-09-120000" --value true
hkt_memory_v5.py importance --memory-id "2026-04-09-120000" --value high

# feedback hooks
hkt_memory_v5.py feedback --label useful --memory-id "2026-04-09-120000" --topic tools
hkt_memory_v5.py feedback --label wrong --memory-id "2026-04-09-120000" --topic tools
hkt_memory_v5.py feedback --label missing --topic tools --query "部署窗口"

# 统一产物写入（governed / compound）
hkt_memory_v5.py ingest-artifact --source-mode governed --artifact-type spec --artifact-id change-123 --source-uri openspec/changes/update/spec.md --content-file openspec/changes/update/spec.md
hkt_memory_v5.py ingest-artifact --source-mode compound --artifact-type implementation --artifact-id closeout-123 --source-uri https://example.com/pr/123 --content "实施总结..."

# GaleHarnessCodingCLI task memory runtime
hkt_memory_v5.py task-recall --envelope-file task-envelope.json --limit 5 --token-budget 1200
hkt_memory_v5.py task-capture --event-file capture-event.json
hkt_memory_v5.py task-ledger --task-id "task-123" --limit 20
hkt_memory_v5.py task-trace --task-id "task-123"

# 冲突扫描（输出 MEMORY_CONFLICT.md）
hkt_memory_v5.py conflict-scan
hkt_memory_v5.py conflict-scan --output /tmp/MEMORY_CONFLICT.md

# 测试
hkt_memory_v5.py test
```

每周扫描建议（cron/CI）:

```bash
0 3 * * 1 cd /path/to/HKTMemory && uv run scripts/hkt_memory_v5.py --memory-dir memory conflict-scan
```

---

## 🆚 v4 vs v5 对比

| 维度 | v4 | v5 |
|------|-----|-----|
| **L1/L0 生成** | ❌ 手动/条件触发 | ✅ 自动触发 |
| **摘要质量** | ⭐⭐ 截断 | ⭐⭐⭐⭐⭐ LLM提取 |
| **完整性** | 20% | 100% |
| **使用门槛** | 低 | 中（需 API Key）|
| **存储耗时** | ~100ms | ~2-5s |
| **向后兼容** | - | ✅ 保留 v4 文件 |

---

## 🧠 GaleHarnessCodingCLI Task Memory Runtime

v5.3.0 增加 `gale-task-memory.v1` JSON contract，用于把 HKTMemory 接入 GaleHarnessCodingCLI 的真实研发动作。

| 命令 | 用途 |
|------|------|
| `task-recall` | 根据当前 mode、repo、branch、task、issue、PR 和文件范围召回非信任 memory evidence |
| `task-capture` | 按结构化事件写入决策、失败路径、验证结果、代码审查发现和后续行动 |
| `task-ledger` | 读取 task-scoped hot ledger，供同一研发任务低延迟复用 |
| `task-trace` | 输出轻量任务轨迹摘要，方便审查一次任务链路 |

capture event 不只是 `store(content)`，而是带 `task_id`、`skill`、`phase`、`branch`、`pr_id`、`files_touched`、`confidence`、`verification` 等字段的结构化研发事件。所有 task runtime 命令默认输出 JSON，适合 Gale 或其他 agent runtime 直接消费。

---

## 📁 文件清单

```
.claude/skills/hkt-memory/
├── scripts/
│   ├── hkt_memory_v5.py      # 主脚本（新）
│   └── hkt_memory_v4.py      # 原脚本（保留）
├── layers/
│   ├── manager_v5.py         # 分层管理器（新）
│   └── manager.py            # 原管理器（保留）
├── extractors/               # 提取器（新）
│   ├── __init__.py
│   ├── l1_extractor.py       # L1 LLM提取
│   ├── l0_extractor.py       # L0 关键词提取
│   └── trigger.py            # 层间触发器
├── runtime/
│   ├── orchestrator.py       # recall 编排
│   └── task_memory.py        # Gale task memory contract
├── session/
│   └── task_ledger.py        # task-scoped hot ledger
├── MIGRATION_v4_to_v5.md     # 迁移指南
└── README_v5.md              # 本文件
```

---

## ⚠️ 注意事项

1. **API Key**: v5 使用 LLM 提取需要 API Key（智谱/OpenAI/MiniMax）
2. **成本**: 每次存储 L2 会调用一次 LLM（约 1000-2000 tokens）
3. **Fallback**: 无 API Key 时使用规则提取，质量稍低但仍可用
4. **兼容性**: v5 生成的文件与 v4 不冲突，可以共存
5. **聚合压缩**: `forget`/`restore` 会自动重建 L0/L1，`rebuild` 可手动执行全量压缩
6. **反馈治理**: `useful`/`wrong`/`missing` 会同时影响排序、裁剪保护与治理记录

---

## 🔮 未来计划

- [ ] 增量更新（只更新变化的 L2）
- [ ] 自定义提取 Prompt
- [ ] 多语言支持
- [ ] Web 可视化界面

---

*版本: v5.3.0*
*日期: 2026-04-24*
