#!/usr/bin/env bun
/**
 * Windows Compatibility Scanner
 *
 * Scans the codebase for patterns that are known to break on Windows:
 * - Bash shebangs (#!/bin/bash)
 * - Bash-only commands (command -v, brew install, rm -rf, mkdir -p)
 * - Hard-coded Unix path separators in path.join()
 * - process.env.HOME instead of cross-platform home detection
 * - Python subprocess calls with bash/sh executables
 *
 * Run: bun run scripts/windows-compat-scan.ts
 */

import { readdir, readFile } from "fs/promises"
import path from "path"

export interface Finding {
  file: string
  line: number
  content: string
  rule: string
  severity: "error" | "warn" | "info"
  suggestion: string
}

export interface Rule {
  id: string
  pattern: RegExp
  severity: "error" | "warn" | "info"
  suggestion: string
}

export interface Config {
  rules?: Record<string, { severity?: "error" | "warn" | "info"; enabled?: boolean }>
  exclude?: string[]
}

const DEFAULT_EXCLUDE_DIRS = [
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "memory",
  "docs/async-progress",
]

const DEFAULT_RULES: Rule[] = [
  {
    id: "bash-shebang",
    pattern: /^#!\s*\/usr\/bin\/env\s+bash|^#!\s*\/bin\/bash/,
    severity: "error",
    suggestion: "Windows PowerShell cannot execute bash scripts. Consider adding a PowerShell equivalent (.ps1) or using Bun/Node.js for cross-platform scripting.",
  },
  {
    id: "command-v",
    pattern: /command\s+-v/,
    severity: "error",
    suggestion: "`command -v` is a bash builtin. On PowerShell use `Get-Command`. In Bun/Node.js use `which` from a cross-platform package.",
  },
  {
    id: "brew-install",
    pattern: /brew\s+install/,
    severity: "error",
    suggestion: "`brew` is macOS-only. On Windows use `winget install` or document manual installation steps.",
  },
  {
    id: "rm-rf",
    pattern: /rm\s+-rf?\s+/,
    severity: "warn",
    suggestion: "`rm -rf` does not exist on PowerShell. Use `Remove-Item -Recurse -Force` in .ps1, or `fs.rmSync(dir, { recursive: true })` in Bun/Node.js.",
  },
  {
    id: "mkdir-p",
    pattern: /mkdir\s+-p\s+/,
    severity: "warn",
    suggestion: "`mkdir -p` is a Unix idiom. In PowerShell use `New-Item -ItemType Directory -Force`. In Bun/Node.js use `fs.mkdirSync(dir, { recursive: true })`.",
  },
  {
    id: "hardcoded-slash",
    pattern: /path\.join\s*\([^)]*["']\/[^"']*["'][^)]*\)/,
    severity: "warn",
    suggestion: "Hard-coded `/` in path.join() defeats cross-platform path resolution. Use `path.join('dir', 'subdir')` or `path.sep`.",
  },
  {
    id: "process-env-home",
    pattern: /process\.env\.HOME/,
    severity: "warn",
    suggestion: "`process.env.HOME` is undefined on Windows. Use `os.homedir()` or a cross-platform home detection utility.",
  },
  {
    id: "colon-in-path",
    pattern: /path\.join\s*\([^)]*:[^)]*\)/,
    severity: "info",
    suggestion: "Colon in path.join() may produce illegal Windows filenames. Ensure names are sanitized with `sanitizePathName()` before joining.",
  },
  {
    id: "bash-array",
    pattern: /^\s*[a-zA-Z_][a-zA-Z0-9_]*=\s*\(/,
    severity: "warn",
    suggestion: "Bash arrays are not supported in PowerShell. Use PowerShell arrays `@()` or refactor to Bun/Node.js.",
  },
  {
    id: "source-bash",
    pattern: /\bsource\s+[^|&;]+/,
    severity: "warn",
    suggestion: "`source` is a bash command. In PowerShell use `. .\\file.ps1`. In Bun/Node.js use `import` or `require`.",
  },
  {
    id: "python-subprocess-bash",
    pattern: /subprocess\.(?:run|Popen|call|check_output|check_call)\s*\(\s*(?:\[\s*["']|["'])(?:bash|sh)\b/,
    severity: "error",
    suggestion: "Python subprocess with bash/sh is not portable to Windows. Use `subprocess.run([sys.executable, ...])` or a cross-platform approach.",
  },
]

export function buildRules(config?: Config): Rule[] {
  if (!config?.rules) return DEFAULT_RULES

  return DEFAULT_RULES.map((rule) => {
    const override = config.rules![rule.id]
    if (!override) return rule
    if (override.enabled === false) return null
    return {
      ...rule,
      severity: override.severity ?? rule.severity,
    }
  }).filter((r): r is Rule => r !== null)
}

function minimatchLike(filePath: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/{{GLOBSTAR}}/g, ".*")
  const re = new RegExp(`^${regexPattern}`)
  return re.test(filePath)
}

export function getExclusions(config?: Config): string[] {
  const extras = config?.exclude ?? []
  return [...DEFAULT_EXCLUDE_DIRS, ...extras]
}

export async function loadConfig(configPath?: string): Promise<Config | undefined> {
  const target = configPath ?? path.join(process.cwd(), "scripts", "windows-compat-scan-config.json")
  try {
    const raw = await readFile(target, "utf8")
    return JSON.parse(raw) as Config
  } catch {
    return undefined
  }
}

async function* walkFiles(dir: string, exclusions: string[]): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative(process.cwd(), fullPath)
    if (entry.isDirectory()) {
      if (exclusions.some((e) => minimatchLike(relPath, e) || minimatchLike(entry.name, e))) continue
      yield* walkFiles(fullPath, exclusions)
    } else if (entry.isFile()) {
      if (exclusions.some((e) => minimatchLike(relPath, e))) continue
      yield fullPath
    }
  }
}

export function scanContent(lines: string[], rules: Rule[], ext: string): Finding[] {
  const findings: Finding[] = []
  const isScript = ext === ".sh" || ext === ".bash" || ext === ".ps1"
  const isSource = ext === ".ts" || ext === ".js" || ext === ".tsx" || ext === ".jsx" || ext === ".md" || ext === ".py"

  if (!isScript && !isSource) return findings

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        const trimmed = line.trim()
        if (!isScript && trimmed.startsWith("//") && rule.id !== "bash-shebang") continue
        if (!isScript && trimmed.startsWith("/*") && rule.id !== "bash-shebang") continue
        if (!isScript && trimmed.startsWith("*") && rule.id !== "bash-shebang") continue
        if (ext === ".py" && trimmed.startsWith("#") && rule.id !== "bash-shebang") continue

        findings.push({
          file: "",
          line: i + 1,
          content: trimmed.slice(0, 80),
          rule: rule.id,
          severity: rule.severity,
          suggestion: rule.suggestion,
        })
      }
    }
  }

  return findings
}

