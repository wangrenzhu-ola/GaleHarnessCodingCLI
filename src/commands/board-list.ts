import { defineCommand } from "citty"
import { readAndMergeTasks } from "../board/reader.ts"
import { formatTable, formatJson, formatQuiet } from "../board/formatter.ts"
import type { TaskStatus, FormatOptions } from "../board/types.ts"

const VALID_STATUSES: TaskStatus[] = ["in_progress", "completed", "failed", "stale"]
const VALID_FORMATS = ["table", "json", "quiet"] as const

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
    // Bug 1: Validate --status
    if (args.status && args.status !== "all" && !VALID_STATUSES.includes(args.status as TaskStatus)) {
      console.error(`Error: Invalid status '${args.status}'. Must be one of: ${VALID_STATUSES.join(", ")}, or all`)
      process.exit(1)
    }

    // Bug 2: Validate --format
    if (!VALID_FORMATS.includes(args.format as typeof VALID_FORMATS[number])) {
      console.error(`Error: Invalid format '${args.format}'. Must be one of: ${VALID_FORMATS.join(", ")}`)
      process.exit(1)
    }

    // Bug 4: Validate --limit is not negative
    const parsedLimit = parseInt(args.limit, 10)
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      console.error("Error: --limit must be a non-negative integer")
      process.exit(1)
    }

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

    // Bug 3: limit=0 should produce empty table (header only), not show all records
    const formatOptions: FormatOptions = {
      format: args.format as "table" | "json" | "quiet",
      limit: parsedLimit,
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
