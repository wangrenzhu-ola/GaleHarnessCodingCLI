export type MorphConfigSource = "file" | "default"

export type MorphConfigThresholds = {
  statementJaccard: number
  tokenNgram: number
  structuralHash: number
  controlFlow: number
}

export type MorphBaselineConfig = {
  paths: string[]
}

export type MorphUsedFingerprint = {
  seed: string
  blueprint: string
  strategy: string
  tags: string[]
  createdAt?: string
}

export type MorphConfig = {
  projectRoot: string
  configPath: string
  source: MorphConfigSource
  seed: string
  thresholds: MorphConfigThresholds
  baselines: MorphBaselineConfig
  blacklistedPatternTags: string[]
  usedFingerprints: MorphUsedFingerprint[]
  warnings: MorphConfigWarning[]
}

export type MorphConfigWarningCode = "baseline_missing" | "default_seed"

export type MorphConfigWarning = {
  code: MorphConfigWarningCode
  message: string
}

export type MorphConfigLoadOptions = {
  seed?: string
  thresholds?: Partial<MorphConfigThresholds>
  baselinePaths?: string[]
}

export type MorphReportStatus = "passed" | "warning" | "blocked"

export type MorphSimilarityMetric = "statement_jaccard" | "token_ngram" | "structural_hash" | "control_flow"

export type MorphAstAdapterOutput =
  | {
      ok: true
      nodes: MorphAstAdapterNode[]
      warnings?: string[]
    }
  | {
      ok: false
      error?: string
      warnings?: string[]
    }

export type MorphAstAdapterNode = {
  kind: string
  children?: MorphAstAdapterNode[]
}

export type MorphSourceFingerprint = {
  path: string
  language: MorphLanguage
  statements: string[]
  tokens: string[]
  tokenNgrams: string[]
  structuralHash: string
  structuralParts: string[]
  controlFlow: string[]
  warnings: string[]
}

export type MorphRiskReason = {
  metric: MorphSimilarityMetric
  score: number
  threshold: number
  reason: string
}

export type MorphFileSimilarityReport = {
  path: string
  language: MorphLanguage
  metrics: Partial<Record<MorphSimilarityMetric, number>>
  highRisk: boolean
  riskReasons: MorphRiskReason[]
  warnings: string[]
}

export type MorphSimilarityReport = {
  status: MorphReportStatus
  threshold: MorphConfigThresholds
  files: MorphFileSimilarityReport[]
  overall: Partial<Record<MorphSimilarityMetric, number>>
  warnings: string[]
}

export type MorphStrategyFingerprint = {
  seed: string
  blueprint: string
  strategy: string
  tags: string[]
  warnings: string[]
}

export type MorphLanguage = "swift" | "objc" | "unknown"

export type MorphBlueprintDimension =
  | "state"
  | "moduleBoundary"
  | "fileSplit"
  | "abstraction"
  | "dependencyInjection"
  | "errorPropagation"
  | "asyncFlow"

export type MorphStrategyDimension =
  | "naming"
  | "controlFlow"
  | "layout"
  | "importOrder"
  | "extensionSplit"

export type MorphDimensionOption<TDimension extends string> = {
  id: string
  dimension: TDimension
  tags: string[]
  summary: string
  constraint: string
  supportedLanguages?: MorphLanguage[]
}

export type MorphBlueprintSelection = {
  fingerprint: string
  tags: string[]
  constraints: string[]
  dimensions: Record<MorphBlueprintDimension, MorphDimensionOption<MorphBlueprintDimension>>
}

export type MorphStrategySelection = {
  fingerprint: string
  tags: string[]
  hooks: string[]
  dimensions: Record<MorphStrategyDimension, MorphDimensionOption<MorphStrategyDimension>>
}

export type MorphStrategySelectorInput = {
  seed: string
  usedFingerprints?: MorphUsedFingerprint[]
  blacklistedTags?: string[]
  languages?: MorphLanguage[]
}

export type MorphSelectionResult = {
  seed: string
  blueprint: MorphBlueprintSelection
  strategy: MorphStrategySelection
  fingerprint: MorphStrategyFingerprint
  warnings: string[]
}
