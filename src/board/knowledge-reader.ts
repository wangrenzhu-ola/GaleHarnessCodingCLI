/**
 * 知识文档读取器
 *
 * 扫描全局知识仓库目录，解析文档元数据并返回结构化列表。
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { parseFrontmatter } from "../utils/frontmatter.js"
import { resolveKnowledgeHome } from "../knowledge/home.js"
import type { KnowledgeDocType } from "../knowledge/types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 知识文档 */
export interface KnowledgeDocument {
  /** 文件路径（相对于知识仓库根目录） */
  path: string
  /** 绝对路径 */
  absolutePath: string
  /** 文档标题（从 frontmatter 或文件名提取） */
  title: string
  /** 日期（从文件名或 frontmatter 提取） */
  date?: string
  /** 所属项目 */
  project: string
  /** 文档类型 */
  type: KnowledgeDocType
  /** 主题（从 frontmatter 提取，可选） */
  topic?: string
}

export interface ReadKnowledgeOptions {
  /** 按项目过滤 */
  project?: string
  /** 按文档类型过滤 */
  type?: KnowledgeDocType
  /** 知识仓库路径（可选，默认自动解析） */
  knowledgeHome?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_DOC_TYPES: KnowledgeDocType[] = ["brainstorms", "plans", "solutions"]
const DATE_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})-(.+)$/

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** 读取知识仓库中的所有文档 */
export function readKnowledgeDocuments(options?: ReadKnowledgeOptions): KnowledgeDocument[] {
  const home = options?.knowledgeHome ?? resolveKnowledgeHome()

  if (!existsSync(home)) {
    return []
  }

  const documents: KnowledgeDocument[] = []

  // 扫描项目目录
  const projectDirs = listSubdirectories(home)

  for (const projectDir of projectDirs) {
    const projectName = projectDir
    const projectPath = join(home, projectDir)

    // 按项目过滤
    if (options?.project && projectName !== options.project) {
      continue
    }

    // 扫描文档类型目录
    for (const docType of VALID_DOC_TYPES) {
      // 按类型过滤
      if (options?.type && docType !== options.type) {
        continue
      }

      const typePath = join(projectPath, docType)
      if (!existsSync(typePath)) {
        continue
      }

      // 扫描 .md 文件
      const files = listMarkdownFiles(typePath)

      for (const filename of files) {
        const absolutePath = join(typePath, filename)
        const relativePath = relative(home, absolutePath)
        const doc = parseDocument(absolutePath, relativePath, projectName, docType)
        if (doc) {
          documents.push(doc)
        }
      }
    }
  }

  // 按日期降序排列
  documents.sort((a, b) => {
    const dateA = a.date ?? ""
    const dateB = b.date ?? ""
    return dateB.localeCompare(dateA)
  })

  return documents
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listSubdirectories(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(name => !name.startsWith("."))
      .filter(name => {
        try {
          return statSync(join(dir, name)).isDirectory()
        } catch {
          return false
        }
      })
  } catch {
    return []
  }
}

function listMarkdownFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(name => name.endsWith(".md") && !name.startsWith("."))
      .filter(name => {
        try {
          return statSync(join(dir, name)).isFile()
        } catch {
          return false
        }
      })
  } catch {
    return []
  }
}

function parseDocument(
  absolutePath: string,
  relativePath: string,
  project: string,
  type: KnowledgeDocType,
): KnowledgeDocument | null {
  try {
    const content = readFileSync(absolutePath, "utf8")
    const { data } = parseFrontmatter(content)

    // 文件名（不含扩展名）
    const filename = absolutePath.split("/").pop()!.replace(/\.md$/, "")

    // 从文件名提取日期
    const dateMatch = filename.match(DATE_PREFIX_REGEX)
    const dateFromFilename = dateMatch ? dateMatch[1] : undefined
    const nameWithoutDate = dateMatch ? dateMatch[2] : filename

    // 从 frontmatter 或文件名获取标题
    const title = typeof data.title === "string" && data.title
      ? data.title
      : nameWithoutDate

    // 日期优先取 frontmatter，其次文件名
    // js-yaml parses date values as Date objects
    let fmDate: string | undefined
    if (data.date instanceof Date) {
      fmDate = data.date.toISOString().slice(0, 10)
    } else if (typeof data.date === "string" && data.date) {
      fmDate = data.date
    }
    const date = fmDate ?? dateFromFilename

    // 项目优先取 frontmatter
    const docProject = typeof data.project === "string" && data.project
      ? data.project
      : project

    // 主题
    const topic = typeof data.topic === "string" && data.topic
      ? data.topic
      : undefined

    return {
      path: relativePath,
      absolutePath,
      title,
      date,
      project: docProject,
      type,
      topic,
    }
  } catch {
    return null
  }
}
