import type { DerivedTask, TaskStatus, FormatOptions } from "./types.ts"

const STATUS_COLORS: Record<TaskStatus, string> = {
  completed: "\x1b[32m",
  in_progress: "\x1b[34m",
  failed: "\x1b[31m",
  stale: "\x1b[33m",
}

const RESET = "\x1b[0m"

function colorize(text: string, status: TaskStatus, noColor: boolean): string {
  if (noColor) return text
  const color = STATUS_COLORS[status]
  return `${color}${text}${RESET}`
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + "..."
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${month}-${day} ${hours}:${minutes}`
}

export function formatTable(tasks: DerivedTask[], options: FormatOptions): string {
  if (tasks.length === 0) {
    return "No tasks found."
  }

  // Bug 5: limit=0 should show message instead of empty table header
  if (options.limit === 0) {
    return "No tasks found."
  }

  const { noColor } = options

  const headers = ["Task ID", "Title", "Project", "Skill", "Status", "Started"]
  const colWidths = [10, 30, 15, 15, 12, 16]

  const lines: string[] = []

  const headerRow = headers
    .map((h, i) => h.padEnd(colWidths[i]))
    .join(" ")
  lines.push(headerRow)
  lines.push("-".repeat(headerRow.length))

  for (const task of tasks.slice(options.offset, options.offset + options.limit)) {
    const statusText = task.status
    const row = [
      truncate(task.task_id, colWidths[0]).padEnd(colWidths[0]),
      truncate(task.title, colWidths[1]).padEnd(colWidths[1]),
      truncate(task.project, colWidths[2]).padEnd(colWidths[2]),
      truncate(task.skill, colWidths[3]).padEnd(colWidths[3]),
      colorize(statusText.padEnd(colWidths[4]), task.status, noColor),
      formatDate(task.started_at).padEnd(colWidths[5]),
    ].join(" ")
    lines.push(row)
  }

  const remaining = tasks.length - (options.offset + options.limit)
  if (remaining > 0) {
    lines.push(`\n... and ${remaining} more tasks`)
  }

  return lines.join("\n")
}

export function formatJson(tasks: DerivedTask[], options: FormatOptions): string {
  const limited = tasks.slice(options.offset, options.offset + options.limit)
  return JSON.stringify(limited, null, 2)
}

export function formatQuiet(tasks: DerivedTask[], options: FormatOptions): string {
  const ids = tasks
    .slice(options.offset, options.offset + options.limit)
    .map(t => t.task_id)
  return ids.length > 0 ? ids.join("\n") + "\n" : ""
}

export function formatStats(tasks: DerivedTask[], noColor: boolean): string {
  if (tasks.length === 0) {
    return "No tasks found."
  }

  const total = tasks.length
  const completed = tasks.filter(t => t.status === "completed").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const failed = tasks.filter(t => t.status === "failed").length
  const stale = tasks.filter(t => t.status === "stale").length

  const byProject = new Map<string, number>()
  const bySkill = new Map<string, number>()

  for (const task of tasks) {
    byProject.set(task.project, (byProject.get(task.project) ?? 0) + 1)
    bySkill.set(task.skill, (bySkill.get(task.skill) ?? 0) + 1)
  }

  const sortedProjects = Array.from(byProject.entries())
    .sort((a, b) => b[1] - a[1])

  const sortedSkills = Array.from(bySkill.entries())
    .sort((a, b) => b[1] - a[1])

  const lines: string[] = []
  lines.push("Task Statistics")
  lines.push("")
  lines.push(`  Total:       ${total}`)
  lines.push(`  Completed:   ${noColor ? completed : `\x1b[32m${completed}\x1b[0m`}`)
  lines.push(`  In Progress: ${noColor ? inProgress : `\x1b[34m${inProgress}\x1b[0m`}`)
  lines.push(`  Failed:      ${noColor ? failed : `\x1b[31m${failed}\x1b[0m`}`)
  lines.push(`  Stale:       ${noColor ? stale : `\x1b[33m${stale}\x1b[0m`}`)
  lines.push("")
  lines.push("By Project:")
  for (const [project, count] of sortedProjects) {
    lines.push(`  ${project}: ${count}`)
  }
  lines.push("")
  lines.push("By Skill:")
  for (const [skill, count] of sortedSkills) {
    lines.push(`  ${skill}: ${count}`)
  }

  return lines.join("\n")
}

export function formatTaskDetail(task: DerivedTask, noColor: boolean): string {
  const lines: string[] = []

  lines.push(`Task: ${task.title || "(untitled)"}`)
  lines.push(`ID: ${task.task_id}`)
  lines.push(`Project: ${task.project}`)
  lines.push(`Skill: ${task.skill}`)

  const statusColor = noColor ? "" : STATUS_COLORS[task.status]
  const reset = noColor ? "" : RESET
  lines.push(`Status: ${statusColor}${task.status}${reset}`)

  lines.push(`Started: ${formatDate(task.started_at)}`)
  if (task.completed_at) {
    lines.push(`Completed: ${formatDate(task.completed_at)}`)
  }

  if (task.parent_task_id) {
    lines.push(`Parent Task: ${task.parent_task_id}`)
  }

  if (task.pr_url) {
    lines.push(`PR: ${task.pr_url}`)
  }

  if (task.error) {
    lines.push("")
    lines.push(`Error: ${task.error}`)
  }

  if (task.memories.length > 0) {
    lines.push("")
    lines.push("Memory Entries:")
    for (const mem of task.memories) {
      lines.push(`  - ${mem.memory_title}${mem.memory_id ? ` (${mem.memory_id})` : ""}`)
    }
  }

  return lines.join("\n")
}
