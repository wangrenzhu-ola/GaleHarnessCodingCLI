import path from "path"
import type { MorphAstAdapterOutput, MorphLanguage, MorphSourceFingerprint } from "./types"

const IMPORT_RE = /^(?:@testable\s+)?import\s+/i
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const CONTROL_FLOW_KEYWORDS = new Set([
  "if",
  "else",
  "guard",
  "for",
  "while",
  "repeat",
  "switch",
  "case",
  "default",
  "return",
  "throw",
  "break",
  "continue",
  "defer",
  "do",
  "catch",
])

const STRUCTURAL_KEYWORDS = new Set([
  "class",
  "struct",
  "enum",
  "protocol",
  "extension",
  "func",
  "init",
  "var",
  "let",
  ...CONTROL_FLOW_KEYWORDS,
])

export type FingerprintOptions = {
  tokenNgramSize?: number
  adapterOutput?: MorphAstAdapterOutput | unknown
}

export function createSourceFingerprint(
  filePath: string,
  source: string,
  options: FingerprintOptions = {},
): MorphSourceFingerprint {
  const language = detectMorphLanguage(filePath)
  const warnings: string[] = []
  const ngramSize = options.tokenNgramSize ?? 3
  const normalized = normalizeMorphSource(source)
  const statements = extractNormalizedStatements(normalized)
  const tokens = tokenizeMorphSource(normalized)
  const tokenNgrams = createTokenNgrams(tokens, ngramSize)
  const structural = createStructuralFingerprint(tokens, options.adapterOutput, warnings)

  return {
    path: filePath,
    language,
    statements,
    tokens,
    tokenNgrams,
    structuralHash: structural.hash,
    structuralParts: structural.parts,
    controlFlow: summarizeControlFlow(tokens),
    warnings,
  }
}

export function detectMorphLanguage(filePath: string): MorphLanguage {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".swift") return "swift"
  if (ext === ".m" || ext === ".mm" || ext === ".h") return "objc"
  return "unknown"
}

export function normalizeMorphSource(source: string): string {
  return replaceLiterals(stripComments(source))
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .toLowerCase()
    .trim()
}

export function extractNormalizedStatements(normalizedSource: string): string[] {
  if (normalizedSource.length === 0) return []

  const statements: string[] = []
  let current = ""
  let parenDepth = 0
  let bracketDepth = 0

  for (const char of normalizedSource) {
    if (char === "(") parenDepth += 1
    if (char === ")" && parenDepth > 0) parenDepth -= 1
    if (char === "[") bracketDepth += 1
    if (char === "]" && bracketDepth > 0) bracketDepth -= 1

    if ((char === "\n" || char === ";" || char === "{" || char === "}") && parenDepth === 0 && bracketDepth === 0) {
      pushStatement(statements, current)
      current = ""
      continue
    }
    current += char
  }
  pushStatement(statements, current)
  return statements
}

export function tokenizeMorphSource(normalizedSource: string): string[] {
  if (normalizedSource.length === 0) return []
  return normalizedSource.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|==|!=|<=|>=|&&|\|\||->|[{}()[\].,:;+\-*/%<>=!?@#]/g) ?? []
}

export function createTokenNgrams(tokens: string[], n = 3): string[] {
  const size = Math.max(1, Math.floor(n))
  if (tokens.length === 0) return []
  if (tokens.length < size) return [tokens.join(" ")]

  const grams: string[] = []
  for (let index = 0; index <= tokens.length - size; index += 1) {
    grams.push(tokens.slice(index, index + size).join(" "))
  }
  return grams
}

export function createStructuralFingerprint(
  tokens: string[],
  adapterOutput?: MorphAstAdapterOutput | unknown,
  warnings: string[] = [],
): { hash: string; parts: string[] } {
  const adapterParts = readAdapterStructuralParts(adapterOutput, warnings)
  const parts = adapterParts.length > 0 ? adapterParts : fallbackStructuralParts(tokens)
  return {
    hash: stableHash(parts.join("|")),
    parts,
  }
}

export function summarizeControlFlow(tokens: string[]): string[] {
  const summary: string[] = []
  const blockStack: string[] = []
  let pendingBlock: string | undefined
  let inlineConditional = false

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === "{") {
      blockStack.push(pendingBlock ?? "block")
      pendingBlock = undefined
      continue
    }
    if (token === "}") {
      blockStack.pop()
      pendingBlock = undefined
      inlineConditional = false
      continue
    }

    if (!CONTROL_FLOW_KEYWORDS.has(token)) continue
    if (token === "case" || token === "default") inlineConditional = true
    if (token === "if" || token === "guard" || token === "case") pendingBlock = token
    if (token === "else" && tokens[index + 1] !== "if") pendingBlock = "else"
    if (token === "return" || token === "throw") {
      summary.push(`${token}:${isInsideConditionalBlock(blockStack) || inlineConditional ? "conditional" : "direct"}`)
      continue
    }
    summary.push(token)
  }
  return summary
}

