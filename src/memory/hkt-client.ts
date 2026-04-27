import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export interface HktClientOptions {
  binary?: string
  cwd?: string
  timeoutMs?: number
  memoryDir?: string
  diagnostics?: Record<string, unknown>
}

export interface HktTaskResult {
  success: boolean
  skipped?: boolean
  reason?: string
  trace_id?: string | null
  injectable_markdown?: string
  items?: unknown[]
  diagnostics?: Record<string, unknown>
  [key: string]: unknown
}

export class HktClient {
  private binary: string
  private cwd: string
  private timeoutMs: number
  private memoryDir?: string
  private diagnostics: Record<string, unknown>

  constructor(options: HktClientOptions = {}) {
    this.binary = options.binary ?? process.env.HKT_MEMORY_BIN ?? "hkt-memory"
    this.cwd = options.cwd ?? process.cwd()
    this.timeoutMs = options.timeoutMs ?? 5000
    this.memoryDir = options.memoryDir
    this.diagnostics = options.diagnostics ?? {}
  }

  taskRecall(envelope: Record<string, unknown>, limit = 5): Promise<HktTaskResult> {
    return this.runJson(["task-recall", "--json", "--envelope", JSON.stringify(envelope), "--limit", String(limit)])
  }

  taskCapture(event: Record<string, unknown>): Promise<HktTaskResult> {
    return this.runJson(["task-capture", "--json", "--event", JSON.stringify(event)])
  }

  storeSessionTranscript(transcript: Record<string, unknown>): Promise<HktTaskResult> {
    const args = [
      "store-session-transcript",
      "--content",
      String(transcript.content ?? ""),
      "--session-id",
      String(transcript.session_id ?? ""),
      "--source",
      String(transcript.source ?? "galeharness"),
      "--source-mode",
      String(transcript.source_mode ?? "phase_completed"),
      "--importance",
      String(transcript.importance ?? "medium"),
    ]
    for (const [flag, key] of [
      ["--title", "title"],
      ["--topic", "topic"],
      ["--task-id", "task_id"],
      ["--project", "project"],
      ["--repo-root", "repo_root"],
      ["--branch", "branch"],
      ["--pr-id", "pr_id"],
      ["--max-chars", "max_chars"],
    ] as const) {
      const value = transcript[key]
      if (value !== undefined && value !== null && value !== "") {
        args.push(flag, String(value))
      }
    }
    if (transcript.metadata && typeof transcript.metadata === "object") {
      args.push("--metadata", JSON.stringify(transcript.metadata))
    }
    return this.runJson(args)
  }

  taskLedger(project: string, taskId: string): Promise<HktTaskResult> {
    return this.runJson(["task-ledger", "--json", "--project", project, "--task-id", taskId])
  }

  private runJson(args: string[]): Promise<HktTaskResult> {
    return new Promise((resolve) => {
      let stdout = ""
      let stderr = ""
      let settled = false

      const finish = (result: HktTaskResult) => {
        if (settled) return
        settled = true
        resolve(result)
      }

      const command = resolveExecutableCommand(this.binary, args)
      const proc = spawn(command.executable, command.args, {
        cwd: this.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        env: this.memoryDir ? { ...process.env, HKT_MEMORY_DIR: this.memoryDir } : { ...process.env },
      })

      const timer = setTimeout(() => {
        proc.kill("SIGKILL")
        finish(this.withDiagnostics(skippedResult(`hkt-memory timed out after ${this.timeoutMs}ms`)))
      }, this.timeoutMs)

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString()
      })
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      proc.on("error", (err) => {
        clearTimeout(timer)
        finish(this.withDiagnostics(skippedResult(`hkt-memory unavailable: ${err.message}`)))
      })
      proc.on("close", (code) => {
        clearTimeout(timer)
        if (settled) return
        if (code !== 0) {
          finish(this.withDiagnostics(skippedResult(`hkt-memory exited ${code}: ${stderr.trim()}`.trim())))
          return
        }
        try {
          const parsed = JSON.parse(stdout) as HktTaskResult
          finish(this.withDiagnostics(parsed))
        } catch {
          finish(this.withDiagnostics(skippedResult("hkt-memory returned malformed JSON")))
        }
      })
    })
  }

  private withDiagnostics(result: HktTaskResult): HktTaskResult {
    return {
      ...result,
      diagnostics: {
        ...(result.diagnostics ?? {}),
        ...this.diagnostics,
        memory_dir: this.memoryDir ?? process.env.HKT_MEMORY_DIR ?? null,
      },
    }
  }
}

export function skippedResult(reason: string): HktTaskResult {
  return {
    success: false,
    skipped: true,
    reason,
    trace_id: null,
    injectable_markdown: "",
    items: [],
    diagnostics: { blocked: [], omitted_sources: [] },
  }
}

function resolveExecutableCommand(executable: string, args: string[]): { executable: string; args: string[] } {
  if (process.platform !== "win32" || !isPathLike(executable)) {
    return { executable, args }
  }

  if (shouldRunWithBun(executable)) {
    return { executable: process.execPath, args: [executable, ...args] }
  }

  return { executable, args }
}

function isPathLike(executable: string): boolean {
  return path.isAbsolute(executable) || executable.includes("/") || executable.includes("\\")
}

function shouldRunWithBun(executable: string): boolean {
  const ext = path.extname(executable).toLowerCase()
  if ([".js", ".mjs", ".cjs", ".ts"].includes(ext)) return true
  if (!existsSync(executable)) return false

  try {
    const firstLine = readFileSync(executable, "utf8").split(/\r?\n/, 1)[0] ?? ""
    return firstLine.startsWith("#!") && /\b(?:bun|node)\b/.test(firstLine)
  } catch {
    return false
  }
}
