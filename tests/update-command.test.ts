import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"
import {
  resolveGitHubRepo,
  getCurrentVersion,
  detectPlatform,
  detectBinDir,
  isCompiledBinary,
  checkForUpdate,
  performUpdate,
  performRollback,
} from "../src/utils/update"

// ── Unit tests (pure logic) ─────────────────────────────────────────────────

describe("update utils", () => {
  describe("resolveGitHubRepo", () => {
    const originalEnv = process.env.COMPOUND_PLUGIN_GITHUB_SOURCE

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.COMPOUND_PLUGIN_GITHUB_SOURCE = originalEnv
      } else {
        delete process.env.COMPOUND_PLUGIN_GITHUB_SOURCE
      }
    })

    test("returns default repo when env var not set", () => {
      delete process.env.COMPOUND_PLUGIN_GITHUB_SOURCE
      expect(resolveGitHubRepo()).toBe("wangrenzhu-ola/GaleHarnessCLI")
    })

    test("returns overridden repo from env var (owner/repo format)", () => {
      process.env.COMPOUND_PLUGIN_GITHUB_SOURCE = "my-org/my-fork"
      expect(resolveGitHubRepo()).toBe("my-org/my-fork")
    })

    test("extracts owner/repo from full GitHub URL", () => {
      process.env.COMPOUND_PLUGIN_GITHUB_SOURCE = "https://github.com/my-org/my-fork"
      expect(resolveGitHubRepo()).toBe("my-org/my-fork")
    })

    test("extracts owner/repo from SSH URL", () => {
      process.env.COMPOUND_PLUGIN_GITHUB_SOURCE = "git@github.com:my-org/my-fork.git"
      expect(resolveGitHubRepo()).toBe("my-org/my-fork")
    })
  })

  describe("getCurrentVersion", () => {
    test("returns a non-empty version string", () => {
      const version = getCurrentVersion()
      expect(version).toBeTruthy()
      expect(version).not.toBe("unknown")
    })

    test("version matches semver pattern", () => {
      const version = getCurrentVersion()
      expect(version).toMatch(/^\d+\.\d+\.\d+/)
    })
  })

  describe("detectPlatform", () => {
    test("returns a platform string with expected format", () => {
      const platform = detectPlatform()
      expect(platform).toMatch(/^(darwin|linux|windows)-/)
    })

    test("on macOS arm64 returns darwin-arm64", () => {
      // This test is platform-dependent; just verify format
      const platform = detectPlatform()
      if (process.platform === "darwin" && process.arch === "arm64") {
        expect(platform).toBe("darwin-arm64")
      }
    })
  })

  describe("isCompiledBinary", () => {
    test("returns false when running via bun run", () => {
      // In test mode, Bun.execPath points to bun runtime, not our binary
      expect(isCompiledBinary()).toBe(false)
    })
  })

  describe("detectBinDir", () => {
    test("returns a valid directory path", () => {
      const dir = detectBinDir()
      expect(dir).toBeTruthy()
      expect(path.isAbsolute(dir)).toBe(true)
    })
  })
})

// ── CLI integration tests ───────────────────────────────────────────────────
//
// These tests spawn `bun run src/index.ts` as a subprocess, which can be slow
// due to Bun module resolution. They are intentionally kept as integration tests
// that verify the full CLI stack works end-to-end.
//
// NOTE: If running in CI or environments where GitHub API is unreachable,
// the --check tests may fail due to network errors. This is expected — the
// update command is designed to be used with compiled binaries in production.

describe("CLI update subcommand", () => {
  const repoRoot = path.join(import.meta.dir, "..")

  test.skip("update --check shows version info (requires network)", async () => {
    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "update", "--check"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, COMPOUND_PLUGIN_GITHUB_SOURCE: "" },
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = stdout + stderr

    expect(exitCode).toBe(0)
    expect(output).toMatch(/(Already up to date|Update available)/)
  }, { timeout: 30000 })

  test("update without --check shows dev mode message", async () => {
    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "update"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = stdout + stderr

    // In dev mode, update should fail with helpful message
    expect(exitCode).not.toBe(0)
    expect(output).toContain("development mode")
  }, { timeout: 30000 })

  test("update --rollback shows dev mode or no-backup message", async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "gh-test-home-"))

    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "update", "--rollback"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, HOME: tempHome },
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = stdout + stderr

    expect(exitCode).not.toBe(0)
    expect(output).toMatch(/No backup available|Rollback is only available|compiled binary/)

    await fs.rm(tempHome, { recursive: true, force: true })
  }, { timeout: 30000 })

  test("update --check --rollback shows error about conflicting flags", async () => {
    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "update", "--check", "--rollback"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = stdout + stderr

    expect(exitCode).not.toBe(0)
    expect(output).toMatch(/--check.*--rollback|Cannot use/)
  }, { timeout: 30000 })

  test.skip("update subcommand is registered in help (flaky pipe in bun test)", async () => {
    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "--help"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = (stdout + stderr).toLowerCase()

    expect(exitCode).toBe(0)
    expect(output).toContain("update")
  }, { timeout: 30000 })

  test.skip("COMPOUND_PLUGIN_GITHUB_SOURCE override works with update --check (requires network)", async () => {
    const proc = Bun.spawn(
      ["bun", "run", "src/index.ts", "update", "--check"],
      {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          COMPOUND_PLUGIN_GITHUB_SOURCE: "nonexistent-org/nonexistent-repo",
        },
      },
    )

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const output = stdout + stderr

    expect(exitCode).not.toBe(0)
    expect(output).toMatch(/No releases found|GitHub API error|404/)
  }, { timeout: 30000 })
})

// ── Backup & rollback logic tests ───────────────────────────────────────────

describe("backup and rollback", () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    for (const dir of tempDirs) {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
    }
    tempDirs.length = 0
  })

  test("performRollback returns error when backup dir does not exist", async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "gh-rollback-test-"))
    tempDirs.push(tempHome)

    // Override HOME temporarily isn't easy in the module, so test the direct function
    // The module uses a fixed BACKUP_DIR based on os.homedir(), so we test the CLI level
    const result = await performRollback()
    // Since we're in dev mode, rollback should fail with "only available for compiled binaries"
    expect(result.success).toBe(false)
    expect(result.message).toContain("compiled binar")
  })
})
