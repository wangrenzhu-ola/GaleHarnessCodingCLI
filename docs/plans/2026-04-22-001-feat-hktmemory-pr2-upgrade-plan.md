---
title: "feat: HKTMemory PR #2 升级集成 — gale-task 打通设计"
status: active
origin: docs/brainstorms/2026-04-22-hktmemory-pr2-upgrade-requirements.md
created: 2026-04-22
---

# HKTMemory PR #2 升级集成 — gale-task 打通设计

## 问题框架

P3 的目标是将 gale-task 的 `task_id` 与 HKTMemory 的 `store_session_transcript` 打通，实现会话转录的自动存储与任务关联。

gale-task 作为 GaleHarnessCLI 的任务追踪 CLI，已为 8 个技能提供了 `skill_started` / `skill_completed` / `memory_linked` / `pr_linked` 等事件记录能力。HKTMemory PR #2 引入了 `store_session_transcript` API，支持将完整的会话转录（含安全脱敏）存储到向量库，并通过 `task_id`、`session_id`、`project`、`branch`、`pr_id` 等元数据进行索引和检索。

本设计文档解决的核心问题是：**在技能执行完成后，如何将当前 gale-task 的 `task_id` 作为元数据注入到 HKTMemory 的会话转录存储中，使得后续可以通过 task_id 检索到该任务对应的完整会话历史**。

## P1/P2 实施总结

- **P1: vendor 同步** — `vendor/hkt-memory/` 已同步至 HKTMemory 仓库 PR #2 合并后的最新 commit，包含 `runtime/orchestrator.py`、`runtime/provider.py`、`runtime/safety.py`、新 CLI 子命令（`list-recent`、`prefetch`、`orchestrate-recall`）等全部改动。HKTMemory 自有 pytest 61 passed，GaleHarnessCLI `bun test` 960 passed，无回归。
- **P2: session_search 集成** — `gh:work` 和 `gh:debug` 的 SKILL.md 中已新增 HKT-PATCH 段落（phase-0.6b / phase-0.4b），在执行前调用 `session_search` 查询相关会话历史作为补充上下文。现有 `retrieve` 检索补丁保持不变。
- **P2: Bun 冒烟测试** — 新增 `hkt-memory-cli-smoke.test.ts`，通过 spawn 调用 `hkt_memory_v5.py` 验证 `stats`、`store`、`retrieve`、`session_search`、`list-recent` 共 5 个子命令的 CLI 可达性。

## P3 设计：gale-task 与 store_session_transcript 打通

### 候选方案对比

#### 方案 A: skill_completed 钩子自动存储

- **触发时机**：当 gale-task 收到 `skill_completed` 事件时，自动从 `.context/` 读取当前会话上下文，调用 `store_session_transcript`
- **task_id 映射**：将 gale-task 生成的 `task_id` 直接映射为 `HKT_TASK_ID` 元数据
- **优点**：用户无感知、零配置
- **缺点/风险**：
  - 不是所有技能都产出值得存储的会话内容（例如 `gh:brainstorm` 的头脑风暴中间产物价值较低）
  - 可能存储大量低价值数据，增加向量库负担和 embedding API 调用成本
  - 存储内容的筛选逻辑需要放在 gale-task 侧（按技能类型过滤、按内容长度过滤等），增加 gale-task 的复杂度，违背 gale-task "writer MUST never block skills" 的设计原则
  - 与现有 HKT-PATCH 增量集成模式不一致：当前 8 个技能的 HKTMemory 集成都是通过 SKILL.md 中的显式 HKT-PATCH 段落完成的，而非框架自动触发

#### 方案 B: 技能侧显式触发（推荐）

- **设计**：新增 `gale-task log session_stored` 事件类型，由技能的 HKT-PATCH 段落在合适时机显式调用
- **task_id 传递**：通过 `--task-id` 参数传递当前 `task_id`（从 `.context/galeharness-cli/current-task.json` 读取），映射为 HKTMemory 的 `HKT_TASK_ID` 元数据
- **存储调用**：在 HKT-PATCH 段落中，于 `store` 补丁之后显式调用 `store_session_transcript`，将技能产出的会话摘要或完整转录存入 HKTMemory
- **优点**：
  - **可控**：只存储有价值的内容，避免向量库污染
  - **符合现有模式**：与当前 8 个技能的 `store` HKT-PATCH 风格完全一致（`gh-plan`、`gh-work`、`gh-debug`、`gh-review`、`gh-optimize`、`gh-ideate`、`gh-brainstorm`、`gh-compound` 均采用 `uv run vendor/hkt-memory/scripts/hkt_memory_v5.py store ...` 的显式调用模式）
  - **技能作者决策**：由最了解技能产出价值的作者决定何时存储，而非框架代劳
  - **低侵入**：gale-task 侧仅需新增一个事件类型，不涉及复杂的自动触发和过滤逻辑
