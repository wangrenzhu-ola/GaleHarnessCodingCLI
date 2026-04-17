import path from "path"
import type { ClaudeHomeConfig } from "../parsers/claude-home"
import { sanitizePathName, writeText } from "../utils/files"
import { syncSkills } from "./skills"

export async function syncToQoder(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  await syncSkills(config.skills, path.join(outputRoot, "skills"))
  await syncQoderCommands(config, outputRoot)

  if (Object.keys(config.mcpServers).length > 0) {
    console.warn(
      "Warning: Qoder MCP sync is skipped because Qoder does not yet document an MCP server config contract.",
    )
  }
}

async function syncQoderCommands(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  if (!config.commands || config.commands.length === 0) return

  const commandsDir = path.join(outputRoot, "commands")
  for (const cmd of config.commands) {
    const frontmatterLines: string[] = []
    frontmatterLines.push("---")
    frontmatterLines.push(`name: ${cmd.name}`)
    if (cmd.description) {
      frontmatterLines.push(`description: ${cmd.description}`)
    }
    frontmatterLines.push("---")

    const content = frontmatterLines.join("\n") + "\n\n" + cmd.body
    const safeName = sanitizePathName(cmd.name)
    await writeText(path.join(commandsDir, `${safeName}.md`), content + "\n")
  }
}
