import type {
  MorphBlueprintDimension,
  MorphBlueprintSelection,
  MorphDimensionOption,
  MorphLanguage,
  MorphUsedFingerprint,
} from "./types"

export const BLUEPRINT_DIMENSIONS: MorphBlueprintDimension[] = [
  "state",
  "moduleBoundary",
  "fileSplit",
  "abstraction",
  "dependencyInjection",
  "errorPropagation",
  "asyncFlow",
]

export const BLUEPRINT_REGISTRY: MorphDimensionOption<MorphBlueprintDimension>[] = [
  option("state.mvvm-service", "state", ["state.mvvm-service", "state.observable-view-model", "risk.mvvm-like"], "View-model owned state", "Keep mutable UI state inside view models; views bind to derived read-only values."),
  option("state.reducer-local", "state", ["state.reducer-local", "state.value-state", "shape.reducer"], "Reducer-local value state", "Represent screen state as value snapshots updated through small reducer-style transitions."),
  option("state.coordinator-store", "state", ["state.coordinator-store", "state.flow-owned", "shape.coordinator"], "Coordinator flow store", "Let flow coordinators own cross-screen state and pass focused value slices into views/controllers."),

  option("boundary.service-protocol", "moduleBoundary", ["boundary.service-protocol", "boundary.mvvm-service", "risk.service-like"], "Service protocol boundary", "Place IO behind service protocols and inject protocol-typed dependencies at feature boundaries."),
  option("boundary.usecase-pipeline", "moduleBoundary", ["boundary.usecase-pipeline", "boundary.command-query", "shape.usecase"], "Use-case pipeline boundary", "Expose feature behavior through use-case objects that separate command and query paths."),
  option("boundary.feature-facade", "moduleBoundary", ["boundary.feature-facade", "boundary.facade-events", "shape.facade"], "Feature facade boundary", "Wrap feature internals behind a facade that emits domain events and accepts explicit intents."),

  option("files.by-layer", "fileSplit", ["files.by-layer", "files.layered", "risk.template-layer"], "Layered files", "Split files by layer: view/controller, state, service, model, and tests."),
  option("files.by-flow", "fileSplit", ["files.by-flow", "files.vertical-slice", "shape.flow-slice"], "Flow-sliced files", "Group files by user flow and keep supporting state, IO, and view code near that flow."),
  option("files.by-capability", "fileSplit", ["files.by-capability", "files.capability-first", "shape.capability"], "Capability files", "Split files by capability such as loading, validation, presentation mapping, and persistence."),

  option("abstraction.protocol-minimal", "abstraction", ["abstraction.protocol-minimal", "abstraction.protocols", "shape.protocol"], "Minimal protocols", "Extract protocols only at external seams and keep local collaborators concrete."),
  option("abstraction.generic-policy", "abstraction", ["abstraction.generic-policy", "abstraction.generics", "shape.policy"], "Generic policies", "Model variable behavior as small generic policy types rather than service inheritance."),
  option("abstraction.closure-ports", "abstraction", ["abstraction.closure-ports", "abstraction.functional-ports", "shape.closure"], "Closure ports", "Pass narrow closure ports for one-off effects instead of broad protocols."),

  option("di.initializer", "dependencyInjection", ["di.initializer", "di.explicit", "shape.constructor"], "Initializer injection", "Require dependencies through initializers and avoid hidden global lookup."),
  option("di.environment", "dependencyInjection", ["di.environment", "di.context", "shape.environment"], "Environment context", "Collect shared collaborators in an explicit environment object passed through feature setup."),
  option("di.factory", "dependencyInjection", ["di.factory", "di.builder", "shape.factory"], "Factory injection", "Use factories/builders to create child components and keep construction logic outside feature behavior."),

  option("errors.typed-result", "errorPropagation", ["errors.typed-result", "errors.result", "shape.result"], "Typed results", "Return typed Result values from recoverable operations and map errors at the feature edge."),
  option("errors.domain-enum", "errorPropagation", ["errors.domain-enum", "errors.exhaustive", "shape.domain-error"], "Domain error enum", "Convert external failures into feature-owned error enums before UI presentation."),
  option("errors.recovery-route", "errorPropagation", ["errors.recovery-route", "errors.route", "shape.recovery"], "Recovery routes", "Represent failures as recovery routes/actions that the coordinator or facade handles."),

  option("async.structured-task", "asyncFlow", ["async.structured-task", "async.await", "shape.structured-concurrency"], "Structured tasks", "Use structured async functions and keep task lifetime tied to the owning screen or flow."),
  option("async.event-stream", "asyncFlow", ["async.event-stream", "async.sequence", "shape.stream"], "Event streams", "Model long-lived updates as event streams consumed by state transitions."),
  option("async.callback-adapter", "asyncFlow", ["async.callback-adapter", "async.bridge", "shape.adapter"], "Callback adapters", "Isolate callback-based APIs in adapters and expose simple async or Result-returning calls upstream."),
]

