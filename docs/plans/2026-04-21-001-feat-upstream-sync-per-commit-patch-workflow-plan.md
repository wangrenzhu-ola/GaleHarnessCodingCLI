---
title: "feat: Upstream 逐 Commit Patch 批次同步工作流"
type: feat
status: active
date: 2026-04-21
origin: docs/brainstorms/2026-04-21-upstream-sync-per-commit-patch-workflow-requirements.md
depth: standard
requirements_trace: R1-R11
---

# feat: Upstream 逐 Commit Patch 批次同步工作流

## Overview

为当前“单个巨型 upstream diff 手工适配”的同步方式补齐一套可复用的本地批次工作流：按 upstream commit 生成独立 patch，保留 raw/adapted 双版本，在 `.context/galeharness-cli/upstream-sync/` 下形成可追溯批次，并提供面向 git worktree 的安全应用脚本。该方案优先解决可审查、可并行、可回滚的问题，不把人工业务适配或自动定时同步纳入本次实现。

## Problem Frame

现有同步方式把多个 upstream commit 压成一个大 patch，导致 review 难、测试粗、回滚成本高，也无法让多名研发并行处理不同 upstream 变更。需求文档已经明确将“commit 作为语义单元”“保留 raw + adapted 双版本”“用 git worktree 并发协作”作为核心方向，本计划在这些前提下把实现边界、脚本布局、状态文件和验证策略定清楚，确保后续实现可以直接进入编码阶段而不是继续讨论流程设计。

## Requirements Trace

- R1. 为每个 upstream commit 生成独立 patch，而不是一个聚合 diff
- R2. patch 文件名包含递增序号和 commit 摘要，便于排序与 review
- R3. 同时生成 `raw/` 与 `adapted/` 两套 patch
- R4. 每个同步批次写入按日期组织的目录，并包含 `commit-range.txt` 与 `README.md`
- R5. `commit-range.txt` 的批次日期使用实际生成日期，而不是 upstream commit 日期
- R6. 提供 `apply-patch-to-worktree.sh`，支持在独立 worktree 中安全应用单个 adapted patch
- R7. 应用前先执行 `git apply --check`，失败时给出可执行的下一步建议
- R8. 检测主 worktree 并发出警告，默认鼓励在独立 worktree 中操作
- R9. 提供 `adapt-patch.py` 执行机械适配，覆盖路径与前缀替换
- R10. 提供 `generate-batch.sh` 自动读取上次同步基线并生成完整批次
- R11. 批次 README 内置完整的 git worktree 并发协作说明

## Scope Boundaries

- 不处理 patch 应用后的人工业务逻辑适配，例如技能文案差异、测试重写、HKTMemory patch 回灌
- 不改变现有 PR review 标准，也不定义“何时可以合并”的组织流程
- 不做基于 CI/CD 的自动定时同步；本次只覆盖本地批次生成、适配、应用和协作说明
- 不把 `.context/` 下的批次状态纳入 Git 版本控制；它继续作为本地工作流状态存在

### Deferred to Separate Tasks

- 将来如果需要把该流程升级为正式 CLI 子命令，可在后续独立任务中从 `scripts/upstream-sync/` 迁移到 `cmd/`
- 如果后续需要把 patch 状态同步到 task board 或知识仓库，也应作为单独任务规划

## Context & Research

### Relevant Code and Patterns

- `plugins/galeharness-cli/skills/compound-sync/SKILL.md` 当前只描述“查看 upstream diff -> 手工同步”的高层流程，没有批次目录、脚本入口或逐 commit 处理能力；新方案应作为该技能的具体落地路径
- `plugins/galeharness-cli/skills/git-worktree/SKILL.md` 与 `plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh` 已定义 `.worktrees/` 目录、独立 worktree 的使用姿势和安全提示；新脚本应复用这些约定，而不是再发明另一套并行开发模型
- `.gitignore` 已忽略 `.context/`、`.upstream-ref`、`.upstream-repo` 与同步临时文件，这意味着“本地批次状态 + 本地 upstream 路径配置”已经符合仓库的本地工作流约束

