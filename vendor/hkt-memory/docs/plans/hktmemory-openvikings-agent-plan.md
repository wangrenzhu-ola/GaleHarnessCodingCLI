# HKTMemory vs OpenVikings Agent 差距闭合计划

**计划日期**: 2026-04-15
**版本**: v1.0
**来源需求**: docs/brainstorms/hktmemory-openvikings-agent-requirements.md
**知识上下文**: .gale/knowledge/hktmemory-openvikings-agent-context.md

---

## 背景与现状评估

### 已验证的现有能力（需求文档状态 ⚠️ 实际已存在）

经代码库探查，部分需求文档标注为"草案/待接入"的能力实际上**已有代码实现**，但需验证其集成完整性：

| 模块 | 文件 | 现状 |
|------|------|------|
| 生命周期管理器 | `lifecycle/memory_lifecycle.py` | ✅ 完整实现，含状态机、事件日志、TTL、scope 容量裁剪 |
| manager_v5 生命周期集成 | `layers/manager_v5.py:66` | ✅ 已委托 MemoryLifecycleManager，所有 forget/restore/cleanup 已接入 |
| CLI 生命周期命令 | `scripts/hkt_memory_v5.py` | ✅ forget/restore/cleanup 命令已存在，含 --force/--dry-run |
| MCP 工具集 | `mcp/tools.py` | ✅ 13 个工具（超出需求的 9 个），含 memory_forget/restore/stats |
| MCP HTTP 服务器 | `mcp/server.py` | ✅ Flask HTTP 模式已有 /tools/<tool_name> 端点 |
| 生命周期测试 | `tests/test_memory_lifecycle.py` | ✅ 软删除→恢复→硬删除、cleanup/prune 均有覆盖 |

**结论**：实际工作重心是**验证+修复端到端链路**，而非从头实现。最大空白是 Auto-Capture/Auto-Recall（Claude Code 钩子集成）和噪声过滤。

---

## 实施路线图

### P0：关键缺口（Q2 2026 Week 1–6）

---

#### TASK-01：生命周期链路端到端验证与修复

**对应需求**: GAP-02
**工期估算**: Week 1–2
**优先级**: P0

**目标**：确认 stats 输出包含生命周期状态分布，MCP 的 memory_forget/restore 走软删除语义，cleanup 命令可在 MCP 层调用。

**实施步骤**：

1. **验证 stats 生命周期输出**
   - 读取 `scripts/hkt_memory_v5.py` stats 命令处理逻辑（约 line 350–400）
   - 检查 `lifecycle/memory_lifecycle.py` 的 `get_stats()` 返回值是否包含 `active/disabled/archived/deleted` 计数
   - 如 stats 输出未渲染生命周期字段，修改 CLI stats handler 调用 `lifecycle.get_stats()` 并格式化输出

2. **验证 MCP memory_forget 软删除语义**
   - 读取 `mcp/tools.py` 的 `memory_forget()` 实现
   - 确认 `force=False` 时调用 `manager.forget(memory_id, force=False)` 走软删除路径
   - 如有硬编码 `force=True`，修改为默认软删除

3. **补充 MCP cleanup 工具**（如缺失）
   - 检查 `mcp/tools.py` 是否有 `memory_cleanup` 工具
   - 如无，在 MemoryTools 类添加 `memory_cleanup(dry_run=True, scope=None)` 方法
   - 在 `mcp/server.py` 的 tool_map 和 capabilities 中注册该工具

4. **store 写入后自动 prune 验证**
   - 确认 `layers/manager_v5.py` 的 store 路径在 `lifecycle.register_memory()` 后调用 `lifecycle.prune_scope()`
   - 环境变量 `HKT_MEMORY_MAX_ENTRIES_PER_SCOPE` 控制上限，确认此配置可通过 `config/default.json` 的 `lifecycle.maxEntriesPerScope` 生效

