---
title: fix: Add GaleHarnessCLI agent reference lint
type: fix
status: active
date: 2026-04-25
origin: docs/brainstorms/2026-04-25-agent-reference-lint-requirements.md
---

# fix: Add GaleHarnessCLI agent reference lint

## Overview

本计划把 GaleHarnessCLI 内部 agent 引用标准固化为可测试 contract：当前最终标准是二段 `galeharness-cli:<agent-name>`，其中 `<agent-name>` 对应 `plugins/galeharness-cli/agents/<agent-name>.md` 的真实 agent。三段 `galeharness-cli:<category>:<agent-name>` 是当前文档规范漂移，不作为本轮目标标准。

实现范围保持小闭环：新增一个 contract test 扫描项目说明、技能文档和 agent 文档中的 `galeharness-cli:*` 引用；修正根说明、插件说明和现有三段示例；不做 agent resolver、目录结构或 converter 行为重构。

---

## Problem Frame

需求文档指出，根 `AGENTS.md` 要求三段 agent 引用，但仓库实际 agent 文件是扁平结构，converter 也会把二段或三段引用压平成目标平台本地 agent 名。继续保留三段规范会让维护者把不可解析的 category 语义写进技能文档，且没有测试防止漂移继续发生。计划以需求文档为源，修复“规范与实际内容不一致”的问题。(see origin: `docs/brainstorms/2026-04-25-agent-reference-lint-requirements.md`)

---

## Requirements Trace

- R1. GaleHarnessCLI 技能文档中的插件内 agent 引用标准是二段 `galeharness-cli:<agent-name>`。
- R2. 三段 `galeharness-cli:<category>:<agent-name>` 不作为当前标准。
- R3. contract test 扫描 `AGENTS.md`、`plugins/galeharness-cli/AGENTS.md`、`plugins/galeharness-cli/skills/**`、`plugins/galeharness-cli/agents/**`，并区分 agent、skill、slash command 和普通 prose。
- R4. 根 `AGENTS.md` 和 `plugins/galeharness-cli/AGENTS.md` 中过时的分类目录或三段规范要对齐当前真实标准。
- R5. 测试失败信息要给出文件、引用文本、失败原因和推荐修正形态。
- R6. 不做大型 resolver 重构，不改变 converter 现有扁平化行为。

**Origin actors:** A1 技能维护者, A2 Converter 维护者, A3 下游执行 agent
**Origin flows:** F1 新增或修改技能文档中的 agent 调度引用, F2 查阅项目规范
**Origin acceptance examples:** AE1 二段真实 agent 引用通过, AE2 三段 agent 引用失败并建议二段, AE3 非 agent 引用不误报

---

## Scope Boundaries

- 不迁移 `plugins/galeharness-cli/agents` 到分类目录。
- 不修改 agent dispatch resolver 或目标平台 writer 的转换策略。
- 不要求其他插件采用 GaleHarnessCLI 的引用标准。
- 不改 release-owned 版本、release notes 或 marketplace manifest。
- 不在本阶段实现、提交、推送或开 PR。

---

## Context & Research

### Relevant Code and Patterns

- `plugins/galeharness-cli/agents/*.md`：当前 agent 源文件是扁平目录，frontmatter `name` 也是扁平名称。
- `src/parsers/claude.ts`：Claude plugin parser 递归收集 agent Markdown 文件，并以 frontmatter `name` 或文件 basename 作为 agent 名。
- `src/converters/claude-to-opencode.ts`：现有注释和实现会把三段和二段 agent 引用压平成目标平台本地 agent 名，并避免误改 skill 引用。
- `tests/pipeline-review-contract.test.ts`、`tests/review-skill-contract.test.ts`：现有 contract tests 使用 repo-relative 文件读取和 `bun:test`，适合新增同类文档约束测试。
- `tests/frontmatter.test.ts`：已有递归遍历 Markdown/frontmatter 的简单本地工具模式，可复用思路但不需要抽共享 helper。

### Institutional Learnings

- HKTMemory 检索没有返回直接相关的 agent reference lint 方案；返回内容主要是 Windows、platform capability manifest、Karpathy guardrails 等相邻主题。
- `docs/solutions/integrations/colon-namespaced-names-break-windows-paths-2026-03-26.md` 是相邻风险提醒：colon 命名空间跨平台有历史坑，当前计划只扫描 Markdown 文本，不新增路径命名空间。

### External References

- 未使用外部研究。该变更是仓库内部 contract/test 与文档标准对齐，外部资料不会改变标准选择。

---

## Key Technical Decisions

