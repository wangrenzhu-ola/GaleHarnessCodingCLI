import path from "path"
import {
  copySkillDir,
  ensureDir,
  sanitizePathName,
  writeText,
} from "../utils/files"
import type { ClaudeBundle } from "../converters/claude-to-claude"

/**
 * Write Claude bundle to the output directory.
 *
 * Claude structure:
 * ~/.claude/
 *   ├── skills/<skill-name>/SKILL.md
 *   ├── agents/<agent-name>.md
 *   └── commands/<command-name>.md
 */
export async function writeClaudeBundle(
  outputRoot: string,
  bundle: ClaudeBundle,
): Promise<void> {
  // Write agents
  if (bundle.agents.length > 0) {
    await ensureDir(path.join(outputRoot, "agents"))
    const seenAgents = new Set<string>()
    for (const agent of bundle.agents) {
      const safeName = sanitizePathName(agent.name)
      if (seenAgents.has(safeName)) {
        console.warn(
          `Skipping agent "${agent.name}": sanitized name "${safeName}" collides with another agent`,
        )
        continue
      }
      seenAgents.add(safeName)
      await writeText(path.join(outputRoot, "agents", `${safeName}.md`), agent.content + "\n")
      console.log(`Installed agent: ${agent.name}`)
    }
  }

  // Write commands
  if (bundle.commandFiles.length > 0) {
    await ensureDir(path.join(outputRoot, "commands"))
    for (const cmd of bundle.commandFiles) {
      const safeName = sanitizePathName(cmd.name)
      await writeText(path.join(outputRoot, "commands", `${safeName}.md`), cmd.content + "\n")
      console.log(`Installed command: ${cmd.name}`)
    }
  }

  // Copy skills
  if (bundle.skillDirs.length > 0) {
    await ensureDir(path.join(outputRoot, "skills"))
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(outputRoot, "skills", sanitizePathName(skill.name))
      await copySkillDir(skill.sourceDir, destDir, undefined, false)
      console.log(`Installed skill: ${skill.name}`)
    }
  }

  console.log(`\nClaude installation complete at: ${outputRoot}`)
}
