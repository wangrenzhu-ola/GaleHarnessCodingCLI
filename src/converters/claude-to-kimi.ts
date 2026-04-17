import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  filterSkillsByPlatform,
} from "../types/claude"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type KimiBundle = {
  generatedSkills: Array<{ name: string; content: string }>
  skillDirs: Array<{ sourceDir: string; name: string }>
}

/**
 * Convert Claude plugin format to Kimi format.
 *
 * Kimi reads skills from ~/.kimi/skills/<name>/SKILL.md using the same
 * format as Claude Code. Agents and commands are converted into skills
 * so they appear as skill:xxx slash commands in Kimi CLI.
 */
export function convertClaudeToKimi(
  plugin: ClaudePlugin,
  _options?: ClaudeToOpenCodeOptions,
): KimiBundle {
  const agentSkills = plugin.agents.map((agent) => convertAgent(agent))
  const commandSkills = convertCommands(plugin.commands)

  return {
    generatedSkills: [...commandSkills, ...agentSkills],
    skillDirs: filterSkillsByPlatform(plugin.skills, "kimi").map((skill) => ({
      sourceDir: skill.sourceDir,
      name: skill.name,
    })),
  }
}

function convertAgent(agent: ClaudeAgent) {
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

  let body = agent.body.trim()
  if (agent.capabilities && agent.capabilities.length > 0) {
    const capabilities = agent.capabilities.map((capability) => `- ${capability}`).join("\n")
    body = `## Capabilities\n${capabilities}\n\n${body}`
  }

  const content = frontmatterLines.join("\n") + "\n\n" + body

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
