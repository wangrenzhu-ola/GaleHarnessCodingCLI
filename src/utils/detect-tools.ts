import os from "os"
import path from "path"
import { pathExists } from "./files"
import { syncTargets } from "../sync/registry"

export type DetectedTool = {
  name: string
  detected: boolean
  reason: string
}

export async function detectInstalledTools(
  home: string = os.homedir(),
  cwd: string = process.cwd(),
): Promise<DetectedTool[]> {
  const results: DetectedTool[] = []
  for (const target of syncTargets) {
    let detected = false
    let reason = "not found"
    for (const p of target.detectPaths(home, cwd)) {
      if (await pathExists(p)) {
        detected = true
        reason = `found ${p}`
        break
      }
    }
    results.push({ name: target.name, detected, reason })
  }

  // Claude is the native authoring format and is not a sync target,
  // but it should still be detected as an install destination.
  const claudeHome = path.join(home, ".claude")
  if (await pathExists(claudeHome)) {
    results.push({ name: "claude", detected: true, reason: `found ${claudeHome}` })
  }

  return results
}

export async function getDetectedTargetNames(
  home: string = os.homedir(),
  cwd: string = process.cwd(),
): Promise<string[]> {
  const tools = await detectInstalledTools(home, cwd)
  return tools.filter((t) => t.detected).map((t) => t.name)
}
