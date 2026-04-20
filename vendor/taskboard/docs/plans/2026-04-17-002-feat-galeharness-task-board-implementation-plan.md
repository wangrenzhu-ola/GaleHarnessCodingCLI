---
title: "feat: GaleHarness Task Board 实施计划"
type: feat
status: active
date: 2026-04-17
deepened: 2026-04-17
origin: docs/brainstorms/gale-harness-task-board-requirements.md
---

# feat: GaleHarness Task Board 实施计划

## Overview

基于已更新的需求文档（SQLite 存储、平台层写入、赛博朋克前端），本计划将完成 GaleHarness Task Board 的剩余实现工作。核心任务是修复服务端 SQLite 读取层的健壮性问题，补齐集成测试，以及在前端实现缺失的技能筛选、任务时间线和样式优化。

## Problem Frame

`gh:` 技能调用后没有跨项目的持久可视记录。Board 需要：
1. 可靠地读取本地 SQLite 数据库（`~/.galeharness/tasks.db`）
2. 正确展示任务状态、PR 详情、HKTMemory 关联
3. 支持按项目、状态、技能筛选，以及标题搜索

（详见需求文档：docs/brainstorms/gale-harness-task-board-requirements.md）

## Requirements Trace

- **R1. FR-1**：SQLite 读取层健壮、首次运行不报错、损坏 db 降级为空列表
- **R2. FR-2**：前端支持按技能类型筛选
- **R3. FR-3**：展开卡片展示技能执行时间线（`skill_started`/`skill_completed`/`skill_failed` 带时间戳）
- **R4. FR-4**：本地 Hono 服务稳定运行
- **R5. FR-5**：前端 `usePR` 缓存 key 基于 `pr_url`，防止 PR 变更后展示旧数据
- **SC-8**：`bun test` 通过，包含 SQLite 集成测试

## Scope Boundaries

- 不改写 `tasks.db`（board 只读）
- 不实现 `skill_chain` 多步链路（MVP 明确 out of scope）
- 不做移动端适配
- 不引入 WebSocket / SSE

### Deferred to Separate Tasks

- `bun run board` 自动打开浏览器：独立 PR
- `tasks.db` 超过 10 MB 后的归档/清理：独立 issue

## Context & Research

### Relevant Code and Patterns

- `server/lib/events-reader.ts` — 已部分迁移到 `bun:sqlite`，但构造函数未包裹 `try/catch`，且使用了无效选项 `readonly: true`
- `server/routes/tasks.ts` — `safeTasks` 的解构展开是 no-op，未真正剥离字段
- `server/lib/pr-cache.ts` — 服务端 5 分钟 TTL 缓存已存在且无需改动
- `frontend/src/hooks/usePR.ts` — 缓存 key 错误地使用 `taskId` 而非 `prUrl`
- `frontend/src/components/TaskCard.tsx` — 每实例注入 `<style>` 定义 `@keyframes blink`；大量使用 `onMouseEnter/Leave` 直接操作 DOM style
- `frontend/src/components/TaskList.tsx` — 已有状态筛选和搜索，缺少技能类型下拉筛选
- `frontend/index.html` — 已有全局 `<style>` 标签，是放置全局动画的合适位置
- `tests/events-reader.test.ts` — 仅测试了纯函数 `mergeEvents`，缺少 `readAndMergeTasks` 的 SQLite 集成测试

### Key Technical Decisions

- **Board 负责首次 schema 创建**：虽然写入由 CLI 平台层负责，但 board 的读取端在首次连接时执行 `CREATE TABLE IF NOT EXISTS` 和 `CREATE INDEX IF NOT EXISTS`，确保首次启动不报错。
- **错误降级策略**：db 不存在 → `[]`；db 损坏/锁定 → 捕获异常、`console.error`、返回 `[]`，绝不抛到 Hono 层。
- **缓存 key 修正**：`usePR` 使用 `prUrl` 作为 `Map` key，避免 PR URL 变更后前端展示陈旧数据。
- **Hover 效果迁移**：将 `TaskCard`、`FilterButton` 中的 `onMouseEnter/Leave` 样式操作改为 `:hover` CSS 伪类（放在 `frontend/index.html` 的全局 `<style>` 中），消除 React 虚拟 DOM 漂移风险。
- **时间戳排序**：`mergeEvents` 内从 `localeCompare` 改为 `Date.getTime()` 数值比较，避免非 ISO 字符串的排序异常。

