/**
 * gale-knowledge rebuild-index 子命令
 *
 * 重建本地向量索引，支持增量和全量两种模式。
 * - 增量模式（默认）：仅处理自上次重建后变更的 .md 文件
 * - 全量模式（--full）：处理所有 .md 文件
 */

import { defineCommand } from "citty"
import { execSync, spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { join, relative } from "node:path"
import { homedir, tmpdir } from "node:os"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RebuildIndexOptions {
  /** 是否全量重建（默认 false = 增量） */
  full?: boolean
  /** 知识仓库路径 */
  knowledgeHome?: string
  /** 向量索引存储路径（默认 ~/.galeharness/vector-index/） */
  indexPath?: string
}

export interface RebuildIndexResult {
  /** 处理的文档数 */
  processed: number
  /** 跳过的文档数（增量模式下未变更的） */
  skipped: number
  /** 错误数 */
  errors: number
  /** 模式 */
  mode: "full" | "incremental"
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAST_REBUILD_COMMIT_FILE = ".last-rebuild-commit"
const DEFAULT_INDEX_DIR = join(homedir(), ".galeharness", "vector-index")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 检查 uv 命令是否可用
 */
export function isUvAvailable(): boolean {
  try {
    execSync("uv --version", { stdio: ["ignore", "ignore", "ignore"] })
    return true
  } catch {
    return false
  }
}

/**
 * 获取 vendor/hkt-memory 脚本路径（相对于项目根目录）
 */
export function getHktMemoryScriptPath(): string | null {
  // 从当前文件位置向上查找 vendor/hkt-memory
  const candidates = [
    join(__dirname, "..", "..", "vendor", "hkt-memory", "scripts", "hkt_memory_v5.py"),
    join(process.cwd(), "vendor", "hkt-memory", "scripts", "hkt_memory_v5.py"),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * 递归收集目录中所有 .md 文件（排除 .git/）
 */
export function collectMarkdownFiles(dir: string, baseDir?: string): string[] {
  const base = baseDir ?? dir
  const results: string[] = []

  let entries: ReturnType<typeof readdirSync>
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath, base))
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(relative(base, fullPath))
    }
  }

  return results
}

/**
 * 获取上次重建的 commit hash
 */
export function getLastRebuildCommit(knowledgeHome: string): string | null {
  const filePath = join(knowledgeHome, LAST_REBUILD_COMMIT_FILE)
  if (!existsSync(filePath)) {
    return null
  }
  try {
    return readFileSync(filePath, "utf8").trim()
  } catch {
    return null
  }
}

/**
 * 获取两个 commit 之间变更的 .md 文件列表
 */
