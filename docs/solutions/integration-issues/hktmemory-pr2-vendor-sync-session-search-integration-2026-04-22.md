---
title: "HKTMemory PR #2 升级集成：vendor 同步、session_search 增量集成与 gale-task 打通设计"
date: 2026-04-22
category: integration-issues
module: hktmemory-integration
problem_type: integration_issue
component: tooling
severity: high
applies_when:
  - HKTMemory 独立仓库发布重大功能升级需要集成回 GaleHarnessCLI
  - vendor/hkt-memory/ 版本滞后导致技能运行时静默失败
  - 需要在技能 SKILL.md 中增量集成新的 HKTMemory 能力
  - gale-task 与 HKTMemory 的数据流打通需要设计论证
tags:
  - hktmemory
  - vendor-sync
  - session-search
  - hkt-patch
  - smoke-test
  - gale-task
  - integration
  - multi-phase
---

# HKTMemory PR #2 升级集成：vendor 同步、session_search 增量集成与 gale-task 打通设计

## Context

HKTMemory 独立仓库 PR #2 已合并，引入了 session_search（会话转录搜索）、runtime orchestration（运行时编排）、safety gateway（安全脱敏网关）和 6 个关键 bug 修复。GaleHarnessCLI 的 `vendor/hkt-memory/` 长期缺失，导致 8 个核心 gh: 技能（gh:brainstorm、gh:plan、gh:work、gh:review、gh:compound、gh:ideate、gh:debug、gh:optimize）在运行时无法调用 HKTMemory，知识积累断裂。

采用三阶段渐进式集成策略：P1 vendor 同步验证、P2 session_search 增量集成、P3 gale-task 打通设计。

## Guidance

### P1 — Vendor 同步与验证

**目标**：将 `vendor/hkt-memory/` 更新到上游 PR #2 合并后的最新状态，并确认同步不引入回归。

**步骤**：

1. 从上游仓库克隆最新代码到 `vendor/hkt-memory/`（commit abb36c9）
2. 运行两层验证：
   - **上游自有测试**：`uv run pytest vendor/hkt-memory/tests/` — 确认 61 passed，0 failed
   - **GaleHarnessCLI 全量测试**：`bun test` — 确认 960 passed，无回归
3. 更新 `.upstream-ref` 记录同步点（commit hash + 时间戳）

**验证原则**：两层测试各守一道防线。上游测试保证 vendor 代码自身正确；GaleHarnessCLI 测试保证集成不破坏已有功能。任何一层出问题都必须暂停，不能进入下一阶段。

### P2 — session_search 增量集成

**目标**：在不改变现有 retrieve/store 架构的前提下，通过 HKT-PATCH 补丁为技能新增 session_search 能力。

**HKT-PATCH 补丁命名规范**：

`phase-0.Xb` 表示对现有 `phase-0.X` retrieve 的补充维度。`b` 后缀表示"补充"（complementary），与主 retrieve 段落形成配对但独立运作。

**新增补丁**：

| 技能 | 补丁名称 | 位置 | 查询目标 |
|------|----------|------|----------|
| gh:work | `phase-0.6b` | 紧跟 `phase-0.6` 之后 | 历史工作会话 |
| gh:debug | `phase-0.4b` | 紧跟 `phase-0.4` 之后 | 历史调试会话 |

**非阻塞 fallback 模式**：所有补丁采用 `2>/dev/null || true` 或等价的静默降级策略。当命令不可用或返回错误时，技能流程不受影响，继续执行后续阶段。

**测试扩展**：

- `tests/hkt-memory-compounding.test.ts` 扩展至 87 测试，新增 "HKTMemory Session Search Integration" describe 块，验证每个 session_search 补丁的存在性、命令格式、位置顺序和非阻塞 fallback
- 新建 `tests/hkt-memory-cli-smoke.test.ts`（22 测试），覆盖 HKTMemory CLI 子命令的冒烟测试，使用 `Bun.spawn` 模式调用 `uv run vendor/hkt-memory/scripts/hkt_memory_v5.py`