## Open Questions

### Resolved During Planning

- **SQLite 只读 API 选项**：`bun:sqlite` 不支持 `{ readonly: true }`，应使用 `{ create: false, readwrite: false }`。
- **stale 测试策略**：通过为 `mergeEvents` 注入可选的 `now` 参数实现可测试性，默认值 `Date.now()`。

### Deferred to Implementation

- 任务详情时间线的具体视觉样式（实现者参考现有赛博朋克主题自行决定）

## Output Structure

本计划主要修改现有文件，不新建大量目录结构。

## Implementation Units

- [x] **单元 1：修复 SQLite 读取层的健壮性（server）**

**Goal：** 使 `events-reader.ts` 符合需求文档中的错误处理要求，修正 `bun:sqlite` API 使用。

**Requirements：** R1, SC-8

**Dependencies：** 无

**Files：**
- 修改：`server/lib/events-reader.ts`
- 修改：`server/routes/tasks.ts`

**Approach：**
1. 在 `readAndMergeTasks` 中将 `new Database()` 包裹在 `try` 块内；使用 `{ create: false, readwrite: false }` 替代无效的 `readonly: true`
2. 连接成功后执行 `CREATE TABLE IF NOT EXISTS task_events (...)` 和两条 `CREATE INDEX IF NOT EXISTS`
3. 区分「文件不存在」（前置 `existsSync` 返回 `[]`）与「读取异常」（`try/catch` 内返回 `[]` 并 `console.error`）
4. 为 `STALE_HOURS` 增加 `Number.isFinite()` 校验，非法值回退到 `2`
5. `mergeEvents` 中：
   - 将 `localeCompare` 替换为 `new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()`
   - 对 `startedMs` 做 `!Number.isNaN(startedMs)` 防护，非法 timestamp 不转 stale
   - 为 `mergeEvents` 增加可选的 `now?: number` 参数用于测试注入
6. `server/routes/tasks.ts`：将 no-op 的 `safeTasks` 改为显式删除 `project_path`：`allTasks.map(({ project_path, ...task }) => task)`
7. 测试基础设施：集成测试使用 `mkdtempSync` 创建临时目录，复制/创建独立 `tasks.db`，通过 `process.env.BOARD_STALE_HOURS` 控制环境变量，测试后 `rmSync` 清理临时目录

**Test scenarios：**
- Happy path: 对临时 SQLite DB 插入 3 个事件 → `readAndMergeTasks` 返回正确合并的 1 个任务
- Edge case: `tasks.db` 不存在 → 返回 `[]`
- Error path: `tasks.db` 文件被写坏（如写入随机文本）→ `readAndMergeTasks` 返回 `[]` 且进程不崩溃（断言捕获任意异常并降级）
- Edge case: 非法 `BOARD_STALE_HOURS=abc` → 按默认 2 小时处理
- Edge case: `started_at` 为 `"invalid-date"` → 任务保持 `in_progress`，不抛异常
- Edge case: `started_at` 为 3 小时前且默认 `STALE_HOURS=2` → 注入 `now` 参数后状态变为 `stale`
- Edge case: `BOARD_STALE_HOURS=0.5` 且 `started_at` 为 31 分钟前 → 状态变为 `stale`
- Integration: 验证首次连接时 `CREATE TABLE / INDEX IF NOT EXISTS` 成功执行（通过查询 `sqlite_master` 或再次读取不报错）

**Verification：**
- `bun test tests/events-reader.test.ts` 全部通过
- 手动删除 `~/.galeharness/tasks.db` 后启动 `bun run board`，访问 `/api/tasks` 返回 `{"tasks":[]}` 且 HTTP 200

