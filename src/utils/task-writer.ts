import { appendFile, mkdir } from "node:fs/promises"
import path from "path"
import os from "os"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventType =
  | "skill_started"
  | "skill_completed"
  | "skill_failed"
  | "memory_linked"
  | "pr_linked"

export interface TaskEventBase {
  task_id: string
  event_type: EventType
  timestamp: string
  project: string
  project_path: string
  skill: string
}

export interface SkillStartedEvent extends TaskEventBase {
  event_type: "skill_started"
  title?: string
  parent_task_id?: string
}

export interface SkillCompletedEvent extends TaskEventBase {
  event_type: "skill_completed"
  title?: string
}

export interface SkillFailedEvent extends TaskEventBase {
  event_type: "skill_failed"
  error?: string
}

export interface MemoryLinkedEvent extends TaskEventBase {
  event_type: "memory_linked"
  memory_id?: string
  memory_title?: string
}

export interface PrLinkedEvent extends TaskEventBase {
  event_type: "pr_linked"
  pr_url?: string
  pr_number?: string | number
}

export type TaskEvent =
  | SkillStartedEvent
  | SkillCompletedEvent
  | SkillFailedEvent
  | MemoryLinkedEvent
  | PrLinkedEvent

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const GALEHARNESS_DIR = path.join(os.homedir(), ".galeharness")
export const EVENTS_PATH = path.join(GALEHARNESS_DIR, "tasks.jsonl")

// ---------------------------------------------------------------------------
// Core append utility
// ---------------------------------------------------------------------------

/**
 * Low-level append to an explicit file path. Exported for testing only.
 *
 * Contract: NEVER throws, NEVER calls process.exit().
 * All errors are swallowed and logged to stderr.
 */
export async function appendEventToPath(event: TaskEvent, filePath: string): Promise<void> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true })
    const line = JSON.stringify(event) + "\n"
    await appendFile(filePath, line, { encoding: "utf8", flag: "a" })
  } catch (err) {
    process.stderr.write(
      `[gale-task] appendEvent error: ${err instanceof Error ? err.message : String(err)}\n`,
    )
  }
}

/**
 * Append a single TaskEvent as a JSON line to ~/.galeharness/tasks.jsonl.
 *
 * Contract: NEVER throws, NEVER calls process.exit().
 * All errors are swallowed and logged to stderr so the writer never blocks skills.
 */
export async function appendEvent(event: TaskEvent): Promise<void> {
  await appendEventToPath(event, EVENTS_PATH)
}
