---
title: "Spec: tasks.db Writer for GaleHarnessCLI"
date: 2026-04-17
type: spec
status: active
audience: CLI Team
revision: 3
revises: 2026-04-17-003-spec-task-db-writer-for-cli-team.md
---

# Spec: tasks.db Writer for GaleHarnessCLI (Revision 3)

> **目标读者：** GaleHarnessCLI 团队
> **背景：** Task Board（`GaleHarnessCodingTaskBoard` repo）已完成 SQLite 读取端实现。本方案定义 CLI 侧的写入职责、Schema 契约、并发控制、错误处理与测试要求，供 CLI 团队据此实现写入模块。
> **修订说明：** 本版本基于文档审查反馈修订，解决了架构假设与现有实现冲突、JSONL/SQLite 格式不一致等问题。

---

## 1. 架构定位

### 1.1 当前架构（子进程命令模式）

CLI 采用**子进程命令**模式写入任务事件：

```
┌─────────────────┐      bash command       ┌─────────────────┐
│  Skill SKILL.md │ ───────────────────────▶│   gale-task     │
│  (HKT-PATCH)    │   gale-task log ...     │   (subprocess)  │
└─────────────────┘                         └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  tasks.db       │
                                            │  (SQLite, WAL)  │
                                            └─────────────────┘
```

**关键点：**
- `gale-task` 是**一次性子进程**，执行完写入后立即退出
- Skill 通过 HKT-PATCH 嵌入的 bash 命令调用：`gale-task log <event_type> [flags]`
- **不存在**进程内的 "CLI dispatcher" 或 "skill wrapper"
- 信号处理（SIGINT/SIGTERM）由父进程（Claude Code/Codex 等 agent 运行时）负责，**gale-task 无法处理父进程的信号**

### 1.2 数据流向

```
┌─────────────────────────────────────────────────────────────────┐
│                        GaleHarnessCLI                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ SKILL.md (gh:plan, gh:work, gh:brainstorm, gh:compound)    ││
│  │                                                             ││
│  │ <!-- HKT-PATCH:gale-task-start -->                         ││
│  │ gale-task log skill_started --skill gh:plan ...            ││
│  │ <!-- /HKT-PATCH:gale-task-start -->                        ││
│  │                                                             ││
│  │ <!-- HKT-PATCH:gale-task-end -->                           ││
│  │ gale-task log skill_completed 2>/dev/null || true          ││
│  │ <!-- /HKT-PATCH:gale-task-end -->                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ bash exec
                    ┌─────────────────┐
                    │    gale-task    │
                    │  (Bun/TypeScript)│
                    └────────┬────────┘
                             │
                             ▼ SQLite INSERT
                    ┌─────────────────┐
                    │  ~/.galeharness/│
                    │  tasks.db       │
                    └────────┬────────┘
                             │
                             ▼ SQLite SELECT
                    ┌─────────────────┐
                    │   Task Board    │
                    │   (只读 Web UI) │
                    └─────────────────┘
```

### 1.3 存储位置

- **存储路径：** `~/.galeharness/tasks.db`（SQLite，WAL 模式）
- **Board 端：** 只读 Web UI，不持有写入代码，不回写 `tasks.db`
- **CLI 端：** 通过 `gale-task` 子进程写入 `task_events` 表
- **并发模型：** 多进程安全（WAL 模式），支持同时存在多个 CLI 进程和 Board 读进程

---

## 2. Schema 契约（必须与 Board 端严格一致）

Board 端执行以下 `CREATE TABLE/INDEX IF NOT EXISTS`（见 `server/lib/events-reader.ts`）。CLI 写入模块应依赖相同的 schema，**不要**引入额外的列或表，除非同步修改 board 端。

```sql
CREATE TABLE IF NOT EXISTS task_events (
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

CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_events_timestamp ON task_events(timestamp);
```

