import { describe, expect, test, beforeAll } from "bun:test"
import { promises as fs, accessSync } from "fs"
import path from "path"
import os from "os"

// P1-8: Use import.meta.dir instead of process.cwd() for stable path resolution
const HKT_SCRIPT = path.join(
  import.meta.dir,
  "..",
  "vendor",
  "hkt-memory",
  "scripts",
  "hkt_memory_v5.py",
)

// Environment without HKT_MEMORY_* keys for graceful-degradation tests
function envWithoutHktKeys(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env }
  delete env.HKT_MEMORY_API_KEY
  delete env.HKT_MEMORY_BASE_URL
  delete env.HKT_MEMORY_MODEL
  return env
}

// P1-7: Removed envWithHktKeys() dead code — it was identical to { ...process.env }

interface RunResult {
  exitCode: number
  stdout: string
  stderr: string
}

// P0-2: Fixed TDZ reference — proc is declared before the timer so the timeout
// callback can safely reference it even if Bun.spawn throws.
function runHktCommand(
  subcommand: string,
  args: string[] = [],
  env?: Record<string, string | undefined>,
  timeout = 30_000,
  topLevelArgs: string[] = [],
): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    let proc: ReturnType<typeof Bun.spawn>
    try {
      proc = Bun.spawn(["uv", "run", HKT_SCRIPT, ...topLevelArgs, subcommand, ...args], {
        cwd: path.join(import.meta.dir, ".."),
        stdout: "pipe",
        stderr: "pipe",
        env: env ?? envWithoutHktKeys(),
      })
    } catch (err) {
      reject(err)
      return
    }

    const timer = setTimeout(() => {
      proc.kill("SIGKILL")
      reject(new Error(`Timeout after ${timeout}ms for: ${subcommand} ${args.join(" ")}`))
    }, timeout)

    proc.exited.then(async (exitCode: number) => {
      clearTimeout(timer)
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      resolve({ exitCode, stdout, stderr })
    }).catch((err: unknown) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// Check whether `uv` is on PATH (synchronous — safe to call at module load time)
function isUvAvailableSync(): boolean {
  try {
    const proc = Bun.spawnSync(["uv", "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    return proc.exitCode === 0
  } catch {
    return false
  }
}

// Async version kept for the prerequisites info test
async function isUvAvailable(): Promise<boolean> {
  return isUvAvailableSync()
}

// Check whether the HKT script file exists
async function isHktScriptPresent(): Promise<boolean> {
  try {
    await fs.access(HKT_SCRIPT)
    return true
  } catch {
    return false
  }
}

// P1-4: Synchronous prerequisites check at module load time.
// Bun's test.skipIf evaluates its condition eagerly at declaration time,
// so we must determine prerequisites synchronously before describe blocks
// are parsed. File existence is sync-checkable; uv availability requires
// a heuristic (check common paths) or we accept that uv is usually on PATH
// in CI/dev and rely on the script-existence check as the primary gate.
function isScriptPresentSync(): boolean {
  try {
    accessSync(HKT_SCRIPT)
    return true
  } catch {
    return false
  }
}

const scriptPresentSync = isScriptPresentSync()
const uvAvailableSync = isUvAvailableSync()

// Both the HKT script and uv must be present; otherwise every test that
// calls runHktCommand will fail. Using Bun.spawnSync at module load time
// ensures skipIf evaluates the correct condition synchronously.
const skipIfMissing = test.skipIf(!scriptPresentSync || !uvAvailableSync)

describe("HKTMemory CLI Smoke Tests", () => {
  beforeAll(async () => {
    const uvOk = await isUvAvailable()
    const scriptOk = await isHktScriptPresent()
    if (!uvOk || !scriptOk) {
      console.warn("Prerequisites not met (uv or HKT script missing), some tests may fail or be skipped")
    }
  })

  // -------------------------------------------------------------------
  // stats
  // -------------------------------------------------------------------
  describe("stats", () => {
    skipIfMissing("returns exit code 0 without API key (graceful degradation)", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    skipIfMissing("produces output containing stats section", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      // stats output includes layer section markers
      expect(combined).toContain("L0")
    })

    skipIfMissing("warns about missing API key for vector store", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined).toContain("unavailable")
    })
  })

  // -------------------------------------------------------------------
  // store
  // -------------------------------------------------------------------
  describe("store", () => {
    skipIfMissing("accepts --content, --title, --topic, --layer params and exits 0 without API key", async () => {
      // Use a temp memory dir to avoid polluting the repo memory/
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-smoke-"))
      try {
        const result = await runHktCommand(
          "store",
          [
            "--content", "smoke test content",
            "--title", "Smoke Test Entry",
            "--topic", "smoke-test",
            "--layer", "L2",
          ],
          envWithoutHktKeys(),
          30_000,
          ["--memory-dir", tmpDir],
        )
        expect(result.exitCode).toBe(0)
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      }
    })

    skipIfMissing("produces output (stdout or stderr) when called without API key", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-output-"))
      try {
        const result = await runHktCommand(
          "store",
          ["--content", "test", "--layer", "L2"],
          envWithoutHktKeys(),
          30_000,
          ["--memory-dir", tmpDir],
        )
        const combined = result.stdout + result.stderr
        expect(combined.length).toBeGreaterThan(0)
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      }
    })

    skipIfMissing("warns about missing API key for embedding", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-warn-"))
      try {
        const result = await runHktCommand(
          "store",
          ["--content", "test", "--layer", "L2"],
          envWithoutHktKeys(),
          30_000,
          ["--memory-dir", tmpDir],
        )
        const combined = result.stdout + result.stderr
        expect(combined).toContain("unavailable")
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      }
    })
  })

  // -------------------------------------------------------------------
  // retrieve
  // -------------------------------------------------------------------
  describe("retrieve", () => {
    skipIfMissing("accepts --query param and exits 0 without API key", async () => {
      const result = await runHktCommand(
        "retrieve",
        ["--query", "smoke test query"],
        envWithoutHktKeys(),
      )
      // P2-9: Changed from toBeGreaterThanOrEqual(0) which is always true
      expect(result.exitCode).toBe(0)
    })

    skipIfMissing("produces output when called", async () => {
      const result = await runHktCommand(
        "retrieve",
        ["--query", "smoke test"],
        envWithoutHktKeys(),
      )
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
    })

    skipIfMissing("warns about missing API key for vector store", async () => {
      const result = await runHktCommand(
        "retrieve",
        ["--query", "test"],
        envWithoutHktKeys(),
      )
      const combined = result.stdout + result.stderr
      expect(combined).toContain("unavailable")
    })
  })

  // -------------------------------------------------------------------
  // list-recent
  // -------------------------------------------------------------------
  describe("list-recent", () => {
    skipIfMissing("exits 0 without API key", async () => {
      const result = await runHktCommand("list-recent", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    skipIfMissing("produces JSON output with expected structure", async () => {
      const result = await runHktCommand("list-recent", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      // list-recent outputs JSON with "success" field
      expect(combined).toContain("success")
    })

    skipIfMissing("accepts --limit param", async () => {
      const result = await runHktCommand(
        "list-recent",
        ["--limit", "1"],
        envWithoutHktKeys(),
      )
      expect(result.exitCode).toBe(0)
    })
  })

  // -------------------------------------------------------------------
  // P1-3: session-search smoke tests
  // -------------------------------------------------------------------
  describe("session-search", () => {
    skipIfMissing("accepts --query and --limit params and exits 0 without API key", async () => {
      const result = await runHktCommand(
        "session-search",
        ["--query", "test query", "--limit", "5"],
        envWithoutHktKeys(),
      )
      expect(result.exitCode).toBe(0)
    })

    skipIfMissing("produces output with session search result structure", async () => {
      const result = await runHktCommand(
        "session-search",
        ["--query", "test query", "--limit", "5"],
        envWithoutHktKeys(),
      )
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
    })

    skipIfMissing("warns about missing API key gracefully", async () => {
      const result = await runHktCommand(
        "session-search",
        ["--query", "test query"],
        envWithoutHktKeys(),
      )
      const combined = result.stdout + result.stderr
      // Should not crash with Python traceback
      expect(combined).not.toContain("Traceback (most recent call last)")
    })
  })

  // -------------------------------------------------------------------
  // prefetch (session search proxy)
  // -------------------------------------------------------------------
  describe("prefetch", () => {
    skipIfMissing("exits 0 without API key", async () => {
      const result = await runHktCommand("prefetch", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    skipIfMissing("produces output with prefetch result structure", async () => {
      const result = await runHktCommand("prefetch", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      expect(combined).toContain("success")
    })

    skipIfMissing("accepts --mode and --query params", async () => {
      const result = await runHktCommand(
        "prefetch",
        ["--mode", "debug", "--query", "test query"],
        envWithoutHktKeys(),
      )
      expect(result.exitCode).toBe(0)
    })
  })

  // -------------------------------------------------------------------
  // Missing environment variables — graceful degradation
  // -------------------------------------------------------------------
  describe("missing env vars — graceful degradation", () => {
    const commandsNeedingApiKey = [
      { name: "stats", args: [] },
      { name: "store", args: ["--content", "test", "--layer", "L2"] },
      { name: "retrieve", args: ["--query", "test"] },
      { name: "list-recent", args: [] },
      { name: "session-search", args: ["--query", "test"] },
      { name: "prefetch", args: [] },
    ]

    for (const cmd of commandsNeedingApiKey) {
      skipIfMissing(`${cmd.name} does not crash (uncaught exception) without HKT_MEMORY_API_KEY`, async () => {
        const result = await runHktCommand(cmd.name, cmd.args, envWithoutHktKeys())
        // P2-9: Changed from toBeGreaterThanOrEqual(0) — that's always true for exitCode.
        // The real check is that no Python traceback appears (uncaught exception).
        expect(result.exitCode).toBe(0)
        // Should produce some output (error message or degraded result)
        const combined = result.stdout + result.stderr
        expect(combined.length).toBeGreaterThan(0)
        // Should NOT contain Python traceback (indicates uncaught exception)
        expect(combined).not.toContain("Traceback (most recent call last)")
      })
    }
  })

  // -------------------------------------------------------------------
  // Prerequisites check
  // -------------------------------------------------------------------
  describe("prerequisites", () => {
    test("uv is available on PATH", async () => {
      // This test informs the developer; other tests skip if uv is missing
      const available = await isUvAvailable()
      if (!available) {
        console.warn("uv is not available on PATH — HKTMemory CLI tests will be skipped")
      }
      // We don't fail the suite if uv is missing; just inform
      expect(typeof available).toBe("boolean")
    })

    test("HKT script exists (vendor/hkt-memory/scripts/hkt_memory_v5.py)", async () => {
      const present = await isHktScriptPresent()
      expect(present).toBe(true)
    })
  })
})
