import { defineCommand } from "citty"
import { readAndMergeTasks } from "../board/reader.ts"
import { formatTaskDetail } from "../board/formatter.ts"

export default defineCommand({
  meta: {
    name: "show",
    description: "Show detailed information for a specific task",
  },
  args: {
    taskId: {
      type: "positional",
      description: "Task ID to display",
      required: true,
    },
  },
  async run({ args }) {
    const taskId = args.taskId as string

    if (!taskId) {
      console.error("Error: Task ID is required")
      console.error("Usage: gale-harness board show <task-id>")
      process.exit(1)
    }

    const tasks = await readAndMergeTasks()
    const task = tasks.find(t => t.task_id === taskId)

    if (!task) {
      console.error(`Error: Task "${taskId}" not found`)
      process.exit(1)
    }

    const noColor = process.env.NO_COLOR === "1" || !process.stdout.isTTY
    console.log(formatTaskDetail(task, noColor))
  },
})
