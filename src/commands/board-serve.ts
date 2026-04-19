import { defineCommand } from "citty"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:net"

export function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close()
      resolve(true)
    })
    server.listen(port)
  })
}

export function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number | null> {
  return new Promise(async (resolve) => {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i
      if (await checkPortAvailable(port)) {
        resolve(port)
        return
      }
    }
    resolve(null)
  })
}

function openBrowser(url: string): void {
  const platform = process.platform
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open"
  spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref()
}

export default defineCommand({
  meta: {
    name: "serve",
    description: "Start TaskBoard web UI server",
  },
  args: {
    port: {
      type: "string",
      description: "Server port",
      default: "4321",
    },
    open: {
      type: "boolean",
      description: "Open browser after server starts",
      default: false,
    },
  },
  async run({ args }) {
    const requestedPort = parseInt(args.port, 10)

    // Bug 5: Validate --port range
    if (isNaN(requestedPort) || requestedPort < 0 || requestedPort >= 65536) {
      console.error("Error: --port must be between 0 and 65535")
      process.exit(1)
    }

    const defaultTaskboardRoot = join(homedir(), ".galeharness", "boards", "taskboard")
    const fallbackTaskboardRoot = "/tmp/taskboard"

    // Determine TaskBoard root: env var > default path > fallback path
    let taskboardRoot = process.env.TASKBOARD_ROOT ?? defaultTaskboardRoot

    // If default path doesn't exist, try fallback path for testing/development
    if (!process.env.TASKBOARD_ROOT && !existsSync(taskboardRoot) && existsSync(fallbackTaskboardRoot)) {
      taskboardRoot = fallbackTaskboardRoot
    }

    if (!existsSync(taskboardRoot)) {
      console.error(`Error: TaskBoard not found at ${taskboardRoot}`)
      console.error("")
      console.error("To install TaskBoard:")
      console.error("  1. Clone the TaskBoard repository")
      console.error("  2. Set TASKBOARD_ROOT environment variable, or install to ~/.galeharness/boards/taskboard/")
      console.error("")
      console.error(`You can also place TaskBoard at ${fallbackTaskboardRoot} for testing.`)
      process.exit(1)
    }

    const serverScript = join(taskboardRoot, "server", "index.ts")
    if (!existsSync(serverScript)) {
      console.error(`Error: Server script not found at ${serverScript}`)
      process.exit(1)
    }

    const isAvailable = await checkPortAvailable(requestedPort)
    let port = requestedPort

    if (!isAvailable) {
      console.log(`Port ${requestedPort} is in use, searching for available port...`)
      const availablePort = await findAvailablePort(requestedPort + 1)
      if (!availablePort) {
        console.error("Error: Could not find an available port")
        process.exit(1)
      }
      port = availablePort
      console.log(`Found available port: ${port}`)
    }

    console.log(`Starting TaskBoard server on port ${port}...`)

    const child = spawn("bun", ["run", serverScript], {
      env: { ...process.env, BOARD_PORT: String(port) },
      stdio: "inherit",
    })

    child.on("error", (err) => {
      console.error("Failed to start server:", err.message)
      process.exit(1)
    })

    child.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server exited with code ${code}`)
        process.exit(code)
      }
    })

    if (args.open) {
      setTimeout(() => {
        openBrowser(`http://localhost:${port}`)
      }, 1000)
    }

    process.on("SIGINT", () => {
      console.log("\nShutting down server...")
      child.kill("SIGINT")
    })

    process.on("SIGTERM", () => {
      child.kill("SIGTERM")
    })
  },
})
