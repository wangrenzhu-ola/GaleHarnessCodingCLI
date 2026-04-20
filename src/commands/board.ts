import { defineCommand } from "citty"
import boardList from "./board-list"
import boardShow from "./board-show"
import boardStats from "./board-stats"
import boardServe from "./board-serve"

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
      return boardList.run?.({ args: { ...args, format: args.format ?? "table", limit: args.limit ?? "20", offset: args.offset ?? "0" }, cmd } as any)
    }
  },
})
