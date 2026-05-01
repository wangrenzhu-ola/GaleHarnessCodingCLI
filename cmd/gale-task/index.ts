import { spawn } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "path"
import { appendEvent, DB_PATH, type TaskEvent } from "../../src/utils/sqlite-writer.js"
import { projectWorkflowRuns, readWorkflowEventsFromPath, rollupWorkflowRun } from "../../src/workflow/projection.js"
import { validateWorkflowBundle } from "../../src/workflow/validators.js"
import { readCurrentTask, writeCurrentTask } from "./context.js"

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

function optionalJson(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    JSON.parse(value)
    return value
  } catch {
    return JSON.stringify({ value })
  }
}

function applyWorkflowFlags(event: TaskEvent, flags: Record<string, string>): TaskEvent {
  const metadata = optionalJson(flags["metadata-json"] ?? flags["metadata"])
  return {
    ...event,
    ...(flags["run-type"] !== undefined ? { run_type: flags["run-type"] } : {}),
    ...(flags["parent-run-id"] !== undefined ? { parent_run_id: flags["parent-run-id"] } : {}),
    ...(flags["related-run-id"] !== undefined ? { related_run_id: flags["related-run-id"] } : {}),
    ...(flags["relation-type"] !== undefined ? { relation_type: flags["relation-type"] } : {}),
    ...(flags["node-id"] !== undefined ? { node_id: flags["node-id"] } : {}),
    ...(flags["review-role"] !== undefined ? { review_role: flags["review-role"] } : {}),
    ...(flags["artifact-id"] !== undefined ? { artifact_id: flags["artifact-id"] } : {}),
    ...(flags["artifact-type"] !== undefined ? { artifact_type: flags["artifact-type"] } : {}),
    ...(flags["artifact-path"] !== undefined ? { artifact_path: flags["artifact-path"] } : {}),
    ...(flags["artifact-url"] !== undefined ? { artifact_url: flags["artifact-url"] } : {}),
    ...(flags["artifact-title"] !== undefined ? { artifact_title: flags["artifact-title"] } : {}),
    ...(metadata !== undefined ? { metadata_json: metadata } : {}),
  }
}

function isWorkflowEvent(eventType: string): boolean {
  return eventType.startsWith("workflow_")
    || eventType.startsWith("review_role_")
    || eventType === "handoff_artifact_linked"
    || eventType === "run_relation_linked"
}

function spawnCapture(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    let stdout = ""
    const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString() })
    proc.on("error", () => resolve(""))
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout.trim())
      else resolve("")
    })
  })
}

function extractRepoName(remoteUrl: string): string {
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
  return {
    project: remoteUrl ? extractRepoName(remoteUrl) : path.basename(cwd),
    project_path: toplevel || cwd,
  }
}

async function outputProjection(command: string, argv: string[]): Promise<void> {
  const flags = parseFlags(argv)
  const dbPath = flags["db"] ?? DB_PATH
  const runId = flags["run-id"] ?? flags["task-id"]
  const events = readWorkflowEventsFromPath(dbPath, runId)
  if (command === "events") {
    process.stdout.write(JSON.stringify(events, null, 2) + "\n")
    return
  }
  const runs = projectWorkflowRuns(events)
  if (command === "graph") {
    process.stdout.write(JSON.stringify(runs, null, 2) + "\n")
    return
  }
  if (!runId) {
    process.stderr.write("Usage: gale-task rollup --run-id <id> [--db <path>]\n")
    process.exit(0)
    return
  }
  process.stdout.write(JSON.stringify(rollupWorkflowRun(runId, runs), null, 2) + "\n")
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)

  try {
    if (argv[0] === "events" || argv[0] === "graph" || argv[0] === "rollup") {
      await outputProjection(argv[0], argv.slice(1))
      return
    }

    if (argv[0] === "validate") {
      const flags = parseFlags(argv.slice(1))
      if (!flags.file) {
        process.stderr.write("Usage: gale-task validate --file <workflow-bundle.json>\n")
        process.exit(0)
        return
      }
      const input = JSON.parse(await readFile(flags.file, "utf8")) as Parameters<typeof validateWorkflowBundle>[0]
      const result = validateWorkflowBundle(input)
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      process.exit(result.valid ? 0 : 1)
      return
    }

    if (argv[0] !== "log" || !argv[1]) {
      process.stderr.write("Usage: gale-task log <event_type> [--skill <name>] [...flags]\n")
      process.exit(0)
      return
    }

    const eventType = argv[1]
    const flags = parseFlags(argv.slice(2))
    const skill = flags["skill"] ?? ""
    const title = flags["title"]
    const error = flags["error"]
    const flagTaskId = flags["task-id"] ?? flags["run-id"]
    const timestamp = new Date().toISOString()

    if (eventType === "skill_started") {
      const existingTask = await readCurrentTask()
      const taskId = flagTaskId ?? crypto.randomUUID()
      const { project, project_path } = await detectProject()
      await writeCurrentTask({ task_id: taskId, started_at: timestamp, skill })
      const event = applyWorkflowFlags({
        task_id: taskId,
        event_type: "skill_started",
        timestamp,
        project,
        project_path,
        skill,
        ...(title !== undefined ? { title } : {}),
        ...(existingTask?.task_id !== undefined ? { parent_task_id: existingTask.task_id } : {}),
      }, flags)
      await appendEvent(event)
      process.stdout.write(taskId + "\n")
      return
    }

    if (eventType === "skill_completed" || eventType === "skill_failed" || eventType === "memory_linked" || eventType === "pr_linked" || isWorkflowEvent(eventType)) {
      const currentTask = await readCurrentTask()
      const taskId = flagTaskId ?? currentTask?.task_id ?? (isWorkflowEvent(eventType) ? crypto.randomUUID() : undefined)
      const resolvedSkill = skill || (currentTask?.skill ?? "")
      if (!taskId) {
        process.stderr.write(`[gale-task] No task_id available for event: ${eventType}\n`)
        process.exit(0)
        return
      }
      const { project, project_path } = await detectProject()
      const base: TaskEvent = {
        task_id: taskId,
        event_type: eventType as TaskEvent["event_type"],
        timestamp,
        project,
        project_path,
        skill: resolvedSkill,
        ...(title !== undefined ? { title } : {}),
        ...(error !== undefined ? { error } : {}),
        ...(flags["memory-id"] !== undefined ? { memory_id: flags["memory-id"] } : {}),
        ...(flags["memory-title"] !== undefined ? { memory_title: flags["memory-title"] } : {}),
        ...(flags["pr-url"] !== undefined ? { pr_url: flags["pr-url"] } : {}),
        ...(flags["pr-number"] !== undefined ? { pr_number: flags["pr-number"] } : {}),
      }
      await appendEvent(applyWorkflowFlags(base, flags))
      return
    }

    process.stderr.write("[gale-task] Unknown event_type: " + eventType + "\n")
    process.exit(0)
  } catch (err) {
    process.stderr.write("[gale-task] Unexpected error: " + (err instanceof Error ? err.message : String(err)) + "\n")
    process.exit(0)
  }
}

main()
