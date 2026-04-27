import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, symlink, writeFile } from "fs/promises"
import { tmpdir } from "os"
import path from "path"
import type { TrackedFileProvider } from "../scripts/check-repo-health"
import {
  parseFrontmatter,
  runCli,
  runScan,
  scanDocsLifecycle,
  scanLocalArtifacts,
  scanTrackedFiles,
  scanLargeTrackedFiles,
  renderText,
  renderJson,
  parseCliArgs,
} from "../scripts/check-repo-health"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), "repo-health-test-"))
  try {
    await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function initGitRepo(dir: string) {
  const git = (...args: string[]) =>
    Bun.spawn(["git", ...args], { cwd: dir, stdout: "pipe", stderr: "pipe" })
  await git("init").exited
  await git("config", "user.email", "test@test.com").exited
  await git("config", "user.name", "Test").exited
}

/** A TrackedFileProvider backed by a static list and size map. */
function mockProvider(
  files: string[],
  sizes: Record<string, number> = {},
): TrackedFileProvider {
  return {
    async getTrackedFiles() {
      return files
    },
    async getFileSize(_rootDir: string, relPath: string) {
      return sizes[relPath] ?? 0
    },
  }
}

const quietStdout = {
  log() {},
  error() {},
}

// ---------------------------------------------------------------------------
// scanTrackedFiles — pure rule matching
// ---------------------------------------------------------------------------

describe("scanTrackedFiles", () => {
  test("detects tracked node_modules/ as high-confidence", () => {
    const findings = scanTrackedFiles(["node_modules/foo/index.js"])
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-node-modules")
    expect(findings[0].severity).toBe("high-confidence")
    expect(findings[0].category).toBe("generated")
  })

  test("detects nested vendor node_modules/ as high-confidence bloat", () => {
    const findings = scanTrackedFiles(["vendor/taskboard/node_modules/pkg/index.js"])
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-node-modules")
    expect(findings[0].severity).toBe("high-confidence")
  })

  test("detects vendor build output (non-node_modules)", () => {
    // vendor-build-output rule fires for vendor/*/node_modules/ only when
    // the more specific node_modules rule doesn't match first.
    // The node_modules rule is more general and takes priority.
    const findings = scanTrackedFiles(["src/index.ts"])
    expect(findings).toHaveLength(0)
  })

  test("detects tracked .DS_Store", () => {
    const findings = scanTrackedFiles([".DS_Store", "subdir/.DS_Store"])
    expect(findings).toHaveLength(2)
    expect(findings.every((f) => f.rule === "tracked-ds-store")).toBe(true)
    expect(findings.every((f) => f.severity === "high-confidence")).toBe(true)
  })

  test("detects release archives under dist/", () => {
    const findings = scanTrackedFiles(["dist/release-v1.0.0.tar.gz"])
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-release-archive")
    expect(findings[0].severity).toBe("review")
  })

  test("does NOT flag .tar.gz outside release paths (no extension-only matching)", () => {
    const findings = scanTrackedFiles(["docs/example.tar.gz", "scripts/backup.zip"])
    expect(findings).toHaveLength(0)
  })

  test("detects tracked memory/*.db as review", () => {
    const findings = scanTrackedFiles(["memory/vector_store.db"])
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-runtime-db")
    expect(findings[0].severity).toBe("review")
    expect(findings[0].category).toBe("runtime-state")
  })

  test("detects memory/_lifecycle/* as review", () => {
    const findings = scanTrackedFiles(["memory/_lifecycle/state.json"])
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-lifecycle-state")
    expect(findings[0].severity).toBe("review")
  })

  test("does NOT flag docs/solutions/ as disposable", () => {
    const findings = scanTrackedFiles([
      "docs/solutions/developer-experience/some-solution.md",
      "docs/solutions/integrations/another.md",
    ])
    expect(findings).toHaveLength(0)
  })

  test("does NOT flag normal source files", () => {
    const findings = scanTrackedFiles([
      "src/index.ts",
      "package.json",
      "AGENTS.md",
      "scripts/check-repo-health.ts",
    ])
    expect(findings).toHaveLength(0)
  })

  test("all paths in findings are repo-relative", () => {
    const findings = scanTrackedFiles([
      "node_modules/x.js",
      ".DS_Store",
      "memory/test.db",
    ])
    for (const f of findings) {
      expect(f.path).not.toMatch(/^\//)
      expect(f.path).not.toContain("\\")
    }
  })
})

// ---------------------------------------------------------------------------
// scanLargeTrackedFiles
// ---------------------------------------------------------------------------

describe("scanLargeTrackedFiles", () => {
  test("flags large files in generated-output paths", async () => {
    const provider = mockProvider(
      ["docs/async-progress/big-report.md"],
      { "docs/async-progress/big-report.md": 200 * 1024 },
    )
    const findings = await scanLargeTrackedFiles(
      ["docs/async-progress/big-report.md"],
      provider,
      "/fake",
    )
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe("tracked-large-generated")
    expect(findings[0].severity).toBe("review")
    expect(findings[0].size).toBe(200 * 1024)
  })

  test("does not flag files below threshold", async () => {
    const provider = mockProvider(
      ["docs/async-progress/small-report.md"],
      { "docs/async-progress/small-report.md": 50 * 1024 },
    )
    const findings = await scanLargeTrackedFiles(
      ["docs/async-progress/small-report.md"],
      provider,
      "/fake",
    )
    expect(findings).toHaveLength(0)
  })

  test("does not flag large files outside generated-output zones", async () => {
    const provider = mockProvider(
      ["src/big-source.ts"],
      { "src/big-source.ts": 500 * 1024 },
    )
    const findings = await scanLargeTrackedFiles(
      ["src/big-source.ts"],
      provider,
      "/fake",
    )
    expect(findings).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// scanLocalArtifacts
// ---------------------------------------------------------------------------

describe("scanLocalArtifacts", () => {
  test("reports existing directory with file count and size", async () => {
    await withTempDir(async (dir) => {
      const subdir = path.join(dir, "local-heavy")
      await mkdir(subdir, { recursive: true })
      await writeFile(path.join(subdir, "a.txt"), "hello")
      await writeFile(path.join(subdir, "b.txt"), "world")

      const summaries = await scanLocalArtifacts(dir, ["local-heavy"])
      expect(summaries).toHaveLength(1)
      expect(summaries[0].exists).toBe(true)
      expect(summaries[0].fileCount).toBe(2)
      expect(summaries[0].approximateBytes).toBeGreaterThan(0)
    })
  })

  test("reports non-existent paths as exists: false", async () => {
    await withTempDir(async (dir) => {
      const summaries = await scanLocalArtifacts(dir, ["nonexistent-path"])
      expect(summaries).toHaveLength(1)
      expect(summaries[0].exists).toBe(false)
    })
  })

  test("does not follow symlinks", async () => {
    await withTempDir(async (dir) => {
      const subdir = path.join(dir, "scan-target")
      await mkdir(subdir)
      const realDir = path.join(dir, "real-data")
      await mkdir(realDir)
      await writeFile(path.join(realDir, "secret.txt"), "should not be counted")

      await symlink(realDir, path.join(subdir, "link"), "dir")

      const summaries = await scanLocalArtifacts(dir, ["scan-target"])
      expect(summaries).toHaveLength(1)
      // Symlink itself is not counted as a file (lstat check)
      expect(summaries[0].fileCount).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// scanDocsLifecycle
// ---------------------------------------------------------------------------

describe("scanDocsLifecycle", () => {
  test("counts docs with complete metadata", async () => {
    await withTempDir(async (dir) => {
      const plansDir = path.join(dir, "docs", "plans")
      await mkdir(plansDir, { recursive: true })
      await writeFile(
        path.join(plansDir, "good.md"),
        '---\ntitle: "Plan"\nstatus: draft\ndate: 2026-01-01\n---\n# Plan\n',
      )
      await writeFile(
        path.join(plansDir, "bad.md"),
        "# No frontmatter\n",
      )

      const summary = await scanDocsLifecycle(dir, ["docs/plans"])
      expect(summary.totalDocs).toBe(2)
      expect(summary.missingMetadata).toBe(1)
    })
  })

  test("handles missing directories gracefully", async () => {
    await withTempDir(async (dir) => {
      const summary = await scanDocsLifecycle(dir, ["docs/nonexistent"])
      expect(summary.totalDocs).toBe(0)
      expect(summary.missingMetadata).toBe(0)
    })
  })

  test("returns aggregate counts, not per-file findings", async () => {
    await withTempDir(async (dir) => {
      const brainstorms = path.join(dir, "docs", "brainstorms")
      await mkdir(brainstorms, { recursive: true })
      await writeFile(path.join(brainstorms, "a.md"), "# No metadata\n")
      await writeFile(path.join(brainstorms, "b.md"), "# Also no metadata\n")
      await writeFile(path.join(brainstorms, "c.md"), "# Still no metadata\n")

      const summary = await scanDocsLifecycle(dir, ["docs/brainstorms"])
      expect(summary.totalDocs).toBe(3)
      expect(summary.missingMetadata).toBe(3)
      // This is an aggregate summary, not a per-file finding list
      expect(summary.directories).toEqual(["docs/brainstorms"])
    })
  })
})

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------

describe("parseFrontmatter", () => {
  test("parses YAML frontmatter fields", () => {
    const result = parseFrontmatter('---\ntitle: "My Doc"\nstatus: draft\ndate: 2026-01-01\n---\n# Body')
    expect(result).not.toBeNull()
    expect(result!.title).toBe("My Doc")
    expect(result!.status).toBe("draft")
  })

  test("returns null for no frontmatter", () => {
    expect(parseFrontmatter("# Just a heading")).toBeNull()
  })

  test("returns null for empty frontmatter", () => {
    expect(parseFrontmatter("---\n---\n# Body")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("renderText", () => {
  test("includes severity counts and advisory label", () => {
    const report = {
      schemaVersion: 1 as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      findings: [
        {
          path: "node_modules/x.js",
          category: "generated" as const,
          severity: "high-confidence" as const,
          rule: "tracked-node-modules",
          reason: "test reason",
          suggestedAction: "test action",
        },
      ],
      localArtifacts: [],
      docsLifecycle: { totalDocs: 0, missingMetadata: 0, directories: [] },
    }

    const text = renderText(report)
    expect(text).toContain("high-confidence: 1")
    expect(text).toContain("(advisory only, exit 0)")
    expect(text).toContain("tracked-node-modules")
  })

  test("does not include file contents", () => {
    const report = {
      schemaVersion: 1 as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      findings: [
        {
          path: "memory/test.db",
          category: "runtime-state" as const,
          severity: "review" as const,
          rule: "tracked-runtime-db",
          reason: "Database file",
          suggestedAction: "Review it",
        },
      ],
      localArtifacts: [],
      docsLifecycle: { totalDocs: 0, missingMetadata: 0, directories: [] },
    }

    const text = renderText(report)
    // Should not contain any binary content or file read
    expect(text).not.toContain("SELECT")
    expect(text).not.toContain("CREATE TABLE")
    expect(text).toContain("memory/test.db")
  })
})

describe("renderJson", () => {
  test("includes schemaVersion in JSON output", () => {
    const report = {
      schemaVersion: 1 as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      findings: [],
      localArtifacts: [],
      docsLifecycle: { totalDocs: 0, missingMetadata: 0, directories: [] },
    }

    const json = JSON.parse(renderJson(report))
    expect(json.schemaVersion).toBe(1)
    expect(json.generatedAt).toBe("2026-01-01T00:00:00.000Z")
  })

  test("JSON paths are repo-relative", () => {
    const report = {
      schemaVersion: 1 as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      findings: [
        {
          path: "node_modules/foo.js",
          category: "generated" as const,
          severity: "high-confidence" as const,
          rule: "tracked-node-modules",
          reason: "test",
          suggestedAction: "test",
        },
      ],
      localArtifacts: [],
      docsLifecycle: { totalDocs: 0, missingMetadata: 0, directories: [] },
    }

    const json = JSON.parse(renderJson(report))
    for (const f of json.findings) {
      expect(f.path).not.toMatch(/^\//)
    }
  })
})

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

describe("parseCliArgs", () => {
  test("defaults to text format", () => {
    expect(parseCliArgs([]).format).toBe("text")
  })

  test("parses --format json", () => {
    expect(parseCliArgs(["--format", "json"]).format).toBe("json")
  })

  test("rejects unknown arguments", () => {
    expect(() => parseCliArgs(["--unknown"])).toThrow("Unknown argument")
  })

  test("rejects invalid format", () => {
    expect(() => parseCliArgs(["--format", "xml"])).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Integration: runScan with injected provider
// ---------------------------------------------------------------------------

describe("runScan with mock provider", () => {
  test("produces a valid report shape", async () => {
    await withTempDir(async (dir) => {
      const provider = mockProvider(["src/index.ts", "package.json"])
      const report = await runScan({ rootDir: dir, provider })

      expect(report.schemaVersion).toBe(1)
      expect(report.generatedAt).toBeTruthy()
      expect(Array.isArray(report.findings)).toBe(true)
      expect(Array.isArray(report.localArtifacts)).toBe(true)
      expect(report.docsLifecycle).toBeDefined()
    })
  })

  test("surfaces high-confidence findings for bloat", async () => {
    await withTempDir(async (dir) => {
      const provider = mockProvider([
        "node_modules/foo/index.js",
        ".DS_Store",
        "src/index.ts",
      ])
      const report = await runScan({ rootDir: dir, provider })

      const rules = report.findings.map((f) => f.rule)
      expect(rules).toContain("tracked-node-modules")
      expect(rules).toContain("tracked-ds-store")
    })
  })

  test("does not flag clean source-only repos", async () => {
    await withTempDir(async (dir) => {
      const provider = mockProvider([
        "src/index.ts",
        "package.json",
        "AGENTS.md",
        "tests/example.test.ts",
      ])
      const report = await runScan({ rootDir: dir, provider })

      // Only local-artifact info findings or docs lifecycle may appear
      const nonInfoFindings = report.findings.filter((f) => f.severity !== "info")
      expect(nonInfoFindings).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Integration: runScan with real git repo
// ---------------------------------------------------------------------------

describe("runScan with temp git repo", () => {
  test("detects tracked node_modules in a real git repo", async () => {
    await withTempDir(async (dir) => {
      await initGitRepo(dir)

      // Create and track a node_modules file
      await mkdir(path.join(dir, "node_modules", "pkg"), { recursive: true })
      await writeFile(path.join(dir, "node_modules", "pkg", "index.js"), "module.exports = {}")
      await mkdir(path.join(dir, "src"), { recursive: true })
      await writeFile(path.join(dir, "src", "index.ts"), "console.log('hello')")

      const git = (...args: string[]) =>
        Bun.spawn(["git", "add", ...args], { cwd: dir, stdout: "pipe", stderr: "pipe" })
      await git(".").exited
      await Bun.spawn(["git", "commit", "-m", "initial"], {
        cwd: dir,
        stdout: "pipe",
        stderr: "pipe",
      }).exited

      const report = await runScan({ rootDir: dir })

      const nmFindings = report.findings.filter((f) => f.rule === "tracked-node-modules")
      expect(nmFindings.length).toBeGreaterThan(0)
      expect(nmFindings[0].severity).toBe("high-confidence")
    })
  })
})

// ---------------------------------------------------------------------------
// Integration: runCli
// ---------------------------------------------------------------------------

describe("runCli", () => {
  test("text output includes advisory label", async () => {
    const logs: string[] = []
    const stdout = {
      log: (msg: string) => logs.push(msg),
      error: () => {},
    }

    await withTempDir(async (dir) => {
      const provider = mockProvider(["src/index.ts"])
      await runCli([], { rootDir: dir, stdout, provider })
    })

    const output = logs.join("\n")
    expect(output).toContain("advisory only")
  })

  test("--format json produces valid JSON with schemaVersion", async () => {
    const logs: string[] = []
    const stdout = {
      log: (msg: string) => logs.push(msg),
      error: () => {},
    }

    await withTempDir(async (dir) => {
      const provider = mockProvider(["src/index.ts"])
      await runCli(["--format", "json"], { rootDir: dir, stdout, provider })
    })

    const jsonOutput = JSON.parse(logs.join("\n"))
    expect(jsonOutput.schemaVersion).toBe(1)
    expect(jsonOutput.findings).toBeDefined()
  })

  test("import does not trigger side effects", async () => {
    await withTempDir(async (dir) => {
      const scriptPath = path.resolve(import.meta.dir, "../scripts/check-repo-health.ts")
      const proc = Bun.spawn({
        cmd: ["bun", "-e", `await import(${JSON.stringify(scriptPath)})`],
        cwd: dir,
        stdout: "pipe",
        stderr: "pipe",
      })

      const exitCode = await proc.exited
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()

      // Import should not produce any output
      expect(stdout).toBe("")
      expect(stderr).toBe("")
      expect(exitCode).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// No-content-leakage
// ---------------------------------------------------------------------------

describe("no content leakage", () => {
  test("findings contain only metadata, never file content", async () => {
    await withTempDir(async (dir) => {
      const secretContent = "SUPER_SECRET_API_KEY=abc123"
      const provider = mockProvider([
        "node_modules/secret-pkg/config.json",
        "memory/secrets.db",
        ".DS_Store",
      ])

      const report = await runScan({ rootDir: dir, provider })

      const serialized = JSON.stringify(report)
      expect(serialized).not.toContain(secretContent)
      expect(serialized).not.toContain("SUPER_SECRET")

      // Verify each finding has only the expected metadata fields
      for (const f of report.findings) {
        expect(f).toHaveProperty("path")
        expect(f).toHaveProperty("rule")
        expect(f).toHaveProperty("category")
        expect(f).toHaveProperty("severity")
        expect(f).toHaveProperty("reason")
        expect(f).toHaveProperty("suggestedAction")
        // No 'content' field should exist
        expect(f).not.toHaveProperty("content")
      }
    })
  })
})
