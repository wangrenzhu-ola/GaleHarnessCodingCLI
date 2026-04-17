# HKTMemory vs OpenVikings Agent：差距分析与需求清单

**分析日期**: 2026-04-15
**当前版本**: HKTMemory v5.0
**参照基准**: OpenVikings Agent 记忆库（及同类系统 LanceDB Pro、Mem0、Graphiti）

---

## 执行摘要

HKTMemory v5 已在三层分层存储、LLM 智能摘要、混合检索、Weibull 衰减、多作用域隔离等核心能力上达到同类前水准，是目前已知同类开源方案中分层架构最完整的中文友好记忆系统之一。

然而，与 OpenVikings Agent 等以"生产级 Agent 自治"为目标的记忆系统相比，HKTMemory v5 在以下维度仍存在显著差距：

| 差距维度 | 当前状态 | 目标状态 | 优先级 |
|---------|---------|---------|-------|
| **Auto-Capture / Auto-Recall** | 完全手动 CLI | 会话自动捕获与注入 | P0 |
| **生命周期 TTL/Prune 接入** | OpenSpec 草案未接入主链路 | CLI/MCP 统一 forget/cleanup | P0 |
| **MCP 工具完整度** | 模块存在，端到端未验证 | 9 个工具全链路可用 | P0 |
| **知识图谱 / 时序事实** | 无 | 实体关系 + Bi-Temporal | P1 |
| **REST API** | 仅 CLI | HTTP API + SDK | P1 |
| **噪声过滤** | 无 | Embedding + Regex 预过滤 | P1 |
| **反射/自改进管道** | 基础 LEARNINGS.md | 结构化多模块反射 | P2 |
| **存储可扩展性** | 文件系统 O(N) | 可插拔 DB 后端 | P2 |

---

## 一、HKTMemory v5 当前能力基线

### 已实现

| 能力模块 | 状态 | 说明 |
|---------|------|------|
| L0/L1/L2 三层存储 | ✅ | 写入 L2 自动触发 L1/L0 提取 |
| LLM 智能提取 | ✅ | 6 类（fact/preference/entity/decision/pattern/constraint） |
| 混合检索 | ✅ | Vector（智谱 Embedding-3）+ BM25（SQLite FTS5）0.7/0.3 融合 |
| 自适应检索 | ✅ | 问候跳过，remember 关键词强制检索 |
| Weibull 衰减 | ✅ | Core/Working/Peripheral 三层，access_boost 对数增强 |
| 层级升降级 | ✅ | 基于访问次数和综合分数自动 promote/demote |
| MMR 多样性 | ✅ | 相似度 > 0.85 降权 |
| Cross-Encoder 重排序 | ✅ | Jina / SiliconFlow |
| Multi-Scope 隔离 | ✅ | global / agent / project / user / session 五种 |
| 两阶段去重 | ✅ | 向量过滤 (≥0.85) + LLM 决策，6 种去重动作 |
| CLI 命令集 | ✅ | store / retrieve / sync / rebuild / stats / forget / restore / pin / importance / feedback / test |
| MCP 模块 | ⚠️ | server.py + tools.py 存在，端到端可用性待验证 |
| 生命周期治理 | ⚠️ | OpenSpec 设计完成，尚未接入 manager_v5 / CLI / MCP 主链路 |
| 记忆治理日志 | ✅ | LEARNINGS.md / ERRORS.md，状态管理 pending → validated → integrated |

---

## 二、差距分析：P0 关键缺口

### GAP-01：Auto-Capture / Auto-Recall（自动捕获与回忆）

**问题描述**：当前所有记忆写入和检索均需手动执行 CLI 命令，Agent 在会话开始时无法自动加载历史上下文，会话结束时无法自动归档关键信息。OpenVikings Agent 通过 SessionStart 钩子自动回忆、通过 PostTurn 钩子自动捕获，实现零干预记忆闭环。

**需求**：

#### Requirement: 会话开始自动回忆