**验收标准**：
- [ ] `uv run scripts/hkt_memory_v5.py stats` 输出包含 `active/disabled/archived/deleted` 数量
- [ ] `uv run scripts/hkt_memory_v5.py forget --memory-id <id>` 默认软删除（disabled），`--force` 硬删除
- [ ] `uv run scripts/hkt_memory_v5.py cleanup --dry-run` 返回预览结果
- [ ] MCP `memory_forget` 工具调用走软删除语义
- [ ] 现有 `tests/test_memory_lifecycle.py` 全部通过

**关键文件**：
- `scripts/hkt_memory_v5.py` (stats/forget/cleanup handlers)
- `mcp/tools.py` (memory_forget, memory_stats, +memory_cleanup)
- `mcp/server.py` (tool_map + capabilities JSON)
- `lifecycle/memory_lifecycle.py` (get_stats 返回值)

---

#### TASK-02：MCP 工具端到端集成测试

**对应需求**: GAP-03
**工期估算**: Week 3–4
**优先级**: P0

**目标**：确保 MCP server 可在 Claude Code `--mcp-server` 模式下启动，所有核心工具可被调用并返回结构化 JSON。

**实施步骤**：

1. **MCP stdio 模式启动验证**
   - 检查 `mcp/server.py` 的 `start_stdio()` 逻辑（约 line 195–221）
   - 确认 JSON 解析和响应格式符合 MCP 协议规范（`jsonrpc: "2.0"`, `id`, `result/error`）
   - 如 server 版本号仍为 "v4"（当前 `get_capabilities()` 返回 "HKT-Memory v4"），更新为 "v5"

2. **编写 MCP 集成测试文件** `tests/test_mcp_integration.py`
   - 直接实例化 `MemoryTools` 并调用每个工具方法（无需启动真实 HTTP/stdio）
   - 覆盖 9 个核心工具的正常路径和错误路径：
     - `memory_store` → 返回 `{"success": true, "memory_id": "..."}`
     - `memory_recall` → 返回 `{"success": true, "memories": [...]}`
     - `memory_forget` → 默认软删除，返回状态变更确认
     - `memory_restore` → 恢复 disabled → active
     - `memory_update` → 当前标注为"not yet implemented"，确认返回合理错误信息
     - `memory_stats` → 包含生命周期状态分布字段
     - `memory_list` → 返回指定 scope 下的记忆列表
     - `self_improvement_log` → 写入 governance/LEARNINGS.md 或 ERRORS.md
     - `self_improvement_extract_skill` → 从 learning_id 提取技能条目

3. **错误格式验证**
   - 每个工具在参数缺失/无效时返回 `{"success": false, "error": "..."}`（可解析字符串）

4. **Claude Code MCP 配置验证**
   - 确认 `mcp/server.py` main() 支持 `--mode stdio` 参数
   - 在 `.claude/settings.json` 或项目 MCP 配置文件中记录正确启动命令

**验收标准**：
- [ ] `uv run scripts/hkt_memory_v5.py test` 执行通过（覆盖 MCP 工具路径）
- [ ] `tests/test_mcp_integration.py` 覆盖 9 个核心工具，全部通过
- [ ] 工具调用在 memory_update "not implemented" 时返回结构化错误而非 exception
- [ ] MCP server capabilities 版本更新为 v5

**关键文件**：
- `mcp/tools.py` (所有 13 个工具方法)
- `mcp/server.py` (start_stdio, start_http, capabilities)
- `tests/test_mcp_integration.py` (新建)

---

#### TASK-03：Auto-Capture / Auto-Recall（Claude Code 钩子集成）

**对应需求**: GAP-01
**工期估算**: Week 5–6
**优先级**: P0

**目标**：实现 Agent 会话自动注入历史记忆（SessionStart/PreTool 钩子），会话结束自动捕获新信息（PostTool 钩子），无需手动 CLI 操作。

**架构设计**：

```
Claude Code 钩子
├── PreCompact / session_start  → auto_recall.py → retrieve → 注入 system prompt
├── PostToolUse                 → auto_capture.py → 噪声过滤 → store → session scope
└── Stop                       → auto_capture.py --final → promote session → user/project
```

**实施步骤**：