---

- [x] **单元 2：补齐前端缓存与全局样式问题（frontend）**

**Goal：** 修复 `usePR` 缓存 key 错误，移除每个 `TaskCard` 实例注入的 `<style>`，并将 imperative hover 改为 CSS `:hover`。

**Requirements：** R5

**Dependencies：** 无（可与单元 1 并行）

**Files：**
- 修改：`frontend/src/hooks/usePR.ts`
- 修改：`frontend/src/components/TaskCard.tsx`
- 修改：`frontend/src/components/TaskList.tsx`
- 修改：`frontend/index.html`

**Approach：**
1. `usePR.ts`：
   - 修改函数签名为 `usePR(taskId: string, prUrl: string)`
   - 缓存 key 改为 `prUrl`（或 `${taskId}:${prUrl}`）
   - 当 `prUrl` 变化时自动清除/重新获取
2. `frontend/index.html`：
   - 在全局 `<style>` 中添加 `.task-card:hover`、`.filter-btn:hover`、`.cyber-link:hover` 的样式规则
   - 添加 `@keyframes blink` 定义
3. `TaskCard.tsx`：
   - 移除内联的 `<style>` 标签和 `@keyframes blink`
   - 移除 `onMouseEnter/Leave` 中对 `e.currentTarget.style` 的直接修改
   - 为卡片根 div 添加 `className="task-card"`，让全局 CSS 接管 hover
   - PR 链接的 `a` 标签添加 `className="cyber-link"`
4. `TaskList.tsx`：
   - `FilterButton` 的 button 添加 `className="filter-btn"`
   - 移除 `onMouseEnter/Leave` 中的 imperative style mutation

**Test scenarios：**
- Happy path: 展开含 `pr_url` 的卡片 → 正常请求 PR 数据并缓存
- Edge case: 同一 task 的 `pr_url` 变更后（可通过 mock 或重新挂载验证）→ 前端重新请求新 PR 数据，不命中旧缓存
- Integration: 渲染 10 个 TaskCard → DOM 中只存在 1 个 `@keyframes blink` 定义（在全局 style 中），不存在组件级 `<style>` 节点

**Verification：**
- 开发模式下展开 PR 卡片，Network 面板显示只请求一次；修改 `pr_url` 后再次请求
- React DevTools / DOM Inspector 中无重复 `<style>` 标签

---

- [x] **单元 3：实现技能类型筛选与任务详情时间线（frontend）**

**Goal：** 补齐需求中缺失的技能筛选器和任务详情时间线展示。

**Requirements：** R2, R3

**Dependencies：** 单元 2（全局 CSS 和组件结构调整完成后更稳）

**Files：**
- 修改：`frontend/src/components/TaskList.tsx`
- 修改：`frontend/src/components/TaskCard.tsx`

**Approach：**
1. `TaskList.tsx`：
   - 新增状态 `skillFilter`，默认值 `"all"`
   - 从 `tasks` 动态提取所有唯一 `skill` 值（过滤掉空值）
   - 在 filter bar 增加一个技能类型下拉筛选（`<select>` 或按钮组），与现有状态筛选并列
   - `filtered` 计算中加入 `skillFilter !== "all" && t.skill !== skillFilter` 的过滤条件
2. `TaskCard.tsx`：
   - 展开详情区域新增「执行时间线」区块
   - 采用**简单方案**：直接利用 `DerivedTask` 已有的 `started_at`、`completed_at`、`status`、`error` 字段展示时间线，无需修改后端类型或合并逻辑
   - 时间线展示内容：
     - Started: `started_at`
     - Completed/Failed: `completed_at`（仅当状态为 `completed` 或 `failed` 时显示）
     - Error: `error`（仅当 `failed` 时显示）
   - 样式保持现有赛博朋克内联风格，不引入新的 imperative hover