export function getChangedFiles(
  knowledgeHome: string,
  lastCommit: string,
): string[] {
  try {
    const output = execSync(
      `git diff --name-only ${lastCommit} HEAD -- '*.md'`,
      { cwd: knowledgeHome, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim()
    if (!output) return []
    return output.split("\n").filter((f) => f.length > 0)
  } catch {
    // If git diff fails (e.g., invalid commit), return empty
    return []
  }
}

/**
 * 获取当前 HEAD commit hash
 */
export function getCurrentHead(knowledgeHome: string): string | null {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: knowledgeHome,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

/**
 * 将文件内容存储到 HKTMemory 向量索引
 *
 * 使用临时文件传递内容以避免 shell 转义问题
 */
export function storeToHktMemory(
  scriptPath: string,
  filePath: string,
  content: string,
  title: string,
): boolean {
  // 将内容写入临时文件
  const tmpFile = join(
    tmpdir(),
    `hkt-store-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`,
  )

  try {
    writeFileSync(tmpFile, content, "utf8")

    const result = spawnSync(
      "uv",
      [
        "run",
        scriptPath,
        "store",
        "--content-file",
        tmpFile,
        "--title",
        title,
        "--topic",
        "knowledge-repo",
        "--layer",
        "all",
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 30000,
        env: { ...process.env },
      },
    )

    if (result.status !== 0) {
      // Try alternative: pass content via stdin
      const result2 = spawnSync(
        "uv",
        [
          "run",
          scriptPath,
          "store",
          "--title",
          title,
          "--topic",
          "knowledge-repo",
          "--layer",
          "all",
        ],
        {
          input: content,
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 30000,
          env: { ...process.env },
        },
      )
      return result2.status === 0
    }

    return true
  } catch {
    return false
  } finally {
    // Clean up temp file
    try {
      const { unlinkSync } = require("node:fs")
      unlinkSync(tmpFile)
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * 保存当前 HEAD 到 .last-rebuild-commit
 */
export function saveLastRebuildCommit(
  knowledgeHome: string,
  commitHash: string,
): void {
  writeFileSync(
    join(knowledgeHome, LAST_REBUILD_COMMIT_FILE),
    commitHash + "\n",
    "utf8",
  )
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * 重建向量索引
 */
export function rebuildIndex(options?: RebuildIndexOptions): RebuildIndexResult {
  const knowledgeHome = options?.knowledgeHome ?? resolveKnowledgeHome()
  const indexPath = options?.indexPath ?? DEFAULT_INDEX_DIR
  const full = options?.full ?? false

  // Ensure index directory exists
  if (!existsSync(indexPath)) {
    mkdirSync(indexPath, { recursive: true })
  }

  // Check if uv is available
  if (!isUvAvailable()) {
    process.stderr.write(
      "[gale-knowledge] Warning: uv is not available in PATH. Skipping vector index rebuild.\n",
    )
    return { processed: 0, skipped: 0, errors: 0, mode: full ? "full" : "incremental" }
  }

  // Check if hkt_memory_v5.py exists
  const scriptPath = getHktMemoryScriptPath()
  if (!scriptPath) {
    process.stderr.write(
      "[gale-knowledge] Warning: vendor/hkt-memory/scripts/hkt_memory_v5.py not found. Skipping vector index rebuild.\n",
    )
    return { processed: 0, skipped: 0, errors: 0, mode: full ? "full" : "incremental" }
  }

  let filesToProcess: string[] = []
  let mode: "full" | "incremental" = full ? "full" : "incremental"

  if (!full) {
    // Incremental mode
    const lastCommit = getLastRebuildCommit(knowledgeHome)
    if (lastCommit) {
      filesToProcess = getChangedFiles(knowledgeHome, lastCommit)
    } else {
      // No last commit file -> fall back to full mode
      mode = "full"
      filesToProcess = collectMarkdownFiles(knowledgeHome)
    }
  } else {
    // Full mode
    filesToProcess = collectMarkdownFiles(knowledgeHome)
  }

  // Process files
  let processed = 0
  let errors = 0
  const totalFiles = filesToProcess.length
  const skipped = mode === "incremental" ? 0 : 0 // In full mode, nothing is skipped

  for (const file of filesToProcess) {
    const fullPath = join(knowledgeHome, file)

    // Skip if file no longer exists (deleted in diff)
    if (!existsSync(fullPath)) {
      continue
    }

    try {
      const content = readFileSync(fullPath, "utf8")
      const title = file // Use relative path as title

      const success = storeToHktMemory(scriptPath, file, content, title)
      if (success) {
        processed++
      } else {
        errors++
        process.stderr.write(
          `[gale-knowledge] Warning: Failed to index ${file}\n`,
        )
      }
    } catch (err) {
      errors++
      process.stderr.write(
        `[gale-knowledge] Warning: Error processing ${file}: ${err instanceof Error ? err.message : String(err)}\n`,
      )
    }
  }

  // Save current HEAD commit hash
  const currentHead = getCurrentHead(knowledgeHome)
  if (currentHead) {
    saveLastRebuildCommit(knowledgeHome, currentHead)
  }

  return {
    processed,
    skipped: totalFiles - processed - errors,
    errors,
    mode,
  }
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

const rebuildIndexCommand = defineCommand({
  meta: {
    name: "rebuild-index",
    description: "Rebuild the local vector index (incremental by default)",
  },
  args: {
    full: {
      type: "boolean",
      description: "Full rebuild (re-index all .md files)",
      default: false,
    },
  },
  run: async ({ args }) => {
    try {
      const result = rebuildIndex({ full: args.full as boolean })

      process.stdout.write(
        `[gale-knowledge] rebuild-index complete (${result.mode} mode)\n` +
        `  Processed: ${result.processed}\n` +
        `  Skipped:   ${result.skipped}\n` +
        `  Errors:    ${result.errors}\n`,
      )

      if (result.errors > 0) {
        process.exitCode = 1
      }
    } catch (err) {
      process.stderr.write(
        "[gale-knowledge] rebuild-index failed: " +
        (err instanceof Error ? err.message : String(err)) +
        "\n",
      )
      process.exit(1)
    }
  },
})

export { rebuildIndexCommand }
export default rebuildIndexCommand
