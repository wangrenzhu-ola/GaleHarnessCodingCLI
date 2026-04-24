/**
 * gale-knowledge rebuild-index 子命令
 *
 * 重建本地向量索引，支持增量和全量两种模式。
 * - 增量模式（默认）：仅处理自上次重建后变更的 .md 文件
 * - 全量模式（--full）：处理所有 .md 文件
 */

import { defineCommand } from "citty"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { join, relative } from "node:path"
import { tmpdir } from "node:os"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"
import { ensurePublicMemoryRoot, resolveKnowledgeIndexMemoryRoot } from "../../src/memory/public-root.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RebuildIndexOptions {
  /** 是否全量重建（默认 false = 增量） */
  full?: boolean
  /** 知识仓库路径 */
  knowledgeHome?: string
  indexMemoryDir?: string
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
  indexMemoryDir: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAST_REBUILD_COMMIT_FILE = ".last-rebuild-commit"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 检查 uv 命令是否可用
 */
export function isUvAvailable(): boolean {
  try {
    const result = spawnSync("uv", ["--version"], { stdio: ["ignore", "ignore", "ignore"], timeout: 15000 })
    return result.status === 0
  } catch {
    return false
  }
}

/**
 * 获取 vendor/hkt-memory 脚本路径（相对于项目根目录）
 */
function getHktMemoryScriptPath(): string | null {
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
    if (entry.isSymbolicLink()) continue

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
  if (!/^[0-9a-f]{7,40}$/i.test(lastCommit)) return []
  try {
    const result = spawnSync(
      "git",
      ["diff", "--name-only", lastCommit, "HEAD", "--", "*.md"],
      { cwd: knowledgeHome, encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] },
    )
    const output = (result.stdout ?? "").trim()
    if (result.status !== 0 || !output) return []
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
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: knowledgeHome,
      encoding: "utf8",
      timeout: 15000,
      stdio: ["ignore", "pipe", "ignore"],
    })
    if (result.status !== 0) return null
    return (result.stdout ?? "").trim() || null
  } catch {
    return null
  }
}

/**
 * 将文件内容存储到 HKTMemory 向量索引
 *
 * 使用临时文件传递内容以避免 shell 转义问题
 */
function storeToHktMemory(
  scriptPath: string,
  filePath: string,
  content: string,
  title: string,
  indexMemoryDir: string,
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
        env: { ...process.env, HKT_MEMORY_DIR: indexMemoryDir },
      },
    )

    if (result.status !== 0) {
      // Try alternative: pass content via stdin
      process.stderr.write("[gale-knowledge] First store method failed, retrying with stdin...\n")
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
          env: { ...process.env, HKT_MEMORY_DIR: indexMemoryDir },
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
  const indexMemoryDir = options?.indexMemoryDir ?? resolveKnowledgeIndexMemoryRoot()
  ensurePublicMemoryRoot(indexMemoryDir)
  const full = options?.full ?? false

  // Determine mode and files to process first (before checking uv availability)
  let filesToProcess: string[] = []
  let mode: "full" | "incremental" = full ? "full" : "incremental"

  if (!full) {
    // Incremental mode
    const lastCommit = getLastRebuildCommit(knowledgeHome)
    if (lastCommit) {
      filesToProcess = getChangedFiles(knowledgeHome, lastCommit)
      // If no changed files but lastCommit exists, verify hash is still reachable
      if (filesToProcess.length === 0) {
        const verify = spawnSync("git", ["cat-file", "-t", lastCommit], {
          cwd: knowledgeHome, encoding: "utf8", timeout: 15000,
          stdio: ["ignore", "pipe", "pipe"],
        })
        if (verify.status !== 0) {
          // Hash unreachable (e.g. after force push), fall back to full mode
          process.stderr.write("[gale-knowledge] Last rebuild commit unreachable, falling back to full mode.\n")
          mode = "full"
          filesToProcess = collectMarkdownFiles(knowledgeHome)
        }
      }
    } else {
      // No last commit file -> fall back to full mode
      mode = "full"
      filesToProcess = collectMarkdownFiles(knowledgeHome)
    }
  } else {
    // Full mode
    filesToProcess = collectMarkdownFiles(knowledgeHome)
  }

  // Check if uv is available
  const uvAvailable = isUvAvailable()
  if (!uvAvailable) {
    process.stderr.write(
      "[gale-knowledge] Warning: uv is not available in PATH. Skipping vector index rebuild.\n",
    )
  }

  // Check if hkt_memory_v5.py exists
  const scriptPath = uvAvailable ? getHktMemoryScriptPath() : null
  if (uvAvailable && !scriptPath) {
    process.stderr.write(
      "[gale-knowledge] Warning: vendor/hkt-memory/scripts/hkt_memory_v5.py not found. Skipping vector index rebuild.\n",
    )
  }

  const canProcess = uvAvailable && scriptPath != null

  // Process files
  let processed = 0
  let errors = 0
  const totalFiles = filesToProcess.length

  if (canProcess) {
    for (const file of filesToProcess) {
      const fullPath = join(knowledgeHome, file)

      // Skip if file no longer exists (deleted in diff)
      if (!existsSync(fullPath)) {
        continue
      }

      try {
        const content = readFileSync(fullPath, "utf8")
        const title = file // Use relative path as title

        const success = storeToHktMemory(scriptPath!, file, content, title, indexMemoryDir)
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
  }

  // Only save HEAD when all files processed successfully.
  // When errors > 0, we intentionally do NOT advance the pointer so that
  // failed files are retried on the next incremental rebuild.
  if (errors === 0) {
    const currentHead = getCurrentHead(knowledgeHome)
    if (currentHead) {
      saveLastRebuildCommit(knowledgeHome, currentHead)
    }
  }

  return {
    processed,
    skipped: totalFiles - processed - errors,
    errors,
    mode,
    indexMemoryDir,
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
        `  Index root: ${result.indexMemoryDir}\n` +
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
