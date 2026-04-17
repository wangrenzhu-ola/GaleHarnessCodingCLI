# HKTMemory v5 P1/P2 需求文档：TASK-06 ~ TASK-08

**文档版本**: 1.0
**生成日期**: 2026-04-15
**对应 Brainstorm**: HKTMemory vs OpenVikings Agent 差距分析
**对应 Plan**: docs/plans/hktmemory-openvikings-agent-plan.md

---

## 文档目的

本文档为 TASK-06（知识图谱 MVP）、TASK-07（结构化反射管道）、TASK-08（SQLite 向量后端） three 个任务的统一需求 artifact，供后续计划、实施与验收使用。

---

## 前置约束与架构假设

1. **存储主数据仍在文件系统**：HKTMemory 的核心差异优势是 Markdown 可读存储，任何新增索引（entity_index、sqlite vector backend）均视为**可重建的加速层**，不可取代文件系统作为主存储。
2. **SQLite 已被广泛使用**：`vector_store/store.py` 已使用 SQLite 存储向量（全量扫描 + 余弦相似度计算），`graph/entity_index.py` 应复用同一连接模式或同一 db 文件。
3. **L1 提取器入口固定**：`extractors/l1_extractor.py` 的 `L1Extractor` 类是当前 L1 摘要唯一入口，三元组提取应扩展其 Prompt 和 `L1Summary` 数据结构。
4. **生命周期管理器已就位**：`lifecycle/memory_lifecycle.py` 提供 `register_memory`、`record_event`、`get_stats` 等能力，反射分析可消费其事件日志统计访问次数。
5. **MCP/CLI 已存在**：新增功能需同时考虑 CLI (`scripts/hkt_memory_v5.py`) 和 MCP (`mcp/tools.py`) 暴露路径。

---

## TASK-06：Knowledge Graph MVP（实体关系提取最小可行版）

**对应需求**: GAP-04
**优先级**: P1
**工期估算**: Q3 Month 2（约 1 周）

### 目标
从包含实体类记忆中提取 `(主体, 关系, 客体)` 三元组，存储在轻量 SQLite 索引中；支持按实体名过滤检索；对含时效性声明的记忆标记 `valid_until`，过期结果在检索时标注 ⚠️。

### Requirement: 三元组提取（LLM + Fallback）

**GIVEN** 一条记忆通过 `LayerManagerV5.store()` 写入 L2 并触发 L1 提取
**WHEN** `L1Extractor.extract()` 执行时
**THEN** LLM Prompt 增加指令：识别文档中的实体关系，返回 `triples` 字段（列表的列表）
**AND** `triples` 格式为 `[["主体", "关系", "客体"], ...]`
**AND** 若 LLM 未返回 triples 或返回为空，系统静默跳过，不阻断存储流程
**AND** 降级方案：当无 API Key 或 LLM 失败时，使用 jieba 分词 + 简单规则做实体识别（不强制提取关系）

#### Prompt 扩展草案（供参考）
```json
{
  "title": "...",
  "summary": "...",
  "key_points": ["..."],
  "people": ["..."],
  "topics": ["..."],
  "triples": [["张三", "是", "工程师"], ["项目A", "依赖于", "服务B"]],
  "valid_until": "2026-06-01"
}
```

### Requirement: 实体索引存储

**GIVEN** L1 提取结果包含 `triples`
**WHEN** `store()` 完成 L2/L1/L0 写入后
**THEN** 系统调用 `graph/entity_index.py` 的 `add_triples(memory_id, triples)`
**AND** 三元组持久化到 SQLite 表 `entity_triples`

#### 表结构
```sql
CREATE TABLE IF NOT EXISTS entity_triples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    relation TEXT NOT NULL,
    object TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_entity_subject ON entity_triples(subject);
CREATE INDEX idx_entity_object ON entity_triples(object);
CREATE INDEX idx_entity_memory_id ON entity_triples(memory_id);
```

#### EntityIndex 接口草案
```python
class EntityIndex:
    def __init__(self, db_path: str): ...
    def add_triples(self, memory_id: str, triples: List[List[str]]) -> int: ...
    def search_by_entity(self, name: str) -> List[Dict[str, Any]]: ...
    def delete_by_memory(self, memory_id: str) -> int: ...
```

### Requirement: 按实体名过滤检索

