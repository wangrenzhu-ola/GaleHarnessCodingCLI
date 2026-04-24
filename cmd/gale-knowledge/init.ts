/**
 * gale-knowledge init 子命令
 *
 * 幂等初始化全局知识仓库：
 * - 检查 .git/ 是否存在
 * - 不存在时创建目录、git init、.gitignore、初始 commit
 * - 已存在时跳过，输出提示
 */

import { defineCommand } from "citty"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GITIGNORE_CONTENT = `*.db
*.db-shm
*.db-wal
vector_store/
vector_store.db
bm25_index.db
entity_index.db
session_transcript_index.db
vector-index/
.last-rebuild-commit
_lifecycle/events.jsonl
.cache/
cache/
tmp/
temp/
`

// ---------------------------------------------------------------------------
// Init logic
// ---------------------------------------------------------------------------

/**
 * 执行知识仓库初始化
 * @param home - 知识仓库根目录路径
 * @returns true 表示新建，false 表示已存在跳过
 */
export function initKnowledgeRepo(home: string): boolean {
  const gitDir = join(home, ".git")

  if (existsSync(gitDir)) {
    ensureGitignoreRules(home)
    return false
  }

  // 创建目录（递归）
  mkdirSync(home, { recursive: true })

  // git init
  const spawnOpts = { cwd: home, stdio: ["ignore", "ignore", "pipe"] as ["ignore", "ignore", "pipe"], timeout: 15000 }

  const initResult = spawnSync("git", ["init"], spawnOpts)
  if (initResult.status !== 0) {
    const stderr = initResult.stderr ? initResult.stderr.toString().trim() : "unknown error"
    throw new Error(`git init failed: ${stderr}`)
  }

  // 写入 .gitignore
  ensureGitignoreRules(home)

  // 配置本地 git 用户身份（CI 环境可能无全局配置）
  const emailResult = spawnSync("git", ["config", "user.email", "gale-knowledge@local"], { cwd: home, stdio: ["ignore", "ignore", "pipe"], timeout: 15000 })
  if (emailResult.status !== 0) throw new Error("git config user.email failed")

  const nameResult = spawnSync("git", ["config", "user.name", "Gale Knowledge"], { cwd: home, stdio: ["ignore", "ignore", "pipe"], timeout: 15000 })
  if (nameResult.status !== 0) throw new Error("git config user.name failed")

  // 创建初始 commit
  const addResult = spawnSync("git", ["add", "-A"], spawnOpts)
  if (addResult.status !== 0) {
    const stderr = addResult.stderr ? addResult.stderr.toString().trim() : "unknown error"
    throw new Error(`git add failed: ${stderr}`)
  }

  const commitResult = spawnSync("git", ["commit", "-m", "chore: init knowledge repo", "--allow-empty"], spawnOpts)
  if (commitResult.status !== 0) {
    const stderr = commitResult.stderr ? commitResult.stderr.toString().trim() : "unknown error"
    throw new Error(`git commit failed: ${stderr}`)
  }

  return true
}

export function ensureGitignoreRules(home: string): void {
  const gitignore = join(home, ".gitignore")
  const existing = existsSync(gitignore) ? readFileSync(gitignore, "utf8") : ""
  const lines = new Set(existing.split(/\r?\n/).filter(Boolean))
  for (const line of GITIGNORE_CONTENT.split(/\r?\n/).filter(Boolean)) {
    lines.add(line)
  }
  writeFileSync(gitignore, Array.from(lines).join("\n") + "\n", "utf8")
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize the global knowledge repository",
  },
  run: async () => {
    try {
      const home = resolveKnowledgeHome()
      const created = initKnowledgeRepo(home)

      if (created) {
        process.stdout.write(`Initialized knowledge repo at ${home}\n`)
      } else {
        process.stdout.write(`Knowledge repo already exists at ${home}\n`)
      }
    } catch (err) {
      process.stderr.write(
        "[gale-knowledge] init failed: " +
        (err instanceof Error ? err.message : String(err)) +
        "\n",
      )
      process.exit(1)
    }
  },
})

export default initCommand
