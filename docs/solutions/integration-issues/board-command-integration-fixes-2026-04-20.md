---
title: "Board 子命令集成修复：从 CLI 注册到 TaskBoard 服务器联调"
date: "2026-04-20"
category: "docs/solutions/integration-issues"
module: "galeharness-cli:board"
problem_type: integration_issue
component: tooling
symptoms:
  - "bun run src/index.ts board serve 报 Unknown command board"
  - "board serve 打印 Starting... 后子进程立即退出，curl 返回 Connection refused"
  - "bun test 中 8 个 board 测试失败，mergeEvents 测试报 Expected in_progress Received stale"
  - "formatTable/formatJson/formatQuiet 测试输出空数据"
  - "board serve 启动后前端返回 404"
root_cause: incomplete_setup
resolution_type: code_fix
severity: high
related_components:
  - testing_framework
  - development_workflow
tags:
  - board-integration
  - taskboard-vendoring
  - cli-registration
  - spawn-cwd
  - test-timestamp
  - format-options
  - dist-auto-build
---

# Board 子命令集成修复：从 CLI 注册到 TaskBoard 服务器联调

## Problem

PR #18 实现了 `gale-harness board` 子命令及其 CLI 子命令（`list`、`show`、`stats`、`serve`），并将 TaskBoard 可视化 UI 集成到 `vendor/taskboard/`。集成过程中出现了五类问题，覆盖 CLI 注册、测试时间敏感性、TypeScript 接口定义、子进程工作目录和前端构建流水线，导致 board 命令无法端对端运行。

## Symptoms

- `bun run src/index.ts board serve` 报 `Unknown command board`——命令根本不存在
- `board serve` 打印启动信息后子进程立即退出，`curl` 收到 Connection refused
- `bun test tests/board.test.ts` 8 个测试失败：
  - `mergeEvents` 系列：`Expected "in_progress" Received "stale"`（时间戳已超 2 小时 stale 阈值）
  - `formatTable`/`formatJson`/`formatQuiet` 系列：输出空数据（`offset` 参数缺失）
- 服务器成功启动后前端 `http://127.0.0.1:<port>/` 返回 404

## What Didn't Work

- **直接调试子进程生命周期**：最初认为子进程因缺少依赖或 server script 路径错误而退出。检查了进程是否存活，但遗漏了 `cwd` 未设置导致的相对路径解析失败这一根本原因。

- **假设 `dist/` 在 vendor 目录内**：`.gitignore` 忽略了 `dist/`，clone 后 vendored 的 TaskBoard 没有预构建产物。最初在错误目录（`vendor/taskboard/frontend/dist/`）运行 `bun run build`，而 server 期望的是 `vendor/taskboard/dist/`，需要从正确 `cwd` 运行才能将产物输出到正确路径。

- **假设测试时间无关**：测试使用硬编码时间戳 `2026-04-19T10:00:00Z`，在编写当天可能正常，但随着真实时间推进，`mergeEvents` 的 stale 判断用 `Date.now()` 比对，任务自动变为 `stale`。

## Solution

### 1. 注册 board 命令到主 CLI

`src/index.ts` 缺少 `board` 子命令的 import 和注册。

```typescript
// BEFORE: src/index.ts
import sync from "./commands/sync"

const main = defineCommand({
  subCommands: {
    convert, install, list, "plugin-path": pluginPath, sync,
    // ❌ board 未注册
  },
})

// AFTER: src/index.ts
import sync from "./commands/sync"
import board from "./commands/board"  // ✓ 新增

const main = defineCommand({
  subCommands: {
    convert, install, list, "plugin-path": pluginPath, sync,
    board: () => board,  // ✓ 注册
  },
})
```

### 2. 修复时间敏感的 mergeEvents 测试

`mergeEvents` 接受可选的 `now` 和 `staleHours` 参数，但原测试未传入，导致使用 `Date.now()` 判断 stale。

```typescript
// BEFORE: tests/board.test.ts
it("should merge skill_started events into tasks", () => {
  const events = [{ timestamp: "2026-04-19T10:00:00Z", ... }]
  const tasks = mergeEvents(events)  // ❌ 用 Date.now()，时间一过就变 stale
  expect(tasks[0].status).toBe("in_progress")  // 失败
})

// AFTER: tests/board.test.ts
it("should merge skill_started events into tasks", () => {
  const now = new Date("2026-04-19T11:00:00Z").getTime()  // ✓ 固定 now
  const events = [{ timestamp: "2026-04-19T10:00:00Z", ... }]
  const tasks = mergeEvents(events, now, 2)  // ✓ 传入 now + staleHours
  expect(tasks[0].status).toBe("in_progress")  // 通过
})
```

所有调用 `mergeEvents(events)` 的非 stale 测试，都需要传入一个距离事件时间戳 **小于 staleHours** 的 `now` 值。

### 3. 修复 FormatOptions.offset 缺失

`FormatOptions` 定义 `offset: number`（必填），但测试调用时未传，导致 `tasks.slice(undefined, ...)` 返回空数组。

```typescript
// BEFORE: src/board/types.ts
export interface FormatOptions {
  offset: number  // ❌ 必填，但许多调用方没有传
}

// AFTER: src/board/types.ts
export interface FormatOptions {
  offset?: number  // ✓ 可选
}

// AFTER: src/board/formatter.ts（各格式化函数内部）
export function formatTable(tasks, options) {
  const offset = options.offset ?? 0  // ✓ 安全默认值
  // ...slice(offset, offset + options.limit)
}
```

