import { describe, expect, test } from "bun:test"
import { compareMorphSources } from "../src/morph/metrics"
import { buildMorphSimilarityReport } from "../src/morph/report"
import type { MorphConfigThresholds } from "../src/morph/types"

const thresholds: MorphConfigThresholds = {
  statementJaccard: 0.8,
  tokenNgram: 0.8,
  structuralHash: 0.8,
  controlFlow: 0.8,
}

describe("morph metrics", () => {
  test("scores identical Swift code as fully similar", () => {
    const source = `
      final class Counter {
        func next(_ value: Int) -> Int {
          if value > 0 { return value + 1 }
          return 0
        }
      }
    `

    const result = compareMorphSources("Counter.swift", source, "Counter.swift", source)

    expect(result.metrics.statement_jaccard).toBe(1)
    expect(result.metrics.token_ngram).toBe(1)
    expect(result.metrics.structural_hash).toBe(1)
    expect(result.metrics.control_flow).toBe(1)
  })

  test("keeps whitespace and comments from materially changing normalized similarity", () => {
    const first = `
      // Old note
      func label(_ name: String) -> String {
        return "Hi, \\(name)"
      }
    `
    const second = `
      func LABEL( _ NAME: String ) -> String
      {
        /* changed prose */
        return "Hello, \\(NAME)"
      }
    `

    const result = compareMorphSources("Label.swift", first, "Label.swift", second)

    expect(result.metrics.statement_jaccard).toBeGreaterThanOrEqual(0.5)
    expect(result.metrics.token_ngram).toBeGreaterThan(0.6)
  })

  test("recognizes similar control-flow shape even when token n-grams diverge", () => {
    const earlyReturn = `
      func access(_ user: User) -> Bool {
        guard user.isActive else { return false }
        if user.isAdmin { return true }
        return user.hasSeat
      }
    `
    const nested = `
      func allowed(_ account: Account) -> Decision {
        guard account.enabled else { return .deny }
        if account.role == .owner { return .allow }
        return account.subscription.available ? .allow : .deny
      }
    `

    const result = compareMorphSources("Access.swift", earlyReturn, "Access.swift", nested)

    expect(result.metrics.token_ngram).toBeLessThan(0.5)
    expect(result.metrics.control_flow).toBe(1)
  })

  test("returns finite scores for empty, comment-only, and import-only inputs", () => {
    const cases = ["", "// comment only\n", "import SwiftUI\n@testable import App\n"]

    for (const source of cases) {
      const result = compareMorphSources("Empty.swift", source, "Empty.swift", source)
      for (const score of Object.values(result.metrics)) {
        expect(Number.isFinite(score)).toBe(true)
      }
      expect(result.metrics.statement_jaccard).toBe(1)
      expect(result.metrics.token_ngram).toBe(1)
    }
  })

  test("report keeps adapter fallback warnings and still computes fallback metrics", () => {
    const report = buildMorphSimilarityReport(
      [{
        path: "Adapter.swift",
        source: "func run() { if ready { return } }",
        baselineSource: "func run() { if ready { return } }",
        sourceAdapterOutput: { ok: false, error: "invalid json" },
      }],
      thresholds,
    )

    expect(report.status).toBe("blocked")
    expect(report.files[0].metrics.structural_hash).toBe(1)
    expect(report.files[0].warnings.join("\n")).toContain("AST adapter unavailable")
    expect(report.warnings.join("\n")).toContain("invalid json")
  })

  test("multi-file report localizes the only high-risk file", () => {
    const report = buildMorphSimilarityReport(
      [
        {
          path: "Sources/ProfileView.swift",
          source: "struct ProfileView { func body() -> String { return title } }",
          baselineSource: "struct ProfileView { func body() -> String { return title } }",
        },
        {
          path: "Sources/SettingsView.swift",
          source: "struct SettingsView { func render() -> String { return footer } }",
          baselineSource: "enum Preferences { case enabled }",
        },
      ],
      thresholds,
    )

    const risky = report.files.filter((file) => file.highRisk)

    expect(report.status).toBe("blocked")
    expect(risky.map((file) => file.path)).toEqual(["Sources/ProfileView.swift"])
    expect(report.overall.statement_jaccard).toBeGreaterThan(0)
    expect(Number.isFinite(report.overall.statement_jaccard ?? Number.NaN)).toBe(true)
  })
})
