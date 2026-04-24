import { describe, expect, test, beforeEach } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

const projectRoot = path.join(import.meta.dir, "..")
const scriptPath = path.join(
  projectRoot,
  "scripts",
  "upstream-sync",
  "sync-cli.py",
)

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function runSyncCli(
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
) {
  const proc = Bun.spawn(
    ["python3", scriptPath, ...args],
    {
      cwd,
      env: env ?? gitEnv,
      stdout: "pipe",
      stderr: "pipe",
    },
  )
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

async function runGit(
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
): Promise<string> {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    env: env ?? gitEnv,
    stdout: "pipe",
    stderr: "pipe",
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  if (exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed (exit ${exitCode})\nstdout: ${stdout}\nstderr: ${stderr}`,
    )
  }
  return stdout.trim()
}

/** Create a minimal git repo that satisfies resolve_main_worktree_root(). */
async function initGitRepo(prefix: string): Promise<string> {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  await runGit(["init", "-b", "main"], repoRoot)
  // Need at least one commit for git worktree list to work
  const readmePath = path.join(repoRoot, "README.md")
  await fs.writeFile(readmePath, "test\n", "utf8")
  await runGit(["add", "."], repoRoot)
  await runGit(["commit", "-m", "init"], repoRoot)
  return repoRoot
}

function statePath(repoRoot: string): string {
  return path.join(
    repoRoot,
    ".context",
    "galeharness-cli",
    "upstream-sync",
    "state.json",
  )
}

async function writeState(
  repoRoot: string,
  stateObj: Record<string, any>,
): Promise<void> {
  const sp = statePath(repoRoot)
  await fs.mkdir(path.dirname(sp), { recursive: true })
  await fs.writeFile(sp, JSON.stringify(stateObj, null, 2) + "\n", "utf8")
}

async function readState(repoRoot: string): Promise<Record<string, any>> {
  const sp = statePath(repoRoot)
  return JSON.parse(await fs.readFile(sp, "utf8"))
}

async function configureUpstreamAtHead(repoRoot: string): Promise<string> {
  const headSha = await runGit(["rev-parse", "HEAD"], repoRoot)
  await fs.writeFile(path.join(repoRoot, ".upstream-ref"), headSha + "\n", "utf8")
  await fs.writeFile(path.join(repoRoot, ".upstream-repo"), repoRoot + "\n", "utf8")
  return headSha
}

async function writeMockGh(mockBin: string, json: string): Promise<void> {
  await fs.writeFile(path.join(mockBin, "gh"), `#!/bin/sh\necho '${json}'\n`, {
    mode: 0o755,
  })
  await fs.writeFile(path.join(mockBin, "gh.cmd"), `@echo off\r\necho ${json}\r\n`, "utf8")
}

function envWithMockBin(mockBin: string): NodeJS.ProcessEnv {
  const originalPath = process.env.PATH ?? process.env.Path ?? ""
  const mockPath = `${mockBin}${path.delimiter}${originalPath}`
  return {
    ...gitEnv,
    PATH: mockPath,
    Path: mockPath,
  }
}

function createMinimalState(
  repoRoot: string,
  overrides: Record<string, any> = {},
): Record<string, any> {
  return {
    schema_version: 1,
    main_worktree_root: repoRoot,
    target_repo_root: repoRoot,
    batch_dir: path.join(repoRoot, "batch-2026-04-24"),
    baseline_sha: "abc1234567890abcdef1234567890abcdef123456",
    target_sha: "def4567890abcdef1234567890abcdef12345678",
    base_branch: "main",
    remote_name: "origin",
    github_repo: "test-owner/test-repo",
    current_index: 0,
    workflow_state: "idle",
    commits: [
      {
        sequence: 1,
        sha: "aaa1111111111111111111111111111111111111",
        subject: "feat: first change",
        raw_patch: "/tmp/raw-1.patch",
        adapted_patch: "/tmp/adapted-1.patch",
        status: "pending",
        worktree_path: null,
        branch: null,
        base_branch: "main",
        pr_url: null,
        pr_number: null,
        pr_head_ref: null,
        pr_base_ref: null,
        failed_at: null,
        failure_summary: null,
      },
    ],
    operations: [],
    ...overrides,
  }
}

