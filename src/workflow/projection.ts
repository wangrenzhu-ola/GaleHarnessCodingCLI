import { Database } from "bun:sqlite"
import type { TaskEvent } from "../utils/sqlite-writer.js"

export interface WorkflowRunProjection {
  runId: string
  title?: string
  project?: string
  projectPath?: string
  skill?: string
  kind?: string
  status: "running" | "completed" | "failed" | "unknown"
  startedAt?: string
  endedAt?: string
  parentRunId?: string
  childRunIds: string[]
  siblingRunIds: string[]
  artifacts: WorkflowArtifactProjection[]
  reviewRoles: WorkflowReviewRoleProjection[]
  events: TaskEvent[]
}

export interface WorkflowArtifactProjection {
  artifactId?: string
  kind?: string
  path?: string
  url?: string
  title?: string
  nodeId?: string
}

export interface WorkflowReviewRoleProjection {
  role: string
  nodeId?: string
  status: "running" | "completed" | "failed" | "unknown"
  startedAt?: string
  endedAt?: string
}

export interface WorkflowRollupProjection {
  runId: string
  status: WorkflowRunProjection["status"]
  totalRuns: number
  completedRuns: number
  failedRuns: number
  runningRuns: number
  artifactCount: number
  reviewRoleCount: number
  children: WorkflowRollupProjection[]
}

function parseMetadata(event: TaskEvent): Record<string, unknown> {
  const raw = (event as TaskEvent & { metadata_json?: string }).metadata_json
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export function readWorkflowEventsFromPath(dbPath: string, runId?: string): TaskEvent[] {
  const db = new Database(dbPath, { readonly: true, create: false })
  try {
    if (runId) {
      return db.query("SELECT * FROM task_events WHERE task_id = $runId OR parent_task_id = $runId OR parent_run_id = $runId OR related_run_id = $runId ORDER BY timestamp ASC").all({ $runId: runId }) as TaskEvent[]
    }
    return db.query("SELECT * FROM task_events ORDER BY timestamp ASC").all() as TaskEvent[]
  } finally {
    db.close()
  }
}

export function projectWorkflowRuns(events: TaskEvent[]): WorkflowRunProjection[] {
  const runs = new Map<string, WorkflowRunProjection>()

  function getRun(runId: string): WorkflowRunProjection {
    const existing = runs.get(runId)
    if (existing) return existing
    const created: WorkflowRunProjection = {
      runId,
      status: "unknown",
      childRunIds: [],
      siblingRunIds: [],
      artifacts: [],
      reviewRoles: [],
      events: [],
    }
    runs.set(runId, created)
    return created
  }

  for (const event of events) {
    const ext = event as TaskEvent & Record<string, string | null | undefined>
    const run = getRun(event.task_id)
    run.events.push(event)
    run.project = run.project ?? event.project
    run.projectPath = run.projectPath ?? event.project_path
    run.skill = run.skill ?? event.skill
    run.title = run.title ?? event.title
    run.kind = run.kind ?? ext.run_type ?? undefined
    run.parentRunId = run.parentRunId ?? event.parent_task_id ?? ext.parent_run_id ?? undefined

    if (event.event_type === "skill_started" || event.event_type === "workflow_started") {
      run.status = "running"
      run.startedAt = run.startedAt ?? event.timestamp
    }
    if (event.event_type === "skill_completed" || event.event_type === "workflow_completed") {
      run.status = "completed"
      run.endedAt = event.timestamp
    }
    if (event.event_type === "skill_failed" || event.event_type === "workflow_failed") {
      run.status = "failed"
      run.endedAt = event.timestamp
    }

    if (event.event_type === "handoff_artifact_linked" || event.event_type === "memory_linked" || event.event_type === "pr_linked") {
      const metadata = parseMetadata(event)
      run.artifacts.push({
        artifactId: ext.artifact_id ?? event.memory_id ?? event.pr_url ?? undefined,
        kind: ext.artifact_type ?? (event.event_type === "memory_linked" ? "memory" : event.event_type === "pr_linked" ? "pr" : undefined),
        path: ext.artifact_path ?? undefined,
        url: ext.artifact_url ?? event.pr_url ?? undefined,
        title: ext.artifact_title ?? event.memory_title ?? event.title ?? undefined,
        nodeId: ext.node_id ?? (typeof metadata.nodeId === "string" ? metadata.nodeId : undefined),
      })
    }

    if (event.event_type === "review_role_started" || event.event_type === "review_role_completed") {
      const role = ext.review_role ?? ext.node_id ?? event.skill ?? "reviewer"
      let review = run.reviewRoles.find((item) => item.role === role)
      if (!review) {
        review = { role, nodeId: ext.node_id ?? undefined, status: "unknown" }
        run.reviewRoles.push(review)
      }
      if (event.event_type === "review_role_started") {
        review.status = "running"
        review.startedAt = review.startedAt ?? event.timestamp
      } else {
        review.status = "completed"
        review.endedAt = event.timestamp
      }
    }

    if (event.event_type === "run_relation_linked") {
      const relationType = ext.relation_type
      const relatedRunId = ext.related_run_id
      if (relatedRunId && relationType === "child" && !run.childRunIds.includes(relatedRunId)) run.childRunIds.push(relatedRunId)
      if (relatedRunId && relationType === "sibling" && !run.siblingRunIds.includes(relatedRunId)) run.siblingRunIds.push(relatedRunId)
      if (relatedRunId && relationType === "parent") getRun(relatedRunId).childRunIds.push(run.runId)
    }
  }

  for (const run of runs.values()) {
    if (run.parentRunId) {
      const parent = getRun(run.parentRunId)
      if (!parent.childRunIds.includes(run.runId)) parent.childRunIds.push(run.runId)
    }
  }

  return [...runs.values()].sort((a, b) => (a.startedAt ?? "").localeCompare(b.startedAt ?? ""))
}

export function rollupWorkflowRun(runId: string, runs: WorkflowRunProjection[]): WorkflowRollupProjection {
  const byId = new Map(runs.map((run) => [run.runId, run]))
  const seen = new Set<string>()

  function build(id: string): WorkflowRollupProjection {
    const run = byId.get(id) ?? { runId: id, status: "unknown", childRunIds: [], siblingRunIds: [], artifacts: [], reviewRoles: [], events: [] } as WorkflowRunProjection
    if (seen.has(id)) {
      return { runId: id, status: run.status, totalRuns: 0, completedRuns: 0, failedRuns: 0, runningRuns: 0, artifactCount: 0, reviewRoleCount: 0, children: [] }
    }
    seen.add(id)
    const children = run.childRunIds.map(build)
    return {
      runId: id,
      status: run.status,
      totalRuns: 1 + children.reduce((sum, child) => sum + child.totalRuns, 0),
      completedRuns: (run.status === "completed" ? 1 : 0) + children.reduce((sum, child) => sum + child.completedRuns, 0),
      failedRuns: (run.status === "failed" ? 1 : 0) + children.reduce((sum, child) => sum + child.failedRuns, 0),
      runningRuns: (run.status === "running" ? 1 : 0) + children.reduce((sum, child) => sum + child.runningRuns, 0),
      artifactCount: run.artifacts.length + children.reduce((sum, child) => sum + child.artifactCount, 0),
      reviewRoleCount: run.reviewRoles.length + children.reduce((sum, child) => sum + child.reviewRoleCount, 0),
      children,
    }
  }

  return build(runId)
}
