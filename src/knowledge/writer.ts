/**
 * 知识文档写入器
 *
 * 将 Markdown 文档写入全局知识仓库，写入失败时自动降级到项目本地 docs/ 目录。
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve, sep } from "node:path"

import { parseFrontmatter, formatFrontmatter } from "../utils/frontmatter.js"

import { extractProjectName, resolveKnowledgePath, sanitizePathComponent } from "./home.js"
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

  // Path traversal guard: 检查 filename 的每个路径组件
  const pathComponents = filename.split(/[/\\]/)
  for (const component of pathComponents) {
    if (component) {
      sanitizePathComponent(component)
    }
  }

  // 额外检查：确保最终路径在 safeBase 内
  const finalPath = resolve(primaryPath)
  const safeBase = resolve(resolved.docDir)
  if (!finalPath.startsWith(safeBase + sep) && finalPath !== safeBase) {
    throw new Error(`Invalid filename: path traversal detected`)
  }

  try {
    mkdirSync(dirname(primaryPath), { recursive: true })
    writeFileSync(primaryPath, finalContent, "utf8")
    return { path: primaryPath, usedFallback: false }
  } catch (primaryError) {
    // 写入失败，降级到项目本地 docs/（保留原始错误信息）
    const primaryWarning = primaryError instanceof Error ? primaryError.message : String(primaryError)

    // Fallback: <cwd>/docs/<type>/
    const fallbackDir = join(workDir, "docs", type)
    const fallbackPath = join(fallbackDir, filename)
    const warning = `Knowledge repo write failed (${primaryWarning}), falling back to ${fallbackPath}`

    try {
      mkdirSync(fallbackDir, { recursive: true })
      writeFileSync(fallbackPath, finalContent, "utf8")
      console.warn(warning)
      return { path: fallbackPath, usedFallback: true, warning }
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      // BUG-004: 聚合主路径和 fallback 的错误信息
      throw new Error(
        `Failed to write knowledge document to both primary and fallback paths. ` +
        `Primary error: ${primaryWarning}. Fallback error: ${fallbackMsg}`
      )
    }
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
 * - 不覆盖已有的 project 字段
 */
export function injectProjectFrontmatter(content: string, projectName: string): string {
  if (!content) {
    return formatFrontmatter({ project: projectName }, "")
  }

  const { data, body } = parseFrontmatter(content)

  // 设置 project（不覆盖已有值）
  if (!data.project) {
    data.project = projectName
  }

  return formatFrontmatter(data, body)
}
