---
title: "HKTMemory Compounding Test Review Fixes: Exact Matching, Boundary Tests, and Type Safety"
date: 2026-04-18
category: best-practices
module: "HKTMemory / workflow skill testing"
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - Writing contract tests that parse structured comments (e.g., HTML comments)
  - Adding boundary case coverage for helper functions in test suites
  - Reviewing TypeScript types for record mappings used in test assertions
tags: [hktmemory, compounding, testing, code-review, typescript, exact-match, boundary-tests]
---

# HKTMemory Compounding Test Review Fixes: Exact Matching, Boundary Tests, and Type Safety

## Context

During a code review of the `tests/hkt-memory-compounding.test.ts` file (which validates that all 6 core workflow skills follow the HKTMemory retrieve-before-store contract), three categories of issues were identified:

1. **Fuzzy matching risk**: `extractPhaseContext()` used `String.prototype.includes()` to locate patch markers, which could match unintended substrings (e.g., `phase-0.4` matching inside `phase-0.4b`).
2. **Missing boundary tests**: The helper functions (`parseHktPatches`, `isRetrievePatch`, `isStorePatch`, `extractPhaseContext`) had no direct unit tests for edge cases.
3. **Weak typing**: `LOOP_PATCHES` was typed as `Record<string, [string, string]>` instead of `Record<CompoundingSkill, readonly [string, string]>`, allowing invalid keys and mutable tuples.

## Guidance

### 1. Prefer exact matching over substring matching for structured markers

When parsing structured inline markers (HTML comments, annotations, tags), avoid `includes()` because it matches substrings and can produce false positives when names share prefixes.

Use exact string comparison after normalization (e.g., `trim()`):

```typescript
// Before (risky — "phase-0.4" matches "<!-- HKT-PATCH:phase-0.4b -->")
const idx = lines.findIndex((l) => l.includes(`HKT-PATCH:${patchName}`))

// After (safe — only matches the exact marker)
const idx = lines.findIndex((l) => l.trim() === `<!-- HKT-PATCH:${patchName} -->`)
```

### 2. Always add boundary unit tests for helper functions in test suites

Test files that only contain high-level integration/contract tests often leave helper functions uncovered. Add a dedicated `describe` block for boundary cases:

```typescript
describe("Helper Boundary Cases", () => {
  test("parseHktPatches returns empty array for empty content", () => {
    expect(parseHktPatches("")).toEqual([])
  })

  test("isRetrievePatch rejects phase-1.0 (not retrieve, not store)", () => {
    expect(isRetrievePatch("phase-1.0")).toBe(false)
  })
})
```

Key boundary cases to cover:
- Empty / no-match inputs
- Duplicate entries
- Malformed inputs (should be filtered, not crash)
- Numeric boundary transitions (e.g., `phase-0.10` vs `phase-1.0` vs `phase-2.0`)
- Distinguishing similar names (e.g., `phase-0.4` vs `phase-0.4b`)

### 3. Strengthen TypeScript types for lookup tables

When a record maps known keys to tuples, use the narrowest key type and `readonly` to prevent accidental mutation:

```typescript
// Before (permits any string key and mutable tuples)
const LOOP_PATCHES: Record<string, [string, string]> = { ... }

// After (only allows known skill names, tuples are immutable)
const LOOP_PATCHES: Record<CompoundingSkill, readonly [string, string]> = { ... }
```

## Why This Matters

- **Exact matching prevents silent test pollution**: A fuzzy match could extract the wrong context for a patch, causing tests to pass with the wrong data or fail intermittently as file contents evolve.
- **Boundary tests catch regressions in helper logic**: If someone later refactors `parseHktPatches` or changes regex patterns, boundary tests surface breakage immediately rather than through indirect contract-test failures.
- **Strong types prevent typo-driven bugs**: `Record<string, ...>` allows `LOOP_PATCHES["gh-brainstrom"]` (typo) to compile silently. Using `CompoundingSkill` as the key type makes typos a compile-time error.

## When to Apply

- Any test suite that parses structured inline markers (HTML comments, YAML frontmatter blocks, annotation tags)
- When helper functions inside test files reach >5 lines of logic or contain regex/nontrivial branching
- When a `Record<string, ...>` lookup table is used exclusively with a known finite key set

## Examples

### Exact matching with spacing tolerance

```typescript
function extractPhaseContext(content: string, patchName: string): string {
  const lines = content.split("\n")
  // Exact match after trim; rejects "phase-0.4b" when searching "phase-0.4"
  const idx = lines.findIndex((l) => l.trim() === `<!-- HKT-PATCH:${patchName} -->`)
  if (idx === -1) return ""
  return lines.slice(idx, idx + 60).join("\n")
}
```

### Boundary test for regex classification

```typescript
test("isStorePatch rejects non-store patterns", () => {
  expect(isStorePatch("phase-0.1")).toBe(false)  // retrieve range
  expect(isStorePatch("phase-1.0")).toBe(false) // gap between retrieve and store
  expect(isStorePatch("stage-0.5")).toBe(false) // retrieve range
})
```

## Related

- `tests/hkt-memory-compounding.test.ts` — the compounding contract test suite
- `docs/solutions/skill-design/discoverability-check-for-documented-solutions-2026-03-30.md` — knowledge compounding philosophy