> **注意：** 与原版 schema 不同，移除了 `id INTEGER PRIMARY KEY AUTOINCREMENT` 列。Board 端已按此 schema 实现，CLI 端需保持一致。

**关键约定：**
- 所有新增事件均为 **INSERT**，**不允许 UPDATE/DELETE** 已有事件。Board 的 `mergeEvents` 逻辑基于 Append-Only 假设
- `timestamp` 必须是 **ISO 8601** 格式（建议：`new Date().toISOString()`）

---

## 3. 事件类型与触发时机

| `event_type` | 触发时机 | 写入方 |
|---|---|---|
| `skill_started` | **技能实际开始执行前**（HKT-PATCH:gale-task-start 块内） | gale-task 子进程 |
| `skill_completed` | **技能成功结束后**（HKT-PATCH:gale-task-end 块内） | gale-task 子进程 |
| `skill_failed` | **技能异常退出时**（由 agent 运行时决定如何触发） | gale-task 子进程 |
| `pr_linked` | PR URL/编号被确认时 | gale-task 子进程（在技能内部调用 `gh pr create` 后） |
| `memory_linked` | HKTMemory 条目成功写入后 | gale-task 子进程（HKT-PATCH:gale-task-memory 块内） |

### 3.1 `skill_started` 的精确触发点

HKT-PATCH 块在 SKILL.md 中定义触发时机：

```markdown
<!-- HKT-PATCH:gale-task-start -->
### Phase -1: Task Lifecycle Start

Before any other action, log the skill start event so this execution appears on the task board:

```bash
gale-task log skill_started --skill gh:plan --title "${ARGUMENTS:-plan}" 2>/dev/null || true
```

If `gale-task` is not on PATH, skip silently — this must never block the skill.
<!-- /HKT-PATCH:gale-task-start -->
```

**说明：**
- `gale-task` 自动生成 `task_id` 并写入 `<project>/.context/galeharness-cli/current-task.json`（项目级路径）
- `project` 和 `project_path` 由 `gale-task` 通过 `git remote` 和 `git rev-parse` 自动检测
- `parent_task_id` 由 `gale-task` 从同一个项目目录下的上一个 `current-task.json` 读取（如果存在）

> **路径决策说明：** 使用项目级路径（`<project>/.context/galeharness-cli/current-task.json`）而非全局路径，原因：
> 1. 隔离性：不同项目的任务互不干扰，避免并发竞争
> 2. 一致性：与现有 `cmd/gale-task/context.ts` 实现保持一致
> 3. 局限性：不支持跨项目任务链（MVP 不需要此功能，未来可扩展）

### 3.2 `skill_failed` 的触发方式

由于 `gale-task` 是一次性子进程，**无法通过信号处理写入 `skill_failed`**。替代方案：

1. **Agent 运行时责任：** Claude Code/Codex 等 agent 运行时负责检测技能失败，并在失败时调用：
   ```bash
   gale-task log skill_failed --skill <skill-name> --error "<error-message>" 2>/dev/null || true
   ```

2. **手动补写：** 用户可在失败后手动运行上述命令补写失败事件

3. **超时检测：** Board 端通过 `stale` 状态标记长时间无 `skill_completed` 的任务

> **明确约束：** 不在 `gale-task` 进程内实现信号处理。信号由父进程处理，父进程可选择性调用 `gale-task log skill_failed`。

### 3.3 `pr_linked` 触发时机（澄清）

PR 关联事件有**唯一触发点**：

**技能执行中：** `gh:work` 等技能在内部调用 `gh pr create` 后，立即调用：
```bash
gale-task log pr_linked --pr-url "$PR_URL" --pr-number "$PR_NUM" 2>/dev/null || true
```

**不再支持：**
- ~~技能开始前扫描当前分支 PR 并自动补写~~ （实现复杂度高，收益低，移除）
- ~~技能结束后手动补写~~ （用户可通过手动命令实现，无需规范支持）

### 3.4 `memory_linked` 触发时机

