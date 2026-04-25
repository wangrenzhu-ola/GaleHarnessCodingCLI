#!/usr/bin/env bun
/**
 * Repo Health Advisory Checker
 *
 * Read-only scanner that surfaces tracked-file bloat, runtime state candidates,
 * local ignored-artifact footprint, and docs lifecycle metadata gaps.
 *
 * Findings are metadata-only: repo-relative path, rule, category, severity,
 * reason, suggestedAction — no file contents, env values, or secrets.
 *
 * Run: bun run scripts/check-repo-health.ts
 *      bun run scripts/check-repo-health.ts --format json
 */

import { lstat, readdir, readFile } from "fs/promises"
import path from "path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = "high-confidence" | "review" | "info"

export type Category =
  | "source"
  | "generated"
  | "runtime-state"
  | "durable-knowledge"
  | "workflow-draft"
  | "local-scratch"
  | "vendor"

export interface RepoHealthFinding {
  path: string
  category: Category
  severity: Severity
  rule: string
  reason: string
  suggestedAction: string
  size?: number
  count?: number
  capped?: boolean
}

export interface LocalArtifactSummary {
  path: string
  exists: boolean
  approximateBytes?: number
  fileCount?: number
  capped?: boolean
}

export interface DocsLifecycleSummary {
  totalDocs: number
  missingMetadata: number
  directories: string[]
}

export interface RepoHealthReport {
  schemaVersion: 1
  generatedAt: string
  findings: RepoHealthFinding[]
  localArtifacts: LocalArtifactSummary[]
  docsLifecycle: DocsLifecycleSummary
}

// ---------------------------------------------------------------------------
// Tracked-file provider interface (for testing seams)
// ---------------------------------------------------------------------------

export interface TrackedFileProvider {
  getTrackedFiles(rootDir: string): Promise<string[]>
  getFileSize(rootDir: string, relPath: string): Promise<number>
}

