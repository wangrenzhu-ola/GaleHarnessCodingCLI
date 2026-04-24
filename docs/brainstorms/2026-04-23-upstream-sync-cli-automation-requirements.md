---
date: 2026-04-23
topic: upstream-sync-cli-automation
title: "Upstream 逐 Commit 自动化同步 CLI 与 SKILL"
category: workflow
---

# Upstream 逐 Commit 自动化同步 CLI 与 SKILL

## Problem Frame

当前 GaleHarnessCLI 与上游 compound-engineering-plugin 的同步存在明显的效率瓶颈。以本次同步为例：`.upstream-ref` 停留在 `b104ce46`，而上游 HEAD 已推进到 `5e6ec41`，中间有 **14 个 commit** 需要处理。

现有流程要求研发手动执行以下步骤：
1. 运行 `generate-batch.sh` 生成 patch batch
2. 逐个创建 worktree
3. 逐个应用 adapted patch
4. 手动处理业务逻辑适配
5. 手动运行测试
6. 手动创建 PR
7. 等待 review 后手动 merge
8. 手动更新 `.upstream-ref`
9. 重复步骤 2-8 共 14 次

这个流程的**重复劳动成本高**、**上下文切换频繁**、**容易遗漏步骤**（如忘记更新 `.upstream-ref` 或跳过测试），且**无法让自动化工具承担机械工作**。

团队需要一个**半自动化的 CLI 驱动工作流**：自动化承担 patch 生成、worktree 管理、测试运行、PR 创建等机械步骤，同时在每个 commit 处理完毕后**暂停并交接给人类验收**，确保质量可控。

---

## Actors

- A1. **研发人员（同步执行者）**：发起同步流程、在自动化暂停点验收结果、处理需要人工判断的业务逻辑适配。
- A2. **自动化同步 CLI**：执行检测、patch 生成、worktree 创建、patch 应用、测试运行、PR 创建、状态更新等机械步骤。
- A3. **代码审查者**：在 PR 创建后 review 变更，决定是否 merge。

---

## Key Flows

- F1. **逐 Commit 同步主流程**
  - **Trigger：** 研发执行 CLI 命令 `sync-cli.py next`
  - **Actors：** A1, A2
  - **Steps：**
    1. CLI 读取状态文件，找到 `current_index` 指向的待处理 commit
    2. CLI 从已生成的 adapted/ 目录读取对应 patch 文件（由 `init` 阶段批量生成）
    3. CLI 创建独立 git worktree
    4. CLI 在 worktree 中执行 `git apply --check` 预检
    5. 预检通过 → CLI 在 worktree 中应用 adapted patch
    6. CLI 在 worktree 中运行 `bun test`
    7. 测试通过 → CLI 自动 commit 并 push 到远程分支
    8. CLI 调用 `gh pr create` 创建 PR
    9. CLI 更新本地同步状态为 "awaiting_human_review"
    10. CLI 暂停并提示人类验收
  - **Outcome：** 一个上游 commit 被转换为一个独立的 PR，等待人类 review
  - **Covered by：** R1, R2, R4, R5, R7, R9, R10, R13

- F2. **人类验收后继续**
  - **Trigger：** 人类 merge 了上一个 PR 后，执行 `sync-cli.py resume`
  - **Actors：** A1, A2
  - **Steps：**
    1. CLI 读取同步状态，检测上一个 PR 的状态：
       - **已 merge**：执行步骤 2-5
       - **未 merge（仍为 open）**：输出 PR 当前状态，保持 `awaiting_human_review`，提示用户继续等待或执行 `skip`
       - **已关闭/拒绝（closed without merge）**：输出警告，提示用户执行 `skip --force-cleanup` 清理并跳过，或手动处理
    2. CLI 对账 state.json 与 `.upstream-ref`
    3. CLI 更新 `.upstream-ref` 为已处理的 upstream commit SHA
    4. CLI 清理已完成的 worktree
    5. CLI 将当前 commit 状态更新为 `merged`，`current_index += 1`
    6. CLI 自动进入下一个 commit 的 F1 流程（除非已到达队列末尾）
  - **Outcome：** 同步状态前进，开始处理下一个 commit
  - **Covered by：** R11, R13, R14

