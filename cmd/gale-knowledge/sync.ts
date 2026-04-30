#!/usr/bin/env bun
/**
 * gale-knowledge sync 子命令
 *
 * 在全局知识仓库和项目本地 docs/ 之间单向同步缺失的文件。
 */

import { defineCommand } from "citty"
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { extractProjectName, resolveKnowledgePath } from "../../src/knowledge/home.js"
import { isValidDocType, VALID_DOC_TYPES } from "../../src/knowledge/types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncDirection = "global-to-project" | "project-to-global"

interface SyncItem {
  sourcePath: string
  targetPath: string
  filename: string
  type: string
}

// ---------------------------------------------------------------------------
// Sync logic
// ---------------------------------------------------------------------------

function listMarkdownFiles(dir: string, relativeDir = ""): string[] {
  if (!existsSync(dir)) {
    return []
  }
  try {
    const files: string[] = []
    for (const name of readdirSync(join(dir, relativeDir))) {
      if (name.startsWith(".")) {
        continue
      }

      const relativePath = join(relativeDir, name)
      const absolutePath = join(dir, relativePath)
      try {
        const stat = statSync(absolutePath)
        if (stat.isDirectory()) {
          files.push(...listMarkdownFiles(dir, relativePath))
        } else if (stat.isFile() && name.endsWith(".md")) {
          files.push(relativePath)
        }
      } catch {
        // Ignore unreadable entries and keep syncing the rest.
      }
    }
    return files
  } catch {
    return []
  }
}

function collectSyncItems(
  direction: SyncDirection,
  projectName: string,
  cwd: string,
  typeFilter?: string,
): SyncItem[] {
  const items: SyncItem[] = []
  const types = typeFilter ? [typeFilter] : (VALID_DOC_TYPES as readonly string[])

  for (const type of types) {
    let sourceDir: string
    let targetDir: string

    if (direction === "global-to-project") {
      const resolved = resolveKnowledgePath({ type: type as import("../../src/knowledge/types.js").KnowledgeDocType, projectName })
      sourceDir = resolved.docDir
      targetDir = join(cwd, "docs", type)
    } else {
      const resolved = resolveKnowledgePath({ type: type as import("../../src/knowledge/types.js").KnowledgeDocType, projectName })
      sourceDir = join(cwd, "docs", type)
      targetDir = resolved.docDir
    }

    const files = listMarkdownFiles(sourceDir)
    for (const filename of files) {
      const targetPath = join(targetDir, filename)
      if (!existsSync(targetPath)) {
        items.push({
          sourcePath: join(sourceDir, filename),
          targetPath,
          filename,
          type,
        })
      }
    }
  }

  return items
}

function executeSync(items: SyncItem[], dryRun: boolean): { copied: number; skipped: number } {
  let copied = 0
  let skipped = 0

  for (const item of items) {
    if (dryRun) {
      process.stdout.write(`[dry-run] Would copy: ${item.sourcePath} -> ${item.targetPath}\n`)
      copied++
      continue
    }

    try {
      mkdirSync(join(item.targetPath, ".."), { recursive: true })
      copyFileSync(item.sourcePath, item.targetPath)
      process.stdout.write(`Copied: ${item.sourcePath} -> ${item.targetPath}\n`)
      copied++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stderr.write(`Skipped (error): ${item.filename} — ${msg}\n`)
      skipped++
    }
  }

  return { copied, skipped }
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

const syncCommand = defineCommand({
  meta: {
    name: "sync",
    description: "Sync knowledge documents between global repo and project docs/",
  },
  args: {
    direction: {
      type: "string",
      description: "Sync direction: global-to-project (default) or project-to-global",
      required: false,
      default: "global-to-project",
    },
    type: {
      type: "string",
      description: "Document type to sync (omit to sync all types)",
      required: false,
    },
    "dry-run": {
      type: "boolean",
      description: "List what would be copied without writing",
      required: false,
    },
  },
  run: async ({ args }) => {
    const direction = args.direction as SyncDirection
    if (direction !== "global-to-project" && direction !== "project-to-global") {
      process.stderr.write(
        `Error: --direction must be one of: global-to-project, project-to-global\n`,
      )
      process.exit(1)
      return
    }

    const typeFilter = args.type as string | undefined
    if (typeFilter && !isValidDocType(typeFilter)) {
      process.stderr.write(
        `Error: --type must be one of: ${VALID_DOC_TYPES.join(", ")}\n`,
      )
      process.exit(1)
      return
    }

    const dryRun = args["dry-run"] as boolean
    const cwd = process.cwd()
    const projectName = extractProjectName(cwd)

    const items = collectSyncItems(direction, projectName, cwd, typeFilter)

    if (items.length === 0) {
      process.stdout.write(
        `No missing files to sync (${direction}${typeFilter ? `, type=${typeFilter}` : ""}).\n`,
      )
      process.exit(0)
      return
    }

    const { copied, skipped } = executeSync(items, dryRun)

    const summary = dryRun
      ? `[dry-run] ${copied} file(s) would be copied, ${skipped} skipped.\n`
      : `Sync complete: ${copied} file(s) copied, ${skipped} skipped.\n`

    process.stdout.write(summary)

    if (skipped > 0) {
      process.exit(1)
    }
  },
})

export default syncCommand
