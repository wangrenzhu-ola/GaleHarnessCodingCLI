import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { ensurePublicMemoryRoot } from "./public-root.js"

export type MigrationStatus = "none" | "completed" | "migration-conflict" | "failed"

export interface MemoryMigrationResult {
  status: MigrationStatus
  sourceDir: string
  targetDir: string
  copied: number
  skipped: number
  conflicted: number
  conflicts: string[]
  manifestPath: string
  conflictReportPath?: string
  reason?: string
}

const MANIFEST = ".gale-migration-manifest.json"
const CONFLICTS = "MIGRATION_CONFLICTS.md"
const RULE_VERSION = 1

const HKT_DIR_HINTS = ["L0-Abstract", "L1-Overview", "L2-Full"]
const ALLOWED_EXTENSIONS = new Set([".md"])
const ALLOWED_BASENAMES = new Set([MANIFEST])
const SKIPPED_PARTS = new Set([
  ".git",
  ".cache",
  "cache",
  "tmp",
  "temp",
  "vector_store",
  "vector-index",
  "__pycache__",
])
const SKIPPED_BASENAMES = new Set([
  "vector_store.db",
  "bm25_index.db",
  "entity_index.db",
  "session_transcript_index.db",
  "events.jsonl",
])

export function localMemoryDir(cwd: string): string {
  return path.join(cwd, "memory")
}

export function isLegacyHktMemoryDir(memoryDir: string): boolean {
  return existsSync(memoryDir) && HKT_DIR_HINTS.some((dir) => existsSync(path.join(memoryDir, dir)))
}

export function migrateLegacyMemory(options: { cwd: string; targetDir: string }): MemoryMigrationResult {
  const sourceDir = localMemoryDir(options.cwd)
  const targetDir = options.targetDir
  const manifestPath = path.join(targetDir, MANIFEST)

  if (!isLegacyHktMemoryDir(sourceDir)) {
    ensurePublicMemoryRoot(targetDir)
    return {
      status: "none",
      sourceDir,
      targetDir,
      copied: 0,
      skipped: 0,
      conflicted: 0,
      conflicts: [],
      manifestPath,
    }
  }

  try {
    ensurePublicMemoryRoot(targetDir)
    const files = collectMigratableFiles(sourceDir)
    let copied = 0
    let skipped = 0
    const conflicts: string[] = []

    for (const rel of files) {
      const source = path.join(sourceDir, rel)
      const target = path.join(targetDir, rel)
      if (!existsSync(target)) {
        mkdirSync(path.dirname(target), { recursive: true })
        copyFileSync(source, target)
        copied++
        continue
      }
      const sourceContent = readFileSync(source, "utf8")
      const targetContent = readFileSync(target, "utf8")
      if (sourceContent === targetContent) {
        skipped++
      } else if (targetContent === "" && isScaffoldFile(rel)) {
        copyFileSync(source, target)
        copied++
      } else {
        conflicts.push(rel)
      }
    }

    const status: MigrationStatus = conflicts.length > 0 ? "migration-conflict" : "completed"
    const result: MemoryMigrationResult = {
      status,
      sourceDir,
      targetDir,
      copied,
      skipped,
      conflicted: conflicts.length,
      conflicts,
      manifestPath,
      conflictReportPath: conflicts.length > 0 ? path.join(targetDir, CONFLICTS) : undefined,
    }
    writeManifest(result)
    if (conflicts.length > 0) writeConflictReport(result)
    return result
  } catch (err) {
    return {
      status: "failed",
      sourceDir,
      targetDir,
      copied: 0,
      skipped: 0,
      conflicted: 0,
      conflicts: [],
      manifestPath,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

function isScaffoldFile(rel: string): boolean {
  return rel === path.join("L0-Abstract", "index.md") ||
    rel === path.join("L1-Overview", "index.md") ||
    rel === path.join("L2-Full", "evergreen", "MEMORY.md")
}

export function readMigrationManifest(targetDir: string): Record<string, unknown> | null {
  try {
    const manifestPath = path.join(targetDir, MANIFEST)
    if (!existsSync(manifestPath)) return null
    return JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>
  } catch {
    return null
  }
}

export function migrationStatus(cwd: string, targetDir: string): "global" | "legacy-local" | "migration-needed" | "migrated" | "migration-conflict" {
  const manifest = readMigrationManifest(targetDir)
  if (manifest?.status === "migration-conflict") return "migration-conflict"
  if (manifest?.status === "completed") return "migrated"
  if (isLegacyHktMemoryDir(localMemoryDir(cwd))) {
    return existsSync(targetDir) ? "migration-needed" : "legacy-local"
  }
  return "global"
}

function collectMigratableFiles(root: string, dir = root): string[] {
  const files: string[] = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(root, full)
    const parts = rel.split(path.sep)
    if (parts.some((part) => SKIPPED_PARTS.has(part))) continue
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      files.push(...collectMigratableFiles(root, full))
      continue
    }
    if (!entry.isFile() || shouldSkipFile(full, entry.name)) continue
    if (statSync(full).size > 5 * 1024 * 1024) continue
    files.push(rel)
  }
  return files.sort()
}

function shouldSkipFile(filePath: string, basename: string): boolean {
  if (SKIPPED_BASENAMES.has(basename)) return true
  if (basename.endsWith(".db") || basename.endsWith(".db-shm") || basename.endsWith(".db-wal")) return true
  if (basename.endsWith(".jsonl")) return true
  const ext = path.extname(filePath)
  return !ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_BASENAMES.has(basename)
}

function writeManifest(result: MemoryMigrationResult): void {
  writeFileSync(
    result.manifestPath,
    JSON.stringify(
      {
        rule_version: RULE_VERSION,
        status: result.status,
        source_path: result.sourceDir,
        target_path: result.targetDir,
        migrated_at: new Date().toISOString(),
        copied: result.copied,
        skipped: result.skipped,
        conflicted: result.conflicted,
        conflicts: result.conflicts,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  )
}

function writeConflictReport(result: MemoryMigrationResult): void {
  if (!result.conflictReportPath) return
  const lines = [
    "# HKTMemory Migration Conflicts",
    "",
    "The copy-first migration did not overwrite these target files because their contents differ.",
    "",
    `Source: ${result.sourceDir}`,
    `Target: ${result.targetDir}`,
    "",
    ...result.conflicts.map((file) => `- ${file}`),
    "",
  ]
  writeFileSync(result.conflictReportPath, lines.join("\n"), "utf8")
}
