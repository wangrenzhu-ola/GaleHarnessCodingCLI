import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  filterSkillsByPlatform,
} from "../types/claude"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type ClaudeBundle = {
  agents: Array<{ name: string; content: string }>
  commandFiles: Array<{ name: string; content: string }>
  skillDirs: Array<{ sourceDir: string; name: string }>
}

/**
 * Convert Claude plugin format to Claude home format.
 *
 * This is effectively an identity conversion since Claude Code is the
 * native authoring format. Agents, commands, and skills are written
 * directly into the Claude home directory tree.
 */
export function convertClaudeToClaude(
  plugin: ClaudePlugin,
  _options?: ClaudeToOpenCodeOptions,
): ClaudeBundle {
  const agentFiles = plugin.agents.map((agent) => convertAgent(agent))
  const cmdFiles = convertCommands(plugin.commands)

  return {
    agents: agentFiles,
    commandFiles: cmdFiles,
    skillDirs: filterSkillsByPlatform(plugin.skills, "claude").map((skill) => ({
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
  if (agent.capabilities && agent.capabilities.length > 0) {
    frontmatterLines.push(`capabilities:`)
    for (const cap of agent.capabilities) {
      frontmatterLines.push(`  - ${cap}`)
    }
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
    const frontmatterLines: string[] = []
    frontmatterLines.push("---")
    frontmatterLines.push(`name: ${cmd.name}`)
    if (cmd.description) {
      frontmatterLines.push(`description: ${cmd.description}`)
    }
    if (cmd.argumentHint) {
      frontmatterLines.push(`argument-hint: ${cmd.argumentHint}`)
    }
    if (cmd.model) {
      frontmatterLines.push(`model: ${cmd.model}`)
    }
    if (cmd.allowedTools && cmd.allowedTools.length > 0) {
      frontmatterLines.push(`allowed-tools:`)
      for (const tool of cmd.allowedTools) {
        frontmatterLines.push(`  - ${tool}`)
      }
    }
    if (cmd.disableModelInvocation) {
      frontmatterLines.push(`disable-model-invocation: true`)
    }
    frontmatterLines.push("---")

    const content = frontmatterLines.join("\n") + "\n\n" + cmd.body

    return {
      name: cmd.name,
      content,
    }
  })
}
