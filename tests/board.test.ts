import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { Database } from "bun:sqlite"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:net"
import { mergeEvents, readAndMergeTasks } from "../src/board/reader"
import { formatTable, formatJson, formatQuiet, formatStats, formatTaskDetail } from "../src/board/formatter"
import { checkPortAvailable, findAvailablePort } from "../src/commands/board-serve"
import type { TaskEvent, DerivedTask } from "../src/board/types"

describe("board reader", () => {
  describe("mergeEvents", () => {
    it("should merge skill_started events into tasks", () => {
      const now = new Date("2026-04-19T11:00:00Z").getTime()
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
      expect(tasks).toHaveLength(1)
      expect(tasks[0].task_id).toBe("task1")
      expect(tasks[0].project).toBe("my-app")
      expect(tasks[0].skill).toBe("gh:work")
      expect(tasks[0].title).toBe("Add feature")
      expect(tasks[0].status).toBe("in_progress")
    })

    it("should mark completed tasks", () => {
      const now = new Date("2026-04-19T12:00:00Z").getTime()
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

      const tasks = mergeEvents(events, now, 2)
      expect(tasks[0].status).toBe("completed")
      expect(tasks[0].completed_at).toBe("2026-04-19T11:00:00Z")
    })

    it("should mark failed tasks", () => {
      const now = new Date("2026-04-19T12:00:00Z").getTime()
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

      const tasks = mergeEvents(events, now, 2)
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
      const now = new Date("2026-04-19T12:00:00Z").getTime()
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

      const tasks = mergeEvents(events, now, 2)
      expect(tasks[0].pr_url).toBe("https://github.com/org/repo/pull/123")
      expect(tasks[0].pr_number).toBe(123)
    })

    it("should capture memory entries", () => {
      const now = new Date("2026-04-19T12:00:00Z").getTime()
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

      const tasks = mergeEvents(events, now, 2)
      expect(tasks[0].memories).toHaveLength(1)
      expect(tasks[0].memories[0].memory_id).toBe("mem1")
      expect(tasks[0].memories[0].memory_title).toBe("Learning about feature X")
    })

    it("should sort tasks by started_at descending", () => {
      const now = new Date("2026-04-19T14:00:00Z").getTime()
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

      const tasks = mergeEvents(events, now, 2)
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

    it("should end with a trailing newline", () => {
      const output = formatQuiet(mockTasks, { format: "quiet", limit: 20, noColor: true })
      expect(output.endsWith("\n")).toBe(true)
    })

    it("should return empty string for empty tasks", () => {
      const output = formatQuiet([], { format: "quiet", limit: 20, noColor: true })
      expect(output).toBe("")
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

describe("board integration tests", () => {
  const sampleTasks: DerivedTask[] = [
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

  describe("NO_COLOR=1", () => {
    it("should produce output without ANSI escape codes when noColor is true", () => {
      const output = formatTable(sampleTasks, { format: "table", limit: 20, noColor: true })
      expect(output).not.toContain("\x1b[")
    })

    it("should produce output with ANSI escape codes when noColor is false", () => {
      const output = formatTable(sampleTasks, { format: "table", limit: 20, noColor: false })
      expect(output).toContain("\x1b[")
    })

    it("should strip color from formatStats when noColor is true", () => {
      const output = formatStats(sampleTasks, true)
      expect(output).not.toContain("\x1b[")
    })

    it("should include color in formatStats when noColor is false", () => {
      const output = formatStats(sampleTasks, false)
      expect(output).toContain("\x1b[")
    })

    it("should strip color from formatTaskDetail when noColor is true", () => {
      const task: DerivedTask = {
        ...sampleTasks[0],
        status: "failed",
        error: "Something went wrong",
      }
      const output = formatTaskDetail(task, true)
      expect(output).not.toContain("\x1b[")
    })

    it("should include color in formatTaskDetail when noColor is false", () => {
      const output = formatTaskDetail(sampleTasks[0], false)
      expect(output).toContain("\x1b[")
    })
  })

  describe("subprocess crash exit code", () => {
    it("should propagate non-zero exit code from child process", async () => {
      // Test by running the CLI with an invalid board serve config that causes
      // the child process to fail. We verify the exit code is non-zero.
      const proc = Bun.spawn([
        "bun", "run", join(import.meta.dir, "..", "src", "index.ts"),
        "board", "serve",
      ], {
        env: { ...process.env, TASKBOARD_ROOT: "/nonexistent/path" },
        stdout: "pipe",
        stderr: "pipe",
      })
      const exitCode = await proc.exited
      expect(exitCode).not.toBe(0)
    })
  })

  describe("port conflict in serve", () => {
    it("should detect an occupied port", async () => {
      const port = 14321
      // Occupy the port
      const blocker = createServer()
      await new Promise<void>((resolve) => {
        blocker.listen(port, () => resolve())
      })

      try {
        const available = await checkPortAvailable(port)
        expect(available).toBe(false)
      } finally {
        await new Promise<void>((resolve) => blocker.close(() => resolve()))
      }
    })

    it("should detect a free port", async () => {
      // Use a port that's very likely free (high-numbered, non-standard)
      const port = 15321
      const available = await checkPortAvailable(port)
      expect(available).toBe(true)
    })

    it("should find the next available port when starting port is occupied", async () => {
      const startPort = 15322
      // Occupy the starting port
      const blocker = createServer()
      await new Promise<void>((resolve) => {
        blocker.listen(startPort, () => resolve())
      })

      try {
        const found = await findAvailablePort(startPort, 10)
        expect(found).not.toBeNull()
        expect(found).not.toBe(startPort)
        expect(found!).toBeGreaterThan(startPort)
      } finally {
        await new Promise<void>((resolve) => blocker.close(() => resolve()))
      }
    })

    it("should return null when all ports in range are occupied", async () => {
      const startPort = 15330
      const maxAttempts = 3
      const blockers: ReturnType<typeof createServer>[] = []

      // Occupy all ports in the range
      for (let i = 0; i < maxAttempts; i++) {
        const blocker = createServer()
        await new Promise<void>((resolve) => {
          blocker.listen(startPort + i, () => resolve())
        })
        blockers.push(blocker)
      }

      try {
        const found = await findAvailablePort(startPort, maxAttempts)
        expect(found).toBeNull()
      } finally {
        for (const blocker of blockers) {
          await new Promise<void>((resolve) => blocker.close(() => resolve()))
        }
      }
    })
  })
})
