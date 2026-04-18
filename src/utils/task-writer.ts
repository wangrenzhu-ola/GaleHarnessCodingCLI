import { appendFile, mkdir } from "node:fs/promises"
import path from "path"
import os from "os"

/**
 * @deprecated Use sqlite-writer.ts instead.
 * This module writes to JSONL format which is no longer read by the Board.
 * Kept for backward compatibility and historical archive purposes.
 *
 * Migration guide: Replace imports from task-writer.js with sqlite-writer.js
 * The API (appendEvent, TaskEvent type) is compatible.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventType =
  | "skill_started"
  | "skill_completed"
  | "skill_failed"
  | "memory_linked"
  | "pr_linked"

/**
 * Task event structure.
 * Compatible with Board schema (no `id` column, all fields optional except task_id, event_type, timestamp).
 */
export interface TaskEvent {
  task_id: string
  event_type: EventType
  timestamp: string
  project?: string
  project_path?: string
  skill?: string
  title?: string
  parent_task_id?: string
  error?: string
  pr_url?: string
  pr_number?: string | number
  memory_id?: string
  memory_title?: string
}

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