function makeCommitEntry(
  seq: number,
  overrides: Record<string, any> = {},
): Record<string, any> {
  return {
    sequence: seq,
    sha: `${seq}aa1111111111111111111111111111111111111`.slice(0, 40),
    subject: `feat: change ${seq}`,
    raw_patch: `/tmp/raw-${seq}.patch`,
    adapted_patch: `/tmp/adapted-${seq}.patch`,
    status: "pending",
    worktree_path: null,
    branch: null,
    base_branch: "main",
    pr_url: null,
    pr_number: null,
    pr_head_ref: null,
    pr_base_ref: null,
    failed_at: null,
    failure_summary: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sync-cli.py", () => {
  let repoRoot: string

  beforeEach(async () => {
    repoRoot = await initGitRepo("sync-cli-test-")
  })

  // =========================================================================
  // State schema read/write
  // =========================================================================
  describe("state schema", () => {
    test("status reports error and suggests init when no state.json exists", async () => {
      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).not.toBe(0)
      expect(r.stderr).toContain("init")
    })

    test("valid state.json is read correctly by status", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))
      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("Upstream Sync")
      expect(r.stdout).toContain("idle")
    })

    test("plain status output is UTF-8 safe under ascii Python IO settings", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))
      const r = await runSyncCli(["status"], repoRoot, {
        ...gitEnv,
        PYTHONIOENCODING: "ascii",
        LC_ALL: "C",
        LANG: "C",
      })
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("Upstream Sync")
      expect(r.stderr).not.toContain("UnicodeEncodeError")
    })

    test("invalid JSON in state.json causes exit code 3", async () => {
      const sp = statePath(repoRoot)
      await fs.mkdir(path.dirname(sp), { recursive: true })
      await fs.writeFile(sp, "{not valid json!!!", "utf8")

      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("JSON")
    })

    test("wrong schema_version causes error", async () => {
      await writeState(
        repoRoot,
        createMinimalState(repoRoot, { schema_version: 99 }),
      )
      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("schema_version")
    })
  })

  // =========================================================================
  // init subcommand
  // =========================================================================
  describe("init", () => {
    test("fails when .upstream-ref is missing", async () => {
      const r = await runSyncCli(["init"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain(".upstream-ref")
    })

    test("fails when .upstream-repo is missing", async () => {
      await fs.writeFile(
        path.join(repoRoot, ".upstream-ref"),
        "abc123\n",
        "utf8",
      )
      const r = await runSyncCli(["init"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain(".upstream-repo")
    })

    test("refuses to overwrite incomplete state without --force", async () => {
      // Write state with workflow_state != complete
      await writeState(
        repoRoot,
        createMinimalState(repoRoot, { workflow_state: "idle" }),
      )
      // Also write .upstream-ref and .upstream-repo so we get past those checks
      await fs.writeFile(
        path.join(repoRoot, ".upstream-ref"),
        "abc123\n",
        "utf8",
      )
      await fs.writeFile(
        path.join(repoRoot, ".upstream-repo"),
        repoRoot + "\n",
        "utf8",
      )

      const r = await runSyncCli(["init"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("未完成")
    })

    test("refuses corrupt existing state without --force", async () => {
      await configureUpstreamAtHead(repoRoot)
      const sp = statePath(repoRoot)
      await fs.mkdir(path.dirname(sp), { recursive: true })
      await fs.writeFile(sp, "{not valid json!!!", "utf8")

      const r = await runSyncCli(["init"], repoRoot)
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("无法读取")
      expect(r.stderr).toContain("--force")
    })

    test("no new upstream commits returns success without parsing JSON", async () => {
      await configureUpstreamAtHead(repoRoot)
      await runGit(
        ["remote", "add", "origin", "https://github.com/test-owner/test-repo.git"],
        repoRoot,
      )

      const r = await runSyncCli(["init"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("无需同步")
      await expect(fs.access(statePath(repoRoot))).rejects.toThrow()
    })

    test("--dry-run does not write state.json", async () => {
      // Need a valid baseline SHA from the repo
      const headSha = await runGit(["rev-parse", "HEAD"], repoRoot)
      await fs.writeFile(
        path.join(repoRoot, ".upstream-ref"),
        headSha + "\n",
        "utf8",
      )
      await fs.writeFile(
        path.join(repoRoot, ".upstream-repo"),
        repoRoot + "\n",
        "utf8",
      )
      // Add a remote so resolve_github_repo succeeds
      await runGit(
        ["remote", "add", "origin", "https://github.com/test-owner/test-repo.git"],
        repoRoot,
      )

      const r = await runSyncCli(["init", "--dry-run"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("dry-run")
      // state.json should not exist
      const sp = statePath(repoRoot)
      await expect(fs.access(sp)).rejects.toThrow()
    })
  })

  // =========================================================================
  // status subcommand
  // =========================================================================
  describe("status", () => {
    test("displays progress percentage and commit queue", async () => {
      const state = createMinimalState(repoRoot, {
        commits: [
          makeCommitEntry(1, { status: "merged" }),
          makeCommitEntry(2, { status: "pending" }),
          makeCommitEntry(3, { status: "pending" }),
        ],
        current_index: 1,
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("1/3")
      expect(r.stdout).toContain("33%")
      expect(r.stdout).toContain("feat: change 1")
      expect(r.stdout).toContain("feat: change 2")
    })

    test("--json returns valid JSON with next_commit", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))

      const r = await runSyncCli(["status", "--json"], repoRoot)
      expect(r.exitCode).toBe(0)
      const data = JSON.parse(r.stdout)
      expect(data.workflow_state).toBe("idle")
      expect(data.next_commit).toBeDefined()
      expect(data.next_commit.sequence).toBe(1)
    })

    test("--json returns null next_commit when all processed", async () => {
      const state = createMinimalState(repoRoot, {
        current_index: 1,
        workflow_state: "complete",
        commits: [makeCommitEntry(1, { status: "merged" })],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["status", "--json"], repoRoot)
      expect(r.exitCode).toBe(0)
      const data = JSON.parse(r.stdout)
      expect(data.next_commit).toBeNull()
    })

    test("no state.json returns non-zero exit code", async () => {
      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).not.toBe(0)
    })

    test("shows suggestion for awaiting_human_review state", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["status"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("resume")
    })
  })

  // =========================================================================
  // next subcommand
  // =========================================================================
  describe("next", () => {
    test("rejects when workflow_state is not idle", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "in_progress",
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("idle")
    })

    test("rejects when workflow_state is awaiting_human_review", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("resume")
    })

    test("rejects when workflow_state is failed", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "failed",
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("resume")
    })

    test("rejects when current commit is not pending (exit code 3)", async () => {
      const state = createMinimalState(repoRoot, {
        commits: [makeCommitEntry(1, { status: "merged" })],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("pending")
    })

    test("marks complete when current_index >= commits.length", async () => {
      const state = createMinimalState(repoRoot, {
        current_index: 1,
        commits: [makeCommitEntry(1, { status: "merged" })],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("完成")

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("complete")
    })

    test("--dry-run outputs preview without modifying state", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))

      const r = await runSyncCli(["next", "--dry-run"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("dry-run")
      expect(r.stdout).toContain("feat: first change")

      // State should remain unchanged
      const state = await readState(repoRoot)
      expect(state.workflow_state).toBe("idle")
      expect(state.commits[0].status).toBe("pending")
    })
  })

  // =========================================================================
  // resume subcommand
  // =========================================================================
  describe("resume", () => {
    test("rejects when workflow_state is idle", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))

      const r = await runSyncCli(["resume"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("failed")
      expect(r.stderr).toContain("awaiting_human_review")
    })

    test("rejects when workflow_state is complete", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "complete",
        current_index: 1,
        commits: [makeCommitEntry(1, { status: "merged" })],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("complete")
    })

    test("rejects when workflow_state is in_progress", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "in_progress",
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume"], repoRoot)
      expect(r.exitCode).toBe(1)
    })

    test("--dry-run from failed state shows recovery plan", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "failed",
        commits: [
          makeCommitEntry(1, {
            status: "failed",
            failed_at: "test",
            failure_summary: "bun test failed",
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume", "--dry-run"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("dry-run")
      expect(r.stdout).toContain("test")

      // State should not be modified
      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("failed")
    })

    test("--dry-run from awaiting_human_review shows PR check plan", async () => {
      const upstreamSha = await configureUpstreamAtHead(repoRoot)
      const state = createMinimalState(repoRoot, {
        baseline_sha: upstreamSha,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume", "--dry-run"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("dry-run")
      expect(r.stdout).toContain("42")
    })

    test("resume from failed: missing failed_at returns exit code 3", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "failed",
        commits: [
          makeCommitEntry(1, {
            status: "failed",
            failed_at: null,
            failure_summary: null,
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume"], repoRoot)
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("failed_at")
    })

    test("resume from awaiting_human_review: missing pr_number returns exit code 3", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            status: "awaiting_human_review",
            pr_number: null,
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume"], repoRoot)
      expect(r.exitCode).toBe(3)
    })

    test("resume from awaiting_human_review with PR open keeps state", async () => {
      // Create a mock gh script that returns OPEN status
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-mock-gh-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"OPEN","mergedAt":null,"url":"https://github.com/test/repo/pull/42","number":42,"headRefName":"upstream-sync-2026-04-24-0001-feat-change-1","baseRefName":"main"}',
      )

      const upstreamSha = await configureUpstreamAtHead(repoRoot)
      const state = createMinimalState(repoRoot, {
        baseline_sha: upstreamSha,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
          }),
        ],
      })
      await writeState(repoRoot, state)

      const envWithMockGh = envWithMockBin(mockBin)
      const r = await runSyncCli(["resume"], repoRoot, envWithMockGh)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("审查中")

      // State should remain awaiting_human_review
      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("awaiting_human_review")
    })

    test("KEY: resume after PR merged sets workflow_state to idle, not in_progress", async () => {
      // Create a mock gh that returns MERGED
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-mock-gh-merged-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"MERGED","mergedAt":"2026-04-24T12:00:00Z","url":"https://github.com/test/repo/pull/42","number":42,"headRefName":"upstream-sync-2026-04-24-0001-feat-change-1","baseRefName":"main"}',
      )

      const upstreamSha = await configureUpstreamAtHead(repoRoot)

      // Two commits: first awaiting review, second pending
      const state = createMinimalState(repoRoot, {
        baseline_sha: upstreamSha,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
            branch: "upstream-sync-2026-04-24-0001-feat-change-1",
            worktree_path: path.join(repoRoot, "nonexistent-wt"),
          }),
          makeCommitEntry(2),
        ],
      })
      await writeState(repoRoot, state)

      const envWithMockGh = envWithMockBin(mockBin)
      const r = await runSyncCli(["resume"], repoRoot, envWithMockGh)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      // KEY ASSERTION: resume does NOT auto-trigger next; state goes to idle
      expect(updated.workflow_state).toBe("idle")
      expect(updated.current_index).toBe(1)
      expect(updated.commits[0].status).toBe("merged")
    })

    test("resume after last PR merged sets workflow_state to complete", async () => {
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-mock-gh-complete-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"MERGED","mergedAt":"2026-04-24T12:00:00Z","url":"https://github.com/test/repo/pull/42","number":42,"headRefName":"upstream-sync-2026-04-24-0001-feat-change-1","baseRefName":"main"}',
      )

      const upstreamSha = await configureUpstreamAtHead(repoRoot)

      // Only one commit
      const state = createMinimalState(repoRoot, {
        baseline_sha: upstreamSha,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
            branch: "upstream-sync-2026-04-24-0001-feat-change-1",
            worktree_path: path.join(repoRoot, "nonexistent-wt"),
          }),
        ],
      })
      await writeState(repoRoot, state)

      const envWithMockGh = envWithMockBin(mockBin)
      const r = await runSyncCli(["resume"], repoRoot, envWithMockGh)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("complete")
      expect(updated.current_index).toBe(1)
    })

    test("resume after merged refuses to update upstream ref when ancestry check fails", async () => {
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-mock-gh-diverged-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"MERGED","mergedAt":"2026-04-24T12:00:00Z","url":"https://github.com/test/repo/pull/42","number":42,"headRefName":"upstream-sync-2026-04-24-0001-feat-change-1","baseRefName":"main"}',
      )

      const upstreamSha = await configureUpstreamAtHead(repoRoot)
      const invalidBaseline = "abc1234567890abcdef1234567890abcdef123456"
      const state = createMinimalState(repoRoot, {
        baseline_sha: invalidBaseline,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
            branch: "upstream-sync-2026-04-24-0001-feat-change-1",
            worktree_path: path.join(repoRoot, "nonexistent-wt"),
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["resume"], repoRoot, {
        ...gitEnv,
        PATH: envWithMockBin(mockBin).PATH,
      })
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toContain("upstream 对账失败")
      expect(await fs.readFile(path.join(repoRoot, ".upstream-ref"), "utf8")).toBe(
        upstreamSha + "\n",
      )

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("awaiting_human_review")
    })
  })

  // =========================================================================
  // skip subcommand
  // =========================================================================
  describe("skip", () => {
    test("skips pending commit and advances current_index", async () => {
      const state = createMinimalState(repoRoot, {
        commits: [makeCommitEntry(1), makeCommitEntry(2)],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("跳过")

      const updated = await readState(repoRoot)
      expect(updated.current_index).toBe(1)
      expect(updated.commits[0].status).toBe("skipped")
      expect(updated.workflow_state).toBe("idle")
    })

    test("skip records --reason in state", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))

      const r = await runSyncCli(
        ["skip", "--reason", "patch conflicts"],
        repoRoot,
      )
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.commits[0].failure_summary).toContain("patch conflicts")
    })

    test("skip last commit sets workflow_state to complete", async () => {
      const state = createMinimalState(repoRoot, {
        commits: [makeCommitEntry(1)],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("complete")
      expect(updated.current_index).toBe(1)
    })

    test("KEY: skip does NOT auto-trigger next", async () => {
      const state = createMinimalState(repoRoot, {
        commits: [makeCommitEntry(1), makeCommitEntry(2)],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      // After skip, state is idle — not in_progress
      expect(updated.workflow_state).toBe("idle")
      expect(updated.commits[1].status).toBe("pending")
    })

    test("skip of failed commit is allowed", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "failed",
        commits: [
          makeCommitEntry(1, {
            status: "failed",
            failed_at: "test",
            failure_summary: "test failure",
          }),
          makeCommitEntry(2),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.commits[0].status).toBe("skipped")
      expect(updated.current_index).toBe(1)
      expect(updated.workflow_state).toBe("idle")
    })

    test("skip of awaiting_human_review requires --force-cleanup", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
          }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toContain("--force-cleanup")
    })

    test("skip --dry-run previews without modifying state", async () => {
      await writeState(repoRoot, createMinimalState(repoRoot))

      const r = await runSyncCli(["skip", "--dry-run"], repoRoot)
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toContain("dry-run")

      const updated = await readState(repoRoot)
      expect(updated.commits[0].status).toBe("pending")
      expect(updated.current_index).toBe(0)
    })

    test("skip in_progress commit is rejected", async () => {
      const state = createMinimalState(repoRoot, {
        workflow_state: "in_progress",
        commits: [makeCommitEntry(1, { status: "in_progress" })],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(1)
    })

    test("skip with --force-cleanup on awaiting_human_review succeeds", async () => {
      // Mock gh for the push --delete (will fail, but skip still succeeds with warning)
      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            branch: "upstream-sync-2026-04-24-0001-feat-change-1",
            worktree_path: null,
          }),
          makeCommitEntry(2),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip", "--force-cleanup"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.commits[0].status).toBe("skipped")
      expect(updated.current_index).toBe(1)
      expect(updated.workflow_state).toBe("idle")
    })

    test("skip --force-cleanup skips remote deletion when PR metadata mismatches state", async () => {
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-mock-gh-cleanup-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"CLOSED","number":42,"headRefName":"upstream-sync-other","baseRefName":"main","headRepository":{"nameWithOwner":"test-owner/test-repo"}}',
      )

      const state = createMinimalState(repoRoot, {
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-2026-04-24-0001-feat-change-1",
            pr_base_ref: "main",
            branch: "upstream-sync-2026-04-24-0001-feat-change-1",
            worktree_path: null,
          }),
          makeCommitEntry(2),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["skip", "--force-cleanup"], repoRoot, {
        ...gitEnv,
        PATH: envWithMockBin(mockBin).PATH,
      })
      expect(r.exitCode).toBe(0)
      expect(r.stderr).toContain("PR 验真未通过")
      expect(r.stderr).toContain("headRefName")

      const updated = await readState(repoRoot)
      expect(updated.commits[0].status).toBe("skipped")
      expect(updated.current_index).toBe(1)
    })
  })

  // =========================================================================
  // Behavioral boundaries / edge cases
  // =========================================================================
  describe("behavioral boundaries", () => {
    test("complete is terminal: next on complete state with all processed returns complete", async () => {
      // current_index already past all commits
      const state = createMinimalState(repoRoot, {
        current_index: 2,
        workflow_state: "idle",
        commits: [
          makeCommitEntry(1, { status: "merged" }),
          makeCommitEntry(2, { status: "skipped" }),
        ],
      })
      await writeState(repoRoot, state)

      const r = await runSyncCli(["next"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("complete")
    })

    test("resume does not auto-next: merged state transitions to idle", async () => {
      // This is a duplicate of the KEY test in resume, but placed here for emphasis
      const mockBin = await fs.mkdtemp(
        path.join(os.tmpdir(), "sync-cli-boundary-"),
      )
      await writeMockGh(
        mockBin,
        '{"state":"MERGED","mergedAt":"2026-04-24T12:00:00Z","url":"https://github.com/test/repo/pull/42","number":42,"headRefName":"upstream-sync-test","baseRefName":"main"}',
      )

      const upstreamSha = await configureUpstreamAtHead(repoRoot)
      const state = createMinimalState(repoRoot, {
        baseline_sha: upstreamSha,
        target_sha: upstreamSha,
        workflow_state: "awaiting_human_review",
        commits: [
          makeCommitEntry(1, {
            sha: upstreamSha,
            status: "awaiting_human_review",
            pr_url: "https://github.com/test/repo/pull/42",
            pr_number: 42,
            pr_head_ref: "upstream-sync-test",
            pr_base_ref: "main",
            branch: "upstream-sync-test",
            worktree_path: null,
          }),
          makeCommitEntry(2),
          makeCommitEntry(3),
        ],
      })
      await writeState(repoRoot, state)

      const envWithMockGh = envWithMockBin(mockBin)
      const r = await runSyncCli(["resume"], repoRoot, envWithMockGh)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      expect(updated.workflow_state).toBe("idle")
      // Commits 2 and 3 are still pending — next was NOT auto-triggered
      expect(updated.commits[1].status).toBe("pending")
      expect(updated.commits[2].status).toBe("pending")
    })

    test("no subcommand prints help and returns non-zero", async () => {
      const r = await runSyncCli([], repoRoot)
      expect(r.exitCode).not.toBe(0)
    })

    test("operations log is capped at MAX_OPERATIONS (50)", async () => {
      const ops = Array.from({ length: 55 }, (_, i) => ({
        timestamp: "2026-04-24T00:00:00+00:00",
        operation: `op-${i}`,
        summary: `summary ${i}`,
      }))
      const state = createMinimalState(repoRoot, {
        operations: ops,
        commits: [makeCommitEntry(1)],
      })
      await writeState(repoRoot, state)

      // skip triggers add_operation which enforces the cap
      const r = await runSyncCli(["skip"], repoRoot)
      expect(r.exitCode).toBe(0)

      const updated = await readState(repoRoot)
      // MAX_OPERATIONS = 50, plus skip adds up to 2 new entries (skip + possibly complete)
      expect(updated.operations.length).toBeLessThanOrEqual(50)
    })
  })
})
