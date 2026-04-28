import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export interface HktClientOptions {
  binary?: string
  providerBinary?: string
  cwd?: string
  timeoutMs?: number
  memoryDir?: string
  providerMemoryDir?: string
  preferProviderVectorRecall?: boolean
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
  private providerBinary: string
  private cwd: string
  private timeoutMs: number
  private memoryDir?: string
  private providerMemoryDir?: string
  private preferProviderVectorRecall: boolean
  private diagnostics: Record<string, unknown>

  constructor(options: HktClientOptions = {}) {
    this.binary = options.binary ?? process.env.HKT_MEMORY_BIN ?? "hkt-memory"
    this.providerBinary =
      options.providerBinary ??
      process.env.HERMES_HKTMEMORY_BIN ??
      "hermes-hktmemory"
    this.cwd = options.cwd ?? process.cwd()
    this.timeoutMs = options.timeoutMs ?? 5000
    this.memoryDir = options.memoryDir
    this.providerMemoryDir =
      options.providerMemoryDir ?? process.env.HERMES_HKTMEMORY_DIR
    this.preferProviderVectorRecall =
      options.preferProviderVectorRecall ??
      Boolean(
        this.providerMemoryDir || isTruthy(process.env.HERMES_HKTMEMORY_RECALL),
      )
    this.diagnostics = options.diagnostics ?? {}
  }

  async taskRecall(
    envelope: Record<string, unknown>,
    limit = 5,
  ): Promise<HktTaskResult> {
    if (this.preferProviderVectorRecall) {
      const providerResult = await this.runProviderRecall(envelope, limit)
      if (hasRecallContent(providerResult)) return providerResult
    }
    return this.runJson([
      "task-recall",
      "--json",
      "--envelope",
      JSON.stringify(envelope),
      "--limit",
      String(limit),
    ])
  }

  taskCapture(event: Record<string, unknown>): Promise<HktTaskResult> {
    return this.runJson([
      "task-capture",
      "--json",
      "--event",
      JSON.stringify(event),
    ])
  }

  storeSessionTranscript(
    transcript: Record<string, unknown>,
  ): Promise<HktTaskResult> {
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
    return this.runJson([
      "task-ledger",
      "--json",
      "--project",
      project,
      "--task-id",
      taskId,
    ])
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
        env: this.memoryDir
          ? { ...process.env, HKT_MEMORY_DIR: this.memoryDir }
          : { ...process.env },
      })

      const timer = setTimeout(() => {
        proc.kill("SIGKILL")
        finish(
          this.withDiagnostics(
            skippedResult(`hkt-memory timed out after ${this.timeoutMs}ms`),
          ),
        )
      }, this.timeoutMs)

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString()
      })
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      proc.on("error", (err) => {
        clearTimeout(timer)
        finish(
          this.withDiagnostics(
            skippedResult(`hkt-memory unavailable: ${err.message}`),
          ),
        )
      })
      proc.on("close", (code) => {
        clearTimeout(timer)
        if (settled) return
        if (code !== 0) {
          finish(
            this.withDiagnostics(
              skippedResult(
                `hkt-memory exited ${code}: ${stderr.trim()}`.trim(),
              ),
            ),
          )
          return
        }
        try {
          const parsed = JSON.parse(stdout) as HktTaskResult
          finish(this.withDiagnostics(parsed))
        } catch {
          finish(
            this.withDiagnostics(
              skippedResult("hkt-memory returned malformed JSON"),
            ),
          )
        }
      })
    })
  }

  private runProviderRecall(
    envelope: Record<string, unknown>,
    limit: number,
  ): Promise<HktTaskResult> {
    return new Promise((resolve) => {
      let stdout = ""
      let stderr = ""
      let settled = false

      const finish = (result: HktTaskResult) => {
        if (settled) return
        settled = true
        resolve(result)
      }

      const query = providerRecallQuery(envelope)
      const command = resolveExecutableCommand(this.providerBinary, [
        "recall",
        "-q",
        query,
        "--limit",
        String(limit),
      ])
      const proc = spawn(command.executable, command.args, {
        cwd: this.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        env: this.providerMemoryDir
          ? { ...process.env, HERMES_HKTMEMORY_DIR: this.providerMemoryDir }
          : { ...process.env },
      })

      const timer = setTimeout(() => {
        proc.kill("SIGKILL")
        finish(
          this.withDiagnostics(
            skippedResult(
              `hermes-hktmemory recall timed out after ${this.timeoutMs}ms`,
            ),
            { provider_vector_reason: "timeout" },
          ),
        )
      }, this.timeoutMs)

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString()
      })
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      proc.on("error", (err) => {
        clearTimeout(timer)
        finish(
          this.withDiagnostics(
            skippedResult(`hermes-hktmemory unavailable: ${err.message}`),
            { provider_vector_reason: "unavailable" },
          ),
        )
      })
      proc.on("close", (code) => {
        clearTimeout(timer)
        if (settled) return
        if (code !== 0) {
          finish(
            this.withDiagnostics(
              skippedResult(
                `hermes-hktmemory exited ${code}: ${stderr.trim()}`.trim(),
              ),
              { provider_vector_reason: "exit" },
            ),
          )
          return
        }
        finish(
          this.withDiagnostics(providerRecallResult(stdout), {
            provider_vector_query: query,
          }),
        )
      })
    })
  }

  private withDiagnostics(
    result: HktTaskResult,
    extraDiagnostics: Record<string, unknown> = {},
  ): HktTaskResult {
    return {
      ...result,
      diagnostics: {
        ...(result.diagnostics ?? {}),
        ...this.diagnostics,
        memory_dir: this.memoryDir ?? process.env.HKT_MEMORY_DIR ?? null,
        ...(this.providerMemoryDir
          ? { hermes_hktmemory_dir: this.providerMemoryDir }
          : {}),
        ...extraDiagnostics,
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

function resolveExecutableCommand(
  executable: string,
  args: string[],
): { executable: string; args: string[] } {
  if (process.platform !== "win32" || !isPathLike(executable)) {
    return { executable, args }
  }

  if (shouldRunWithBun(executable)) {
    return { executable: process.execPath, args: [executable, ...args] }
  }

  return { executable, args }
}

function isPathLike(executable: string): boolean {
  return (
    path.isAbsolute(executable) ||
    executable.includes("/") ||
    executable.includes("\\")
  )
}

function shouldRunWithBun(executable: string): boolean {
  const ext = path.extname(executable).toLowerCase()
  if ([".js", ".mjs", ".cjs", ".ts"].includes(ext)) return true
  if (!existsSync(executable)) return false

  try {
    const firstLine =
      readFileSync(executable, "utf8").split(/\r?\n/, 1)[0] ?? ""
    return firstLine.startsWith("#!") && /\b(?:bun|node)\b/.test(firstLine)
  } catch {
    return false
  }
}

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes" || value === "on"
}

function providerRecallQuery(envelope: Record<string, unknown>): string {
  const inputSummary = String(envelope.input_summary ?? "").trim()
  if (inputSummary) return inputSummary
  return [
    envelope.project,
    envelope.branch,
    envelope.skill,
    envelope.issue_id,
    envelope.artifact_type,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
}

function providerRecallResult(stdout: string): HktTaskResult {
  const text = stdout.trim()
  if (!text) {
    return {
      ...skippedResult("hermes-hktmemory recall returned no matches"),
      diagnostics: {
        blocked: [],
        omitted_sources: [],
        backend: "provider_vector",
        provider_vector_empty: true,
      },
    }
  }

  const parsed = parseProviderJson(text)
  const items = extractProviderItems(parsed, text)
  const injectable = extractProviderMarkdown(parsed, text, items)
  return {
    success: items.length > 0 || injectable.trim().length > 0,
    trace_id: null,
    injectable_markdown: injectable,
    items,
    diagnostics: { backend: "provider_vector" },
  }
}

function parseProviderJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractProviderItems(parsed: unknown, text: string): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>
    const value = record.items ?? record.results ?? record.memories
    if (Array.isArray(value)) return value
  }
  return [{ content: text }]
}

function extractProviderMarkdown(
  parsed: unknown,
  text: string,
  items: unknown[],
): string {
  const parsedObject = parsed && typeof parsed === "object"
  if (parsedObject && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>
    const markdown =
      record.injectable_markdown ?? record.markdown ?? record.text
    if (typeof markdown === "string" && markdown.trim()) return markdown
    if (items.length === 0) return ""
  }
  const body = items
    .map((item) => {
      if (typeof item === "string") return `- ${item}`
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>
        const content =
          record.content ??
          record.text ??
          record.summary ??
          record.markdown ??
          JSON.stringify(record)
        return `- ${String(content)}`
      }
      return `- ${String(item)}`
    })
    .join("\n")
  return body
    ? `<untrusted-memory-evidence>\n${body}\n</untrusted-memory-evidence>`
    : parsedObject
      ? ""
      : text
}

function hasRecallContent(result: HktTaskResult): boolean {
  return Boolean(
    result.success &&
    ((result.items?.length ?? 0) > 0 ||
      String(result.injectable_markdown ?? "").trim()),
  )
}