- F3. **失败处理与人工接管**
  - **Trigger：** F1 中任意步骤失败（patch 冲突、测试失败、PR 创建失败）
  - **Actors：** A1, A2
  - **Steps：**
    1. CLI 记录失败原因和失败阶段（`failed_at`）到同步状态，状态变为 `failed`
    2. CLI 给出明确的错误报告和下一步建议
    3. CLI 暂停等待人工介入
    4. 人类手动修复后执行 `resume`：CLI 从失败步骤开始重试（而非重跑整个 F1），继续后续步骤
       - 例：若失败在 `test` 阶段，`resume` 重新运行 `bun test`，通过后继续 commit/push/PR 创建
       - 例：若失败在 `patch_check` 阶段，`resume` 重新运行 `git apply --check`，通过后继续 patch_apply/test/...
    5. 人类可执行 `skip` 跳过当前 commit，状态变为 `skipped`
  - **Outcome：** 失败被优雅处理，不阻塞后续 commits 的处理能力
  - **Covered by：** R6, R8, R15, R16

---

## Requirements

**状态管理与检测**
- R1. CLI 启动时自动读取 `.upstream-ref` 作为 baseline，检测上游 `.upstream-repo` 中从 baseline 到 HEAD 的所有待同步 commits。
- R2. CLI 维护一个本地状态文件（默认位于 `.context/galeharness-cli/upstream-sync/state.json`），记录当前同步进度、每个 commit 的处理状态（pending / in_progress / awaiting_human_review / merged / failed / skipped）、对应 PR 链接、失败原因等。
- R3/R12. 提供 `status` 子命令，统一输出以下内容：
  - 同步概览（baseline → target，当前进度百分比）
  - 待处理 commits 队列（含序号、SHA、subject、状态）
  - 当前处理状态（idle / in_progress / awaiting_human_review / failed）
  - 下一个待处理 commit 的摘要
  - 最近操作日志（最后 3 条状态变更记录）

**Patch 生成与 Worktree 管理**
- R4. `next` 子命令自动为当前待处理 commit 生成 raw + adapted patch（复用 `scripts/upstream-sync/` 现有能力），并在独立 git worktree 中准备工作环境。
- R5. Worktree 命名需包含 commit 序号和主题摘要，例如 `upstream-sync-2026-04-23-0001-fix-gh-plan`。
- R6. Patch 应用前执行 `git apply --check` 预检；若冲突，记录失败状态并暂停，给出 raw patch 路径、adapted patch 路径和冲突摘要，等待人工处理。

**测试与质量门禁**
- R7. Patch 应用成功后，CLI 在 worktree 中自动运行 `bun test`。
- R8. 测试失败时，CLI 阻止 PR 创建，记录失败状态并暂停，输出测试失败摘要和日志路径，等待人工修复。

**PR 创建与人类验收**
- R9. 测试通过后，CLI 在 worktree 中自动 commit（commit message 基于 upstream commit subject，前缀添加 `sync(upstream): `），push 到远程分支，并调用 `gh pr create` 创建 PR。
- R9b. PR 创建时需处理远程已存在同名分支的情况：若分支已存在，自动附加 `-2`、`-3` 等序号，或报错并提示用户手动处理。
- R10. PR 创建后，CLI 更新状态为 "awaiting_human_review"，输出 PR 链接，并**明确暂停等待人类验收**；在获得明确的 `resume` 指令前不自动继续。
- R11. `resume` 子命令检测上一个 PR 是否已 merge（通过 `gh pr view` 或本地 git 状态）：
  - **已 merge**：更新 `.upstream-ref` 为对应 upstream commit SHA，清理 worktree，然后自动触发下一个 commit 的 `next` 流程。
  - **未 merge（open）**：输出 PR 当前状态（如 "PR #123 is still open"），保持 `awaiting_human_review` 状态，提示用户继续等待 review。
  - **已关闭/拒绝（closed without merge）**：输出警告（"PR #123 was closed without merging"），提示用户执行 `skip --force-cleanup` 或手动处理。

