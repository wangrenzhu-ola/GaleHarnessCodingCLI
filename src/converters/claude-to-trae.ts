import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  filterSkillsByPlatform,
} from "../types/claude"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type TraeBundle = {
  agents: Array<{ name: string; content: string }>
  commandFiles: Array<{ name: string; content: string }>
  skillDirs: Array<{ sourceDir: string; name: string }>
}

/**
 * Convert Claude plugin format to Trae format.
 *
 * Trae uses the same SKILL.md format as Claude Code (Agent Skills standard),
 * so skills can be copied directly. Agents and commands need minimal transformation.
 */
export function convertClaudeToTrae(
  plugin: ClaudePlugin,
  _options?: ClaudeToOpenCodeOptions,
): TraeBundle {
  const agentFiles = plugin.agents.map((agent) => convertAgent(agent))
  const cmdFiles = convertCommands(plugin.commands)

  return {
    agents: agentFiles,
    commandFiles: cmdFiles,
    skillDirs: filterSkillsByPlatform(plugin.skills, "trae").map((skill) => ({
      sourceDir: skill.sourceDir,
      name: skill.name,
    })),
  }
}

function convertAgent(agent: ClaudeAgent) {
  // Trae uses the same agent format as Claude
  const frontmatterLines: string[] = []
  frontmatterLines.push("---")
  frontmatterLines.push(`name: ${agent.name}`)
  frontmatterLines.push(`description: ${agent.description}`)
  if (agent.model) {
    frontmatterLines.push(`model: ${agent.model}`)
  }
  if (agent.temperature !== undefined) {
    frontmatterLines.push(`temperature: ${agent.temperature}`)
  }
  frontmatterLines.push("---")

  const content = frontmatterLines.join("\n") + "\n\n" + agent.content

  return {
    name: agent.name,
    content,
  }
}

function convertCommands(commands: ClaudeCommand[]) {
  return commands.map((cmd) => {
    const frontmatterLines: string[] = []
    frontmatterLines.push("---")
    frontmatterLines.push(`name: ${cmd.name}`)
    if (cmd.description) {
      frontmatterLines.push(`description: ${cmd.description}`)
    }
    frontmatterLines.push("---")

    const content = frontmatterLines.join("\n") + "\n\n" + cmd.content

    return {
      name: cmd.name,
      content,
    }
  })
}
