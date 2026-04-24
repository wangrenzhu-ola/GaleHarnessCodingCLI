import { load } from "js-yaml"
import path from "path"
import { pathExists, readText } from "../utils/files"
import type {
  MorphBaselineConfig,
  MorphConfig,
  MorphConfigLoadOptions,
  MorphConfigThresholds,
  MorphConfigWarning,
  MorphUsedFingerprint,
} from "./types"

export const MORPH_CONFIG_FILE = ".morph-config.yaml"

export const DEFAULT_MORPH_THRESHOLDS: MorphConfigThresholds = {
  statementJaccard: 0.15,
  tokenNgram: 0.2,
  structuralHash: 0.25,
  controlFlow: 0.3,
}

type RawMorphConfig = {
  seed?: unknown
  thresholds?: unknown
  baselines?: unknown
  baselinePaths?: unknown
  blacklistedPatternTags?: unknown
  blacklisted_pattern_tags?: unknown
  usedFingerprints?: unknown
  used_fingerprints?: unknown
}

export async function loadMorphConfig(
  projectRoot: string,
  options: MorphConfigLoadOptions = {},
): Promise<MorphConfig> {
  const resolvedRoot = path.resolve(projectRoot)
  const configPath = path.join(resolvedRoot, MORPH_CONFIG_FILE)
  const hasConfig = await pathExists(configPath)
  const rawConfig = hasConfig ? await parseConfigFile(configPath) : {}
  const source = hasConfig ? "file" : "default"

  const seed = normalizeSeed(options.seed ?? rawConfig.seed) ?? deriveDefaultSeed(resolvedRoot)
  const thresholds = mergeThresholds(DEFAULT_MORPH_THRESHOLDS, readThresholds(rawConfig.thresholds), options.thresholds)
  validateThresholds(thresholds)

  const baselinePaths = options.baselinePaths ?? readBaselinePaths(rawConfig)
  const baselines: MorphBaselineConfig = {
    paths: baselinePaths.map((baselinePath) => path.resolve(resolvedRoot, baselinePath)),
  }

  const warnings = buildWarnings(source, baselines.paths, options.seed ?? rawConfig.seed)

  return {
    projectRoot: resolvedRoot,
    configPath,
    source,
    seed,
    thresholds,
    baselines,
    blacklistedPatternTags: readStringArray(
      rawConfig.blacklistedPatternTags ?? rawConfig.blacklisted_pattern_tags,
      "blacklistedPatternTags",
    ),
    usedFingerprints: readUsedFingerprints(rawConfig.usedFingerprints ?? rawConfig.used_fingerprints),
    warnings,
  }
}

async function parseConfigFile(configPath: string): Promise<RawMorphConfig> {
  const raw = await readText(configPath)
  if (raw.trim().length === 0) return {}

  try {
    const parsed = load(raw)
    if (parsed === undefined || parsed === null) return {}
    if (!isRecord(parsed)) {
      throw new Error("top-level value must be a mapping")
    }
    return parsed as RawMorphConfig
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid ${MORPH_CONFIG_FILE}: ${message}`)
  }
}

function normalizeSeed(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "string" || typeof value === "number") return String(value)
  throw new Error("Invalid .morph-config.yaml field seed: expected string or number")
}

function deriveDefaultSeed(projectRoot: string): string {
  return `default:${path.basename(projectRoot) || "project"}`
}

function readThresholds(value: unknown): Partial<MorphConfigThresholds> {
  if (value === undefined || value === null) return {}
  if (!isRecord(value)) {
    throw new Error("Invalid .morph-config.yaml field thresholds: expected mapping")
  }

  const result: Partial<MorphConfigThresholds> = {}
  for (const key of Object.keys(DEFAULT_MORPH_THRESHOLDS) as Array<keyof MorphConfigThresholds>) {
    if (value[key] !== undefined) {
      result[key] = readNumber(value[key], `thresholds.${key}`)
    }
  }
  return result
}

function mergeThresholds(
  defaults: MorphConfigThresholds,
  fileThresholds: Partial<MorphConfigThresholds>,
  optionThresholds?: Partial<MorphConfigThresholds>,
): MorphConfigThresholds {
  return {
    ...defaults,
    ...fileThresholds,
    ...optionThresholds,
  }
}

export function validateThresholds(thresholds: MorphConfigThresholds): void {
  for (const [key, value] of Object.entries(thresholds)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`Invalid .morph-config.yaml field thresholds.${key}: expected number between 0 and 1`)
    }
  }
}

function readBaselinePaths(config: RawMorphConfig): string[] {
  const baselines = config.baselines
  if (isRecord(baselines) && baselines.paths !== undefined) {
    return readStringArray(baselines.paths, "baselines.paths")
  }
  return readStringArray(config.baselinePaths, "baselinePaths")
}

function readUsedFingerprints(value: unknown): MorphUsedFingerprint[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new Error("Invalid .morph-config.yaml field usedFingerprints: expected array")
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Invalid .morph-config.yaml field usedFingerprints[${index}]: expected mapping`)
    }
    const seed = readRequiredString(entry.seed, `usedFingerprints[${index}].seed`)
    const blueprint = readRequiredString(entry.blueprint, `usedFingerprints[${index}].blueprint`)
    const strategy = readRequiredString(entry.strategy, `usedFingerprints[${index}].strategy`)
    const tags = readStringArray(entry.tags, `usedFingerprints[${index}].tags`)
    const createdAt = entry.createdAt === undefined ? undefined : readRequiredString(entry.createdAt, `usedFingerprints[${index}].createdAt`)
    return { seed, blueprint, strategy, tags, createdAt }
  })
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new Error(`Invalid .morph-config.yaml field ${fieldName}: expected array`)
  }
  return value.map((item, index) => readRequiredString(item, `${fieldName}[${index}]`))
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid .morph-config.yaml field ${fieldName}: expected non-empty string`)
  }
  return value
}

function readNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number") {
    throw new Error(`Invalid .morph-config.yaml field ${fieldName}: expected number`)
  }
  return value
}

function buildWarnings(source: "file" | "default", baselinePaths: string[], seedInput: unknown): MorphConfigWarning[] {
  const warnings: MorphConfigWarning[] = []
  if (source === "default" || seedInput === undefined || seedInput === null || seedInput === "") {
    warnings.push({
      code: "default_seed",
      message: "No Morph-X seed configured; using deterministic default derived from the project path.",
    })
  }
  if (baselinePaths.length === 0) {
    warnings.push({
      code: "baseline_missing",
      message: "No similarity baseline paths configured; reports can include fingerprints but cannot compare against a baseline.",
    })
  }
  return warnings
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