**重要发现**：`session_search` CLI 子命令在 `hkt_memory_v5.py` 中实际不存在。Python API 层 `manager_v5.py` 有完整的 `session_search` 实现，但 CLI 脚本未暴露该入口。当前 SKILL.md 中的调用在非阻塞 fallback 下静默降级，不影响技能正常流程，但 session_search 功能实际不可用。后续需在 vendor 层补齐 CLI 入口。

### P3 — gale-task 打通设计

**目标**：设计 gale-task 与 HKTMemory 的数据流打通方案，使技能执行完成后能自动将会话记录存入向量库。

**方案对比**：

| 维度 | 方案 A：skill_completed 钩子 | 方案 B：技能侧显式触发 |
|------|------------------------------|------------------------|
| 触发方式 | gale-task 自动检测技能完成 | HKT-PATCH 显式调用 `gale-task log session_stored` |
| 架构一致性 | 需要新增钩子机制 | 与现有 HKT-PATCH 架构一致 |
| 阻塞性 | 可能阻塞 gale-task 事件循环 | 符合 gale-task "never block" 原则 |
| 存储质量 | 自动存储，可能存入噪声 | 技能作者掌握领域判断，质量可控 |
| 实现复杂度 | 需修改 gale-task 核心 | 仅需新增事件类型 |

**推荐方案 B**：新增 `gale-task log session_stored` 事件，由 HKT-PATCH 显式调用。

**推荐理由**：

1. 与现有 HKT-PATCH 架构一致 — 补丁是技能侧扩展能力的标准方式，不需要新增基础设施
2. 符合 gale-task "never block" 原则 — 显式调用不会引入意外的阻塞点
3. 存储质量可控 — 技能作者能判断"什么值得被记住"，避免自动钩子存入低价值噪声
4. 实现简单 — 仅需在 `cmd/gale-task/` 中新增一个事件类型，不需要修改核心调度逻辑

## Why This Matters

- **知识积累变成记忆复利**：gh:work 可查询历史工作会话，减少重复排查；gh:debug 可参考历史调试记录，加速根因定位
- **多阶段集成风险可控**：P1 验证 vendor 完整性，P2 在补丁层面增量集成，P3 仅做设计论证。任何环节出问题可快速定位到具体阶段
- **技能自主性受保护**：方案 B 让技能作者控制"什么值得被记住"，而不是由全局钩子盲目存储所有会话
- **新贡献者学习成本低**：HKT-PATCH 命名规范（`phase-0.Xb` = 对 `phase-0.X` 的补充维度）清晰直观，一看即懂

## When to Apply

**适用场景**：

- 独立仓库的新功能需要集成回主项目，且功能涉及多个消费方
- 新能力还不够成熟，需要试验和逐步采用（如 session_search CLI 入口缺失）
- 涉及多个系统协作（任务追踪 + 向量库 + CLI），需要分阶段降低风险
- 需要保证现有功能无回归（两层验证防线）

**不适用场景**：

- 简单 bug 修复可以一次性集成，无需分阶段
- 新功能完全独立、不与现有系统交互，直接 vendor 同步即可

## Examples

### 示例 1: HKT-PATCH phase-0.6b 的结构

在 `plugins/galeharness-cli/skills/gh-work/SKILL.md` 中，`phase-0.6b` 紧跟 `phase-0.6` 段落之后：

```markdown
<!-- /HKT-PATCH:phase-0.6 -->

<!-- HKT-PATCH:phase-0.6b -->
#### 0.6b HKTMemory Session Search

在向量检索之外，查询相关的历史工作会话记录：

1. 从当前任务标题和技能名称构建搜索查询

2. 运行（需要环境变量 HKT_MEMORY_API_KEY, HKT_MEMORY_BASE_URL, HKT_MEMORY_MODEL）：
   ```bash
   uv run vendor/hkt-memory/scripts/hkt_memory_v5.py session_search \
     --query "<技能名称: gh:work — 任务标题或特征描述>" \
     --limit 5
   ```

3. 如果返回结果，准备上下文块供后续阶段参考

4. 如果无结果或命令报错，静默继续，不阻塞 Phase 1。

<!-- /HKT-PATCH:phase-0.6b -->
```

关键设计要点：开闭标记配对、位置紧跟对应 retrieve 段落、非阻塞 fallback 文案、`b` 后缀明确表示补充维度。

