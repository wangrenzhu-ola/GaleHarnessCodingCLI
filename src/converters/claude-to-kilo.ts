import { formatFrontmatter } from "../utils/frontmatter"
import { normalizeModelWithProvider } from "../utils/model"
import {
  type ClaudeAgent,
  type ClaudeCommand,
  type ClaudePlugin,
  type ClaudeMcpServer,
  filterSkillsByPlatform,
} from "../types/claude"
import type {
  KiloAgentFile,
  KiloBundle,
  KiloCommandFile,
  KiloMcpServer,
} from "../types/kilo"
import type { ClaudeToOpenCodeOptions } from "./claude-to-opencode"

export type ClaudeToKiloOptions = ClaudeToOpenCodeOptions

export function convertClaudeToKilo(
  plugin: ClaudePlugin,
  options: ClaudeToKiloOptions,
): KiloBundle {
  const agentFiles = plugin.agents.map((agent) => convertAgent(agent, options))
  const cmdFiles = convertCommands(plugin.commands)
  const mcpServers = plugin.mcpServers ? convertMcp(plugin.mcpServers) : {}

  return {
    agents: agentFiles,
    commandFiles: cmdFiles,
    skillDirs: filterSkillsByPlatform(plugin.skills, "kilo").map((skill) => ({
      sourceDir: skill.sourceDir,
      name: skill.name,
    })),
    mcpServers,
  }
}

function convertAgent(agent: ClaudeAgent, options: ClaudeToKiloOptions): KiloAgentFile {
  const frontmatter: Record<string, unknown> = {
    description: agent.description,
    mode: options.agentMode,
  }

  if (agent.model && agent.model !== "inherit") {
    frontmatter.model = normalizeModelWithProvider(agent.model)
  }

  if (options.inferTemperature) {
    const temp = inferTemperature(agent)
    if (temp !== undefined) {
      frontmatter.temperature = temp
    }
  }

  let body = transformContentForKilo(agent.body.trim())

  if (agent.capabilities && agent.capabilities.length > 0) {
    const capabilities = agent.capabilities.map((c) => `- ${c}`).join("\n")
    body = `## Capabilities\n${capabilities}\n\n${body}`
  }

  const content = formatFrontmatter(frontmatter, body)

  return {
    name: agent.name,
    content,
  }
}

function convertCommands(commands: ClaudeCommand[]): KiloCommandFile[] {
  return commands
    .filter((cmd) => !cmd.disableModelInvocation)
    .map((cmd) => {
      const frontmatter: Record<string, unknown> = {
        description: cmd.description,
      }

      if (cmd.model && cmd.model !== "inherit") {
        frontmatter.model = normalizeModelWithProvider(cmd.model)
      }

      const body = transformContentForKilo(cmd.body)
      const content = formatFrontmatter(frontmatter, body)

      return {
        name: cmd.name,
        content,
      }
    })
}

function convertMcp(
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

function inferTemperature(agent: ClaudeAgent): number | undefined {
  const text = `${agent.name} ${agent.description ?? ""}`.toLowerCase()
  if (text.includes("review") || text.includes("audit") || text.includes("security")) {
    return 0.1
  }
  if (text.includes("brainstorm") || text.includes("ideate") || text.includes("creative")) {
    return 0.7
  }
  return undefined
}

/**
 * Transform Claude Code content to Kilo-compatible content.
 *
 * 1. Path rewriting: .claude/ -> .kilo/, ~/.claude/ -> ~/.config/kilo/
 * 2. Slash command refs: /command-name -> invoked via /command-name
 */
export function transformContentForKilo(body: string): string {
  let result = body

  // Rewrite .claude/ paths to .kilo/
  result = result.replace(/(?<=^|\s|["'`])~\/\.claude\//gm, "~/.config/kilo/")
  result = result.replace(/(?<=^|\s|["'`])\.claude\//gm, ".kilo/")

  return result
}