- 最终标准选择二段 `galeharness-cli:<agent-name>`：这是当前 agent 文件结构、converter 注释和现有测试支持的真实标准，能保留插件命名空间并避免引入不存在的 category 语义。
- 新增专门的 `tests/agent-reference-contract.test.ts`，而不是塞进 converter test：该测试约束的是源文档 contract，不是某个目标转换器行为。
- 扫描用文件系统读取和正则分类即可：需要检查 Markdown 文本里的引用形态，不需要解析完整 Markdown AST。分类必须由真实 agent 名集合和真实 skill 名集合驱动，避免误报 `galeharness-cli:gh-plan` 这类 skill 引用。

---

## Open Questions

### Resolved During Planning

- 测试位置：新增 `tests/agent-reference-contract.test.ts`，保持职责清晰。
- 扫描规则：使用简单文件读取、递归遍历和正则提取 `galeharness-cli:*` token；用 agent/skill 集合判断 token 语义，避免过度工程。

### Deferred to Implementation

- 具体错误消息格式：实现时可按 `bun:test` 的断言输出调整，但必须包含文件、引用文本、原因和推荐形态。
- 是否需要修正额外引用：以 contract test 首次失败列表为准，除已知的 `AGENTS.md`、`plugins/galeharness-cli/AGENTS.md` 和 `plugins/galeharness-cli/agents/project-standards-reviewer.md` 外，不预先枚举所有可能文本改动。

---

## Implementation Units

- [ ] U1. **Add agent reference contract test**

**Goal:** 新增测试扫描 GaleHarnessCLI 源文档中的 agent 引用，禁止当前标准之外的三段 agent 引用和未知二段 agent 引用。

**Requirements:** R1, R2, R3, R5, R6; covers F1; covers AE1, AE2, AE3

**Dependencies:** None

**Files:**
- Create: `tests/agent-reference-contract.test.ts`
- Read patterns: `plugins/galeharness-cli/agents/**/*.md`, `plugins/galeharness-cli/skills/**/*.md`, `AGENTS.md`, `plugins/galeharness-cli/AGENTS.md`

**Approach:**
- Build an allowed agent set from `plugins/galeharness-cli/agents/**/*.md`, using frontmatter `name` when present and filename basename as fallback.
- Build a skill set from `plugins/galeharness-cli/skills/*/SKILL.md`, using frontmatter `name` or directory basename.
- Scan target Markdown files for `galeharness-cli:` colon tokens.
- Treat `/galeharness-cli:*` slash-command-like references and known skill references as non-agent references.
- Pass two-segment `galeharness-cli:<agent-name>` when `<agent-name>` exists in the agent set.
- Fail three-segment `galeharness-cli:<category>:<agent-name>` when `<agent-name>` exists in the agent set, with recommendation `galeharness-cli:<agent-name>`.
- Fail unknown `galeharness-cli:*` references unless they are classified as known skills or slash commands.

**Execution note:** Add the test first and confirm it catches the existing three-segment documentation drift before fixing docs.

**Patterns to follow:**
- `tests/pipeline-review-contract.test.ts` for repo-relative `readRepoFile` style and readable contract assertions.
- `tests/frontmatter.test.ts` for shallow recursive Markdown collection patterns.

**Test scenarios:**
- Happy path: existing `galeharness-cli:repo-research-analyst` in skill docs maps to an agent file and passes.
- Error path: existing `galeharness-cli:research:learnings-researcher` in standards text is reported as invalid for current GaleHarnessCLI agent references.
- Edge case: `/galeharness-cli:agent-native-architecture` is not treated as an agent dispatch failure.
- Edge case: `galeharness-cli:gh-plan` or another real skill reference is not treated as an agent dispatch failure.
- Error path: an unknown two-segment `galeharness-cli:not-real-agent` would fail with a missing-agent reason.

**Verification:**
- The new targeted test fails before documentation alignment and passes after U2.
- Failure output is specific enough for a maintainer to locate and fix the reference without rerunning exploratory scans.

---

- [ ] U2. **Align project and plugin documentation with the two-segment standard**

**Goal:** 修正当前已知的规范漂移，让说明文档与 contract test 的最终标准一致。

**Requirements:** R1, R2, R4, R5; covers F2; covers AE2

**Dependencies:** U1

**Files:**
- Modify: `AGENTS.md`
- Modify: `plugins/galeharness-cli/AGENTS.md`
- Modify: `plugins/galeharness-cli/agents/project-standards-reviewer.md`
- Test: `tests/agent-reference-contract.test.ts`

**Approach:**
- 在根 `AGENTS.md` 的 “Agent References in Skills” 中把当前规范改为二段 `galeharness-cli:<agent-name>`，并更新示例为 `galeharness-cli:learnings-researcher`。
- 在 `plugins/galeharness-cli/AGENTS.md` 中修正过时的 agent 目录结构说明：当前 agent 源目录是扁平的；如果保留类别概念，只描述为 README/维护分组语义，而不是路径或引用命名空间。
- 在 `project-standards-reviewer.md` 中把 broken-reference 示例从三段推荐改为二段推荐。
- 不批量改写所有二段引用；它们是目标标准。

