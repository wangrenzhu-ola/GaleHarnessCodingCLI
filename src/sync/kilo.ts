import path from "path"
import type { ClaudeHomeConfig } from "../parsers/claude-home"
import type { ClaudeMcpServer } from "../types/claude"
import type { KiloMcpServer } from "../types/kilo"
import { syncKiloCommands } from "./commands"
import { mergeJsonConfigAtKey } from "./json-config"
import { syncSkills } from "./skills"

export async function syncToKilo(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  await syncSkills(config.skills, path.join(outputRoot, "skills"))
  await syncKiloCommands(config, outputRoot)

  if (Object.keys(config.mcpServers).length > 0) {
    await mergeJsonConfigAtKey({
      configPath: path.join(outputRoot, "kilo.json"),
      key: "mcpServers",
      incoming: convertMcpForKilo(config.mcpServers),
    })
  }
}

function convertMcpForKilo(
  servers: Record<string, ClaudeMcpServer>,
): Record<string, KiloMcpServer> {
  const result: Record<string, KiloMcpServer> = {}

  for (const [name, server] of Object.entries(servers)) {
    if (server.command) {
      result[name] = {
        command: server.command,
        args: server.args,
        env: server.env,
      }
      continue
    }

    if (server.url) {
      result[name] = {
        url: server.url,
        headers: server.headers,
      }
    }
  }

  return result
}
