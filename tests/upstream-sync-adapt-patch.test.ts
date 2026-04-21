import { describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

const projectRoot = path.join(import.meta.dir, "..")
const fixturesRoot = path.join(import.meta.dir, "fixtures", "upstream-sync", "sample-patches")
const scriptPath = path.join(projectRoot, "scripts", "upstream-sync", "adapt-patch.py")
const rulesPath = path.join(projectRoot, "scripts", "upstream-sync", "rename-rules.json")

async function runPython(args: string[]) {
  const proc = Bun.spawn(["python3", scriptPath, ...args], {
    cwd: projectRoot,
    stdout: "pipe",
    stderr: "pipe",
  })

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])

  return { exitCode, stdout, stderr }
}

describe("adapt-patch.py", () => {
  test("rewrites upstream paths and gh namespace tokens", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapt-patch-"))
    const outputPath = path.join(tempDir, "adapted.patch")

    const result = await runPython([
      "--input",
      path.join(fixturesRoot, "raw-skill.patch"),
      "--output",
      outputPath,
      "--rules",
      rulesPath,
    ])

    expect(result.exitCode).toBe(0)
    const output = await fs.readFile(outputPath, "utf8")
    expect(output).toContain("plugins/galeharness-cli/skills/gh-demo/SKILL.md")
    expect(output).toContain("Use gh:plan with galeharness-cli defaults.")
    expect(output).not.toContain("plugins/compound-engineering/")
    expect(output).not.toContain("ce:")
  })

  test("warns on binary patches while preserving structure", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapt-binary-"))
    const outputPath = path.join(tempDir, "binary.patch")

    const result = await runPython([
      "--input",
      path.join(fixturesRoot, "binary.patch"),
      "--output",
      outputPath,
      "--rules",
      rulesPath,
    ])

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain("Detected binary patch content")
    const output = await fs.readFile(outputPath, "utf8")
    expect(output).toContain("plugins/galeharness-cli/assets/logo.png")
    expect(output).toContain("Binary files /dev/null and b/plugins/galeharness-cli/assets/logo.png differ")
  })

  test("fails fast on invalid JSON rules", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapt-invalid-rules-"))
    const outputPath = path.join(tempDir, "adapted.patch")
    const badRulesPath = path.join(tempDir, "rules.json")
    await fs.writeFile(badRulesPath, "{not-json", "utf8")

    const result = await runPython([
      "--input",
      path.join(fixturesRoot, "raw-skill.patch"),
      "--output",
      outputPath,
      "--rules",
      badRulesPath,
    ])

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toContain("Rules file is not valid JSON")
  })
})
