---
title: HKTMemory v5 → 生产级 Agent 自治记忆：差距闭合方案
date: 2026-04-15
status: active
priority: P0/P1/P2
source_brainstorm: docs/brainstorms/hktmemory-openvikings-agent-requirements.md
source_plan: docs/plans/hktmemory-openvikings-agent-plan.md
tags: [hktmemory, agent-memory, mcp, lifecycle, auto-capture]
---

# HKTMemory v5 → 生产级 Agent 自治记忆：差距闭合方案

## 问题陈述

HKTMemory v5 在三层分层存储、混合检索、Weibull 衰减等核心能力上已达同类前水准，但与 OpenVikings Agent 等生产级 Agent 自治记忆系统相比，存在三个决定性差距，阻碍其从"手动工具"演进为"Agent 自治记忆"。

---

## 关键发现：实际工作重心的修正

经代码库探查，**部分需求文档标注为"草案/待接入"的能力实际上已有代码实现**，实施重心需从"从零构建"修正为"验证+修复端到端链路"：

| 模块 | 文件 | 实际状态 |
|------|------|---------|
| 生命周期管理器 | `lifecycle/memory_lifecycle.py` | ✅ 完整实现：状态机、事件日志、TTL、scope 容量裁剪 |
| manager_v5 生命周期集成 | `layers/manager_v5.py:66` | ✅ 已委托 MemoryLifecycleManager，forget/restore/cleanup 已接入 |
| CLI 生命周期命令 | `scripts/hkt_memory_v5.py` | ✅ forget/restore/cleanup 命令存在，含 --force/--dry-run |
| MCP 工具集 | `mcp/tools.py` | ✅ 13 个工具（超出需求的 9 个） |
| MCP HTTP 服务器 | `mcp/server.py` | ✅ Flask HTTP 模式，含 /tools/<tool_name> 端点 |
| 生命周期测试 | `tests/test_memory_lifecycle.py` | ✅ 软删除→恢复→硬删除、cleanup/prune 有覆盖 |

**最大空白**：Auto-Capture/Auto-Recall 钩子（真正从零开始）和 MCP 集成测试（仅单元测试，无端到端测试）。

---

## 核心决策

**路线选择**：P0 三项均以"验证+修复"为主，Auto-Capture 为唯一真正新建工作。

**理由**：
- TASK-01/02 属于"链路完整性验证"，避免误判为"全量实现"导致重复工作
- TASK-03 Auto-Capture 是唯一无现有实现的 P0 缺口，是跨越"手动工具 → Agent 自治"的关键
- HKTMemory 的差异化优势（中文原生、Markdown 可读）无需改变

---

## P0 实施方案

### TASK-01：生命周期链路端到端验证与修复

**对应需求**：GAP-02
**工期**：Week 1–2

**目标**：确认 stats 输出包含生命周期状态分布，MCP 的 memory_forget/restore 走软删除语义，cleanup 命令可在 MCP 层调用。

**关键验证点与修复**：

1. **stats 生命周期输出**
   - 检查 `scripts/hkt_memory_v5.py` stats handler（约 line 350–400）
   - 确认 `lifecycle/memory_lifecycle.py` 的 `get_stats()` 返回 `active/disabled/archived/deleted` 计数
   - 如未渲染，修改 CLI stats handler 调用 `lifecycle.get_stats()` 并格式化输出

2. **MCP memory_forget 软删除语义**
   - 检查 `mcp/tools.py` 的 `memory_forget()` 实现
   - 确认 `force=False` 时走软删除路径（非硬编码 `force=True`）

3. **补充 MCP memory_cleanup 工具**（如缺失）
   - 检查 `mcp/tools.py` 是否有 `memory_cleanup` 工具
   - 如无，在 MemoryTools 类添加 `memory_cleanup(dry_run=True, scope=None)`
   - 在 `mcp/server.py` 的 tool_map 和 capabilities 中注册

4. **store 写入后自动 prune 验证**
   - 确认 `layers/manager_v5.py` store 路径在 `lifecycle.register_memory()` 后调用 `lifecycle.prune_scope()`
   - 环境变量 `HKT_MEMORY_MAX_ENTRIES_PER_SCOPE` 控制上限

