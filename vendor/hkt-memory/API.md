# HKT-Memory v5.0 API 参考

> v5 默认入口：`uv run scripts/hkt_memory_v5.py`

---

## 全局

```bash
uv run scripts/hkt_memory_v5.py <command> [options]
```

全局参数：

```bash
--memory-dir <path>                     # 默认 memory
--llm-provider <zhipu|openai|minimax>   # 默认 zhipu
```

---

## store - 存储记忆

```bash
uv run scripts/hkt_memory_v5.py store \
  --content "..."           # 记忆内容 (必需)
  --title "..."             # 标题（可选）
  --topic "general"         # 主题（可选）
  --layer all               # L0/L1/L2/all，默认 all
  --importance medium       # high/medium/low
  --pinned                  # 创建后立即 pin
  --no-extract              # layer=all 时禁用自动提取
```

### 示例

```bash
uv run scripts/hkt_memory_v5.py store \
  --content "# API设计评审\n\n决定采用 RESTful" \
  --title "API设计评审" \
  --topic "meetings" \
  --layer all
```

---

## retrieve - 检索记忆

```bash
uv run scripts/hkt_memory_v5.py retrieve \
  --query "..."             # 查询文本 (必需)
  --layer all               # L0/L1/L2/all
  --topic "meetings"        # 主题过滤（可选）
  --limit 10                # 返回数量
  --min-similarity 0.35     # 向量召回阈值（可选）
  --vector-weight 0.7       # 向量权重（可选）
  --bm25-weight 0.3         # BM25 权重（可选）
  --debug                   # 输出命中解释（可选）
```

### 示例

```bash
uv run scripts/hkt_memory_v5.py retrieve \
  --query "RESTful 决策" \
  --layer all \
  --limit 5
```

- 默认走混合召回：L2 先合并向量相似度结果与关键词结果，再映射回 L1/L0
- 可用 `--min-similarity` 控制向量候选过滤，用 `--vector-weight` / `--bm25-weight` 调整最终排序
- `--debug` 会输出每条结果的 hybrid/vector/BM25/match/lifecycle 分数与命中原因
- 只有在配置了 `HKT_MEMORY_API_KEY` / `HKT_MEMORY_BASE_URL` / `HKT_MEMORY_MODEL` 且向量库可用时，才会启用向量部分
- 若向量库不可用，系统会自动退回到本地文本检索

---

## sync - 层级同步

```bash
uv run scripts/hkt_memory_v5.py sync
uv run scripts/hkt_memory_v5.py sync --full
```

- `sync`：增量同步
- `sync --full`：全量重建 L1/L0

---

## stats - 统计信息

```bash
uv run scripts/hkt_memory_v5.py stats
```

---

## forget - 软删除/硬删除

```bash
uv run scripts/hkt_memory_v5.py forget \
  --memory-id "2026-04-09-120000"

uv run scripts/hkt_memory_v5.py forget \
  --memory-id "2026-04-09-120000" \
  --force
```

- 默认执行 soft-delete，状态变为 `disabled`
- `--force` 执行硬删除，同时删除 L2 原始记录与向量索引

---

## restore - 恢复记忆

```bash
uv run scripts/hkt_memory_v5.py restore \
  --memory-id "2026-04-09-120000"
```

- 将 `disabled` 或 `archived` 记忆恢复为 `active`

---

## cleanup - 清理效果事件

```bash
uv run scripts/hkt_memory_v5.py cleanup --dry-run
uv run scripts/hkt_memory_v5.py cleanup --scope "topic:tools"
```

- 仅清理效果事件日志，不删除正文记忆
- 默认按 `lifecycle.effectivenessEventsDays` 执行 TTL 清理
- `--dry-run` 只输出预计清理结果

---

## pin - 设置 pinned

```bash
uv run scripts/hkt_memory_v5.py pin \
  --memory-id "2026-04-09-120000" \
  --value true
```

---

## importance - 设置重要性

```bash
uv run scripts/hkt_memory_v5.py importance \
  --memory-id "2026-04-09-120000" \
  --value high
```

---

## feedback - useful / wrong / missing

```bash
uv run scripts/hkt_memory_v5.py feedback \
  --label useful \
  --memory-id "2026-04-09-120000" \
  --topic "tools" \
  --query "部署窗口" \
  --note "命中正确"

uv run scripts/hkt_memory_v5.py feedback \
  --label missing \
  --topic "tools" \
  --query "部署窗口" \
  --note "还缺审批流"
```

- `useful` / `wrong` 会直接写入对应记忆的反馈统计并参与排序与 prune
- `missing` 会按 scope 记录缺口压力，并提升该 scope 的后续召回优先级
- `wrong` / `missing` 会同步写入治理错误记录，`useful` 会同步写入学习记录

---

## rebuild - 物理重建与压缩聚合

```bash
uv run scripts/hkt_memory_v5.py rebuild
uv run scripts/hkt_memory_v5.py rebuild --include-archived
```

- 清空并重建 `L0-Abstract/`、`L1-Overview/` 与 `layer_relationships.json`
- 默认仅基于当前可见的 active 记忆重建，实现聚合文件物理压缩

---

## test - 端到端测试

```bash
uv run scripts/hkt_memory_v5.py test
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `HKT_MEMORY_DIR` | 记忆存储目录 | `memory` |
| `L1_EXTRACTOR_PROVIDER` | L1 提取 Provider | `zhipu` |
| `ZHIPU_API_KEY` | 智谱 API Key | - |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `MINIMAX_API_KEY` | MiniMax API Key | - |
| `HKT_MEMORY_LIFECYCLE_ENABLED` | 是否启用生命周期治理 | `true` |
| `HKT_MEMORY_EFFECTIVENESS_EVENTS_DAYS` | 效果事件保留天数 | `90` |
| `HKT_MEMORY_MAX_ENTRIES_PER_SCOPE` | 单 scope 活跃记忆上限 | `3000` |

---

## 兼容说明

- `scripts/hkt_memory_v4.py` 作为历史兼容入口保留
- v4 的 `bm25/test-retrieval/learn/error/maintenance/mcp/auto` 不属于 v5 主命令面
- 如需迁移旧命令，请参考 [MIGRATION_v4_to_v5.md](./MIGRATION_v4_to_v5.md)
