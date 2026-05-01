import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "path"
import { appendEventToPath, type TaskEvent } from "../src/utils/sqlite-writer.js"
import { projectWorkflowRuns, readWorkflowEventsFromPath, rollupWorkflowRun } from "../src/workflow/projection.js"
import { validateHandoffArtifact, validateRunRelation, validateWorkflowDag } from "../src/workflow/validators.js"

function event(overrides: Partial<TaskEvent>): TaskEvent {
  return {
    task_id: "root",
    event_type: "workflow_started",
    timestamp: "2026-01-01T00:00:00.000Z",
    project: "demo",
    project_path: "/tmp/demo",
    ...overrides,
  } as TaskEvent
}

describe("workflow validators", () => {
  test("accepts a valid DAG with typed node fields", () => {
    const result = validateWorkflowDag({
      id: "gcw-demo",
      kind: "compound",
      nodes: [
        { id: "plan", kind: "skill", name: "Plan", skill: "gh:plan" },
        { id: "review-security", kind: "review_role", name: "Security review", role: "security", dependsOn: ["plan"] },
      ],
    })
    expect(result.valid).toBe(true)
  })

  test("rejects duplicate ids, missing dependencies, and cycles", () => {
    const shapeResult = validateWorkflowDag({
      id: "bad-shape",
      nodes: [
        { id: "a", kind: "skill", name: "A", dependsOn: ["missing"] },
        { id: "a", kind: "skill", name: "Duplicate" },
      ],
    })
    const cycleResult = validateWorkflowDag({
      id: "bad-cycle",
      nodes: [
        { id: "a", kind: "skill", name: "A", dependsOn: ["b"] },
        { id: "b", kind: "skill", name: "B", dependsOn: ["a"] },
      ],
    })
    expect(shapeResult.valid).toBe(false)
    expect(shapeResult.issues.map((issue) => issue.code)).toContain("node.id.duplicate")
    expect(shapeResult.issues.map((issue) => issue.code)).toContain("node.dependency.missing")
    expect(cycleResult.valid).toBe(false)
    expect(cycleResult.issues.map((issue) => issue.code)).toContain("dag.cycle")
  })

  test("accepts issue #96 DAG contract aliases", () => {
    const result = validateWorkflowDag({
      id: "gcw-96",
      nodes: [
        {
          id: "plan",
          kind: "skill",
          name: "Plan",
          type: "ai",
          depends_on: [],
          trigger_rule: "all_success",
          context_boundary: "inherit",
          input_artifacts: ["plan"],
          output_artifacts: ["handoff"],
          validators: ["schema", "tests"],
          parallel_group: "analysis",
          risk_level: "medium",
        },
        { id: "approve", kind: "manual", name: "Approve", type: "approval", depends_on: ["plan"] },
      ],
    })
    expect(result.valid).toBe(true)
  })

  test("rejects invalid runtime enum values and array shapes", () => {
    const dagResult = validateWorkflowDag({
      id: "bad-enums",
      nodes: [
        {
          id: "a",
          kind: "unsupported",
          name: "A",
          type: "robot",
          dependsOn: "b",
          produces: ["not-artifact"],
          consumes: "handoff",
          input_artifacts: ["handoff", 42],
          output_artifacts: "patch",
          validators: "schema",
          trigger_rule: "sometimes",
          context_boundary: "shared",
          risk_level: "extreme",
        },
      ],
    } as unknown as Parameters<typeof validateWorkflowDag>[0])
    const artifactResult = validateHandoffArtifact({ artifactId: "h1", runId: "r1", kind: "zip", path: "out.zip" } as unknown as Parameters<typeof validateHandoffArtifact>[0])
    const relationResult = validateRunRelation({ runId: "r1", relatedRunId: "r2", relationType: "cousin" } as unknown as Parameters<typeof validateRunRelation>[0])
    const codes = dagResult.issues.map((item) => item.code)
    expect(dagResult.valid).toBe(false)
    expect(codes).toContain("node.kind.invalid")
    expect(codes).toContain("node.type.invalid")
    expect(codes).toContain("node.dependsOn.invalid")
    expect(codes).toContain("node.produces.invalid")
    expect(codes).toContain("node.consumes.invalid")
    expect(codes).toContain("node.input_artifacts.invalid")
    expect(codes).toContain("node.output_artifacts.invalid")
    expect(codes).toContain("node.validators.invalid")
    expect(codes).toContain("node.trigger_rule.invalid")
    expect(codes).toContain("node.context_boundary.invalid")
    expect(codes).toContain("node.risk_level.invalid")
    expect(artifactResult.issues.map((item) => item.code)).toContain("artifact.kind.invalid")
    expect(relationResult.issues.map((item) => item.code)).toContain("relation.type.invalid")
  })
})

