import { afterEach, describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { applySwiftAdapterResult, runSwiftAdapter } from "../src/morph/swift-adapter"

const tempRoots: string[] = []

async function makeTempDir(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "morph-swift-adapter-"))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})

describe("runSwiftAdapter", () => {
  test("reports adapter_unavailable when no executable is configured", async () => {
    const oldEnv = process.env.MORPH_SWIFT_ADAPTER
    delete process.env.MORPH_SWIFT_ADAPTER
    try {
      const result = await runSwiftAdapter({
        files: [],
        strategyFingerprint: "strategy-a",
        strategyTags: [],
        apply: true,
      })

      expect(result.ok).toBe(true)
      expect(result.unavailable).toBe(true)
      expect(result.warnings[0]).toContain("adapter_unavailable")
    } finally {
      if (oldEnv === undefined) {
        delete process.env.MORPH_SWIFT_ADAPTER
      } else {
        process.env.MORPH_SWIFT_ADAPTER = oldEnv
      }
    }
  })

  test("parses successful adapter output and writes transformed files explicitly", async () => {
    const root = await makeTempDir()
    const swiftFile = path.join(root, "Demo.swift")
    const adapter = path.join(root, "adapter.js")
    await fs.writeFile(swiftFile, "import Foundation\n")
    await fs.writeFile(
      adapter,
      [
        "#!/usr/bin/env bun",
        "const request = await new Response(Bun.stdin.stream()).json()",
        "console.log(JSON.stringify({ ok: true, files: request.files.map((file) => ({ path: file.path, changed: true, content: file.content + \"// transformed\\\\n\", warnings: [] })), warnings: [] }))",
        "",
      ].join("\n"),
      { mode: 0o755 },
    )

    const result = await runSwiftAdapter({
      files: [{ path: swiftFile, content: "import Foundation\n" }],
      strategyFingerprint: "strategy-a",
      strategyTags: ["import.alpha"],
      apply: true,
    }, { executable: adapter, cwd: root })

    expect(result.ok).toBe(true)
    expect(result.files[0].changed).toBe(true)
    const written = await applySwiftAdapterResult(result)
    expect(written).toEqual([swiftFile])
    expect(await fs.readFile(swiftFile, "utf8")).toContain("// transformed")
  })

  test("keeps original files when adapter exits non-zero", async () => {
    const root = await makeTempDir()
    const swiftFile = path.join(root, "Demo.swift")
    const adapter = path.join(root, "adapter.js")
    await fs.writeFile(swiftFile, "let value = 1\n")
    await fs.writeFile(
      adapter,
      ["#!/usr/bin/env bun", "console.error('boom')", "process.exit(2)", ""].join("\n"),
      { mode: 0o755 },
    )

    const result = await runSwiftAdapter({
      files: [{ path: swiftFile, content: "let value = 1\n" }],
      strategyFingerprint: "strategy-a",
      strategyTags: [],
      apply: true,
    }, { executable: adapter, cwd: root })

    expect(result.ok).toBe(false)
    expect(result.warnings).toContain("swift_adapter_failed")
    expect(await applySwiftAdapterResult(result)).toEqual([])
    expect(await fs.readFile(swiftFile, "utf8")).toBe("let value = 1\n")
  })

  test("reports invalid JSON without throwing", async () => {
    const root = await makeTempDir()
    const adapter = path.join(root, "adapter.js")
    await fs.writeFile(adapter, ["#!/usr/bin/env bun", "console.log('not json')", ""].join("\n"), { mode: 0o755 })

    const result = await runSwiftAdapter({
      files: [],
      strategyFingerprint: "strategy-a",
      strategyTags: [],
      apply: false,
    }, { executable: adapter, cwd: root })

    expect(result.ok).toBe(false)
    expect(result.warnings[0]).toContain("swift_adapter_invalid_json")
  })
})