const gitTrackedFileProvider: TrackedFileProvider = {
  async getTrackedFiles(rootDir: string): Promise<string[]> {
    const proc = Bun.spawn(["git", "ls-files", "-z"], {
      cwd: rootDir,
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    await proc.exited
    if (!stdout) return []
    return stdout
      .split("\0")
      .filter((f) => f.length > 0)
      .map((f) => f.replace(/\\/g, "/"))
  },
  async getFileSize(rootDir: string, relPath: string): Promise<number> {
    try {
      const stat = await lstat(path.join(rootDir, relPath))
      return stat.size
    } catch {
      return 0
    }
  },
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LARGE_FILE_THRESHOLD = 100 * 1024 // 100 KB

/** Paths that are generated-output zones where large files are suspect. */
const GENERATED_OUTPUT_PATHS = ["docs/async-progress/"]

/** Known local paths to probe for ignored heavy artifacts. */
const LOCAL_HEAVY_PATHS = [
  ".context",
  ".qoder",
  ".worktrees",
  "test-gh-local",
  "vendor/taskboard/node_modules",
  "node_modules",
]

/** Directories containing workflow docs that should have lifecycle metadata. */
const DOCS_LIFECYCLE_DIRS = ["docs/brainstorms", "docs/plans", "docs/ideation"]

/** Required frontmatter fields for lifecycle docs. */
const LIFECYCLE_FIELDS = ["status", "date", "title"]

/** Max files to enumerate in a local heavy-path scan. */
const LOCAL_SCAN_FILE_CAP = 1000

/** Max total bytes to sum in a local heavy-path scan before reporting capped. */
const LOCAL_SCAN_BYTE_CAP = 500 * 1024 * 1024 // 500 MB

/**
 * Path-scoped release archive patterns.
 * Only match archives under known release/build output directories,
 * not arbitrary .tar.gz or .zip files anywhere in the repo.
 */
const RELEASE_ARCHIVE_PATH_PATTERNS: RegExp[] = [
  /^dist\/.*\.(tar\.gz|zip|tgz)$/,
  /^release\/.*\.(tar\.gz|zip|tgz)$/,
  /^build\/.*\.(tar\.gz|zip|tgz)$/,
  /^out\/.*\.(tar\.gz|zip|tgz)$/,
]

/**
 * Allowlisted paths that should never trigger findings.
 * These are known-intentional files that would otherwise match rules.
 */
const ALLOWLIST: Set<string> = new Set([
  // Add known-intentional paths here if needed
])

// ---------------------------------------------------------------------------
// Tracked-file scanners (pure functions)
// ---------------------------------------------------------------------------

export function scanTrackedFiles(trackedFiles: string[]): RepoHealthFinding[] {
  const findings: RepoHealthFinding[] = []

  for (const filePath of trackedFiles) {
    if (ALLOWLIST.has(filePath)) continue

    // tracked node_modules/
    if (/(?:^|\/)?node_modules\//.test(filePath)) {
      findings.push({
        path: filePath,
        category: "generated",
        severity: "high-confidence",
        rule: "tracked-node-modules",
        reason: "node_modules/ should not be tracked; managed by package manager",
        suggestedAction: "Remove from tracking with git rm --cached and add to .gitignore",
      })
      continue
    }

    // tracked .DS_Store
    if (filePath === ".DS_Store" || filePath.endsWith("/.DS_Store")) {
      findings.push({
        path: filePath,
        category: "local-scratch",
        severity: "high-confidence",
        rule: "tracked-ds-store",
        reason: "macOS .DS_Store file should not be tracked",
        suggestedAction: "Remove from tracking with git rm --cached and add to .gitignore",
      })
      continue
    }

    // tracked release archives (path-scoped only)
    if (RELEASE_ARCHIVE_PATH_PATTERNS.some((re) => re.test(filePath))) {
      findings.push({
        path: filePath,
        category: "generated",
        severity: "review",
        rule: "tracked-release-archive",
        reason: "Release archive in a build/release output directory",
        suggestedAction: "Verify this archive is intentional; release outputs are usually not tracked",
      })
      continue
    }

    // tracked memory/_lifecycle/*
    if (filePath.startsWith("memory/_lifecycle/")) {
      findings.push({
        path: filePath,
        category: "runtime-state",
        severity: "review",
        rule: "tracked-lifecycle-state",
        reason: "Lifecycle state file under memory/_lifecycle/ may be runtime-generated",
        suggestedAction: "Review whether this file is durable knowledge or transient runtime state",
      })
      continue
    }

    // tracked memory/*.db
    if (/^memory\/[^/]+\.db$/.test(filePath)) {
      findings.push({
        path: filePath,
        category: "runtime-state",
        severity: "review",
        rule: "tracked-runtime-db",
        reason: "Database file under memory/ may be runtime state",
        suggestedAction: "Review whether this database should be tracked or is runtime-only",
      })
      continue
    }

    // vendor node_modules or build output (tracked)
    if (/^vendor\/.*\/node_modules\//.test(filePath)) {
      findings.push({
        path: filePath,
        category: "vendor",
        severity: "review",
        rule: "vendor-build-output",
        reason: "Vendor dependency node_modules/ tracked in repository",
        suggestedAction: "Review whether vendor node_modules should be tracked or local-only",
      })
      continue
    }
  }

  return findings
}

export async function scanLargeTrackedFiles(
  trackedFiles: string[],
  provider: TrackedFileProvider,
  rootDir: string,
  threshold = LARGE_FILE_THRESHOLD,
): Promise<RepoHealthFinding[]> {
  const findings: RepoHealthFinding[] = []

  for (const filePath of trackedFiles) {
    if (ALLOWLIST.has(filePath)) continue

    const inGeneratedZone = GENERATED_OUTPUT_PATHS.some((zone) => filePath.startsWith(zone))
    if (!inGeneratedZone) continue

    const size = await provider.getFileSize(rootDir, filePath)
    if (size > threshold) {
      findings.push({
        path: filePath,
        category: "generated",
        severity: "review",
        rule: "tracked-large-generated",
        reason: `Generated report is ${formatBytes(size)}, above ${formatBytes(threshold)} advisory threshold`,
        suggestedAction: "Review whether this generated file should remain tracked or be regenerated on demand",
        size,
      })
    }
  }

  return findings
}

// ---------------------------------------------------------------------------
// Local artifact scanner
// ---------------------------------------------------------------------------

export async function scanLocalArtifacts(
  rootDir: string,
  paths = LOCAL_HEAVY_PATHS,
): Promise<LocalArtifactSummary[]> {
  const summaries: LocalArtifactSummary[] = []

  for (const relPath of paths) {
    const absPath = path.join(rootDir, relPath)
    try {
      const stat = await lstat(absPath)
      if (!stat.isDirectory()) {
        summaries.push({
          path: relPath,
          exists: true,
          approximateBytes: stat.size,
          fileCount: 1,
        })
        continue
      }

      let totalBytes = 0
      let fileCount = 0
      let capped = false

      const walkCapped = async (dir: string): Promise<void> => {
        if (capped) return
        let entries: Awaited<ReturnType<typeof readdir>>
        try {
          entries = await readdir(dir, { withFileTypes: true })
        } catch {
          return
        }
        for (const entry of entries) {
          if (capped) return
          const fullPath = path.join(dir, entry.name)
          try {
            const entryStat = await lstat(fullPath)
            if (entryStat.isSymbolicLink()) continue // no symlink traversal
            if (entryStat.isFile()) {
              fileCount++
              totalBytes += entryStat.size
              if (fileCount >= LOCAL_SCAN_FILE_CAP || totalBytes >= LOCAL_SCAN_BYTE_CAP) {
                capped = true
                return
              }
            } else if (entryStat.isDirectory()) {
              await walkCapped(fullPath)
            }
          } catch {
            // permission error or disappeared file; skip
          }
        }
      }

      await walkCapped(absPath)

      summaries.push({
        path: relPath,
        exists: true,
        approximateBytes: totalBytes,
        fileCount,
        capped,
      })
    } catch {
      summaries.push({ path: relPath, exists: false })
    }
  }

  return summaries
}

// ---------------------------------------------------------------------------
// Docs lifecycle scanner
// ---------------------------------------------------------------------------

export async function scanDocsLifecycle(
  rootDir: string,
  dirs = DOCS_LIFECYCLE_DIRS,
  requiredFields = LIFECYCLE_FIELDS,
): Promise<DocsLifecycleSummary> {
  let totalDocs = 0
  let missingMetadata = 0
  const scannedDirs: string[] = []

  for (const relDir of dirs) {
    const absDir = path.join(rootDir, relDir)
    let entries: Awaited<ReturnType<typeof readdir>>
    try {
      entries = await readdir(absDir, { withFileTypes: true })
    } catch {
      continue
    }
    scannedDirs.push(relDir)

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue
      totalDocs++

      const filePath = path.join(absDir, entry.name)
      try {
        const content = await readFile(filePath, "utf8")
        const frontmatter = parseFrontmatter(content)
        if (!frontmatter || requiredFields.some((field) => !frontmatter[field])) {
          missingMetadata++
        }
      } catch {
        missingMetadata++
      }
    }
  }

  return { totalDocs, missingMetadata, directories: scannedDirs }
}

export function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  const block = match[1]
  const result: Record<string, unknown> = {}

  for (const line of block.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key && value) {
      // Strip surrounding quotes if present
      result[key] = value.replace(/^["']|["']$/g, "")
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

export async function runScan(options: {
  rootDir?: string
  provider?: TrackedFileProvider
} = {}): Promise<RepoHealthReport> {
  const rootDir = options.rootDir ?? process.cwd()
  const provider = options.provider ?? gitTrackedFileProvider

  const trackedFiles = await provider.getTrackedFiles(rootDir)

  const [trackedFindings, largeFindings, localArtifacts, docsLifecycle] = await Promise.all([
    Promise.resolve(scanTrackedFiles(trackedFiles)),
    scanLargeTrackedFiles(trackedFiles, provider, rootDir),
    scanLocalArtifacts(rootDir),
    scanDocsLifecycle(rootDir),
  ])

  const findings = [...trackedFindings, ...largeFindings]

  // Add aggregate docs lifecycle finding if there are missing metadata
  if (docsLifecycle.missingMetadata > 0) {
    findings.push({
      path: docsLifecycle.directories.join(", "),
      category: "workflow-draft",
      severity: "info",
      rule: "docs-lifecycle-aggregate",
      reason: `${docsLifecycle.missingMetadata} of ${docsLifecycle.totalDocs} workflow docs missing lifecycle metadata (status, date, title)`,
      suggestedAction: "Add frontmatter with status, date, and title fields to workflow documents",
      count: docsLifecycle.missingMetadata,
    })
  }

  // Add local heavy-path info findings
  for (const artifact of localArtifacts) {
    if (artifact.exists && artifact.approximateBytes && artifact.approximateBytes > 0) {
      findings.push({
        path: artifact.path,
        category: "local-scratch",
        severity: "info",
        rule: "local-heavy-path",
        reason: `Local ignored path contains ~${formatBytes(artifact.approximateBytes)} in ~${artifact.fileCount} files${artifact.capped ? " (scan capped)" : ""}`,
        suggestedAction: "No action needed; local footprint reported for awareness",
        size: artifact.approximateBytes,
        count: artifact.fileCount,
        capped: artifact.capped,
      })
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    findings,
    localArtifacts,
    docsLifecycle,
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderText(report: RepoHealthReport): string {
  const lines: string[] = []
  lines.push("Repo Health Advisory Report")
  lines.push("==========================")
  lines.push("")

  const highConf = report.findings.filter((f) => f.severity === "high-confidence")
  const review = report.findings.filter((f) => f.severity === "review")
  const info = report.findings.filter((f) => f.severity === "info")

  lines.push(`  high-confidence: ${highConf.length}`)
  lines.push(`  review:          ${review.length}`)
  lines.push(`  info:            ${info.length}`)
  lines.push("")

  if (highConf.length > 0) {
    lines.push("HIGH-CONFIDENCE")
    lines.push("---------------")
    for (const f of highConf) {
      lines.push(`  [${f.rule}] ${f.path}`)
      lines.push(`    ${f.reason}`)
      lines.push(`    -> ${f.suggestedAction}`)
    }
    lines.push("")
  }

  if (review.length > 0) {
    lines.push("REVIEW")
    lines.push("------")
    for (const f of review) {
      lines.push(`  [${f.rule}] ${f.path}`)
      lines.push(`    ${f.reason}`)
      lines.push(`    -> ${f.suggestedAction}`)
    }
    lines.push("")
  }

  if (info.length > 0) {
    lines.push("INFO")
    lines.push("----")
    for (const f of info) {
      lines.push(`  [${f.rule}] ${f.path}`)
      lines.push(`    ${f.reason}`)
      lines.push(`    -> ${f.suggestedAction}`)
    }
    lines.push("")
  }

  // Docs lifecycle summary
  const dl = report.docsLifecycle
  if (dl.totalDocs > 0) {
    lines.push("DOCS LIFECYCLE")
    lines.push("--------------")
    lines.push(`  Scanned: ${dl.directories.join(", ")}`)
    lines.push(`  Total docs: ${dl.totalDocs}, missing metadata: ${dl.missingMetadata}`)
    lines.push("")
  }

  lines.push("(advisory only, exit 0)")
  return lines.join("\n")
}

export function renderJson(report: RepoHealthReport): string {
  return JSON.stringify(report, null, 2)
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export interface CliOptions {
  format: "text" | "json"
}

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = { format: "text" }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--format") {
      const value = args[++i]
      if (value !== "text" && value !== "json") {
        throw new Error(`--format must be "text" or "json", got: ${value}`)
      }
      options.format = value
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

export interface RunCliOptions {
  rootDir?: string
  stdout?: Pick<typeof console, "log" | "error">
  provider?: TrackedFileProvider
}

export async function runCli(
  args = process.argv.slice(2),
  options: RunCliOptions = {},
): Promise<RepoHealthReport> {
  const rootDir = options.rootDir ?? process.cwd()
  const output = options.stdout ?? console
  const cliOptions = parseCliArgs(args)

  const report = await runScan({
    rootDir,
    provider: options.provider,
  })

  if (cliOptions.format === "json") {
    output.log(renderJson(report))
  } else {
    output.log(renderText(report))
  }

  return report
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

if (import.meta.main) {
  runCli().catch((err) => {
    console.error("Repo health check failed:", err)
    process.exit(1)
  })
}
