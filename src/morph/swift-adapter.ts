import { promises as fs } from "fs"
import path from "path"

export type SwiftAdapterInputFile = {
  path: string
  content: string
}

export type SwiftAdapterRequest = {
  files: SwiftAdapterInputFile[]
  strategyFingerprint: string
  strategyTags: string[]
  apply: boolean
}

export type SwiftAdapterFileResult = {
  path: string
  changed: boolean
  content?: string
  warnings: string[]
}

export type SwiftAdapterResult = {
  ok: boolean
  unavailable?: boolean
  files: SwiftAdapterFileResult[]
  warnings: string[]
  stderr?: string
}

export type SwiftAdapterOptions = {
  executable?: string
  cwd?: string
}

export async function runSwiftAdapter(
  request: SwiftAdapterRequest,
  options: SwiftAdapterOptions = {},
): Promise<SwiftAdapterResult> {
  const executable = options.executable ?? process.env.MORPH_SWIFT_ADAPTER
  if (!executable) {
    return adapterUnavailable("Set MORPH_SWIFT_ADAPTER to enable SwiftSyntax-backed transformations.")
  }

  if (!(await executableExists(executable))) {
    return adapterUnavailable(`Swift adapter executable not found: ${executable}`)
  }

  const command = resolveExecutableCommand(executable)
  const proc = Bun.spawn(command, {
    cwd: options.cwd,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  })
  proc.stdin.write(JSON.stringify(request))
  proc.stdin.end()

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])

  if (exitCode !== 0) {
    return {
      ok: false,
      files: request.files.map((file) => ({ path: file.path, changed: false, warnings: [] })),
      warnings: ["swift_adapter_failed"],
      stderr: summarize(stderr),
    }
  }

  try {
    return parseAdapterOutput(stdout, request)
  } catch (err) {
    return {
      ok: false,
      files: request.files.map((file) => ({ path: file.path, changed: false, warnings: [] })),
      warnings: [`swift_adapter_invalid_json: ${err instanceof Error ? err.message : String(err)}`],
      stderr: summarize(stderr),
    }
  }
}

export async function applySwiftAdapterResult(result: SwiftAdapterResult): Promise<string[]> {
  if (!result.ok) return []

  const written: string[] = []
  for (const file of result.files) {
    if (!file.changed || file.content === undefined) continue
    await fs.writeFile(file.path, file.content, "utf8")
    written.push(file.path)
  }
  return written
}

function parseAdapterOutput(raw: string, request: SwiftAdapterRequest): SwiftAdapterResult {
  const parsed = JSON.parse(raw) as unknown
  if (!isRecord(parsed)) {
    throw new Error("top-level adapter output must be an object")
  }
  const files = Array.isArray(parsed.files) ? parsed.files.map(readFileResult) : request.files.map((file) => ({
    path: file.path,
    changed: false,
    warnings: ["adapter_output_missing_file_result"],
  }))

  return {
    ok: parsed.ok === undefined ? true : parsed.ok === true,
    files,
    warnings: readStringArray(parsed.warnings),
    stderr: typeof parsed.stderr === "string" ? summarize(parsed.stderr) : undefined,
  }
}

function readFileResult(value: unknown): SwiftAdapterFileResult {
  if (!isRecord(value)) {
    throw new Error("adapter file result must be an object")
  }
  if (typeof value.path !== "string" || value.path.trim().length === 0) {
    throw new Error("adapter file result path must be a non-empty string")
  }
  return {
    path: value.path,
    changed: value.changed === true,
    content: typeof value.content === "string" ? value.content : undefined,
    warnings: readStringArray(value.warnings),
  }
}

function readStringArray(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

async function executableExists(executable: string): Promise<boolean> {
  if (isPathLike(executable)) {
    try {
      await fs.access(executable, fs.constants.X_OK)
      return true
    } catch {
      return false
    }
  }

  const proc = Bun.spawn([process.platform === "win32" ? "where" : "which", executable], { stdout: "pipe", stderr: "pipe" })
  return (await proc.exited) === 0
}

function resolveExecutableCommand(executable: string): string[] {
  if (process.platform === "win32" && isPathLike(executable) && shouldRunWithBun(executable)) {
    return [process.execPath, executable]
  }
  return [executable]
}

function isPathLike(executable: string): boolean {
  return path.isAbsolute(executable) || executable.includes("/") || executable.includes("\\")
}

function shouldRunWithBun(executable: string): boolean {
  return [".js", ".mjs", ".cjs", ".ts"].includes(path.extname(executable).toLowerCase())
}

function adapterUnavailable(message: string): SwiftAdapterResult {
  return {
    ok: true,
    unavailable: true,
    files: [],
    warnings: [`adapter_unavailable: ${message}`],
  }
}

function summarize(value: string): string {
  return value.trim().slice(0, 1000)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
