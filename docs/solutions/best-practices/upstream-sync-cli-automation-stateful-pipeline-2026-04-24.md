---
title: "Upstream Sync CLI 自动化：有状态 Pipeline 的设计与实现"
date: 2026-04-24
category: best-practices
module: upstream-sync
problem_type: best_practice
component: tooling
severity: medium
applies_when:
  - 需要将上游仓库的逐 commit 变更同步到 fork/下游仓库
  - 手动逐 patch 同步流程效率低且容易出错
  - 需要在多步骤 pipeline 中支持失败恢复和断点续传
tags:
  - upstream-sync
  - cli-automation
  - state-machine
  - pipeline
  - python
  - git-worktree
---

# Upstream Sync CLI 自动化：有状态 Pipeline 的设计与实现

## Context

GaleHarnessCodingCLI 从上游 compound-engineering-plugin 仓库同步变更，采用逐 commit patch 方式保持历史线性。原有流程依赖 `generate-batch.py` 生成 patch 后手动逐个应用，涉及 worktree 创建、patch 应用、测试、提交、推送、PR 创建等多个步骤。手动操作容易遗漏步骤、丢失状态，且无法从失败中恢复。

本次实现了 `sync-cli.py` 作为半自动化 CLI，通过 `state.json` 持久化工作流状态，将整个流程编排为可中断、可恢复的状态机。

## Guidance

### 1. 状态机驱动的 Pipeline 设计

核心设计是将同步流程建模为显式状态机：

```
uninitialized → idle → in_progress → awaiting_human_review → idle → ... → complete
                                    ↘ failed → (resume) → in_progress
```

每个子命令只负责一次状态转移：
- `init`: uninitialized → idle
- `next`: idle → in_progress → awaiting_human_review（或 failed）
- `resume`: awaiting_human_review → idle/complete（或 failed → in_progress）
- `skip`: any → idle/complete

**关键决策：resume 不自动触发 next。** merged 后只推进指针和清理，回到 idle 等待用户显式 `next`。这避免了自动化失控——每个 commit 的副作用（worktree、push、PR）都需要人类显式触发。

### 2. 原子状态写入

```python
def save_state(state: SyncState, state_path: Path):
    tmp = state_path.with_suffix(".tmp")
    tmp.write_text(json.dumps(asdict(state), indent=2, ensure_ascii=False))
    tmp.rename(state_path)  # 原子操作
```

每个 pipeline 阶段成功后立即写 state，防止：
- 重复 push（push 成功后立即记录，resume 时不会重新 push）
- 重复创建 PR（pr_create 成功后立即记录 pr_url/pr_number）
- 状态丢失导致的盲目重试

### 3. 安全的外部命令执行

```python
def run_cmd(argv: List[str], cwd: Path, *, dry_run=False, redact_patterns=None):
    # argv 数组，shell=False
    # cwd 必须 resolve + 存在性检查
    # stdout/stderr 截断（500 字进入 state）
    # 脱敏：GH_TOKEN、Authorization、basic-auth URL
```

安全原则：
- **永远不拼接 shell 字符串** — 使用 argv 数组 + `shell=False`
- **显式 verified cwd** — resolve 后检查存在性
- **日志脱敏** — 敏感信息不进入 state.json
- **gh 调用显式 --repo** — 防止环境变量或当前目录影响目标仓库

### 4. GitHub 目标验真

`resume` 在处理 merged PR 时：
1. 校验 PR headRefName/baseRefName 与 state 一致
2. 用 `git merge-base --is-ancestor` 对账 upstream SHA
3. 仅对账通过后才写 `.upstream-ref`

`skip --force-cleanup` 不只信 state：
1. 通过 `git worktree list` 重新验证 worktree 存在
2. 验证分支名匹配 `upstream-sync-*` 命名族
3. 验证分支非默认分支

### 5. Main Worktree Root 解析

通过 `git worktree list --porcelain` 解析 main worktree root，支持从 linked worktree 执行 status/resume/skip。state.json 始终位于 main worktree 下的固定路径。

## Why This Matters

- **可恢复性**：任何步骤失败都记录 `failed_at`，resume 从失败点重试而非从头开始
- **安全性**：显式状态机 + 原子写入 + 命令安全执行 + GitHub 目标验真，防止副作用失控
- **可审计性**：operations 日志记录每次操作的时间戳和摘要，state.json 是完整的工作流快照
- **人机协作**：CLI 负责机械操作（worktree/patch/push/PR），人类负责审查决策（merge/skip），通过 awaiting_human_review 状态显式交接

## When to Apply

- 需要将多步骤、有副作用的工作流编排为可中断可恢复的 pipeline 时
- 涉及 git worktree、远程 push、PR 创建等不可逆操作时
- 需要在失败后从断点恢复而非从头重试时
- 需要人机交替参与的半自动化工作流时

## Examples

### 完整工作流示例

```bash
# 1. 初始化批次
python3 scripts/upstream-sync/sync-cli.py init

# 2. 查看队列
python3 scripts/upstream-sync/sync-cli.py status

# 3. 处理第一个 commit
python3 scripts/upstream-sync/sync-cli.py next
# → 创建 worktree、应用 patch、测试、提交、推送、创建 PR
# → 输出 PR 链接，暂停等待审查

# 4. PR merged 后恢复
python3 scripts/upstream-sync/sync-cli.py resume
# → 检测 merged、写 .upstream-ref、清理 worktree
# → 回到 idle，提示执行 next（不自动继续）

# 5. 跳过有问题的 commit
python3 scripts/upstream-sync/sync-cli.py skip --reason "patch 冲突需手动处理"

# 6. 强制清理并跳过
python3 scripts/upstream-sync/sync-cli.py skip --force-cleanup --reason "PR 被关闭"
```

### 失败恢复示例

```bash
# next 在 test 阶段失败
python3 scripts/upstream-sync/sync-cli.py next
# → failed_at: test

# 手动修复代码后，resume 从 test 阶段重试
python3 scripts/upstream-sync/sync-cli.py resume
# → 从 test 阶段重新执行，继续 commit → push → pr_create
```

## Related

- `scripts/upstream-sync/generate-batch.py` — patch 批次生成（sync-cli.py init 调用）
- `scripts/upstream-sync/adapt-patch.py` — patch 命名空间适配
- `scripts/upstream-sync/apply-patch-to-worktree.sh` — 原有手动 patch 应用脚本
- `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md` — pipeline 脚本选择 Python 的决策
- `docs/plans/2026-04-24-001-feat-upstream-sync-cli-automation-plan.md` — 完整计划文档
