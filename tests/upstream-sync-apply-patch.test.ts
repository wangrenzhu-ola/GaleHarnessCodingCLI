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
const scriptPath = path.join(projectRoot, "scripts", "upstream-sync", "apply-patch-to-worktree.sh")

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

async function commitFile(repoRoot: string, relativePath: string, content: string, message: string) {
  const filePath = path.join(repoRoot, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
  await runGit(["add", relativePath], repoRoot)
  await runGit(["commit", "-m", message], repoRoot)
}

async function createPatch(repoRoot: string, relativePath: string, nextContent: string): Promise<string> {
  const filePath = path.join(repoRoot, relativePath)
  await fs.writeFile(filePath, nextContent, "utf8")
  const diffResult = await runCommand(["git", "diff", "--", relativePath], repoRoot, gitEnv)
  if (diffResult.exitCode !== 0) {
    throw new Error(`git diff failed\nstdout:\n${diffResult.stdout}\nstderr:\n${diffResult.stderr}`)
  }
  await runGit(["checkout", "--", relativePath], repoRoot)

  const patchDir = await fs.mkdtemp(path.join(os.tmpdir(), "upstream-sync-patch-"))
  const patchPath = path.join(patchDir, "0001-update.patch")
  await fs.writeFile(patchPath, diffResult.stdout, "utf8")
  return patchPath
}

describe("apply-patch-to-worktree.sh", () => {
  test("refuses to run in the main worktree without an explicit override", async () => {
    const repoRoot = await initRepo("apply-main-worktree-")
    await commitFile(repoRoot, "file.txt", "line 1\n", "chore: init")
    const patchPath = await createPatch(repoRoot, "file.txt", "line 1\nline 2\n")

    const result = await runCommand(["bash", scriptPath, patchPath], repoRoot, gitEnv)

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("main worktree")
    const fileContent = (await fs.readFile(path.join(repoRoot, "file.txt"), "utf8")).replace(/\r\n/g, "\n")
    expect(fileContent).toBe("line 1\n")
  })

  test("applies a patch cleanly inside a secondary worktree", async () => {
    const repoRoot = await initRepo("apply-secondary-worktree-")
    await commitFile(repoRoot, "file.txt", "line 1\n", "chore: init")
    const patchPath = await createPatch(repoRoot, "file.txt", "line 1\nline 2\n")

    const worktreeRoot = path.join(repoRoot, ".worktrees", "sync-test")
    await fs.mkdir(path.dirname(worktreeRoot), { recursive: true })
    await runGit(["worktree", "add", "-b", "sync-test", worktreeRoot, "main"], repoRoot)

    const result = await runCommand(["bash", scriptPath, patchPath], worktreeRoot, gitEnv)
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Patch applied successfully")
    const fileContent = (await fs.readFile(path.join(worktreeRoot, "file.txt"), "utf8")).replace(/\r\n/g, "\n")
    expect(fileContent).toBe("line 1\nline 2\n")
  })

  test("fails fast when the worktree is dirty", async () => {
    const repoRoot = await initRepo("apply-dirty-worktree-")
    await commitFile(repoRoot, "file.txt", "line 1\n", "chore: init")
    const patchPath = await createPatch(repoRoot, "file.txt", "line 1\nline 2\n")

    const worktreeRoot = path.join(repoRoot, ".worktrees", "dirty-test")
    await fs.mkdir(path.dirname(worktreeRoot), { recursive: true })
    await runGit(["worktree", "add", "-b", "dirty-test", worktreeRoot, "main"], repoRoot)
    await fs.writeFile(path.join(worktreeRoot, "scratch.txt"), "untracked\n", "utf8")

    const result = await runCommand(["bash", scriptPath, patchPath], worktreeRoot, gitEnv)

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("working tree is not clean")
  })
})