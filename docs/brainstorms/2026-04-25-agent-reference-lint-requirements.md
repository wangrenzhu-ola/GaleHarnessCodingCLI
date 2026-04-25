---
date: 2026-04-25
topic: agent-reference-lint
---

# Agent Reference Lint

## Problem Frame

GaleHarnessCLI 技能文档会调度插件内置 agents。根 `AGENTS.md` 当前要求 agent 引用使用 `galeharness-cli:<category>:<agent-name>`，但仓库真实结构和 converter 行为已经围绕扁平 agent 名称工作：`plugins/galeharness-cli/agents` 下的 agent 文件是扁平的，converter 测试也覆盖了二段 `galeharness-cli:<agent-name>` 被转换成目标平台可解析的本地 agent 名。

这种“规范与实际内容不一致”会让维护者误判应该修三段引用还是二段引用，也会让技能文档里新增的 agent dispatch 逃过约束。需要一个小而闭环的 lint/contract test，把当前真实标准固化下来，并同步修正过时规范。

---

## Actors

- A1. 技能维护者：修改 `plugins/galeharness-cli/skills/**` 和 agent 文档时，需要知道哪种 agent 引用形态是有效的。
- A2. Converter 维护者：维护 `src/converters/**` 和目标平台 writer 时，需要确保技能文档引用不会破坏转换后的 agent dispatch。
- A3. 下游执行 agent：运行技能文档中的调度说明时，需要获得可解析、无歧义的 agent 名称。

---

## Key Flows

- F1. 维护者新增或修改技能文档中的 agent 调度引用
  - **Trigger:** 技能文档出现新的 `galeharness-cli:*` agent 引用。
  - **Actors:** A1, A2
  - **Steps:** 维护者编辑技能文档；测试扫描技能文档和 agent 文档中的插件内 agent 引用；测试确认每个引用匹配允许形态并指向真实 agent 或真实 skill。
  - **Outcome:** 错误引用在 PR 测试阶段失败，而不是发布后才被某个平台调度失败暴露。
  - **Covered by:** R1, R2, R3, R5

- F2. 维护者查阅项目规范
  - **Trigger:** 维护者阅读 `AGENTS.md` 或 `plugins/galeharness-cli/AGENTS.md` 决定引用格式。
  - **Actors:** A1
  - **Steps:** 维护者看到与当前仓库结构一致的规则；规则说明 agent 引用使用二段 `galeharness-cli:<agent-name>`；规则区分 skill 引用、slash command 和非 agent colon 字符串。
  - **Outcome:** 新文档按真实标准书写，避免继续引入三段示例或不存在的 category。
  - **Covered by:** R1, R4

---

## Requirements

**Reference standard**
- R1. GaleHarnessCLI 技能文档中的插件内 agent 引用标准应明确为二段 `galeharness-cli:<agent-name>`，其中 `<agent-name>` 必须对应 `plugins/galeharness-cli/agents/<agent-name>.md` 的真实 agent 名。
- R2. 三段 `galeharness-cli:<category>:<agent-name>` 不应作为当前 GaleHarnessCLI 技能文档的标准，因为当前 agent 文件和 converter 处理都不保留 category 作为可解析命名空间。
- R3. lint/contract test 应扫描 `AGENTS.md`、`plugins/galeharness-cli/AGENTS.md`、`plugins/galeharness-cli/skills/**`、`plugins/galeharness-cli/agents/**` 中的 `galeharness-cli:*` 引用，并区分 agent 引用、skill 引用、slash command、路径或普通 prose。

**Documentation alignment**
- R4. 根 `AGENTS.md` 和 `plugins/galeharness-cli/AGENTS.md` 中与 agent 分类目录或三段引用相矛盾的说明应改成当前真实标准；如果仍保留历史说明，必须明确它不是当前可执行规范。

**Validation behavior**
- R5. 测试失败信息应指出具体文件、引用文本、失败原因，以及可用的正确形态，便于维护者直接修正文档。
- R6. 测试不应要求大型 agent resolver 重构，也不应改变 converter 的现有扁平化行为。

---

## Acceptance Examples

- AE1. **Covers R1, R5.** Given 技能文档包含 `galeharness-cli:repo-research-analyst`，when 运行 contract test，then 测试通过，因为 `plugins/galeharness-cli/agents/repo-research-analyst.md` 存在。
- AE2. **Covers R2, R4, R5.** Given 文档包含 `galeharness-cli:research:learnings-researcher` 作为当前 agent 引用规范，when 运行 contract test，then 测试失败并提示当前标准是 `galeharness-cli:learnings-researcher`。
- AE3. **Covers R3, R6.** Given 文档包含 `/galeharness-cli:agent-native-architecture` 或 `galeharness-cli:gh-plan` 这类非 agent 引用，when 运行 contract test，then 测试不会把它们误判为 agent dispatch 错误。

---

## Success Criteria

- `bun test` 能覆盖 GaleHarnessCLI agent reference contract，新增错误引用会稳定失败。
- 维护者阅读项目说明后能明确知道当前最终标准是二段 `galeharness-cli:<agent-name>`，不是三段 category 命名空间。
- 计划阶段无需重新决定是否重构 agent 目录、resolver 或 converter；本轮范围保持为文档标准对齐和测试约束。

---

## Scope Boundaries

- 不做大型 agent resolver 重构。
- 不把 `plugins/galeharness-cli/agents` 迁移成分类目录。
- 不改变 converter 对二段或三段引用的目标平台扁平化策略，除非测试暴露当前行为与文档标准冲突且需要最小修正。
- 不处理其他插件的 agent 引用规则；本轮只约束 GaleHarnessCLI 自己的技能和 agent 文档。
- 不提交、推送或开 PR。

---

## Key Decisions

- 最终标准采用二段 `galeharness-cli:<agent-name>`：这是当前仓库 agent 文件结构、converter 注释和现有测试共同支持的真实标准。三段标准需要分类目录或 resolver 语义配套，否则只会把不可解析规范写进文档。
- 用 contract test 固化标准，而不是只做一次性 grep 修文档：问题本质是规范漂移，测试能防止后续技能继续引入错误形态。
- 扫描范围包括根说明、插件说明、skills 和 agents：根说明是当前矛盾来源之一，agent 文档也可能给出示例或检查标准。

---

## Dependencies / Assumptions

- 当前 `plugins/galeharness-cli/agents` 是扁平文件目录，未发现分类子目录。
- 当前 converter 目标会把 agent 引用转换成目标平台本地可解析的扁平 agent 名。
- `galeharness-cli:<skill-name>` 和 slash command 可能合法存在，lint 需要通过真实 agent 列表和技能列表避免误报。

---

## Outstanding Questions

### Deferred to Planning

- [Affects R3][Technical] 测试应放在现有哪个 test 文件，还是新增专门的 contract test 文件？
- [Affects R3, R5][Technical] 扫描规则应使用现有 parser/frontmatter 工具，还是简单文件读取加正则就足够？

---

## Next Steps

-> `/gh:plan` for structured implementation planning
