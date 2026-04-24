import {
  selectBlueprint,
  selectDimensionOption,
  stableHash,
} from "./blueprints"
import type {
  MorphDimensionOption,
  MorphLanguage,
  MorphSelectionResult,
  MorphStrategyDimension,
  MorphStrategySelectorInput,
  MorphStrategySelection,
  MorphUsedFingerprint,
} from "./types"

export const STRATEGY_DIMENSIONS: MorphStrategyDimension[] = [
  "naming",
  "controlFlow",
  "layout",
  "importOrder",
  "extensionSplit",
]

export const STRATEGY_REGISTRY: MorphDimensionOption<MorphStrategyDimension>[] = [
  option("naming.role-suffix", "naming", ["naming.role-suffix", "naming.semantic", "hook.rename-private"], "Role suffix naming", "Prefer role suffixes for private collaborators and local helpers.", ["swift", "objc"]),
  option("naming.domain-phrase", "naming", ["naming.domain-phrase", "naming.intent", "hook.rename-private"], "Domain phrase naming", "Prefer domain-intent phrases for private helpers rather than generic service/manager names.", ["swift", "objc"]),
  option("naming.short-local", "naming", ["naming.short-local", "naming.local-context", "hook.rename-local"], "Short local naming", "Prefer concise local names where scope already carries context.", ["swift", "objc"]),

  option("controlFlow.guard-first", "controlFlow", ["control.guard-first", "control.early-return", "hook.rewrite-guards"], "Guard-first flow", "Use guard/early-return shape for validation and failure exits.", ["swift"]),
  option("controlFlow.result-switch", "controlFlow", ["control.result-switch", "control.exhaustive-switch", "hook.rewrite-switch"], "Result switch flow", "Use exhaustive switch handling around Result-like outcomes.", ["swift"]),
  option("controlFlow.predicate-branch", "controlFlow", ["control.predicate-branch", "control.named-conditions", "hook.rewrite-conditions"], "Named predicate flow", "Extract complex branch predicates into named local booleans before branching.", ["swift", "objc"]),

  option("layout.extensions-by-role", "layout", ["layout.extensions-by-role", "layout.role-grouping", "hook.reorder-decls"], "Role extensions", "Group declarations into extensions by role or protocol conformance.", ["swift"]),
  option("layout.lifecycle-first", "layout", ["layout.lifecycle-first", "layout.entrypoints-first", "hook.reorder-decls"], "Lifecycle first", "Order lifecycle/entrypoint methods before private helpers.", ["swift", "objc"]),
  option("layout.helpers-near-use", "layout", ["layout.helpers-near-use", "layout.locality", "hook.reorder-decls"], "Helpers near use", "Place private helpers near their primary call sites when safe.", ["swift", "objc"]),

  option("imports.system-first", "importOrder", ["imports.system-first", "imports.sorted-groups", "hook.reorder-imports"], "System imports first", "Group system imports before third-party and local imports.", ["swift", "objc"]),
  option("imports.local-first", "importOrder", ["imports.local-first", "imports.boundary-first", "hook.reorder-imports"], "Local imports first", "Group local module imports before framework imports when the language permits.", ["objc"]),
  option("imports.minimal-visible", "importOrder", ["imports.minimal-visible", "imports.lazy", "hook.trim-imports"], "Minimal visible imports", "Keep only directly used imports visible in each file and move optional imports downward when safe.", ["swift", "objc"]),

  option("extensionSplit.protocol-conformance", "extensionSplit", ["extension.protocol-conformance", "extension.protocols", "hook.split-extensions"], "Protocol conformance split", "Move protocol conformances into dedicated extensions.", ["swift"]),
  option("extensionSplit.private-behavior", "extensionSplit", ["extension.private-behavior", "extension.private-api", "hook.split-extensions"], "Private behavior split", "Group private behavior in a separate private extension.", ["swift"]),
  option("extensionSplit.none-compact", "extensionSplit", ["extension.none-compact", "extension.compact", "hook.keep-compact"], "Compact declarations", "Keep small declarations compact when extension splitting would add noise.", ["swift", "objc"]),
]