**WHEN** Agent 会话初始化（SessionStart 事件触发）
**AND** 当前任务描述或用户输入可被解析为查询
**THEN** 系统自动执行 retrieve，将相关记忆注入 system prompt 上下文
**AND** 不阻塞主任务执行流程
**AND** 注入内容不超过配置的 token 上限

#### Requirement: 会话结束自动捕获

**WHEN** Agent 会话结束或 PostTurn 事件触发
**AND** 本轮对话包含决策、偏好、事实类信息
**THEN** 系统自动提取并调用 store 写入记忆
**AND** 无需用户手动触发
**AND** 自动捕获的记忆默认 scope 为 `session:<id>`，可提升到 user/project

#### Requirement: 噪声预过滤

**WHEN** 自动捕获触发
**THEN** 系统使用规则（短语/emoji/问候语）+ 可选 Embedding 过滤低信息内容
**AND** 被过滤内容不写入记忆层

**验收标准**：
- Claude Code 钩子（PreTool / PostTool / SessionStart）可触发 retrieve/store
- 注入上下文有 token 上限保护（默认 512 tokens）
- 自动捕获有噪声过滤，过滤率可在 stats 中查看

---

### GAP-02：生命周期 TTL/Prune 接入主链路

**问题描述**：`openspec/changes/update-memory-lifecycle-from-lancedb-pro/spec.md` 已完成设计，但尚未接入 `scripts/hkt_memory_v5.py`、`layers/manager_v5.py`、`mcp/tools.py`。当前 forget 命令未走软删除语义，stats 未显示生命周期状态分布，cleanup 命令不存在。

**需求**：

#### Requirement: forget 走软删除主路径

**WHEN** 用户或 Agent 执行 forget
**AND** 未指定 `--force`
**THEN** 目标记忆状态变为 `disabled`
**AND** 默认检索跳过 disabled 记忆
**AND** 返回变更结果与恢复提示

#### Requirement: 生命周期状态写入 manager_v5

**WHEN** store / forget / restore 操作执行
**THEN** 对应记忆元数据包含 lifecycle_state 字段（active / disabled / archived / deleted）
**AND** retrieve 默认只返回 active 状态记忆

#### Requirement: cleanup 命令

**WHEN** 用户执行 cleanup
**THEN** 系统支持 dry-run 与实际清理两种模式
**AND** 返回处理数量、scope 分布、跳过原因
**AND** 被 pin 或高重要度记忆不参与自动裁剪

#### Requirement: stats 展示生命周期概况

**WHEN** 用户执行 stats
**THEN** 显示 active / disabled / archived / deleted 数量分布
**AND** 显示最近一次 cleanup 时间与事件 TTL 配置

**验收标准**：
- forget 默认软删除，--force 硬删除
- store 写入后当 scope 超限自动触发 prune（可配置关闭）
- stats 输出包含生命周期状态分布

---

### GAP-03：MCP 工具端到端可用性

**问题描述**：`mcp/server.py` 和 `mcp/tools.py` 已存在，但没有集成测试覆盖，无法确认 9 个工具全部可用。与 OpenVikings Agent 提供完整 MCP 工具集相比，HKTMemory 的 MCP 层处于"存在但未验证"状态。

**需求**：

#### Requirement: 9 个核心 MCP 工具全链路可用

| 工具 | 功能 | 状态目标 |
|------|------|---------|
| `memory_store` | 写入记忆（自动三层） | 可用 |
| `memory_recall` | 检索记忆（混合检索） | 可用 |
| `memory_forget` | 软删除记忆 | 可用 |
| `memory_restore` | 恢复已删除记忆 | 可用 |
| `memory_update` | 更新已有记忆内容 | 可用 |
| `memory_stats` | 返回系统统计 | 可用 |
| `memory_list` | 列举指定 scope 记忆 | 可用 |
| `self_improvement_log` | 记录学习/错误 | 可用 |
| `self_improvement_extract_skill` | 从交互提取技能 | 可用 |

#### Requirement: MCP 工具集成测试