### 4. 修复 board serve 子进程 cwd

`spawn("bun", ["run", serverScript])` 没有 `cwd`，子进程继承父进程目录。TaskBoard 的 `serveStatic({ root: "./dist" })` 解析为父进程目录下的 `dist/`，而非 `vendor/taskboard/dist/`，导致启动失败。

```typescript
// BEFORE: src/commands/board-serve.ts
const child = spawn("bun", ["run", serverScript], {
  env: { ...process.env, BOARD_PORT: String(port) },
  stdio: "inherit",
  // ❌ 无 cwd，相对路径解析错误
})

// AFTER: src/commands/board-serve.ts
const child = spawn("bun", ["run", serverScript], {
  cwd: taskboardRoot,  // ✓ 确保 ./dist 解析到 vendor/taskboard/dist/
  env: { ...process.env, BOARD_PORT: String(port) },
  stdio: "inherit",
})
```

### 5. 添加前端自动构建

`.gitignore` 忽略 `dist/`，vendored 的 TaskBoard 没有预构建产物。在 `board serve` 启动前检测并自动构建：

```typescript
// AFTER: src/commands/board-serve.ts
const distDir = join(taskboardRoot, "dist")
if (!existsSync(distDir)) {
  console.log("Building TaskBoard frontend...")
  const buildResult = Bun.spawnSync(["bun", "run", "build"], {
    cwd: taskboardRoot,  // ✓ vite.config.ts 的 outDir: "../dist" 从 frontend/ 根输出到此
    stdout: "inherit",
    stderr: "inherit",
  })
  if (buildResult.exitCode !== 0) {
    console.error("Error: Frontend build failed")
    process.exit(1)
  }
}
```

## Why This Works

**命令注册**：citty 框架通过 `subCommands` map 路由命令，不在 map 中的命令直接报 Unknown command，和实现文件是否存在无关。

**时间敏感测试**：`mergeEvents` 的 stale 判断依赖传入的 `now`（或 `Date.now()`）与 `started_at` 的差值。固定 `now` 确保测试与执行时间无关，不随日历推进而失败。

**offset 可选**：`slice(undefined, undefined + limit)` 中 `undefined + number` 得到 `NaN`，`Array.slice(0, NaN)` 返回空数组，而非预期的前 N 项。将 `offset` 改为可选并用 `?? 0` 兜底，修复了无声的空输出 bug。

**cwd 设置**：Node.js `child_process.spawn` 不自动继承合适的工作目录语义——子进程的相对路径以父进程 `cwd` 为基准。Bun/Hono 的 `serveStatic` 静态文件根路径需要从 TaskBoard 目录解析；不设置 `cwd` 使服务器找不到 `dist/` 而直接崩溃退出。

**自动构建**：Vendoring 时删除了 `.git` 历史但保留了源码。`dist/` 在 `.gitignore` 中不被跟踪，必须在使用前构建。`Bun.spawnSync` 同步等待构建完成，确保服务器启动时产物已就位。

## Prevention

**测试编写规范**：
- 凡是调用涉及时间判断的函数（如 `mergeEvents`），测试必须传入显式 `now` 参数，不依赖 `Date.now()`
- `mergeEvents` 测试传入的 `staleHours` 应引用 src 中定义的默认常量，或显式注释"1h elapsed < 2h threshold"的含义，避免魔术数字与生产阈值悄然脱节
- `offset` 虽为可选，测试中应显式传 `{ offset: 0, limit: N }` 而非省略，避免隐式依赖 fallback 行为掩盖未来的回归

**CLI 命令新增检查清单**：
- [ ] `src/index.ts` 已 import 并注册新命令
- [ ] 子命令 `subCommands` map 中有对应条目
- [ ] 运行 `bun run src/index.ts --help` 验证命令可见

**子进程 spawn 规范**：
- 凡是 spawn 的子进程依赖相对路径（读取文件、静态服务），必须显式传入 `cwd`
- 环境变量名称与子进程实际读取的变量名核对一致（本例：`BOARD_PORT` 而非 `PORT`）
- 使用 `Bun.spawnSync` 检查构建结果时，优先使用 `.success` 属性（`if (!buildResult.success)`）而非 `.exitCode !== 0`，正确覆盖 signal 终止的情况；`cwd` 必须来自编译期固定的路径常量，不可接受运行时外部输入

**Vendor 目录**：
- Vendored 子项目如有构建产物（前端 `dist/`、编译输出），应在集成时添加自动构建检测
- 或在 `vendor/` 下的 `.gitignore` 中明确说明哪些目录需要构建后才可用

**CI 验证**：
```bash
# 最终集成验证应覆盖
bun test tests/board.test.ts      # 单元+集成测试全过
bun run src/index.ts board list   # CLI 命令可调用
bun run src/index.ts board serve &
sleep 3 && curl -f http://127.0.0.1:4321/api/tasks  # API 可达
```

## Related Issues

- [PR #18: feat(board): implement gale-harness board subcommand](https://github.com/wangrenzhu-ola/GaleHarnessCodingCLI/pull/18)
- [GaleHarnessCodingTaskBoard](https://github.com/wangrenzhu-ola/GaleHarnessCodingTaskBoard)
- `docs/solutions/best-practices/hktmemory-compounding-test-review-fixes-2026-04-18.md` — TypeScript 接口测试精确性相关实践
- `docs/solutions/developer-experience/branch-based-plugin-install-and-testing-2026-03-26.md` — CLI 子命令结构参考
