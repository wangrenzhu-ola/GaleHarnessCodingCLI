---
title: "GaleHarnessCLI agent references need a source-level namespace contract"
date: 2026-04-25
category: developer-experience
module: galeharness-cli
problem_type: developer_experience
component: testing_framework
severity: medium
applies_when:
  - "技能文档会调度同一插件内的 agents"
  - "项目说明、真实目录结构和 converter 行为对引用格式产生漂移"
  - "文档中的 agent 引用需要在发布前被测试约束"
tags:
  - agent-references
  - contract-tests
  - galeharness-cli
  - skills
  - developer-experience
---

# GaleHarnessCLI agent references need a source-level namespace contract

## Context

GaleHarnessCLI 的技能文档会通过 `galeharness-cli:*` 引用插件内置 agents。问题是项目说明一度要求三段 `galeharness-cli:<category>:<agent-name>`，但真实源码结构是扁平的：agents 位于 `plugins/galeharness-cli/agents/*.md`，converter 和现有内容也围绕二段 `galeharness-cli:<agent-name>` 工作。

这类漂移不能只靠一次性 grep 修正。维护者会继续从 `AGENTS.md`、插件说明或 reviewer agent 的检查清单里学习当前规范；如果规范与运行时可解析结构不一致，错误引用会在技能执行或目标平台转换后才暴露。

## Guidance

把当前标准明确为二段插件命名空间：

```text
galeharness-cli:<agent-name>
```

其中 `<agent-name>` 必须对应 `plugins/galeharness-cli/agents/<agent-name>.md` 的真实 agent 名。三段 `galeharness-cli:<category>:<agent-name>` 不作为当前 GaleHarnessCLI 源文档标准，因为仓库没有分类 agent 目录，也没有 category-aware resolver 语义。

用源级 contract test 固化这个规则，而不是改 converter 或迁移目录结构。测试应扫描会承载维护规范或调度示例的 Markdown：

- `AGENTS.md`
- `plugins/galeharness-cli/AGENTS.md`
- `plugins/galeharness-cli/skills/**/*.md`，包括 `references/*.md`
- `plugins/galeharness-cli/agents/**/*.md`

测试逻辑需要先从真实文件系统构建 agent 集合和 skill 集合，再分类 `galeharness-cli:*` token：

- 二段真实 agent 引用通过。
- 三段且末段是真实 agent 的引用失败，并建议改成二段。
- 未知二段引用失败，并提示必须指向真实 agent 或真实 skill。
- slash command 形式如 `/galeharness-cli:...` 不作为 agent dispatch 失败。
- 真实 skill 引用不误报为 agent 失败。

本轮落地为 `tests/agent-reference-contract.test.ts`，并同步更新了根 `AGENTS.md`、`plugins/galeharness-cli/AGENTS.md` 和 `plugins/galeharness-cli/agents/project-standards-reviewer.md` 中的过时说明或示例。

## Why This Matters

agent 引用格式是技能文档、项目标准、converter 和目标平台执行之间的接口。只改说明文档无法防止后续新增技能再次引入三段示例；只改 converter 又会把一个文档规范问题扩大成运行时 resolver 重构。

contract test 把失败前移到 PR 阶段，并给维护者具体文件、引用文本、失败原因和推荐修正形态。这样新技能或 reviewer 文档一旦写入不可解析的 agent 引用，就会在 `bun test` 中直接失败。

## When to Apply

- 插件内技能需要调度同一插件的 agents。
- agent 文件结构是扁平目录，但文档出现了 category 命名空间。
- converter 对引用格式有兼容行为，但源文档需要更严格的 authoring contract。
- 规范文本本身也需要被测试覆盖，避免 reviewer 或 AGENTS 指令继续传播旧标准。

## Examples

当前正确引用：

```markdown
Dispatch `galeharness-cli:learnings-researcher` to search prior solutions.
```

当前应失败的三段引用：

```markdown
Dispatch `galeharness-cli:research:learnings-researcher`.
```

测试失败时应推荐：

```text
Use galeharness-cli:learnings-researcher.
```

真实 skill 引用和 slash command 不是 agent dispatch 错误：

```markdown
/galeharness-cli:agent-native-architecture
galeharness-cli:gh:plan
```

## Validation

本轮验证过：

- `bun test tests/agent-reference-contract.test.ts`：4 pass
- `bun run release:validate`：通过
- `bun test`：在执行 `bun install --frozen-lockfile` 后通过，1246 pass，3 skip，0 fail

收尾提交前仍应至少重跑 targeted contract test 和 `bun run release:validate`，确认新增 compound 文档和最终 diff 没有引入副作用。

## Future Extension

如果未来确实要支持三段 `galeharness-cli:<category>:<agent-name>`，不要只放宽测试。应先补齐这些前置条件：

- agent 源目录、frontmatter 或 manifest 中有稳定 category 语义。
- 技能执行端和 converter 都知道 category 是否参与解析，还是仅用于作者分组。
- 目标平台输出中同名不同 category agent 的冲突策略明确。
- contract test 更新为新的真实标准，并覆盖二段兼容策略或迁移失败提示。

在这些语义补齐前，三段引用会制造一种看似更精确、实际不可解析的规范。

## Related

- `docs/brainstorms/2026-04-25-agent-reference-lint-requirements.md`
- `docs/plans/2026-04-25-002-fix-agent-reference-lint-plan.md`
- `tests/agent-reference-contract.test.ts`
