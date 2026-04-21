---
date: 2026-04-21
topic: upstream-sync-per-commit-patch-workflow
---

# Upstream 逐 Commit Patch 同步与工作流

## Problem Frame

当前 GaleHarnessCLI 与上游 compound-engineering 的同步方式为：生成一个巨大的 diff patch（如 `2026-04-17-first-commit_to_latest.patch`，大小 1.2MB），然后手动适配并一次性合并到工程。这种方式存在以下问题：

- **Review 困难**：单个大 patch 包含多个 commit 的混合变更，难以逐条审视和讨论
- **测试粒度粗**：无法针对单个 commit 的变更运行隔离测试，问题定位成本高
- **协作串行化**：整个 patch 只能由一个人处理，团队无法并行分工
- **回滚风险高**：一旦某个 commit 的变更有问题，需要整体回滚或手动拆分
- **SHA 易失效**：上游 force-push 后旧 commit SHA 失效，历史同步记录失去可追溯性

团队需要一个**结构化、可并行、可追踪**的同步机制，让多名研发能在独立工作区中各自处理单个 commit 的适配，独立测试验收后再合入主干。

## Requirements

**Patch 生成与拆分**
- R1. 从上游 compound-engineering 仓库按 commit 粒度生成独立的 patch 文件，每个 patch 对应一个 upstream commit
- R2. 每个 patch 文件名需包含 commit 顺序序号和主题摘要（如 `0001-fix-gh-plan-...patch`）
- R3. 生成两种版本的 patch：
  - `raw/`：原始 upstream 版本（保留 `ce:` 前缀和 `plugins/compound-engineering/` 路径）
  - `adapted/`：机械适配后的 GaleHarnessCLI 版本（`gh:` 前缀、`plugins/galeharness-cli/` 路径）

**批次管理与追溯**
- R4. 按日期（如 `2026-04-21/`）组织 patch 批次目录，包含：
  - `commit-range.txt`：记录本次同步的起止 commit SHA、日期、主题、patch 数量
  - `README.md`：说明本批次内容、同步状态、已同步的对应 commit
- R5. `commit-range.txt` 的截止时间需使用当前实际日期（如 `2026-04-21`），即使上游 commit 日期较早

**Git Worktree 并发协作**
- R6. 提供 `apply-patch-to-worktree.sh` 脚本，支持在独立 git worktree 中安全应用单个 adapted patch
- R7. 脚本在应用前执行 `git apply --check` 预检，失败时给出清晰的冲突原因和下一步建议
- R8. 脚本需检测是否在主 worktree 中运行，并给出警告提示，鼓励使用独立 worktree

**自动化与可复用**
- R9. 提供 `adapt-patch.py` 脚本，自动将 raw patch 转换为 adapted patch（路径替换 + 前缀替换）
- R10. 提供 `generate-batch.sh` 脚本，一键从上游仓库读取上次同步的 end_commit，自动生成新的完整批次（raw + adapted + commit-range.txt）

**流程文档化**
- R11. 每个批次目录的 README.md 需包含完整的 Git Worktree 并发协作流程说明：
  - 主仓库创建基线分支
  - 为每个 patch 创建独立 worktree
  - worktree 内开发、测试、commit
  - 回到主仓库发 PR 合并

## Success Criteria

- 上游新增 3 个 commit 时，能在 5 分钟内生成 3 个独立的 adapted patch 和完整的批次目录
- 2 名研发可以同时在独立 worktree 中处理不同的 patch，互不干扰
- 单个 patch 应用失败时，研发能在不污染主仓库的情况下快速定位冲突原因
- 历史同步批次可追溯：通过 `commit-range.txt` 能准确还原某次同步对应的上游 commit 范围

## Scope Boundaries

- **不在本范围内**：patch 内容的人工业务逻辑适配（如技能行为变更、测试用例调整）——这属于各 worktree 内的研发任务
- **不在本范围内**：patch 应用后的代码审查标准——遵循现有 PR review 流程
- **不在本范围内**：与上游的自动定时同步（CI/CD）——本需求仅解决 patch 生成与协作流程

## Key Decisions

- **按 commit 拆分而非按文件拆分**：commit 是上游的语义单元，保留了作者意图和变更上下文，比按文件拆分更利于理解
- **保留 raw + adapted 双版本**：raw 用于与 upstream 对比溯源，adapted 用于直接应用到 GaleHarnessCLI
- **使用 git worktree 而非分支切换**：worktree 提供独立的文件系统工作区，避免切换分支带来的缓存/依赖污染，真正实现并行
- **批次目录不提交到 git**：`.context/` 已被 `.gitignore` 忽略，批次文件作为本地工作流状态存在，不影响主干历史

## Dependencies / Assumptions

- 上游仓库本地路径：`/Users/wangrenzhu/work/compound-engineering-plugin`
- 适配规则以当前的 `ce:` -> `gh:`、`compound-engineering` -> `galeharness-cli` 为主，未来如有新命名规则需更新 `adapt-patch.py`
- 研发已安装 `git` 并支持 `git worktree` 命令（Git 2.5+）

## Outstanding Questions

### Resolve Before Planning
- （无阻塞问题）

### Deferred to Planning
- [Affects R9][Technical] `adapt-patch.py` 是否需处理更复杂的替换场景（如 `ce-demo-reel` -> `gh-demo-reel` 已支持，但未来新增技能名是否需要动态配置？）
- [Affects R6][Technical] `apply-patch-to-worktree.sh` 在 patch 冲突时，是否需提供 `--3way` 自动回退策略？

## Next Steps

-> `/gh:plan` 进行结构化实施规划