**验收标准**：
- [ ] `uv run scripts/hkt_memory_v5.py stats` 输出包含 `active/disabled/archived/deleted` 数量
- [ ] `uv run scripts/hkt_memory_v5.py forget --memory-id <id>` 默认软删除，`--force` 硬删除
- [ ] `uv run scripts/hkt_memory_v5.py cleanup --dry-run` 返回预览结果
- [ ] MCP `memory_forget` 工具调用走软删除语义
- [ ] `tests/test_memory_lifecycle.py` 全部通过

**关键文件**：
- `scripts/hkt_memory_v5.py` (stats/forget/cleanup handlers)
- `mcp/tools.py` (memory_forget, memory_stats, +memory_cleanup)
- `mcp/server.py` (tool_map + capabilities JSON)
- `lifecycle/memory_lifecycle.py` (get_stats 返回值)

---

### TASK-02：MCP 工具端到端集成测试

**对应需求**：GAP-03
**工期**：Week 3–4

**目标**：确保 MCP server 可在 Claude Code `--mcp-server` 模式下启动，所有核心工具可被调用并返回结构化 JSON。

**关键验证点与修复**：

1. **MCP stdio 模式启动验证**
   - 检查 `mcp/server.py` 的 `start_stdio()` 逻辑（约 line 195–221）
   - 确认 JSON 格式符合 MCP 协议（`jsonrpc: "2.0"`, `id`, `result/error`）
   - 更新 `get_capabilities()` 中版本号 "HKT-Memory v4" → "v5"

2. **编写集成测试 `tests/test_mcp_integration.py`（新建）**
   - 直接实例化 `MemoryTools` 调用每个工具（无需启动真实 HTTP/stdio）
   - 覆盖 9 个核心工具正常路径和错误路径：

   | 工具 | 验证点 |
   |------|-------|
   | `memory_store` | 返回 `{"success": true, "memory_id": "..."}` |
   | `memory_recall` | 返回 `{"success": true, "memories": [...]}` |
   | `memory_forget` | 默认软删除，返回状态变更确认 |
   | `memory_restore` | disabled → active |
   | `memory_update` | 当前标注 "not yet implemented"，返回结构化错误而非 exception |
   | `memory_stats` | 包含生命周期状态分布字段 |
   | `memory_list` | 返回指定 scope 下的记忆列表 |
   | `self_improvement_log` | 写入 governance/LEARNINGS.md 或 ERRORS.md |
   | `self_improvement_extract_skill` | 从 learning_id 提取技能条目 |

3. **错误格式统一**
   - 所有工具在参数缺失/无效时返回 `{"success": false, "error": "..."}` 可解析字符串

4. **Claude Code MCP 配置验证**
   - 确认 `mcp/server.py` main() 支持 `--mode stdio` 参数

**验收标准**：
- [ ] `uv run scripts/hkt_memory_v5.py test` 执行通过（覆盖 MCP 工具路径）
- [ ] `tests/test_mcp_integration.py` 覆盖 9 个核心工具，全部通过
- [ ] `memory_update` "not implemented" 返回结构化错误而非 exception
- [ ] MCP server capabilities 版本更新为 v5

**关键文件**：
- `mcp/tools.py` (所有 13 个工具方法)
- `mcp/server.py` (start_stdio, start_http, capabilities)
- `tests/test_mcp_integration.py` (新建)

---

### TASK-03：Auto-Capture / Auto-Recall（Claude Code 钩子集成）

**对应需求**：GAP-01
**工期**：Week 5–6
**注意**：此为唯一真正从零开始的 P0 任务

**目标**：实现 Agent 会话自动注入历史记忆（SessionStart/PreTool 钩子），会话结束自动捕获新信息（PostTool 钩子），无需手动 CLI 操作。

**架构**：

```
Claude Code 钩子
├── PreCompact / UserPromptSubmit → hooks/auto_recall.py → retrieve → 注入 system prompt
├── PostToolUse                   → hooks/auto_capture.py → 噪声过滤 → store → session scope
└── Stop                          → hooks/auto_capture.py --promote → session → user/project
```

**实施步骤**：