function stripComments(source: string): string {
  let result = ""
  let index = 0
  let blockDepth = 0
  let lineComment = false
  let stringQuote: string | undefined

  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === "\n") {
        lineComment = false
        result += char
      }
      index += 1
      continue
    }

    if (blockDepth > 0) {
      if (char === "/" && next === "*") {
        blockDepth += 1
        index += 2
        continue
      }
      if (char === "*" && next === "/") {
        blockDepth -= 1
        index += 2
        continue
      }
      if (char === "\n") result += "\n"
      index += 1
      continue
    }

    if (stringQuote !== undefined) {
      result += char
      if (char === "\\") {
        if (index + 1 < source.length) result += source[index + 1]
        index += 2
        continue
      }
      if (char === stringQuote) stringQuote = undefined
      index += 1
      continue
    }

    if (char === "/" && next === "/") {
      lineComment = true
      index += 2
      continue
    }
    if (char === "/" && next === "*") {
      blockDepth = 1
      index += 2
      continue
    }
    if (char === "\"" || char === "'") {
      stringQuote = char
      result += char
      index += 1
      continue
    }

    result += char
    index += 1
  }

  return result
}

function replaceLiterals(source: string): string {
  return source
    .replace(/"""[\s\S]*?"""/g, " str ")
    .replace(/"(?:\\.|[^"\\])*"/g, " str ")
    .replace(/'(?:\\.|[^'\\])*'/g, " str ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " num ")
}

function pushStatement(statements: string[], statement: string): void {
  const normalized = statement
    .replace(/\s+/g, " ")
    .replace(/\s*([{}()[\].,:;+\-*/%<>=!?@#])\s*/g, "$1")
    .trim()
  if (normalized.length === 0 || IMPORT_RE.test(normalized)) return
  statements.push(normalized)
}

function readAdapterStructuralParts(adapterOutput: MorphAstAdapterOutput | unknown, warnings: string[]): string[] {
  if (adapterOutput === undefined || adapterOutput === null) return []
  if (!isRecord(adapterOutput) || typeof adapterOutput.ok !== "boolean") {
    warnings.push("AST adapter output was invalid; using token-structure fallback.")
    return []
  }
  if (!adapterOutput.ok) {
    const suffix = typeof adapterOutput.error === "string" && adapterOutput.error.trim().length > 0
      ? ` ${adapterOutput.error.trim()}`
      : ""
    warnings.push(`AST adapter unavailable; using token-structure fallback.${suffix}`)
    for (const warning of readAdapterWarnings(adapterOutput)) warnings.push(warning)
    return []
  }

  for (const warning of readAdapterWarnings(adapterOutput)) warnings.push(warning)
  const nodes = Array.isArray(adapterOutput.nodes) ? adapterOutput.nodes : []
  const parts = nodes.flatMap((node) => flattenAdapterNode(node))
  if (parts.length === 0) warnings.push("AST adapter returned no structural nodes; using token-structure fallback.")
  return parts
}

function readAdapterWarnings(adapterOutput: Record<string, unknown>): string[] {
  if (!Array.isArray(adapterOutput.warnings)) return []
  return adapterOutput.warnings.filter((warning): warning is string => typeof warning === "string" && warning.trim().length > 0)
}

function flattenAdapterNode(node: unknown): string[] {
  if (!isRecord(node) || typeof node.kind !== "string" || node.kind.trim().length === 0) return []
  const kind = node.kind.trim().toLowerCase()
  const children = Array.isArray(node.children) ? node.children.flatMap((child) => flattenAdapterNode(child)) : []
  return [kind, ...children]
}

function fallbackStructuralParts(tokens: string[]): string[] {
  const parts: string[] = []
  for (const token of tokens) {
    if (STRUCTURAL_KEYWORDS.has(token) || "{}()[]".includes(token)) {
      parts.push(token)
    } else if (IDENTIFIER_RE.test(token)) {
      parts.push("id")
    }
  }
  return parts
}

function isInsideConditionalBlock(blockStack: string[]): boolean {
  return blockStack.some((block) => block === "if" || block === "guard" || block === "case" || block === "else")
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
