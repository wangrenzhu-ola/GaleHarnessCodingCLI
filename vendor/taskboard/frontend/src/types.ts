// Mirrors server/types.ts — keep in sync
export type TaskStatus = "in_progress" | "completed" | "failed" | "stale"

export interface MemoryEntry {
  memory_id?: string
  memory_title: string
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
}

export interface PRData {
  title: string
  state: string
  author: string
  created_at: string
}