export function selectBlueprint(input: {
  seed: string
  usedFingerprints?: MorphUsedFingerprint[]
  blacklistedTags?: string[]
  languages?: MorphLanguage[]
}): MorphBlueprintSelection {
  const usedTags = new Set((input.usedFingerprints ?? []).flatMap((fingerprint) => fingerprint.tags))
  const blacklistedTags = new Set(input.blacklistedTags ?? [])
  const dimensions = {} as Record<MorphBlueprintDimension, MorphDimensionOption<MorphBlueprintDimension>>

  for (const dimension of BLUEPRINT_DIMENSIONS) {
    const selected = selectDimensionOption({
      dimension,
      options: BLUEPRINT_REGISTRY.filter((item) => item.dimension === dimension),
      seed: input.seed,
      usedTags,
      blacklistedTags,
      languages: input.languages,
    })
    if (!selected) {
      throw new Error(`No Morph-X blueprint option remains for dimension ${dimension}; remove blacklisted tags or add more registry options.`)
    }
    dimensions[dimension] = selected
  }

  const tags = BLUEPRINT_DIMENSIONS.flatMap((dimension) => dimensions[dimension].tags)
  const constraints = BLUEPRINT_DIMENSIONS.map((dimension) => dimensions[dimension].constraint)
  return {
    fingerprint: `blueprint:${stableHash(["blueprint", input.seed, ...tags].join("|"))}`,
    tags,
    constraints,
    dimensions,
  }
}

export function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function hasBlacklistedTag(tags: string[], blacklistedTags: Set<string>): boolean {
  return tags.some((tag) => blacklistedTags.has(tag))
}

export function supportsLanguages(option: MorphDimensionOption<string>, languages: MorphLanguage[] | undefined): boolean {
  if (!option.supportedLanguages || option.supportedLanguages.length === 0) return true
  if (!languages || languages.length === 0) return true
  const concreteLanguages = languages.filter((language) => language !== "unknown")
  if (concreteLanguages.length === 0) return true
  return concreteLanguages.some((language) => option.supportedLanguages?.includes(language))
}

export function selectDimensionOption<TDimension extends string>(input: {
  dimension: TDimension
  options: MorphDimensionOption<TDimension>[]
  seed: string
  usedTags: Set<string>
  blacklistedTags: Set<string>
  languages?: MorphLanguage[]
}): MorphDimensionOption<TDimension> | undefined {
  const candidates = input.options.filter(
    (option) => !hasBlacklistedTag(option.tags, input.blacklistedTags) && supportsLanguages(option, input.languages),
  )
  if (candidates.length === 0) return undefined

  return candidates
    .map((option) => ({
      option,
      score: scoreOption(option, input.seed, input.dimension, input.usedTags),
    }))
    .sort((left, right) => right.score - left.score || left.option.id.localeCompare(right.option.id))[0]?.option
}

function scoreOption<TDimension extends string>(
  option: MorphDimensionOption<TDimension>,
  seed: string,
  dimension: TDimension,
  usedTags: Set<string>,
): number {
  const usedOverlap = option.tags.filter((tag) => usedTags.has(tag)).length
  const seedScore = Number.parseInt(stableHash([seed, dimension, option.id].join("|")), 36) / 0xffffffff
  return seedScore - usedOverlap * 10
}

function option(
  id: string,
  dimension: MorphBlueprintDimension,
  tags: string[],
  summary: string,
  constraint: string,
  supportedLanguages?: MorphLanguage[],
): MorphDimensionOption<MorphBlueprintDimension> {
  return { id, dimension, tags, summary, constraint, supportedLanguages }
}