**Patterns to follow:**
- 保持 `AGENTS.md` 现有指令式、短段落风格。
- 保持 `plugins/galeharness-cli/AGENTS.md` checklist 风格，不引入大段历史解释。

**Test scenarios:**
- Happy path: contract test 不再发现三段 agent 引用作为当前标准。
- Integration: 根说明、插件说明和 standards reviewer 文档都通过同一套扫描规则。
- Regression: 现有二段 agent 引用仍保留，不被改成三段。

**Verification:**
- 维护者阅读根说明和插件说明时看到同一个二段标准。
- `plugins/galeharness-cli/agents/project-standards-reviewer.md` 不再鼓励三段引用。

---

- [ ] U3. **Validate targeted and full test impact**

**Goal:** 确认新 contract 不破坏现有 converter/writer 语义，并满足仓库测试要求。

**Requirements:** R5, R6

**Dependencies:** U1, U2

**Files:**
- Test: `tests/agent-reference-contract.test.ts`
- Existing related tests: `tests/converter.test.ts`, `tests/codex-converter.test.ts`, `tests/review-skill-contract.test.ts`, `tests/pipeline-review-contract.test.ts`

**Approach:**
- 先验证新增 contract test 的失败到通过路径。
- 再运行相关 contract/converter tests，确认文档标准调整没有改变目标平台转换行为。
- 最后按仓库 `AGENTS.md` 对解析、转换或输出相关变更的要求运行完整 `bun test`。

**Patterns to follow:**
- 不把测试结果写入实现文件；验证结果只在执行阶段汇报。

**Test scenarios:**
- Integration: contract test 和现有 converter tests 同时通过，说明源文档标准与目标平台扁平化行为并存。
- Regression: OpenCode/Codex 等目标仍能处理既有二段 agent 引用。
- Documentation: standards 文档检查不再与真实 agent layout 冲突。

**Verification:**
- 新增 targeted test 通过。
- 相关 converter/contract tests 通过。
- 完整 `bun test` 通过，或执行阶段明确记录非本次变更导致的失败。

---

## System-Wide Impact

- **Interaction graph:** 影响技能文档维护、project standards reviewer 的检查建议，以及测试阶段对 agent 引用的约束；不改变运行时 dispatch。
- **Error propagation:** 错误引用从运行时调度失败前移到测试失败。
- **State lifecycle risks:** 无持久状态或迁移风险。
- **API surface parity:** 不改变 CLI、converter 输出路径或目标平台安装结构。
- **Integration coverage:** 通过新增 contract test 加现有 converter tests 证明源文档标准和转换器扁平化行为一致。
- **Unchanged invariants:** agent 源文件仍位于 `plugins/galeharness-cli/agents/*.md`；二段引用仍是技能文档中的标准；target writer 仍可按各平台规则压平 agent 名。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 正则扫描误把 skill 引用或 slash command 当成 agent 引用 | 用真实 agent set、skill set 和 slash 前缀分类，新增 AE3 对应测试场景 |
| 文档仍存在过时分类目录说明 | U2 明确修改 `plugins/galeharness-cli/AGENTS.md` 的目录结构描述 |
| 未来真的引入分类 agent 目录时本测试阻止三段引用 | 这是有意约束；未来分类化应先更新需求、resolver/converter 语义和 contract test |
| 新测试过于宽松，只检查当前已知文件 | 扫描 root/plugin AGENTS、所有 skills、所有 agents，覆盖新增文档引用 |

---

## Documentation / Operational Notes

- 这是测试和规范对齐变更，不需要 release-owned version bump。
- 不需要更新 README 组件数量，因为不新增 skill、agent 或 command。
- 若实现阶段修改 `plugins/galeharness-cli/AGENTS.md` 的目录布局说明，保持它与真实文件树一致即可，不扩展成 agent inventory 重写。

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-04-25-agent-reference-lint-requirements.md`
- Root standard source: `AGENTS.md`
- Plugin maintenance source: `plugins/galeharness-cli/AGENTS.md`
- Existing agent docs: `plugins/galeharness-cli/agents`
- Existing skill docs: `plugins/galeharness-cli/skills`
- Converter behavior reference: `src/converters/claude-to-opencode.ts`
- Parser behavior reference: `src/parsers/claude.ts`
- Test style references: `tests/pipeline-review-contract.test.ts`, `tests/review-skill-contract.test.ts`, `tests/frontmatter.test.ts`
