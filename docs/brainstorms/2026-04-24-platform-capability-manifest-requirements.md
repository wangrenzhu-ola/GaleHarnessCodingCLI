---
date: 2026-04-24
topic: platform-capability-manifest
---

# Platform Capability Manifest

## Problem Frame

GaleHarnessCLI 的转换器将 skill 从 Claude Code 格式转换为 16+ 目标平台格式，但转换器对目标平台的能力一无所知。当前 `transformContentForCodex` 用正则将 `Task X(args)` 替换为 `Use the $X skill to: args`，这是一个 Codex 无法执行的死指令 — Codex 的安全规则要求用户显式授权 `spawn_agent`，而转换器不知道这一点。

这个问题不限于 Codex。每个平台在 agent dispatch、model 选择、交互能力等方面都有不同的约束，但转换器用同一套逻辑处理所有平台 — 正则替换不知道目标能否执行替换后的指令。随着平台数量增长（当前 16 个），这种"盲目替换"模式产生的死指令和静默降级会越来越严重。

Capability Manifest 让转换器从"盲目替换"变为"知情决策" — 根据目标平台的能力声明，在构建时做出结构性内容重写，确保每个平台产出的 skill 在该平台上真正可执行。

---

## Actors

- A1. **转换器（Converter）**：在构建时读取目标平台的能力声明，据此对 skill body 做结构性重写
- A2. **目标平台 Handler**：声明自己平台的能力（如 `can_spawn_agents: false`），作为转换器的输入
- A3. **Skill 作者**：继续按现有方式编写 skill，无需感知平台能力差异 — 转换器全权处理

---

## Key Flows

- F1. **Capability-Aware Skill Conversion**
  - **Trigger:** 用户运行 `convert` 或 `install --to codex`
  - **Actors:** A1, A2
  - **Steps:**
    1. 转换器读取目标 handler 的 `capabilities` 声明
    2. 转换器扫描每个 skill body 中的 `Task X(args)` 调用
    3. 对于 `can_spawn_agents: false` 的目标，转换器找到被调用 agent 的 body，将其指令内联为 skill body 中的命名 section
    4. 对于 `model_override: "none"` 的目标，转换器剥离 skill body 中的 model tiering 指令
    5. 转换器输出平台专属的 skill 内容到目标目录
  - **Outcome:** 目标平台目录下的 skill 包含该平台可直接执行的内容，无死指令
  - **Covered by:** R1, R2, R3, R4

---

## Requirements

**Capability Declaration**

- R1. `TargetHandler` 类型新增可选的 `capabilities` 字段，类型为 `PlatformCapabilities`
- R2. `PlatformCapabilities` 类型包含第一版能力维度：`can_spawn_agents: boolean` 和 `model_override: "field" | "global" | "none"`
- R3. Codex target handler 声明 `can_spawn_agents: false`, `model_override: "global"`；Claude Code handler 声明 `can_spawn_agents: true`, `model_override: "field"`

**Capability-Driven Content Rewriting**

- R4. 转换器在构建时读取目标 handler 的 `capabilities`，根据能力做结构性内容重写（而非仅正则替换）
- R5. 当 `can_spawn_agents: false` 时，转换器将 skill body 中的 `Task X(args)` 调用替换为被调用 agent 的内联指令（而非 `Use the $X skill to: args`）
- R6. 内联的 agent 指令以命名 section 的形式嵌入 skill body（如 `## Agent: repo-research-analyst`），包含该 agent 的核心指令，使主 agent 可以在同一 context window 中 sequential 执行
- R7. 当 `model_override: "none"` 时，转换器剥离 skill body 中的 model tiering 指令（如 `model: "haiku"` 引用、per-tier model selection table）
- R8. 对于 `can_spawn_agents: true` 的目标，转换器保持当前的 `Task X(args)` 语法不变（Claude Code 原生支持）

**Transparency & Non-Breaking**

- R9. 转换器的 capability-aware 重写对 skill 作者完全透明 — skill 作者不需要修改任何 skill 文件
- R10. 未声明 `capabilities` 的 target handler 默认 `can_spawn_agents: true`, `model_override: "field"`（与 Claude Code 行为一致），确保向后兼容
- R11. 转换器仅修改输出目录中的内容，不修改源 skill 文件

---

## Acceptance Examples

