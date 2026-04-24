import { afterEach, describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"

const tempRoots: string[] = []
const repoRoot = path.join(import.meta.dir, "..")

async function makeTempProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "morph-audit-"))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})

async function runCli(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", "src/index.ts", ...args], {
    cwd: repoRoot,
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

describe("audit --similarity", () => {
  test("reports high similarity against a configured baseline", async () => {
    const project = await makeTempProject()
    const baseline = path.join(project, "baseline")
    await fs.mkdir(path.join(project, "Sources"), { recursive: true })
    await fs.mkdir(path.join(baseline, "Sources"), { recursive: true })
    const source = "import Foundation\nstruct Loader { func run() { if true { print(\"ok\") } } }\n"
    await fs.writeFile(path.join(project, "Sources", "Loader.swift"), source)
    await fs.writeFile(path.join(baseline, "Sources", "Loader.swift"), source)
    await fs.writeFile(
      path.join(project, ".morph-config.yaml"),
      ["seed: test", "baselines:", "  paths:", "    - baseline", "thresholds:", "  statementJaccard: 0.9", ""].join("\n"),
    )

    const result = await runCli(["audit", "--similarity", project])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Morph-X similarity audit: blocked")
    expect(result.stdout).toContain("Loader.swift")
    expect(result.stdout.match(/Loader\.swift/g)).toHaveLength(1)
  })

  test("prints parseable JSON output", async () => {
    const project = await makeTempProject()
    await fs.mkdir(path.join(project, "Sources"), { recursive: true })
    await fs.writeFile(path.join(project, "Sources", "Only.swift"), "import Foundation\nlet value = 1\n")

    const result = await runCli(["audit", "--similarity", "--json", project])

    expect(result.exitCode).toBe(0)
    const parsed = JSON.parse(result.stdout)
    expect(parsed.status).toBe("warning")
    expect(parsed.warnings).toContain("baseline_missing")
  })

  test("fails when fail-on-threshold is set and thresholds are exceeded", async () => {
    const project = await makeTempProject()
    const baseline = path.join(project, "baseline")
    await fs.mkdir(baseline, { recursive: true })
    const source = "struct Demo { func run() { return } }\n"
    await fs.writeFile(path.join(project, "Demo.swift"), source)
    await fs.writeFile(path.join(baseline, "Demo.swift"), source)

    const result = await runCli(["audit", "--similarity", "--baseline", baseline, "--fail-on-threshold", project])

    expect(result.exitCode).toBe(2)
    expect(result.stdout).toContain("blocked")
  })

  test("rejects invalid threshold values", async () => {
    const project = await makeTempProject()
    await fs.writeFile(path.join(project, "Demo.swift"), "struct Demo {}\n")

    const result = await runCli(["audit", "--similarity", "--threshold", "2", project])

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toContain("Invalid --threshold")
  })
})
