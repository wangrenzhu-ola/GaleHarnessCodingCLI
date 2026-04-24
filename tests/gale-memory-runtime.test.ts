import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  buildTaskEnvelope,
  captureTaskMemory,
  feedbackTaskMemory,
  startTaskMemory,
} from "../src/memory/task-runtime.js"
import { HktClient } from "../src/memory/hkt-client.js"

class FakeHktClient {
  recallEnvelope: Record<string, unknown> | null = null
  captureEvent: Record<string, unknown> | null = null

  async taskRecall(envelope: Record<string, unknown>) {
    this.recallEnvelope = envelope
    return {
      success: true,
      trace_id: "trace-123",
      injectable_markdown: "<untrusted-memory-evidence>debug context</untrusted-memory-evidence>",
      items: [],
      diagnostics: {},
    }
  }

  async taskCapture(event: Record<string, unknown>) {
    this.captureEvent = event
    return {
      success: true,
      event_id: "capture-123",
      trace_id: "trace-124",
      ledger_updated: true,
      durable_memory_id: null,
      memory_link_required: false,
      diagnostics: {},
    }
  }
}

describe("Gale task memory runtime", () => {
  let tmpDir: string
  let contextFile: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-memory-runtime-"))
    contextFile = path.join(tmpDir, ".context", "galeharness-cli", "current-task.json")
    await mkdir(path.dirname(contextFile), { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("valid current-task generates a complete envelope", async () => {
    await writeFile(
      contextFile,
      JSON.stringify({
        task_id: "task-current",
        started_at: new Date().toISOString(),
        skill: "gh:debug",
      }),
      "utf8",
    )

    const envelope = await buildTaskEnvelope({
      cwd: tmpDir,
      contextFile,
      project: "HKTMemory",
      repoRoot: tmpDir,
      branch: "feature/task-memory",
      skill: "gh:debug",
      mode: "debug",
      inputSummary: "Resume a failing test",
      artifactType: "debug_session",
      files: ["runtime/orchestrator.py"],
    })

    expect(envelope.task_id).toBe("task-current")
    expect(envelope.skill).toBe("gh:debug")
    expect(envelope.phase).toBe("start")
    expect(envelope.project).toBe("HKTMemory")
    expect(envelope.branch).toBe("feature/task-memory")
    expect(envelope.extensions.gale).toEqual({
      capture_policy: ["failed_attempt", "root_cause", "verification_result", "handoff_state", "next_action"],
      lineage_hints: { source: "current-task" },
    })
  })

  test("missing current-task falls back to deterministic branch lineage", async () => {
    const envelope = await buildTaskEnvelope({
      cwd: tmpDir,
      contextFile,
      project: "HKTMemory",
      repoRoot: tmpDir,
      branch: "feature/task-memory",
      skill: "gh:debug",
      mode: "debug",
      inputSummary: "Resume a failing test",
    })

    expect(envelope.task_id).toBe("branch:hktmemory:feature-task-memory")
    expect(envelope.extensions.gale).toEqual({
      capture_policy: ["failed_attempt", "root_cause", "verification_result", "handoff_state", "next_action"],
      lineage_hints: { source: "branch" },
    })
  })

  test("start calls HKT task-recall with the shared contract", async () => {
    const client = new FakeHktClient()

    const result = await startTaskMemory(
      {
        cwd: tmpDir,
        contextFile,
        project: "HKTMemory",
        repoRoot: tmpDir,
        branch: "feature/task-memory",
        skill: "gh:debug",
        mode: "debug",
        inputSummary: "Resume a failing test",
      },
      client,
    )

    expect(result.recall.success).toBe(true)
    expect(client.recallEnvelope?.schema_version).toBe("gale-task-memory.v1")
    expect(client.recallEnvelope?.artifact_type).toBe("debug_session")
  })

  test("capture sends structured events instead of raw store content", async () => {
    const client = new FakeHktClient()

    const result = await captureTaskMemory(
      {
        cwd: tmpDir,
        contextFile,
        project: "HKTMemory",
        repoRoot: tmpDir,
        branch: "feature/task-memory",
        skill: "gh:debug",
        mode: "debug",
        eventType: "failed_attempt",
        summary: "Re-running the same test still fails",
        payload: { hypothesis: "cache issue" },
      },
      client,
    )

    expect(result.capture.success).toBe(true)
    expect(client.captureEvent?.event_type).toBe("failed_attempt")
    expect(client.captureEvent?.summary).toBe("Re-running the same test still fails")
    expect(client.captureEvent?.payload).toEqual({ hypothesis: "cache issue" })
  })

  test("feedback is captured as a structured task event", async () => {
    const client = new FakeHktClient()

    await feedbackTaskMemory(
      {
        cwd: tmpDir,
        contextFile,
        project: "HKTMemory",
        repoRoot: tmpDir,
        branch: "feature/task-memory",
        skill: "gh:debug",
        mode: "debug",
        label: "wrong",
        memoryId: "mem-1",
        note: "stale after refactor",
      },
      client,
    )

    expect(client.captureEvent?.event_type).toBe("feedback")
    expect(client.captureEvent?.payload).toEqual({
      label: "wrong",
      memory_id: "mem-1",
      note: "stale after refactor",
      source: undefined,
    })
  })

  test("missing hkt-memory binary degrades to skipped result", async () => {
    const client = new HktClient({ binary: "__definitely_missing_hkt_memory__", cwd: tmpDir, timeoutMs: 50 })

    const result = await client.taskRecall({ schema_version: "gale-task-memory.v1" })

    expect(result.success).toBe(false)
    expect(result.skipped).toBe(true)
    expect(String(result.reason)).toContain("hkt-memory unavailable")
  })
})
