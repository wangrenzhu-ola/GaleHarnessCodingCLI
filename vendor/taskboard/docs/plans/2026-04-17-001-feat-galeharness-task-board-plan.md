---
title: "feat: 构建 GaleHarness 任务看板"
type: feat
status: active
date: 2026-04-17
origin: docs/brainstorms/gale-harness-task-board-requirements.md
---

# feat: 构建 GaleHarness 任务看板

## 概述

本计划实现 GaleHarness 任务看板——一个本地优先的 Web UI，让研发机器上所有项目的每次 `gh:` 技能调用都可视化。

**设计原则变更（相对于旧版 plan）：**
1. **存储从 JSONL 迁移到 SQLite** — 用 `bun:sqlite` 替代手写的 JSONL append/parse，解决并发、事务和截断行问题。
2. **写入职责上移到 GaleHarnessCLI 平台层** — 不再让每个 skill 的 SKILL.md 自己埋点，也不引入 `gale-task` 二进制。平台层的 skill 调度器在起止时统一写 `skill_started` / `skill_completed` / `skill_failed`。
3. **本 repo 只负责「读」和「展示」** — 写库逻辑由 GaleHarnessCLI 团队负责，本 plan 只聚焦 board 的读取层、API 和前端 UI。

**目标 repo：**
- `GaleHarnessCodingTaskBoard` — 看板 Web 应用（本 repo，全部单元）

---

## 问题背景

`gh:` 会话结束后，没有持久的跨项目记录——做了什么、向 HKTMemory 沉淀了哪些知识、产出了哪些 PR。研发切换 repo 时会丢失上下文。任务看板作为持久可视账本填补这一空白，是对 `ce-sessions`（回答"我之前做了什么"的对话式查询，但缺乏可视化总览、PR 状态和项目级分组）的补充。

（参见需求文档：docs/brainstorms/gale-harness-task-board-requirements.md）

---

## 需求追溯

- **R1. FR-1**：全局事件存储为 SQLite (`~/.galeharness/tasks.db`)；读取时按 `task_id` 合并事件
- **R2. FR-2**：Web 看板——卡片按时间倒序排列，支持按项目/状态/技能筛选，全文搜索
- **R3. FR-3**：任务详情视图——技能执行链时间线、HKTMemory 条目、PR 详情
- **R4. FR-4**：本地 Hono 服务，绑定 `127.0.0.1:4321`，`bun run board` 启动
- **R5. FR-5**：GitHub PR 数据由服务端通过 `gh` CLI 获取，卡片展开时按需加载，5 分钟缓存
- **R6. SC-6**：跨项目视图——3 个及以上不同 repo 的任务在同一看板展示

---

## 范围边界

- 看板只读——不回写、不通过 UI 创建任务
- 无 WebSocket/SSE——轮询 + 手动刷新即可
- 无 HKTMemory 搜索 UI——仅展示哪些记忆与任务关联
- 服务端只绑定 `127.0.0.1`，不对外暴露网络
- 仅桌面浏览器
- 无认证

### 延后到独立任务

- `bun run board` 自动打开浏览器
- `tasks.db` 超过约 10 MB 后的归档/清理
- board 的编辑/标记功能（如手动给任务打标签）

---

## 上下文与调研

### 相关代码与模式

- **本 repo**：`server/lib/events-reader.ts` — 现有的 JSONL 读取逻辑，需要整体替换为 SQLite 读取
- **本 repo**：`server/lib/pr-cache.ts` — PR 缓存逻辑不变
- **本 repo**：`frontend/src/` — React + Vite 前端，风格已定（赛博朋克主题）
- **Bun SQLite**：`bun:sqlite` 是 Bun 内置模块，零依赖，支持 WAL 模式

### 关键技术决策

- **SQLite 替代 JSONL**：
  - 使用 `bun:sqlite` 的 `Database` 类打开 `~/.galeharness/tasks.db`
  - **board 负责首次 schema 创建**：连接后执行 `CREATE TABLE IF NOT EXISTS ...` 和 `CREATE INDEX IF NOT EXISTS ...`（幂等）
  - 读取时执行 `SELECT * FROM task_events ORDER BY timestamp ASC`
  - WAL 模式自动启用（`PRAGMA journal_mode = WAL;`）
  - 即使 db 文件不存在，也优雅降级返回空数组（首次运行状态）
  - **错误处理**：`Database()` 构造函数必须包裹在 `try/catch` 内；文件损坏/锁定等错误返回 `[]` 并记录 stderr，不抛异常

- **写入职责上移**：
  - 本 repo **完全不写** `tasks.db`
  - GaleHarnessCLI 的平台层 skill 调度器负责在调用 skill 前后写入生命周期事件
  - `pr_linked` / `memory_linked` 由对应的 skill 通过平台层提供的轻量 helper（或直接 SQL）写入
  - 该设计不在本 plan 范围内，但本 repo 的 schema 必须与 CLI 侧保持一致

- **Hono + React/Vite 双进程开发、单进程生产**：不变

- **服务端 GitHub PR 按需获取**：不变

- **`in_progress` 任务陈旧性阈值**：不变，默认 2 小时，可通过 `BOARD_STALE_HOURS` 覆盖

