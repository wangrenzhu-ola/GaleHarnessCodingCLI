import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { ensurePublicMemoryRoot, resolvePublicMemoryRoot } from "../src/memory/public-root.js"

describe("Gale-managed HKTMemory public root", () => {
  let tmpDir: string
  let oldKnowledgeHome: string | undefined
  let oldMemoryDir: string | undefined

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-memory-root-"))
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

  test("derives public HKTMemory root under the knowledge project", () => {
    const resolved = resolvePublicMemoryRoot({ cwd: tmpDir, project: "MyProject" })

    expect(resolved.source).toBe("derived")
    expect(resolved.memoryDir).toBe(path.join(tmpDir, "knowledge", "MyProject", "hkt-memory"))
  })

  test("explicit memory dir wins over env and derived roots", () => {
    process.env.HKT_MEMORY_DIR = path.join(tmpDir, "env-memory")

    const resolved = resolvePublicMemoryRoot({
      cwd: tmpDir,
      project: "MyProject",
      memoryDir: path.join(tmpDir, "explicit-memory"),
    })

    expect(resolved.source).toBe("explicit")
    expect(resolved.memoryDir).toBe(path.join(tmpDir, "explicit-memory"))
  })

  test("existing HKT_MEMORY_DIR is preserved for Gale-managed child calls", () => {
    process.env.HKT_MEMORY_DIR = path.join(tmpDir, "custom-memory")

    const resolved = resolvePublicMemoryRoot({ cwd: tmpDir, project: "MyProject" })

    expect(resolved.source).toBe("env")
    expect(resolved.memoryDir).toBe(path.join(tmpDir, "custom-memory"))
  })

  test("creates standard HKTMemory layer structure without local memory", () => {
    const resolved = resolvePublicMemoryRoot({ cwd: tmpDir, project: "MyProject" })

    ensurePublicMemoryRoot(resolved.memoryDir)

    expect(existsSync(path.join(resolved.memoryDir, "L0-Abstract", "topics"))).toBe(true)
    expect(existsSync(path.join(resolved.memoryDir, "L1-Overview", "topics"))).toBe(true)
    expect(existsSync(path.join(resolved.memoryDir, "L2-Full", "evergreen", "MEMORY.md"))).toBe(true)
    expect(existsSync(path.join(tmpDir, "memory"))).toBe(false)
  })

  test("rejects traversal project names", () => {
    expect(() => resolvePublicMemoryRoot({ cwd: tmpDir, project: "../bad" })).toThrow("Invalid path component")
  })
})
