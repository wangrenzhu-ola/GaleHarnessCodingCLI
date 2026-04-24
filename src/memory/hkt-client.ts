import { spawn } from "node:child_process"

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

      const proc = spawn(this.binary, args, {
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
