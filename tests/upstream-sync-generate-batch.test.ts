import { describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
}

const projectRoot = path.join(import.meta.dir, "..")
const scriptPath = path.join(projectRoot, "scripts", "upstream-sync", "generate-batch.py")
const expectedRoot = path.join(import.meta.dir, "fixtures", "upstream-sync", "expected-batch")

async function runCommand(cmd: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  const proc = Bun.spawn(cmd, {
    cwd,
    env: env ?? process.env,
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

async function runGit(args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<string> {
  const result = await runCommand(["git", ...args], cwd, env ?? gitEnv)
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  }
  return result.stdout.trim()
}

async function initRepo(prefix: string): Promise<string> {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  await runGit(["init", "-b", "main"], repoRoot)
  return repoRoot
}

async function commitFile(
  repoRoot: string,
  relativePath: string,
  content: string,
  message: string,
): Promise<string> {
  const filePath = path.join(repoRoot, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
  await runGit(["add", relativePath], repoRoot)
  await runGit(["commit", "-m", message], repoRoot)
  return runGit(["rev-parse", "HEAD"], repoRoot)
}

async function seedRepos() {
  const targetRepo = await initRepo("upstream-sync-target-")
  const upstreamRepo = await initRepo("upstream-sync-upstream-")

  const baseSha = await commitFile(
    upstreamRepo,
    "plugins/compound-engineering/skills/ce-demo/SKILL.md",
    "Use ce:plan from compound-engineering-plugin.\n",
    "chore: baseline",
  )

  await commitFile(
    targetRepo,
    "README.md",
    "target repo\n",
    "chore: init target",
  )
  await fs.writeFile(path.join(targetRepo, ".upstream-ref"), `${baseSha}\n`, "utf8")
  await fs.writeFile(path.join(targetRepo, ".upstream-repo"), `${upstreamRepo}\n`, "utf8")

  return { targetRepo, upstreamRepo, baseSha }
}

describe("generate-batch.py", () => {
  test("creates raw/adapted patches plus baseline metadata for the next sync", async () => {
    const { targetRepo, upstreamRepo, baseSha } = await seedRepos()
    const commitOne = await commitFile(
      upstreamRepo,
      "plugins/compound-engineering/skills/ce-demo/SKILL.md",
      "Use ce:plan from compound-engineering-plugin.\nRename ce-demo.\n",
      "feat: rename ce demo",
    )
    const commitTwo = await commitFile(
      upstreamRepo,
      "plugins/compound-engineering/skills/ce-demo/notes.md",
      "compound-engineering-plugin note\n",
      "docs: add notes: batch context",
    )

    const result = await runCommand(
      [
        "python3",
        scriptPath,
        "--target-repo",
        targetRepo,
        "--upstream-repo",
        upstreamRepo,
        "--batch-date",
        "2026-04-21",
        "--generated-at",
        "2026-04-21T12:00:00+00:00",
      ],
      projectRoot,
      gitEnv,
    )

    expect(result.exitCode).toBe(0)
    const batchDir = path.join(targetRepo, ".context", "galeharness-cli", "upstream-sync", "2026-04-21")
    const rawFiles = (await fs.readdir(path.join(batchDir, "raw"))).sort()
    const adaptedFiles = (await fs.readdir(path.join(batchDir, "adapted"))).sort()
    expect(rawFiles).toEqual([
      "0001-feat-rename-ce-demo.patch",
      "0002-docs-add-notes-batch-context.patch",
    ])
    expect(adaptedFiles).toEqual(rawFiles)

    const commitRange = await fs.readFile(path.join(batchDir, "commit-range.txt"), "utf8")
    const expectedKeys = (await fs.readFile(path.join(expectedRoot, "commit-range.expected-keys.txt"), "utf8"))
      .trim()
      .split("\n")
    for (const key of expectedKeys) {
      expect(commitRange).toContain(key)
    }
    expect(commitRange).toContain(`baseline_before_batch: ${baseSha}`)
    expect(commitRange).toContain(`end_commit: ${commitTwo}`)
    expect(commitRange).toContain(`next_baseline_candidate: ${commitTwo}`)

    const readme = await fs.readFile(path.join(batchDir, "README.md"), "utf8")
    const snippets = (await fs.readFile(path.join(expectedRoot, "README.expected-snippets.md"), "utf8"))
      .trim()
      .split("\n")
    for (const snippet of snippets) {
      expect(readme).toContain(snippet)
    }
    expect(readme).toContain(baseSha)
    expect(readme).toContain(commitTwo)

    const adaptedPatch = await fs.readFile(path.join(batchDir, "adapted", rawFiles[0]), "utf8")
    expect(adaptedPatch).toContain("plugins/galeharness-cli/skills/gh-demo/SKILL.md")
    expect(adaptedPatch).not.toContain("compound-engineering")
    expect(result.stdout).toContain(commitOne)
    expect(result.stdout).toContain(commitTwo)
  })

  test("reports when there are no new upstream commits and does not create a batch", async () => {
    const { targetRepo, upstreamRepo } = await seedRepos()
    const result = await runCommand(
      [
        "python3",
        scriptPath,
        "--target-repo",
        targetRepo,
        "--upstream-repo",
        upstreamRepo,
        "--batch-date",
        "2026-04-21",
      ],
      projectRoot,
      gitEnv,
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("No new upstream commits")
    await expect(
      fs.access(path.join(targetRepo, ".context", "galeharness-cli", "upstream-sync", "2026-04-21")),
    ).rejects.toThrow()
  })

  test("fails when the baseline SHA is missing from upstream history", async () => {
    const { targetRepo, upstreamRepo } = await seedRepos()
    await fs.writeFile(path.join(targetRepo, ".upstream-ref"), "deadbeef\n", "utf8")

    const result = await runCommand(
      [
        "python3",
        scriptPath,
        "--target-repo",
        targetRepo,
        "--upstream-repo",
        upstreamRepo,
        "--batch-date",
        "2026-04-21",
      ],
      projectRoot,
      gitEnv,
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toContain("Command failed")
    expect(result.stderr).toContain("rev-parse --verify deadbeef^{commit}")
  })
})