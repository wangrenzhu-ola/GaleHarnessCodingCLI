import { defineCommand } from "citty"
import { readAndMergeTasks } from "../board/reader"
import { formatTable, formatJson, formatQuiet } from "../board/formatter"
import { readKnowledgeDocuments } from "../board/knowledge-reader"
import type { KnowledgeDocType } from "../knowledge/types"
import type { TaskStatus, FormatOptions } from "../board/types"

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
    offset: {
      type: "string",
      description: "Number of tasks to skip",
      default: "0",
    },
    format: {
      type: "string",
      description: "Output format: table, json, or quiet",
      default: "table",
    },
    "with-knowledge": {
      type: "boolean",
      description: "Append knowledge documents after task list",
      default: false,
    },
    "knowledge-only": {
      type: "boolean",
      description: "Show only knowledge documents",
      default: false,
    },
    "knowledge-type": {
      type: "string",
      description: "Filter knowledge documents by type: brainstorms, plans, solutions",
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

    // Bug 4: Validate --limit is not negative and is integer
    const parsedLimit = Number(args.limit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
      console.error("Error: --limit must be a non-negative integer")
      process.exit(1)
    }

    // Validate --offset is not negative and is integer
    const parsedOffset = Number(args.offset)
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      console.error("Error: --offset must be a non-negative integer")
      process.exit(1)
    }

    // Knowledge-only mode: skip task loading entirely
    if (args["knowledge-only"]) {
      const knowledgeDocs = readKnowledgeDocuments({
        project: (args.project && args.project.trim() !== "") ? args.project : undefined,
        type: args["knowledge-type"] as KnowledgeDocType | undefined,
      })
      console.log(formatKnowledgeOutput(knowledgeDocs, args.project))
      return
    }

    const tasks = await readAndMergeTasks()

    let filtered = tasks

    if (args.status && args.status !== "all") {
      const status = args.status as TaskStatus
      filtered = filtered.filter(t => t.status === status)
    }

    // Bug 7: --project "" should be treated as no filter, not as empty string filter
    if (args.project && args.project.trim() !== "") {
      filtered = filtered.filter(t => t.project === args.project)
    }

    // Bug 7: --skill "" should be treated as no filter
    if (args.skill && args.skill.trim() !== "") {
      filtered = filtered.filter(t => t.skill === args.skill)
    }

    // Bug 3: limit=0 should produce empty table (header only), not show all records
    const formatOptions: FormatOptions = {
      format: args.format as "table" | "json" | "quiet",
      limit: parsedLimit,
      offset: parsedOffset,
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

    // Knowledge documents section
    if (args["with-knowledge"]) {
      const knowledgeDocs = readKnowledgeDocuments({
        project: (args.project && args.project.trim() !== "") ? args.project : undefined,
        type: args["knowledge-type"] as KnowledgeDocType | undefined,
      })
      console.log(formatKnowledgeOutput(knowledgeDocs, args.project))
    }
  },
})

function formatKnowledgeOutput(docs: ReturnType<typeof readKnowledgeDocuments>, project?: string): string {
  const header = project && project.trim()
    ? `\n\xF0\x9F\x93\x9A Knowledge Documents (project: ${project})`
    : "\n\xF0\x9F\x93\x9A Knowledge Documents"

  if (docs.length === 0) {
    return `${header}\n\n  No documents found.`
  }

  const lines: string[] = [header, ""]

  // Group by type
  const grouped = new Map<string, typeof docs>()
  for (const doc of docs) {
    const list = grouped.get(doc.type) ?? []
    list.push(doc)
    grouped.set(doc.type, list)
  }

  for (const [type, typeDocs] of grouped) {
    lines.push(`  ${type}/`)
    for (const doc of typeDocs) {
      const dateStr = doc.date ? `${doc.date} ` : ""
      lines.push(`    ${dateStr}${doc.title}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}