### Institutional Learnings

- `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md` 建议把多步骤编排、重试与复杂错误处理放到 Python 中，而不是在 macOS 默认 bash 3.2 上堆积控制流
- `docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md` 建议把 Git 流程实现为显式状态检查序列，不依赖早期采样值，也不要把失败路径藏进宽泛 prose

### External References

- 本次不需要额外外部调研；当前需求主要受本仓库现有同步技能、`.context/` 约定和 git worktree 使用模式约束

## Key Technical Decisions

- **批次目录保留在 `.context/`**：运行期产物属于可丢弃但需被同一会话或同一团队成员复用的工作流状态，符合仓库对 `.context/` 的定义；不把这些批次提交到 Git 可以避免把同步中间态混入主干历史
- **`generate-batch.sh` 作为稳定入口，复杂编排落到 Python**：保留需求里指定的 shell 入口名，但将 commit 枚举、patch 导出、manifest 写入和错误聚合放进 `generate-batch.py`，避免 bash 在多步骤失败处理上的脚枪问题
- **适配规则使用显式映射表，而不是散落的字符串替换**：`adapt-patch.py` 读取同目录映射配置，先处理路径和命名空间，再处理特定 skill/agent 名称替换，便于未来新增 `ce-* -> gh-*` 规则时扩展
- **应用脚本默认严格、保守，不默认自动 `--3way`**：先把“预检、主 worktree 警告、冲突解释”做扎实；`--3way` 作为可选增强留到确认真实使用场景后再引入，避免在第一版就掩盖 patch 漂移问题
- **上游基线继续由 `.upstream-ref` 驱动，本地 upstream 仓库路径改为显式配置输入**：生成批次时优先读取命令参数，其次读取 `.upstream-repo`；计划不把机器相关绝对路径写死进脚本逻辑
- **批次 README 既是操作手册，也是状态总览**：除固定的工作流说明外，README 还应包含 patch 清单、对应 upstream commit、建议 worktree 命名和人工适配记录位，减少团队成员在目录内来回查找信息

## Open Questions

### Resolved During Planning

- `adapt-patch.py` 是否要支持未来更多命名替换：是，但通过显式映射表支持，而不是在脚本里继续追加隐式正则。第一版映射表至少覆盖 `ce:` -> `gh:`、`compound-engineering` -> `galeharness-cli` 及已知 skill/agent 名称差异
- 上游仓库路径是否沿用需求文档里的机器绝对路径：否。实现采用“命令参数优先，其次 `.upstream-repo` 文件”的本地配置契约；需求文档中的绝对路径仅作为当前操作者环境示例

### Deferred to Implementation

- `apply-patch-to-worktree.sh` 是否需要 `--3way`：先不作为基线要求，待第一版在真实冲突样本上验证后再决定是否引入
- 同一日期下重复生成批次时是拒绝覆盖、原地刷新还是自动追加后缀：计划倾向“默认拒绝覆盖并要求显式 `--force`”，但最终细节可在实现时根据测试夹具难易度微调

## Output Structure

```text
scripts/
  upstream-sync/
    generate-batch.sh
    generate-batch.py
    adapt-patch.py
    apply-patch-to-worktree.sh
    rename-rules.json

tests/
  fixtures/
    upstream-sync/
      upstream-repo/
      expected-batch/
      sample-patches/
  upstream-sync-generate-batch.test.ts
  upstream-sync-adapt-patch.test.ts
  upstream-sync-apply-patch.test.ts

.context/
  galeharness-cli/
    upstream-sync/
      2026-04-21/
        raw/
          0001-*.patch
        adapted/
          0001-*.patch
        commit-range.txt
        README.md
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
.upstream-ref + (--upstream-repo | .upstream-repo)
        |
        v
discover unsynced upstream commits
        |
        v
for each commit in chronological order
  -> export raw patch into raw/NNNN-subject.patch
  -> capture commit metadata for manifest + README table
  -> adapt raw patch via rename-rules.json
  -> write adapted/NNNN-subject.patch
        |
        v
write commit-range.txt (start/end SHA, generated-at date, count)
write README.md (workflow instructions + patch table + status placeholders)

apply-patch-to-worktree.sh:
  resolve current worktree -> warn if main repo
  verify working tree state
  git apply --check adapted patch
  if clean:
    git apply patch
  else:
    explain conflict + suggest next actions
```

