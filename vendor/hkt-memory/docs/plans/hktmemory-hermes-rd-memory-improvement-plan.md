# HKTMemory 面向研发场景借鉴 Hermes 的改进规划

**计划日期**: 2026-04-20
**版本**: v1.0
**定位**: 面向研发项目开发的长期记忆系统演进清单
**参考来源**:
- `docs/plans/hktmemory-openvikings-agent-plan.md`
- `docs/brainstorms/hktmemory-openvikings-agent-requirements.md`
- Hermes Agent 源码与文档调研

---

## 背景

HKTMemory 当前已经具备较强的研发型记忆内核能力：

- L2 原文存储 + L1/L0 自动提取
- 混合检索（向量 + lexical）
- 生命周期治理（forget / restore / prune / feedback）
- MCP 工具暴露
- 可审计、可读的本地文件存储

但如果从“研发项目开发”这个目标看，Hermes 仍有几类能力值得借鉴。重点不在于复制 Hermes 的扁平 `MEMORY.md` 方案，而在于吸收其更强的：

- 会话级回忆
- 运行时上下文编排
- 异步预取
- 作用域隔离
- 安全防护
- 插件化 memory 接口

一句话目标是：

**让 HKTMemory 从“可调用的记忆库”进一步进化为“面向研发 agent 的记忆运行时”。**

---

## 设计原则

### 保留的核心优势

- 保留 HKTMemory 的 L2/L1/L0 分层架构
- 保留本地可读、可审计、可重建的存储方式
- 保留生命周期治理和工程型 metadata
- 保留面向 repo / task / project 的工程记忆导向

### 不照搬的部分

- 不引入 Hermes 那种以 `MEMORY.md` / `USER.md` 为核心的扁平长期记忆作为主方案
- 不把 HKTMemory 过度改造成通用聊天助手记忆系统
- 不把所有回忆都变成常驻 prompt 注入

### 优先借鉴的方向

- 借鉴 Hermes 的“什么时候回忆”
- 借鉴 Hermes 的“回忆哪一类内容”
- 借鉴 Hermes 的“如何把回忆接入 agent runtime”

---

## 改进总览

| 方向 | 借鉴点 | 对研发场景的价值 | 优先级 |
|------|--------|------------------|--------|
| 会话搜索 | `session_search` + recent mode | 回答“上次做到哪了”“之前怎么修的” | P0 |
| 回忆编排 | recall orchestrator | 每轮自动决定注入哪些上下文 | P0 |
| 异步预取 | background prefetch | 降低 recall 延迟，提升对话流畅度 | P0 |
| 安全门禁 | memory safety baseline + safety gate | 防 prompt injection / secret 泄露 | P0 |
| 最小插件契约 | minimal memory provider contract | 让 orchestrator / prefetch 避免直接耦合本地 manager | P0 |
| 作用域血缘 | session / task / branch / PR lineage | 让记忆真正绑定研发任务边界 | P1 |
| 插件接口 | memory provider SPI | 支持多类记忆后端协同 | P1 |
| 触发式沉淀 | memory nudge / extraction policy | 只沉淀稳定结论，减少噪声 | P1 |
| 多视角记忆 | persona-aware memory views | coder / reviewer / planner 各取所需 | P2 |

---

## P0：立即值得做

### P0 前置要求

- Session memory 的建设应优先复用现有 session hot context / session scope 链路，不新起一套平行的 recent 存储体系
- 凡是会进入 prompt 注入路径的记忆，必须先经过最小安全门禁，再允许 orchestrator 扩大接入范围
- orchestrator 与 prefetch 上线前，先抽出最小 memory provider contract，避免第二阶段写出只适配本地 manager 的一次性实现
- Session transcript 不仅要“可搜索”，还要纳入 retention / redact-before-store / forget / prune / reindex 的生命周期治理

---

### 1. 会话搜索与 Recent Mode

**目标**：补齐一条独立于长期知识库的“研发过程记忆层”。

**为什么重要**：

- 很多研发信息不适合写入长期知识
- 但这些信息对后续开发极其关键
- 例如排查路径、失败尝试、临时结论、当时的上下文

**实施清单**：

- [ ] 在现有 session hot context / session scope 基础上扩展 session transcript / recent 存储层，避免并行双写
- [ ] 明确旧链路与新链路的 source of truth，必要时提供迁移与兼容策略
- [ ] 记录任务级/会话级交互摘要，并区分 transcript、summary、highlight 三类数据
- [ ] 建立 FTS5 或等价全文索引，支持关键词检索
- [ ] 支持空查询 recent mode，直接返回最近任务/会话摘要
- [ ] 支持按 `task_id`、`project`、`branch`、`pr` 过滤
- [ ] 为 transcript 索引补齐 retention、forget、prune、reindex 规则
- [ ] 提供 `memory_session_search` MCP 工具或等价入口

**验收标准**：

