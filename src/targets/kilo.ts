import path from "path"
import {
  backupFile,
  copySkillDir,
  ensureDir,
  pathExists,
  readJson,
  sanitizePathName,
  writeJson,
  writeText,
} from "../utils/files"
import { transformContentForKilo } from "../converters/claude-to-kilo"
import type { KiloBundle } from "../types/kilo"

export async function writeKiloBundle(outputRoot: string, bundle: KiloBundle): Promise<void> {
  const paths = resolveKiloPaths(outputRoot)
  await ensureDir(paths.kiloDir)

  // Write agents
  if (bundle.agents.length > 0) {
    await ensureDir(paths.agentsDir)
    const seenNames = new Set<string>()
    for (const agent of bundle.agents) {
      const safeName = sanitizePathName(agent.name)
      if (seenNames.has(safeName)) {
        console.warn(`Skipping agent "${agent.name}": sanitized name "${safeName}" collides with another agent`)
        continue
      }
      seenNames.add(safeName)
      await writeText(path.join(paths.agentsDir, `${safeName}.md`), agent.content + "\n")
    }
  }

  // Write commands
  if (bundle.commandFiles.length > 0) {
    await ensureDir(paths.commandDir)
    const seenNames = new Set<string>()
    for (const cmd of bundle.commandFiles) {
      const safeName = sanitizePathName(cmd.name)
      if (seenNames.has(safeName)) {
        console.warn(`Skipping command "${cmd.name}": sanitized name "${safeName}" collides with another command`)
        continue
      }
      seenNames.add(safeName)
      await writeText(path.join(paths.commandDir, `${safeName}.md`), cmd.content + "\n")
    }
  }

  // Copy skill directories
  if (bundle.skillDirs.length > 0) {
    await ensureDir(paths.skillsDir)
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(paths.skillsDir, sanitizePathName(skill.name))
      await copySkillDir(skill.sourceDir, destDir, transformContentForKilo, true)
    }
  }

  // Write MCP servers to kilo.json
  if (Object.keys(bundle.mcpServers).length > 0) {
    await ensureDir(paths.kiloDir)
    const configPath = paths.configPath
    const backupPath = await backupFile(configPath)
    if (backupPath) {
      console.log(`Backed up existing kilo.json to ${backupPath}`)
    }

    let existingConfig: Record<string, unknown> = {}
    if (await pathExists(configPath)) {
      try {
        existingConfig = await readJson<Record<string, unknown>>(configPath)
      } catch {
        console.warn("Warning: existing kilo.json could not be parsed and will be replaced.")
      }
    }

    const existingServers =
      existingConfig.mcpServers && typeof existingConfig.mcpServers === "object"
        ? (existingConfig.mcpServers as Record<string, unknown>)
        : {}
    const merged = { ...existingConfig, mcpServers: { ...existingServers, ...bundle.mcpServers } }
    await writeJson(configPath, merged)
  }
}

function resolveKiloPaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // If already pointing at .kilo, write directly into it
  if (base === ".kilo") {
    return {
      kiloDir: outputRoot,
      configPath: path.join(outputRoot, "kilo.json"),
      agentsDir: path.join(outputRoot, "agents"),
      commandDir: path.join(outputRoot, "command"),
      skillsDir: path.join(outputRoot, "skills"),
    }
  }
  // Otherwise nest under .kilo
  const kiloDir = path.join(outputRoot, ".kilo")
  return {
    kiloDir,
    configPath: path.join(kiloDir, "kilo.json"),
    agentsDir: path.join(kiloDir, "agents"),
    commandDir: path.join(kiloDir, "command"),
    skillsDir: path.join(kiloDir, "skills"),
  }
}