1. **创建 `hooks/auto_recall.py`**（新建）
   - 接收环境变量：`HKT_QUERY`（从会话上下文或当前任务描述提取）、`HKT_MEMORY_DIR`、`HKT_MAX_TOKENS`（默认 512）
   - 调用 `LayerManagerV5.retrieve(query, limit=5)`
   - 格式化为 Markdown 上下文块，输出到 stdout（Claude Code 钩子读取 stdout 注入 system prompt）
   - Token 截断：粗估 1 token ≈ 4 chars，超限时截断最低相关性结果

2. **创建 `hooks/auto_capture.py`**（新建）
   - 接收环境变量：`HKT_CONTENT`（当前对话轮次内容）、`HKT_SESSION_ID`
   - 调用噪声过滤（见 TASK-04），跳过低信息内容
   - 通过 `LayerManagerV5.store()` 写入，scope=`session:<HKT_SESSION_ID>`
   - `--promote` 模式：将 session scope 记忆提升到 user scope（会话结束时触发）

3. **配置 Claude Code 钩子** (`.claude/settings.json`)
   ```json
   {
     "hooks": {
       "PreCompact": [
         {
           "matcher": ".*",
           "hooks": [{"type": "command", "command": "uv run hooks/auto_recall.py"}]
         }
       ],
       "PostToolUse": [
         {
           "matcher": ".*",
           "hooks": [{"type": "command", "command": "uv run hooks/auto_capture.py"}]
         }
       ]
     }
   }
   ```

4. **查询提取逻辑**
   - `auto_recall.py` 优先从 `CLAUDE_CONTEXT` / `HKT_QUERY` 环境变量获取查询词
   - 如无，回退到提取对话最后一条用户消息的前 100 字作为查询
   - 问候语检测：如查询命中问候词列表（见 TASK-04），跳过 recall

5. **token 上限保护**
   - 配置项：`lifecycle.autoRecallMaxTokens: 512`（可在 `config/default.json` 中设置）
   - 超限截断策略：保留最高相关性记忆，丢弃超限部分

6. **session scope 清理策略**
   - `session:<id>` scope 的记忆默认 TTL = 7 天（可配置）
   - `--promote` 触发后，高质量记忆（importance > medium）复制到 user scope

**验收标准**：
- [ ] 在 Claude Code 中执行任意工具后，`auto_capture.py` 被触发（可通过 stats 的 store_count 验证）
- [ ] 会话开始时，`auto_recall.py` 返回相关记忆注入上下文（≤ 512 tokens）
- [ ] 问候语（"在吗"、"你好"）不触发 recall 也不写入记忆
- [ ] `stats` 中可见 `filter_count`（被噪声过滤的条数）

**关键文件**：
- `hooks/auto_recall.py` (新建)
- `hooks/auto_capture.py` (新建)
- `.claude/settings.json` (钩子配置)
- `config/default.json` (autoRecallMaxTokens 配置项)

---

### P1：重要缺口（Q3 2026）

---

#### TASK-04：噪声预过滤（Noise Filter）

**对应需求**: GAP-06
**工期估算**: Q3 Month 1（约 3–5 天）
**优先级**: P1（但被 TASK-03 Auto-Capture 依赖，可提前到 Week 5 与 TASK-03 并行）

**目标**：在自动捕获写入记忆前过滤低信息内容，减少噪声积累。

**实施步骤**：

1. **创建 `filters/noise_filter.py`**（新建）
   - `NoiseFilter` 类，提供 `is_noise(text: str) -> bool` 方法
   - **规则层**（廉价，优先执行）：
     - 长度过滤：`len(text.strip()) < 10`
     - 纯 emoji 检测：正则 `^[\U0001F000-\U0001FFFF\s]+$`
     - 问候语列表：`["你好", "在吗", "OK", "好的", "嗯", "哦", "啊", "哈哈", "谢谢"]` 等
     - 重复字符：如 "哈哈哈哈哈哈"
   - **可选 Embedding 层**（仅在 `noise_filter.use_embedding=true` 时启用）：
     - 预定义"低信息锚点向量"（从问候语、确认词生成）
     - 余弦相似度 > 0.9 → 判定为噪声
   - 暴露 `filter_count` 计数，可被 stats 读取