1. **创建 `hooks/auto_recall.py`（新建）**
   - 接收环境变量：`HKT_QUERY`（当前任务描述）、`HKT_MEMORY_DIR`、`HKT_MAX_TOKENS`（默认 512）
   - 调用 `LayerManagerV5.retrieve(query, limit=5)`
   - 格式化为 Markdown 上下文块，输出到 stdout（Claude Code 钩子读取 stdout 注入 system prompt）
   - Token 截断：粗估 1 token ≈ 4 chars，超限时截断最低相关性结果
   - 问候语检测：命中问候词列表时跳过 recall

2. **创建 `hooks/auto_capture.py`（新建）**
   - 接收环境变量：`HKT_CONTENT`（当前对话轮次内容）、`HKT_SESSION_ID`
   - 调用噪声过滤（见 TASK-04），跳过低信息内容
   - 通过 `LayerManagerV5.store()` 写入，scope=`session:<HKT_SESSION_ID>`
   - `--promote` 模式：将 session scope 高质量记忆（importance > medium）提升到 user scope

3. **配置 Claude Code 钩子 `.claude/settings.json`**：
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

4. **token 上限保护**
   - 配置项：`lifecycle.autoRecallMaxTokens: 512`（`config/default.json`）
   - 超限截断策略：保留最高相关性记忆，丢弃超限部分

5. **session scope 清理策略**
   - `session:<id>` scope 默认 TTL = 7 天（可配置）
   - `--promote` 触发后，高质量记忆复制到 user scope

6. **噪声预过滤（与 TASK-03 同步实现，TASK-04 的最小版）**
   - 规则层（廉价，优先执行）：长度 < 10 字、纯 emoji、问候语关键词
   - 被过滤内容不写入任何层，`filter_count` 记入 stats

**验收标准**：
- [ ] 在 Claude Code 中执行任意工具后，`auto_capture.py` 被触发（stats 的 store_count 验证）
- [ ] 会话开始时，`auto_recall.py` 返回相关记忆注入上下文（≤ 512 tokens）
- [ ] 问候语（"在吗"、"你好"）不触发 recall 也不写入记忆
- [ ] `stats` 中可见 `filter_count`（被噪声过滤的条数）

**关键文件**：
- `hooks/auto_recall.py` (新建)
- `hooks/auto_capture.py` (新建)
- `.claude/settings.json` (钩子配置)
- `config/default.json` (autoRecallMaxTokens 配置项)

---

## P1 实施方案（Q3 2026）

### TASK-04：噪声预过滤增强（Noise Filter）

**对应需求**：GAP-06
**工期**：Q3 Month 1（3–5 天，可提前到 Week 5 与 TASK-03 并行）

**创建 `filters/noise_filter.py`**：
- `NoiseFilter` 类，提供 `is_noise(text: str) -> bool`
- 规则层：长度过滤、纯 emoji 检测、问候语列表、重复字符
- 可选 Embedding 层（`noise_filter.use_embedding=true` 时启用）：余弦相似度 > 0.9 判定为噪声
- 集成到 `layers/manager_v5.py` 的 `store()` 入口处

### TASK-05：REST API 端点对齐

**对应需求**：GAP-05
**工期**：Q3 Month 1（2–3 天）

在 `mcp/server.py` 的 Flask app 新增语义化端点：
```
POST /store   → tools.memory_store()
POST /recall  → tools.memory_recall()
POST /forget  → tools.memory_forget()
GET  /stats   → tools.memory_stats()
```

`uv run scripts/hkt_memory_v5.py serve` 或 `uv run mcp/server.py --mode http` 启动（默认 8765 端口）。

### TASK-06：实体关系提取最小可行版

**对应需求**：GAP-04
**工期**：Q3 Month 2（1 周）

- 扩展 L1 提取 Prompt，提取三元组 `[主体, 关系, 客体]`
- 新建 `graph/entity_index.py`（SQLite 表：entity_triples）
- `retrieve()` 增加可选参数 `entity: str`
- 时效标记：`valid_until` 超期记忆在检索结果中标注 ⚠️

---

## P2 实施方案（Q4 2026）

| GAP | 任务 | 预期产出 |
|-----|------|---------|
| 结构化反射/自改进 | TASK-07 | `governance/SKILLS.md` 自动更新 |
| SQLite 向量索引后端 | TASK-08 | P95 检索延迟 < 200ms（1000 条规模） |
| 更多重排序提供商 | - | Voyage AI / Cohere Rerank 与现有 Jina/SiliconFlow 并列 |

