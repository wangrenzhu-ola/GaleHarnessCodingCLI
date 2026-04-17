/**
 * Tests for task-writer utility and context manager.
 *
 * Uses Bun's built-in test runner and node:fs temp directories for isolation.
 * The appendEvent / readCurrentTask / writeCurrentTask functions are tested
 * via their path-parameterised variants to avoid touching real system paths.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm, readFile, chmod } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "path"

import {
  appendEvent,
  appendEventToPath,
  type TaskEvent,
} from "../src/utils/task-writer.js"
import {
  readCurrentTaskFrom,
  writeCurrentTaskTo,
  type CurrentTask,
} from "../cmd/gale-task/context.js"

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
  } as TaskEvent
}

function recentTimestamp(): string {
  return new Date().toISOString()
}

function oldTimestamp(): string {
  // 25 hours ago — definitely expired
  return new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
}

// ---------------------------------------------------------------------------
// appendEvent / appendEventToPath
// ---------------------------------------------------------------------------

describe("appendEventToPath", () => {
  let tmpDir: string
  let eventsFile: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-task-test-"))
    eventsFile = path.join(tmpDir, "tasks.jsonl")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("writes a valid JSON line to the specified file", async () => {
    const event = makeEvent()
    await appendEventToPath(event, eventsFile)

    const raw = await readFile(eventsFile, "utf8")
    const lines = raw.trim().split("\n").filter(Boolean)
    expect(lines).toHaveLength(1)

    const parsed = JSON.parse(lines[0])
    expect(parsed.task_id).toBe(event.task_id)
    expect(parsed.event_type).toBe("skill_started")
    expect(parsed.project).toBe("test-project")
    expect(parsed.skill).toBe("test-skill")
  })

  test("creates parent directory if absent", async () => {
    const deepFile = path.join(tmpDir, "nested", "deep", "tasks.jsonl")
    const event = makeEvent({ event_type: "skill_completed" })
    await appendEventToPath(event, deepFile)

    const raw = await readFile(deepFile, "utf8")
    const parsed = JSON.parse(raw.trim())
    expect(parsed.event_type).toBe("skill_completed")
  })

  test("does not throw on permission error (swallows error)", async () => {
    // Write to a read-only directory
    const roDir = path.join(tmpDir, "readonly")
    await mkdtemp(path.join(tmpdir(), "ro-")).then(async (d) => {
      await chmod(d, 0o444)
      const badFile = path.join(d, "tasks.jsonl")
      // Must not throw — contract is to swallow all errors
      await expect(appendEventToPath(makeEvent(), badFile)).resolves.toBeUndefined()
      // Restore permissions so cleanup works
      await chmod(d, 0o755)
      await rm(d, { recursive: true, force: true })
    })
  })

  test("two concurrent appendEvent calls produce two distinct valid JSON lines", async () => {
    const event1 = makeEvent({ task_id: "aaa-111" })
    const event2 = makeEvent({ task_id: "bbb-222" })

    await Promise.all([
      appendEventToPath(event1, eventsFile),
      appendEventToPath(event2, eventsFile),
    ])

    const raw = await readFile(eventsFile, "utf8")
    const lines = raw.trim().split("\n").filter(Boolean)
    expect(lines).toHaveLength(2)

    const parsed = lines.map((l) => JSON.parse(l))
    const ids = new Set(parsed.map((p: { task_id: string }) => p.task_id))
    expect(ids.size).toBe(2)
    expect(ids.has("aaa-111")).toBe(true)
    expect(ids.has("bbb-222")).toBe(true)
  })
})

describe("appendEvent (real path variant — smoke test)", () => {
  test("appendEvent does not throw", async () => {
    const event = makeEvent()
    await expect(appendEvent(event)).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// readCurrentTaskFrom / writeCurrentTaskTo
// ---------------------------------------------------------------------------

describe("readCurrentTaskFrom", () => {
  let tmpDir: string
  let contextFile: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-ctx-test-"))
    contextFile = path.join(tmpDir, "current-task.json")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("returns null for absent file", async () => {
    const result = await readCurrentTaskFrom(contextFile)
    expect(result).toBeNull()
  })

  test("returns null for file older than 24 hours", async () => {
    const task: CurrentTask = {
      task_id: "old-task-123",
      started_at: oldTimestamp(),
      skill: "some-skill",
    }
    await writeCurrentTaskTo(contextFile, task)

    const result = await readCurrentTaskFrom(contextFile)
    expect(result).toBeNull()
  })

  test("returns the task for a recent file", async () => {
    const task: CurrentTask = {
      task_id: "recent-task-456",
      started_at: recentTimestamp(),
      skill: "my-skill",
    }
    await writeCurrentTaskTo(contextFile, task)

    const result = await readCurrentTaskFrom(contextFile)
    expect(result).not.toBeNull()
    expect(result!.task_id).toBe("recent-task-456")
    expect(result!.skill).toBe("my-skill")
  })

  test("returns null for malformed JSON", async () => {
    const { promises: fs } = await import("node:fs")
    await fs.writeFile(contextFile, "{ not valid json", "utf8")

    const result = await readCurrentTaskFrom(contextFile)
    expect(result).toBeNull()
  })

  test("returns null for JSON missing required fields", async () => {
    const { promises: fs } = await import("node:fs")
    await fs.writeFile(contextFile, JSON.stringify({ task_id: "x" }), "utf8")

    const result = await readCurrentTaskFrom(contextFile)
    expect(result).toBeNull()
  })
})

describe("writeCurrentTaskTo + readCurrentTaskFrom round-trip", () => {
  let tmpDir: string
  let contextFile: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-ctx-rt-"))
    contextFile = path.join(tmpDir, "subdir", "current-task.json")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("write then read returns identical task", async () => {
    const task: CurrentTask = {
      task_id: crypto.randomUUID(),
      started_at: recentTimestamp(),
      skill: "round-trip-skill",
    }

    await writeCurrentTaskTo(contextFile, task)
    const result = await readCurrentTaskFrom(contextFile)

    expect(result).not.toBeNull()
    expect(result!.task_id).toBe(task.task_id)
    expect(result!.skill).toBe(task.skill)
    // started_at should survive serialisation
    expect(result!.started_at).toBe(task.started_at)
  })

  test("creates nested parent directories as needed", async () => {
    const deepFile = path.join(tmpDir, "a", "b", "c", "current-task.json")
    const task: CurrentTask = {
      task_id: "deep-task",
      started_at: recentTimestamp(),
      skill: "deep-skill",
    }
    await writeCurrentTaskTo(deepFile, task)

    const result = await readCurrentTaskFrom(deepFile)
    expect(result!.task_id).toBe("deep-task")
  })
})
