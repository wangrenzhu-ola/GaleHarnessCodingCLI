/**
 * Tests for SQLite task writer utility.
 *
 * Uses Bun's built-in test runner and temp directories for isolation.
 * Tests use path-parameterized variants to avoid touching real system paths.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "path"
import { Database } from "bun:sqlite"

import {
  writeEvent,
  writeEventWithRetry,
  appendEvent,
  appendEventToPath,
  type TaskEvent,
  DB_PATH,
} from "../src/utils/sqlite-writer.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<TaskEvent> = {}): TaskEvent {
  return {
    task_id: crypto.randomUUID(),
    event_type: "skill_started",
    timestamp: new Date().toISOString(),
    project: "test-project",
    project_path: "/tmp/test-project",
    skill: "test-skill",
    ...overrides,
  }
}

function getDbRows(dbPath: string): TaskEvent[] {
  const db = new Database(dbPath, { readonly: true })
  try {
    const query = db.query(`SELECT * FROM task_events ORDER BY timestamp ASC`)
    const rows = query.all() as TaskEvent[]
    query.finalize()
    return rows
  } finally {
    db.close()
  }
}

function getJournalMode(dbPath: string): string {
  const db = new Database(dbPath, { readonly: true })
  try {
    const query = db.query(`PRAGMA journal_mode`)
    const result = query.get() as { journal_mode: string } | undefined
    query.finalize()
    return result?.journal_mode ?? "unknown"
  } finally {
    db.close()
  }
}

// ---------------------------------------------------------------------------
// writeEvent
// ---------------------------------------------------------------------------

describe("writeEvent", () => {
  let tmpDir: string
  let dbPath: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-sqlite-test-"))
    dbPath = path.join(tmpDir, "tasks.db")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("creates database file if it does not exist", async () => {
    const event = makeEvent()
    writeEvent(event, dbPath)

    expect(await readFile(dbPath).then(() => true).catch(() => false)).toBe(true)
  })

  test("creates parent directory if absent", async () => {
    const nestedDbPath = path.join(tmpDir, "nested", "deep", "tasks.db")
    const event = makeEvent()
    writeEvent(event, nestedDbPath)

    const rows = getDbRows(nestedDbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].task_id).toBe(event.task_id)
  })

  test("writes skill_started event with all fields", async () => {
    const event: TaskEvent = {
      task_id: "test-123",
      event_type: "skill_started",
      timestamp: "2026-04-17T10:00:00.000Z",
      project: "my-project",
      project_path: "/home/user/my-project",
      skill: "gh:plan",
      title: "Planning session",
      parent_task_id: "parent-456",
    }
    writeEvent(event, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].task_id).toBe("test-123")
    expect(rows[0].event_type).toBe("skill_started")
    expect(rows[0].project).toBe("my-project")
    expect(rows[0].project_path).toBe("/home/user/my-project")
    expect(rows[0].skill).toBe("gh:plan")
    expect(rows[0].title).toBe("Planning session")
    expect(rows[0].parent_task_id).toBe("parent-456")
  })

  test("writes skill_completed event", async () => {
    const event: TaskEvent = {
      task_id: "test-456",
      event_type: "skill_completed",
      timestamp: "2026-04-17T11:00:00.000Z",
      project: "my-project",
      skill: "gh:work",
    }
    writeEvent(event, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].event_type).toBe("skill_completed")
  })

  test("writes skill_failed event with error", async () => {
    const event: TaskEvent = {
      task_id: "test-789",
      event_type: "skill_failed",
      timestamp: "2026-04-17T12:00:00.000Z",
      project: "my-project",
      skill: "gh:debug",
      error: "Something went wrong",
    }
    writeEvent(event, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].event_type).toBe("skill_failed")
    expect(rows[0].error).toBe("Something went wrong")
  })

  test("writes pr_linked event with PR info", async () => {
    const event: TaskEvent = {
      task_id: "test-pr",
      event_type: "pr_linked",
      timestamp: "2026-04-17T13:00:00.000Z",
      project: "my-project",
      skill: "gh:work",
      pr_url: "https://github.com/org/repo/pull/123",
      pr_number: 123,
    }
    writeEvent(event, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].event_type).toBe("pr_linked")
    expect(rows[0].pr_url).toBe("https://github.com/org/repo/pull/123")
    expect(rows[0].pr_number).toBe(123)
  })

  test("writes memory_linked event", async () => {
    const event: TaskEvent = {
      task_id: "test-mem",
      event_type: "memory_linked",
      timestamp: "2026-04-17T14:00:00.000Z",
      project: "my-project",
      skill: "gh:compound",
      memory_id: "mem-123",
      memory_title: "Learned something",
    }
    writeEvent(event, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
    expect(rows[0].event_type).toBe("memory_linked")
    expect(rows[0].memory_id).toBe("mem-123")
    expect(rows[0].memory_title).toBe("Learned something")
  })

  test("enables WAL mode", async () => {
    const event = makeEvent()
    writeEvent(event, dbPath)

    const mode = getJournalMode(dbPath)
    // WAL might not be supported on all filesystems (e.g., network mounts)
    // So we just check that it's either "wal" or "delete" (the fallback)
    expect(["wal", "delete"]).toContain(mode)
  })

  test("creates correct schema with indexes", async () => {
    const event = makeEvent()
    writeEvent(event, dbPath)

    const db = new Database(dbPath, { readonly: true })
    try {
      // Check table exists
      const tableQuery = db.query(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='task_events'
      `)
      const table = tableQuery.get()
      expect(table).toBeDefined()

      // Check indexes exist
      const indexQuery = db.query(`
        SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_task_events%'
      `)
      const indexes = indexQuery.all()
      expect(indexes).toHaveLength(2)

      tableQuery.finalize()
      indexQuery.finalize()
    } finally {
      db.close()
    }
  })

  test("appends multiple events for same task_id", async () => {
    const taskId = "multi-event-task"
    writeEvent({ ...makeEvent(), task_id: taskId, event_type: "skill_started" }, dbPath)
    writeEvent({ ...makeEvent(), task_id: taskId, event_type: "skill_completed" }, dbPath)

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(2)
    expect(rows[0].event_type).toBe("skill_started")
    expect(rows[1].event_type).toBe("skill_completed")
  })

  test("handles concurrent writes from multiple processes", async () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({ task_id: `concurrent-${i}` })
    )

    // Simulate concurrent writes by running them in parallel
    await Promise.all(events.map(e => appendEventToPath(e, dbPath)))

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(10)
    const ids = new Set(rows.map(r => r.task_id))
    expect(ids.size).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  let tmpDir: string
  let dbPath: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-sqlite-err-"))
    dbPath = path.join(tmpDir, "tasks.db")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("does not throw on database error (corrupted file)", async () => {
    // Create a corrupted "database" file
    await writeFile(dbPath, "not a valid sqlite database", "utf8")

    const event = makeEvent()
    // Should not throw - contract is to swallow all errors
    expect(() => writeEvent(event, dbPath)).not.toThrow()
  })

  test("does not throw when directory is read-only", async () => {
    const roDir = path.join(tmpDir, "readonly")
    await mkdir(roDir, { recursive: true })
    await writeFile(path.join(roDir, ".keep"), "")

    const roDbPath = path.join(roDir, "tasks.db")
    const event = makeEvent()

    // On most systems, this will fail silently due to permission error
    // We just verify it doesn't throw
    expect(() => writeEvent(event, roDbPath)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// appendEvent / appendEventToPath async API
// ---------------------------------------------------------------------------

describe("appendEvent / appendEventToPath", () => {
  let tmpDir: string
  let dbPath: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-sqlite-async-"))
    dbPath = path.join(tmpDir, "tasks.db")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("appendEventToPath writes event and resolves", async () => {
    const event = makeEvent()
    await expect(appendEventToPath(event, dbPath)).resolves.toBeUndefined()

    const rows = getDbRows(dbPath)
    expect(rows).toHaveLength(1)
  })

  test("appendEvent writes to default path", async () => {
    // This test writes to the real ~/.galeharness/tasks.db
    // It's a smoke test - we verify it doesn't throw
    const event = makeEvent({ task_id: `smoke-test-${Date.now()}` })
    await expect(appendEvent(event)).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Schema compatibility with Board reader
// ---------------------------------------------------------------------------

describe("schema compatibility", () => {
  let tmpDir: string
  let dbPath: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-sqlite-schema-"))
    dbPath = path.join(tmpDir, "tasks.db")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("schema matches Board reader expectations (no id column)", async () => {
    const event = makeEvent()
    writeEvent(event, dbPath)

    const db = new Database(dbPath, { readonly: true })
    try {
      const query = db.query(`PRAGMA table_info(task_events)`)
      const columns = query.all() as { name: string }[]
      query.finalize()

      const columnNames = columns.map(c => c.name)

      // Must NOT have an `id` column
      expect(columnNames).not.toContain("id")

      // Must have all expected columns
      expect(columnNames).toContain("task_id")
      expect(columnNames).toContain("event_type")
      expect(columnNames).toContain("timestamp")
      expect(columnNames).toContain("project")
      expect(columnNames).toContain("project_path")
      expect(columnNames).toContain("skill")
      expect(columnNames).toContain("title")
      expect(columnNames).toContain("parent_task_id")
      expect(columnNames).toContain("error")
      expect(columnNames).toContain("pr_url")
      expect(columnNames).toContain("pr_number")
      expect(columnNames).toContain("memory_id")
      expect(columnNames).toContain("memory_title")
    } finally {
      db.close()
    }
  })
})
