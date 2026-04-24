import { afterEach, describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"

const tempRoots: string[] = []
const repoRoot = path.join(import.meta.dir, "..")

async function makeTempProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "morph-command-"))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})

async function runCli(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", "src/index.ts", ...args], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
    env,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

describe("morph command", () => {
  test("runs detection-only when the Swift adapter is unavailable", async () => {
    const project = await makeTempProject()
    await fs.writeFile(path.join(project, "Demo.swift"), "import Foundation\nstruct Demo {}\n")

    const result = await runCli(["morph", "--json", project], {
      ...process.env,
      MORPH_SWIFT_ADAPTER: "",
    })

    expect(result.exitCode).toBe(0)
    const parsed = JSON.parse(result.stdout)
    expect(parsed.fingerprint.strategy).toStartWith("strategy:")
    expect(parsed.adapter.unavailable).toBe(true)
    expect(parsed.warnings.join("\n")).toContain("adapter_unavailable")
  })

  test("applies mock adapter output and writes a report file", async () => {
    const project = await makeTempProject()
    const reportPath = path.join(project, "morph-report.json")
    const adapter = path.join(project, "adapter.js")
    const swiftFile = path.join(project, "Demo.swift")
    await fs.writeFile(swiftFile, "import Foundation\nstruct Demo {}\n")
    await fs.writeFile(
      adapter,
      [
        "#!/usr/bin/env bun",
        "const request = await new Response(Bun.stdin.stream()).json()",
        "console.log(JSON.stringify({ ok: true, files: request.files.map((file) => ({ path: file.path, changed: true, content: file.content + \"// morph\\\\n\", warnings: [] })), warnings: [] }))",
        "",
      ].join("\n"),
      { mode: 0o755 },
    )

    const result = await runCli(["morph", "--apply", "--json", "--report", reportPath, "--seed", "seed-a", project], {
      ...process.env,
      MORPH_SWIFT_ADAPTER: adapter,
    })

    expect(result.exitCode).toBe(0)
    const parsed = JSON.parse(result.stdout)
    expect(parsed.applied).toBe(true)
    expect(parsed.filesChanged).toEqual([swiftFile])
    expect(await fs.readFile(swiftFile, "utf8")).toContain("// morph")
    const report = JSON.parse(await fs.readFile(reportPath, "utf8"))
    expect(report.seed).toBe("seed-a")
  })
})
