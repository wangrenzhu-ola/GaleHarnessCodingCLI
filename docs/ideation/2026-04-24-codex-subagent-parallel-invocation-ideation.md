---
date: 2026-04-24
topic: codex-subagent-parallel-invocation
focus: Codex 无法原生并发调用 sub-agents，skill 静默降级
---

# Ideation: Codex Sub-Agent 并行调用能力缺失

## Codebase Context

GaleHarnessCLI 是一个 Bun/TypeScript CLI，将 galeharness-cli 插件（~35 skills, ~50 agents）转换为 16+ 目标平台格式（Codex, Copilot, Gemini, Kiro, Windsurf, Qoder 等）。

**核心问题：** 当 gh:plan、gh:ideate、gh:review 等 skill 在 Codex 上被调用时，它们描述需要运行 sub-agents（repo-research, learnings-researcher, document-review, reviewer personas 等）。但 Codex 的安全规则要求用户显式授权 `spawn_agent`，否则 skill 退化为 sequential/headless 执行 — 丧失并行性、多视角质量，且经常静默失败。

**关键发现：**

1. Codex 转换器将 `Task X(args)` 重写为自然语言提示（`Use the $X skill to: args`），但 Codex 仍然无法自动 spawn
2. 不存在平台能力协商层 — skill 中散布着平台特定的条件散文
3. Sequential fallback 只有一行文字（"run reviewers sequentially"），不是真正的策略 — 无指导如何合并部分结果、跳过阶段、或优雅降级
4. Codex skills 变成浅层 wrapper — prompt entrypoint 说"使用该 skill"，但 skill body 仍包含 Codex 无法执行的 Task dispatch
5. `gh:work-beta` 仅支持从 Claude Code 向 Codex 委派；在非 Claude Code 平台上显式禁用委派
6. Codex 具有最受限的 agent 能力模型：无 model 字段、skill 不等于 prompt、目录名即 skill 名
7. Token 经济学：skill body 大小是乘法因子，条件内容应提取到 reference 文件
8. `transformContentForCodex`（`codex-content.ts:32-42`）用正则做零感知替换，产出死指令

## Ranked Ideas

### 1. Platform Capability Manifest
**Description:** 定义每个目标平台的结构化能力模式（`can_spawn_agents: boolean`, `model_override: "field" | "none"`, `question_tool: string | null`, `max_prompt_bytes: number` 等），作为转换器的一等输入。转换器基于能力声明做结构性决策（内联 / 降级 / 排除），而非盲目的语法替换。现有 `ce_platforms` 字段只做布尔过滤；扩展到能力级过滤是自然的下一步。
**Rationale:** 所有后续改进的前提条件。转换器是系统瓶颈（16 targets x 35 skills = 560 组合），一个能力模式改进可以在所有组合中复用。`transformContentForCodex` 目前用正则做零感知替换 — 它不知道目标平台能否 spawn agents。能力声明让转换器可以做结构性决策。
**Downsides:** 需要为 16 个目标平台编写和维护能力声明；需要技能和转换器同时适配。
**Confidence:** 95%
**Complexity:** Medium
**Status:** Explored (brainstorm 2026-04-24)

### 2. Sub-Agent Inlining / Compile-Time Workflow Flattening
**Description:** 当目标平台不支持 `spawn_agent` 时，转换器在构建时将 sub-agent 的指令直接内联到 skill body 中，而非生成 `Use the $X skill to: args` 这种死指令。例如 `gh:review` 在 Codex 上变为：单人 sequential review，persona 视角作为同一 prompt 的不同 section。转换器已有 `agent.body` 访问权限（`claude-to-codex.ts:117`），只是从未用于内联。
**Rationale:** 直接解决核心问题 — Codex 用户调用 skill 时，sub-agent 永远不会被 spawn，当前转换产出的是不可执行的文本提示。内联让 skill 在受限平台上真正可执行。`transformContentForCodex` 的正则（`codex-content.ts:32`）只匹配一种 `Task` 语法变体，无法处理多行 dispatch block 或散文引用。
**Downsides:** 转换器需要理解 skill 的执行模型，而非仅做正则替换；内联后 skill body 可能变大，需配合条件内容提取控制体积。
**Confidence:** 85%
**Complexity:** Medium-High
**Status:** Unexplored

### 3. Sequential-First Skill Design (Parallel as Acceleration)
**Description:** 反转当前设计假设：先为 sequential 执行设计 skill，再在支持并行的平台上加速能力。当前所有 skill 以 Claude Code 的并行 dispatch 为基准，sequential fallback 是事后补充的一行文字。如果 sequential 是主路径，则每个平台都能获得一个经过设计的 workflow，而非一个静默降级的体验。这符合"为最受限的目标设计，为更强大的目标增强"的原则。
**Rationale:** 最深层的重新框定。Codex 不是"不能跑的 Claude"，而是一个有不同执行模型的平台。Sequential-first 让 Codex 版本成为 canonical 版本，Claude Code 版本是优化版本。整个转换管道目前从 Claude -> 所有其他目标单向流动；没有"为最弱目标构建并增强"的模型。
**Downsides:** 需要文化转变 — 当前所有 skill 以 Claude Code 为 first-class；已有 skill 重写成本高；可能牺牲一些并行设计的优雅。
**Confidence:** 70%
**Complexity:** High（文化 + 技术双重转变）
**Status:** Unexplored

