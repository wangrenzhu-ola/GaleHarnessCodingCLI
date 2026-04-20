import { Database } from "bun:sqlite"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { DerivedTask, MemoryEntry, TaskEvent, TaskStatus } from "../types.ts"

const DB_PATH = join(homedir(), ".galeharness", "tasks.db")
const RAW_STALE_HOURS = Number(process.env.BOARD_STALE_HOURS ?? "2")
const STALE_HOURS = Number.isFinite(RAW_STALE_HOURS) && RAW_STALE_HOURS > 0 ? RAW_STALE_HOURS : 2

export function mergeEvents(events: TaskEvent[], now?: number, staleHours?: number): DerivedTask[] {
  const eventsByTask = new Map<string, TaskEvent[]>()

  for (const event of events) {
    if (!event.task_id || !event.event_type) continue
    const list = eventsByTask.get(event.task_id) ?? []
    list.push(event)
    eventsByTask.set(event.task_id, list)
  }

  const tasks: DerivedTask[] = []

  for (const [task_id, evs] of eventsByTask) {
    evs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    let project = ""
    let skill = ""
    let title = ""
    let started_at = ""
    let completed_at: string | undefined
    let error: string | undefined
    let pr_url: string | undefined
    let pr_number: number | undefined
    let parent_task_id: string | undefined
    const memories: MemoryEntry[] = []
    let status: TaskStatus = "in_progress"

    for (const ev of evs) {
      switch (ev.event_type) {
        case "skill_started":
          if (ev.project) project = ev.project
          if (ev.skill) skill = ev.skill
          if (ev.title) title = ev.title
          if (ev.timestamp && !started_at) started_at = ev.timestamp
          if (ev.parent_task_id) parent_task_id = ev.parent_task_id
          status = "in_progress"
          break

        case "skill_completed":
          status = "completed"
          completed_at = ev.timestamp
          break

        case "skill_failed":
          status = "failed"
          completed_at = ev.timestamp
          if (ev.error) error = ev.error
          break

        case "pr_linked":
          if (ev.pr_url) pr_url = ev.pr_url
          if (ev.pr_number) pr_number = ev.pr_number
          break

        case "memory_linked":
          if (ev.memory_title) {
            memories.push({
              memory_id: ev.memory_id,
              memory_title: ev.memory_title,
            })
          }
          break
      }
    }

    if (!started_at) continue

    if (status === "in_progress") {
      const startedMs = new Date(started_at).getTime()
      const hours = staleHours ?? STALE_HOURS
      const staleMs = hours * 60 * 60 * 1000
      const currentTime = now ?? Date.now()
      if (!Number.isNaN(startedMs) && currentTime - startedMs > staleMs) {
        status = "stale"
      }
    }

    tasks.push({
      task_id,
      project: project || "unknown",
      skill: skill || "unknown",
      title: title || "",
      status,
      started_at,
      completed_at,
      error,
      pr_url,
      pr_number,
      memories,
      parent_task_id,
    })
  }

  tasks.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  return tasks
}

export async function readAndMergeTasks(overrideDbPath?: string, now?: number): Promise<DerivedTask[]> {
  const dbPath = overrideDbPath ?? DB_PATH
  if (!existsSync(dbPath)) {
    return []
  }

  try {
    const db = new Database(dbPath, { readwrite: true, create: false })
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS task_events (
          task_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          project TEXT,
          project_path TEXT,
          skill TEXT,
          title TEXT,
          parent_task_id TEXT,
          error TEXT,
          pr_url TEXT,
          pr_number INTEGER,
          memory_id TEXT,
          memory_title TEXT
        )
      `)
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id)`)
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_timestamp ON task_events(timestamp)`)

      const query = db.query(`
        SELECT
          task_id,
          event_type,
          timestamp,
          project,
          project_path,
          skill,
          title,
          parent_task_id,
          error,
          pr_url,
          pr_number,
          memory_id,
          memory_title
        FROM task_events
        ORDER BY timestamp ASC
      `)
      const rows = query.all() as TaskEvent[]
      query.finalize()
      return mergeEvents(rows, now)
    } finally {
      db.close()
    }
  } catch (err) {
    console.error("Failed to read tasks db:", err)
    return []
  }
}
