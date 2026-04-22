import path from "path"
import type { ClaudeHomeConfig } from "../parsers/claude-home"
import { convertMcp } from "../converters/claude-to-kilo"
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
      incoming: convertMcp(config.mcpServers),
    })
  }
}
