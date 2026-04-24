---
title: "Platform capability manifest for Codex agent dispatch rewrites"
date: 2026-04-24
category: integration-issues
module: src/converters
problem_type: integration_issue
component: tooling
symptoms:
  - "Codex target output contained dead instructions like Use the $agent skill to: ..."
  - "Claude-style Task agent(args) dispatch was rewritten without knowing whether the target can spawn agents"
  - "Per-agent model tiering prose leaked into Codex output even though Codex uses global model selection"
root_cause: config_error
resolution_type: code_fix
severity: high
tags:
  - platform-capabilities
  - codex
  - converters
  - agent-dispatch
  - model-override
  - skills
---

# Platform capability manifest for Codex agent dispatch rewrites

## Problem

GaleHarnessCLI 的 Claude -> Codex 转换器曾把 `Task agent(args)` 机械改写成 `Use the $agent skill to: args`。这在支持原生 agent dispatch 的平台上还能表达意图，但在 Codex 上会生成不可执行的死指令，因为 Codex 不允许 skill 内容自动授权 `spawn_agent`。

这次修复把目标平台能力变成转换器输入：target handler 显式声明自己是否能 spawn agents、是否支持 per-agent model override，转换器再根据能力做内容重写。

## Symptoms

- Codex skill 中出现 `Use the $repo-research-analyst skill to: ...` 这类文本，但运行时不会实际派发 agent。
- `gh:plan`、`gh:review` 等依赖 sub-agent 的 workflow 在 Codex 上退化为不完整的顺序执行，且缺少可执行的 agent 指令上下文。
- skill body 中的 `model: haiku`、`model: sonnet` 或 per-agent model tiering 说明会泄漏到 Codex 输出；Codex 的模型选择是全局配置，不支持这种字段级覆盖。
- `convert`、`install --to codex`、`--to all`、`--also codex` 都需要一致注入目标平台能力，否则同一转换器会根据入口不同产出不同语义。

## What Didn't Work

- **只做语法替换。** `Task X(args)` -> `Use the $X skill to: args` 只改变文本形态，不保证目标平台能执行替换后的动作。
- **把 Codex 当成缺少某个字段的 Claude。** Codex 的执行模型不同：skill 可以被调用，但 sub-agent spawn 需要用户显式授权，且 model 通过全局配置控制。
- **只处理生成的 prompt，不处理复制的 Markdown。** 如果 writer 只转换入口 prompt，skill 目录里的 `SKILL.md` 或 reference Markdown 仍可能保留 Claude-only 指令。
- **在单个 converter 里硬编码 Codex 特例。** 这会让后续目标平台继续复制条件分支，无法形成可复用的跨平台决策模型。

## Solution

新增 `PlatformCapabilities`，并让 target handler 明确声明能力：

```typescript
export type PlatformCapabilities = {
  can_spawn_agents: boolean
  model_override: "field" | "global" | "none"
}

export const CLAUDE_PLATFORM_CAPABILITIES = {
  can_spawn_agents: true,
  model_override: "field",
}

export const CODEX_PLATFORM_CAPABILITIES = {
  can_spawn_agents: false,
  model_override: "global",
}
```

`src/targets/index.ts` 为 target handler 增加 `capabilities`，并提供 `resolveTargetCapabilities(...)` 默认值。`src/commands/convert.ts` 和 `src/commands/install.ts` 在所有转换入口传入 handler 能力，覆盖普通 target、`--to all` 和 `--also`。

Codex converter 构建 agent instruction registry：

```typescript
const agentInstructions = buildAgentInstructions(plugin.agents)
const transformOptions = { platformCapabilities, agentInstructions }
```

`transformContentForCodex(...)` 根据能力分支处理 `Task agent(args)`：

```typescript
if (!capabilities.can_spawn_agents) {
  const agentInstruction = lookupAgentInstruction(options.agentInstructions, agentName)
  if (!agentInstruction) {
    return `${prefix}Run the ${skillName} agent sequentially in this context. Agent instructions were not available in the converted bundle.${trimmedArgs ? ` Input: ${trimmedArgs}` : ""}`
  }

  appendEmbeddedAgentSection(agentInstruction, skillName, targets, {
    ...options,
    platformCapabilities: capabilities,
    embeddedState,
  })
  return `${prefix}Run the embedded agent section \`Agent: ${agentInstruction.name}\` sequentially in this context.${trimmedArgs ? ` Input: ${trimmedArgs}` : ""}`
}
```

生成结果会在 skill 末尾追加去重后的 `## Embedded Agent Instructions`，让 Codex 在同一 context 内顺序执行 agent 视角。未知 agent 不再伪装成可执行 skill dispatch，而是给出诊断性 fallback。

同时，Codex writer 对复制的 skill 目录启用 Markdown 转换：`SKILL.md` 和 reference Markdown 都经过 Codex 内容重写，非 Markdown 文件保持原样复制。

## Why This Works

这个修复把转换器从“正则替换器”提升为“目标能力感知的编译器”。`Task agent(args)` 的正确输出不只取决于源语法，还取决于目标平台能不能执行 agent dispatch。

能力声明放在 target handler 上，转换入口只负责注入能力；转换器不需要猜测当前目标，也不需要在每个调用点散落 Codex 特例。未声明能力的 target 默认使用 Claude-like 行为，保持向后兼容。

Codex 的降级策略选择“内联 agent 指令并顺序执行”，而不是生成不可执行的 `$agent skill` 调用。这保留了 workflow 的核心语义：虽然没有并行 sub-agent，但 reviewer/researcher/persona 的指令仍然进入同一个上下文窗口，模型可以按 section 顺序完成工作。

模型覆盖也跟随能力声明处理。`model_override: "global"` 表示目标平台通过全局模型配置控制执行模型，转换器应移除或改写 narrow per-agent model 指令，但不应误删普通谈论 “model” 的业务文本。

## Prevention

- 新增或修改 target provider 时，先定义目标能力，再设计内容重写；不要只看源平台语法。
- 每个目标入口都必须注入同一套 handler capabilities，包括 `convert`、`install`、`--to all` 和 `--also`。
- Codex 相关测试要覆盖真实 writer 输出，尤其是复制 skill 目录和 reference Markdown，而不是只测 generated prompt。
- 对无法解析的 agent dispatch 使用诊断性 fallback，避免输出看起来可执行但实际无效的指令。
- 对 model override sanitizer 保持窄匹配，只处理明确的 frontmatter、model tiering 和 per-agent override 片段，避免误伤普通 “model” 文本。

## Related Issues

- `docs/brainstorms/2026-04-24-platform-capability-manifest-requirements.md` — 需求文档，定义 `can_spawn_agents` 和 `model_override` 第一版范围。
- `docs/ideation/2026-04-24-codex-subagent-parallel-invocation-ideation.md` — 原始 ideation，指出 Codex sub-agent 并行调用能力缺失。
- `docs/solutions/codex-skill-prompt-entrypoints.md` — 相关 Codex entrypoint 模型；与本修复共享 Codex skill/prompt 语义边界。
- `docs/solutions/integrations/cross-platform-model-field-normalization-2026-03-29.md` — 相关模型字段归一化经验；本修复把 model override 支持提升到平台能力层。
- PR: `https://github.com/wangrenzhu-ola/GaleHarnessCodingCLI/pull/57`