2. **集成到 store 路径**
   - `layers/manager_v5.py` 的 `store()` 方法入口处调用 `NoiseFilter.is_noise()`
   - 如返回 True，跳过存储，递增 `filter_count`，返回 `{"filtered": true, "reason": "..."}`

3. **stats 展示 filter_count**
   - `lifecycle/memory_lifecycle.py` 的 `get_stats()` 增加 `filter_count` 字段
   - CLI stats 命令展示该字段

**验收标准**：
- [ ] `"好的"`、`"OK"`、`"在吗"` 调用 store 时被过滤，不写入任何层
- [ ] `stats` 显示 `filter_count: N`
- [ ] 噪声过滤不影响正常内容（50字以上非问候内容不被误过滤）

**关键文件**：
- `filters/noise_filter.py` (新建)
- `layers/manager_v5.py` (store 入口处集成)
- `lifecycle/memory_lifecycle.py` (get_stats 增加 filter_count)

---

#### TASK-05：REST API 端点对齐

**对应需求**: GAP-05
**工期估算**: Q3 Month 1（约 2–3 天）
**优先级**: P1

**目标**：将现有 Flask HTTP 服务端点对齐到需求规范（POST /store, POST /recall, POST /forget, GET /stats），支持标准 curl 调用。

**现状**：`mcp/server.py` 已有 Flask HTTP 模式，端点为 `/tools/<tool_name>` 和 `/mcp`，需补充语义化端点。

**实施步骤**：

1. **在 `mcp/server.py` 的 Flask app 新增端点**
   - `POST /store` → 调用 `tools.memory_store()`
   - `POST /recall` → 调用 `tools.memory_recall()`
   - `POST /forget` → 调用 `tools.memory_forget()`
   - `GET /stats` → 调用 `tools.memory_stats()`
   - 请求体为 JSON，响应体为 JSON，Content-Type: application/json

2. **更新 CLI serve 命令**（如不存在）
   - 在 `scripts/hkt_memory_v5.py` 添加 `serve` 子命令
   - 调用 `MemoryMCPServer(memory_dir).start_http(host="127.0.0.1", port=8765)`
   - 或直接在现有 `mcp/server.py main()` 中确认 `--mode http` 可正常工作

3. **更新 capabilities 文档**
   - 在 `mcp/server.py` 的根路由 `/` 返回中列出新端点信息

**验收标准**：
- [ ] `curl -X POST http://localhost:8765/recall -H 'Content-Type: application/json' -d '{"query":"test"}' ` 返回记忆列表
- [ ] `curl http://localhost:8765/stats` 返回包含生命周期状态分布的 JSON
- [ ] `uv run scripts/hkt_memory_v5.py serve` 或 `uv run mcp/server.py --mode http` 启动服务

**关键文件**：
- `mcp/server.py` (新增 /store, /recall, /forget, /stats 端点)
- `scripts/hkt_memory_v5.py` (serve 子命令)

---

#### TASK-06：实体关系提取最小可行版（Knowledge Graph MVP）

**对应需求**: GAP-04
**工期估算**: Q3 Month 2（约 1 周）
**优先级**: P1

**目标**：从包含实体类记忆中提取 (主体, 关系, 客体) 三元组，存储在轻量索引中，支持按实体名过滤检索。

**实施步骤**：

1. **扩展 LLM 提取 Prompt**
   - `extractors/` 下找到当前 L1 提取器（处理 fact/entity/preference 等 6 类）
   - 为 `entity` 类型添加三元组提取指令：提取格式 `[主体, 关系, 客体]`
   - LLM 返回中增加 `triples: [["A", "is_related_to", "B"]]` 字段

2. **创建 `graph/entity_index.py`**（新建）
   - 基于 SQLite（已有 vector_store 使用 SQLite FTS5，可复用连接）
   - 表结构：`entity_triples(memory_id, subject, relation, object, created_at)`
   - 提供：`add_triple()`, `search_by_entity(name)`, `delete_by_memory(memory_id)`

