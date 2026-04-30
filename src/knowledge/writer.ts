/**
 * 知识文档写入器
 *
 * 将 Markdown 文档同时写入全局知识仓库（主路径）和项目本地 docs/ 目录（次路径）。
 * 主路径写入失败时自动降级到项目本地 docs/ 目录。
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
  /** 最终写入的文件绝对路径（向后兼容） */
  path: string
  /** 主路径（全局知识仓库） */
  primaryPath: string
  /** 次路径（项目 docs/），仅在次路径写入成功时设置 */
  secondaryPath?: string
  /** 是否使用了 fallback（写入项目本地 docs/） */
  usedFallback: boolean
  /** 警告信息 */
  warning?: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 将知识文档写入全局知识仓库和项目本地 docs/ 目录
 *
 * - 主路径：~/.galeharness/knowledge/<project>/<type>/<filename>（必须成功，失败则抛错或降级）
 * - 次路径：<cwd>/docs/<type>/<filename>（尽力而为，失败仅警告）
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

  // 次路径（项目本地 docs/）
  const secondaryDir = join(workDir, "docs", type)
  const secondaryPath = join(secondaryDir, filename)

  let primaryError: Error | null = null
  let secondaryError: Error | null = null

  // Step 1: 主路径写入
  try {
    mkdirSync(dirname(primaryPath), { recursive: true })
    writeFileSync(primaryPath, finalContent, "utf8")
  } catch (err) {
    primaryError = err instanceof Error ? err : new Error(String(err))
  }

  // Step 2: 次路径写入（无论主路径是否成功都尝试）
  try {
    mkdirSync(dirname(secondaryPath), { recursive: true })
    writeFileSync(secondaryPath, finalContent, "utf8")
  } catch (err) {
    secondaryError = err instanceof Error ? err : new Error(String(err))
  }

  // 判断结果
  if (primaryError === null && secondaryError === null) {
    // 双写成功
    return { path: primaryPath, primaryPath, secondaryPath, usedFallback: false }
  }

  if (primaryError === null && secondaryError !== null) {
    // 主成功，次失败 -> 仅警告
    const warning = `Secondary write to docs/ failed: ${secondaryError.message}`
    console.warn(warning)
    return { path: primaryPath, primaryPath, usedFallback: false, warning }
  }

  if (primaryError !== null && secondaryError === null) {
    // 主失败，次成功 -> fallback 模式（保留向后兼容）
    const warning = `Knowledge repo write failed (${primaryError.message}), falling back to ${secondaryPath}`
    console.warn(warning)
    return { path: secondaryPath, primaryPath, secondaryPath, usedFallback: true, warning }
  }

  // 双双失败
  throw new Error(
    `Failed to write knowledge document to both primary and secondary paths. ` +
    `Primary error: ${primaryError.message}. Secondary error: ${secondaryError.message}`
  )
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
