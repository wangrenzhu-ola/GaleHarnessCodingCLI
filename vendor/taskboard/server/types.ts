export type TaskStatus = "in_progress" | "completed" | "failed" | "stale"

export interface MemoryEntry {
  memory_id?: string
  memory_title: string
}

export interface TaskEvent {
  task_id: string
  event_type: "skill_started" | "skill_completed" | "skill_failed" | "pr_linked" | "memory_linked"
  timestamp: string
  project?: string
  project_path?: string  // only in raw events, stripped before HTTP response
  skill?: string
  title?: string
  parent_task_id?: string
  error?: string
  pr_url?: string
  pr_number?: number
  memory_id?: string
  memory_title?: string
}

export interface DerivedTask {
  task_id: string
  project: string
  skill: string
  title: string
  status: TaskStatus
  started_at: string
  completed_at?: string
  error?: string
  pr_url?: string
  pr_number?: number
  memories: MemoryEntry[]
  parent_task_id?: string
  // NOTE: project_path intentionally omitted — never sent to browser
}
