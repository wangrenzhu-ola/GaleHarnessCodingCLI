import { promises as fs } from "fs"
import path from "path"
import { pathExists, walkFiles } from "../utils/files"
import { detectMorphLanguage } from "./fingerprints"
import type { MorphLanguage } from "./types"

export type MorphSourceFile = {
  path: string
  relativePath: string
  language: MorphLanguage
  content: string
}

export type MorphBaselineMatch = {
  source: MorphSourceFile
  baselinePath?: string
  baselineSource?: string
}

export type CollectMorphSourceOptions = {
  excludePaths?: string[]
}

const SOURCE_EXTENSIONS = new Set([".swift", ".m", ".mm", ".h"])

export async function collectMorphSourceFiles(
  targetPath: string,
  options: CollectMorphSourceOptions = {},
): Promise<MorphSourceFile[]> {
  const resolvedTarget = path.resolve(targetPath)
  if (!(await pathExists(resolvedTarget))) {
    throw new Error(`Target path does not exist: ${resolvedTarget}`)
  }

  const stat = await fs.stat(resolvedTarget)
  const root = stat.isDirectory() ? resolvedTarget : path.dirname(resolvedTarget)
  const candidates = stat.isDirectory() ? await walkFiles(resolvedTarget) : [resolvedTarget]
  const excludes = options.excludePaths?.map((excludePath) => path.resolve(excludePath)) ?? []
  const files: MorphSourceFile[] = []

  for (const candidate of candidates) {
    if (isExcluded(candidate, excludes)) continue
    if (!SOURCE_EXTENSIONS.has(path.extname(candidate).toLowerCase())) continue
    files.push({
      path: candidate,
      relativePath: path.relative(root, candidate),
      language: detectMorphLanguage(candidate),
      content: await fs.readFile(candidate, "utf8"),
    })
  }

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

export async function matchBaselineFiles(
  sources: MorphSourceFile[],
  baselinePaths: string[],
): Promise<MorphBaselineMatch[]> {
  if (baselinePaths.length === 0) {
    return sources.map((source) => ({ source }))
  }

  const baselineFiles = await collectBaselineFiles(baselinePaths)
  return sources.map((source) => {
    const exact = baselineFiles.find((baseline) => baseline.relativePath === source.relativePath)
    const basename = exact ?? baselineFiles.find((baseline) => path.basename(baseline.path) === path.basename(source.path))
    const language = basename ?? baselineFiles.find((baseline) => baseline.language === source.language)
    const fallback = language ?? baselineFiles[0]
    if (!fallback) return { source }
    return {
      source,
      baselinePath: fallback.path,
      baselineSource: fallback.content,
    }
  })
}

async function collectBaselineFiles(baselinePaths: string[]): Promise<MorphSourceFile[]> {
  const allFiles: MorphSourceFile[] = []
  for (const baselinePath of baselinePaths) {
    if (!(await pathExists(baselinePath))) continue
    allFiles.push(...await collectMorphSourceFiles(baselinePath))
  }
  return allFiles
}

function isExcluded(candidate: string, excludePaths: string[]): boolean {
  const resolvedCandidate = path.resolve(candidate)
  return excludePaths.some((excludePath) => {
    const relative = path.relative(excludePath, resolvedCandidate)
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
  })
}
