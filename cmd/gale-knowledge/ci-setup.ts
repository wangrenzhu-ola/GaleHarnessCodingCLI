/**
 * gale-knowledge setup-ci 子命令
 *
 * 在知识仓库中生成 GitHub Actions workflow 文件，
 * 用于在 push 到 main 分支时自动更新向量索引。
 */

import { defineCommand } from "citty"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { resolveKnowledgeHome } from "../../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// Workflow template
// ---------------------------------------------------------------------------

const WORKFLOW_TEMPLATE = `name: Knowledge Index Update
on:
  push:
    branches: [main]
    paths:
      - '**/*.md'

jobs:
  update-index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Get changed docs
        id: changes
        run: |
          echo "files=\$(git diff --name-only \${{ github.event.before }} HEAD -- '**/*.md' | tr '\\n' ' ')" >> \$GITHUB_OUTPUT

      - name: Update vector index
        if: steps.changes.outputs.files != ''
        env:
          HKT_MEMORY_API_KEY: \${{ secrets.HKT_MEMORY_API_KEY }}
          HKT_MEMORY_BASE_URL: \${{ secrets.HKT_MEMORY_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/' }}
          HKT_MEMORY_MODEL: \${{ secrets.HKT_MEMORY_MODEL || 'embedding-3' }}
        run: |
          for file in \${{ steps.changes.outputs.files }}; do
            if [ -f "$file" ]; then
              echo "Indexing: $file"
              hkt-memory ingest-artifact --content-file "$file" --source-mode governed --artifact-type spec --title "$file"
            fi
          done

      - name: Store last indexed commit
        run: git rev-parse HEAD > .last-rebuild-commit
`

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

export interface SetupCiOptions {
  /** 知识仓库路径（可选，默认通过 resolveKnowledgeHome 获取） */
  knowledgeHome?: string
}

export interface SetupCiResult {
  /** workflow 文件的完整路径 */
  workflowPath: string
  /** 是否为覆盖写入 */
  overwritten: boolean
}

/**
 * 在知识仓库中生成 GitHub Actions workflow 文件
 *
 * @param options - 配置选项
 * @returns 生成结果
 */
export function setupCi(options?: SetupCiOptions): SetupCiResult {
  const home = options?.knowledgeHome ?? resolveKnowledgeHome()
  const workflowDir = join(home, ".github", "workflows")
  const workflowPath = join(workflowDir, "knowledge-index.yml")

  const overwritten = existsSync(workflowPath)

  // 确保目录存在
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true })
  }

  // 写入 workflow 文件
  writeFileSync(workflowPath, WORKFLOW_TEMPLATE, "utf8")

  return { workflowPath, overwritten }
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

const setupCiCommand = defineCommand({
  meta: {
    name: "setup-ci",
    description: "Generate GitHub Actions workflow for knowledge index updates",
  },
  run: async () => {
    try {
      const result = setupCi()

      if (result.overwritten) {
        process.stdout.write(
          `Updated workflow: ${result.workflowPath}\n`,
        )
      } else {
        process.stdout.write(
          `Created workflow: ${result.workflowPath}\n`,
        )
      }

      process.stderr.write(
        "\nReminder: Add the following secret to your GitHub repository:\n" +
        "  HKT_MEMORY_API_KEY — your HKTMemory API key\n" +
        "\nOptional secrets (have defaults):\n" +
        "  HKT_MEMORY_BASE_URL — API base URL\n" +
        "  HKT_MEMORY_MODEL    — embedding model name\n",
      )
    } catch (err) {
      process.stderr.write(
        "[gale-knowledge] setup-ci failed: " +
        (err instanceof Error ? err.message : String(err)) +
        "\n",
      )
      process.exit(1)
    }
  },
})

export { WORKFLOW_TEMPLATE }
export default setupCiCommand
