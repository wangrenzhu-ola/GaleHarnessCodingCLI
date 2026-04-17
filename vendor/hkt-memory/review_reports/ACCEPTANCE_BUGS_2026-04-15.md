# HKTMemory v5.2.0 验收 Bug 单

**创建日期**: 2026-04-15  
**来源**: `feat/openvikings-agent-gaps` 分支最终验收  
**结论摘要**: 当前状态为 `PARTIAL PASS`，存在 6 个需外部 agent 修复的问题，其中 5 个建议按 `BLOCKER/HIGH` 优先级优先处理。

---

## BUG-ACC-001 全量 pytest 收集失败

**优先级**: `BLOCKER`  
**类型**: 健康检查 / 测试基础设施

**现象**:
- 运行 `uv run python -m pytest tests -q` 时，在收集阶段直接失败，无法进入用例执行。

**实际结果**:
- `tests/test_layers.py` 导入失败：`cannot import name 'LayerManager' from 'layers'`
- `retrieval/bm25_index.py` 存在语法错误：`closing parenthesis ']' does not match opening parenthesis '{'`

**复现步骤**:
```bash
cd /Users/wangrenzhu/work/HKTMemory
uv run python -m pytest tests -q
```

**定位文件**:
- `layers/__init__.py`
- `tests/test_layers.py`
- `retrieval/bm25_index.py`

**预期结果**:
- 全量 `pytest` 至少能完成收集，不应在 import/syntax 阶段失败。

**修复建议**:
- 修复 `retrieval/bm25_index.py` 中 `get_stats()` 的括号错误。
- 决定 `tests/test_layers.py` 是应兼容旧 API 还是升级到 `LayerManagerV5`。
- 修复后重新执行：
```bash
uv run python -m pytest tests -q
```

**验收标准**:
- `uv run python -m pytest tests -q` 退出码为 `0`

---

## BUG-ACC-002 REST `/recall` 无法召回刚存储记忆

**优先级**: `BLOCKER`  
**类型**: REST API / 检索主链路

**现象**:
- `POST /store` 成功返回 `success: true`
- 紧接着 `POST /recall` 查询刚存储内容，返回空列表

**复现步骤**:
```bash
python scripts/hkt_memory_v5.py --memory-dir /Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory serve --host 127.0.0.1 --port 8765
```

```bash
python - <<'PY'
import json, urllib.request

base = "http://127.0.0.1:8765"

store_payload = {
    "content": "张三是工程师。该事实有效期至 2024-01-01。",
    "title": "张三职业信息",
    "topic": "people"
}
req = urllib.request.Request(base + "/store", data=json.dumps(store_payload).encode(), headers={"Content-Type": "application/json"})
print(urllib.request.urlopen(req).read().decode())

recall_payload = {
    "query": "张三 工程师",
    "layer": "all",
    "limit": 5
}
req = urllib.request.Request(base + "/recall", data=json.dumps(recall_payload).encode(), headers={"Content-Type": "application/json"})
print(urllib.request.urlopen(req).read().decode())
PY
```

**实际结果**:
- `/store` 返回成功
- `/recall` 返回：
```json
{"result":{"count":0,"results":[],"success":true},"success":true,"tool":"memory_recall"}
```

**定位文件**:
- `mcp/server.py`
- `mcp/tools.py`
- `layers/manager_v5.py`
- `vector_store/store.py`

**预期结果**:
- 刚存储的记忆应能通过语义或关键词检索召回。

**修复建议**:
- 检查 `memory_store -> vector_store.add -> memory_recall/progressive_retrieve` 的端到端链路。
- 验证 `memory_recall(layer="all")` 的 flatten 逻辑是否丢失结果。
- 修复后补一个真实 HTTP 回归测试。

**验收标准**:
- 新存储的测试记忆可以通过 `/recall` 返回至少 1 条命中。

---

## BUG-ACC-003 噪声过滤未体现在 `stats.filter_count`

**优先级**: `HIGH`  
**类型**: Auto-Capture / 生命周期统计

**现象**:
- `auto_capture.py` 对问候语成功过滤
- 但之后 `stats` 中 `filter_count` 仍为 `0`

**复现步骤**:
```bash
HKT_MEMORY_DIR=/Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory \
HKT_SESSION_ID=acceptance1 \
HKT_TOPIC=hooks \
HKT_CONTENT='你好' \
python hooks/auto_capture.py
```

```bash
python scripts/hkt_memory_v5.py --memory-dir /Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory stats
```

**实际结果**:
- hook 输出：
```text
[auto_capture] filtered: content matches noise filter rules
```
- 但 `stats` 显示：
```text
filter_count: 0
```

**定位文件**:
- `hooks/auto_capture.py`
- `layers/manager_v5.py`
- `lifecycle/memory_lifecycle.py`

**预期结果**:
- 被过滤的内容应累积到 `stats.filter_count`。

**修复建议**:
- 当前更像进程内计数，建议将 `filter_count` 持久化到 lifecycle state。
- 增加跨进程回归测试，覆盖 “hook 进程执行后 stats 仍可看到 filter_count 增量”。

**验收标准**:
- 问候语过滤后，`filter_count >= 1`

---

## BUG-ACC-004 Knowledge Graph 实体检索未生效

**优先级**: `BLOCKER`  
**类型**: 知识图谱 / 实体索引

**现象**:
- 存储带实体的记忆后，`retrieve --entity 张三` 返回空结果
- `entity_index.db` 中 `total_triples` 为 `0`

