import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, readFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { setupCi, WORKFLOW_TEMPLATE } from "../cmd/gale-knowledge/ci-setup.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `gale-ci-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function cleanDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

// ---------------------------------------------------------------------------
// setupCi
// ---------------------------------------------------------------------------

describe("setupCi", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("generates workflow file at the correct path", () => {
    const result = setupCi({ knowledgeHome: testDir })

    const expectedPath = join(testDir, ".github", "workflows", "knowledge-index.yml")
    expect(result.workflowPath).toBe(expectedPath)
    expect(existsSync(expectedPath)).toBe(true)
  })

  it("workflow content contains required steps", () => {
    setupCi({ knowledgeHome: testDir })

    const content = readFileSync(
      join(testDir, ".github", "workflows", "knowledge-index.yml"),
      "utf8",
    )

    expect(content).toContain("name: Knowledge Index Update")
    expect(content).toContain("actions/checkout@v4")
    expect(content).toContain("astral-sh/setup-uv@v3")
    expect(content).toContain("github.event.before")
    expect(content).toContain("HKT_MEMORY_API_KEY")
    expect(content).toContain("hkt-memory ingest-artifact")
    expect(content).toContain(".last-rebuild-commit")
  })

  it("creates .github/workflows directory when it does not exist", () => {
    const workflowDir = join(testDir, ".github", "workflows")
    expect(existsSync(workflowDir)).toBe(false)

    setupCi({ knowledgeHome: testDir })

    expect(existsSync(workflowDir)).toBe(true)
  })

  it("overwrites existing workflow without error", () => {
    const first = setupCi({ knowledgeHome: testDir })
    expect(first.overwritten).toBe(false)

    const second = setupCi({ knowledgeHome: testDir })
    expect(second.overwritten).toBe(true)

    // File still valid
    const content = readFileSync(second.workflowPath, "utf8")
    expect(content).toBe(WORKFLOW_TEMPLATE)
  })

  it("workflow content matches the embedded template exactly", () => {
    setupCi({ knowledgeHome: testDir })

    const content = readFileSync(
      join(testDir, ".github", "workflows", "knowledge-index.yml"),
      "utf8",
    )
    expect(content).toBe(WORKFLOW_TEMPLATE)
  })
})