**GIVEN** 用户或 Agent 执行检索
**WHEN** `retrieve()` 收到可选参数 `entity: str`
**THEN** 系统先从 `entity_index` 查出包含该实体的 `memory_id` 列表
**AND** 将结果与向量/BM25 检索结果做并集（union）后统一按相似度排序
**AND** 若仅指定 `entity` 而未指定 `query`，返回所有含该实体的记忆（按时间倒序）

### Requirement: 事实时效标记

**GIVEN** L1 提取结果包含 `valid_until`（ISO 8601 日期字符串）
**WHEN** 该记忆被存储时
**THEN** `valid_until` 写入记忆的 metadata 中（同时写入向量存储的 metadata 列）
**AND** `retrieve()` 返回结果时，若 `valid_until < today()`，在 `content` 或 `warning` 字段附加 `"⚠️ 已过期"` 标注
**AND** 过期记忆在排序中不降权（MVP 阶段避免过度复杂），仅做视觉/字段提示

### 验收标准

- [ ] 存储 `"张三是某项目工程师"` 后，`retrieve(entity="张三")` 能返回该记忆
- [ ] `retrieve(entity="不存在实体")` 返回空列表，不抛异常
- [ ] `graph/entity_index.py` 存在且 `search_by_entity` 可独立单元测试
- [ ] 含 `valid_until: "2020-01-01"` 的记忆在检索结果中带有 `⚠️ 已过期` 提示
- [ ] store 流程中 triples 提取失败不影响主存储链路（有异常捕获）

### 关键文件变更

| 文件 | 动作 | 说明 |
|------|------|------|
| `extractors/l1_extractor.py` | 修改 | EXTRACTION_PROMPT 增加 triples + valid_until 提取指令；L1Summary 增加 triples、valid_until 字段 |
| `graph/entity_index.py` | 新建 | SQLite 实体三元组索引 |
| `layers/manager_v5.py` | 修改 | store() 后集成 entity_index；retrieve() 增加 entity 参数 |
| `vector_store/store.py` | 修改 | metadata 写入/读取支持 valid_until |
| `mcp/tools.py` | 修改 | `memory_recall` 增加可选参数 `entity` |
| `scripts/hkt_memory_v5.py` | 修改 | `retrieve` 子命令增加 `--entity` 选项 |

---

## TASK-07：结构化反射 / 自改进管道

**对应需求**: GAP-07
**优先级**: P2
**工期估算**: Q4 Month 1（约 1 周）

### 目标
当用户通过 `feedback --label useful` 标记某记忆为高价值，且该记忆访问次数达到阈值时，触发自动反射分析，提取可复用 skill 并追加到 `governance/SKILLS.md`。

### Requirement: feedback 触发反射

**GIVEN** 用户执行 `feedback --label useful --memory-id <id>`
**WHEN** 命令处理时
**THEN** 系统检查该记忆的 `access_count`（来自 lifecycle manifest）
**AND** 若 `access_count >= reflection_threshold`（默认 3，可配置）
**THEN** 系统提示（或自动）运行反射分析，输出可提取的 pattern/skill
**AND** 若 `access_count < threshold`，仅记录反馈，不触发反射

### Requirement: 反射分析器

**GIVEN** 触发反射分析
**WHEN** `governance/reflection_analyzer.py` 被调用时
**THEN** 输入包括：目标记忆内容、feedback 上下文、相关 lifecycle events（最近 5 次访问/使用上下文）
**AND** 使用 LLM 分析并输出结构化 skill：
```json
{
  "skill_name": "shell 命令权限优化",
  "description": "当用户要求执行 bash 命令时，先检查是否可用更安全的专用工具替代",
  "example": "用户说 'find all .tmp files' → 使用 Glob 工具而非 bash find",
  "tags": ["safety", "cli", "best-practice"]
}
```

### Requirement: SKILLS.md 自动更新

**GIVEN** 反射分析器返回有效 skill 结构
**WHEN** 且 `skill_name` 在 `governance/SKILLS.md` 中不存在
**THEN** 以 Markdown 格式追加新条目
**AND** 若 `skill_name` 已存在，则更新其 `example` 和 `updated_at`，不重复添加

