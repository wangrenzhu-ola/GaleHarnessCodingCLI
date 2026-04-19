import { defineCommand } from "citty"
import boardList from "./board-list.ts"
import boardShow from "./board-show.ts"
import boardStats from "./board-stats.ts"
import boardServe from "./board-serve.ts"

export default defineCommand({
  meta: {
    name: "board",
    description: "Task board management commands",
  },
  subCommands: {
    list: () => boardList,
    show: () => boardShow,
    stats: () => boardStats,
    serve: () => boardServe,
  },
  async run({ args, cmd }) {
    if (!args._.length) {
      return boardList.run?.({ args: { ...args, format: args.format ?? "table", limit: args.limit ?? "20" }, cmd })
    }
  },
})