3. **集成到 store 路径**
   - `layers/manager_v5.py` store 完成后，如提取结果含 `triples`，调用 `entity_index.add_triple()`

4. **检索时支持实体过滤**
   - `retrieve()` 增加可选参数 `entity: str`
   - 若指定，先从 entity_index 查出相关 memory_id，再做语义检索（可与向量结果合并）

5. **事实时效标记**
   - L1 提取 Prompt 增加：识别时效性声明，提取 `valid_until: "YYYY-MM-DD"` 字段
   - 存储到记忆元数据中
   - 检索结果中，`valid_until < today` 的记忆标注 `⚠️ 已过期`

**验收标准**：
- [ ] 存储包含"张三是工程师"的记忆后，`retrieve --entity 张三` 可找到该记忆
- [ ] L1 层摘要包含实体标签
- [ ] 过期事实在检索结果中有 ⚠️ 标注

**关键文件**：
- `extractors/` 下的 L1 提取器（扩展 prompt）
- `graph/entity_index.py` (新建)
- `layers/manager_v5.py` (store + retrieve 集成 entity_index)

---

### P2：增强缺口（Q4 2026）

---

#### TASK-07：结构化反射/自改进管道

**对应需求**: GAP-07
**工期估算**: Q3 Month 3
**优先级**: P2

**目标**：feedback 命令触发自动反射分析，提取可复用 skill 写入 `governance/SKILLS.md`。

**实施步骤**：

1. **扩展 feedback 命令**
   - 当 `feedback --label useful` 被调用，检查该记忆被访问次数（从 lifecycle events 统计）
   - 若访问次数 ≥ 配置阈值（默认 3），触发反射分析

2. **创建 `governance/reflection_analyzer.py`**（新建）
   - 输入：相关记忆列表 + 反馈上下文
   - 使用 LLM 提取可复用的 pattern/skill
   - 输出结构：`{"skill_name": "...", "description": "...", "example": "...", "tags": [...]}`

3. **写入 `governance/SKILLS.md`**
   - 追加新 skill 条目（Markdown 格式）
   - 去重：如 skill_name 已存在，更新示例而非重复添加

**验收标准**：
- [ ] `feedback --label useful --memory-id <id>` 在访问次数达阈值后提示运行反射
- [ ] `governance/SKILLS.md` 有可读的技能条目

**关键文件**：
- `scripts/hkt_memory_v5.py` (feedback handler)
- `governance/reflection_analyzer.py` (新建)
- `governance/SKILLS.md` (写入目标)

---

#### TASK-08：SQLite 向量索引后端（可选）

**对应需求**: GAP-08
**工期估算**: Q4 Month 1
**优先级**: P2

**目标**：支持 `vector_backend: sqlite` 配置，使用 SQLite 加速向量检索，检索延迟 P95 < 200ms（1000 条规模）。

**实施步骤**：

1. **检查现有 vector_store 实现**
   - 读取 `vector_store/` 目录下的实现，确认是否已有 SQLite 模式
   - 如已有（FTS5 已在使用），评估是否支持向量相似度查询（需 sqlite-vss 或 faiss）

2. **实现 SQLiteVectorBackend**
   - `vector_store/sqlite_backend.py`（新建或扩展）
   - 使用 `faiss` 作为内存向量索引，持久化到 SQLite BLOB 列
   - 提供：`add()`, `search(query_vector, k)`, `rebuild_from_files()`

3. **配置切换**
   - `config/default.json` 中 `vector_backend: "file"` 为默认，`"sqlite"` 为可选
   - `sync --rebuild-index` 命令从文件系统重建 SQLite 向量索引

**验收标准**：
- [ ] `sync --rebuild-index` 从文件重建 SQLite 向量索引，无错误
- [ ] 1000 条记忆规模下，retrieve 的 P95 延迟 < 200ms

---

## 文件新增/修改汇总

### 新建文件

