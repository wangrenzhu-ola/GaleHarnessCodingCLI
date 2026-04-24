import { createSourceFingerprint, type FingerprintOptions } from "./fingerprints"
import type { MorphSourceFingerprint, MorphSimilarityMetric } from "./types"

export type MorphMetricOptions = {
  tokenNgramSize?: number
  sourceAdapterOutput?: FingerprintOptions["adapterOutput"]
  baselineAdapterOutput?: FingerprintOptions["adapterOutput"]
}

export type MorphMetricResult = {
  source: MorphSourceFingerprint
  baseline: MorphSourceFingerprint
  metrics: Record<MorphSimilarityMetric, number>
  warnings: string[]
}

export function compareMorphSources(
  sourcePath: string,
  sourceText: string,
  baselinePath: string,
  baselineText: string,
  options: MorphMetricOptions = {},
): MorphMetricResult {
  const source = createSourceFingerprint(sourcePath, sourceText, {
    tokenNgramSize: options.tokenNgramSize,
    adapterOutput: options.sourceAdapterOutput,
  })
  const baseline = createSourceFingerprint(baselinePath, baselineText, {
    tokenNgramSize: options.tokenNgramSize,
    adapterOutput: options.baselineAdapterOutput,
  })

  return {
    source,
    baseline,
    metrics: calculateSimilarityMetrics(source, baseline),
    warnings: [...source.warnings, ...baseline.warnings],
  }
}

export function calculateSimilarityMetrics(
  source: MorphSourceFingerprint,
  baseline: MorphSourceFingerprint,
): Record<MorphSimilarityMetric, number> {
  return {
    statement_jaccard: jaccardSimilarity(source.statements, baseline.statements),
    token_ngram: jaccardSimilarity(source.tokenNgrams, baseline.tokenNgrams),
    structural_hash: structuralSimilarity(source, baseline),
    control_flow: controlFlowSimilarity(source.controlFlow, baseline.controlFlow),
  }
}

export function jaccardSimilarity(left: string[], right: string[]): number {
  if (left.length === 0 && right.length === 0) return 1
  if (left.length === 0 || right.length === 0) return 0

  const leftSet = new Set(left)
  const rightSet = new Set(right)
  let intersection = 0
  for (const item of leftSet) {
    if (rightSet.has(item)) intersection += 1
  }
  const union = new Set([...leftSet, ...rightSet]).size
  return safeRatio(intersection, union)
}

export function multisetJaccardSimilarity(left: string[], right: string[]): number {
  if (left.length === 0 && right.length === 0) return 1
  if (left.length === 0 || right.length === 0) return 0

  const leftCounts = countValues(left)
  const rightCounts = countValues(right)
  const keys = new Set([...leftCounts.keys(), ...rightCounts.keys()])
  let intersection = 0
  let union = 0
  for (const key of keys) {
    intersection += Math.min(leftCounts.get(key) ?? 0, rightCounts.get(key) ?? 0)
    union += Math.max(leftCounts.get(key) ?? 0, rightCounts.get(key) ?? 0)
  }
  return safeRatio(intersection, union)
}

export function structuralSimilarity(source: MorphSourceFingerprint, baseline: MorphSourceFingerprint): number {
  if (source.structuralHash === baseline.structuralHash) return 1
  return multisetJaccardSimilarity(source.structuralParts, baseline.structuralParts)
}

export function controlFlowSimilarity(left: string[], right: string[]): number {
  return multisetJaccardSimilarity(left, right)
}

function countValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 1
  const result = numerator / denominator
  return Number.isFinite(result) ? result : 0
}
