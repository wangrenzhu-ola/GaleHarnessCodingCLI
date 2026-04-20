/**
 * 知识文档写入器
 *
 * 将 Markdown 文档写入全局知识仓库，写入失败时自动降级到项目本地 docs/ 目录。
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { parseFrontmatter, formatFrontmatter } from "../utils/frontmatter.js"

import { extractProjectName, resolveKnowledgePath } from "./home.js"
import type { KnowledgeDocType } from "./types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WriteKnowledgeDocumentOptions {
  /** 文档类型 */
  type: KnowledgeDocType
  /** 文档文件名（含 .md 扩展名） */
  filename: string
  /** 文档内容（Markdown） */
  content: string
  /** 项目名（可选，默认从 git remote 提取） */
  projectName?: string
  /** 当前工作目录（用于 fallback 路径和项目名提取） */
  cwd?: string
}

export interface WriteResult {
  /** 最终写入的文件绝对路径 */
  path: string
  /** 是否使用了 fallback（写入项目本地 docs/） */
  usedFallback: boolean
  /** 如果 fallback，警告信息 */
  warning?: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 将知识文档写入全局知识仓库，失败时降级到项目本地 docs/ 目录
 */
export function writeKnowledgeDocument(options: WriteKnowledgeDocumentOptions): WriteResult {
  const { type, filename, content, cwd } = options
  const workDir = cwd ?? process.cwd()
  const projectName = options.projectName ?? extractProjectName(workDir)

  // 注入 project frontmatter
  const finalContent = injectProjectFrontmatter(content, projectName)

  // 尝试写入知识仓库
  const resolved = resolveKnowledgePath({ type, projectName })
  const primaryPath = join(resolved.docDir, filename)

  try {
    mkdirSync(dirname(primaryPath), { recursive: true })
    writeFileSync(primaryPath, finalContent, "utf8")
    return { path: primaryPath, usedFallback: false }
  } catch {
    // 写入失败，降级到项目本地 docs/
  }

  // Fallback: <cwd>/docs/<type>/
  const fallbackDir = join(workDir, "docs", type)
  const fallbackPath = join(fallbackDir, filename)
  const warning = `Knowledge repo write failed, falling back to ${fallbackPath}`

  try {
    mkdirSync(fallbackDir, { recursive: true })
    writeFileSync(fallbackPath, finalContent, "utf8")
    console.warn(warning)
    return { path: fallbackPath, usedFallback: true, warning }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to write knowledge document to both primary and fallback paths: ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 注入或更新 frontmatter 中的 project 字段
 *
 * - 如果内容已有 YAML frontmatter，解析并确保 project 字段存在
 * - 如果没有 frontmatter，注入包含 project 字段的 frontmatter
 * - 保留已有 frontmatter 中的其他字段不变
 */
export function injectProjectFrontmatter(content: string, projectName: string): string {
  if (!content) {
    return formatFrontmatter({ project: projectName }, "")
  }

  const { data, body } = parseFrontmatter(content)

  // 设置 project（不覆盖已有值——但 spec 要求"确保 project 字段存在"）
  if (!data.project) {
    data.project = projectName
  }

  return formatFrontmatter(data, body)
}
