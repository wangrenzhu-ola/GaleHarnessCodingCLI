import type { ClaudePlugin } from "../types/claude"
import { convertClaudeToOpenCode, type ClaudeToOpenCodeOptions } from "../converters/claude-to-opencode"
import { convertClaudeToCodex } from "../converters/claude-to-codex"
import { convertClaudeToDroid } from "../converters/claude-to-droid"
import { convertClaudeToPi } from "../converters/claude-to-pi"
import { convertClaudeToCopilot } from "../converters/claude-to-copilot"
import { convertClaudeToGemini } from "../converters/claude-to-gemini"
import { convertClaudeToKiro } from "../converters/claude-to-kiro"
import { convertClaudeToWindsurf } from "../converters/claude-to-windsurf"
import { convertClaudeToOpenClaw } from "../converters/claude-to-openclaw"
import { convertClaudeToQwen } from "../converters/claude-to-qwen"
import { convertClaudeToClaude } from "../converters/claude-to-claude"
import { convertClaudeToKimi } from "../converters/claude-to-kimi"
import { convertClaudeToQoder } from "../converters/claude-to-qoder"
import { convertClaudeToTrae } from "../converters/claude-to-trae"
import { convertClaudeToCursor } from "../converters/claude-to-cursor"
import { convertClaudeToKilo } from "../converters/claude-to-kilo"
import { writeOpenCodeBundle } from "./opencode"
import { writeCodexBundle } from "./codex"
import { writeDroidBundle } from "./droid"
import { writePiBundle } from "./pi"
import { writeCopilotBundle } from "./copilot"
import { writeGeminiBundle } from "./gemini"
import { writeKiroBundle } from "./kiro"
import { writeWindsurfBundle } from "./windsurf"
import { writeOpenClawBundle } from "./openclaw"
import { writeQwenBundle } from "./qwen"
import { writeClaudeBundle } from "./claude"
import { writeKimiBundle } from "./kimi"
import { writeQoderBundle } from "./qoder"
import { writeTraeBundle } from "./trae"
import { writeCursorBundle } from "./cursor"
import { writeKiloBundle } from "./kilo"
import {
  CLAUDE_PLATFORM_CAPABILITIES,
  CODEX_PLATFORM_CAPABILITIES,
  DEFAULT_PLATFORM_CAPABILITIES,
  type PlatformCapabilities,
} from "../types/platform-capabilities"

export type TargetScope = "global" | "workspace"

export function isTargetScope(value: string): value is TargetScope {
  return value === "global" || value === "workspace"
}

/**
 * Validate a --scope flag against a target's supported scopes.
 * Returns the resolved scope (explicit or default) or throws on invalid input.
 */
export function validateScope(
  targetName: string,
  target: TargetHandler,
  scopeArg: string | undefined,
): TargetScope | undefined {
  if (scopeArg === undefined) return target.defaultScope

  if (!target.supportedScopes) {
    throw new Error(`Target "${targetName}" does not support the --scope flag.`)
  }
  if (!isTargetScope(scopeArg) || !target.supportedScopes.includes(scopeArg)) {
    throw new Error(`Target "${targetName}" does not support --scope ${scopeArg}. Supported: ${target.supportedScopes.join(", ")}`)
  }
  return scopeArg
}

export type TargetHandler<TBundle = unknown> = {
  name: string
  implemented: boolean
  /** Default scope when --scope is not provided. Only meaningful when supportedScopes is defined. */
  defaultScope?: TargetScope
  /** Valid scope values. If absent, the --scope flag is rejected for this target. */
  supportedScopes?: TargetScope[]
  capabilities?: PlatformCapabilities
  convert: (plugin: ClaudePlugin, options: ClaudeToOpenCodeOptions) => TBundle | null
  write: (outputRoot: string, bundle: TBundle, scope?: TargetScope) => Promise<void>
}

export function resolveTargetCapabilities(target: Pick<TargetHandler, "capabilities">): PlatformCapabilities {
  return target.capabilities ?? DEFAULT_PLATFORM_CAPABILITIES
}

export const targets: Record<string, TargetHandler> = {
  claude: {
    name: "claude",
    implemented: true,
    capabilities: CLAUDE_PLATFORM_CAPABILITIES,
    convert: convertClaudeToClaude as TargetHandler["convert"],
    write: writeClaudeBundle as TargetHandler["write"],
  },
  opencode: {
    name: "opencode",
    implemented: true,
    convert: convertClaudeToOpenCode,
    write: writeOpenCodeBundle as TargetHandler["write"],
  },
  codex: {
    name: "codex",
    implemented: true,
    capabilities: CODEX_PLATFORM_CAPABILITIES,
    convert: convertClaudeToCodex as TargetHandler["convert"],
    write: writeCodexBundle as TargetHandler["write"],
  },
  droid: {
    name: "droid",
    implemented: true,
    convert: convertClaudeToDroid as TargetHandler["convert"],
    write: writeDroidBundle as TargetHandler["write"],
  },
  pi: {
    name: "pi",
    implemented: true,
    convert: convertClaudeToPi as TargetHandler["convert"],
    write: writePiBundle as TargetHandler["write"],
  },
  copilot: {
    name: "copilot",
    implemented: true,
    convert: convertClaudeToCopilot as TargetHandler["convert"],
    write: writeCopilotBundle as TargetHandler["write"],
  },
  gemini: {
    name: "gemini",
    implemented: true,
    convert: convertClaudeToGemini as TargetHandler["convert"],
    write: writeGeminiBundle as TargetHandler["write"],
  },
  kiro: {
    name: "kiro",
    implemented: true,
    convert: convertClaudeToKiro as TargetHandler["convert"],
    write: writeKiroBundle as TargetHandler["write"],
  },
  windsurf: {
    name: "windsurf",
    implemented: true,
    defaultScope: "global",
    supportedScopes: ["global", "workspace"],
    convert: convertClaudeToWindsurf as TargetHandler["convert"],
    write: writeWindsurfBundle as TargetHandler["write"],
  },
  openclaw: {
    name: "openclaw",
    implemented: true,
    convert: convertClaudeToOpenClaw as TargetHandler["convert"],
    write: writeOpenClawBundle as TargetHandler["write"],
  },
  qwen: {
    name: "qwen",
    implemented: true,
    convert: convertClaudeToQwen as TargetHandler["convert"],
    write: writeQwenBundle as TargetHandler["write"],
  },
  kimi: {
    name: "kimi",
    implemented: true,
    convert: convertClaudeToKimi as TargetHandler["convert"],
    write: writeKimiBundle as TargetHandler["write"],
  },
  qoder: {
    name: "qoder",
    implemented: true,
    convert: convertClaudeToQoder as TargetHandler["convert"],
    write: writeQoderBundle as TargetHandler["write"],
  },
  trae: {
    name: "trae",
    implemented: true,
    convert: convertClaudeToTrae as TargetHandler["convert"],
    write: writeTraeBundle as TargetHandler["write"],
  },
  cursor: {
    name: "cursor",
    implemented: true,
    convert: convertClaudeToCursor as TargetHandler["convert"],
    write: writeCursorBundle as TargetHandler["write"],
  },
  kilo: {
    name: "kilo",
    implemented: true,
    defaultScope: "workspace",
    convert: convertClaudeToKilo as TargetHandler["convert"],
    write: writeKiloBundle as TargetHandler["write"],
  },
}
