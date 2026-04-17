/**
 * gale-task CLI entry point
 *
 * Usage:
 *   gale-task log <event_type> [flags]
 *
 * Supported event types:
 *   skill_started   --skill <name> [--title <title>] [--task-id <id>]
 *   skill_completed --skill <name> [--title <title>] [--task-id <id>]
 *   skill_failed    --skill <name> [--error <msg>]   [--task-id <id>]
 *   memory_linked   --skill <name> [--memory-id <id>] [--memory-title <t>] [--task-id <id>]
 *   pr_linked       --skill <name> [--pr-url <url>] [--pr-number <n>]      [--task-id <id>]
 *
 * Contract: all errors are caught, logged to stderr, process.exit(0).
 * The writer MUST never block skills.
 */

import { spawn } from "node:child_process"
import path from "path"
import { appendEvent, type TaskEvent } from "../../src/utils/task-writer.js"
import { readCurrentTask, writeCurrentTask, CONTEXT_FILE } from "./context.js"

// ---------------------------------------------------------------------------
// Arg parsing helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function spawnCapture(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString() })
    proc.on("error", () => resolve(""))
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout.trim())
      else resolve("")
    })
  })
}

function extractRepoName(remoteUrl: string): string {
  // Handle various URL formats:
  //   git@github.com:org/repo.git
  //   https://github.com/org/repo.git
  //   https://github.com/org/repo
  try {
    const cleaned = remoteUrl.replace(/\.git$/, "")
    const parts = cleaned.split(/[/:]/g)
    const last = parts[parts.length - 1]
    return last || path.basename(process.cwd())
  } catch {
    return path.basename(process.cwd())
  }
}

async function detectProject(): Promise<{ project: string; project_path: string }> {
  const cwd = process.cwd()

  const [remoteUrl, toplevel] = await Promise.all([
    spawnCapture("git", ["remote", "get-url", "origin"], cwd),
    spawnCapture("git", ["rev-parse", "--show-toplevel"], cwd),
  ])

  const project = remoteUrl ? extractRepoName(remoteUrl) : path.basename(cwd)
  const project_path = toplevel || cwd

  return { project, project_path }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2)

  // Expect: log <event_type> [flags]
  if (argv[0] !== "log" || !argv[1]) {
    process.stderr.write("Usage: gale-task log <event_type> [--skill <name>] [...flags]\n")
    process.exit(0)
    return
  }

  const eventType = argv[1] as string
  const flags = parseFlags(argv.slice(2))

  const skill = flags["skill"] ?? ""
  const title = flags["title"]
  const error = flags["error"]
  const memoryId = flags["memory-id"]
  const memoryTitle = flags["memory-title"]
  const prUrl = flags["pr-url"]
  const prNumber = flags["pr-number"]
  const flagTaskId = flags["task-id"]

  const timestamp = new Date().toISOString()

  try {
    if (eventType === "skill_started") {
      // ------------------------------------------------------------------
      // skill_started: generate new task_id, detect project, chain parent
      // ------------------------------------------------------------------
      const existingTask = await readCurrentTask()
      const parentTaskId = existingTask?.task_id ?? undefined

      const taskId = flagTaskId ?? crypto.randomUUID()
      const { project, project_path } = await detectProject()

      // Write new current-task.json in the working project
      await writeCurrentTask({
        task_id: taskId,
        started_at: timestamp,
        skill,
      })

      const event: TaskEvent = {
        task_id: taskId,
        event_type: "skill_started",
        timestamp,
        project,
        project_path,
        skill,
        ...(title !== undefined ? { title } : {}),
        ...(parentTaskId !== undefined ? { parent_task_id: parentTaskId } : {}),
      }

      await appendEvent(event)

      // Print the generated task_id to stdout for callers to capture
      process.stdout.write(taskId + "\n")

    } else if (eventType === "skill_completed" || eventType === "skill_failed") {
      // ------------------------------------------------------------------
      // skill_completed / skill_failed: resolve task_id from context if needed
      // ------------------------------------------------------------------
      const currentTask = await readCurrentTask()
      const taskId = flagTaskId ?? currentTask?.task_id
      const resolvedSkill = skill || (currentTask?.skill ?? "")

      if (!taskId) {
        process.stderr.write("[gale-task] No task_id available for event: " + eventType + "\n")
        process.exit(0)
        return
      }

      const { project, project_path } = await detectProject()

      let event: TaskEvent
      if (eventType === "skill_completed") {
        event = {
          task_id: taskId,
          event_type: "skill_completed",
          timestamp,
          project,
          project_path,
          skill: resolvedSkill,
          ...(title !== undefined ? { title } : {}),
        }
      } else {
        event = {
          task_id: taskId,
          event_type: "skill_failed",
          timestamp,
          project,
          project_path,
          skill: resolvedSkill,
          ...(error !== undefined ? { error } : {}),
        }
      }

      await appendEvent(event)

    } else if (eventType === "memory_linked") {
      // ------------------------------------------------------------------
      // memory_linked
      // ------------------------------------------------------------------
      const currentTask = await readCurrentTask()
      const taskId = flagTaskId ?? currentTask?.task_id
      const resolvedSkill = skill || (currentTask?.skill ?? "")

      if (!taskId) {
        process.stderr.write("[gale-task] No task_id available for event: memory_linked\n")
        process.exit(0)
        return
      }

      const { project, project_path } = await detectProject()

      const event: TaskEvent = {
        task_id: taskId,
        event_type: "memory_linked",
        timestamp,
        project,
        project_path,
        skill: resolvedSkill,
        ...(memoryId !== undefined ? { memory_id: memoryId } : {}),
        ...(memoryTitle !== undefined ? { memory_title: memoryTitle } : {}),
      }

      await appendEvent(event)

    } else if (eventType === "pr_linked") {
      // ------------------------------------------------------------------
      // pr_linked
      // ------------------------------------------------------------------
      const currentTask = await readCurrentTask()
      const taskId = flagTaskId ?? currentTask?.task_id
      const resolvedSkill = skill || (currentTask?.skill ?? "")

      if (!taskId) {
        process.stderr.write("[gale-task] No task_id available for event: pr_linked\n")
        process.exit(0)
        return
      }

      const { project, project_path } = await detectProject()

      const event: TaskEvent = {
        task_id: taskId,
        event_type: "pr_linked",
        timestamp,
        project,
        project_path,
        skill: resolvedSkill,
        ...(prUrl !== undefined ? { pr_url: prUrl } : {}),
        ...(prNumber !== undefined ? { pr_number: prNumber } : {}),
      }

      await appendEvent(event)

    } else {
      process.stderr.write("[gale-task] Unknown event_type: " + eventType + "\n")
      process.exit(0)
    }
  } catch (err) {
    process.stderr.write(
      "[gale-task] Unexpected error: " + (err instanceof Error ? err.message : String(err)) + "\n",
    )
    process.exit(0)
  }
}

main()
