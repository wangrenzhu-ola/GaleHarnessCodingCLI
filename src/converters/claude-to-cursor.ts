import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  type ClaudeSkill,
  filterSkillsByPlatform,
} from "../types/claude"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type CursorBundle = {
  rules: Array<{ name: string; content: string }>
  skillDirs: Array<{ sourceDir: string; name: string }>
}

/**
 * Convert Claude plugin format to Cursor Rules format.
 *
 * Cursor uses .cursor/rules/*.mdc files with YAML frontmatter.
 * Each skill becomes a rule file. Agents and commands are converted to rules
 * since Cursor doesn't have separate agent/command concepts.
 */
export function convertClaudeToCursor(
  plugin: ClaudePlugin,
  _options?: ClaudeToOpenCodeOptions,
): CursorBundle {
  const rules: Array<{ name: string; content: string }> = []

  // Convert skills to rules
  const skills = filterSkillsByPlatform(plugin.skills, "cursor")
  for (const skill of skills) {
    rules.push(convertSkillToRule(skill))
  }

  // Convert agents to rules
  for (const agent of plugin.agents) {
    rules.push(convertAgentToRule(agent))
  }

  // Convert commands to rules
  for (const cmd of plugin.commands) {
    rules.push(convertCommandToRule(cmd))
  }

  return {
    rules,
    skillDirs: skills.map((skill) => ({
      sourceDir: skill.sourceDir,
      name: skill.name,
    })),
  }
}

function convertSkillToRule(skill: ClaudeSkill) {
  // Cursor .mdc format with frontmatter
  const frontmatterLines: string[] = []
  frontmatterLines.push("---")
  frontmatterLines.push(`description: ${skill.description || skill.name}`)
  frontmatterLines.push("alwaysApply: false")
  frontmatterLines.push("---")

  // Read the skill content - we'll use the description as the rule content
  // The actual skill content will be copied separately
  let content = frontmatterLines.join("\n") + "\n\n"
  content += `# ${skill.name}\n\n`
  if (skill.description) {
    content += `${skill.description}\n\n`
  }
  content += `This skill is loaded from the .cursor/skills directory.\n`

  return {
    name: skill.name,
    content,
  }
}

function convertAgentToRule(agent: ClaudeAgent) {
  const frontmatterLines: string[] = []
  frontmatterLines.push("---")
  frontmatterLines.push(`description: ${agent.description}`)
  frontmatterLines.push("alwaysApply: false")
  frontmatterLines.push("---")

  const content = frontmatterLines.join("\n") + "\n\n" + agent.body

  return {
    name: `agent-${agent.name}`,
    content,
  }
}

function convertCommandToRule(cmd: ClaudeCommand) {
  const frontmatterLines: string[] = []
  frontmatterLines.push("---")
  frontmatterLines.push(`description: ${cmd.description || cmd.name}`)
  frontmatterLines.push("alwaysApply: false")
  frontmatterLines.push("---")

  const content = frontmatterLines.join("\n") + "\n\n" + cmd.body

  return {
    name: `cmd-${cmd.name}`,
    content,
  }
}