### 4. Prompt-Stacking: 单 Agent 多视角执行
**Description:** 挑战"多视角输出必须依赖 sub-agent dispatch"的假设。在同一 context window 内，用 sequential rounds 实现多视角：先以安全视角 review，再以性能视角 review，最后合并 findings。不需要 `spawn_agent`，每个平台都能执行。对于 review 场景，sequential perspective carry-forward 可能比独立并行更好 — 后续视角可以避免重复前序视角已发现的 findings，产出更连贯、更少矛盾的结论。
**Rationale:** 最可操作的 per-skill 改进。不需要转换器改动，可以在一个 skill 上试点。让 Codex 上的 review 从"假装要 spawn 18 个 agent"变为"按顺序执行 18 个视角"。当前 `gh:review` 的 sequential fallback（line 782）把 sequential 当降级模式处理，从未探索过它的设计空间。
**Downsides:** 后续视角会看到前序视角的结论（非独立）；不适用于需要完全独立判断的场景（如 adversarial review）；context window 可能成为瓶颈。
**Confidence:** 80%
**Complexity:** Low-Medium
**Status:** Unexplored

### 5. Conditional Content Extraction (Platform-Tagged Sections)
**Description:** 在 skill body 中引入结构化的平台条件标记（如 `<!-- platform:claude -->...<!-- /platform:claude -->` 或 `references/platform-codex/` 目录），转换器根据目标平台剥离/保留相关内容。消除散布在每个 skill 中的 68 处 "AskUserQuestion in Claude Code, request_user_input in Codex" 条件散文。`references/` 模式已存在，`collectReferencedSidecarDirs` 已在 `claude-to-codex.ts:221-238` 中实现。
**Rationale:** 实用的 token 经济学改进。Top 5 skills 平均 40KB，30-40% 是平台条件散文。每删除一个平台无关条件块，在每个 session、每个平台上永远节省 token。同时让技能作者只需写一次平台特定内容、打上标记，而非复制粘贴 disjunction。
**Downsides:** 需要技能作者采用标记语法；转换器需要解析标记并选择性保留；向后兼容需处理无标记的旧 skill。
**Confidence:** 85%
**Complexity:** Low-Medium
**Status:** Unexplored

### 6. Graceful Degradation Strategy (Not Just "Run Sequentially")
**Description:** 替换当前的一行 sequential fallback，为每个 multi-agent skill 编写真正的降级策略：(a) 声明质量差异数值，(b) 区分 must-run vs. nice-to-have agents，(c) 描述 partial results 合并方法，(d) 向用户输出降级置信度说明。在 skill 开始时发出"降级收据"（degradation receipt），而非让降级在 prose 中静默发生。
**Rationale:** 直接改善用户体验。当前 `gh:review` 在 Codex 上跑 18 个 sequential persona 可能要 30+ 分钟，且没有 triage、timeout、partial-result 的指导。用户要么永远等待，要么得到一个只完成了 3/18 reviewers 的 review，且没有覆盖差距说明。cross-reviewer agreement boosts（`gh-review` line 508）在 sequential 运行中无法触发 — "Everything else stays the same" 并不成立。
**Downsides:** 需要 per-skill 分析和编写降级策略；策略本身也需要维护。
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

### 7. Cross-Platform Skill Verification Harness
**Description:** 构建转换器后置的验证测试：对每个目标平台，断言每个转换后的 skill 的结构有效性 — 无悬挂 `Task` 引用、无不可用工具引用、prompt body 不超过目标字节限制、必需 frontmatter 字段存在。当前测试只验证 `sample-plugin` fixture，不验证真实 plugin 的 560 组合。
**Rationale:** 防御性但必要的投资。当前发现 Codex skill 问题的唯一方式是在 Codex 上运行它。验证套件让"works on Codex"从手动检查变为 CI gate。随系统增长自动扩展复利 — 每新增一个平台或 skill 都被自动覆盖。
**Downsides:** 需要定义每个平台的"结构有效"标准；初始构建工作量较大。
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Pre-Authorized Codex Config Generation | 解决表面症状；内联后无需授权 |
| 2 | Remove the Sequential Fallback Lie | 设计原则而非可执行改进 |
| 3 | Platform Capability Probe Script | 推测性；构建时 manifest 已足够 |
| 4 | Reverse Delegation (Codex -> Claude Code) | 需不存在的跨平台协议；过于推测 |
| 5 | Runtime Capability Discovery | 增加运行时复杂度；构建时 manifest 足够 |
| 6 | Skill Author Feedback Loop | 被 CI 验证套件覆盖 |
| 7 | Token-Budget-Aware Conversion | 条件内容提取的后续优化 |
| 8 | Skill Body Size Budget | 同上 |
| 9 | Structured Dispatch Descriptors | 需要技能作者采纳；内联可达同样效果 |
| 10 | Delegation Framework Generalization | 扩展方向与核心问题不同 |
| 11 | Skill-Dependency Graph | 与核心问题正交 |
| 12 | Converter Regression Canary | 被验证套件覆盖 |
| 13 | Per-Skill AGENTS.md Inlining | 被 Sub-Agent Inlining 覆盖 |
| 14 | User-Controlled Quality/Cost Tradeoff Knob | 次要 UX 改进；核心问题解决后添加 |
