import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { migrateLegacyMemory } from "../src/memory/migration.js"

describe("copy-first HKTMemory migration", () => {
  let tmpDir: string
  let targetDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "gale-memory-migration-"))
    targetDir = path.join(tmpDir, "knowledge", "Project", "hkt-memory")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("copies markdown memory and skips derived databases and arbitrary json", async () => {
    await mkdir(path.join(tmpDir, "memory", "L0-Abstract"), { recursive: true })
    await mkdir(path.join(tmpDir, "memory", "L2-Full", "daily"), { recursive: true })
    await writeFile(path.join(tmpDir, "memory", "L0-Abstract", "index.md"), "abstract\n", "utf8")
    await writeFile(path.join(tmpDir, "memory", "L2-Full", "daily", "note.md"), "daily\n", "utf8")
    await writeFile(path.join(tmpDir, "memory", "vector_store.db"), "db", "utf8")
    await writeFile(path.join(tmpDir, "memory", "state.json"), "{\"derived\":true}\n", "utf8")

    const result = migrateLegacyMemory({ cwd: tmpDir, targetDir })

    expect(result.status).toBe("completed")
    expect(existsSync(path.join(targetDir, "L0-Abstract", "index.md"))).toBe(true)
    expect(existsSync(path.join(targetDir, "L2-Full", "daily", "note.md"))).toBe(true)
    expect(existsSync(path.join(targetDir, "vector_store.db"))).toBe(false)
    expect(existsSync(path.join(targetDir, "state.json"))).toBe(false)
    expect(existsSync(path.join(tmpDir, "memory", "L2-Full", "daily", "note.md"))).toBe(true)
    expect(existsSync(path.join(targetDir, ".gale-migration-manifest.json"))).toBe(true)
  })

  test("allows only the explicit migration manifest json basename", async () => {
    await mkdir(path.join(tmpDir, "memory", "L1-Overview"), { recursive: true })
    await writeFile(path.join(tmpDir, "memory", "L1-Overview", "index.md"), "overview\n", "utf8")
    await writeFile(
      path.join(tmpDir, "memory", ".gale-migration-manifest.json"),
      "{\"status\":\"completed\"}\n",
      "utf8",
    )
    await writeFile(path.join(tmpDir, "memory", "manifest.json"), "{\"status\":\"derived\"}\n", "utf8")

    const result = migrateLegacyMemory({ cwd: tmpDir, targetDir })

    expect(result.status).toBe("completed")
    expect(existsSync(path.join(targetDir, ".gale-migration-manifest.json"))).toBe(true)
    expect(readFileSync(path.join(targetDir, ".gale-migration-manifest.json"), "utf8")).toContain("\"status\": \"completed\"")
    expect(existsSync(path.join(targetDir, "manifest.json"))).toBe(false)
  })

  test("does not overwrite conflicting target markdown", async () => {
    await mkdir(path.join(tmpDir, "memory", "L2-Full", "daily"), { recursive: true })
    await mkdir(path.join(targetDir, "L2-Full", "daily"), { recursive: true })
    await writeFile(path.join(tmpDir, "memory", "L2-Full", "daily", "note.md"), "source\n", "utf8")
    await writeFile(path.join(targetDir, "L2-Full", "daily", "note.md"), "target\n", "utf8")

    const result = migrateLegacyMemory({ cwd: tmpDir, targetDir })

    expect(result.status).toBe("migration-conflict")
    expect(result.conflicts).toEqual(["L2-Full/daily/note.md"])
    expect(readFileSync(path.join(targetDir, "L2-Full", "daily", "note.md"), "utf8")).toBe("target\n")
    expect(readFileSync(path.join(targetDir, "MIGRATION_CONFLICTS.md"), "utf8")).toContain("L2-Full/daily/note.md")
  })

  test("is idempotent after a completed migration", async () => {
    await mkdir(path.join(tmpDir, "memory", "L1-Overview"), { recursive: true })
    await writeFile(path.join(tmpDir, "memory", "L1-Overview", "index.md"), "overview\n", "utf8")

    const first = migrateLegacyMemory({ cwd: tmpDir, targetDir })
    const second = migrateLegacyMemory({ cwd: tmpDir, targetDir })

    expect(first.copied).toBeGreaterThan(0)
    expect(second.copied).toBe(0)
    expect(second.skipped).toBeGreaterThan(0)
    expect(second.status).toBe("completed")
  })
})