- [ ] 可回答“我上次做到哪了”
- [ ] 可回答“之前这个问题怎么修过”
- [ ] 不需要将此类信息提前固化到 L0/L1/L2 长期层
- [ ] Session memory 只有一套明确的 source of truth，不出现并行 recent/session 双体系
- [ ] forget / prune 后，transcript 本体与全文索引状态一致

---

### 2. Recall Orchestrator

**目标**：在 `retrieve()` 之上增加一层“运行时记忆编排器”。

**为什么重要**：

- 研发 agent 不缺检索函数，缺的是“这一轮应该带什么上下文”
- 当前 HKTMemory 更像被动 memory API
- Hermes 的启发是把 recall 升级成 runtime policy

**实施清单**：

- [ ] 先定义 orchestrator 依赖的最小 memory provider contract，至少覆盖 `retrieve`、`list_recent`、`prefetch`
- [ ] 新增 `memory_orchestrator` 模块，统一调度 recall
- [ ] 定义 4 类注入源：
  - 长期知识：L0/L1/L2
  - 最近任务摘要：session memory
  - 失败案例：debug / issue / postmortem
  - 项目约束：repo conventions / governance / instructions
- [ ] 根据场景决定召回策略：
  - 新任务开始
  - 用户提到“上次/之前/那个 PR”
  - 进入 debug 模式
  - 准备写代码
  - 准备 review / commit / PR
- [ ] 支持 token budget 和注入优先级
- [ ] 支持注入解释信息，明确每类 recall 的来源、命中原因与裁剪原因
- [ ] 将最小安全门禁接入 orchestrator 注入路径，作为默认前置步骤

**验收标准**：

- [ ] 同样的 query，在 debug、implement、review 场景下注入内容不同
- [ ] 注入上下文可解释，能说明“为什么召回这些记忆”
- [ ] 平均上下文更短，但命中率更高
- [ ] orchestrator 不直接依赖单一本地 manager 实现即可运行

---

### 3. 异步预取机制

**目标**：让高概率 recall 在需要前就准备好。

**为什么重要**：

- 研发仓库大、任务链长，实时 recall 经常拖慢主流程
- Hermes 的 provider prefetch 很适合挪用到 HKTMemory

**实施清单**：

- [ ] 基于最小 memory provider contract 定义统一 `prefetch` 入口，而不是把预取逻辑写死在本地 manager
- [ ] 对高信号触发词做 prefetch：
  - 任务名
  - 模块名
  - PR 号
  - issue 号
  - 特定错误关键词
- [ ] 把 prefetch 结果放入短时缓存
- [ ] orchestrator 优先消费缓存，再补发实时检索
- [ ] 提供超时与取消机制，避免后台检索堆积
- [ ] 为缓存命中率、取消率和平均延迟建立基础指标

**验收标准**：

- [ ] 用户提到熟悉任务时，首轮 recall 延迟明显降低
- [ ] prefetch 失败不影响主流程
- [ ] 不会因为后台 recall 导致主线程阻塞
- [ ] 更换 provider 后不需要重写 prefetch 调度逻辑

---

### 4. Memory Safety Baseline

**目标**：在扩大 session recall 与 prompt 注入前，先补齐最小安全基线。

**为什么重要**：

- Session transcript 天然更容易包含日志、命令、URL、token 和一次性敏感上下文
- 如果先做 session search / orchestrator，再补安全门禁，风险窗口会明显增大
- 对研发 memory 来说，“可存储”与“可注入”必须从第一天就分开定义

**实施清单**：

- [ ] 在注入前增加 prompt injection 规则扫描
- [ ] 在注入前增加 secret / exfiltration 模式扫描
- [ ] 对高风险命令片段、URL、token 做脱敏或拒绝注入
- [ ] 为 session transcript 定义 redact-before-store 规则
- [ ] 为 session transcript 定义 retention、forget、prune、reindex 的最小治理规则
- [ ] 区分“允许存储”“允许注入”“允许原文展示”三套安全等级

**验收标准**：

- [ ] 可疑内容默认不可进入 orchestrator 注入上下文
- [ ] 明文 secret 不进入注入上下文，且高风险片段在入库前即可被标记或脱敏
- [ ] session transcript 的存储边界、注入边界、治理边界清晰
- [ ] Memory Safety Baseline 可作为 orchestrator 上线前置条件

---

## P1：强烈建议补齐

### 5. 任务血缘与作用域模型

**目标**：让记忆不仅知道“内容是什么”，还知道“属于哪条研发链路”。

**实施清单**：

- [ ] 在 metadata 中补充：
  - `session_id`
  - `task_id`
  - `branch`
  - `pr_id`
  - `issue_id`
  - `repo`
- [ ] 支持父子 session / task lineage
- [ ] recall 时优先召回同 lineage 下的记忆
- [ ] 对跨 lineage 的记忆默认降权

**验收标准**：

- [ ] 同一个 bugfix 任务链中的记忆更容易被召回
- [ ] 不同项目/分支之间的历史不会互相污染

---

### 6. Memory Safety Gate（增强版）

**目标**：在 baseline 之上，把安全能力扩展成可配置、可评估、可审计的 memory gate。

**为什么重要**：

