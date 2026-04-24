import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { HktClient, type HktTaskResult } from "./hkt-client.js"

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export interface CurrentTask {
  task_id: string
  started_at: string
  skill: string
}

export interface ProjectContext {
  project: string
  repo_root: string
  branch: string
}

export interface TaskEnvelope {
  schema_version: "gale-task-memory.v1"
  project: string
  repo_root: string
  branch: string
  task_id: string
  skill: string
  phase: string
  mode: string
  pr_id: string | null
  issue_id: string | null
  input_summary: string
  artifact_type: string
  files: string[]
  verification: Record<string, unknown>
  confidence: string
  extensions: Record<string, unknown>
}

export interface BuildEnvelopeOptions {
  cwd?: string
  contextFile?: string
  project?: string
  repoRoot?: string
  branch?: string
  taskId?: string
  skill: string
  phase?: string
  mode?: string
  inputSummary?: string
  artifactType?: string
  files?: string[]
  verification?: Record<string, unknown>
  confidence?: string
  prId?: string | null
  issueId?: string | null
  capturePolicy?: string[]
}

export interface CaptureOptions extends BuildEnvelopeOptions {
  eventType: string
  summary?: string
  payload?: Record<string, unknown>
}

export async function buildTaskEnvelope(options: BuildEnvelopeOptions): Promise<TaskEnvelope> {
  const cwd = options.cwd ?? process.cwd()
  const context = await detectProjectContext(cwd, options)
  const currentTask = await readCurrentTask(options.contextFile ?? currentTaskPath(cwd))
  const taskId = options.taskId ?? currentTask?.task_id ?? deterministicLineageTaskId(context)

  return {
    schema_version: "gale-task-memory.v1",
    project: context.project,
    repo_root: context.repo_root,
    branch: context.branch,
    task_id: taskId,
    skill: options.skill,
    phase: options.phase ?? "start",
    mode: options.mode ?? "implement",
    pr_id: options.prId ?? null,
    issue_id: options.issueId ?? null,
    input_summary: options.inputSummary ?? "",
    artifact_type: options.artifactType ?? `${options.skill.replace(/^gh:/, "")}_session`,
    files: options.files ?? [],
    verification: options.verification ?? { status: "unknown" },
    confidence: options.confidence ?? "unknown",
    extensions: {
      gale: {
        capture_policy: options.capturePolicy ?? defaultCapturePolicy(options.skill),
        lineage_hints: {
          source: currentTask ? "current-task" : "branch",
        },
      },
    },
  }
}

export async function startTaskMemory(
  options: BuildEnvelopeOptions,
  client: Pick<HktClient, "taskRecall"> = new HktClient({ cwd: options.cwd }),
): Promise<{ envelope: TaskEnvelope; recall: HktTaskResult }> {
  const envelope = await buildTaskEnvelope({ ...options, phase: options.phase ?? "start" })
  const recall = await client.taskRecall(envelope)
  return { envelope, recall }
}

export async function captureTaskMemory(
  options: CaptureOptions,
  client: Pick<HktClient, "taskCapture"> = new HktClient({ cwd: options.cwd }),
): Promise<{ event: Record<string, unknown>; capture: HktTaskResult }> {
  const envelope = await buildTaskEnvelope(options)
  const event = {
    ...envelope,
    event_type: options.eventType,
    phase: options.phase ?? "capture",
    summary: options.summary ?? options.inputSummary ?? "",
    payload: options.payload ?? {},
  }
  const capture = await client.taskCapture(event)
  if (capture.success && capture.durable_memory_id && capture.memory_link_required !== false) {
    await logMemoryLinked({
      cwd: options.cwd ?? process.cwd(),
      skill: envelope.skill,
      memoryId: String(capture.durable_memory_id),
      taskId: envelope.task_id,
    })
  }
  return { event, capture }
}

export async function feedbackTaskMemory(
  options: BuildEnvelopeOptions & { label: string; memoryId?: string; note?: string; source?: string },
  client: Pick<HktClient, "taskCapture"> = new HktClient({ cwd: options.cwd }),
): Promise<{ event: Record<string, unknown>; capture: HktTaskResult }> {
  return captureTaskMemory(
    {
      ...options,
      eventType: "feedback",
      phase: "feedback",
      summary: `memory feedback: ${options.label}`,
      payload: {
        label: options.label,
        memory_id: options.memoryId,
        note: options.note,
        source: options.source,
      },
    },
    client,
  )
}

async function readCurrentTask(filePath: string): Promise<CurrentTask | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as CurrentTask
    if (!parsed.task_id || !parsed.started_at || !parsed.skill) return null
    const started = new Date(parsed.started_at).getTime()
    if (Number.isNaN(started)) return null
    if (Date.now() - started > TWENTY_FOUR_HOURS_MS) return null
    return parsed
  } catch {
    return null
  }
}

function currentTaskPath(cwd: string): string {
  return path.join(cwd, ".context", "galeharness-cli", "current-task.json")
}

async function detectProjectContext(cwd: string, options: BuildEnvelopeOptions): Promise<ProjectContext> {
  const [remoteUrl, repoRoot, branch] = await Promise.all([
    options.project ? Promise.resolve("") : spawnCapture("git", ["remote", "get-url", "origin"], cwd),
    options.repoRoot ? Promise.resolve(options.repoRoot) : spawnCapture("git", ["rev-parse", "--show-toplevel"], cwd),
    options.branch ? Promise.resolve(options.branch) : spawnCapture("git", ["branch", "--show-current"], cwd),
  ])

  return {
    project: options.project ?? extractRepoName(remoteUrl) ?? path.basename(cwd),
    repo_root: options.repoRoot ?? (repoRoot || cwd),
    branch: options.branch ?? (branch || "unknown"),
  }
}

function deterministicLineageTaskId(context: ProjectContext): string {
  const basis = `${context.project}:${context.branch || "unknown"}`
  const sanitized = basis.toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").slice(0, 96)
  return sanitized ? `branch:${sanitized}` : `task:${randomUUID()}`
}

function extractRepoName(remoteUrl: string): string | null {
  if (!remoteUrl) return null
  const cleaned = remoteUrl.replace(/\.git$/, "")
  const parts = cleaned.split(/[/:]/g).filter(Boolean)
  return parts[parts.length - 1] ?? null
}

function defaultCapturePolicy(skill: string): string[] {
  if (skill === "gh:debug") {
    return ["failed_attempt", "root_cause", "verification_result", "handoff_state", "next_action"]
  }
  if (skill === "gh:review") return ["code_review_finding", "verification_result", "follow_up"]
  if (skill === "gh:work") return ["decision", "verification_result", "follow_up"]
  return ["decision", "follow_up", "verification_result"]
}

function spawnCapture(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    let stdout = ""
    const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "ignore"] })
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    proc.on("error", () => resolve(""))
    proc.on("close", (code) => resolve(code === 0 ? stdout.trim() : ""))
  })
}

async function logMemoryLinked(options: { cwd: string; skill: string; memoryId: string; taskId: string }): Promise<void> {
  await new Promise<void>((resolve) => {
    const proc = spawn(
      "gale-task",
      [
        "log",
        "memory_linked",
        "--skill",
        options.skill,
        "--memory-id",
        options.memoryId,
        "--task-id",
        options.taskId,
      ],
      { cwd: options.cwd, stdio: "ignore" },
    )
    proc.on("error", () => resolve())
    proc.on("close", () => resolve())
  })
}