#### SKILLS.md 条目格式草案
```markdown
### shell 命令权限优化
**Tags**: safety, cli, best-practice
**Created**: 2026-04-15
**Updated**: 2026-04-15

**Description**: 当用户要求执行 bash 命令时，先检查是否可用更安全的专用工具替代。

**Example**:
用户说 "find all .tmp files" → 使用 Glob 工具而非 bash find。

---
```

### Requirement: CLI / MCP 暴露

**GIVEN** 用户或 Agent 想手动触发反射
**WHEN** 执行 `reflect --memory-id <id>`（CLI 新增子命令）或调用 MCP `memory_reflect(memory_id)`
**THEN** 运行反射分析并返回提取的 skill（或提示未达阈值）
**AND** 返回结构化 JSON：`{"success": true, "skill": {...}, "written_to": "governance/SKILLS.md"}`

### 验收标准

- [ ] `feedback --label useful --memory-id <id>` 在 access_count >= 3 后触发反射分析
- [ ] `governance/SKILLS.md` 存在且包含至少一个可读 skill 条目
- [ ] 同一 skill_name 重复触发时，SKILLS.md 中只保留一条（更新而非追加）
- [ ] `reflect` CLI 子命令可手动触发，返回结构化结果
- [ ] 反射分析失败时不影响 feedback 主链路（异常隔离）

### 关键文件变更

| 文件 | 动作 | 说明 |
|------|------|------|
| `governance/reflection_analyzer.py` | 新建 | 反射分析器：输入记忆+反馈，输出 skill 结构 |
| `governance/skills_tracker.py`（可选） | 新建 | 封装 SKILLS.md 读写与去重逻辑 |
| `scripts/hkt_memory_v5.py` | 修改 | feedback handler 集成反射阈值检查；新增 `reflect` 子命令 |
| `mcp/tools.py` | 修改 | 新增 `memory_reflect` 工具 |
| `mcp/server.py` | 修改 | tool_map + capabilities 注册 `memory_reflect` |
| `lifecycle/memory_lifecycle.py` | 修改 | 如需要，补充 `get_access_count(memory_id)` 便捷方法 |

---

## TASK-08：SQLite 向量索引后端（可选）

**对应需求**: GAP-08
**优先级**: P2
**工期估算**: Q4 Month 1（约 1 周）

### 目标
支持配置切换 `vector_backend: sqlite`，使用 `faiss` 作为内存向量索引（SQLite 做持久化），在 1000 条记忆规模下使 `retrieve` P95 延迟 < 200ms。

### Requirement: 后端抽象与配置切换

**GIVEN** `config/default.json` 中 `vector_backend` 字段
**WHEN** 值为 `"file"`（默认）时
**THEN** 保持现有行为：SQLite 表 + Python 全量扫描计算余弦相似度
**WHEN** 值为 `"sqlite"` 时
**THEN** `VectorStore` 内部使用 `faiss` 索引做近似最近邻搜索（ANN）
**AND** 文件系统仍保留为唯一主存储

### Requirement: Faiss 索引持久化

**GIVEN** `vector_backend: sqlite` 模式
**WHEN** `VectorStore.add()` 被调用时
**THEN** 新向量同时写入 SQLite `vectors` 表（元数据+embedding BLOB）和 `faiss` 内存索引
**AND** 在适当的时机（如每 N 次写入或进程退出时）将 faiss 索引序列化保存到磁盘（`memory/faiss.index`）
**AND** 启动时若 `faiss.index` 存在，加载恢复索引

### Requirement: rebuild-index 支持

**GIVEN** 用户执行 `sync --rebuild-index`
**WHEN** `vector_backend: sqlite` 时
**THEN** 系统从文件系统（L0/L1/L2）读取全部记忆内容
**AND** 重新生成 embedding，重建 faiss 索引
**AND** 重建完成后返回统计：总条目数、耗时、索引文件大小

### Requirement: 性能目标

**GIVEN** 1000 条记忆规模
**WHEN** 执行 `retrieve()` 检索时
**THEN** P95 延迟 < 200ms（含 embedding 生成 + ANN 搜索）
**AND** 搜索结果与全量扫描的 Top-5 重合率 >= 95%（精度验证）

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| sqlite-vss 与现有 FTS5 依赖冲突 | 使用纯 Python 的 `faiss-cpu`，SQLite 仅做元数据持久化 |
| faiss 安装失败（部分平台无预编译 wheel） | 优雅降级：faiss 不可用时回退到现有全量扫描模式，打印警告 |
| 索引文件损坏 | rebuild-index 可从文件系统完全重建 |

