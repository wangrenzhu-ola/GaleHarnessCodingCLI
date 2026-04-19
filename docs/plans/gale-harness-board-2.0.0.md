# Plan: gale-harness board 子命令 (v2.0.0)

**Created**: 2026-04-19
**Status**: Draft
**Target Version**: GaleHarnessCodingCLI 2.0.0
**PRD Reference**: ~/work/hermes-agent/docs/O3-galeharness-board-PRD.md

---

## 1. Overview

在 GaleHarnessCodingCLI 2.0.0 中新增 `gale-harness board` 子命令，实现本地任务看板查看功能。用户无需启动独立 Web 服务即可在终端快速查看任务状态。

**核心设计原则**: 默认 `list` 而非 `serve` — 即开即用，不需要浏览器，不阻塞终端。

---

## 2. Command Structure

```
gale-harness board                  # 默认 list，ASCII 表格秒开即用
gale-harness board list             # 列表视图（默认）
gale-harness board show <task-id>   # 单任务详情 + 时间线
gale-harness board serve [--port N] [--open]  # 启动 Web UI（子进程）
gale-harness board stats            # 聚合统计（完成/进行中/失败/stale）
```

### 2.1 Subcommand: list (default)

**Parameters**:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--status` | all | Filter: in_progress / completed / failed / stale |
| `--project` | all | Filter by project |
| `--skill` | all | Filter by skill |
| `--limit` | 20 | Max items to display |
| `--format` | table | Output: table / json / quiet |

**Output Example**:
```
Task ID    Title           Project   Skill      Status       Started
---------- --------------- --------- ---------- ----------- ------------------
a1b2c3d4  Add dark mode   my-app    gh:work    completed   04-19 14:30
d4c3b2a1  Fix auth bug    api       gh:debug   in_progress 04-19 15:00
```

### 2.2 Subcommand: show <task-id>

**Output**: Task metadata + event timeline + linked PR + Memory entries

**Error Handling**: 若 task-id 不存在或无效，返回 exit code 1 并输出明确错误信息：
```
Error: Task "<task-id>" not found
```

### 2.3 Subcommand: serve

**Parameters**:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--port` | 4321 | Listen port |
| `--open` | false | Auto-open browser after start |

**Implementation Strategy**: Subprocess proxy
`bun run $TASKBOARD_ROOT/server/index.ts` as child process.
`TASKBOARD_ROOT` env var configures path (default: `~/.galeharness/boards/taskboard/`)

### 2.4 Subcommand: stats

**Output**:
```
Task Statistics
  Total:      47
  Completed:  31
  In Progress: 8
  Failed:     3
  Stale:      5

By Project:
  my-app:       18
  gale-harness: 12

By Skill:
  gh:work:      20
  gh:plan:      12
```

---

## 3. Architecture

### 3.1 New Files

```
src/commands/board.ts          # board main entry (citty subCommands)
src/commands/board-list.ts     # list subcommand
src/commands/board-show.ts     # show subcommand
src/commands/board-stats.ts    # stats subcommand
src/commands/board-serve.ts    # serve subcommand (subprocess proxy)
src/board/reader.ts            # SQLite read + merge logic
src/board/formatter.ts         # Terminal rendering (table / json / quiet)
src/board/types.ts             # DerivedTask, TaskEvent, TaskStatus types
```

### 3.2 Modified Files

```
src/index.ts                   # Register board: () => boardCommand
```

### 3.3 Data Flow

```
~/.galeharness/tasks.db (SQLite WAL)
  → src/board/reader.ts (mergeEvents + readAndMergeTasks)
    → src/board/formatter.ts (terminal rendering)
    → src/commands/board-serve.ts (subprocess spawn)
```

### 3.4 Key Design Decisions

1. **Reader Reimplementation**: Port ~100 lines merge logic from TaskBoard's `events-reader.ts` to avoid cross-repo coupling. Schema is the contract.
2. **Serve as Subprocess**: TaskBoard evolves independently; CLI only handles orchestration (start/stop/port management).CLI 本身不依赖 Hono，仅通过 subprocess 启动 TaskBoard 服务器。
3. **Serve Frontend Strategy Confirmed**: 经确认，serve 采用 subprocess proxy 策略（PRD 第8节决策已闭环）。CLI 不负责 serve 的前端实现，仅作为子进程代理启动 TaskBoard 的 server/index.ts。
4. **Read-Only Data Source**: `board` is a reader; writer is `gale-task` (already exists).

---

## 4. Implementation Steps

### Step 1: Types and Reader

**Files**: `src/board/types.ts`, `src/board/reader.ts`

- Define `TaskStatus`, `TaskEvent`, `DerivedTask`, `MemoryEntry` types
- Port `mergeEvents()` function from TaskBoard (参考 `events-reader.ts` 的 `mergeEvents()` 函数)
- Port `readAndMergeTasks()` function with SQLite read-only access
- Use `bun:sqlite` with `{ readonly: true }` for WAL-safe concurrent reads

**Key Logic**:
- Group events by `task_id`
- Sort events by timestamp
- Derive final state from event sequence:
  - `skill_started` → sets project, skill, title, started_at, parent_task_id
  - `skill_completed` → status = completed
  - `skill_failed` → status = failed, capture error
  - `pr_linked` → capture pr_url, pr_number
  - `memory_linked` → append to memories array
- Stale detection: in_progress tasks older than `BOARD_STALE_HOURS` (default 2h)

