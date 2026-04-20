import { defineCommand } from "citty"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { createServer } from "node:net"
import { fileURLToPath } from "node:url"

// Resolve vendor/taskboard path relative to this file's location
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const vendoredTaskboard = join(__dirname, "..", "..", "vendor", "taskboard")

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
    // Validate --port is integer and in valid range
    const requestedPort = Number(args.port)
    if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort >= 65536) {
      console.error("Error: --port must be an integer between 0 and 65535")
      process.exit(1)
    }

    const userTaskboardRoot = join(homedir(), ".galeharness", "boards", "taskboard")

    // Determine TaskBoard root: env var > vendored > user path
    let taskboardRoot: string
    if (process.env.TASKBOARD_ROOT) {
      taskboardRoot = process.env.TASKBOARD_ROOT
    } else if (existsSync(vendoredTaskboard)) {
      taskboardRoot = vendoredTaskboard
    } else if (existsSync(userTaskboardRoot)) {
      taskboardRoot = userTaskboardRoot
    } else {
      console.error("Error: TaskBoard not found")
      console.error("")
      console.error("TaskBoard should be available at one of these locations:")
      console.error(`  1. Vendored: ${vendoredTaskboard}`)
      console.error(`  2. User: ${userTaskboardRoot}`)
      console.error("")
      console.error("Or set TASKBOARD_ROOT environment variable to the TaskBoard directory.")
      process.exit(1)
    }

    const serverScript = join(taskboardRoot, "server", "index.ts")
    if (!existsSync(serverScript)) {
      console.error(`Error: Server script not found at ${serverScript}`)
      process.exit(1)
    }

    // Auto-build frontend if dist/ is missing
    const distDir = join(taskboardRoot, "dist")
    if (!existsSync(distDir)) {
      console.log("Building TaskBoard frontend...")
      const buildResult = Bun.spawnSync(["bun", "run", "build"], {
        cwd: taskboardRoot,
        stdout: "inherit",
        stderr: "inherit",
      })
      if (buildResult.exitCode !== 0) {
        console.error("Error: Frontend build failed")
        process.exit(1)
      }
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
      cwd: taskboardRoot,
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
