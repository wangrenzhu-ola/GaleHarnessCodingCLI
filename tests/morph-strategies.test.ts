import { describe, expect, test } from "bun:test"
import { BLUEPRINT_DIMENSIONS, BLUEPRINT_REGISTRY } from "../src/morph/blueprints"
import { selectMorphStrategy, STRATEGY_DIMENSIONS, STRATEGY_REGISTRY } from "../src/morph/strategies"
import type { MorphUsedFingerprint } from "../src/morph/types"

describe("Morph-X blueprint and strategy registries", () => {
  test("define at least three tags per planned dimension", () => {
    for (const dimension of BLUEPRINT_DIMENSIONS) {
      const options = BLUEPRINT_REGISTRY.filter((entry) => entry.dimension === dimension)
      expect(options.length).toBeGreaterThanOrEqual(3)
      expect(new Set(options.flatMap((entry) => entry.tags)).size).toBeGreaterThanOrEqual(3)
    }

    for (const dimension of STRATEGY_DIMENSIONS) {
      const options = STRATEGY_REGISTRY.filter((entry) => entry.dimension === dimension)
      expect(options.length).toBeGreaterThanOrEqual(3)
      expect(new Set(options.flatMap((entry) => entry.tags)).size).toBeGreaterThanOrEqual(3)
    }
  })
})

describe("selectMorphStrategy", () => {
  test("returns stable blueprint and strategy fingerprints for the same seed and history", () => {
    const input = {
      seed: "ios-demo-seed",
      usedFingerprints: [],
      blacklistedTags: [],
      languages: ["swift" as const],
    }

    const first = selectMorphStrategy(input)
    const second = selectMorphStrategy(input)

    expect(second.blueprint.fingerprint).toBe(first.blueprint.fingerprint)
    expect(second.strategy.fingerprint).toBe(first.strategy.fingerprint)
    expect(second.fingerprint).toEqual(first.fingerprint)
    expect(first.blueprint.constraints.length).toBe(BLUEPRINT_DIMENSIONS.length)
    expect(first.strategy.hooks.length).toBeGreaterThan(0)
  })

  test("different seeds vary the selected blueprint or strategy combination", () => {
    const first = selectMorphStrategy({ seed: "ios-demo-a", languages: ["swift"] })
    const second = selectMorphStrategy({ seed: "ios-demo-b", languages: ["swift"] })

    expect(`${second.blueprint.fingerprint}:${second.strategy.fingerprint}`).not.toBe(
      `${first.blueprint.fingerprint}:${first.strategy.fingerprint}`,
    )
  })

  test("history biases away from MVVM service-like blueprint tags", () => {
    const baseline = selectMorphStrategy({ seed: "seed-0", languages: ["swift"] })
    const usedFingerprints: MorphUsedFingerprint[] = [
      {
        seed: "prior",
        blueprint: "blueprint:prior",
        strategy: "strategy:prior",
        tags: ["state.mvvm-service", "boundary.service-protocol", "risk.mvvm-like", "risk.service-like"],
      },
    ]

    const selected = selectMorphStrategy({
      seed: "seed-0",
      usedFingerprints,
      languages: ["swift"],
    })

    expect(baseline.blueprint.tags).toContain("state.mvvm-service")
    expect(selected.blueprint.tags).not.toContain("state.mvvm-service")
    expect(selected.blueprint.tags).not.toContain("boundary.service-protocol")
  })

  test("respects blacklisted tags across blueprint and strategy choices", () => {
    const selected = selectMorphStrategy({
      seed: "blacklist-seed",
      blacklistedTags: ["state.mvvm-service", "control.guard-first", "imports.system-first"],
      languages: ["swift"],
    })

    expect(selected.fingerprint.tags).not.toContain("state.mvvm-service")
    expect(selected.fingerprint.tags).not.toContain("control.guard-first")
    expect(selected.fingerprint.tags).not.toContain("imports.system-first")
    expect(selected.warnings.some((warning) => warning.startsWith("blacklist_applied"))).toBe(true)
  })

  test("treats unknown-only language input as unclassified rather than exhausted", () => {
    const selected = selectMorphStrategy({
      seed: "unknown-language-seed",
      languages: ["unknown"],
    })

    expect(selected.fingerprint.strategy).toMatch(/^strategy:/)
    expect(selected.strategy.tags.length).toBeGreaterThanOrEqual(STRATEGY_DIMENSIONS.length)
  })

  test("warns but still returns a selection when history covers most strategy tags", () => {
    const usedFingerprints: MorphUsedFingerprint[] = [
      {
        seed: "prior",
        blueprint: "blueprint:prior",
        strategy: "strategy:prior",
        tags: [...BLUEPRINT_REGISTRY.flatMap((entry) => entry.tags), ...STRATEGY_REGISTRY.flatMap((entry) => entry.tags)],
      },
    ]

    const selected = selectMorphStrategy({
      seed: "crowded-space",
      usedFingerprints,
      languages: ["swift"],
    })

    expect(selected.fingerprint.strategy).toMatch(/^strategy:/)
    expect(selected.warnings.some((warning) => warning.startsWith("low_differentiation_space"))).toBe(true)
  })

  test("throws an explicit error only when no valid option remains", () => {
    const blacklist = BLUEPRINT_REGISTRY.filter((entry) => entry.dimension === "state").flatMap((entry) => entry.tags)

    expect(() =>
      selectMorphStrategy({
        seed: "exhausted-blueprint",
        blacklistedTags: blacklist,
        languages: ["swift"],
      }),
    ).toThrow("No Morph-X blueprint option remains for dimension state")
  })
})
