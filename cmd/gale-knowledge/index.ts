#!/usr/bin/env bun
/**
 * gale-knowledge CLI 主入口
 *
 * 子命令:
 *   resolve-home       输出知识仓库根目录路径
 *   resolve-path       输出完整文档目录路径
 *   extract-project    输出当前项目名
 *   init               初始化知识仓库
 *   commit             提交知识变更 (placeholder)
 *   rebuild-index      重建向量索引 (placeholder)
 *   setup-ci           配置 CI 集成 (placeholder)
 */

import { defineCommand, runMain, showUsage } from "citty"
import {
  resolveKnowledgeHome,
  resolveKnowledgePath,
  extractProjectName,
} from "../../src/knowledge/home.js"
import { isValidDocType } from "../../src/knowledge/types.js"
import initCommand from "./init.js"
import commitCommand from "./git-ops.js"
import setupCiCommand from "./ci-setup.js"
import rebuildIndexCommand from "./rebuild-index.js"

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const resolveHome = defineCommand({
  meta: {
    name: "resolve-home",
    description: "Print the knowledge repository root directory path",
  },
  run: async () => {
    const home = resolveKnowledgeHome()
    process.stdout.write(home + "\n")
  },
})

const resolvePath = defineCommand({
  meta: {
    name: "resolve-path",
    description: "Print the full document directory path for a given type",
  },
  args: {
    type: {
      type: "string",
      description: "Document type (brainstorms | plans | solutions)",
      required: true,
    },
    project: {
      type: "string",
      description: "Project name (optional, auto-detected from git remote)",
      required: false,
    },
    json: {
      type: "boolean",
      description: "Output full JSON object",
    },
  },
  run: async ({ args }) => {
    const type = args.type as string
    if (!isValidDocType(type)) {
      process.stderr.write(
        "Error: --type must be one of: brainstorms, plans, solutions\n",
      )
      process.exit(1)
      return
    }

    const result = resolveKnowledgePath({
      type,
      projectName: args.project as string | undefined,
    })
    if (args.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
    } else {
      process.stdout.write(result.docDir + "\n")
    }
  },
})

const extractProject = defineCommand({
  meta: {
    name: "extract-project",
    description: "Print the current project name (from git remote or dirname)",
  },
  run: async () => {
    const name = extractProjectName()
    process.stdout.write(name + "\n")
  },
})




// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

const main = defineCommand({
  meta: {
    name: "gale-knowledge",
    description: "Global knowledge repository management CLI",
  },
  subCommands: {
    "resolve-home": () => resolveHome,
    "resolve-path": () => resolvePath,
    "extract-project": () => extractProject,
    init: () => initCommand,
    commit: () => commitCommand,
    "rebuild-index": () => rebuildIndexCommand,
    "setup-ci": () => setupCiCommand,
  },
  run: async (ctx) => {
    const hasSubCommand = ctx.rawArgs.some((arg) => !arg.startsWith("-"))
    if (!hasSubCommand) {
      await showUsage(ctx.cmd)
    }
  },
})

runMain(main)