## Implementation Units

- [ ] **Unit 1: 批次生成入口与 manifest 契约**

**Goal:** 建立可重复执行的批次生成入口，统一 upstream 路径解析、基线读取、目录创建与 `commit-range.txt` 输出格式。

**Requirements:** R1, R2, R4, R5, R10

**Dependencies:** 无

**Files:**
- Create: `scripts/upstream-sync/generate-batch.sh`
- Create: `scripts/upstream-sync/generate-batch.py`
- Test: `tests/upstream-sync-generate-batch.test.ts`
- Test: `tests/fixtures/upstream-sync/upstream-repo/`
- Test: `tests/fixtures/upstream-sync/expected-batch/`

**Approach:**
- `generate-batch.sh` 只负责参数透传、环境校验和调用 Python 入口；真正的 commit 枚举、patch 导出与 metadata 聚合放在 Python 中
- 批次生成按 upstream commit 时间顺序输出编号，文件名格式固定为 `NNNN-<sanitized-subject>.patch`
- 基线 SHA 从 `.upstream-ref` 读取；upstream 仓库路径按 `--upstream-repo` -> `.upstream-repo` 的优先级解析
- `commit-range.txt` 明确写入 `start_commit`、`end_commit`、`generated_at`、`patch_count` 和 commit 摘要列表，且 `generated_at` 使用实际运行日期

**Patterns to follow:**
- `plugins/galeharness-cli/skills/compound-sync/SKILL.md`
- `.gitignore`
- `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md`

**Test scenarios:**
- Happy path: upstream 比基线多 3 个 commit 时，生成 3 个顺序编号正确的 raw patch，并写出完整 `commit-range.txt`
- Happy path: commit subject 含空格、冒号或特殊字符时，文件名被稳定规整但 manifest 保留原始 subject
- Edge case: 没有新 commit 时，脚本明确返回“无需生成新批次”，且不创建空批次目录
- Error path: `.upstream-ref` 缺失或 SHA 不存在时，脚本返回可操作错误并停止生成
- Error path: upstream 仓库路径未配置或目录无效时，脚本报错并说明应通过参数或 `.upstream-repo` 提供路径
- Integration: 在临时 git 仓库中运行完整生成流程，输出目录结构与 `tests/fixtures/upstream-sync/expected-batch/` 对齐

**Verification:**
- 实现者能在本地用一个临时 upstream 仓库样本稳定重建完整批次，且批次元数据不依赖人工补写

- [ ] **Unit 2: 机械适配流水线与替换规则表**

**Goal:** 将每个 raw patch 机械转换为可直接面向 GaleHarnessCLI 处理的 adapted patch，并把规则收敛到可维护配置中。

**Requirements:** R3, R9

**Dependencies:** Unit 1

**Files:**
- Create: `scripts/upstream-sync/adapt-patch.py`
- Create: `scripts/upstream-sync/rename-rules.json`
- Test: `tests/upstream-sync-adapt-patch.test.ts`
- Test: `tests/fixtures/upstream-sync/sample-patches/`

**Approach:**
- `adapt-patch.py` 按“路径重写 -> 命名空间重写 -> 特例名词替换 -> 输出校验”的顺序处理 patch 文本
- 显式配置文件定义目录前缀和 token 映射，避免把 `ce:`、`compound-engineering`、skill 名称特例硬编码在多处
- 输出 adapted patch 时保留原始 commit subject 与 patch 序号，确保 raw/adapted 可一一对应
- 适配脚本只做机械替换，不推断业务逻辑差异；无法安全替换的内容应在 stdout/stderr 中标出，交由人工适配阶段处理

**Patterns to follow:**
- `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md`
- `plugins/galeharness-cli/skills/compound-sync/SKILL.md`

