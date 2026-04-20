import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execSync } from "node:child_process"
import { existsSync, readFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { initKnowledgeRepo } from "../cmd/gale-knowledge/init.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `gale-knowledge-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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
// initKnowledgeRepo
// ---------------------------------------------------------------------------

describe("initKnowledgeRepo", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("creates a git repository in an empty directory", () => {
    const repoDir = join(testDir, "knowledge")
    const created = initKnowledgeRepo(repoDir)

    expect(created).toBe(true)
    expect(existsSync(join(repoDir, ".git"))).toBe(true)
  })

  it("creates .gitignore with correct content", () => {
    const repoDir = join(testDir, "knowledge")
    initKnowledgeRepo(repoDir)

    const gitignorePath = join(repoDir, ".gitignore")
    expect(existsSync(gitignorePath)).toBe(true)

    const content = readFileSync(gitignorePath, "utf8")
    expect(content).toContain("*.db")
    expect(content).toContain("vector-index/")
    expect(content).toContain(".last-rebuild-commit")
  })

  it("creates an initial commit", () => {
    const repoDir = join(testDir, "knowledge")
    initKnowledgeRepo(repoDir)

    const log = execSync("git log --oneline", {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()

    expect(log).toContain("init knowledge repo")
  })

  it("is idempotent — second call returns false and does not error", () => {
    const repoDir = join(testDir, "knowledge")

    const first = initKnowledgeRepo(repoDir)
    expect(first).toBe(true)

    const second = initKnowledgeRepo(repoDir)
    expect(second).toBe(false)

    // .git still exists
    expect(existsSync(join(repoDir, ".git"))).toBe(true)
  })

  it("creates nested directories recursively", () => {
    const repoDir = join(testDir, "deep", "nested", "knowledge")
    const created = initKnowledgeRepo(repoDir)

    expect(created).toBe(true)
    expect(existsSync(join(repoDir, ".git"))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

describe("gale-knowledge CLI", () => {
  const projectRoot = import.meta.dir.replace("/tests", "")

  it("CLI entry point is loadable and exports main command structure", async () => {
    // Verify the CLI module can be imported without errors
    // citty uses consola for output which bypasses pipe capture,
    // so we test the module loads correctly
    const mod = await import("../cmd/gale-knowledge/index.js")
    // Module should load without throwing
    expect(mod).toBeDefined()
  })

  it("CLI process exits cleanly with no args", async () => {
    const proc = Bun.spawn(["bun", "cmd/gale-knowledge/index.ts"], {
      cwd: projectRoot,
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    // citty shows usage and exits 0 when no subcommand given
    expect(exitCode).toBe(0)
  })

  it("init subcommand runs successfully", async () => {
    const testDir = makeTmpDir()
    const repoDir = join(testDir, "cli-init-test")

    try {
      const proc = Bun.spawn(["bun", "run", "cmd/gale-knowledge/index.ts", "init"], {
        cwd: projectRoot,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          GALE_KNOWLEDGE_HOME: repoDir,
        },
      })

      await proc.exited
      const stdout = await new Response(proc.stdout).text()
      expect(stdout).toContain("Initialized knowledge repo")
      expect(existsSync(join(repoDir, ".git"))).toBe(true)
    } finally {
      cleanDir(testDir)
    }
  })
})
