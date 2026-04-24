import type { ClaudeMcpServer } from "./claude"
import type { PlatformCapabilities } from "./platform-capabilities"
import type { CodexInvocationTargets } from "../utils/codex-content"

export type CodexPrompt = {
  name: string
  content: string
}

export type CodexSkillDir = {
  name: string
  sourceDir: string
}

export type CodexGeneratedSkill = {
  name: string
  content: string
  sidecarDirs?: CodexGeneratedSkillSidecarDir[]
}

export type CodexGeneratedSkillSidecarDir = {
  sourceDir: string
  targetName: string
}

export type CodexEmbeddedAgentInstruction = {
  name: string
  description?: string
  capabilities?: string[]
  body: string
}

export type CodexBundle = {
  prompts: CodexPrompt[]
  skillDirs: CodexSkillDir[]
  generatedSkills: CodexGeneratedSkill[]
  invocationTargets?: CodexInvocationTargets
  agentInstructions?: Record<string, CodexEmbeddedAgentInstruction>
  platformCapabilities?: PlatformCapabilities
  mcpServers?: Record<string, ClaudeMcpServer>
}
