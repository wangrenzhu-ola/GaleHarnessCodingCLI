import { promises as fs } from "fs"
import path from "path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurrentTask {
  task_id: string
  started_at: string
  skill: string
}

// ---------------------------------------------------------------------------
// Path resolution — relative to the project being worked on (process.cwd()),
// NOT relative to the GaleHarnessCLI repo itself.
// ---------------------------------------------------------------------------

export const CONTEXT_FILE = path.join(
  process.cwd(),
  ".context",
  "galeharness-cli",
  "current-task.json",
)

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExpired(startedAt: string): boolean {
  try {
    const started = new Date(startedAt).getTime()
    if (Number.isNaN(started)) return true
    return Date.now() - started > TWENTY_FOUR_HOURS_MS
  } catch {
    return true
  }
}

// ---------------------------------------------------------------------------
// Public API (default path)
// ---------------------------------------------------------------------------

/**
 * Read the current task from `.context/galeharness-cli/current-task.json`
 * in the working directory.
 *
 * Returns null if:
 * - The file does not exist
 * - The file is malformed
 * - The `started_at` timestamp is older than 24 hours
 */
export async function readCurrentTask(): Promise<CurrentTask | null> {
  return readCurrentTaskFrom(CONTEXT_FILE)
}

/**
 * Write a task record to `.context/galeharness-cli/current-task.json`
 * in the working directory, creating parent directories as needed.
 */
export async function writeCurrentTask(task: CurrentTask): Promise<void> {
  return writeCurrentTaskTo(CONTEXT_FILE, task)
}

// ---------------------------------------------------------------------------
// Testable variants — accept explicit file paths
// ---------------------------------------------------------------------------

/**
 * Read a current-task record from an explicit file path.
 * Returns null if absent, malformed, or older than 24 hours.
 */
export async function readCurrentTaskFrom(filePath: string): Promise<CurrentTask | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as CurrentTask
    if (!parsed.task_id || !parsed.started_at || !parsed.skill) return null
    if (isExpired(parsed.started_at)) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Write a current-task record to an explicit file path,
 * creating parent directories as needed.
 */
export async function writeCurrentTaskTo(filePath: string, task: CurrentTask): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(task, null, 2) + "\n", "utf8")
}
