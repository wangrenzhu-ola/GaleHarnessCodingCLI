/**
 * gale-knowledge commit 子命令
 *
 * 在知识仓库中自动批量提交变更文件。
 * - git add -A 暂存所有变更
 * - git diff --cached --quiet 检查是否有变更
 * - 生成规范化 commit message 并提交
 */

import { defineCommand } from "citty"
import { execSync } from "node:child_process"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommitOptions {
  /** 项目名 */
  project: string
  /** 文档类型 */
  type: string // 'brainstorm' | 'plan' | 'solution'
  /** 文档标题（用于 commit message） */
  title: string
  /** 知识仓库路径（可选，默认通过 resolveKnowledgeHome 获取） */
  knowledgeHome?: string
}

export interface CommitResult {
  /** 是否创建了 commit */
  committed: boolean
  /** commit hash（如果创建了） */
  hash?: string
  /** 信息 */
  message: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 转义 title 中的特殊字符，防止 shell 注入。
 * 移除或替换可能导致 shell 命令异常的字符。
 */
export function sanitizeTitle(title: string): string {
  // 替换双引号为单引号，移除反引号和美元符号等危险字符
  return title
    .replace(/"/g, "'")
    .replace(/`/g, "'")
    .replace(/\$/g, "")
    .replace(/\\/g, "")
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
    .trim()
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * 在知识仓库中执行 git add -A && git commit
 *
 * @param options - 提交选项
 * @returns 提交结果
 */
export function commitKnowledgeChanges(options: CommitOptions): CommitResult {
  const home = options.knowledgeHome ?? resolveKnowledgeHome()
  const execOpts = { cwd: home, stdio: ["ignore", "pipe", "pipe"] as const }

  try {
    // 1. 暂存所有变更
    execSync("git add -A", execOpts)

    // 2. 检查是否有暂存变更
    try {
      execSync("git diff --cached --quiet", execOpts)
      // exit code 0 -> 无变更
      return { committed: false, message: "No changes to commit" }
    } catch {
      // exit code 1 -> 有变更，继续
    }

    // 3. 生成 commit message
    const safeTitle = sanitizeTitle(options.title)
    const commitMessage = `docs(${options.project}/${options.type}): ${safeTitle}`

    // 4. 执行 commit
    execSync(`git commit -m "${commitMessage}"`, execOpts)

    // 5. 获取 commit hash
    const hash = execSync("git rev-parse --short HEAD", {
      cwd: home,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    return {
      committed: true,
      hash,
      message: commitMessage,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return {
      committed: false,
      message: `Commit failed: ${errMsg}`,
    }
  }
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

const commitCommand = defineCommand({
  meta: {
    name: "commit",
    description: "Commit knowledge changes to the repository",
  },
  args: {
    project: {
      type: "string",
      description: "Project name",
      required: true,
    },
    type: {
      type: "string",
      description: "Document type (brainstorm | plan | solution)",
      required: true,
    },
    title: {
      type: "string",
      description: "Document title for commit message",
      required: true,
    },
  },
  run: async ({ args }) => {
    try {
      const result = commitKnowledgeChanges({
        project: args.project as string,
        type: args.type as string,
        title: args.title as string,
      })

      if (result.committed) {
        process.stdout.write(
          `Committed: ${result.hash} ${result.message}\n`,
        )
      } else {
        process.stdout.write(`${result.message}\n`)
      }
    } catch (err) {
      process.stderr.write(
        "[gale-knowledge] commit failed: " +
        (err instanceof Error ? err.message : String(err)) +
        "\n",
      )
      process.exit(1)
    }
  },
})

export default commitCommand
