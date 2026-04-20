/**
 * gale-knowledge init 子命令
 *
 * 幂等初始化全局知识仓库：
 * - 检查 .git/ 是否存在
 * - 不存在时创建目录、git init、.gitignore、初始 commit
 * - 已存在时跳过，输出提示
 */

import { defineCommand } from "citty"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GITIGNORE_CONTENT = `*.db
vector-index/
.last-rebuild-commit
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
    return false
  }

  // 创建目录（递归）
  mkdirSync(home, { recursive: true })

  // git init
  execSync("git init", {
    cwd: home,
    stdio: ["ignore", "ignore", "pipe"],
  })

  // 写入 .gitignore
  writeFileSync(join(home, ".gitignore"), GITIGNORE_CONTENT, "utf8")

  // 创建初始 commit
  execSync("git add -A", {
    cwd: home,
    stdio: ["ignore", "ignore", "pipe"],
  })
  execSync('git commit -m "chore: init knowledge repo" --allow-empty', {
    cwd: home,
    stdio: ["ignore", "ignore", "pipe"],
  })

  return true
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
