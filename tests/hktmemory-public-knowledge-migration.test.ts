import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

describe("HKTMemory public knowledge migration acceptance", () => {
  let tmpDir: string
  let oldKnowledgeHome: string | undefined
  let oldMemoryDir: string | undefined
  const projectRoot = path.resolve(import.meta.dir, "..")

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "hktmemory-public-acceptance-"))
    oldKnowledgeHome = process.env.GALE_KNOWLEDGE_HOME
    oldMemoryDir = process.env.HKT_MEMORY_DIR
    process.env.GALE_KNOWLEDGE_HOME = path.join(tmpDir, "knowledge")
    delete process.env.HKT_MEMORY_DIR
  })

  afterEach(async () => {
    if (oldKnowledgeHome === undefined) delete process.env.GALE_KNOWLEDGE_HOME
    else process.env.GALE_KNOWLEDGE_HOME = oldKnowledgeHome
    if (oldMemoryDir === undefined) delete process.env.HKT_MEMORY_DIR
    else process.env.HKT_MEMORY_DIR = oldMemoryDir
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("gale-memory status creates the global root without creating repo-local memory", async () => {
    const repo = path.join(tmpDir, "repo")
    await mkdir(repo, { recursive: true })

    const result = await runGaleMemory(["status", "--cwd", repo, "--project", "Project"])
    const body = JSON.parse(result.stdout) as Record<string, unknown>

    expect(result.exitCode).toBe(0)
    expect(body.status).toBe("global")
    expect(body.memory_dir).toBe(path.join(tmpDir, "knowledge", "Project", "hkt-memory"))
    expect(existsSync(path.join(tmpDir, "knowledge", "Project", "hkt-memory", "L2-Full", "evergreen", "MEMORY.md"))).toBe(true)
    expect(existsSync(path.join(repo, "memory"))).toBe(false)
  })

  test("gale-memory migrate copies legacy markdown, skips db files, and preserves local memory", async () => {
    const repo = path.join(tmpDir, "repo")
    await mkdir(path.join(repo, "memory", "L2-Full", "daily"), { recursive: true })
    await writeFile(path.join(repo, "memory", "L2-Full", "daily", "legacy.md"), "legacy\n", "utf8")
    await writeFile(path.join(repo, "memory", "bm25_index.db"), "db", "utf8")

    const result = await runGaleMemory(["migrate", "--cwd", repo, "--project", "Project"])
    const body = JSON.parse(result.stdout) as Record<string, any>
    const target = path.join(tmpDir, "knowledge", "Project", "hkt-memory")

    expect(result.exitCode).toBe(0)
    expect(body.migration.status).toBe("completed")
    expect(existsSync(path.join(target, "L2-Full", "daily", "legacy.md"))).toBe(true)
    expect(existsSync(path.join(target, "bm25_index.db"))).toBe(false)
    expect(existsSync(path.join(repo, "memory", "L2-Full", "daily", "legacy.md"))).toBe(true)
  })

  async function runGaleMemory(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const proc = Bun.spawn(["bun", "cmd/gale-memory/index.ts", ...args], {
      cwd: projectRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    })
    const [exitCode, stdout, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    return { exitCode, stdout, stderr }
  }
})