### 示例 2: session_search 补丁的测试覆盖

在 `tests/hkt-memory-compounding.test.ts` 中，session_search 补丁的测试验证四个维度：

```typescript
// Session search patches: phase-0.Xb (补充在 retrieve 后)
const SESSION_SEARCH_PATCHES: Partial<Record<CompoundingSkill | "gh-debug" | "gh-optimize", string>> = {
  "gh-work": "phase-0.6b",
  "gh-debug": "phase-0.4b",
}

describe("HKTMemory Session Search Integration", () => {
  for (const [skill, patchName] of Object.entries(SESSION_SEARCH_PATCHES)) {
    describe(skill, () => {
      test(`SKILL.md contains ${patchName} session_search patch`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf-8")
        const patches = parseHktPatches(content)
        const found = patches.find(p => p.name === patchName)
        expect(found).toBeDefined()
      })

      test(`${patchName} contains session_search command with --query and --limit`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf-8")
        const ctx = extractPhaseContext(content, patchName)
        expect(ctx).toContain("session_search")
        expect(ctx).toContain("--query")
        expect(ctx).toContain("--limit")
      })

      test(`${patchName} appears after retrieve patch`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf-8")
        const patches = parseHktPatches(content)
        const retrievePatch = patches.find(p => isRetrievePatch(p.name))
        const sessionPatch = patches.find(p => p.name === patchName)
        if (retrievePatch && sessionPatch) {
          expect(sessionPatch.line).toBeGreaterThan(retrievePatch.line)
        }
      })

      test(`${patchName} has non-blocking fallback`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf-8")
        const ctx = extractPhaseContext(content, patchName)
        expect(ctx).toMatch(/静默继续|不阻塞|silently|proceed|continue/)
      })
    })
  }
})
```

### 示例 3: Bun 冒烟测试的 spawn 模式

`tests/hkt-memory-cli-smoke.test.ts` 使用 `Bun.spawn` 直接调用 `uv run` 驱动 HKTMemory CLI，测试脚本在各子命令上的基本行为：

```typescript
function runHktCommand(
  subcommand: string,
  args: string[] = [],
  env?: Record<string, string | undefined>,
  timeout = 30_000,
  topLevelArgs: string[] = [],
): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      proc.kill("SIGKILL")
      reject(new Error(`Timeout after ${timeout}ms for: ${subcommand} ${args.join(" ")}`))
    }, timeout)

    const proc = Bun.spawn(["uv", "run", HKT_SCRIPT, ...topLevelArgs, subcommand, ...args], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: env ?? envWithoutHktKeys(),
    })

    proc.exited.then(async (exitCode) => {
      clearTimeout(timer)
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      resolve({ exitCode, stdout, stderr })
    })
  })
}

// 使用示例：验证 stats 子命令在无 API key 时优雅降级
test("returns exit code 0 without API key (graceful degradation)", async () => {
  const result = await runHktCommand("stats", [], envWithoutHktKeys())
  expect(result.exitCode).toBe(0)
})
```

关键设计要点：`envWithoutHktKeys()` 确保 CI 环境不依赖真实 API key；超时机制防止子进程挂起；`beforeAll` 中检测 `uv` 和脚本可用性，不可用时自动 skip。

## Related

- `docs/solutions/best-practices/hktmemory-compounding-test-review-fixes-2026-04-18.md` — HKT-PATCH 测试精确匹配规范和边界测试
- `docs/solutions/developer-experience/global-knowledge-repository-infrastructure-2026-04-20.md` — HKT-PATCH 标记的集成框架和 CI/CD 模板
- `docs/solutions/integration-issues/windows-trae-ide-compatibility-2026-04-17.md` — HKTMemory 在 Windows 环境中的 uv PATH 和环境变量问题
- `docs/brainstorms/2026-04-22-hktmemory-pr2-upgrade-requirements.md` — 本次集成的需求规范（R1-R9）
- `docs/plans/2026-04-22-001-feat-hktmemory-pr2-upgrade-plan.md` — P3 gale-task 打通设计详细方案
- PR #37 (`feat/hktmemory-pr2-upgrade`) — 本次集成的实现 PR