在 HKTMemory 存储成功后，通过 HKT-PATCH 块触发：

```markdown
<!-- HKT-PATCH:gale-task-memory -->
After the plan file is finalized and document review has run:
1. Read back the full content of the written plan file
2. Extract `title` and `type` values from its YAML frontmatter
3. Run: gale-task log memory_linked --memory-title "<frontmatter title>" 2>/dev/null || true

> **注意：** `--memory-id` 参数可选，HKTMemory 返回的 memory_id 可能与 memory_title 相同或可从标题推导。若 HKTMemory 返回独立 ID，应使用 `--memory-id <id>` 传递。
<!-- /HKT-PATCH:gale-task-memory -->
```

---

## 4. 字段映射详表

### 4.1 通用字段（所有事件必填）

| 字段 | 类型 | 来源 | 约束 |
|---|---|---|---|
| `task_id` | `string` | 由 gale-task 在 `skill_started` 时生成，后续事件从 `current-task.json` 读取 | UUID v4 或 `crypto.randomUUID()`，长度 ≤ 64 |
| `event_type` | `string` | gale-task 命令参数 | 必须是 5 个合法值之一 |
| `timestamp` | `string` | `new Date().toISOString()` | ISO 8601 |

### 4.2 按事件类型的选填字段

#### `skill_started`

| 字段 | 来源 | 说明 |
|---|---|---|
| `project` | `git remote get-url origin` 的 repo 名 | 失败时回退到当前目录 basename |
| `project_path` | `git rev-parse --show-toplevel` 或 `process.cwd()` | 用于 board 展示项目分组，**不暴露给浏览器** |
| `skill` | `--skill` 参数 | 如 `gh:brainstorm`、`gh:work`、`gh:plan` |
| `title` | `--title` 参数 | 从 `$ARGUMENTS` 或用户 prompt 提取 |
| `parent_task_id` | 上一个 `current-task.json` 的 `task_id` | 自动链接连续任务 |

#### `skill_completed`

除通用字段外，**不携带任何额外字段**（保持最小化）。

#### `skill_failed`

| 字段 | 来源 | 说明 |
|---|---|---|
| `error` | `--error` 参数 | 截取前 500 字符，避免写入超大堆栈 |

#### `pr_linked`

| 字段 | 来源 | 说明 |
|---|---|---|
| `pr_url` | `--pr-url` 参数 | 完整 URL |
| `pr_number` | `--pr-number` 参数 | 整数 |

#### `memory_linked`

| 字段 | 来源 | 说明 |
|---|---|---|
| `memory_id` | `--memory-id` 参数（可选） | 如 `mem-2026-04-17-abc123` |
| `memory_title` | `--memory-title` 参数 | 记忆条目标题 |

---

## 5. task_id 生成策略

- **格式：** UUID v4（`crypto.randomUUID()`）
- **生命周期：** 一次 `skill_started` 对应一个 `task_id`，该任务的所有后续事件共享同一 `task_id`
- **持久化：** `gale-task` 将当前 `task_id` 写入 `<project>/.context/galeharness-cli/current-task.json`（项目级路径），后续事件从该文件读取
- **幂等性：** 同一进程内如果由于重试导致多次 `skill_started`，每次应生成新的 `task_id`（board 端会把它们视为不同任务，这是可接受的）
- **并发安全：** 项目级路径隔离不同项目的任务上下文，避免跨项目竞争

---

## 6. 并发控制与事务策略

### 6.1 WAL 模式（必须启用）

SQLite 默认的 rollback journal 模式在多进程并发写入时容易遇到 `SQLITE_BUSY`。必须启用 WAL：

```ts
// 每次打开 DB 后执行
PRAGMA journal_mode = WAL;
```

WAL 模式允许一个写进程和多个读进程并发工作，满足 board 读取和多个 CLI 进程同时写入的场景。

### 6.2 WAL 文件系统要求