**Test scenarios:**
- Happy path: raw patch 中的 `plugins/compound-engineering/`、`ce:` 和已知 skill 前缀被正确改写为 GaleHarnessCLI 命名
- Edge case: patch 同时包含文件路径与正文中的命名空间文本时，两类替换都正确发生且不破坏 patch 结构
- Edge case: patch 含二进制文件头或不应替换的上下文文本时，脚本跳过不安全替换并给出提示
- Error path: 规则表缺失或 JSON 非法时，脚本快速失败并指出配置文件问题
- Integration: raw 与 adapted patch 目录按相同文件名一一配对，且 adapted patch 仍可被 `git apply --check` 读取

**Verification:**
- 对同一批 raw patch 重复执行适配能得到稳定、可比较的 adapted 结果，新增映射规则无需修改主流程代码

- [ ] **Unit 3: worktree 安全应用脚本**

**Goal:** 提供以独立 worktree 为默认操作面、安全检查完整且错误信息可执行的 patch 应用脚本。

**Requirements:** R6, R7, R8

**Dependencies:** Unit 2

**Files:**
- Create: `scripts/upstream-sync/apply-patch-to-worktree.sh`
- Test: `tests/upstream-sync-apply-patch.test.ts`
- Test: `tests/fixtures/upstream-sync/sample-patches/`

**Approach:**
- 脚本输入 adapted patch 路径，先解析当前仓库根、当前 worktree 路径和主 worktree 路径，再决定是否发出强警告
- 在真正应用前做显式状态检查：当前目录是否在 Git 仓库中、工作区是否干净、patch 文件是否存在、`git apply --check` 是否通过
- 如果检测到用户位于主 worktree，默认只警告不静默继续；是否允许继续由显式 flag 或确认机制控制，但默认行为必须把独立 worktree 作为推荐路径
- 失败提示按状态机输出：预检失败、工作区脏、主 worktree 风险、patch 冲突，分别给出下一步建议而不是泛化报错

**Patterns to follow:**
- `plugins/galeharness-cli/skills/git-worktree/SKILL.md`
- `plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh`
- `docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md`

**Test scenarios:**
- Happy path: 在独立 worktree 且工作区干净时，`git apply --check` 通过并成功应用 patch
- Edge case: 在主 worktree 中运行时，脚本打印显著警告并要求显式继续，而不是直接修改主工作区
- Edge case: 工作区存在未提交修改或未跟踪文件时，脚本拒绝应用并说明需要先清理或切 worktree
- Error path: `git apply --check` 失败时，脚本输出冲突摘要并建议查看 raw patch、切换新 worktree 或手动适配
- Error path: 传入不存在的 patch 路径时，脚本快速失败并提示批次目录结构预期
- Integration: 使用测试仓库同时验证“主 worktree 警告”和“独立 worktree 成功应用”两条路径，确保状态分支互不混淆

**Verification:**
- 实现者能够在临时 worktree 中安全重放一个 adapted patch；失败时主仓库和主 worktree 不会被无提示污染

- [ ] **Unit 4: 批次 README、流程文档与 compound-sync 集成**

**Goal:** 让批次目录本身就能指导团队协作，并把新流程接入现有 `compound-sync` 文档入口。

**Requirements:** R4, R10, R11

**Dependencies:** Unit 1, Unit 2, Unit 3

**Files:**
- Modify: `plugins/galeharness-cli/skills/compound-sync/SKILL.md`
- Modify: `plugins/galeharness-cli/README.md`
- Test: `tests/upstream-sync-generate-batch.test.ts`
- Test: `tests/fixtures/upstream-sync/expected-batch/`

**Approach:**
- 批次 `README.md` 由生成脚本自动写出，包含：本批次摘要、patch 对照表、建议 worktree 命名、处理状态占位列，以及完整的并发协作流程说明
- `compound-sync` 技能文档更新为“查看基线 -> 生成批次 -> 在独立 worktree 逐 patch 处理 -> 更新 `.upstream-ref`”的结构化流程，而不是仅提示“手工 review diff”
- 插件 README 补充该本地同步工作流的使用入口，避免能力只存在于内部脚本但没有面向维护者的发现路径
- README 中明确区分 raw patch 的溯源用途与 adapted patch 的应用用途，减少误用

