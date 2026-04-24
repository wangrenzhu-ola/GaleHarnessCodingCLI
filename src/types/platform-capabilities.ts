export type PlatformModelOverrideSupport = "field" | "global" | "none"

export type PlatformCapabilities = {
  can_spawn_agents: boolean
  model_override: PlatformModelOverrideSupport
}

export const DEFAULT_PLATFORM_CAPABILITIES: PlatformCapabilities = {
  can_spawn_agents: true,
  model_override: "field",
}

export const CLAUDE_PLATFORM_CAPABILITIES: PlatformCapabilities = {
  can_spawn_agents: true,
  model_override: "field",
}

export const CODEX_PLATFORM_CAPABILITIES: PlatformCapabilities = {
  can_spawn_agents: false,
  model_override: "global",
}
