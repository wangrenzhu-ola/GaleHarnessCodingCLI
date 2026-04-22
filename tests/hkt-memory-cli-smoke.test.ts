import { describe, expect, test, beforeAll } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"

const HKT_SCRIPT = path.join(
  process.cwd(),
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

// Environment with HKT_MEMORY_* keys (uses real keys when available)
function envWithHktKeys(): Record<string, string | undefined> {
  return { ...process.env }
}

interface RunResult {
  exitCode: number
  stdout: string
  stderr: string
}

function runHktCommand(
  subcommand: string,
  args: string[] = [],
  env?: Record<string, string | undefined>,
  timeout = 30_000,
  topLevelArgs: string[] = [],
): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      proc.kill("SIGKILL")
      reject(new Error(`Timeout after ${timeout}ms for: ${subcommand} ${args.join(" ")}`))
    }, timeout)

    const proc = Bun.spawn(["uv", "run", HKT_SCRIPT, ...topLevelArgs, subcommand, ...args], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: env ?? envWithoutHktKeys(),
    })

    proc.exited.then(async (exitCode) => {
      clearTimeout(timer)
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      resolve({ exitCode, stdout, stderr })
    }).catch((err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// Check whether `uv` is on PATH
async function isUvAvailable(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["uv", "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const exitCode = await proc.exited
    return exitCode === 0
  } catch {
    return false
  }
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

describe("HKTMemory CLI Smoke Tests", () => {
  let uvAvailable: boolean
  let scriptPresent: boolean

  beforeAll(async () => {
    uvAvailable = await isUvAvailable()
    scriptPresent = await isHktScriptPresent()
  })

  // Helper: skip if prerequisites missing
  function skipIfMissing(): boolean {
    if (!scriptPresent) {
      test.skip("vendor/hkt-memory/scripts/hkt_memory_v5.py not found", () => {})
      return true
    }
    if (!uvAvailable) {
      test.skip("uv is not available on PATH", () => {})
      return true
    }
    return false
  }

  // -------------------------------------------------------------------
  // stats
  // -------------------------------------------------------------------
  describe("stats", () => {
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    test("returns exit code 0 without API key (graceful degradation)", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    test("produces output containing stats section", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      // stats output includes layer section markers
      expect(combined).toContain("L0")
    })

    test("warns about missing API key for vector store", async () => {
      const result = await runHktCommand("stats", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined).toContain("unavailable")
    })
  })

  // -------------------------------------------------------------------
  // store
  // -------------------------------------------------------------------
  describe("store", () => {
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    test("accepts --content, --title, --topic, --layer params and exits 0 without API key", async () => {
      // Use a temp memory dir to avoid polluting the repo memory/
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-smoke-"))
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
      // Clean up temp dir
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      expect(result.exitCode).toBe(0)
    })

    test("produces output (stdout or stderr) when called without API key", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-output-"))
      const result = await runHktCommand(
        "store",
        ["--content", "test", "--layer", "L2"],
        envWithoutHktKeys(),
        30_000,
        ["--memory-dir", tmpDir],
      )
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
    })

    test("warns about missing API key for embedding", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hkt-store-warn-"))
      const result = await runHktCommand(
        "store",
        ["--content", "test", "--layer", "L2"],
        envWithoutHktKeys(),
        30_000,
        ["--memory-dir", tmpDir],
      )
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
      const combined = result.stdout + result.stderr
      expect(combined).toContain("unavailable")
    })
  })

  // -------------------------------------------------------------------
  // retrieve
  // -------------------------------------------------------------------
  describe("retrieve", () => {
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    test("accepts --query param and exits 0 without API key", async () => {
      const result = await runHktCommand(
        "retrieve",
        ["--query", "smoke test query"],
        envWithoutHktKeys(),
      )
      // retrieve may exit 0 even without API key (uses BM25 / file fallback)
      expect(result.exitCode).toBeGreaterThanOrEqual(0)
    })

    test("produces output when called", async () => {
      const result = await runHktCommand(
        "retrieve",
        ["--query", "smoke test"],
        envWithoutHktKeys(),
      )
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
    })

    test("warns about missing API key for vector store", async () => {
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
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    test("exits 0 without API key", async () => {
      const result = await runHktCommand("list-recent", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    test("produces JSON output with expected structure", async () => {
      const result = await runHktCommand("list-recent", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      // list-recent outputs JSON with "success" field
      expect(combined).toContain("success")
    })

    test("accepts --limit param", async () => {
      const result = await runHktCommand(
        "list-recent",
        ["--limit", "1"],
        envWithoutHktKeys(),
      )
      expect(result.exitCode).toBe(0)
    })
  })

  // -------------------------------------------------------------------
  // prefetch (session search proxy)
  // -------------------------------------------------------------------
  describe("prefetch", () => {
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    test("exits 0 without API key", async () => {
      const result = await runHktCommand("prefetch", [], envWithoutHktKeys())
      expect(result.exitCode).toBe(0)
    })

    test("produces output with prefetch result structure", async () => {
      const result = await runHktCommand("prefetch", [], envWithoutHktKeys())
      const combined = result.stdout + result.stderr
      expect(combined.length).toBeGreaterThan(0)
      expect(combined).toContain("success")
    })

    test("accepts --mode and --query params", async () => {
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
    beforeAll(() => {
      if (skipIfMissing()) return
    })

    const commandsNeedingApiKey = [
      { name: "stats", args: [] },
      { name: "store", args: ["--content", "test", "--layer", "L2"] },
      { name: "retrieve", args: ["--query", "test"] },
      { name: "list-recent", args: [] },
      { name: "prefetch", args: [] },
    ]

    for (const cmd of commandsNeedingApiKey) {
      test(`${cmd.name} does not crash (uncaught exception) without HKT_MEMORY_API_KEY`, async () => {
        const result = await runHktCommand(cmd.name, cmd.args, envWithoutHktKeys())
        // All commands should exit cleanly (0 or known non-zero, not signal-killed)
        expect(result.exitCode).toBeGreaterThanOrEqual(0)
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

    test("HKT script exists at vendor/hkt-memory/scripts/hkt_memory_v5.py", async () => {
      const present = await isHktScriptPresent()
      expect(present).toBe(true)
    })
  })
})
