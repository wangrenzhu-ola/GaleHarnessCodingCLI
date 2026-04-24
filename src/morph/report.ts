import type {
  MorphAstAdapterOutput,
  MorphConfigThresholds,
  MorphFileSimilarityReport,
  MorphReportStatus,
  MorphRiskReason,
  MorphSimilarityMetric,
  MorphSimilarityReport,
} from "./types"
import { compareMorphSources, type MorphMetricOptions } from "./metrics"

const METRICS: MorphSimilarityMetric[] = ["statement_jaccard", "token_ngram", "structural_hash", "control_flow"]

export type MorphReportFileInput = {
  path: string
  source: string
  baselinePath?: string
  baselineSource?: string
  sourceAdapterOutput?: MorphAstAdapterOutput | unknown
  baselineAdapterOutput?: MorphAstAdapterOutput | unknown
}

export type MorphReportOptions = {
  tokenNgramSize?: number
}

export function buildMorphFileSimilarityReport(
  input: MorphReportFileInput,
  thresholds: MorphConfigThresholds,
  options: MorphReportOptions = {},
): MorphFileSimilarityReport {
  if (input.baselineSource === undefined) {
    return {
      path: input.path,
      language: languageFromPath(input.path),
      metrics: {},
      highRisk: false,
      riskReasons: [],
      warnings: [`No baseline source available for ${input.path}; similarity metrics were skipped.`],
    }
  }

  const metricOptions: MorphMetricOptions = {
    tokenNgramSize: options.tokenNgramSize,
    sourceAdapterOutput: input.sourceAdapterOutput,
    baselineAdapterOutput: input.baselineAdapterOutput,
  }
  const comparison = compareMorphSources(input.path, input.source, input.baselinePath ?? input.path, input.baselineSource, metricOptions)
  const riskReasons = buildRiskReasons(comparison.metrics, thresholds)

  return {
    path: input.path,
    language: comparison.source.language,
    metrics: comparison.metrics,
    highRisk: riskReasons.length > 0,
    riskReasons,
    warnings: comparison.warnings,
  }
}

export function buildMorphSimilarityReport(
  files: MorphReportFileInput[],
  thresholds: MorphConfigThresholds,
  options: MorphReportOptions = {},
): MorphSimilarityReport {
  const fileReports = files.map((file) => buildMorphFileSimilarityReport(file, thresholds, options))
  const warnings = fileReports.flatMap((file) => file.warnings.map((warning) => `${file.path}: ${warning}`))
  const overall = averageMetrics(fileReports)
  const status = determineStatus(fileReports, warnings)

  return {
    status,
    threshold: thresholds,
    files: fileReports,
    overall,
    warnings,
  }
}

export function averageMetrics(files: MorphFileSimilarityReport[]): Partial<Record<MorphSimilarityMetric, number>> {
  const overall: Partial<Record<MorphSimilarityMetric, number>> = {}
  for (const metric of METRICS) {
    const values = files
      .map((file) => file.metrics[metric])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    if (values.length > 0) {
      overall[metric] = values.reduce((sum, value) => sum + value, 0) / values.length
    }
  }
  return overall
}

function buildRiskReasons(
  metrics: Record<MorphSimilarityMetric, number>,
  thresholds: MorphConfigThresholds,
): MorphRiskReason[] {
  const thresholdByMetric: Record<MorphSimilarityMetric, number> = {
    statement_jaccard: thresholds.statementJaccard,
    token_ngram: thresholds.tokenNgram,
    structural_hash: thresholds.structuralHash,
    control_flow: thresholds.controlFlow,
  }

  return METRICS.flatMap((metric) => {
    const score = metrics[metric]
    const threshold = thresholdByMetric[metric]
    if (!Number.isFinite(score) || score < threshold) return []
    return [{
      metric,
      score,
      threshold,
      reason: `${metric} similarity ${formatScore(score)} meets or exceeds threshold ${formatScore(threshold)}`,
    }]
  })
}

function determineStatus(files: MorphFileSimilarityReport[], warnings: string[]): MorphReportStatus {
  if (files.some((file) => file.highRisk)) return "blocked"
  if (warnings.length > 0) return "warning"
  return "passed"
}

function languageFromPath(filePath: string): "swift" | "objc" | "unknown" {
  const lower = filePath.toLowerCase()
  if (lower.endsWith(".swift")) return "swift"
  if (lower.endsWith(".m") || lower.endsWith(".mm") || lower.endsWith(".h")) return "objc"
  return "unknown"
}

function formatScore(score: number): string {
  return score.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}
