# HKT-Memory 检索改造测试报告

## 测试范围

- 相似度阈值：验证 `retrieve --min-similarity`
- 混合权重：验证向量分与 BM25 分共同参与排序
- 命中解释：验证 `retrieve --debug`
- 存储与召回：验证 L2 写入、L1/L0 聚合、向量库写入与统计输出

## 代码变更摘要

- 在 `retrieve` 主链路增加相似度阈值、向量/BM25 权重与 debug 输出
- 在 L0/L1/L2 文本检索中接入 BM25 风格 lexical 分数
- 在全局排序中增加 `_hybrid_score`
- 在 CLI 中增加：
  - `--min-similarity`
  - `--vector-weight`
  - `--bm25-weight`
  - `--debug`

## 自动化测试

### 1. 定向回归测试

命令：

```bash
uv run pytest tests/test_memory_lifecycle.py
```

结果：

- 7/7 通过
- 总耗时：19.43s

覆盖点：

- 生命周期软删除 / 恢复 / 硬删除
- prune 与 cleanup
- pin / importance / feedback / rebuild
- 长 query token overlap 命中
- 混合召回回流到 L0/L1/L2
- 相似度阈值过滤低分向量候选
- debug 输出与权重排序切换

### 2. 全量测试现状

命令：

```bash
uv run pytest
```

结果：

- 收集阶段失败，非本次改动主链路错误
- 失败点：
  - `tests/test_layers.py` 依赖 `layers.LayerManager` 导出，但当前 `layers/__init__.py` 未暴露该符号
  - `tests/test_retrieve_scope_and_hybrid.py` 通过 `scripts/hkt_memory_v4.py` 引用 `hkt_memory_v5`，导入路径本身不成立

结论：

- 本次新改动的定向回归测试通过
- 仓库全量测试仍有历史遗留收集问题，需要单独修复旧测试入口

## CLI 冒烟测试

测试环境：

- `HKT_MEMORY_FORCE_LOCAL=false`
- `HKT_MEMORY_API_KEY` 已配置
- `HKT_MEMORY_BASE_URL=https://open.bigmodel.cn/api/paas/v4/`
- `HKT_MEMORY_MODEL=embedding-3`
- 临时目录：`/tmp/hktmemory-report.yqfpM9`

### 1. 存储验证

写入 2 条记忆：

1. `会议纪要助手`
2. `语音转文字工具`

结果：

- 2 条 L2 写入成功
- 2 条 L1 摘要生成成功
- 2 条 L0 索引生成成功
- 向量库写入 2 条 `L2` 向量

### 2. 默认混合召回验证

命令：

```bash
uv run scripts/hkt_memory_v5.py --memory-dir "/tmp/hktmemory-report.yqfpM9" retrieve \
  --query "语音转文字 工具" \
  --layer all \
  --limit 3 \
  --debug
```

结果摘要：

- L0 / L1 / L2 各返回 2 条结果
- Top1 均为 `语音转文字工具`
- Top1 分数：
  - `hybrid=0.7932`
  - `vector=0.7045`
  - `bm25=1.0000`
  - `match=21.0000`
- Top2 `会议纪要助手` 只有向量命中：
  - `hybrid=0.3751`
  - `vector=0.5358`
  - `bm25=0.0000`

结论：

- BM25 与向量分已同时生效
- 纯 lexical 强命中的记忆被正确排到首位
- 只有语义相近但无 lexical 命中的记忆仍可被召回

### 3. 相似度阈值验证

命令：

```bash
uv run scripts/hkt_memory_v5.py --memory-dir "/tmp/hktmemory-report.yqfpM9" retrieve \
  --query "口述转文档 助手" \
  --layer all \
  --limit 3 \
  --debug \
  --min-similarity 0.6
```

结果摘要：

- L0 / L1 / L2 各返回 1 条结果
- Debug 显示：
  - `vector raw_hits=2`
  - `returned_hits=1`
  - `filtered_by_similarity: 2026-04-09-182207:0.5507`

结论：

- 向量阈值已生效
- 低于阈值的语义候选会在 L2 入口被剔除，不再回流到 L1/L0

### 4. 统计验证

命令：

```bash
uv run scripts/hkt_memory_v5.py --memory-dir "/tmp/hktmemory-report.yqfpM9" stats
```

结果：

- L0：
  - `total_topics: 1`
  - `total_entries: 2`
- L1：
  - `topics_files: 1`
  - `total_topic_entries: 2`
- L2：
  - `total_daily_entries: 2`
- vector_store：
  - `total_vectors: 2`
  - `by_layer: {'L2': 2}`
  - `embedding_dimensions: 2048`
  - `embedding_model: embedding-3`
- lifecycle：
  - `total_memories: 2`
  - `statuses.active: 2`

结论：

- 存储、聚合、向量写入、统计链路均正常

## 综合结论

- `retrieve --min-similarity` 已可控地过滤低质量向量候选
- `retrieve --vector-weight` / `--bm25-weight` 已接入主排序链路
- `retrieve --debug` 已能解释命中原因与关键分数
- 真实 CLI 冒烟验证显示：记忆存储、L0/L1/L2 回流、向量召回与统计输出正常
- 当前剩余问题是仓库内旧测试入口存在历史导入错误，不属于本次检索改造主链路回归失败