---

## 实施路线图

```
Q2 2026（当前季度）
├── Week 1-2: [P0] TASK-01 生命周期链路验证与修复
│   ├── 验证 stats 输出生命周期状态分布
│   ├── 修复 MCP memory_forget 软删除语义
│   └── 补充 MCP memory_cleanup 工具（如缺失）
├── Week 3-4: [P0] TASK-02 MCP 工具端到端集成测试
│   ├── 新建 tests/test_mcp_integration.py
│   ├── 修复 memory_update 返回结构化错误
│   └── 更新 MCP capabilities 版本为 v5
└── Week 5-6: [P0] TASK-03 Auto-Capture/Auto-Recall（新建）
    ├── hooks/auto_recall.py（会话开始自动回忆）
    ├── hooks/auto_capture.py（会话结束自动捕获）
    ├── .claude/settings.json 钩子配置
    └── 噪声过滤规则层（最小版）

Q3 2026
├── Month 1: TASK-04 噪声过滤增强 + TASK-05 REST API
├── Month 2: TASK-06 实体关系提取最小版 + 事实时效标记
└── Month 3: （缓冲/回顾）

Q4 2026
├── Month 1: TASK-07 结构化反射/自改进管道
├── Month 2: TASK-08 SQLite 向量索引后端（可选）
└── Month 3: 更多重排序提供商 + 性能基准测试
```

---

## 文件变更汇总

### 新建文件

| 文件 | 所属任务 | 说明 |
|------|---------|------|
| `hooks/auto_recall.py` | TASK-03 | Claude Code 钩子：会话开始自动回忆 |
| `hooks/auto_capture.py` | TASK-03 | Claude Code 钩子：会话结束自动捕获 |
| `tests/test_mcp_integration.py` | TASK-02 | MCP 工具 9 个核心工具集成测试 |
| `filters/noise_filter.py` | TASK-04 | 噪声预过滤器（规则层 + 可选 Embedding） |
| `graph/entity_index.py` | TASK-06 | 实体关系三元组 SQLite 索引 |
| `governance/reflection_analyzer.py` | TASK-07 | 结构化反射分析器 |

### 修改文件

| 文件 | 所属任务 | 修改内容 |
|------|---------|---------|
| `mcp/tools.py` | TASK-01/02 | 补充 memory_cleanup；修复 memory_forget 软删除；memory_update 返回结构化错误 |
| `mcp/server.py` | TASK-01/02/05 | 版本号 → v5；注册 memory_cleanup；新增 /store /recall /forget /stats REST 端点 |
| `scripts/hkt_memory_v5.py` | TASK-01/05 | stats 输出生命周期状态分布；添加 serve 子命令 |
| `lifecycle/memory_lifecycle.py` | TASK-01/04 | get_stats() 增加 filter_count 字段 |
| `layers/manager_v5.py` | TASK-03/04/06 | store 入口集成噪声过滤；store 后集成 entity_index；retrieve 支持 entity 参数 |
| `config/default.json` | TASK-03 | 新增 autoRecallMaxTokens、autoCapture.enabled 配置项 |
| `.claude/settings.json` | TASK-03 | 配置 PreCompact/PostToolUse 钩子 |

---

## 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| MCP 工具验证发现大量断裂 | P0 Week 3-4 延期 | 优先修复 store/recall/stats 三个核心工具 |
| Claude Code 钩子 API 变更 | Auto-Capture 方案失效 | 保留 CLI 手动模式作为 fallback |
| auto_capture 内容来源不稳定（PostToolUse 可能拿不到完整对话） | TASK-03 降级 | 降级方案：仅捕获工具输出摘要 |
| 软删除引入检索逻辑复杂度 | retrieve 性能下降 | 软删除记忆使用单独索引，默认不加载 |
| LLM 三元组提取质量（中文语义复杂） | TASK-06 精度不足 | MVP 版只做实体识别，不强求关系准确性；降级为 jieba 实体词典匹配 |

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

*更新时间*: 2026-04-15
*来源 Brainstorm*: docs/brainstorms/hktmemory-openvikings-agent-requirements.md
*来源计划*: docs/plans/hktmemory-openvikings-agent-plan.md
*工作流*: Gale Compound (Lightweight mode)