export async function scanFile(filePath: string, rules?: Rule[]): Promise<Finding[]> {
  const activeRules = rules ?? buildRules(await loadConfig())
  const ext = path.extname(filePath)
  const content = await readFile(filePath, "utf8")
  const lines = content.split("\n")
  const findings = scanContent(lines, activeRules, ext)
  return findings.map((f) => ({
    ...f,
    file: path.relative(process.cwd(), filePath),
  }))
}

async function main() {
  console.log("🔍 Windows Compatibility Scan\n")

  const config = await loadConfig()
  const rules = buildRules(config)
  const exclusions = getExclusions(config)

  const findings: Finding[] = []
  const shFiles: string[] = []

  for await (const file of walkFiles(process.cwd(), exclusions)) {
    if (file.endsWith(".sh") || file.endsWith(".bash")) {
      shFiles.push(path.relative(process.cwd(), file))
    }
    const fileFindings = await scanFile(file, rules)
    findings.push(...fileFindings)
  }

  // Group by severity
  const errors = findings.filter((f) => f.severity === "error")
  const warnings = findings.filter((f) => f.severity === "warn")
  const infos = findings.filter((f) => f.severity === "info")

  // Generate report
  const reportLines: string[] = []
  reportLines.push("# Windows Compatibility Scan Report")
  reportLines.push("")
  reportLines.push(`Generated: ${new Date().toISOString()}`)
  reportLines.push("")
  reportLines.push("## Summary")
  reportLines.push("")
  reportLines.push(`| Severity | Count |`)
  reportLines.push(`|----------|-------|`)
  reportLines.push(`| 🔴 Error | ${errors.length} |`)
  reportLines.push(`| 🟡 Warn  | ${warnings.length} |`)
  reportLines.push(`| ℹ️ Info  | ${infos.length} |`)
  reportLines.push(`| **Total** | **${findings.length}** |`)
  reportLines.push("")
  reportLines.push(`**Bash scripts found:** ${shFiles.length}`)
  if (shFiles.length > 0) {
    reportLines.push("")
    for (const f of shFiles) {
      reportLines.push(`- \`${f}\``)
    }
  }
  reportLines.push("")

  if (errors.length > 0) {
    reportLines.push("## Errors")
    reportLines.push("")
    for (const f of errors) {
      reportLines.push(`### ${f.file}:${f.line}`)
      reportLines.push(`- **Rule:** \`${f.rule}\``)
      reportLines.push(`- **Line:** \`${f.content}\``)
      reportLines.push(`- **Suggestion:** ${f.suggestion}`)
      reportLines.push("")
    }
  }

  if (warnings.length > 0) {
    reportLines.push("## Warnings")
    reportLines.push("")
    for (const f of warnings) {
      reportLines.push(`### ${f.file}:${f.line}`)
      reportLines.push(`- **Rule:** \`${f.rule}\``)
      reportLines.push(`- **Line:** \`${f.content}\``)
      reportLines.push(`- **Suggestion:** ${f.suggestion}`)
      reportLines.push("")
    }
  }

  if (infos.length > 0) {
    reportLines.push("## Info")
    reportLines.push("")
    for (const f of infos) {
      reportLines.push(`### ${f.file}:${f.line}`)
      reportLines.push(`- **Rule:** \`${f.rule}\``)
      reportLines.push(`- **Line:** \`${f.content}\``)
      reportLines.push(`- **Suggestion:** ${f.suggestion}`)
      reportLines.push("")
    }
  }

  reportLines.push("---")
  reportLines.push("*Run this scan anytime with: `bun run scripts/windows-compat-scan.ts`*")

  const report = reportLines.join("\n")
  await Bun.write("docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md", report)

  console.log(report)
  console.log(`\n✅ Report written to docs/async-progress/WINDOWS_COMPAT_SCAN_REPORT.md`)
  console.log(`   Errors: ${errors.length}, Warnings: ${warnings.length}, Info: ${infos.length}`)
  console.log(`   Bash scripts: ${shFiles.length}`)
}

main().catch((err) => {
  console.error("Scan failed:", err)
  process.exit(1)
})