export function selectMorphStrategy(input: MorphStrategySelectorInput): MorphSelectionResult {
  const languages = normalizeLanguages(input.languages)
  const usedFingerprints = input.usedFingerprints ?? []
  const blacklistedTags = input.blacklistedTags ?? []
  const blueprint = selectBlueprint({
    seed: input.seed,
    usedFingerprints,
    blacklistedTags,
    languages,
  })
  const strategy = selectStrategy({
    seed: input.seed,
    usedFingerprints,
    blacklistedTags,
    languages,
  })
  const warnings = buildWarnings(blueprint.tags, strategy.tags, usedFingerprints, blacklistedTags)
  const tags = [...blueprint.tags, ...strategy.tags]

  return {
    seed: input.seed,
    blueprint,
    strategy,
    fingerprint: {
      seed: input.seed,
      blueprint: blueprint.fingerprint,
      strategy: strategy.fingerprint,
      tags,
      warnings,
    },
    warnings,
  }
}

export function selectStrategy(input: {
  seed: string
  usedFingerprints?: MorphUsedFingerprint[]
  blacklistedTags?: string[]
  languages?: MorphLanguage[]
}): MorphStrategySelection {
  const usedTags = new Set((input.usedFingerprints ?? []).flatMap((fingerprint) => fingerprint.tags))
  const blacklistedTags = new Set(input.blacklistedTags ?? [])
  const dimensions = {} as Record<MorphStrategyDimension, MorphDimensionOption<MorphStrategyDimension>>

  for (const dimension of STRATEGY_DIMENSIONS) {
    const selected = selectDimensionOption({
      dimension,
      options: STRATEGY_REGISTRY.filter((item) => item.dimension === dimension),
      seed: input.seed,
      usedTags,
      blacklistedTags,
      languages: input.languages,
    })
    if (!selected) {
      throw new Error(`No Morph-X strategy option remains for dimension ${dimension}; remove blacklisted tags or add more registry options.`)
    }
    dimensions[dimension] = selected
  }

  const tags = STRATEGY_DIMENSIONS.flatMap((dimension) => dimensions[dimension].tags)
  const hooks = Array.from(new Set(tags.filter((tag) => tag.startsWith("hook.")))).sort()

  return {
    fingerprint: `strategy:${stableHash(["strategy", input.seed, ...tags].join("|"))}`,
    tags,
    hooks,
    dimensions,
  }
}

function buildWarnings(
  selectedBlueprintTags: string[],
  selectedStrategyTags: string[],
  usedFingerprints: MorphUsedFingerprint[],
  blacklistedTags: string[],
): string[] {
  const warnings: string[] = []
  const usedTags = new Set(usedFingerprints.flatMap((fingerprint) => fingerprint.tags))
  const selectedTags = [...selectedBlueprintTags, ...selectedStrategyTags]
  const overlap = selectedTags.filter((tag) => usedTags.has(tag))
  if (overlap.length > 0) {
    warnings.push(`low_differentiation_space: selected ${overlap.length} tags already present in history after filtering unavailable options.`)
  }
  if (blacklistedTags.length > 0) {
    warnings.push(`blacklist_applied: excluded ${blacklistedTags.length} blacklisted Morph-X tags.`)
  }
  return warnings
}

function normalizeLanguages(languages: MorphLanguage[] | undefined): MorphLanguage[] {
  if (!languages || languages.length === 0) return ["swift"]
  return Array.from(new Set(languages))
}

function option(
  id: string,
  dimension: MorphStrategyDimension,
  tags: string[],
  summary: string,
  constraint: string,
  supportedLanguages?: MorphLanguage[],
): MorphDimensionOption<MorphStrategyDimension> {
  return { id, dimension, tags, summary, constraint, supportedLanguages }
}
