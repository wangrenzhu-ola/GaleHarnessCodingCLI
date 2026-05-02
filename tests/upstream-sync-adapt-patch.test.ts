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
  test("rewrites upstream paths and gh namespace tokens without corrupting partial matches", async () => {
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

  test("does not corrupt non-command text while applying ce-to-gale mapping", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapt-safe-namespace-"))
    const inputPath = path.join(tempDir, "raw.patch")
    const outputPath = path.join(tempDir, "adapted.patch")
    await fs.writeFile(
      inputPath,
      [
        "From abc Mon Sep 17 00:00:00 2001\n",
        "Subject: [PATCH] docs: map ce namespace safely\n",
        "---\n",
        " plugins/compound-engineering/skills/ce-demo/SKILL.md | 4 ++++\n",
        " 1 file changed, 4 insertions(+)\n",
        "diff --git a/plugins/compound-engineering/skills/ce-demo/SKILL.md b/plugins/compound-engineering/skills/ce-demo/SKILL.md\n",
        "--- a/plugins/compound-engineering/skills/ce-demo/SKILL.md\n",
        "+++ b/plugins/compound-engineering/skills/ce-demo/SKILL.md\n",
        "@@ -1,0 +1,4 @@\n",
        "+Use ce:plan and /ce:review.\n",
        "+Keep source: explicit and https://example.com/ace:thing intact.\n",
        "+Prefer ce-demo only as a command slug.\n",
      ].join(""),
      "utf8",
    )

    const result = await runPython([
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--rules",
      rulesPath,
    ])

    expect(result.exitCode).toBe(0)
    const output = await fs.readFile(outputPath, "utf8")
    expect(output).toContain("plugins/galeharness-cli/skills/gh-demo/SKILL.md")
    expect(output).toContain("Use gh:plan and /gh:review.")
    expect(output).toContain("source: explicit")
    expect(output).toContain("https://example.com/ace:thing")
    expect(output).toContain("Prefer gh-demo only as a command slug.")
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