### Step 2: Formatter

**File**: `src/board/formatter.ts`

**Functions**:
- `formatTable(tasks, options)` → ASCII table with column alignment
- `formatJson(tasks, options)` → JSON array output
- `formatQuiet(tasks, options)` → Task IDs only (for piping)

**Table Columns**: Task ID (8 chars), Title (truncated), Project, Skill, Status, Started (MM-DD HH:MM)

**Status Colors** (terminal): completed=green, in_progress=blue, failed=red, stale=yellow

**Stats Sorting**: By project 和 By skill 的输出按数量降序排列（数量多的在前）。

### Step 3: List and Show Commands

**Files**: `src/commands/board-list.ts`, `src/commands/board-show.ts`

**board-list.ts**:
- Parse filter args (--status, --project, --skill, --limit)
- Call `readAndMergeTasks()`
- Apply filters
- Call formatter with --format option
- Handle empty results gracefully

**board-show.ts**:
- Parse task-id argument
- Call `readAndMergeTasks()`
- Find matching task
- 若 task-id 不存在或无效，输出错误信息并返回 exit code 1
- Display full details:
  - Task metadata (ID, project, skill, title, status)
  - Timeline (all events chronologically)
  - PR link (if any)
  - Memory entries (if any)
  - Parent task (if any)

### Step 4: Register Board Command

**File**: `src/index.ts`

- Add `board: () => boardCommand` to subCommands
- Import board command from `./commands/board.js`

### Step 5: Stats Command

**File**: `src/commands/board-stats.ts`

- Call `readAndMergeTasks()`
- Calculate aggregates:
  - Total count
  - Count by status (completed, in_progress, failed, stale)
  - Count by project (按数量降序排列)
  - Count by skill (按数量降序排列)
- Display formatted statistics

### Step 6: Serve Command

**File**: `src/commands/board-serve.ts`

- Parse --port and --open args
- Check `TASKBOARD_ROOT` env var (default: `~/.galeharness/boards/taskboard/`)
- Validate directory exists; if not, print installation instructions
- Check port availability; if occupied, suggest alternatives
- Spawn subprocess: `bun run ${TASKBOARD_ROOT}/server/index.ts`
- Pass PORT env var to subprocess
- If --open, launch browser after server starts
- Handle graceful shutdown (SIGINT, SIGTERM)
- 若子进程异常退出，CLI 返回非零 exit code

---

## 5. Dependencies

| Dependency | Purpose | Note |
|------------|---------|------|
| citty | CLI framework | Already present |
| bun:sqlite | Read tasks.db | Already present (used by sqlite-writer.ts) |

**Note**: `serve` 子命令采用纯 subprocess proxy 策略，CLI 本身不依赖 Hono。Hono 仅作为 TaskBoard 的依赖在子进程中使用。

---

## 6. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Schema drift between CLI and TaskBoard | Share CREATE TABLE as contract document; version check on startup |
| Serve subprocess port conflict | Support --port parameter + pre-flight port check |
| bun:sqlite WAL concurrent reads | Open database in read-only mode; WAL allows concurrent readers |
| TASKBOARD_ROOT path not exists | Pre-check directory; print install instructions if missing |
| Missing task_id argument for show | Validate input; print usage with examples |
| Invalid task-id for show | Return exit code 1 with clear error message |
| Serve subprocess crash | CLI returns non-zero exit code when child exits abnormally |

---

## 7. Testing Strategy

- **Unit Tests**: Reader merge logic with mock events
- **Integration Tests**:
  - CLI commands with test database
  - 空数据库处理
  - 无效 task-id 错误处理
  - 数据库锁定超时
  - 子进程异常退出
  - `NO_COLOR=1` 颜色禁用
- **Manual Tests**:
  - Large dataset pagination (--limit)
  - All filter combinations
  - Serve subprocess lifecycle

---

## 8. Acceptance Criteria

- [ ] `gale-harness board` displays ASCII table of recent tasks
- [ ] `gale-harness board list --status completed` filters correctly
- [ ] `gale-harness board show <id>` displays task details and timeline
- [ ] `gale-harness board show <invalid-id>` returns exit code 1 with clear error
- [ ] `gale-harness board stats` shows accurate aggregates
- [ ] `gale-harness board serve` starts TaskBoard as subprocess
- [ ] `gale-harness board serve` returns non-zero exit code when subprocess crashes
- [ ] All commands handle missing/empty database gracefully
- [ ] All commands provide helpful error messages
- [ ] `--format json` 输出有效 JSON 数组，可被管道解析
- [ ] `--format quiet` 仅输出 task-id，每行一个，可被 xargs 处理
- [ ] `--limit N` 与数据库记录数 > N 时正确限制输出数量
- [ ] 颜色输出在管道或 `NO_COLOR=1` 时自动禁用
- [ ] serve 子进程崩溃时 CLI 返回非零 exit code

---

## 9. Notes

- **Data Source**: `~/.galeharness/tasks.db` (SQLite WAL mode)
- **TaskBoard Reference**: `/tmp/taskboard/` (read-only reference)
- **Schema Contract**: `task_events` table with columns: task_id, event_type, timestamp, project, project_path, skill, title, parent_task_id, error, pr_url, pr_number, memory_id, memory_title
- **Stale Threshold**: Configurable via `BOARD_STALE_HOURS` env var (default: 2 hours)。此环境变量命名已确认，与 PRD 保持一致。
