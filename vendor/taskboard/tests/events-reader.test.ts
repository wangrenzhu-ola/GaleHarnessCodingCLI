import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mergeEvents, readAndMergeTasks } from "../server/lib/events-reader.ts"
import type { TaskEvent } from "../server/types.ts"

function makeEvent(overrides: Partial<TaskEvent> = {}): TaskEvent {
  return {
    task_id: "task-1",
    event_type: "skill_started",
    timestamp: "2026-04-17T10:00:00.000Z",
    ...overrides,
  }
}

describe("mergeEvents", () => {
  test("returns empty for no events", () => {
    expect(mergeEvents([])).toEqual([])
  })

  test("skips events missing task_id or event_type", () => {
    const bad1 = { task_id: "", event_type: "skill_started", timestamp: "t" } as TaskEvent
    const bad2 = { task_id: "x", event_type: "" as TaskEvent["event_type"], timestamp: "t" }
    expect(mergeEvents([bad1, bad2 as TaskEvent])).toEqual([])
  })

  test("produces in_progress task from skill_started alone", () => {
    const events = [makeEvent({ project: "myrepo", skill: "gh:work", title: "feat X" })]
    const tasks = mergeEvents(events)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].status).toBe("in_progress")
    expect(tasks[0].project).toBe("myrepo")
    expect(tasks[0].skill).toBe("gh:work")
    expect(tasks[0].title).toBe("feat X")
  })

  test("marks task as completed when skill_completed follows", () => {
    const events = [
      makeEvent({ timestamp: "2026-04-17T10:00:00.000Z" }),
      makeEvent({ event_type: "skill_completed", timestamp: "2026-04-17T10:05:00.000Z" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks[0].status).toBe("completed")
    expect(tasks[0].completed_at).toBe("2026-04-17T10:05:00.000Z")
  })

  test("marks task as failed with error on skill_failed", () => {
    const events = [
      makeEvent({ timestamp: "2026-04-17T10:00:00.000Z" }),
      makeEvent({ event_type: "skill_failed", timestamp: "2026-04-17T10:02:00.000Z", error: "timeout" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks[0].status).toBe("failed")
    expect(tasks[0].error).toBe("timeout")
  })

  test("accumulates pr_url from pr_linked event", () => {
    const events = [
      makeEvent(),
      makeEvent({ event_type: "pr_linked", pr_url: "https://github.com/org/repo/pull/42", pr_number: 42 }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks[0].pr_url).toBe("https://github.com/org/repo/pull/42")
    expect(tasks[0].pr_number).toBe(42)
  })

  test("accumulates memories from memory_linked events", () => {
    const events = [
      makeEvent(),
      makeEvent({ event_type: "memory_linked", memory_title: "Fix: race condition in queue", memory_id: "mem-1" }),
      makeEvent({ event_type: "memory_linked", memory_title: "Pattern: retry with backoff" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks[0].memories).toHaveLength(2)
    expect(tasks[0].memories[0].memory_title).toBe("Fix: race condition in queue")
    expect(tasks[0].memories[1].memory_title).toBe("Pattern: retry with backoff")
  })

  test("merges multiple tasks separately", () => {
    const events = [
      makeEvent({ task_id: "task-1", project: "repo-a", timestamp: "2026-04-17T09:00:00.000Z" }),
      makeEvent({ task_id: "task-2", project: "repo-b", timestamp: "2026-04-17T10:00:00.000Z" }),
      makeEvent({ task_id: "task-1", event_type: "skill_completed", timestamp: "2026-04-17T09:30:00.000Z" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks).toHaveLength(2)
    expect(tasks[0].task_id).toBe("task-2")
    expect(tasks[1].task_id).toBe("task-1")
    expect(tasks[1].status).toBe("completed")
  })

  test("sorts results by started_at descending", () => {
    const events = [
      makeEvent({ task_id: "a", timestamp: "2026-04-17T08:00:00.000Z" }),
      makeEvent({ task_id: "b", timestamp: "2026-04-17T10:00:00.000Z" }),
      makeEvent({ task_id: "c", timestamp: "2026-04-17T09:00:00.000Z" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks.map((t) => t.task_id)).toEqual(["b", "c", "a"])
  })

  test("does not expose project_path in output", () => {
    const events = [makeEvent({ project_path: "/Users/secret/project" })]
    const tasks = mergeEvents(events)
    expect(((tasks[0] as unknown) as Record<string, unknown>).project_path).toBeUndefined()
  })

  test("uses last-write-wins for project/skill/title fields", () => {
    const events = [
      makeEvent({ task_id: "t1", project: "old-project", skill: "gh:brainstorm", title: "old title", timestamp: "2026-04-17T09:00:00.000Z" }),
      makeEvent({ task_id: "t1", project: "new-project", skill: "gh:work", title: "new title", timestamp: "2026-04-17T10:00:00.000Z" }),
    ]
    const tasks = mergeEvents(events)
    expect(tasks[0].project).toBe("new-project")
    expect(tasks[0].skill).toBe("gh:work")
    expect(tasks[0].title).toBe("new title")
    expect(tasks[0].started_at).toBe("2026-04-17T09:00:00.000Z")
  })

  test("sets parent_task_id from skill_started", () => {
    const events = [makeEvent({ parent_task_id: "parent-42" })]
    const tasks = mergeEvents(events)
    expect(tasks[0].parent_task_id).toBe("parent-42")
  })

  test("skips task with no started_at (no skill_started event)", () => {
    const events = [
      { task_id: "t1", event_type: "skill_completed" as const, timestamp: "2026-04-17T10:00:00.000Z" },
    ]
    const tasks = mergeEvents(events)
    expect(tasks).toHaveLength(0)
  })

  test("marks in_progress as stale when started_at exceeds stale threshold", () => {
    const startedAt = "2026-04-17T07:00:00.000Z"
    const now = new Date("2026-04-17T10:00:00.000Z").getTime() // 3 hours later
    const events = [makeEvent({ timestamp: startedAt })]
    const tasks = mergeEvents(events, now, 2)
    expect(tasks[0].status).toBe("stale")
  })

  test("keeps in_progress when under stale threshold", () => {
    const startedAt = "2026-04-17T08:30:00.000Z"
    const now = new Date("2026-04-17T10:00:00.000Z").getTime() // 1.5 hours later
    const events = [makeEvent({ timestamp: startedAt })]
    const tasks = mergeEvents(events, now, 2)
    expect(tasks[0].status).toBe("in_progress")
  })

  test("keeps in_progress when started_at is invalid date", () => {
    const events = [makeEvent({ timestamp: "invalid-date" })]
    const tasks = mergeEvents(events)
    expect(tasks[0].status).toBe("in_progress")
  })

  test("handles fractional stale hours correctly", () => {
    const startedAt = "2026-04-17T09:29:00.000Z"
    const now = new Date("2026-04-17T10:00:00.000Z").getTime() // 31 minutes later
    const events = [makeEvent({ timestamp: startedAt })]
    const tasks = mergeEvents(events, now, 0.5)
    expect(tasks[0].status).toBe("stale")
  })
})

describe("readAndMergeTasks integration", () => {
  let tempDir: string
  let tempDbPath: string

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), "galeharness-test-"))
    tempDbPath = join(tempDir, "tasks.db")
  })

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  function seedDb(dbPath: string, events: TaskEvent[]) {
    const db = new Database(dbPath)
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
    const insert = db.query(`
      INSERT INTO task_events (task_id, event_type, timestamp, project, skill, title)
      VALUES ($task_id, $event_type, $timestamp, $project, $skill, $title)
    `)
    for (const ev of events) {
      insert.run({
        $task_id: ev.task_id,
        $event_type: ev.event_type,
        $timestamp: ev.timestamp,
        $project: ev.project ?? null,
        $skill: ev.skill ?? null,
        $title: ev.title ?? null,
      })
    }
    insert.finalize()
    db.close()
  }

  test("returns merged tasks from a real SQLite db", async () => {
    seedDb(tempDbPath, [
      makeEvent({ task_id: "t1", project: "repo-a", skill: "gh:work", title: "feat A", timestamp: "2026-04-17T10:00:00.000Z" }),
      makeEvent({ task_id: "t1", event_type: "skill_completed", timestamp: "2026-04-17T10:05:00.000Z" }),
      makeEvent({ task_id: "t2", project: "repo-b", skill: "gh:plan", title: "plan B", timestamp: "2026-04-17T11:00:00.000Z" }),
    ])

    const tasks = await readAndMergeTasks(tempDbPath)
    expect(tasks).toHaveLength(2)
    expect(tasks[0].task_id).toBe("t2")
    expect(tasks[0].status).toBe("in_progress")
    expect(tasks[1].task_id).toBe("t1")
    expect(tasks[1].status).toBe("completed")
  })

  test("returns empty array when db file does not exist", async () => {
    const result = await readAndMergeTasks(join(tempDir, "nonexistent.db"))
    expect(result).toEqual([])
  })

  test("returns empty array and logs error for corrupted db file", async () => {
    const corruptPath = join(tempDir, "corrupt.db")
    const encoder = new TextEncoder()
    const data = encoder.encode("THIS IS NOT A VALID SQLITE FILE")
    await Bun.write(corruptPath, data)

    const result = await readAndMergeTasks(corruptPath)
    expect(result).toEqual([])
  })

  test("creates schema on first read to empty db file", async () => {
    const emptyDbPath = join(tempDir, "empty.db")
    // Create an empty SQLite database file
    const db = new Database(emptyDbPath)
    db.close()

    // Verify it's truly empty before calling readAndMergeTasks
    const dbBefore = new Database(emptyDbPath)
    const tablesBefore = dbBefore.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    dbBefore.close()
    expect(tablesBefore).toHaveLength(0)

    // Calling readAndMergeTasks should create the schema
    const tasks = await readAndMergeTasks(emptyDbPath)
    expect(tasks).toEqual([])

    // Verify schema was created
    const dbAfter = new Database(emptyDbPath)
    const tablesAfter = dbAfter.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    const indexesAfter = dbAfter.query("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[]
    dbAfter.close()

    expect(tablesAfter.map((t) => t.name)).toContain("task_events")
    expect(indexesAfter.map((i) => i.name)).toContain("idx_task_events_task_id")
    expect(indexesAfter.map((i) => i.name)).toContain("idx_task_events_timestamp")
  })
})
