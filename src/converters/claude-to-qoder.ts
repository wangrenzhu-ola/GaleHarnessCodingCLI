import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  filterSkillsByPlatform,
} from "../types/claude"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type QoderBundle = {
  agents: Array<{ name: string; content: string }>
  commandFiles: Array<{ name: string; content: string }>
  skillDirs: Array<{ sourceDir: string; name: string }>
}

/**
 * Convert Claude plugin format to Qoder format.
 *
 * Qoder uses the same SKILL.md format as Claude Code, so skills can be
 * copied directly. Agents and commands need minimal transformation.
 */
export function convertClaudeToQoder(
  plugin: ClaudePlugin,
  _options?: ClaudeToOpenCodeOptions,
): QoderBundle {
  const agentFiles = plugin.agents.map((agent) => convertAgent(agent))
  const cmdFiles = convertCommands(plugin.commands)

  return {
    agents: agentFiles,
    commandFiles: cmdFiles,
    skillDirs: filterSkillsByPlatform(plugin.skills, "qoder").map((skill) => ({
      sourceDir: skill.sourceDir,
      name: skill.name,
    })),
  }
}

function convertAgent(agent: ClaudeAgent) {
  // Qoder uses the same agent format as Claude
  // Just need to ensure frontmatter is properly formatted
  const frontmatterLines: string[] = []
  frontmatterLines.push("---")
  frontmatterLines.push(`name: ${agent.name}`)
  frontmatterLines.push(`description: ${agent.description}`)
  if (agent.model) {
    frontmatterLines.push(`model: ${agent.model}`)
  }
  frontmatterLines.push("---")

  const content = frontmatterLines.join("\n") + "\n\n" + agent.body

  return {
    name: agent.name,
    content,
  }
}

function convertCommands(commands: ClaudeCommand[]) {
  return commands.map((cmd) => {
    // Commands in Qoder are similar to Claude's slash commands
    const frontmatterLines: string[] = []
    frontmatterLines.push("---")
    frontmatterLines.push(`name: ${cmd.name}`)
    if (cmd.description) {
      frontmatterLines.push(`description: ${cmd.description}`)
    }
    frontmatterLines.push("---")

    const content = frontmatterLines.join("\n") + "\n\n" + cmd.body

    return {
      name: cmd.name,
      content,
    }
  })
}