**CLI 接口与模式**
- R13. 提供 `init` 子命令：调用 `generate-batch.py` 生成全量 patch batch（raw/ + adapted/），初始化状态文件，输出待处理 commits 摘要。仅在同步批次开始时执行一次。
- R14. 提供 `next` 子命令：处理队列中的下一个 commit，走完应用 → 测试 → PR → 暂停的完整流程。patch 文件来自 `init` 阶段已生成的 adapted/ 目录，不再现场生成。
- R15. 提供 `resume` 子命令：在人类 merge PR 后继续同步流程；若从 `failed` 状态恢复，则从失败步骤开始重试而非重跑完整流程；若 PR 未 merge，输出当前状态并保持等待。
- R16. 提供 `--dry-run` 全局标志：预览**单步**将要执行的操作（应用哪个 patch、创建哪个 worktree、运行什么测试、创建什么 PR），但不实际执行副作用操作。全量 14-commit 流程预览作为后续增量功能，不在 v1 范围内。
- R17. 提供 `skip` 子命令：将当前 commit 标记为 `skipped`，记录原因，仅推进 `current_index` 并返回控制权给用户（**不自动调用 next**）。用户需显式执行 `next` 开始处理下一个 commit。
- R18. 提供 `skip --force-cleanup` 选项：用于 PR 被关闭/拒绝的场景，清理已推送的远程分支和 worktree，然后标记为 skipped。

**错误处理与可观测性**
- R19. 每个步骤的失败都必须被捕获、记录到状态文件，并给出人类可操作的下一步提示（包括相关文件路径、建议命令）。
- R20. CLI 输出需使用中文（与现有项目一致），关键路径和命令保留英文。

---

## Acceptance Examples

- AE1. **Covers R1, R3/R12.** 给定 `.upstream-ref` 为 `b104ce46` 且上游有 14 个新 commits，当研发执行 `status` 时，输出显示 "14 个待同步 commits" 的列表，当前状态为 "idle"，下一个待处理为 `0001-refactor-ce-code-review...`。

- AE2. **Covers R4, R7, R9, R10.** 给定状态为 idle 且下一个 commit 已就绪，当研发执行 `next` 时，CLI 自动创建 worktree、应用 patch、运行 `bun test`、创建 PR、输出 PR 链接，然后状态变为 "awaiting_human_review" 并暂停。

- AE3. **Covers R6, R17.** 给定某个 commit 的 adapted patch 与当前代码冲突，当研发执行 `next` 时，CLI 在 `git apply --check` 阶段检测到冲突，状态变为 "failed"（`failed_at: "patch_check"`），输出冲突摘要和建议操作（包括 "手动修复后执行 resume" 或 "执行 skip 跳过"），不创建 worktree 的脏状态。

- AE5. **Covers R16.** 给定 `current_index` 指向一个 pending commit，当研发执行 `next --dry-run` 时，CLI 输出该 commit 将应用的 patch 路径、将创建的 worktree 名称、将运行的测试命令、将创建的 PR 标题，但不实际执行任何文件写入、worktree 创建或 PR 创建操作。

- AE4. **Covers R11, R14.** 给定状态为 "awaiting_human_review" 且对应 PR 已被 merge，当研发执行 `resume` 时，CLI 更新 `.upstream-ref`、清理 worktree、自动开始对下一个 commit 执行 `next` 流程。

---

## Success Criteria

- 上游 14 个 commit 可以在自动化 CLI 的辅助下，被逐个转换为独立的 PR，每个 PR 对应一个上游 commit。
- 测试失败的 commit 不会创建 PR，而是清晰报告失败信息并暂停等待人工修复。
- Patch 冲突的 commit 不会污染主仓库，冲突信息被准确记录。
- 研发可以在任意 commit 处介入（修复冲突、调整业务逻辑、决定 skip），然后让 CLI 继续后续流程。
- `--dry-run` 模式可以完整预览整个 14-commit 同步流程的操作计划，无需副作用。
- CLI 执行期间的所有状态变更都持久化到状态文件，中断后可以通过 `resume` 或 `status` 恢复上下文。

---

## Scope Boundaries

- **不在本范围内**：adapted patch 生成后的**业务逻辑人工适配**（如技能行为语义调整、测试用例补充、HKTMemory patch 重注入）——这仍然需要在 worktree 中由人类完成，CLI 只负责创建环境并在测试通过后发 PR。
- **不在本范围内**：与上游的**全自动定时同步**（CI/CD 触发无人值守同步）——本需求聚焦人工发起、人机协作的半自动同步。
- **不在本范围内**：处理 upstream **force-push** 导致的历史 commit SHA 失效——这是 baseline 管理策略问题，当前假设 upstream 历史线性可追踪。
- **不在本范围内**：将多个 upstream commits **合并为一个 PR**——本需求要求严格的 1:1 commit-to-PR 映射。
- **不在本范围内**：自动 merge PR 或绕过 review——每个 PR 必须经人类 review 后才能 merge。