**WHEN** MCP server 启动
**THEN** 所有工具可通过 Claude Code 或 MCP client 调用
**AND** 工具调用返回结构化 JSON 结果
**AND** 错误情况返回可解析的 error 对象

**验收标准**：
- `uv run scripts/hkt_memory_v5.py test` 覆盖 MCP 工具调用路径
- MCP server 可在 Claude Code `--mcp-server` 模式下启动

---

## 三、差距分析：P1 重要缺口

### GAP-04：知识图谱与时序事实（Temporal Knowledge Graph）

**问题描述**：Graphiti 等系统支持 Bi-Temporal 建模（valid_from/valid_to）与实体关系图遍历，事实可自动失效。HKTMemory 当前仅有时间戳，无法表达"事实在某时间点后不再成立"或"实体 A 与实体 B 的关系变化"。

**需求**：

#### Requirement: 实体关系提取（最小可行版）

**WHEN** 存储包含实体类记忆
**THEN** 系统可提取 (主体, 关系, 客体) 三元组
**AND** 存储在轻量关系索引（SQLite / JSON 图）中
**AND** retrieve 支持按实体名过滤

#### Requirement: 事实时效标记

**WHEN** 记忆内容包含时效性声明（如"截止日期"、"当前版本"）
**THEN** 记忆元数据可标记 valid_until 字段
**AND** 过期事实在检索时降权或标记 ⚠️

**验收标准**：
- L1 摘要中包含实体标签
- 检索结果可按实体名过滤
- 过期事实有视觉标注

---

### GAP-05：REST API

**问题描述**：当前仅支持 CLI 调用，无法被外部 Agent、Web 服务、其他工具通过 HTTP 集成。OpenVikings Agent 和 Mem0 均提供 REST API，支持 /store、/recall、/forget、/stats 等端点。

**需求**：

#### Requirement: 最小 REST API 服务

**WHEN** 执行 `uv run scripts/hkt_memory_v5.py serve`
**THEN** 系统在本地启动 HTTP 服务（默认 8765 端口）
**AND** 支持 POST /store、POST /recall、POST /forget、GET /stats 四个端点
**AND** 请求/响应格式为 JSON
**AND** 不需要认证（本地运行场景）

**验收标准**：
- curl 可调用 /recall 并返回记忆列表
- Claude Code 可通过 bridge script 调用 REST API

---

### GAP-06：噪声过滤（Noise Filter）

**问题描述**：自动捕获场景下，大量低信息内容（问候、确认词、单字回复）如果写入记忆会产生噪声。OpenVikings Agent 用 Embedding + Regex 双层过滤。

**需求**：

#### Requirement: 预存储噪声过滤

**WHEN** 记忆写入前
**THEN** 系统先经过规则层（长度 < 10字、纯 emoji、问候语关键词）
**AND** 可选的 Embedding 余弦相似度与"低信息锚点向量"比较
**AND** 低信息内容直接跳过，不写入任何层
**AND** 过滤行为记录到 stats（filter_count）

**验收标准**：
- "好的"、"OK"、"在吗"不写入记忆
- 过滤率可在 stats 中查看

---

## 四、差距分析：P2 增强缺口

### GAP-07：结构化反射/自改进管道

**问题描述**：当前 LEARNINGS.md 和 ERRORS.md 为手动记录，缺乏自动分析和技能提取链路。LanceDB Pro 有 8 模块反射系统，可从历史交互中自动提取可复用 skill。

**需求**：

#### Requirement: 结构化反射触发

**WHEN** 用户反馈 feedback --label useful/wrong
**OR** 记忆被访问超过阈值次数
**THEN** 系统可提示运行反射分析，输出可提取的 pattern 或 skill
**AND** 提取的 skill 写入 governance/SKILLS.md

**验收标准**：
- feedback 触发反射分析
- SKILLS.md 有可读的技能条目

---

### GAP-08：存储可扩展性（可插拔 DB 后端）

**问题描述**：当前全部基于 Markdown 文件系统，O(N) 全量扫描，大规模下性能退化。应支持 SQLite 作为过渡后端，长期可插拔 LanceDB/Chroma。

