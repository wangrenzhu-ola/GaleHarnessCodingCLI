import path from "path"
import {
  copySkillDir,
  ensureDir,
  sanitizePathName,
  writeText,
} from "../utils/files"
import type { TraeBundle } from "../converters/claude-to-trae"

/**
 * Write Trae bundle to the output directory.
 *
 * Trae structure:
 * ~/.trae/
 *   ├── skills/<skill-name>/SKILL.md
 *   ├── agents/<agent-name>.md
 *   └── commands/<command-name>.md
 */
export async function writeTraeBundle(
  outputRoot: string,
  bundle: TraeBundle,
): Promise<void> {
  const traePaths = resolveTraePaths(outputRoot)

  // Write agents
  if (bundle.agents.length > 0) {
    await ensureDir(traePaths.agentsDir)
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
      await writeText(path.join(traePaths.agentsDir, `${safeName}.md`), agent.content + "\n")
      console.log(`Installed agent: ${agent.name}`)
    }
  }

  // Write commands
  if (bundle.commandFiles.length > 0) {
    await ensureDir(traePaths.commandsDir)
    for (const cmd of bundle.commandFiles) {
      const safeName = sanitizePathName(cmd.name)
      await writeText(path.join(traePaths.commandsDir, `${safeName}.md`), cmd.content + "\n")
      console.log(`Installed command: ${cmd.name}`)
    }
  }

  // Copy skills
  if (bundle.skillDirs.length > 0) {
    await ensureDir(traePaths.skillsDir)
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(traePaths.skillsDir, sanitizePathName(skill.name))
      // Trae uses the same format as Claude, so copy without transformation
      await copySkillDir(skill.sourceDir, destDir, undefined, false)
      console.log(`Installed skill: ${skill.name}`)
    }
  }

  console.log(`\nTrae installation complete at: ${traePaths.root}`)
  console.log("Restart Trae to load the new skills.")
}

function resolveTraePaths(outputRoot: string) {
  const base = path.basename(outputRoot)

  // If outputRoot is already the trae directory, use it directly
  if (base === ".trae" || base === "trae") {
    return {
      root: outputRoot,
      skillsDir: path.join(outputRoot, "skills"),
      agentsDir: path.join(outputRoot, "agents"),
      commandsDir: path.join(outputRoot, "commands"),
    }
  }

  // Otherwise, assume we're installing to ~/.trae
  return {
    root: outputRoot,
    skillsDir: path.join(outputRoot, "skills"),
    agentsDir: path.join(outputRoot, "agents"),
    commandsDir: path.join(outputRoot, "commands"),
  }
}