---

## Key Decisions

- **复用现有脚本而非从零构建**：`scripts/upstream-sync/` 中的 `generate-batch.py`、`adapt-patch.py`、`apply-patch-to-worktree.sh` 已经解决了 patch 生成、适配和应用的核心问题。新的 CLI 将这些脚本作为底层能力调用，上层增加状态机、测试门禁、PR 创建和人类交接逻辑。这降低了实现成本，并保持与现有基础设施的一致性。
  - **关于 generate-batch.py 的调用方式**：`generate-batch.py` 是一次性批量工具。`sync-cli.py init` 命令在初始化时调用它生成全量 batch（raw/ + adapted/ + commit-range.txt），后续 `next` 命令直接从已生成的 adapted/ 目录消费单个 patch，不再重复调用 generate-batch.py。
- **状态文件驱动而非 git 状态驱动**：同步进度记录在独立的 JSON 状态文件中，而不是依赖 git branch 列表或 worktree 列表来推断。这使得流程更可靠（worktree 被意外删除不会丢失进度）、更可观测（状态文件可被人类直接阅读）。
  - **关于"无状态方案"的拒绝**：曾有建议用单次执行命令处理下一个 commit、通过 `.upstream-ref` 隐式追踪进度。此方案被拒绝，因为用户明确要求"每执行完毕后交给人类验收"，无状态方案无法在中断后恢复上下文（如：机器重启、会话切换后无法知道当前处理到哪个 commit、PR 链接是什么、worktree 在哪里）。状态机是必要的。
- **CLI 暂停而非轮询**：PR 创建后 CLI 主动暂停等待人类 `resume`，而不是后台轮询 PR merge 状态。这避免了长时间运行的后台进程，也更符合人机协作的直觉——人类明确告知"我验收完了，继续"。
- **Worktree 自动清理在 resume 时进行**：已 merge 的 commit 对应的 worktree 在 `resume` 时清理，而不是 PR 创建后立即清理。这为人类在 PR review 期间回到 worktree 做微调保留了可能性。
- **1:1 commit-to-PR 映射是不可协商约束**：用户明确要求"独立的一个 commit 一个 commit 的适配然后发到 PR 里"。虽然这带来 14 次 PR review 周期，但对于机械变更（重命名、路径替换）review 成本极低（可批量快速浏览），而对于业务逻辑变更则必须独立 review。该约束作为不可协商的 scope boundary 保留，不在本方案内讨论合并为单个 PR 的替代方案。
- **状态文件是主要事实来源，`.upstream-ref` 是派生状态**：`state.json` 记录每个 commit 的完整处理状态，`.upstream-ref` 仅作为 resume 成功后的最终写入物。`resume` 命令执行前会先对账 state.json 与 `.upstream-ref`：若 `.upstream-ref` 领先于 state.json，以 `.upstream-ref` 为准并修复 state；若落后，以 state.json 为准。崩溃恢复时以 state.json 为准重建上下文。
- **新 CLI 建成后，`compound-sync` SKILL 将被更新**：`plugins/galeharness-cli/skills/compound-sync/SKILL.md` 当前描述手动版工作流，新 CLI 自动化其中的机械步骤。CLI 建设完成后，`compound-sync` SKILL 将被更新为引用 `sync-cli.py` 命令而非手动步骤描述，两者是"底层自动化工具"与"上层使用说明"的关系。

---

## Dependencies / Assumptions

- 本地已配置 `.upstream-repo` 指向有效的 compound-engineering-plugin git 仓库，且该仓库已 fetch 最新 upstream 变更。
- `.upstream-ref` 文件存在且包含有效的 upstream commit SHA。
- 已安装 `gh` CLI 且已认证（用于 `gh pr create` 和 `gh pr view`）。
- 已安装 `git` 且版本 >= 2.5（支持 `git worktree`）。
- 已安装 `bun` 且 `bun test` 可在 worktree 中正常运行。
- 当前 git remote 配置允许 push 分支和创建 PR。
- 目标仓库的 `.gitignore` 已排除 `.context/` 目录（状态文件存放于此）。

---

## Outstanding Questions

### Resolve Before Planning

- （无阻塞问题）

### Deferred to Planning

