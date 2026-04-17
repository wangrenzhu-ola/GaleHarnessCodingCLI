import path from "path"
import {
  copySkillDir,
  ensureDir,
  sanitizePathName,
  writeText,
} from "../utils/files"
import type { QoderBundle } from "../converters/claude-to-qoder"

/**
 * Write Qoder bundle to the output directory.
 *
 * Qoder structure:
 * ~/.qoder/
 *   ├── skills/<skill-name>/SKILL.md
 *   ├── agents/<agent-name>.md
 *   └── commands/<command-name>.md
 */
export async function writeQoderBundle(
  outputRoot: string,
  bundle: QoderBundle,
): Promise<void> {
  const qoderPaths = resolveQoderPaths(outputRoot)

  // Write agents
  if (bundle.agents.length > 0) {
    await ensureDir(qoderPaths.agentsDir)
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
      await writeText(path.join(qoderPaths.agentsDir, `${safeName}.md`), agent.content + "\n")
      console.log(`Installed agent: ${agent.name}`)
    }
  }

  // Write commands
  if (bundle.commandFiles.length > 0) {
    await ensureDir(qoderPaths.commandsDir)
    for (const cmd of bundle.commandFiles) {
      const safeName = sanitizePathName(cmd.name)
      await writeText(path.join(qoderPaths.commandsDir, `${safeName}.md`), cmd.content + "\n")
      console.log(`Installed command: ${cmd.name}`)
    }
  }

  // Copy skills
  if (bundle.skillDirs.length > 0) {
    await ensureDir(qoderPaths.skillsDir)
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(qoderPaths.skillsDir, sanitizePathName(skill.name))
      // Qoder uses the same format as Claude, so copy without transformation
      await copySkillDir(skill.sourceDir, destDir, undefined, false)
      console.log(`Installed skill: ${skill.name}`)
    }
  }

  console.log(`\nQoder installation complete at: ${qoderPaths.root}`)
  console.log("Restart Qoder to load the new skills.")
}

function resolveQoderPaths(outputRoot: string) {
  const base = path.basename(outputRoot)

  // If outputRoot is already the qoder directory, use it directly
  if (base === ".qoder" || base === "qoder") {
    return {
      root: outputRoot,
      skillsDir: path.join(outputRoot, "skills"),
      agentsDir: path.join(outputRoot, "agents"),
      commandsDir: path.join(outputRoot, "commands"),
    }
  }

  // Otherwise, assume we're installing to ~/.qoder
  return {
    root: outputRoot,
    skillsDir: path.join(outputRoot, "skills"),
    agentsDir: path.join(outputRoot, "agents"),
    commandsDir: path.join(outputRoot, "commands"),
  }
}