| 文件 | 所属任务 | 说明 |
|------|---------|------|
| `hooks/auto_recall.py` | TASK-03 | Claude Code 钩子：会话开始自动回忆 |
| `hooks/auto_capture.py` | TASK-03 | Claude Code 钩子：会话结束自动捕获 |
| `filters/noise_filter.py` | TASK-04 | 噪声预过滤器（规则层 + 可选 Embedding 层） |
| `tests/test_mcp_integration.py` | TASK-02 | MCP 工具集成测试 |
| `graph/entity_index.py` | TASK-06 | 实体关系三元组 SQLite 索引 |
| `governance/reflection_analyzer.py` | TASK-07 | 结构化反射分析器 |

### 修改文件

| 文件 | 所属任务 | 修改内容 |
|------|---------|---------|
| `mcp/tools.py` | TASK-01/02 | 补充 memory_cleanup 工具；修复 memory_forget 软删除语义；修复 memory_update 返回结构化错误 |
| `mcp/server.py` | TASK-01/02/05 | 更新版本号为 v5；注册 memory_cleanup；新增 /store /recall /forget /stats REST 端点 |
| `scripts/hkt_memory_v5.py` | TASK-01/05 | stats 输出补充生命周期状态分布；添加 serve 子命令 |
| `lifecycle/memory_lifecycle.py` | TASK-01/04 | get_stats() 增加 filter_count 字段 |
| `layers/manager_v5.py` | TASK-03/04/06 | store 入口集成噪声过滤；store 后集成 entity_index；retrieve 支持 entity 过滤参数 |
| `config/default.json` | TASK-03 | 新增 `autoRecallMaxTokens`、`autoCapture.enabled` 配置项 |
| `.claude/settings.json` | TASK-03 | 配置 PreCompact/PostToolUse 钩子 |
| `extractors/` 下 L1 提取器 | TASK-06 | 扩展 prompt 支持三元组提取和 valid_until 字段 |

---

## 风险与依赖

| 风险 | 受影响任务 | 缓解策略 |
|------|-----------|---------|
| Claude Code 钩子环境变量传递机制变化 | TASK-03 | 先阅读最新 `.claude/settings.json` 钩子文档；用 PreCompact 钩子替代 SessionStart（当前更稳定） |
| `auto_capture` 内容来源不稳定（PostToolUse 可能拿不到完整对话） | TASK-03 | 降级方案：仅捕获工具输出摘要，不捕获完整对话 |
| SQLite FTS5 与 sqlite-vss 依赖冲突 | TASK-08 | 优先使用 faiss（纯 Python），sqlite 仅做持久化 |
| LLM 三元组提取质量（中文语义复杂） | TASK-06 | MVP 版只做英文/中文实体识别，不强求关系准确性；降级为 jieba 实体词典匹配 |

---

## 验收矩阵

| 需求 | 任务 | 验收标准 | 状态 |
|------|------|---------|------|
| GAP-02 生命周期接入 | TASK-01 | stats 显示状态分布；forget 软删除；cleanup dry-run 可用 | 待实施 |
| GAP-03 MCP 端到端 | TASK-02 | 9 核心工具集成测试通过；MCP v5 capabilities | 待实施 |
| GAP-01 Auto-Capture | TASK-03 | 钩子触发 store/retrieve；token 上限保护；噪声跳过 | 待实施 |
| GAP-06 噪声过滤 | TASK-04 | 问候语被过滤；stats 显示 filter_count | 待实施 |
| GAP-05 REST API | TASK-05 | curl /recall /stats 可用 | 待实施 |
| GAP-04 知识图谱 MVP | TASK-06 | 实体过滤检索；过期标注 | 待实施 |
| GAP-07 反射管道 | TASK-07 | feedback 触发反射；SKILLS.md 有条目 | 待实施 |
| GAP-08 SQLite 后端 | TASK-08 | rebuild-index；P95 < 200ms | 待实施 |

---

*生成时间*: 2026-04-15
*作者*: Gale Compound Planning
*基于*: 需求文档 + 代码库实地探查（scripts/, layers/, mcp/, lifecycle/, tests/）