---

## 输出结构

```
GaleHarnessCodingTaskBoard/
  package.json
  tsconfig.json
  vite.config.ts
  bun.lock
  server/
    index.ts              # Hono 服务入口
    routes/
      tasks.ts            # GET /api/tasks, GET /api/tasks/:id
    lib/
      events-reader.ts    # SQLite 读取 + 按 task_id 合并逻辑
      pr-cache.ts         # GitHub PR 数据的 5 分钟进程内 TTL 缓存
  frontend/
    src/
      App.tsx
      components/
        TaskCard.tsx
        TaskList.tsx
        FilterBar.tsx
        SearchInput.tsx
        SkillChain.tsx
        MemoryEntries.tsx
        PRDetail.tsx
      hooks/
        useTasks.ts       # 轮询 + 推导状态（陈旧性检测）
        usePR.ts          # 卡片展开时按需获取
      lib/
        api.ts            # 类型化 fetch 封装
      types.ts            # 共享 Task、TaskEvent 类型
    index.html
  docs/
    brainstorms/
      gale-harness-task-board-requirements.md
    plans/
      2026-04-17-001-feat-galeharness-task-board-plan.md
```

---

## 高层技术设计

### 数据流

```
GaleHarnessCLI 平台层 skill 调度器
  │
  ├─ 启动 gh:brainstorm（或任何 gh: 技能）
  │   ├─ INSERT skill_started INTO ~/.galeharness/tasks.db
  │   ├─ 执行 skill
  │   └─ INSERT skill_completed / skill_failed INTO tasks.db
  │
  └─ skill 内部产生 PR / Memory 时
      └─ INSERT pr_linked / memory_linked INTO tasks.db

浏览器 → GET /api/tasks
  │
  └─ Hono 处理器 → events-reader.ts
       打开 SQLite 连接（只读语义）
       SELECT * FROM task_events ORDER BY timestamp ASC
       按 task_id 分组事件
       合并字段（后来居上），累积 memories[] 和 pr_url
       推导状态 + 陈旧性
       响应前移除 project_path
       → [{task_id, project, status, skill, memories, pr_url, ...}]


浏览器（卡片展开）→ GET /api/tasks/:id/pr
  │
  └─ Hono 处理器 → pr-cache.ts
       检查以 pr_url 为 key 的 5 分钟 TTL 缓存
       未命中：执行 `gh api repos/{owner}/{repo}/pulls/{number}`
       返回 {title, state, author, created_at}
```

### SQLite Schema（本 repo 的读取契约）

```sql
CREATE TABLE IF NOT EXISTS task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  project TEXT,
  project_path TEXT,
  skill TEXT,
  title TEXT,
  parent_task_id TEXT,
  error TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  memory_id TEXT,
  memory_title TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_task_id ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON task_events(timestamp);
```

### 合并逻辑（events-reader）

```
rows = db.query("SELECT * FROM task_events ORDER BY timestamp ASC").all()
taskMap = new Map<task_id, DerivedTask>()

for row in rows:
  task = taskMap.get(row.task_id) ?? { task_id: row.task_id, memories: [] }

  if row.event_type == "skill_started":
    task.project = row.project ?? task.project
    task.skill = row.skill ?? task.skill
    task.title = row.title ?? task.title
    task.started_at = row.timestamp
    task.parent_task_id = row.parent_task_id ?? task.parent_task_id
    task.status = "in_progress"

  if row.event_type == "skill_completed":
    task.status = "completed"
    task.completed_at = row.timestamp

  if row.event_type == "skill_failed":
    task.status = "failed"
    task.completed_at = row.timestamp
    task.error = row.error

  if row.event_type == "pr_linked":
    task.pr_url = row.pr_url
    task.pr_number = row.pr_number

  if row.event_type == "memory_linked":
    task.memories.push({ memory_id: row.memory_id, memory_title: row.memory_title })

  taskMap.set(row.task_id, task)

后处理：task.status == "in_progress" && 距 started_at 超过 BOARD_STALE_HOURS（默认 2h）
  → task.status = "stale"

返回前从所有 task 对象中删除 project_path（在 HTTP 响应序列化层执行）
按 started_at 降序返回 DerivedTask[]
```

---

## 实现单元

- [ ] **单元 1：SQLite Events Reader（替换 JSONL）**

**目标：** 将 `server/lib/events-reader.ts` 从 JSONL 读取整体替换为 `bun:sqlite` 读取，更新类型定义和测试。

**需求：** R1、R6

**依赖：** 无

**文件：**
- 修改：`server/lib/events-reader.ts`
- 修改：`server/types.ts`（如有必要）
- 修改：`tests/events-reader.test.ts`
- 修改：`AGENTS.md`（更新数据文件路径说明）

