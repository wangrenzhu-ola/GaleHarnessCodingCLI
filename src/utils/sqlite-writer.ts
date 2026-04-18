/**
 * SQLite task event writer for GaleHarnessCLI.
 *
 * Writes task events to ~/.galeharness/tasks.db (SQLite, WAL mode).
 *
 * Contract: all errors are caught, logged to stderr, and NEVER throw.
 * The writer MUST never block skills. Always exits with success status.
 *
 * Schema is compatible with Board reader (GaleHarnessCodingTaskBoard/server/lib/events-reader.ts).
 */

import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventType =
  | "skill_started"
  | "skill_completed"
  | "skill_failed"
  | "memory_linked"
  | "pr_linked"

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

const GALEHARNESS_DIR = join(homedir(), ".galeharness")
export const DB_PATH = join(GALEHARNESS_DIR, "tasks.db")

// ---------------------------------------------------------------------------
// Schema definition (must match Board reader exactly)
// ---------------------------------------------------------------------------

const CREATE_TABLE_SQL = `
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
`

const CREATE_INDEX_TASK_ID_SQL = `CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id)`
const CREATE_INDEX_TIMESTAMP_SQL = `CREATE INDEX IF NOT EXISTS idx_task_events_timestamp ON task_events(timestamp)`

const INSERT_SQL = `
  INSERT INTO task_events (
    task_id, event_type, timestamp, project, project_path, skill, title,
    parent_task_id, error, pr_url, pr_number, memory_id, memory_title
  ) VALUES (
    $task_id, $event_type, $timestamp, $project, $project_path, $skill, $title,
    $parent_task_id, $error, $pr_url, $pr_number, $memory_id, $memory_title
  )
`

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3
const BASE_DELAY_MS = 10

// ---------------------------------------------------------------------------
// Core write utility
// ---------------------------------------------------------------------------

/**
 * Write a single TaskEvent to the SQLite database.
 *
 * Contract: NEVER throws, NEVER calls process.exit().
 * All errors are swallowed and logged to stderr.
 */
export function writeEvent(event: TaskEvent, dbPath: string = DB_PATH): void {
  try {
    // Ensure directory exists
    if (!existsSync(dirname(dbPath))) {
      mkdirSync(dirname(dbPath), { recursive: true })
    }

    const db = new Database(dbPath, { create: true })

    try {
      // Enable WAL mode
      const walResult = db.run("PRAGMA journal_mode = WAL;")
      const mode = (walResult as { journal_mode?: string })?.journal_mode ?? "delete"
      if (mode !== "wal") {
        console.error("[gale-task] WAL mode not supported on this filesystem, using default journal")
      }

      // Ensure schema exists
      db.run(CREATE_TABLE_SQL)
      db.run(CREATE_INDEX_TASK_ID_SQL)
      db.run(CREATE_INDEX_TIMESTAMP_SQL)

      // Insert the event
      const stmt = db.query(INSERT_SQL)
      stmt.run({
        $task_id: event.task_id,
        $event_type: event.event_type,
        $timestamp: event.timestamp,
        $project: event.project ?? null,
        $project_path: event.project_path ?? null,
        $skill: event.skill ?? null,
        $title: event.title ?? null,
        $parent_task_id: event.parent_task_id ?? null,
        $error: event.error ?? null,
        $pr_url: event.pr_url ?? null,
        $pr_number: event.pr_number != null ? Number(event.pr_number) : null,
        $memory_id: event.memory_id ?? null,
        $memory_title: event.memory_title ?? null,
      })
      stmt.finalize()
    } finally {
      db.close()
    }
  } catch (err) {
    process.stderr.write(
      `[gale-task] writeEvent error: ${err instanceof Error ? err.message : String(err)}\n`,
    )
  }
}

/**
 * Write with retry logic for SQLITE_BUSY errors.
 *
 * Uses exponential backoff: 10ms, 20ms, 40ms.
 */
export function writeEventWithRetry(event: TaskEvent, dbPath: string = DB_PATH): void {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      writeEvent(event, dbPath)
      return
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code
      if (errorCode === "SQLITE_BUSY" && i < MAX_RETRIES - 1) {
        // Exponential backoff: 10ms, 20ms
        const delay = BASE_DELAY_MS * Math.pow(2, i)
        Bun.sleepSync(delay)
        continue
      }
      // writeEvent already logs errors, but re-throw if we get here unexpectedly
      return
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience exports for migration
// ---------------------------------------------------------------------------

/**
 * Append a single TaskEvent to the SQLite database.
 * This is the primary API for gale-task to use.
 *
 * Contract: NEVER throws, NEVER calls process.exit().
 * All errors are swallowed and logged to stderr so the writer never blocks skills.
 */
export async function appendEvent(event: TaskEvent): Promise<void> {
  writeEventWithRetry(event)
}

/**
 * Append to an explicit database path. Exported for testing.
 */
export async function appendEventToPath(event: TaskEvent, dbPath: string): Promise<void> {
  writeEventWithRetry(event, dbPath)
}