- [Affects R4, R6][Technical] CLI 的实现语言选择：Python（与现有 `scripts/upstream-sync/` 统一，可直接复用生成逻辑）还是 TypeScript/Bun（与项目 CLI 生态统一，可集成到 `cmd/` 或 `src/commands/`）？
- [Affects R9][Technical] PR 创建时分支命名策略：基于 commit subject 的 slug，还是包含日期和序号的固定格式？
- [Affects R7][Needs research] `bun test` 在 worktree 中的执行路径：是否需要在 worktree 中重新执行 `bun install`？现有 worktree 是否共享 node_modules？
- [Affects R2][Technical] 状态文件的 schema 设计：是否需要支持多批次并发（例如同时处理两个不同的 upstream sync）？还是假设一次只有一个同步流程在进行？
- [Affects R15][Technical] `resume` 从 `failed` 状态恢复时的重试粒度：仅重试失败步骤，还是重试从失败步骤开始的所有后续步骤？（当前文档定义为"从失败步骤开始重试"，实现时需明确）

---

## Deferred / Open Questions

### From 2026-04-23 review

- **generate-batch.py 是批量工具，不支持逐 commit 调用** — F1 / Key Decisions (P1, feasibility + adversarial, confidence 100)

  generate-batch.py 一次性为 baseline..HEAD 的所有 commit 生成 patch，不支持单 commit 调用。实现者必须做出架构决策：方案 A（首次 next 时调用 generate-batch.py 生成全量 batch，后续从已生成的 adapted/ 目录消费）或方案 B（每个 next 直接调用 git format-patch -1 + adapt-patch.py，绕过 generate-batch.py）。选定后需更新 F1 Step 2 的描述。

  <!-- dedup-key: section="f1 key decisions" title="generatebatchpy 是批量工具不支持逐 commit 调用" evidence="key decision 新的 cli 将这些脚本作为底层能力调用上层增加状态机测试门禁pr 创建和人类交接逻辑这降低了实现成本" -->

- **1:1 commit-to-PR 映射是隐含的战略押注** — Scope Boundaries (P1, product-lens, confidence 75)

  文档将严格的 1:1 commit-to-PR 映射作为 scope boundary 排除讨论，但这一选择直接决定了同步流程的 wall-clock 效率。14 个 commit = 14 次 PR review 周期，对于纯机械变更（重命名、格式化）而言，合并为单个 PR 可将 review 开销降低一个数量级。应作为显式权衡记录而非不可协商的约束。

  <!-- dedup-key: section="scope boundaries" title="11 committopr 映射是隐含的战略押注" evidence="scope boundaries 声明 不在本范围内将多个 upstream commits 合并为一个 pr本需求要求严格的 11 committopr 映射" -->

- **更简单的无状态方案可交付核心价值** — Key Decisions / R2 (P1, product-lens, confidence 75)

  核心价值可通过更简单的方案实现：单次执行命令处理下一个 commit，执行完毕即退出，进度通过 .upstream-ref 更新隐式追踪。完整状态机带来的恢复能力和可观测性是锦上添花，但对内部工具而言每多一个状态就多一条用户需要理解的失败路径。

  <!-- dedup-key: section="key decisions r2" title="更简单的无状态方案可交付核心价值" evidence="文档提出完整状态机statejson 6 种状态pendingsin_progressawaiting_reviewmergedfailedskipped和 4 个子命令" -->

- **resume 在 failed 状态后的行为未定义** — F3 / R2 (P1, feasibility, confidence 75)

  F3 说“人类可手动修复后执行 resume”，但 F2 定义的 resume 仅处理 PR 已 merge 场景。实现者需决定：resume 从 failed 恢复时是重新运行整个 F1 流程，还是仅重试失败步骤及后续步骤？不同选择对状态机设计和用户体验影响显著。

  <!-- dedup-key: section="f3 r2" title="resume 在 failed 状态后的行为未定义" evidence="f3 人类可手动修复后执行 resume或执行 skip 跳过当前 commit" -->

- **PR 被关闭未 merge 的路径未处理** — F2 / R11 (P1, feasibility, confidence 75)

  F2 和 R11 仅处理 PR 已 merge 和未 merge 两种状态，但 PR 可能被关闭/拒绝而未 merge。此时 CLI 处于 awaiting_human_review 状态，resume 无法继续，skip 不会清理已推送的远程分支和 worktree。

  <!-- dedup-key: section="f2 r11" title="pr 被关闭未 merge 的路径未处理" evidence="r11 resume 子命令检测上一个 pr 是否已 merge通过 gh pr view 或本地 git 状态确认 merge 后更新 upstreamref" -->

