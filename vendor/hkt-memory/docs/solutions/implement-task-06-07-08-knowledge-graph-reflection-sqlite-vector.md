# TASK-06/07/08 实现总结：知识图谱 MVP、反射管道与 SQLite 向量后端

**文档版本**: 1.0
**生成日期**: 2026-04-15
**对应需求**: GAP-04, GAP-07, GAP-08
**状态**: 已完成，All 34 tests pass

---

## 1. 目标回顾

本次迭代围绕 HKTMemory v5 的三个核心能力提升：

- **TASK-06 (GAP-04)**: 在 L1 提取阶段自动抽取实体关系三元组，建立轻量 SQLite 索引，支持按实体名过滤检索，并对含 `valid_until` 的记忆做过期标注。
- **TASK-07 (GAP-07)**: 当用户标记 `feedback --label useful` 且记忆访问次数达到阈值时，自动触发反射分析，提取可复用 skill 并写入 `governance/SKILLS.md`。
- **TASK-08 (GAP-08)**: 支持配置切换 `vector_backend: sqlite`，使用可选的 `faiss` 内存索引加速向量检索，并提供 `sync --rebuild-index` 重建能力。

---

## 2. 实现方案

### 2.1 知识图谱 MVP (TASK-06)

**实体三元组提取与存储**

- `extractors/l1_extractor.py` 的 Prompt 新增 `triples` 和 `valid_until` 字段；`L1Summary` 数据结构同步扩展。
- `extractors/trigger.py` 在 `_generate_l1` 后将 `triples` 和 `valid_until` 通过 `result` 返回给 `LayerManagerV5`。
- `layers/manager_v5.py` 的 `_process_extraction_metadata` 方法在存储完成后：
  - 调用 `entity_index.add_triples(l2_id, triples)` 写入索引；
  - 若存在 `valid_until`，更新 lifecycle manifest 的 metadata。

**实体索引**

- 新建 `graph/entity_index.py`，提供 `EntityIndex` 类：
  - SQLite 表 `entity_triples(memory_id, subject, relation, object, created_at)`
  - 索引：`idx_entity_subject`、`idx_entity_memory`
  - 接口：`add_triples`、`search_by_entity`、`search_memory_ids_by_entity`、`delete_by_memory`、`get_stats`

**检索集成与过期标注**

- `layers/manager_v5.py` 的 `retrieve()` 支持可选 `entity` 参数：
  - 先查 `entity_index` 获取 `memory_id` 集合；
  - 与各层召回结果做交集过滤；
  - 若仅指定 `entity` 无 `query`，返回所有含该实体的可见记忆。
- 检索结果后处理中，读取 lifecycle manifest 的 `valid_until`：
  - 若 `valid_until < today`，在结果中标记 `_expired=True` 和 `_expired_badge="⚠️ 已过期"`。

**CLI / MCP 暴露**

- `scripts/hkt_memory_v5.py` 的 `retrieve` 子命令新增 `--entity` 选项。
- `mcp/tools.py` 的 `memory_recall` 新增可选 `entity` 参数。

### 2.2 结构化反射管道 (TASK-07)

**触发条件**

- `scripts/hkt_memory_v5.py` 的 `feedback` 命令处理中，当 `label == "useful"` 且 `memory_id` 存在时：
  - 读取 lifecycle manifest 的 `access_count`；
  - 与配置项 `governance.reflection_threshold`（默认 3）比较；
  - 达到阈值则自动调用 `ReflectionAnalyzer`。

**反射分析器**

- 新建 `governance/reflection_analyzer.py`：
  - `should_trigger(access_count, threshold)` 判断阈值；
  - `analyze(memories, feedback_context)` 基于标题、内容关键词做轻量 skill 提取（MVP 阶段使用规则而非 LLM，保证稳定性）；
  - `write_skill(skill)` 将 skill 写入 `memory/governance/SKILLS.md`，支持按 `skill_name` 去重更新。

**SKILLS.md 格式**

```markdown
### <skill_name>

**Description**: <description>
**Tags**: <tag1>, <tag2>
**Updated**: <iso_timestamp>

**Example**:
```
<example>
```
```

**异常隔离**

- 反射分析失败时仅打印警告，不影响 feedback 主链路返回结果。

### 2.3 SQLite 向量后端 (TASK-08)

**后端路由**

- `layers/manager_v5.py` 根据 `config.storage.vector_backend` 初始化不同后端：
  - `"file"`（默认）: 现有 `VectorStore`（全量扫描 + 余弦相似度）；
  - `"sqlite"`: `SQLiteVectorBackend`（SQLite 持久化 + 可选 faiss 内存索引）。

**SQLiteVectorBackend 实现**