WAL 需要文件系统支持共享内存。以下环境可能不支持：
- 网络文件系统（NFS, SMB）
- 某些容器环境（特别是受限的 sandbox）

**缓解措施：**
- 在检测到 WAL 不支持时，回退到默认 journal 模式并记录警告
- 文档中明确说明网络文件系统不支持

**检测代码示例：**

```ts
const result = db.run("PRAGMA journal_mode = WAL;");
// bun:sqlite 返回 { journal_mode: "wal" } 或 { journal_mode: "delete" }
const mode = result?.journal_mode ?? "delete";
if (mode !== "wal") {
  console.error("[gale-task] WAL mode not supported on this filesystem, using default journal");
  // 继续执行，不中断
}
```

### 6.3 写入接口设计（子进程模式）

`gale-task` 作为独立 CLI 工具，每次执行时：
1. 打开 SQLite 连接
2. 执行 `PRAGMA journal_mode = WAL`
3. 执行 INSERT
4. 关闭连接

> **说明：** 以下代码为**目标实现**（target implementation）。当前 `cmd/gale-task/index.ts` 仍写入 JSONL，需按此模式迁移到 SQLite。

```ts
import { Database } from "bun:sqlite"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { mkdirSync, existsSync } from "node:fs"

const DB_DIR = join(homedir(), ".galeharness")
const DB_PATH = join(DB_DIR, "tasks.db")

function writeEvent(event: TaskEvent): void {
  // 确保目录存在
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  const db = new Database(DB_PATH, { create: true })

  try {
    // 启用 WAL 模式
    db.run("PRAGMA journal_mode = WAL;")

    // 确保 schema 存在
    db.run(`
      CREATE TABLE IF NOT EXISTS task_events (
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
      )
    `)
    db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_timestamp ON task_events(timestamp)`)

    // 插入事件
    const stmt = db.query(`
      INSERT INTO task_events (
        task_id, event_type, timestamp, project, project_path, skill, title,
        parent_task_id, error, pr_url, pr_number, memory_id, memory_title
      ) VALUES (
        $task_id, $event_type, $timestamp, $project, $project_path, $skill, $title,
        $parent_task_id, $error, $pr_url, $pr_number, $memory_id, $memory_title
      )
    `)
    stmt.run({
      $task_id: event.task_id,
      $event_type: event.event_type,
      $timestamp: event.timestamp,
      $project: event.project ?? null,
      $project_path: event.project_path ?? null,
      $skill: event.skill ?? null,
      $title: event.title ?? null,
      $parent_task_id: event.parent_task_id ?? null,
      $error: event.error ?? null,
      $pr_url: event.pr_url ?? null,
      $pr_number: event.pr_number ?? null,
      $memory_id: event.memory_id ?? null,
      $memory_title: event.memory_title ?? null,
    })
    stmt.finalize()
  } finally {
    db.close()
  }
}
```

### 6.4 忙等待策略

若遇到 `SQLITE_BUSY`，可实现重试（指数退避，最多 3 次）：

```ts
for (let i = 0; i < 3; i++) {
  try {
    writeEvent(event)
    return
  } catch (err: any) {
    if (err.code === "SQLITE_BUSY" && i < 2) {
      // Bun.sleepSync 是同步的，适合 CLI 场景
      Bun.sleepSync(10 * Math.pow(2, i)) // 10ms, 20ms
      continue
    }
    throw err
  }
}
```

---

## 7. parent_task_id 规则（MVP 简化版）

当前 board 的 MVP **不展示任务链**，`parent_task_id` 字段预留用于未来扩展。

**MVP 规则：**
- `gale-task` 在 `skill_started` 时读取 `<project>/.context/galeharness-cli/current-task.json`
- 如果存在上一个任务，将其 `task_id` 作为当前任务的 `parent_task_id`
- 如果无法确定连续性，则留空

**明确声明：** `parent_task_id` 是投机性复杂度，MVP 阶段仅实现基本链接逻辑，不承诺业务价值。未来若 Board 端展示任务链，再完善此功能。

---

## 8. 错误处理与降级策略

### 8.1 写入失败不得阻塞技能执行

`task_events` 写入是**观测性**的，不是业务逻辑的一部分。任何写入异常都必须被捕获，绝不能抛到用户面前或中断技能主流程。

**gale-task 的错误处理契约：**
- 所有错误捕获后写入 `stderr`
- **总是 `process.exit(0)`**，绝不返回非零退出码
- 调用方使用 `2>/dev/null || true` 确保静默失败

### 8.2 常见异常及处理

| 场景 | 处理策略 |
|---|---|
| `tasks.db` 被 board 锁定（WAL 下极少见） | 重试 3 次；仍失败则静默丢弃并 `console.error` |
| `tasks.db` 文件损坏 | 捕获 SQLiteError，`console.error`，返回 exit(0) |
| 磁盘已满 | 捕获错误，`console.error`，返回 exit(0) |
| `timestamp` 生成异常 | 极罕见；若 `new Date()` 失败，使用 **固定兜底值** `"1970-01-01T00:00:00.000Z"` 并记录警告 |

> **修正说明：** 原版建议用 `new Date().toISOString()` 兜底，但这无法解决该方法自身失败的问题。改用固定的 Unix epoch 时间戳。

### 8.3 数据库损坏恢复策略

当 `tasks.db` 损坏时：
1. `gale-task` 捕获 SQLiteError
2. 记录错误到 stderr：`[gale-task] Database corrupted, consider deleting ~/.galeharness/tasks.db`
3. **不删除损坏文件**（用户可能需要恢复数据）
4. 返回 exit(0)

用户可通过以下方式恢复：
- 手动删除 `~/.galeharness/tasks.db` 和 `tasks.db-wal`、`tasks.db-shm`
- 或联系开发者尝试数据恢复

### 8.4 日志规范

所有写入失败的错误信息应统一前缀，方便用户和开发者排查：

```
[gale-task] Failed to write <event_type> for task <task_id>: <error>
```

---

## 9. JSONL → SQLite 迁移策略

当前实现写入 `~/.galeharness/tasks.jsonl`（JSONL 格式），Board 期望 `~/.galeharness/tasks.db`（SQLite 格式）。

### 9.1 迁移方案

**推荐方案：新起炉灶**

- **不迁移历史数据**：JSONL 文件保留为历史存档
- 首次运行时创建空的 `tasks.db`
- Board 端已在首次读取时创建 schema（如果不存在）
- 用户可通过独立脚本手动导入 JSONL 数据（另行提供）

> **重要提示：** 切换到 SQLite 后，Board 将只显示 `tasks.db` 中的新任务。历史 JSONL 数据对用户立即不可见。建议：
> 1. 在首次运行前通知用户历史任务将保留在 `tasks.jsonl` 存档中
> 2. 如需查看历史，用户可直接打开 `tasks.jsonl` 或运行迁移脚本

**理由：**
- JSONL 和 SQLite schema 可能有细微差异（如 `id` 列）
- 迁移逻辑增加复杂度和出错风险
- 历史数据价值有限，大多数用户不关心

### 9.2 迁移脚本（可选）

提供独立的迁移工具：

```bash
gale-task migrate --from-jsonl
```

**行为：**
1. 读取 `~/.galeharness/tasks.jsonl`
2. 解析每行 JSON
3. 映射字段到 SQLite schema（处理 `id` 列缺失等差异）
4. 写入 `~/.galeharness/tasks.db`
5. 重命名 JSONL 为 `tasks.jsonl.migrated`

---

## 10. 与 Board 端的兼容性保证

为了确保 CLI 写入与 Board 读取永远兼容，双方遵守以下契约：

1. **Schema 追加不变性：** 只新增可选列，不改现有列名/类型；若必须改，双方同步发版
2. **Event type 枚举不变性：** 5 个事件类型是核心协议，新增类型需 board 端先支持
3. **Timestamp ISO 8601：** 双方统一使用 `toISOString()` 生成和解析
4. **Append-only：** CLI 端不执行 UPDATE/DELETE；board 端基于全量事件合并计算最终状态
5. **project_path 隔离：** CLI 端写入真实绝对路径；board 端在 HTTP 响应前剥离该字段，不暴露给浏览器
6. **Schema 同步机制：** CLI 和 Board 各自维护 `CREATE TABLE` 语句，通过文档和沟通确保一致

---

## 11. 测试要求

CLI 团队实现写入模块后，应至少覆盖以下测试：

### 11.1 单元测试

- `gale-task log skill_started` → 验证 `tasks.db` 创建、schema 正确、WAL 模式启用
- `gale-task log skill_completed` → 使用与前一条相同的 `task_id`（从 context 读取）
- `gale-task log skill_failed` → 验证 error 字段正确写入
- `gale-task log memory_linked` → 验证 memory_id/memory_title 字段
- `gale-task log pr_linked` → 验证 pr_url/pr_number 字段
- 并发测试：两个 `gale-task` 进程同时写入不同 `task_id`
- 错误处理：损坏的 `tasks.db` 不会导致进程崩溃或非零退出码

### 11.2 集成测试（与 Board 联跑）

- CLI 写入 3 个事件后，启动 board 的 `readAndMergeTasks()`，验证返回的任务状态正确
- 并发测试：两个 CLI 进程同时写入不同 `task_id` 的事件，最终 board 能正确合并出所有任务
- **不再测试：** 信号中断写入（子进程架构不支持）

---

## 12. 交付 Checklist

- [ ] `gale-task` 命令修改为写入 SQLite（`tasks.db`）而非 JSONL
- [ ] `skill_started` / `skill_completed` / `skill_failed` 命令参数完整
- [ ] `memory_linked` 命令参数完整（`--memory-id`, `--memory-title`）
- [ ] `pr_linked` 命令参数完整（`--pr-url`, `--pr-number`）
- [ ] WAL 模式已启用
- [ ] 所有写入路径都有 try/catch，不阻塞 skill 主流程
- [ ] 错误时返回 exit(0)，错误信息写入 stderr
- [ ] 单元测试和与 board 的集成测试通过
- [ ] Board 团队已收到 schema 确认（无变更则视为一致）
- [ ] 更新 `src/utils/task-writer.ts` 或标记为废弃（如果完全迁移到 gale-task）
- [ ] `parent_task_id` 实现为最小逻辑（读取上一个 task_id，不做业务承诺）

---

## 13. 参考代码

- **Board 读取端：** `server/lib/events-reader.ts`（`GaleHarnessCodingTaskBoard` repo）
- **Board 需求文档：** `docs/brainstorms/gale-harness-task-board-requirements.md`
- **Board 实施计划：** `docs/plans/2026-04-17-002-feat-galeharness-task-board-implementation-plan.md`
- **当前 gale-task 实现：** `cmd/gale-task/index.ts`（本 repo）
- **当前 JSONL writer：** `src/utils/task-writer.ts`（本 repo，将废弃或迁移）

如有 schema 变更需求，务必同步通知 Board 团队修改 `events-reader.ts` 和 `server/types.ts`。

---

## 附录：修订历史

| 版本 | 日期 | 变更说明 |
|---|---|---|
| 1 | 2026-04-17 | 初始版本 |
| 2 | 2026-04-17 | 基于文档审查反馈修订：修复架构假设冲突、澄清子进程模式、定义迁移策略、修正 timestamp fallback 逻辑、简化 pr_linked 触发时机 |
| 3 | 2026-04-17 | 解决审查遗留问题：明确 current-task.json 项目级路径、memory_linked 参数可选性、SQLite 代码标记为目标实现、WAL 检测代码、JSONL 历史可见性提示 |