- **缺点**：
  - 需要在每个需要存储的技能中显式添加 HKT-PATCH 段落，增加维护负担（但可通过通用模板复用降低）

### 方案对比矩阵

| 维度 | 方案 A (自动存储) | 方案 B (显式触发) |
|------|-------------------|-------------------|
| 用户感知 | 无感 | 无感 |
| 配置复杂度 | 低 | 低 |
| 存储质量 | 可能低（全量存储） | 高（按需存储） |
| 与现有模式一致性 | 低 | 高 |
| 实现复杂度 | 中（需过滤逻辑） | 低（每技能加一段） |
| 扩展性 | 差（过滤规则随技能增加） | 好（各技能独立控制） |
| 对 gale-task 原则的影响 | 违背 "never block" | 符合 "never block" |

### 推荐方案：方案 B

推荐采用**方案 B（技能侧显式触发）**，核心理由如下：

1. **与现有架构一致**：GaleHarnessCLI 的 HKTMemory 集成始终采用 HKT-PATCH 增量模式。从最早的 `gh:compound` 到最新集成的 `session_search`，所有能力都是通过 SKILL.md 中的显式补丁段落引入的。方案 B 延续这一惯例，降低认知负担。
2. **避免框架过度设计**：gale-task 的设计契约明确规定 "all errors are caught, logged to stderr, process.exit(0). The writer MUST never block skills." 如果 gale-task 在 `skill_completed` 时自动调用 embedding API 和向量存储，一旦失败或超时，将违背这一契约。方案 B 将存储操作放在技能侧，技能作者可以自行决定失败处理策略（如 `2>/dev/null || true` 的静默跳过模式）。
3. **存储质量可控**：不同技能的会话价值差异显著。`gh:work` 的长任务执行记录、`gh:debug` 的调试排查过程、`gh:compound` 的完整问题解决链路具有很高的复用价值；而 `gh:brainstorm` 的头脑风暴中间产物、`gh:ideate` 的创意发散过程可能不需要全量存储。技能侧显式触发让作者根据领域知识做出判断。
4. **task_id 传递链路清晰**：方案 B 中，`task_id` 从 `gale-task log skill_started` 生成，写入 `.context/galeharness-cli/current-task.json`，随后被技能的 HKT-PATCH 段落读取并作为 `--task-id` 传递给 HKTMemory。整个链路可追踪、可调试。

### 实现要点

#### 前置条件

> 当前 `vendor/hkt-memory/scripts/hkt_memory_v5.py` CLI 尚未暴露 `store_session_transcript` 子命令（Python API `LayerManagerV5.store_session_transcript` 已存在，但 CLI 层缺少对应入口）。实施前需在 HKTMemory vendor 中新增该 CLI 子命令，或通过独立 Python 脚本封装调用。

#### 数据流

```
技能 SKILL.md 执行流程
  |
  |-- 1. HKT-PATCH:gale-task-start
  |      gale-task log skill_started --skill <name> --title <title>
  |      -> 生成 task_id，写入 .context/galeharness-cli/current-task.json
  |
  |-- 2. 技能主流程执行 ...
  |
  |-- 3. HKT-PATCH:hkt-store（已有）
  |      uv run vendor/hkt-memory/scripts/hkt_memory_v5.py store ...
  |      -> 存储执行摘要到 L0/L1/L2
  |
  |-- 4. HKT-PATCH:session-store（新增）
  |      读取 current-task.json 获取 task_id
  |      uv run vendor/hkt-memory/scripts/hkt_memory_v5.py store-session-transcript \
  |        --content "<会话摘要或完整转录>" \
  |        --session-id "<当前 session 标识>" \
  |        --task-id "<从 current-task.json 读取的 task_id>" \
  |        --project "<当前项目名>" \
  |        --topic "<技能 topic>"
  |      -> 存储到 session_transcript_index（L2 专用索引）
  |
  |-- 5. HKT-PATCH:gale-task-end
  |      gale-task log skill_completed
  |      -> 记录完成事件
  |
  |-- 6. gale-task log session_stored（新增事件类型，可选）
  |      gale-task log session_stored --task-id <id>
  |      -> 在任务追踪中标记该任务已存储会话转录
```

#### 环境变量映射

| 来源 | 变量/字段 | 用途 |
|------|-----------|------|
| gale-task | `GALE_TASK_ID`（生成并持久化到 `current-task.json`） | 当前任务标识 |
| HKTMemory | `HKT_TASK_ID`（作为 `store_session_transcript` 的 `task_id` 参数） | 会话转录关联的任务标识 |
| 映射方式 | `current-task.json` -> `--task-id` CLI 参数 | 在 HKT-PATCH 段落中完成映射 |

#### HKT-PATCH 模板