**需求**：

#### Requirement: SQLite 向量索引后端（可选）

**WHEN** 配置 `vector_backend: sqlite`
**THEN** 系统使用 sqlite-vss 或 faiss 作为向量索引
**AND** 文件系统仍保留为人类可读的"真实存储"
**AND** 向量索引作为加速层，可重建

**验收标准**：
- `sync --rebuild-index` 可从文件重建 SQLite 向量索引
- 检索延迟 P95 < 200ms（1000 条记忆规模）

---

### GAP-09：更多重排序提供商

**需求**：新增 Voyage AI 和 Cohere Rerank 支持，与现有 Jina/SiliconFlow 并列。

---

## 五、优先级路线图

```
Q2 2026（当前季度）
├── Week 1-2: [P0] 生命周期 TTL/Prune 接入主链路（manager_v5 + CLI + MCP）
├── Week 3-4: [P0] MCP 工具端到端测试与修复
└── Week 5-6: [P0] Auto-Capture/Auto-Recall 最小版（Claude Code 钩子集成）

Q3 2026
├── Month 1: [P1] 噪声过滤 + REST API 最小服务
├── Month 2: [P1] 实体关系提取最小版 + 事实时效标记
└── Month 3: [P2] 结构化反射管道 + SKILLS.md 提取

Q4 2026
├── Month 1: [P2] SQLite 向量索引后端（可选）
├── Month 2: 更多重排序提供商
└── Month 3: 性能测试与基准对比
```

---

## 六、竞品对比矩阵（v5 更新版）

| 特性 | HKTMemory v5 | OpenVikings Agent | LanceDB Pro | Mem0 | Graphiti |
|------|:-----------:|:-----------------:|:-----------:|:----:|:--------:|
| L0/L1/L2 分层存储 | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| 自动三层提取 | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| 混合检索 (Vector+BM25) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Weibull 衰减 | ✅ | ✅ | ✅ | ❌ | ❌ |
| MMR 多样性 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Multi-Scope 隔离 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 两阶段去重 | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Auto-Capture/Auto-Recall | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| 生命周期 TTL/Prune | ⚠️ 草案 | ✅ | ✅ | ⚠️ | ❌ |
| MCP 协议 | ⚠️ 待验证 | ✅ | ✅ | ❌ | ✅ |
| 知识图谱 | ❌ | ✅ | ❌ | ⚠️ | ✅ |
| Bi-Temporal 事实 | ❌ | ⚠️ | ❌ | ❌ | ✅ |
| REST API | ❌ | ✅ | ✅ | ✅ | ✅ |
| 噪声过滤 | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| 反射/自改进管道 | ⚠️ 基础 | ✅ | ✅ | ❌ | ❌ |
| 中文友好 | ✅ 原生 | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| 智谱 AI 集成 | ✅ | ❌ | ❌ | ❌ | ❌ |

**图例**: ✅ 完全支持 | ⚠️ 部分/草案 | ❌ 不支持

---

## 七、核心结论

**HKTMemory v5 的差异化优势**：
- 中文原生支持（智谱 Embedding + jieba 分词 + BM25 中文分词）
- 三层分层架构 + 渐进式检索是同类方案中最完整的
- Markdown 可读存储 + 向量索引双轨，兼顾调试和性能

**最需要补齐的三个能力**（按优先级）：
1. **Auto-Capture/Auto-Recall**：这是从"手动工具"到"Agent 自治记忆"的关键跨越
2. **生命周期 TTL/Prune 接入**：OpenSpec 设计已就绪，接入成本低，收益高
3. **MCP 工具端到端验证**：基础设施已在，补测试即可达到生产标准

---

*生成时间*: 2026-04-15
*作者*: Gale Compound Brainstorm
*数据来源*: FEATURE_GAP.md (v4 评审), DESIGN.md (v4.5), README.md (v5), openspec/changes/update-memory-lifecycle-from-lancedb-pro/spec.md
