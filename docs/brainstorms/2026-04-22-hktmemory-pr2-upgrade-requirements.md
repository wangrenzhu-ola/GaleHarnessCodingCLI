---
date: 2026-04-22
topic: hktmemory-pr2-upgrade
title: HKTMemory PR #2 升级与集成改进
category: hktmemory-integration
---

# HKTMemory PR #2 升级与集成改进

## Problem Frame

HKTMemory 独立仓库（`git@github.com:wangrenzhu-ola/HKTMemory.git`）的 PR #2 已合并，引入了会话转录存储/搜索、运行时编排系统、安全脱敏网关等重大能力升级，并修复了 6 个关键 bug。当前 `vendor/hkt-memory/` 停留在旧版本，缺少这些能力，导致 gh:sessions 只是一个转发 stub，gh:debug 无法利用会话历史辅助排查。

本次工作的目标是将 vendor 同步到 PR #2 合并后的版本，验证无回归，并将 `session_search` 增量集成到最相关的两个技能中（gh:debug 缺少会话历史辅助排查，gh:work 执行长任务时常需回顾同议题的先前会话上下文），同时为后续 `orchestrate-recall` 全面迁移和 `gale-task` 打通奠定基础。

## Requirements

**P1 — Vendor 同步与验证**

- R1. 将 `vendor/hkt-memory/` 同步到 HKTMemory 仓库 PR #2 合并后的最新 commit，保留本地目录结构不变
- R2. 同步后运行 HKTMemory 自有测试套件（`uv run pytest vendor/hkt-memory/tests/`），全部通过视为无回归
- R3. 同步后运行 GaleHarnessCLI 自有测试套件（`bun test`），确保现有 hkt-memory-compounding 测试和其他测试无回归

**P2 — session_search 集成与冒烟测试**

*session_search 增量集成*

- R4. 在 `gh:work` 的 SKILL.md 中新增 HKT-PATCH 段落，在执行前调用 `session_search` 查询相关会话历史作为补充上下文。默认以当前技能名称 + 任务标题作为 query，保留现有 `retrieve` 检索补丁不变
- R5. 在 `gh:debug` 的 SKILL.md 中新增 HKT-PATCH 段落，在调试前调用 `session_search` 查询相关调试历史和会话记录。默认以错误信息/bug 描述作为 query，保留现有 `retrieve` 检索补丁不变
- R6. 新增的 HKT-PATCH 段落遵循现有命名规范（HTML 注释标记），并在 `hkt-memory-compounding.test.ts` 中补充对应的补丁识别测试

*Vendor 级别冒烟测试*

- R7. 新增 Bun 测试文件，通过 spawn 调用 `hkt_memory_v5.py` 验证以下 5 个子命令的 CLI 可达性：`stats`、`store`、`retrieve`、`session_search`、`list-recent`。测试需配置必要的环境变量（HKT_MEMORY_API_KEY 等）或验证缺失时的优雅降级
- R8. 冒烟测试只验证 CLI 层调用正常返回（退出码、输出格式），不测试 Python 内部逻辑（那是 HKTMemory 自有 pytest 的职责）

**P3 — gale-task 打通（仅设计，不实现）**

- R9. 在需求文档中记录 gale-task `task_id` 与 `store_session_transcript` 打通的推荐设计方案，供后续规划使用。设计应覆盖：触发时机、数据流向、元数据映射（task_id -> HKT_TASK_ID）

## Success Criteria

- `vendor/hkt-memory/` 包含 PR #2 的全部改动（含 runtime/orchestrator.py、runtime/provider.py、runtime/safety.py、新 CLI 子命令等）
- HKTMemory pytest 全通过，GaleHarnessCLI `bun test` 全通过
- `gh:work` 和 `gh:debug` 的 SKILL.md 中可见新的 session_search HKT-PATCH 段落
- Bun 冒烟测试覆盖 5 个子命令（stats、store、retrieve、session_search、list-recent）且通过
- gale-task 打通设计方案已记录在文档中

## Scope Boundaries

- **不做** orchestrate-recall 全面迁移（8 个技能从 retrieve 迁移到 orchestrate-recall）— 留到下一轮
- **不做** gale-task 打通的代码实现 — 本轮仅产出设计文档
- **不做** gh:sessions 技能的重写 — 它当前是 stub，增强需要独立规划
- **不做** HKTMemory Python 层的 bug 修复或功能开发 — vendor 是只读同步
- **不改** 现有 8 个技能的 retrieve 检索补丁 — session_search 作为补充而非替换
- **不做** `prefetch` 和 `orchestrate-recall` 子命令的集成 — 留到 orchestrate-recall 迁移轮次

## Key Decisions

- **分阶段推进而非一步到位**：PR #2 同时引入了 session_search 和 orchestrate-recall 编排系统，但全面迁移 8 个技能风险大、改动广。先做增量集成 session_search，验证价值后再迁移编排系统
- **冒烟测试在 Bun 层而非 pytest 层**：HKTMemory 有自己的 pytest 测试套件，GaleHarnessCLI 只需验证「从 CLI 层能正常调用」这个集成约束
- **P3 仅记录设计**：gale-task 与 store_session_transcript 的打通涉及触发时机、数据流、环境变量传递等设计决策，在 P1/P2 稳定后再实现更安全

## Dependencies / Assumptions

- HKTMemory 上游仓库 PR #2 已合并，可以 clone 或 fetch 最新代码
- `uv` 工具已安装，可运行 HKTMemory pytest
- PR #2 引入的新环境变量（HKT_SESSION_ID、HKT_TASK_ID 等）在冒烟测试中可以用测试值
- PR #2 引入的新 CLI 子命令（`list-recent`、`prefetch`、`orchestrate-recall`）向后兼容现有 `store`/`retrieve` 行为

## Outstanding Questions

### Deferred to Planning

- [影响 R4/R5][技术] `session_search` 的查询模板细节（基本方向已定：gh:work 用技能名称+任务标题，gh:debug 用错误信息/bug 描述，规划阶段确认具体格式和 fallback 策略）
- [影响 R7][技术] 冒烟测试中 `store` 和 `retrieve` 子命令需要实际的 embedding API 调用还是可以用 mock/离线模式
- [影响 R9][设计] gale-task 打通的两种候选方案（skill_completed 钩子自动存储 vs 技能侧显式触发）的详细权衡

## P3 设计草案：gale-task 与 store_session_transcript 打通

> 以下为设计方向记录，供后续 `/gh:plan` 使用，本轮不实现。

**候选方案 A — skill_completed 钩子自动存储**
- 在 `gale-task log skill_completed` 时，自动从 `.context/` 读取当前会话上下文，调用 `store_session_transcript`
- task_id 直接映射为 HKT_TASK_ID 元数据
- 优点：用户无感知、零配置
- 风险：不是所有技能都产出值得存储的会话内容；可能存储大量低价值数据

**候选方案 B — 技能侧显式触发**
- 新增 `gale-task log session_stored` 事件类型
- 由技能的 HKT-PATCH 段落在合适时机显式调用，通过 `--task-id` 参数传递当前 task_id（从 `.context/galeharness-cli/current-task.json` 读取），映射为 HKT_TASK_ID 元数据
- 优点：可控、只存有价值的内容
- 风险：需要每个技能都加 HKT-PATCH，增加维护负担

**推荐方向**：方案 B 更符合现有 HKT-PATCH 的增量集成模式，与当前 8 个技能的 store 补丁风格一致。但需要在规划阶段评估是否可以设计一个通用的 store-session 补丁模板，减少重复。

## Next Steps

`Resolve Before Planning` 为空 -> `/gh:plan` 进行结构化实施规划
