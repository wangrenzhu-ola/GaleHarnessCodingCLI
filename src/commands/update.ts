import { defineCommand } from "citty"
import { checkForUpdate, performUpdate, performRollback } from "../utils/update"

export default defineCommand({
  meta: {
    name: "update",
    description: "Update GaleHarnessCLI to the latest version, or roll back to a previous version",
  },
  args: {
    check: {
      type: "boolean",
      alias: "c",
      description: "Only check for updates, do not install",
      default: false,
    },
    rollback: {
      type: "boolean",
      alias: "r",
      description: "Roll back to the previous version",
      default: false,
    },
  },
  async run({ args }) {
    const checkOnly = Boolean(args.check)
    const doRollback = Boolean(args.rollback)

    if (checkOnly && doRollback) {
      throw new Error("Cannot use --check and --rollback together.")
    }

    if (doRollback) {
      const result = await performRollback()
      if (result.success) {
        console.log(result.message)
      } else {
        throw new Error(result.message)
      }
      return
    }

    if (checkOnly) {
      const info = await checkForUpdate()
      if (info.hasUpdate) {
        console.log(`Update available: v${info.current} -> v${info.latest}`)
        console.log(`Run 'gale-harness update' to install the latest version.`)
      } else {
        console.log(`Already up to date (v${info.current})`)
      }
      return
    }

    // Full update
    const result = await performUpdate()
    if (result.success) {
      console.log(result.message)
    } else {
      throw new Error(result.message)
    }
  },
})
