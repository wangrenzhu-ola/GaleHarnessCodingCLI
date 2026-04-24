import path from "path"
import {
  backupFile,
  copySkillDir,
  ensureDir,
  pathExists,
  readText,
  sanitizePathName,
  writeJson,
  writeText,
} from "../utils/files"
import { transformContentForPi } from "../converters/claude-to-pi"
import type { PiBundle } from "../types/pi"

const PI_AGENTS_BLOCK_START = "<!-- BEGIN COMPOUND PI TOOL MAP -->"
const PI_AGENTS_BLOCK_END = "<!-- END COMPOUND PI TOOL MAP -->"

const PI_AGENTS_BLOCK_BODY = `## Compound Engineering (Pi compatibility)

This block is managed by compound-plugin.

Compatibility notes:
- Pi installs require nicobailon/pi-subagents for the subagent tool
- Pi installs recommend edlsh/pi-ask-user for the ask_user tool
- Claude Task(agent, args) maps to the pi-subagents subagent tool
- AskUserQuestion maps to ask_user when pi-ask-user is installed; otherwise ask numbered options in chat
- MCPorter config path: .pi/compound-engineering/mcporter.json (project) or ~/.pi/agent/compound-engineering/mcporter.json (global)
`

export async function writePiBundle(outputRoot: string, bundle: PiBundle): Promise<void> {
  const paths = resolvePiPaths(outputRoot)

  await ensureDir(paths.skillsDir)
  await ensureDir(paths.promptsDir)
  await ensureDir(paths.extensionsDir)
  await ensureDir(paths.agentsDir)

  for (const prompt of bundle.prompts) {
    await writeText(path.join(paths.promptsDir, `${sanitizePathName(prompt.name)}.md`), prompt.content + "\n")
  }

  for (const skill of bundle.skillDirs) {
    await copySkillDir(skill.sourceDir, path.join(paths.skillsDir, sanitizePathName(skill.name)), transformContentForPi)
  }

  for (const skill of bundle.generatedSkills) {
    await writeText(path.join(paths.skillsDir, sanitizePathName(skill.name), "SKILL.md"), skill.content + "\n")
  }

  for (const agent of bundle.agents) {
    await writeText(path.join(paths.agentsDir, `${sanitizePathName(agent.name)}.md`), agent.content + "\n")
  }

  for (const extension of bundle.extensions) {
    await writeText(path.join(paths.extensionsDir, extension.name), extension.content + "\n")
  }

  if (bundle.mcporterConfig) {
    const backupPath = await backupFile(paths.mcporterConfigPath)
    if (backupPath) {
      console.log(`Backed up existing MCPorter config to ${backupPath}`)
    }
    await writeJson(paths.mcporterConfigPath, bundle.mcporterConfig)
  }

  await ensurePiAgentsBlock(paths.agentsPath)
}

function resolvePiPaths(outputRoot: string) {
  const base = path.basename(outputRoot)

  // Global install root: ~/.pi/agent
  if (base === "agent") {
    return {
      skillsDir: path.join(outputRoot, "skills"),
      promptsDir: path.join(outputRoot, "prompts"),
      extensionsDir: path.join(outputRoot, "extensions"),
      agentsDir: path.join(outputRoot, "agents"),
      mcporterConfigPath: path.join(outputRoot, "galeharness-cli", "mcporter.json"),
      agentsPath: path.join(outputRoot, "AGENTS.md"),
    }
  }

  // Project local .pi directory
  if (base === ".pi") {
    return {
      skillsDir: path.join(outputRoot, "skills"),
      promptsDir: path.join(outputRoot, "prompts"),
      extensionsDir: path.join(outputRoot, "extensions"),
      agentsDir: path.join(outputRoot, "agents"),
      mcporterConfigPath: path.join(outputRoot, "galeharness-cli", "mcporter.json"),
      agentsPath: path.join(outputRoot, "AGENTS.md"),
    }
  }

  // Custom output root -> nest under .pi
  return {
    skillsDir: path.join(outputRoot, ".pi", "skills"),
    promptsDir: path.join(outputRoot, ".pi", "prompts"),
    extensionsDir: path.join(outputRoot, ".pi", "extensions"),
    agentsDir: path.join(outputRoot, ".pi", "agents"),
    mcporterConfigPath: path.join(outputRoot, ".pi", "galeharness-cli", "mcporter.json"),
    agentsPath: path.join(outputRoot, "AGENTS.md"),
  }
}

async function ensurePiAgentsBlock(filePath: string): Promise<void> {
  const block = buildPiAgentsBlock()

  if (!(await pathExists(filePath))) {
    await writeText(filePath, block + "\n")
    return
  }

  const existing = await readText(filePath)
  const updated = upsertBlock(existing, block)
  if (updated !== existing) {
    await writeText(filePath, updated)
  }
}

function buildPiAgentsBlock(): string {
  return [PI_AGENTS_BLOCK_START, PI_AGENTS_BLOCK_BODY.trim(), PI_AGENTS_BLOCK_END].join("\n")
}

function upsertBlock(existing: string, block: string): string {
  const startIndex = existing.indexOf(PI_AGENTS_BLOCK_START)
  const endIndex = existing.indexOf(PI_AGENTS_BLOCK_END)

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).trimEnd()
    const after = existing.slice(endIndex + PI_AGENTS_BLOCK_END.length).trimStart()
    return [before, block, after].filter(Boolean).join("\n\n") + "\n"
  }

  if (existing.trim().length === 0) {
    return block + "\n"
  }

  return existing.trimEnd() + "\n\n" + block + "\n"
}
