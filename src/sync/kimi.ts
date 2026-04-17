import path from "path"
import type { ClaudeHomeConfig } from "../parsers/claude-home"
import type { ClaudeMcpServer } from "../types/claude"
import { mergeJsonConfigAtKey } from "./json-config"
import { syncSkills } from "./skills"

export async function syncToKimi(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  await syncSkills(config.skills, path.join(outputRoot, "skills"))

  if (config.commands && config.commands.length > 0) {
    console.warn(
      "Warning: Kimi personal command sync is skipped because Kimi currently uses skills (skill:xxx) as its primary command surface.",
    )
  }

  if (Object.keys(config.mcpServers).length > 0) {
    const mcpPath = path.join(outputRoot, "mcp.json")
    const converted = convertMcpForKimi(config.mcpServers)
    await mergeJsonConfigAtKey({
      configPath: mcpPath,
      key: "mcpServers",
      incoming: converted,
    })
  }
}

function convertMcpForKimi(
  servers: Record<string, ClaudeMcpServer>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [name, server] of Object.entries(servers)) {
    if (server.command) {
      const entry: Record<string, unknown> = {
        command: server.command,
      }
      if (server.args && server.args.length > 0) {
        entry.args = server.args
      }
      if (server.env && Object.keys(server.env).length > 0) {
        entry.env = server.env
      }
      result[name] = entry
    } else if (server.url) {
      const entry: Record<string, unknown> = {
        url: server.url,
      }
      if (server.headers && Object.keys(server.headers).length > 0) {
        entry.headers = server.headers
      }
      result[name] = entry
    }
  }
  return result
}