以下为 `gh:work` 的示例 HKT-PATCH 段落，展示如何在技能中使用 session_store（其他技能可参照此模板调整 `topic` 和摘要内容）：

```markdown
<!-- HKT-PATCH:session-store -->
### Session Transcript Store

After the HKTMemory store (Phase 2.3) is complete, store the session transcript
so future sessions can retrieve this task's full context by task_id:

1. Read the current task_id from `.context/galeharness-cli/current-task.json`
2. Compose a concise session transcript covering: the work goal, key phases
   executed, major decisions, and deviations from the plan
3. Run:
   ```bash
   uv run vendor/hkt-memory/scripts/hkt_memory_v5.py store-session-transcript \
     --content "<session transcript with repo-relative file paths>" \
     --session-id "gh-work-$(date +%Y%m%d-%H%M%S)" \
     --task-id "$(cat .context/galeharness-cli/current-task.json | jq -r .task_id)" \
     --project "$(gale-knowledge extract-project 2>/dev/null || basename $(pwd))" \
     --topic "work-execution"
   ```
4. If the command fails, log the error and continue — this must never block the skill.

<!-- /HKT-PATCH:session-store -->
```

#### 触发时机

- **位置**：技能的 HKTMemory `store` 补丁之后、`gale-task log skill_completed` 之前
- **条件**：仅当技能产出了有价值的会话内容时触发
- **8 个技能中建议优先集成**：
  - `gh:work` — 长任务执行记录，最有价值的会话内容
  - `gh:debug` — 调试排查过程，后续复用价值高
  - `gh:compound` — 完整的问题解决链路，已具备 `memory_linked` 事件，补充 session_store 可实现 task -> memory -> session 的完整关联
- **其余 5 个技能可后续逐步评估**：`gh:plan`、`gh:review`、`gh:optimize`、`gh:ideate`、`gh:brainstorm`

#### 实施路径

1. **在 gale-task 中新增 `session_stored` 事件类型支持**
   - 在 `cmd/gale-task/index.ts` 中新增 `session_stored` 分支，支持 `--task-id` 参数
   - 事件写入 SQLite 任务追踪数据库，标记该任务已存储会话转录

2. **补齐 HKTMemory CLI 的 `store_session_transcript` 子命令**
   - 当前 `vendor/hkt-memory/scripts/hkt_memory_v5.py` CLI 缺少该入口，需在 vendor 层或 wrapper 脚本中新增

3. **为 `gh:work`、`gh:debug`、`gh:compound` 添加 `session_stored` HKT-PATCH**
   - 使用上述模板，调整 topic 和摘要风格
   - 遵循 `2>/dev/null || true` 的静默失败模式

4. **验证 task_id 传递链路完整**
   - `skill_started` 生成 task_id -> `current-task.json` -> HKT-PATCH 读取 -> `store_session_transcript` 参数 -> HKTMemory 索引
   - 验证 `session_search --task-id <task_id>` 可检索到存储的转录

5. **逐步扩展到其余 5 个技能**
   - 评估各技能的会话价值，按需添加 HKT-PATCH

## 未来改进方向

- **会话摘要的自动生成策略**：当前 HKT-PATCH 模板要求技能作者手动编写会话摘要。未来可探索由 LLM 自动从 `.context/` 或技能执行日志中生成结构化摘要，降低作者负担。
- **存储内容的质量评估机制**：在 `store_session_transcript` 之后，可异步运行轻量级质量评分（如内容长度、关键词覆盖、与 task 的关联度），低质量转录自动标记为 `draft`，高质量转录提升检索权重。
- **session_search 与 task_id 的交叉查询能力**：当前 `session_search` 已支持 `--task-id` 过滤。未来可在 `gh:work` 和 `gh:debug` 的 `session_search` HKT-PATCH 中，将当前 `task_id` 作为上下文注入查询，实现 "同一任务的历史会话" 的精准检索。

## 附录：需求追溯

| 需求 | 状态 | 实现 |
|------|------|------|
| R1: Vendor 同步 | 已完成 | `vendor/hkt-memory/` 同步至 PR #2 |
| R2: HKTMemory 测试通过 | 已完成 | pytest 61 passed |
| R3: GaleHarnessCLI 无回归 | 已完成 | bun test 960 passed |
| R4: gh:work session_search | 已完成 | phase-0.6b HKT-PATCH |
| R5: gh:debug session_search | 已完成 | phase-0.4b HKT-PATCH |
| R6: 测试补充 | 已完成 | 87 tests passed |
| R7: Bun 冒烟测试 | 已完成/进行中 | `hkt-memory-cli-smoke.test.ts` |
| R8: 冒烟测试范围 | 已完成/进行中 | CLI 层验证 |
| R9: gale-task 打通设计 | 本文档 | 推荐方案 B |
