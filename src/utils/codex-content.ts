import type { CodexEmbeddedAgentInstruction } from "../types/codex"
import { DEFAULT_PLATFORM_CAPABILITIES, type PlatformCapabilities } from "../types/platform-capabilities"

export type CodexInvocationTargets = {
  promptTargets: Record<string, string>
  skillTargets: Record<string, string>
}

export type CodexTransformOptions = {
  unknownSlashBehavior?: "prompt" | "preserve"
  platformCapabilities?: PlatformCapabilities
  agentInstructions?: Record<string, CodexEmbeddedAgentInstruction>
  embeddedState?: CodexEmbeddedAgentState
  visitedAgents?: Set<string>
}

type CodexEmbeddedAgentState = {
  sections: Map<string, string>
}

/**
 * Transform Claude Code content to Codex-compatible content.
 *
 * Handles multiple syntax differences:
 * 1. Task agent calls: either embed unsupported agent instructions or reference an agent skill
 * 2. Slash command references:
 *    - known prompt entrypoints -> /prompts:prompt-name
 *    - known skills -> the exact skill name
 *    - unknown slash refs -> /prompts:command-name
 * 3. Agent references: @agent-name -> $agent-name skill
 * 4. Claude config paths: .claude/ -> .codex/
 */
export function transformContentForCodex(
  body: string,
  targets?: CodexInvocationTargets,
  options: CodexTransformOptions = {},
): string {
  let result = body
  const promptTargets = targets?.promptTargets ?? {}
  const skillTargets = targets?.skillTargets ?? {}
  const unknownSlashBehavior = options.unknownSlashBehavior ?? "prompt"
  const capabilities = options.platformCapabilities ?? DEFAULT_PLATFORM_CAPABILITIES
  const embeddedState = options.embeddedState ?? { sections: new Map<string, string>() }
  const isRootTransform = options.embeddedState === undefined

  const taskPattern = /^(\s*-?\s*)Task\s+([a-z][a-z0-9:-]*)\(([^)]*)\)/gm
  result = result.replace(taskPattern, (_match, prefix: string, agentName: string, args: string) => {
    const skillName = normalizeCodexName(finalAgentSegment(agentName))
    const trimmedArgs = args.trim()
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

    return trimmedArgs
      ? `${prefix}Use the $${skillName} skill to: ${trimmedArgs}`
      : `${prefix}Use the $${skillName} skill`
  })

  const slashCommandPattern = /(?<![:\w>}\]\)])\/([a-z][a-z0-9_:-]*?)(?=[\s,."')\]}`]|$)/gi
  result = result.replace(slashCommandPattern, (match, commandName: string) => {
    if (commandName.includes("/")) return match
    if (["dev", "tmp", "etc", "usr", "var", "bin", "home"].includes(commandName)) return match

    const normalizedName = normalizeCodexName(commandName)
    if (promptTargets[normalizedName]) {
      return `/prompts:${promptTargets[normalizedName]}`
    }
    if (skillTargets[normalizedName]) {
      return `the ${skillTargets[normalizedName]} skill`
    }
    if (unknownSlashBehavior === "preserve") {
      return match
    }
    return `/prompts:${normalizedName}`
  })

  result = result
    .replace(/~\/\.claude\//g, "~/.codex/")
    .replace(/\.claude\//g, ".codex/")

  const agentRefPattern = /@([a-z][a-z0-9-]*-(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist))/gi
  result = result.replace(agentRefPattern, (_match, agentName: string) => {
    const skillName = normalizeCodexName(agentName)
    return `$${skillName} skill`
  })

  result = sanitizeModelOverrideInstructions(result, capabilities)

  if (isRootTransform && embeddedState.sections.size > 0) {
    result = `${result.trimEnd()}\n\n## Embedded Agent Instructions\n\n${[...embeddedState.sections.values()].join("\n\n")}`
  }

  return result
}

function lookupAgentInstruction(
  agentInstructions: Record<string, CodexEmbeddedAgentInstruction> | undefined,
  agentName: string,
): CodexEmbeddedAgentInstruction | undefined {
  if (!agentInstructions) return undefined
  const keys = [
    normalizeCodexName(agentName),
    normalizeCodexName(finalAgentSegment(agentName)),
  ]
  for (const key of keys) {
    if (agentInstructions[key]) return agentInstructions[key]
  }
  return undefined
}

function appendEmbeddedAgentSection(
  agent: CodexEmbeddedAgentInstruction,
  fallbackName: string,
  targets: CodexInvocationTargets | undefined,
  options: CodexTransformOptions,
): void {
  const name = agent.name || fallbackName
  const key = normalizeCodexName(name)
  const state = options.embeddedState
  if (!state || state.sections.has(key)) return

  const visitedAgents = new Set(options.visitedAgents ?? [])
  if (visitedAgents.has(key)) {
    state.sections.set(key, `### Agent: ${name}\n\nCircular embedded agent reference omitted.`)
    return
  }
  visitedAgents.add(key)

  const sections: string[] = [`### Agent: ${name}`]
  if (agent.description) {
    sections.push(`Description: ${agent.description}`)
  }
  if (agent.capabilities && agent.capabilities.length > 0) {
    sections.push(`Capabilities:\n${agent.capabilities.map((capability) => `- ${capability}`).join("\n")}`)
  }

  const body = transformContentForCodex(agent.body.trim(), targets, {
    ...options,
    embeddedState: state,
    visitedAgents,
  }).trim()
  sections.push(body || `Instructions converted from the ${name} agent.`)
  state.sections.set(key, sections.join("\n\n"))
}

function sanitizeModelOverrideInstructions(body: string, capabilities: PlatformCapabilities): string {
  if (capabilities.model_override === "field") return body

  return body
    .replace(/^\s*model:\s*["']?[A-Za-z0-9._/-]+["']?\s*$/gm, "")
    .replace(/`?model`?\s*:\s*["'](?:haiku|sonnet|opus|inherit|claude-[^"']+)["']/gi, "the current global model")
    .replace(/model:\s*(?:haiku|sonnet|opus|inherit|claude-[A-Za-z0-9._/-]+)/gi, "the current global model")
    .replace(/pass\s+the current global model/gi, "use the current global model")
    .replace(/\n{3,}/g, "\n\n")
}

function finalAgentSegment(agentName: string): string {
  return agentName.includes(":") ? agentName.split(":").pop()! : agentName
}

export function normalizeCodexName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "item"
  const normalized = trimmed
    .toLowerCase()
    .replace(/[\\/]+/g, "-")
    .replace(/[:\s]+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || "item"
}