describe("workflow event projection", () => {
  let tmpDir: string
  let dbPath: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-workflow-test-"))
    dbPath = path.join(tmpDir, "tasks.db")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("projects events, handoff artifacts, review roles, and child rollups from ledger", async () => {
    await appendEventToPath(event({ task_id: "root", event_type: "workflow_started", run_type: "compound", title: "Root", timestamp: "2026-01-01T00:00:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "child", event_type: "skill_started", parent_task_id: "root", skill: "gh:work", timestamp: "2026-01-01T00:01:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "run_relation_linked", related_run_id: "child", relation_type: "child", timestamp: "2026-01-01T00:02:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "review_role_started", review_role: "security", node_id: "review-security", timestamp: "2026-01-01T00:03:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "review_role_completed", review_role: "security", node_id: "review-security", timestamp: "2026-01-01T00:04:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "handoff_artifact_linked", artifact_id: "handoff-1", artifact_type: "handoff", artifact_path: ".context/handoff.md", timestamp: "2026-01-01T00:05:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "child", event_type: "skill_completed", timestamp: "2026-01-01T00:06:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "workflow_completed", timestamp: "2026-01-01T00:07:00.000Z" }), dbPath)

    const events = readWorkflowEventsFromPath(dbPath)
    const runs = projectWorkflowRuns(events)
    const root = runs.find((run) => run.runId === "root")

    expect(root?.status).toBe("completed")
    expect(root?.childRunIds).toContain("child")
    expect(root?.artifacts[0].artifactId).toBe("handoff-1")
    expect(root?.reviewRoles[0]).toMatchObject({ role: "security", status: "completed" })

    const rollup = rollupWorkflowRun("root", runs)
    expect(rollup.totalRuns).toBe(2)
    expect(rollup.completedRuns).toBe(2)
    expect(rollup.artifactCount).toBe(1)
    expect(rollup.reviewRoleCount).toBe(1)
  })

  test("projects filtered rollups with recursive descendants", async () => {
    await appendEventToPath(event({ task_id: "root", event_type: "workflow_started", title: "Root", timestamp: "2026-01-01T00:00:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "child", event_type: "skill_started", parent_task_id: "root", timestamp: "2026-01-01T00:01:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "grandchild", event_type: "skill_started", parent_task_id: "child", timestamp: "2026-01-01T00:02:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "grandchild", event_type: "handoff_artifact_linked", artifact_id: "deep", artifact_type: "handoff", artifact_path: ".context/deep.md", timestamp: "2026-01-01T00:03:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "grandchild", event_type: "skill_completed", timestamp: "2026-01-01T00:04:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "child", event_type: "skill_completed", timestamp: "2026-01-01T00:05:00.000Z" }), dbPath)
    await appendEventToPath(event({ task_id: "root", event_type: "workflow_completed", timestamp: "2026-01-01T00:06:00.000Z" }), dbPath)

    const filteredEvents = readWorkflowEventsFromPath(dbPath, "root")
    const runs = projectWorkflowRuns(filteredEvents)
    const rollup = rollupWorkflowRun("root", runs)

    expect(runs.map((run) => run.runId)).toEqual(["root", "child", "grandchild"])
    expect(rollup.totalRuns).toBe(3)
    expect(rollup.completedRuns).toBe(3)
    expect(rollup.children[0]?.children[0]?.runId).toBe("grandchild")
    expect(rollup.artifactCount).toBe(1)
  })

  test("gale-task validate exits non-zero for malformed input", async () => {
    const malformedPath = path.join(tmpDir, "malformed.json")
    await writeFile(malformedPath, "{ not-json", "utf8")
    const proc = Bun.spawn(["bun", "run", "cmd/gale-task/index.ts", "validate", "--file", malformedPath], {
      cwd: path.resolve(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, stderr, exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])

    expect(exitCode).toBe(1)
    expect(stdout).toBe("")
    expect(stderr).toContain("[gale-task] validate error")
  })
})
