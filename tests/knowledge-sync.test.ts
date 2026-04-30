import { afterEach, describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

const repoRoot = path.join(import.meta.dir, "..")
const tempRoots: string[] = []

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  tempRoots.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})

async function runGaleKnowledge(
  cwd: string,
  knowledgeHome: string,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", path.join(repoRoot, "cmd", "gale-knowledge", "index.ts"), ...args], {
    cwd,
    env: {
      ...process.env,
      GALE_KNOWLEDGE_HOME: knowledgeHome,
    },
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

describe("gale-knowledge sync", () => {
  test("recursively syncs nested solution docs while preserving relative paths", async () => {
    const projectDir = await makeTempDir("gale-knowledge-project-")
    const knowledgeHome = await makeTempDir("gale-knowledge-home-")
    const projectName = path.basename(projectDir)
    const nestedSource = path.join(projectDir, "docs", "solutions", "best-practices", "nested.md")
    const topLevelSource = path.join(projectDir, "docs", "solutions", "top.md")

    await fs.mkdir(path.dirname(nestedSource), { recursive: true })
    await fs.writeFile(nestedSource, "# Nested solution\n")
    await fs.writeFile(topLevelSource, "# Top solution\n")

    const result = await runGaleKnowledge(projectDir, knowledgeHome, [
      "sync",
      "--direction",
      "project-to-global",
      "--type",
      "solutions",
    ])

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(result.stdout).toContain("best-practices")
    expect(await fs.readFile(path.join(knowledgeHome, projectName, "solutions", "best-practices", "nested.md"), "utf8")).toBe("# Nested solution\n")
    expect(await fs.readFile(path.join(knowledgeHome, projectName, "solutions", "top.md"), "utf8")).toBe("# Top solution\n")
  })
})