### 验收标准

- [ ] `config/default.json` 支持 `"vector_backend": "sqlite"`
- [ ] `sync --rebuild-index` 在 sqlite 模式下成功重建，无错误
- [ ] 1000 条记忆规模下，`retrieve` P95 延迟 < 200ms（可用脚本批量测试）
- [ ] faiss 不可用时自动回退到全量扫描，不抛致命异常
- [ ] 切换 backend 后，向量存储的对外接口（`add/search/delete/get_stats`）行为一致

### 关键文件变更

| 文件 | 动作 | 说明 |
|------|------|------|
| `vector_store/faiss_backend.py` | 新建 | FaissVectorBackend：add/search/save/load/rebuild |
| `vector_store/store.py` | 修改 | VectorStore 根据配置初始化 FileBackend 或 FaissBackend |
| `config/default.json` | 修改 | 新增 `vector_backend` 配置项（默认 `"file"`） |
| `scripts/hkt_memory_v5.py` | 修改 | `sync` 子命令增加 `--rebuild-index` 处理逻辑 |

---

## 跨任务依赖图

```
TASK-06 (Knowledge Graph)
  ├── 依赖: extractors/l1_extractor.py 已存在
  ├── 依赖: layers/manager_v5.py store/retrieve 流程
  └── 产出: graph/entity_index.py

TASK-07 (Reflection Pipeline)
  ├── 依赖: lifecycle/memory_lifecycle.py (access_count)
  ├── 依赖: governance/learnings.py (feedback/skill 提取基础)
  └── 产出: governance/reflection_analyzer.py

TASK-08 (SQLite Vector Backend)
  ├── 依赖: vector_store/store.py 现有接口
  ├── 依赖: config/default.json
  └── 产出: vector_store/faiss_backend.py
```

---

## 变更文件总览

### 新建文件

| 文件 | 所属任务 | 说明 |
|------|---------|------|
| `graph/entity_index.py` | TASK-06 | 实体关系三元组 SQLite 索引 |
| `governance/reflection_analyzer.py` | TASK-07 | 结构化反射分析器 |
| `governance/skills_tracker.py` | TASK-07 | SKILLS.md 读写与去重（可选） |
| `vector_store/faiss_backend.py` | TASK-08 | Faiss 向量索引后端 |

### 修改文件

| 文件 | 所属任务 | 修改内容 |
|------|---------|---------|
| `extractors/l1_extractor.py` | TASK-06 | Prompt 增加 triples + valid_until；L1Summary 扩展字段 |
| `layers/manager_v5.py` | TASK-06 | store 后写 entity_index；retrieve 支持 entity 参数 |
| `vector_store/store.py` | TASK-06/08 | metadata 支持 valid_until；backend 路由（file/sqlite） |
| `scripts/hkt_memory_v5.py` | TASK-06/07/08 | retrieve 加 `--entity`；feedback 集成反射；sync 加 rebuild-index |
| `mcp/tools.py` | TASK-06/07 | memory_recall 加 entity；新增 memory_reflect |
| `mcp/server.py` | TASK-07 | 注册 memory_reflect |
| `config/default.json` | TASK-08 | 新增 vector_backend 配置 |
| `lifecycle/memory_lifecycle.py` | TASK-07 | 可选：get_access_count 辅助方法 |

---

## 验收矩阵

| 需求 | 任务 | 验收标准 | 状态 |
|------|------|---------|------|
| GAP-04 知识图谱 MVP | TASK-06 | 实体过滤检索可用；过期标注 ⚠️；提取失败不阻断 | 待实施 |
| GAP-07 反射管道 | TASK-07 | feedback 达阈值触发反射；SKILLS.md 有可读条目 | 待实施 |
| GAP-08 SQLite 后端 | TASK-08 | rebuild-index 成功；P95 < 200ms；faiss 缺失可降级 | 待实施 |

---

*生成时间*: 2026-04-15
*作者*: Gale Compound Brainstorm
*来源 Brainstorm*: docs/brainstorms/hktmemory-openvikings-agent-requirements.md
*来源 Plan*: docs/plans/hktmemory-openvikings-agent-plan.md
