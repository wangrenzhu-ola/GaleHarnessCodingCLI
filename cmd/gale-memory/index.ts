#!/usr/bin/env bun

import {
  captureTaskMemory,
  feedbackTaskMemory,
  startTaskMemory,
} from "../../src/memory/task-runtime.js"
import { skippedResult } from "../../src/memory/hkt-client.js"

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {}
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = "true"
        i += 1
      }
    } else {
      i += 1
    }
  }
  return flags
}

function parseCsv(value?: string): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []
}

function parseJsonObject(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)
  const flags = parseFlags(rest)
  const cwd = flags.cwd ?? process.cwd()
  const common = {
    cwd,
    skill: flags.skill ?? "gh:work",
    mode: flags.mode ?? "implement",
    inputSummary: flags["input-summary"] ?? flags.input ?? flags.title ?? "",
    artifactType: flags["artifact-type"],
    files: parseCsv(flags.files),
    project: flags.project,
    branch: flags.branch,
    taskId: flags["task-id"],
  }

  try {
    if (command === "start") {
      const result = await startTaskMemory({ ...common, phase: flags.phase ?? "start" })
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      return
    }

    if (command === "capture") {
      const result = await captureTaskMemory({
        ...common,
        phase: flags.phase ?? "capture",
        eventType: flags["event-type"] ?? flags.type ?? "follow_up",
        summary: flags.summary ?? common.inputSummary,
        payload: parseJsonObject(flags.payload),
      })
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      return
    }

    if (command === "feedback") {
      const result = await feedbackTaskMemory({
        ...common,
        label: flags.label ?? "useful",
        memoryId: flags["memory-id"],
        note: flags.note,
        source: flags.source,
      })
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      return
    }

    process.stdout.write(JSON.stringify(skippedResult("Usage: gale-memory <start|capture|feedback> [flags]")) + "\n")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stdout.write(JSON.stringify(skippedResult(message)) + "\n")
  }
}

main()