- **state.json 与 .upstream-ref 双写无原子性保证** — R11 / Key Decisions (P1, adversarial, confidence 75)

  R11 要求更新 .upstream-ref，state.json 追踪每个 commit 状态。这是两个独立文件写入，无事务保证。崩溃恢复能力弱于 Success Criteria 声明，因为它假设了跨两个文件的原子状态转换。建议 resume 时对账 state.json 与 .upstream-ref。

  <!-- dedup-key: section="r11 key decisions" title="statejson 与 upstreamref 双写无原子性保证" evidence="r11 确认 merge 后更新 upstreamref 为对应 upstream commit sha清理 worktree然后自动触发下一个 commit 的 next 流程" -->

- **skip 后“继续下一个”歧义** — R16 (P1, coherence, confidence 75)

  R16 说 skip 将“更新状态并继续下一个”。这可能意味着自动开始处理下一个 commit（类似自动运行 next），或仅推进队列指针并返回控制权给用户。两种语义产生完全不同的 UX，需明确选择。

  <!-- dedup-key: section="r16" title="skip 后继续下一个歧义" evidence="r16 提供 skip 子命令将当前 commit 标记为 skipped更新状态并继续下一个" -->

- **status 子命令重复定义且输出规格有差异** — R3 / R12 (P2, coherence + scope-guardian, confidence 100)

  R3 规定 status 输出“待处理 commits 列表、当前进度、最近处理状态、下一个待处理 commit 的摘要”；R12 规定“同步概览、commit 队列、当前状态、最近操作日志”。各含对方没有的内容，实现者只看一个将遗漏另一个的功能。建议合并为单一需求条目。

  <!-- dedup-key: section="r3 r12" title="status 子命令重复定义且输出规格有差异" evidence="r3 提供 status 子命令输出待处理 commits 列表当前进度最近处理状态以及下一个待处理 commit 的摘要" -->

- **F1 Covered by 列表错误包含 R12** — F1 (P2, coherence, confidence 75)

  F1 的 Covered by 注释包含 R12，但 R12 定义的是 status 子命令，F1 的 9 个步骤均不涉及 status。建议从 F1 的 Covered by 列表中移除 R12。

  <!-- dedup-key: section="f1" title="f1 covered by 列表错误包含 r12" evidence="f1 covered by r1 r2 r4 r5 r7 r9 r10 r12 r13" -->

- **--dry-run 范围在 R15 与 Success Criteria 之间存在量级差异** — R15 / Success Criteria (P2, scope-guardian, confidence 75)

  R15 描述“预览将要执行的操作”暗示预览下一步；Success Criteria 要求“完整预览整个 14-commit 同步流程”。两者实现量级差异显著。建议先实现单步预览，全量预览作为后续增量。

  <!-- dedup-key: section="r15 success criteria" title="dryrun 范围在 r15 与 success criteria 之间存在量级差异" evidence="r15 要求文本 预览将要执行的操作生成哪些 patch创建哪个 worktree会运行什么测试会创建什么 pr" -->

- **现有 compound-sync SKILL 未被纳入范围** — Scope / Key Decisions (P2, scope-guardian, confidence 75)

  plugins/galeharness-cli/skills/compound-sync/SKILL.md 已描述手动版同步工作流，新 CLI 自动化了其中的机械步骤。但需求文档未提及该 SKILL 的存在，也未规划 CLI 建成后如何更新 SKILL。建议在 Scope 或 Key Decisions 中明确。

  <!-- dedup-key: section="scope key decisions" title="现有 compoundsync skill 未被纳入范围" evidence="需求标题 upstream 逐 commit 自动化同步 cli 与 skill 提到 skill" -->

- **resume 未指定 PR 尚未 merge 时的行为** — F2 / R11 (P2, adversarial, confidence 75)

  R11 仅指定了 PR 已 merge 时的行为，未指定 PR 尚未 merge（用户提前执行 resume）的行为。建议 resume 检测到 PR 未 merge 时输出 PR 状态并保持 awaiting_human_review 状态。

  <!-- dedup-key: section="f2 r11" title="resume 未指定 pr 尚未 merge 时的行为" evidence="r11 resume 子命令检测上一个 pr 是否已 merge通过 gh pr view 或本地 git 状态确认 merge 后更新 upstreamref" -->

---

## Next Steps

-> `/gh:plan` 进行结构化实施规划
