/**
 * gale-knowledge CLI 入口
 *
 * 子命令:
 *   resolve-home                          输出知识仓库根目录路径
 *   resolve-path --type <type> [--project <name>]  输出完整文档目录路径
 *
 * Contract: 所有错误输出到 stderr，process.exit(0)。
 */

import {
  resolveKnowledgeHome,
  resolveKnowledgePath,
  extractProjectName,
} from "../../src/knowledge/home.js"
import type { KnowledgeDocType } from "../../src/knowledge/types.js"

// ---------------------------------------------------------------------------
// Arg parsing helpers
// ---------------------------------------------------------------------------

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {}
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = "true"
        i += 1
      }
    } else {
      i += 1
    }
  }
  return flags
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const VALID_DOC_TYPES = new Set<string>(["brainstorms", "plans", "solutions"])

function isValidDocType(value: string): value is KnowledgeDocType {
  return VALID_DOC_TYPES.has(value)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const argv = process.argv.slice(2)
  const subcommand = argv[0]

  try {
    if (subcommand === "resolve-home") {
      const home = resolveKnowledgeHome()
      process.stdout.write(home + "\n")
      return
    }

    if (subcommand === "resolve-path") {
      const flags = parseFlags(argv.slice(1))
      const type = flags["type"]

      if (!type || !isValidDocType(type)) {
        process.stderr.write(
          "Usage: gale-knowledge resolve-path --type <brainstorms|plans|solutions> [--project <name>]\n",
        )
        process.exit(1)
        return
      }

      const result = resolveKnowledgePath({
        type,
        projectName: flags["project"],
      })

      // 输出 JSON 格式便于脚本解析
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      return
    }

    if (subcommand === "extract-project") {
      const name = extractProjectName()
      process.stdout.write(name + "\n")
      return
    }

    // 未知子命令或无子命令
    process.stderr.write(
      "Usage:\n" +
      "  gale-knowledge resolve-home\n" +
      "  gale-knowledge resolve-path --type <brainstorms|plans|solutions> [--project <name>]\n" +
      "  gale-knowledge extract-project\n",
    )
    process.exit(subcommand ? 1 : 0)
  } catch (err) {
    process.stderr.write(
      "[gale-knowledge] Unexpected error: " +
      (err instanceof Error ? err.message : String(err)) +
      "\n",
    )
    process.exit(0)
  }
}

main()
