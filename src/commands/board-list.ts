import { defineCommand } from "citty"
import { readAndMergeTasks } from "../board/reader.ts"
import { formatTable, formatJson, formatQuiet } from "../board/formatter.ts"
import type { TaskStatus, FormatOptions } from "../board/types.ts"

export default defineCommand({
  meta: {
    name: "list",
    description: "List tasks in board view",
  },
  args: {
    status: {
      type: "string",
      description: "Filter by status: in_progress, completed, failed, stale, or all",
      default: "all",
    },
    project: {
      type: "string",
      description: "Filter by project name",
    },
    skill: {
      type: "string",
      description: "Filter by skill name",
    },
    limit: {
      type: "string",
      description: "Maximum number of tasks to display",
      default: "20",
    },
    format: {
      type: "string",
      description: "Output format: table, json, or quiet",
      default: "table",
    },
  },
  async run({ args }) {
    const tasks = await readAndMergeTasks()

    let filtered = tasks

    if (args.status && args.status !== "all") {
      const status = args.status as TaskStatus
      filtered = filtered.filter(t => t.status === status)
    }

    if (args.project) {
      filtered = filtered.filter(t => t.project === args.project)
    }

    if (args.skill) {
      filtered = filtered.filter(t => t.skill === args.skill)
    }

    const formatOptions: FormatOptions = {
      format: args.format as "table" | "json" | "quiet",
      limit: parseInt(args.limit, 10) || 20,
      noColor: process.env.NO_COLOR === "1" || !process.stdout.isTTY,
    }

    let output: string
    switch (formatOptions.format) {
      case "json":
        output = formatJson(filtered, formatOptions)
        break
      case "quiet":
        output = formatQuiet(filtered, formatOptions)
        break
      case "table":
      default:
        output = formatTable(filtered, formatOptions)
        break
    }

    console.log(output)
  },
})