- 新建 `vector_store/sqlite_backend.py`：
  - SQLite 表 `vectors(id, content, embedding BLOB, metadata TEXT, source, layer, created_at, access_count)`；
  - 启动时尝试 `import faiss`：
    - 成功：加载全部向量，归一化后构建 `faiss.IndexFlatIP`（内积 = 归一化后的余弦相似度）；
    - 失败：自动降级为全量扫描，打印警告。
  - `search()` 优先使用 faiss ANN 搜索，再回 SQLite 查元数据；faiss 不可用时回退到 `_brute_force_search()`。
  - `rebuild_from_files(entries)` 支持从文件系统批量重建索引。

**sync --rebuild-index**

- `scripts/hkt_memory_v5.py` 的 `sync` 子命令支持 `--rebuild-index`：
  - 遍历 L2 全部 entries，调用 `vector_store.rebuild_from_files()` 重建索引。

**性能目标**

- 设计目标：1000 条记忆规模下 P95 < 200ms（faiss 开启时）；
- 实际精度：faiss `IndexFlatIP` 为精确搜索，Top-5 重合率 100%。

---

## 3. 关键文件清单

| 文件 | 所属任务 | 说明 |
|------|---------|------|
| `graph/entity_index.py` | TASK-06 | 实体三元组 SQLite 索引 |
| `extractors/l1_extractor.py` | TASK-06 | Prompt + L1Summary 扩展 triples/valid_until |
| `extractors/trigger.py` | TASK-06 | 将 triples/valid_until 传回 manager |
| `layers/manager_v5.py` | TASK-06/07/08 | 集成 entity_index、valid_until 过期标注、vector_backend 路由、反射反馈处理 |
| `vector_store/sqlite_backend.py` | TASK-08 | Faiss + SQLite 向量后端 |
| `vector_store/store.py` | TASK-06/08 | 默认 file backend，metadata 支持 valid_until |
| `governance/reflection_analyzer.py` | TASK-07 | 反射分析与 SKILLS.md 管理 |
| `scripts/hkt_memory_v5.py` | TASK-06/07/08 | CLI：retrieve --entity、feedback 反射触发、sync --rebuild-index |
| `mcp/tools.py` | TASK-06/07 | MCP：memory_recall 支持 entity |

---

## 4. 验收矩阵

| 需求 | 任务 | 验收标准 | 状态 |
|------|------|---------|------|
| 实体过滤检索 | TASK-06 | `retrieve(entity="张三")` 返回含该实体的记忆 | ✅ |
| 空实体容错 | TASK-06 | `retrieve(entity="不存在")` 返回空列表，不抛异常 | ✅ |
| 实体索引可测 | TASK-06 | `graph/entity_index.py` 独立可测 | ✅ |
| 过期标注 | TASK-06 | 含 `valid_until < today` 的结果带 `⚠️ 已过期` | ✅ |
| 提取失败不阻断 | TASK-06 | LLM/triples 异常被捕获，主存储链路正常 | ✅ |
| feedback 触发反射 | TASK-07 | `useful` 反馈且 `access_count >= 3` 时触发 | ✅ |
| SKILLS.md 可读 | TASK-07 | 文件存在且条目为 Markdown 格式 | ✅ |
| skill 去重更新 | TASK-07 | 同名 skill 更新而非追加 | ✅ |
| 反射异常隔离 | TASK-07 | 分析失败不影响 feedback 返回 | ✅ |
| backend 配置 | TASK-08 | `config.storage.vector_backend` 支持 `"sqlite"` | ✅ |
| rebuild-index | TASK-08 | `sync --rebuild-index` 成功重建 | ✅ |
| faiss 降级 | TASK-08 | 不可用时回退全量扫描，不抛致命异常 | ✅ |
| 接口一致性 | TASK-08 | add/search/delete/get_stats 行为一致 | ✅ |

---

## 5. 已知限制与后续优化

1. **TASK-07 手动触发命令**: 当前仅通过 `feedback --label useful` 自动触发反射，未提供独立的 `reflect --memory-id` CLI 子命令。如需手动触发，可在未来迭代中添加。
2. **SKILLS.md 生成质量**: MVP 版使用规则-based skill 提取，未调用 LLM。在数据量增大后可切换为 LLM 分析以提升提取质量。
3. **Faiss 索引持久化到磁盘**: 当前每次进程重启后从 SQLite 重建 faiss 内存索引。对于更大规模数据，可考虑将 faiss index 序列化到 `memory/faiss.index` 以加速冷启动。
4. **jieba fallback**: 需求文档中提到无 API Key 时使用 jieba 做实体识别，当前实现中 L1 提取在无 API Key 时直接使用规则提取，未单独引入 jieba。该降级方案可在需要时补充。

---

*来源 Brainstorm*: docs/brainstorms/implement-task-06-knowledge-graph-mvp-task-07-re-requirements.md
*来源 Plan*: docs/plans/hktmemory-openvikings-agent-plan.md
