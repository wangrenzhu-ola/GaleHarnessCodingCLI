import os from "os"
import path from "path"
import type { TargetScope } from "../targets"
import type { ClaudePlugin } from "../types/claude"

export function resolveTargetOutputRoot(options: {
  targetName: string
  outputRoot: string
  codexHome: string
  piHome: string
  claudeHome?: string
  openclawHome?: string
  qwenHome?: string
  qoderHome?: string
  traeHome?: string
  cursorHome?: string
  kimiHome?: string
  kiloHome?: string
  pluginName?: string
  plugin?: ClaudePlugin
  hasExplicitOutput: boolean
  scope?: TargetScope
}): string {
  const { targetName, outputRoot, codexHome, piHome, openclawHome, qwenHome, qoderHome, traeHome, cursorHome, kimiHome, kiloHome, pluginName, plugin, hasExplicitOutput, scope } = options
  if (targetName === "codex") return codexHome
  if (targetName === "pi") return piHome
  if (targetName === "droid") return path.join(os.homedir(), ".factory")
  if (targetName === "cursor") {
    return cursorHome ?? path.join(os.homedir(), ".cursor")
  }
  if (targetName === "gemini") {
    const base = hasExplicitOutput ? outputRoot : process.cwd()
    return path.join(base, ".gemini")
  }
  if (targetName === "copilot") {
    const base = hasExplicitOutput ? outputRoot : process.cwd()
    return path.join(base, ".github")
  }
  if (targetName === "kiro") {
    const base = hasExplicitOutput ? outputRoot : process.cwd()
    return path.join(base, ".kiro")
  }
  if (targetName === "windsurf") {
    if (hasExplicitOutput) return outputRoot
    if (scope === "global") return path.join(os.homedir(), ".codeium", "windsurf")
    return path.join(process.cwd(), ".windsurf")
  }
  if (targetName === "openclaw") {
    const home = openclawHome ?? path.join(os.homedir(), ".openclaw", "extensions")
    return path.join(home, pluginName ?? "plugin")
  }
  if (targetName === "qwen") {
    const home = qwenHome ?? path.join(os.homedir(), ".qwen", "extensions")
    return path.join(home, pluginName ?? "plugin")
  }
  if (targetName === "qoder") {
    return qoderHome ?? path.join(os.homedir(), ".qoder")
  }
  if (targetName === "trae") {
    return traeHome ?? path.join(os.homedir(), ".trae")
  }
  if (targetName === "kimi") {
    return kimiHome ?? path.join(os.homedir(), ".kimi")
  }
  if (targetName === "kilo") {
    if (kiloHome) return kiloHome
    const base = hasExplicitOutput ? outputRoot : process.cwd()
    return path.join(base, ".kilo")
  }
  if (targetName === "claude") {
    return options.claudeHome ?? path.join(os.homedir(), ".claude")
  }
  return outputRoot
}
