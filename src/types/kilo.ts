export type KiloAgentFile = {
  name: string
  content: string
}

export type KiloCommandFile = {
  name: string
  content: string
}

export type KiloSkillDir = {
  sourceDir: string
  name: string
}

export type KiloMcpServer = {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

export type KiloBundle = {
  agents: KiloAgentFile[]
  commandFiles: KiloCommandFile[]
  skillDirs: KiloSkillDir[]
  mcpServers: Record<string, KiloMcpServer>
}
