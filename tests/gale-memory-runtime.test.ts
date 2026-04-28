import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { existsSync } from "node:fs"
import { chmod, mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  buildTaskEnvelope,
  captureTaskMemory,
  feedbackTaskMemory,
  startTaskMemory,
  storeSessionTranscript,
} from "../src/memory/task-runtime.js"
import { HktClient } from "../src/memory/hkt-client.js"

class FakeHktClient {
  recallEnvelope: Record<string, unknown> | null = null
  captureEvent: Record<string, unknown> | null = null
  transcript: Record<string, unknown> | null = null

  async taskRecall(envelope: Record<string, unknown>) {
    this.recallEnvelope = envelope
    return {
      success: true,
      trace_id: "trace-123",
      injectable_markdown:
        "<untrusted-memory-evidence>debug context</untrusted-memory-evidence>",
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

  async storeSessionTranscript(transcript: Record<string, unknown>) {
    this.transcript = transcript
    return {
      success: true,
      L2: "memory-session-123",
      diagnostics: {},
    }
  }
}

describe("Gale task memory runtime", () => {
  let tmpDir: string
  let contextFile: string
  let oldKnowledgeHome: string | undefined
  let oldMemoryDir: string | undefined
  let oldHermesMemoryDir: string | undefined
  let oldHermesRecall: string | undefined
  let oldHermesBin: string | undefined

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-memory-runtime-"))
    oldKnowledgeHome = process.env.GALE_KNOWLEDGE_HOME
    oldMemoryDir = process.env.HKT_MEMORY_DIR
    oldHermesMemoryDir = process.env.HERMES_HKTMEMORY_DIR
    oldHermesRecall = process.env.HERMES_HKTMEMORY_RECALL
    oldHermesBin = process.env.HERMES_HKTMEMORY_BIN
    process.env.GALE_KNOWLEDGE_HOME = path.join(tmpDir, "knowledge")
    delete process.env.HKT_MEMORY_DIR
    delete process.env.HERMES_HKTMEMORY_DIR
    delete process.env.HERMES_HKTMEMORY_RECALL
    delete process.env.HERMES_HKTMEMORY_BIN
    contextFile = path.join(
      tmpDir,
      ".context",
      "galeharness-cli",
      "current-task.json",
    )
    await mkdir(path.dirname(contextFile), { recursive: true })
  })

  afterEach(async () => {
    if (oldKnowledgeHome === undefined) delete process.env.GALE_KNOWLEDGE_HOME
    else process.env.GALE_KNOWLEDGE_HOME = oldKnowledgeHome
    if (oldMemoryDir === undefined) delete process.env.HKT_MEMORY_DIR
    else process.env.HKT_MEMORY_DIR = oldMemoryDir
    if (oldHermesMemoryDir === undefined)
      delete process.env.HERMES_HKTMEMORY_DIR
    else process.env.HERMES_HKTMEMORY_DIR = oldHermesMemoryDir
    if (oldHermesRecall === undefined)
      delete process.env.HERMES_HKTMEMORY_RECALL
    else process.env.HERMES_HKTMEMORY_RECALL = oldHermesRecall
    if (oldHermesBin === undefined) delete process.env.HERMES_HKTMEMORY_BIN
    else process.env.HERMES_HKTMEMORY_BIN = oldHermesBin
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
      capture_policy: [
        "failed_attempt",
        "root_cause",
        "verification_result",
        "handoff_state",
        "next_action",
      ],
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
      capture_policy: [
        "failed_attempt",
        "root_cause",
        "verification_result",
        "handoff_state",
        "next_action",
      ],
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
    expect(result.recall.diagnostics?.memory_dir).toBe(
      path.join(tmpDir, "knowledge", "HKTMemory", "hkt-memory"),
    )
    expect(existsSync(path.join(tmpDir, "memory"))).toBe(false)
  })

  test("start migrates legacy local memory before recall", async () => {
    await mkdir(path.join(tmpDir, "memory", "L2-Full", "daily"), {
      recursive: true,
    })
    await writeFile(
      path.join(tmpDir, "memory", "L2-Full", "daily", "legacy.md"),
      "legacy\n",
      "utf8",
    )
    await writeFile(
      path.join(tmpDir, "memory", "vector_store.db"),
      "db",
      "utf8",
    )
    const client = new FakeHktClient()

    const result = await startTaskMemory(
      {
        cwd: tmpDir,
        contextFile,
        project: "HKTMemory",
        repoRoot: tmpDir,
        branch: "feature/task-memory",
        skill: "gh:debug",
      },
      client,
    )

    const memoryDir = path.join(tmpDir, "knowledge", "HKTMemory", "hkt-memory")
    expect(result.recall.diagnostics?.status).toBe("completed")
    expect(
      existsSync(path.join(memoryDir, "L2-Full", "daily", "legacy.md")),
    ).toBe(true)
    expect(existsSync(path.join(memoryDir, "vector_store.db"))).toBe(false)
    expect(
      existsSync(path.join(tmpDir, "memory", "L2-Full", "daily", "legacy.md")),
    ).toBe(true)
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
    expect(client.captureEvent?.summary).toBe(
      "Re-running the same test still fails",
    )
    expect(client.captureEvent?.payload).toEqual({ hypothesis: "cache issue" })
  })

  test("storeSessionTranscript sends phase completion transcript with provenance", async () => {
    const client = new FakeHktClient()

    const result = await storeSessionTranscript(
      {
        cwd: tmpDir,
        contextFile,
        project: "HKTMemory",
        repoRoot: tmpDir,
        branch: "feature/task-memory",
        skill: "gh:work",
        mode: "implement",
        phase: "completed",
        content: "Implemented transcript hooks and verified tests",
        summary: "Transcript hooks completed",
        files: ["src/memory/task-runtime.ts"],
        verification: { status: "passed", command: "bun test" },
        importance: "high",
      },
      client,
    )

    expect(result.store.success).toBe(true)
    expect(client.transcript?.source).toBe("galeharness")
    expect(client.transcript?.source_mode).toBe("phase_completed")
    expect(client.transcript?.project).toBe("HKTMemory")
    expect(client.transcript?.repo_root).toBe(tmpDir)
    expect(client.transcript?.branch).toBe("feature/task-memory")
    expect(client.transcript?.importance).toBe("high")
    expect(client.transcript?.metadata).toMatchObject({
      skill: "gh:work",
      phase: "completed",
      artifact_type: "work_session_transcript",
      summary: "Transcript hooks completed",
    })
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
    const client = new HktClient({
      binary: "__definitely_missing_hkt_memory__",
      cwd: tmpDir,
      timeoutMs: 50,
    })

    const result = await client.taskRecall({
      schema_version: "gale-task-memory.v1",
    })

    expect(result.success).toBe(false)
    expect(result.skipped).toBe(true)
    expect(String(result.reason)).toContain("hkt-memory unavailable")
  })

  test("HktClient passes HKT_MEMORY_DIR to child process", async () => {
    const hktTmpDir = await mkdtemp(
      path.join(tmpdir(), "gale-memory-hkt-client-"),
    )
    try {
      const script = path.join(hktTmpDir, "fake-hkt")
      const memoryDir = path.join(hktTmpDir, "custom-memory")
      await writeFile(
        script,
        "#!/usr/bin/env node\nconsole.log(JSON.stringify({ success: true, diagnostics: { child_memory_dir: process.env.HKT_MEMORY_DIR } })); process.exit(0)\n",
        "utf8",
      )
      await chmod(script, 0o755)
      const client = new HktClient({
        binary: script,
        cwd: hktTmpDir,
        timeoutMs: 10000,
        memoryDir,
      })

      const result = await client.taskRecall({
        schema_version: "gale-task-memory.v1",
      })

      expect(result.success).toBe(true)
      expect(result.diagnostics?.child_memory_dir).toBe(memoryDir)
    } finally {
      await rm(hktTmpDir, { recursive: true, force: true })
    }
  })

  test("HktClient prefers hermes-hktmemory provider recall when configured", async () => {
    const hktTmpDir = await mkdtemp(
      path.join(tmpdir(), "gale-memory-provider-"),
    )
    try {
      const providerScript = path.join(hktTmpDir, "fake-hermes-hktmemory")
      const hktScript = path.join(hktTmpDir, "fake-hkt")
      const providerMemoryDir = path.join(hktTmpDir, "provider-memory")
      await writeFile(
        providerScript,
        `#!/usr/bin/env node
const args = process.argv.slice(2)
console.log(JSON.stringify({
  items: [{ content: "provider memory hit", query: args[args.indexOf("-q") + 1], dir: process.env.HERMES_HKTMEMORY_DIR }]
}))
`,
        "utf8",
      )
      await writeFile(
        hktScript,
        "#!/usr/bin/env node\nconsole.log(JSON.stringify({ success: true, diagnostics: { backend: 'fallback' }, items: [{ content: 'fallback' }] }))\n",
        "utf8",
      )
      await chmod(providerScript, 0o755)
      await chmod(hktScript, 0o755)
      const client = new HktClient({
        binary: hktScript,
        providerBinary: providerScript,
        cwd: hktTmpDir,
        timeoutMs: 10000,
        providerMemoryDir,
      })

      const result = await client.taskRecall(
        {
          schema_version: "gale-task-memory.v1",
          input_summary: "resume failing test",
        },
        3,
      )

      expect(result.success).toBe(true)
      expect(result.diagnostics?.backend).toBe("provider_vector")
      expect(result.diagnostics?.hermes_hktmemory_dir).toBe(providerMemoryDir)
      expect(result.diagnostics?.provider_vector_query).toBe(
        "resume failing test",
      )
      expect(result.injectable_markdown).toContain("provider memory hit")
      expect(result.items?.[0]).toMatchObject({
        content: "provider memory hit",
        query: "resume failing test",
        dir: providerMemoryDir,
      })
    } finally {
      await rm(hktTmpDir, { recursive: true, force: true })
    }
  })

  test("HktClient falls back to hkt-memory task-recall when provider recall is empty", async () => {
    const hktTmpDir = await mkdtemp(
      path.join(tmpdir(), "gale-memory-provider-fallback-"),
    )
    try {
      const providerScript = path.join(hktTmpDir, "fake-hermes-hktmemory")
      const hktScript = path.join(hktTmpDir, "fake-hkt")
      await writeFile(
        providerScript,
        "#!/usr/bin/env node\nprocess.exit(0)\n",
        "utf8",
      )
      await writeFile(
        hktScript,
        "#!/usr/bin/env node\nconsole.log(JSON.stringify({ success: true, injectable_markdown: 'fallback markdown', items: [{ content: 'fallback' }], diagnostics: { backend: 'hkt_task_recall' } }))\n",
        "utf8",
      )
      await chmod(providerScript, 0o755)
      await chmod(hktScript, 0o755)
      const client = new HktClient({
        binary: hktScript,
        providerBinary: providerScript,
        cwd: hktTmpDir,
        timeoutMs: 10000,
        providerMemoryDir: path.join(hktTmpDir, "provider-memory"),
      })

      const result = await client.taskRecall({
        schema_version: "gale-task-memory.v1",
        input_summary: "resume failing test",
      })

      expect(result.success).toBe(true)
      expect(result.diagnostics?.backend).toBe("hkt_task_recall")
      expect(result.injectable_markdown).toBe("fallback markdown")
      expect(result.items?.[0]).toEqual({ content: "fallback" })
    } finally {
      await rm(hktTmpDir, { recursive: true, force: true })
    }
  })
})