- 研发记忆中常出现 shell 命令、日志、配置、token、URL
- 一旦回忆内容可注入 prompt，风险比普通文档更高

**实施清单**：

- [ ] 将 safety rule 体系配置化，支持按 provider / scope / persona 调整策略
- [ ] 为敏感命中提供审计日志和拒绝原因说明
- [ ] 为不同风险类型建立 allowlist / denylist / redact policy
- [ ] 将安全命中统计纳入 memory 评估指标

**验收标准**：

- [ ] 可疑内容可被拒绝注入
- [ ] 明文 secret 不进入注入上下文
- [ ] 存储层和注入层的安全边界清晰
- [ ] 安全策略调整后可以量化观察误杀率与漏检率变化

---

### 7. Provider / Backend SPI

**目标**：把 HKTMemory 核心变成 memory kernel，把不同记忆源做成可插模块。

**实施清单**：

- [ ] 第一阶段先抽出最小 contract，第二阶段扩展为完整 SPI，避免 orchestrator / prefetch 先对本地 manager 写死依赖
- [ ] 抽象统一接口，例如：
  - `store`
  - `retrieve`
  - `prefetch`
  - `list_recent`
  - `summarize_context`
- [ ] 将现有本地分层存储作为默认 provider
- [ ] 预留以下扩展位：
  - session provider
  - workspace docs provider
  - remote KB provider
  - graph provider
- [ ] orchestrator 面向 SPI 编排，而不是只面向本地 manager

**验收标准**：

- [ ] 新增记忆后端不需要改核心 recall policy
- [ ] 不同 provider 可以独立启停和评估效果

---

### 8. 触发式沉淀策略

**目标**：只把稳定、高价值、可复用的信息沉淀进长期记忆。

**实施清单**：

- [ ] 为自动捕获定义明确触发条件：
  - 决策形成
  - 约束确认
  - 修复模式验证成功
  - 项目约定明确
  - 用户偏好稳定出现
- [ ] 为不应沉淀的内容定义跳过规则：
  - 临时调试路径
  - 一次性日志
  - 无结论的探索
  - 会话性噪声
- [ ] 增加 `memory nudge` 机制，在合适时机提醒 agent 进行沉淀

**验收标准**：

- [ ] 长期记忆噪声显著下降
- [ ] L1/L0 内容更像“研发知识”，而不是“过程流水账”

---

## P2：中长期增强

### 9. Persona-aware Memory Views

**目标**：按 agent 角色提供不同记忆视图，而不是所有角色读取同一套 recall。

**实施清单**：

- [ ] 为 `coder` 提供实现细节优先视图
- [ ] 为 `reviewer` 提供风险、回归、边界条件优先视图
- [ ] 为 `planner` 提供约束、决策、范围优先视图
- [ ] orchestrator 根据当前工作模式切换视图

**验收标准**：

- [ ] 不同角色在同一任务上的 recall 结果明显不同
- [ ] 角色切换时无需重新组织底层记忆

---

### 10. 研发记忆评估体系

**目标**：建立针对研发场景的 memory 评估指标，避免只靠主观感觉迭代。

**实施清单**：

- [ ] 定义指标：
  - recall 命中率
  - 注入后任务完成效率
  - 重复提问率
  - 历史 bugfix 复用率
  - 上下文污染率
- [ ] 建立 benchmark 场景：
  - 延续上次任务
  - 找回历史修复方案
  - 新任务读取项目约束
  - review 时找相关风险记忆
- [ ] 对 orchestrator 策略做 A/B 对比

**验收标准**：

- [ ] 每次 memory 策略调整都可量化评估收益
- [ ] 能区分“召回更多”与“召回更对”这两类改进

---

## 建议实施顺序

### 第一阶段：先补安全基线与过程记忆底座

- [ ] memory safety baseline
- [ ] 会话搜索
- [ ] recent mode
- [ ] session transcript / summary / highlight 存储
- [ ] transcript 生命周期治理

### 第二阶段：先抽象最小 contract，再做运行时编排

- [ ] minimal memory provider contract
- [ ] recall orchestrator
- [ ] token budget
- [ ] 场景化注入策略
- [ ] 异步 prefetch

### 第三阶段：做体系化增强

- [ ] lineage 作用域
- [ ] safety gate enhanced policy
- [ ] provider SPI
- [ ] memory nudge

### 第四阶段：做高级优化

- [ ] persona-aware views
- [ ] 指标体系与 benchmark

---

## 最终判断

从研发项目开发视角看，Hermes 最值得 HKTMemory 借鉴的并不是它的扁平 memory 文件，而是以下三件事：

1. **把“历史会话”作为独立记忆平面**
2. **把“回忆”升级成运行时编排能力**
3. **把“记忆系统”做成可插拔、可异步、可安全控制的 runtime**

因此，HKTMemory 的推荐演进方向是：

**继续坚持“结构化工程记忆内核”，同时吸收 Hermes 的“运行时记忆编排能力”。**

---

*生成时间*: 2026-04-20
*作者*: Gale Compound Planning
