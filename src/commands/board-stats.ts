import { defineCommand } from "citty"
import { readAndMergeTasks } from "../board/reader.ts"
import { formatStats } from "../board/formatter.ts"

export default defineCommand({
  meta: {
    name: "stats",
    description: "Show task statistics and aggregates",
  },
  async run() {
    const tasks = await readAndMergeTasks()
    const noColor = process.env.NO_COLOR === "1" || !process.stdout.isTTY
    console.log(formatStats(tasks, noColor))
  },
})