**复现步骤**:
```bash
python scripts/hkt_memory_v5.py --memory-dir /Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory store \
  --content '张三是工程师，负责平台架构设计。该事实有效期至 2024-01-01。' \
  --title '张三实体测试' \
  --topic people \
  --layer all
```

```bash
python scripts/hkt_memory_v5.py --memory-dir /Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory retrieve \
  --query '张三' \
  --entity 张三 \
  --layer all \
  --limit 5
```

**实际结果**:
- 三层写入成功
- 按实体检索结果全部为 `0`
- 直接检查 `EntityIndex`：
```python
{'total_triples': 0, 'distinct_subjects': 0, 'distinct_objects': 0}
```

**定位文件**:
- `extractors/l1_extractor.py`
- `extractors/trigger.py`
- `layers/manager_v5.py`
- `graph/entity_index.py`

**预期结果**:
- 至少生成一条与 “张三” 相关的 triple
- `retrieve --entity 张三` 能返回对应 L2/L1/L0 结果

**修复建议**:
- 重点核查 `_triples` 是否从 `extractors/trigger.py` 传到了 `manager_v5._process_extraction_metadata()`
- 为三元组写入补端到端测试，不要只测 extractor 输出
- 同时验证过期字段 `valid_until` 的持久化与 `⚠️ 已过期` 标记

**验收标准**:
- `EntityIndex.get_stats()["total_triples"] >= 1`
- `retrieve --entity 张三` 至少返回 1 条结果

---

## BUG-ACC-005 SQLite backend 基准不达标，且 `sync` 总体返回失败

**优先级**: `HIGH`  
**类型**: 向量后端 / 性能

**现象**:
- 临时切换 `config/default.json` 为 `"vector_backend": "sqlite"` 后，`sync --rebuild-index` 能重建索引
- 但命令总体结果仍是 `success: False`
- 当前小数据集下实测 `P95 ≈ 609ms`

**复现步骤**:
1. 将 `config/default.json` 的 `storage.vector_backend` 临时改为 `sqlite`
2. 运行：
```bash
HKT_MEMORY_FORCE_LOCAL=false \
HKT_MEMORY_API_KEY="..." \
HKT_MEMORY_BASE_URL="https://open.bigmodel.cn/api/paas/v4/" \
HKT_MEMORY_MODEL="embedding-3" \
python scripts/hkt_memory_v5.py --memory-dir /Users/wangrenzhu/work/HKTMemory/.tmp_acceptance_memory sync --rebuild-index
```
3. 再执行 20 次 `retrieve(query='API 设计决策', layer='all', limit=5)`，记录 P95

**实际结果**:
- 输出：
```text
success: False
message: 增量同步暂未实现
rebuild_index: {'success': True, 'added': 3}
```
- backend 类为 `SQLiteVectorBackend`
- `p95_ms ≈ 609.03`

**定位文件**:
- `config/default.json`
- `scripts/hkt_memory_v5.py`
- `layers/manager_v5.py`
- `vector_store/sqlite_backend.py`

**预期结果**:
- `sync --rebuild-index` 整体应成功
- SQLite backend 的 P95 延迟应明显下降，至少不应在当前小数据集上维持 600ms 级别

**修复建议**:
- 先解决 `sync()` 外层 success 判定
- 分析性能瓶颈是在 embedding、brute-force 搜索、重复初始化还是 Python 层逻辑
- 若无 faiss，至少要避免重复重建/重复连接造成的额外开销

**验收标准**:
- `sync --rebuild-index` 退出结果为成功
- 输出稳定包含 SQLite backend 生效证据
- P95 明显下降，并补一份 benchmark 结果

---

## BUG-ACC-006 `uv run ... serve` 直接启动缺少 Flask 依赖

**优先级**: `HIGH`  
**类型**: 运行环境 / 依赖声明

**现象**:
- 按验收提示词直接执行：
```bash
uv run scripts/hkt_memory_v5.py serve --port 8765
```
- 启动失败，报错 `ModuleNotFoundError: No module named 'flask'`

**定位文件**:
- `scripts/hkt_memory_v5.py`
- `mcp/server.py`

**预期结果**:
- 干净环境下可以按 README/验收提示直接启动 HTTP server

**修复建议**:
- 把 `flask` 纳入脚本依赖或项目依赖声明
- 确保 `uv run scripts/hkt_memory_v5.py serve` 无需额外手工装包

**验收标准**:
- 在干净环境执行 `uv run scripts/hkt_memory_v5.py serve --port 8765` 可直接启动

---

## 建议修复顺序

1. `BUG-ACC-001` 全量 pytest 收集失败
2. `BUG-ACC-002` `/recall` 无法召回刚存储记忆
3. `BUG-ACC-004` Knowledge Graph 实体检索未生效
4. `BUG-ACC-003` `filter_count` 不持久
5. `BUG-ACC-006` `serve` 缺少 Flask 依赖
6. `BUG-ACC-005` SQLite backend 成功态与性能优化

---

## 外部 Agent 完成标准

- 修复全部 6 个 bug
- 不回退已通过能力：
  - `tests/test_mcp_integration.py` 继续通过
  - `tests/test_memory_lifecycle.py` 继续通过
  - `POST /forget` 默认保持软删除语义
  - `auto_recall.py` 对问候语继续静默
  - `feedback --label useful` 在 `access_count >= 3` 后继续生成 `SKILLS.md`
