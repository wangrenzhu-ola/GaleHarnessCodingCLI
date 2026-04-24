---
title: Karpathy guidelines should become phase-specific workflow guardrails
date: 2026-04-24
category: workflow-issues
module: GaleHarnessCLI workflow skills
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - Integrating external agent guidelines into existing workflow skills
  - Hardening brainstorm, plan, work, or review behavior against vague LLM drift
  - Translating a reference skill repository into product behavior
tags: [karpathy-guidelines, workflow-guardrails, skill-design, brainstorm, plan, review]
---

# Karpathy guidelines should become phase-specific workflow guardrails

## Context
这次需求要把 `andrej-karpathy-skills` 里的 Claude 风格 guidelines 融入 GaleHarnessCLI。关键判断不是“把外部仓库 vendored 进来”，也不是创建一个新的独立 skill，而是把其中有用的行为约束翻译到现有工作流阶段里。

原版参考地址需要保留在需求和计划里，方便后续执行时回到原文校准：

- <https://github.com/forrestchang/andrej-karpathy-skills/blob/main/README.md>
- <https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md>
- <https://github.com/forrestchang/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md>
- <https://github.com/forrestchang/andrej-karpathy-skills/blob/main/EXAMPLES.md>

## Guidance
把外部 agent guidelines 融入本项目时，优先做成分阶段 guardrails：

- `gh:brainstorm` 约束需求捕获：先挑战问题 framing，区分已确认意图、假设、非目标、成功标准和开放问题。
- `gh:plan` 约束计划质量：复杂度必须能从需求或源码事实中证明，未知项要分类为 blocker、assumption、deferred technical question 或 implementation-time unknown。
- `gh:work` / `gh:work-beta` 约束执行范围：非平凡任务先写轻量 execution contract，变更行必须能追溯到请求、计划、contract 或验证标准。
- `gh:review` 约束审查视角：先固定意图摘要，再把 speculative abstraction、drive-by cleanup、计划边界漂移作为 diff-hygiene 问题识别。

实现上应修改现有 workflow skills 和 reviewer personas，并用 contract tests 锁住关键词和行为锚点。这样 guidelines 会在真正决策发生的位置约束 LLM，而不是停留在一个需要手动记得调用的参考 skill。

## Why This Matters
Brainstorm 和 plan 阶段最容易把 LLM 的猜测写成需求，把顺手想到的方案写成范围。等到 `gh:work` 执行时再约束，通常已经太晚：计划文档会把未确认假设合法化，后续 agent 会沿着错误边界继续执行。

把 Karpathy 风格的原则拆进每个阶段，可以让约束在信息被固化之前生效。需求阶段防止问题定义漂移，计划阶段防止复杂度膨胀，执行阶段防止顺手重构，review 阶段防止只看 bug 而忽略 diff hygiene。

## When to Apply
- 外部 guideline、CLAUDE.md、agent rulebook 对现有工作流有启发，但不应该成为独立运行入口时。
- 需求涉及多个 `gh:` workflow skill，而不是单个命令行为时。
- 目标是改变默认 agent 行为，而不是增加一份可选参考文档时。
- 用户明确要求后续计划和执行持续参考原始 markdown，避免语义跑偏时。

## Examples
不推荐的做法：

```text
新增 gh:karpathy-guidelines skill，让用户需要时手动调用。
```

这种做法的问题是约束不会自动进入 brainstorm、plan、work、review 的关键路径。

推荐的做法：

```text
在 requirements doc 中贴原版 markdown 地址；
在 gh:brainstorm 中加入需求/假设/非目标分离；
在 gh:plan 中加入复杂度证明和未知项分类；
在 gh:work 中加入 execution contract 和 surgical-change 规则；
在 gh:review 与 reviewer personas 中加入 diff-hygiene 分类；
用测试锁住这些行为锚点。
```

这次实现对应的 PR 是 <https://github.com/wangrenzhu-ola/GaleHarnessCodingCLI/pull/66>，提交为 `a277942 feat(workflow): integrate Karpathy guardrails`。

## Related
- `docs/brainstorms/2026-04-24-karpathy-guidelines-integration-requirements.md`
- `docs/plans/2026-04-24-003-feat-karpathy-workflow-guardrails-plan.md`
- `plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md`
- `plugins/galeharness-cli/skills/gh-plan/SKILL.md`
- `plugins/galeharness-cli/skills/gh-work/SKILL.md`
- `plugins/galeharness-cli/skills/gh-review/SKILL.md`