**Patterns to follow：**
- 保持现有赛博朋克内联样式风格（但不要新增 imperative hover）

**Test scenarios：**
- Happy path: 从 skills 下拉选择 `gh:work` → 列表只显示 `skill === "gh:work"` 的任务
- Happy path: 选择「全部技能」→ 恢复显示所有任务
- Happy path: 展开一个 `completed` 任务 → 时间线显示 Started 和 Completed 两个时间戳
- Happy path: 展开一个 `failed` 任务 → 时间线显示 Started、Failed 时间戳和错误信息
- Edge case: 任务只有 `skill_started`（无 completed_at）→ 时间线只显示 Started

**Verification：**
- `bun run dev` 启动后，技能筛选器可用且过滤结果正确
- 展开不同状态的任务卡片，时间线信息完整且格式一致

---

- [x] **单元 4：端到端验证与文档收尾**

**Goal：** 跑通完整链路，确保所有测试通过，更新 AGENTS.md 和计划勾选状态。

**Requirements：** SC-1 至 SC-8

**Dependencies：** 单元 1、2、3

**Files：**
- 修改：`AGENTS.md`（确认数据文件说明已更新）
- 修改：`docs/plans/2026-04-17-002-feat-galeharness-task-board-implementation-plan.md`（更新勾选状态）
- 验证：`bun test` 全部通过
- 验证：`bun run board` 正常启动且页面可访问

**Approach：**
1. 执行 `bun test`，修复任何失败
2. 启动 `bun run board`，用浏览器或 `curl` 验证 `/api/tasks`
3. 用已有的 `~/.galeharness/tasks.db`（或 fixture）验证前端渲染
4. 确认 `AGENTS.md` 中数据路径为 `~/.galeharness/tasks.db`

**Test scenarios：**
- Integration: `bun run board` + `curl http://127.0.0.1:4321/api/tasks` → 返回正确 JSON，HTTP 200
- Integration: 损坏 `tasks.db` 后重启服务 → 仍然返回 `{"tasks":[]}`，无 500
- Integration: 3 个以上不同 `project` 的任务 → 前端按项目正确分组

**Verification：**
- `bun test` 0 fail
- `bun run board` 启动无异常
- `bun run dev` 启动后前端热更新正常，技能筛选器与时间线展示无误

## System-Wide Impact

- **Error propagation：** `events-reader.ts` 的降级处理确保本地 db 问题不会破坏 HTTP 响应；前端在 `useTasks` 中已经处理了 API error 显示
- **State lifecycle risks：** `usePR` 缓存 key 修正后，PR 数据生命周期与 URL 绑定，减少陈旧数据风险
- **API surface parity：** `GET /api/tasks` 和 `GET /api/tasks/:id/pr` 接口不变，仅内部读取实现和前端消费方式调整
- **Unchanged invariants：** 服务端不回写 db；不暴露 `project_path` 到浏览器；PR token 仍由服务端 `gh` CLI 持有

## Risks & Dependencies

| 风险 | 缓解措施 |
|------|----------|
| `bun:sqlite` 版本差异导致 `{ readwrite: false }` 行为不一致 | 使用稳定 API，并在测试中对临时 DB 进行实际读写验证 |
| 前端全局 CSS `:hover` 与现有内联 `style` 优先级冲突 | 用更具体的选择器（如 `.task-card:hover`）确保覆盖 |
| `DerivedTask` 类型增加 timeline 字段后前后端类型不同步 | 同步修改 `server/types.ts` 和 `frontend/src/types.ts` |

## Sources & References

- **Origin document:** [docs/brainstorms/gale-harness-task-board-requirements.md](docs/brainstorms/gale-harness-task-board-requirements.md)
- **Previous plan:** [docs/plans/2026-04-17-001-feat-galeharness-task-board-plan.md](docs/plans/2026-04-17-001-feat-galeharness-task-board-plan.md)
- **Related code:** `server/lib/events-reader.ts`, `frontend/src/components/TaskCard.tsx`, `frontend/src/hooks/usePR.ts`
