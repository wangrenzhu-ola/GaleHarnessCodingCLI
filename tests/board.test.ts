import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mergeEvents, readAndMergeTasks } from "../src/board/reader"
import { formatTable, formatJson, formatQuiet, formatStats, formatTaskDetail } from "../src/board/formatter"
import type { TaskEvent, DerivedTask } from "../src/board/types"

describe("board reader", () => {
  describe("mergeEvents", () => {
    it("should merge skill_started events into tasks", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].task_id).toBe("task1")
      expect(tasks[0].project).toBe("my-app")
      expect(tasks[0].skill).toBe("gh:work")
      expect(tasks[0].title).toBe("Add feature")
      expect(tasks[0].status).toBe("in_progress")
    })

    it("should mark completed tasks", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
        {
          task_id: "task1",
          event_type: "skill_completed",
          timestamp: "2026-04-19T11:00:00Z",
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks[0].status).toBe("completed")
      expect(tasks[0].completed_at).toBe("2026-04-19T11:00:00Z")
    })

    it("should mark failed tasks", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
        {
          task_id: "task1",
          event_type: "skill_failed",
          timestamp: "2026-04-19T11:00:00Z",
          error: "Build failed",
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks[0].status).toBe("failed")
      expect(tasks[0].error).toBe("Build failed")
    })

    it("should detect stale tasks", () => {
      const now = new Date("2026-04-19T14:00:00Z").getTime()
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
      ]

      const tasks = mergeEvents(events, now, 2)
      expect(tasks[0].status).toBe("stale")
    })

    it("should capture PR links", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
        {
          task_id: "task1",
          event_type: "pr_linked",
          timestamp: "2026-04-19T11:00:00Z",
          pr_url: "https://github.com/org/repo/pull/123",
          pr_number: 123,
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks[0].pr_url).toBe("https://github.com/org/repo/pull/123")
      expect(tasks[0].pr_number).toBe(123)
    })

    it("should capture memory entries", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Add feature",
        },
        {
          task_id: "task1",
          event_type: "memory_linked",
          timestamp: "2026-04-19T11:00:00Z",
          memory_id: "mem1",
          memory_title: "Learning about feature X",
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks[0].memories).toHaveLength(1)
      expect(tasks[0].memories[0].memory_id).toBe("mem1")
      expect(tasks[0].memories[0].memory_title).toBe("Learning about feature X")
    })

    it("should sort tasks by started_at descending", () => {
      const events: TaskEvent[] = [
        {
          task_id: "task1",
          event_type: "skill_started",
          timestamp: "2026-04-19T10:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "First task",
        },
        {
          task_id: "task2",
          event_type: "skill_started",
          timestamp: "2026-04-19T12:00:00Z",
          project: "my-app",
          skill: "gh:work",
          title: "Second task",
        },
      ]

      const tasks = mergeEvents(events)
      expect(tasks[0].task_id).toBe("task2")
      expect(tasks[1].task_id).toBe("task1")
    })
  })

  describe("readAndMergeTasks", () => {
    let tempDir: string
    let dbPath: string

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), "board-test-"))
      dbPath = join(tempDir, "tasks.db")
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE task_events (
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
      db.close()
    })

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true })
    })

    it("should read tasks from database", async () => {
      const db = new Database(dbPath)
      db.run(
        `INSERT INTO task_events (task_id, event_type, timestamp, project, skill, title)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["task1", "skill_started", "2026-04-19T10:00:00Z", "my-app", "gh:work", "Add feature"]
      )
      db.close()

      const tasks = await readAndMergeTasks(dbPath)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].task_id).toBe("task1")
    })

    it("should return empty array for non-existent database", async () => {
      const tasks = await readAndMergeTasks("/nonexistent/path/tasks.db")
      expect(tasks).toHaveLength(0)
    })
  })
})

describe("board formatter", () => {
  const mockTasks: DerivedTask[] = [
    {
      task_id: "a1b2c3d4",
      project: "my-app",
      skill: "gh:work",
      title: "Add dark mode",
      status: "completed",
      started_at: "2026-04-19T14:30:00Z",
      completed_at: "2026-04-19T15:30:00Z",
      memories: [],
    },
    {
      task_id: "d4c3b2a1",
      project: "api",
      skill: "gh:debug",
      title: "Fix auth bug",
      status: "in_progress",
      started_at: "2026-04-19T15:00:00Z",
      memories: [],
    },
  ]

  describe("formatTable", () => {
    it("should format tasks as table", () => {
      const output = formatTable(mockTasks, { format: "table", limit: 20, noColor: true })
      expect(output).toContain("Task ID")
      expect(output).toContain("a1b2c3d4")
      expect(output).toContain("Add dark mode")
      expect(output).toContain("completed")
      expect(output).toContain("in_progress")
    })

    it("should handle empty tasks", () => {
      const output = formatTable([], { format: "table", limit: 20, noColor: true })
      expect(output).toBe("No tasks found.")
    })

    it("should respect limit", () => {
      const output = formatTable(mockTasks, { format: "table", limit: 1, noColor: true })
      expect(output).toContain("and 1 more tasks")
    })
  })

  describe("formatJson", () => {
    it("should format tasks as JSON", () => {
      const output = formatJson(mockTasks, { format: "json", limit: 20, noColor: true })
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].task_id).toBe("a1b2c3d4")
    })

    it("should respect limit", () => {
      const output = formatJson(mockTasks, { format: "json", limit: 1, noColor: true })
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(1)
    })
  })

  describe("formatQuiet", () => {
    it("should output only task IDs", () => {
      const output = formatQuiet(mockTasks, { format: "quiet", limit: 20, noColor: true })
      const lines = output.split("\n")
      expect(lines).toContain("a1b2c3d4")
      expect(lines).toContain("d4c3b2a1")
    })
  })

  describe("formatStats", () => {
    it("should format statistics", () => {
      const output = formatStats(mockTasks, true)
      expect(output).toContain("Total:")
      expect(output).toContain("Completed:")
      expect(output).toContain("In Progress:")
      expect(output).toContain("By Project:")
      expect(output).toContain("By Skill:")
    })

    it("should handle empty tasks", () => {
      const output = formatStats([], true)
      expect(output).toBe("No tasks found.")
    })

    it("should sort projects and skills by count descending", () => {
      const tasks: DerivedTask[] = [
        { task_id: "1", project: "proj-a", skill: "gh:work", title: "Task 1", status: "completed", started_at: "2026-04-19T10:00:00Z", memories: [] },
        { task_id: "2", project: "proj-a", skill: "gh:work", title: "Task 2", status: "completed", started_at: "2026-04-19T10:00:00Z", memories: [] },
        { task_id: "3", project: "proj-b", skill: "gh:plan", title: "Task 3", status: "completed", started_at: "2026-04-19T10:00:00Z", memories: [] },
      ]
      const output = formatStats(tasks, true)
      const projAIndex = output.indexOf("proj-a:")
      const projBIndex = output.indexOf("proj-b:")
      expect(projAIndex).toBeLessThan(projBIndex)
    })
  })

  describe("formatTaskDetail", () => {
    it("should format task details", () => {
      const output = formatTaskDetail(mockTasks[0], true)
      expect(output).toContain("Add dark mode")
      expect(output).toContain("a1b2c3d4")
      expect(output).toContain("my-app")
      expect(output).toContain("gh:work")
      expect(output).toContain("completed")
    })

    it("should include error if present", () => {
      const task: DerivedTask = {
        ...mockTasks[0],
        status: "failed",
        error: "Something went wrong",
      }
      const output = formatTaskDetail(task, true)
      expect(output).toContain("Error:")
      expect(output).toContain("Something went wrong")
    })

    it("should include PR if present", () => {
      const task: DerivedTask = {
        ...mockTasks[0],
        pr_url: "https://github.com/org/repo/pull/123",
      }
      const output = formatTaskDetail(task, true)
      expect(output).toContain("PR:")
      expect(output).toContain("https://github.com/org/repo/pull/123")
    })

    it("should include memories if present", () => {
      const task: DerivedTask = {
        ...mockTasks[0],
        memories: [{ memory_id: "mem1", memory_title: "Learning" }],
      }
      const output = formatTaskDetail(task, true)
      expect(output).toContain("Memory Entries:")
      expect(output).toContain("Learning")
    })
  })
})