**实现要点：**
- 使用 `import { Database } from "bun:sqlite"`
- `DB_PATH = join(homedir(), ".galeharness", "tasks.db")`
- 打开数据库时使用 `new Database(DB_PATH, { create: false, readwrite: false })`
- **首次连接时执行 `CREATE TABLE IF NOT EXISTS ...` 和 `CREATE INDEX IF NOT EXISTS ...`**（幂等），防止表不存在报错
- 查询：`db.query("SELECT * FROM task_events ORDER BY timestamp ASC").all()`
- db 文件不存在时返回 `[]`（`existsSync` 前置检查）
- 合并逻辑与旧版保持一致（字段后来居上，数组累积）
- `project_path` 剥离仍在 HTTP 响应序列化层
- **错误处理**：`new Database()` 必须包裹在 `try` 内；任何读取错误返回 `[]` 并记录 stderr，不抛异常到 HTTP 层

**测试场景：**
- 正常路径：空 db → 返回 `[]`
- 正常路径：单个 `skill_started` → `status: "in_progress"`
- 正常路径：`skill_started` + `skill_completed` → `status: "completed"`
- 正常路径：多个 `memory_linked` 累积到 `memories[]`
- 边界条件：`started_at` 超过 2h 且无完成事件 → `status: "stale"`
- 边界条件：非法 `started_at` 字符串 → 不抛异常，保持 `in_progress`
- 边界条件：db 文件损坏/锁定 → `readAndMergeTasks()` 返回 `[]` 且不抛异常
- 边界条件：返回的任务对象中不含 `project_path`
- 集成：对临时 SQLite DB 插入事件 → 正确合并返回 DerivedTask
- 集成：验证 `CREATE TABLE / INDEX IF NOT EXISTS` 在首次连接时成功执行

**验收标准：**
- `bun test tests/events-reader.test.ts` 通过（包含 SQLite 集成测试）
- `curl http://127.0.0.1:4321/api/tasks` 在空 db 时返回 `{"tasks":[]}`
- 损坏的 `tasks.db` 不会导致 HTTP 500

---

- [x] **单元 2：Hono 服务骨架 + PR 缓存（已完成）**

现有代码已满足：
- `server/index.ts` 绑定 `127.0.0.1:4321`
- `server/routes/tasks.ts` 提供 `GET /api/tasks`
- `server/lib/pr-cache.ts` 提供 5 分钟 TTL 缓存
- `GET /api/tasks/:id/pr` 通过 `gh api` 获取 PR 数据

**无需改动**，但需验证与新的 SQLite reader 集成后 API 正常。

---

- [ ] **单元 3：前端 UI 补齐**

**目标：** 在现有 React 前端基础上补齐缺失的筛选器和详情展示。

**需求：** R2、R3、SC-1 至 SC-6

**依赖：** 单元 1

**文件：**
- 修改：`frontend/src/components/TaskList.tsx`
- 修改：`frontend/src/components/TaskCard.tsx`
- 修改：`frontend/src/hooks/usePR.ts`（缓存 key 改为 `prUrl`）
- 修改：`frontend/src/hooks/useTasks.ts`（如需加入技能筛选）

**实现要点：**
- `TaskList` 增加「技能类型」筛选下拉（从 tasks 数据动态提取所有不重复的 `skill` 值）
- `TaskCard` 在展开详情时显示：
  - 技能执行时间线：`skill_started` / `skill_completed` / `skill_failed` 事件带时间戳
  - HKTMemory 列表：完整展示 `memory_id` + `memory_title`
  - PR 详情：加载 PR 详情（title/state/author/created_at）
  - 错误信息（如果有 `skill_failed`）
- 空状态文案保持不变（"运行 gh: 技能后，执行记录将自动同步至此"）

**验收标准：**
- `bun run dev` 启动后看板正常显示
- 技能筛选下拉能正确过滤任务
- 展开卡片后 PR 详情和 Memory 列表可见

---

## 系统级影响

- **board 侧纯只读**：不回写 db，不影响 CLI 平台层的写入行为。
- **向后兼容**：未来新增事件类型只需扩展 `events-reader.ts` 的 switch-case，未知事件类型静默忽略。
- **空 db 优雅降级**：首次运行或 CLI 尚未写入时，board 显示欢迎信息而非报错。

---

## 风险与依赖

| 风险 | 缓解措施 |
|------|----------|
| `bun:sqlite` 在特定 Bun 版本下的兼容性 | 使用稳定 API（`Database`, `query`, `run`），避免实验性功能 |
| db 文件被 CLI 平台层锁定 | WAL 模式允许并发读写；board 侧仅执行 SELECT |
| 两个 repo 的 schema 不同步 | 将 schema 明文写在本 repo 的 `server/lib/events-reader.ts` 顶部注释中，作为 CLI 侧的参考契约 |

---

## 文档与运维说明

- `AGENTS.md` 须记录：`bun run board` 启动命令、`~/.galeharness/tasks.db` 数据文件路径、`BOARD_PORT` 和 `BOARD_STALE_HOURS` 环境变量说明
- schema 契约须同步给 GaleHarnessCLI 平台层开发方

---

## 来源与参考

- **需求文档：** [docs/brainstorms/gale-harness-task-board-requirements.md](docs/brainstorms/gale-harness-task-board-requirements.md)
- **Bun SQLite 文档：** https://bun.sh/docs/api/sqlite
- **Hono/Bun：** https://hono.dev/docs/getting-started/bun