- AE1. **Covers R4, R5, R6.** Given `gh:plan` skill body 包含 `Task galeharness-cli:repo-research-analyst(analyze the repo)`，when 转换目标为 Codex (`can_spawn_agents: false`)，then 输出的 skill body 中不再包含 `Use the $repo-research-analyst skill to: analyze the repo`，而是包含 `## Agent: repo-research-analyst` section，内含该 agent 的核心指令，主 agent 可 sequential 执行
- AE2. **Covers R4, R7.** Given `gh:review` skill body 包含 model tiering table（`haiku` 用于 cheap agents, `sonnet` 用于 orchestration），when 转换目标为 Codex (`model_override: "global"`)，then 输出的 skill body 中 model tiering 指令被剥离或替换为"使用当前全局模型"
- AE3. **Covers R8, R10.** Given `gh:plan` skill body 包含 `Task galeharness-cli:repo-research-analyst(...)`，when 转换目标为 Claude Code (`can_spawn_agents: true`)，then 输出保持 `Task galeharness-cli:repo-research-analyst(...)` 不变

---

## Success Criteria

- Codex 转换输出的 skill body 中不包含 `Use the $X skill to:` 格式的死指令
- Codex 用户调用 `gh:plan` 时，repo-research 和 learnings-researcher 的工作在同一 context window 中 sequential 执行，产出与 Claude Code 并行执行等价（或可接受的降级）的结果
- 新增 target handler 只需声明 capabilities，转换器自动应用已有的重写逻辑
- 已有 skill 文件零改动

---

## Scope Boundaries

- 第一版仅实现 Codex target 的 capability-aware 转换（端到端先导）
- 第一版仅覆盖 2 个能力维度：`can_spawn_agents` 和 `model_override`
- 不修改 skill 源文件或 skill 编写约定
- 不实现运行时能力查询 — 仅构建时消费
- 不实现 per-skill `execution_model` 声明 — 转换器自行推断
- 不实现 agent body 的深度语义解析 — 第一版基于 `Task X(args)` 正则匹配定位 dispatch 点，内联完整 agent body
- 不实现 skill body 的自动压缩或 section-level token 优化 — 后续迭代
- 不实现跨平台 skill 验证套件 — 独立改进

---

## Key Decisions

- **构建时消费，非运行时查询：** Capability manifest 在 `convert`/`install` 时被转换器读取，生成的 skill 已是平台专属版本。运行时无需能力感知逻辑。
- **Target handler 内联声明：** 每个 target handler 文件导出自己的 `capabilities` 对象，而非独立的 capabilities 目录。能力与 handler 共存，减少文件跳转。
- **对 skill 作者透明：** Skill 作者不需要声明 `execution_model` 或修改 skill body。转换器通过 `Task X(args)` 模式识别 dispatch 点，通过 `agent.body` 获取内联内容。
- **端到端先导 Codex：** 第一版只对 Codex 实现完整的 capability-aware 转换流程，验证架构可行性后再扩展到其他平台。

---

## Dependencies / Assumptions

- 转换器在 `convertClaudeToCodex` 中已有 `plugin.agents` 访问权（`claude-to-codex.ts:92-94`），可以获取 `agent.body` 用于内联
- `Task X(args)` 正则模式（`codex-content.ts:32`）足以识别绝大多数 sub-agent dispatch 点 — 更复杂的散文引用可在后续迭代中处理
- 内联 agent body 到 skill 中不会导致 skill 体积超出 Codex 的实际限制 — 如果超出，需要配合内容提取策略（独立改进）
- `model_override: "global"` 表示 Codex 通过 `config.toml` 全局设置模型，skill body 中不应包含 per-agent model 选择指令

---

## Outstanding Questions

### Resolve Before Planning

（无 — 核心产品决策已通过 brainstorm 对话确定）

### Deferred to Planning

- [Affects R5, R6][Technical] 内联 agent body 时，如何处理 agent body 自身包含的 `Task Y(args)` 调用（嵌套 dispatch）？第一版可能只内联一层，递归内联留给后续。
- [Affects R6][Technical] 内联 section 的具体格式 — 是 H2 header + body，还是更结构化的标记（如 YAML block）？需要考虑 Codex model 的解析效果。
- [Affects R7][Technical] 如何识别 skill body 中的 "model tiering 指令"？是正则匹配特定模式（如 `model: "haiku"`），还是需要更通用的 section 识别？
- [Affects R5][Needs research] 需要验证：Codex 的 `spawn_agent` 在 full-auto 模式下是否可以自动授权？如果可以，`can_spawn_agents` 可能需要是 `"auto" | "authorized" | "none"` 而非简单的 boolean。

---

## Next Steps

-> `/gh:plan` for structured implementation planning