**Patterns to follow:**
- `plugins/galeharness-cli/skills/compound-sync/SKILL.md`
- `plugins/galeharness-cli/README.md`

**Test scenarios:**
- Happy path: 生成批次时 README 自动包含 patch 表格、起止 commit、生成日期和 worktree 协作步骤
- Edge case: patch 数量为 1 时，README 仍生成完整说明，不因表格退化而丢失流程步骤
- Error path: 批次生成部分失败时，README 明确标注未完成状态，而不是伪装成成功批次
- Integration: 文档更新后，维护者仅阅读 `compound-sync` skill 与批次 README 即可完成一次从生成到 worktree 处理的闭环演练

**Verification:**
- 新维护者不阅读历史聊天记录，只靠仓库文档和批次目录就能理解如何逐 commit 同步 upstream

## System-Wide Impact

- **Interaction graph:** 新流程连接 `.upstream-ref`、`.upstream-repo`、本地 upstream checkout、`.context/galeharness-cli/upstream-sync/` 与 git worktree；它不改变产品运行时代码，但会影响维护者的同步日常路径
- **Error propagation:** 生成批次时应在 raw 导出、adapted 生成、README/manifest 写入之间保持清晰失败边界；某个 commit 失败不能默默污染后续批次状态
- **State lifecycle risks:** 重复运行同日批次、`.upstream-ref` 漂移、映射规则过期，以及在错误 worktree 上执行 apply 都是主要状态风险
- **API surface parity:** 这套流程首先以脚本与 skill 文档交付；若未来升级为 CLI 命令，参数语义应与当前脚本保持兼容
- **Integration coverage:** 单元测试不足以证明真实 Git 行为，必须用临时仓库 + worktree 的集成测试覆盖 patch 导出与应用路径
- **Unchanged invariants:** 本计划不改变 `gh:` 技能行为、不自动写回 `.upstream-ref`、不自动合并 patch 后代码，也不替代 PR review

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| upstream force-push 让旧 SHA 不再可达 | 批次内同时保留 commit subject、生成日期与 raw patch，降低单纯依赖 SHA 的脆弱性 |
| 映射规则不足导致 adapted patch 仍需大量手工清洗 | 用显式规则表和测试夹具覆盖已知命名差异，并把“无法机械适配”的内容标注出来 |
| 在主 worktree 误应用 patch 污染当前工作区 | `apply-patch-to-worktree.sh` 默认发出强警告，且先做工作区与预检状态检查 |
| bash 入口在 macOS 默认环境下难以维护 | 让 shell 入口保持薄包装，复杂流程放进 Python，避免 bash 3.2 的可移植性问题 |
| `.context/` 批次目录被手工修改后失真 | README 与 `commit-range.txt` 都由生成脚本写入；实现阶段应尽量让状态文件可重建而非依赖人工维护 |

## Documentation / Operational Notes

- 该工作流依赖本地存在一个 upstream checkout，因此 `scripts/upstream-sync/` 的帮助信息必须明确写出 `.upstream-repo` 或参数配置方式
- 生成批次后，真正“完成同步”的时点仍应由维护者在 patch 处理完并验证通过后手动更新 `.upstream-ref`
- `plugins/galeharness-cli/README.md` 的更新应聚焦维护者工作流，不应把本地-only 细节包装成最终用户功能

## Sources & References

- **Origin document:** `docs/brainstorms/2026-04-21-upstream-sync-per-commit-patch-workflow-requirements.md`
- Related code: `plugins/galeharness-cli/skills/compound-sync/SKILL.md`
- Related code: `plugins/galeharness-cli/skills/git-worktree/SKILL.md`
- Related code: `plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh`
- Related guidance: `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md`
- Related guidance: `docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines-2026-03-27.md`
