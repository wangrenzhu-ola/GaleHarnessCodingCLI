import { describe, expect, test } from "bun:test"
import {
  createSourceFingerprint,
  createStructuralFingerprint,
  extractNormalizedStatements,
  normalizeMorphSource,
  summarizeControlFlow,
  tokenizeMorphSource,
} from "../src/morph/fingerprints"

describe("morph fingerprints", () => {
  test("normalizes whitespace, comments, literals, and import-only noise", () => {
    const first = extractNormalizedStatements(normalizeMorphSource(`
      import SwiftUI
      // Comment should not matter
      let Name = "Gale"
      print(Name)
    `))
    const second = extractNormalizedStatements(normalizeMorphSource(`
      import SwiftUI
      let name = "Other" ; print( name )
    `))

    expect(first).toEqual(["let name=str", "print(name)"])
    expect(second).toEqual(["let name=str", "print(name)"])
  })

  test("creates identical fingerprints for identical Swift code", () => {
    const source = `
      struct ProfileView {
        func title(_ name: String) -> String {
          if name.isEmpty { return "Untitled" }
          return name
        }
      }
    `

    const left = createSourceFingerprint("ProfileView.swift", source)
    const right = createSourceFingerprint("ProfileView.swift", source)

    expect(left.language).toBe("swift")
    expect(left.statements).toEqual(right.statements)
    expect(left.tokenNgrams).toEqual(right.tokenNgrams)
    expect(left.structuralHash).toBe(right.structuralHash)
    expect(left.controlFlow).toEqual(["if", "return:conditional", "return:direct"])
  })

  test("uses adapter structural nodes when available", () => {
    const warnings: string[] = []
    const fromAdapter = createStructuralFingerprint([], {
      ok: true,
      nodes: [
        { kind: "SourceFile", children: [{ kind: "StructDecl" }, { kind: "FunctionDecl" }] },
      ],
    }, warnings)
    const sameShape = createStructuralFingerprint([], {
      ok: true,
      nodes: [
        { kind: "sourcefile", children: [{ kind: "structdecl" }, { kind: "functiondecl" }] },
      ],
    })

    expect(fromAdapter.parts).toEqual(["sourcefile", "structdecl", "functiondecl"])
    expect(fromAdapter.hash).toBe(sameShape.hash)
    expect(warnings).toEqual([])
  })

  test("falls back to token structure and warns on invalid adapter output", () => {
    const warnings: string[] = []
    const tokens = tokenizeMorphSource(normalizeMorphSource("func run() { if ready { return } }"))

    const fingerprint = createStructuralFingerprint(tokens, { nodes: [] }, warnings)

    expect(fingerprint.parts).toContain("func")
    expect(fingerprint.parts).toContain("if")
    expect(fingerprint.hash).toMatch(/^[0-9a-f]{8}$/)
    expect(warnings).toEqual(["AST adapter output was invalid; using token-structure fallback."])
  })

  test("summarizes approximate control-flow shape", () => {
    const tokens = tokenizeMorphSource(normalizeMorphSource(`
      guard isReady else { return }
      for item in items {
        if item.enabled { continue }
      }
      switch state {
      case .done: return
      default: break
      }
    `))

    expect(summarizeControlFlow(tokens)).toEqual([
      "guard",
      "else",
      "return:conditional",
      "for",
      "if",
      "continue",
      "switch",
      "case",
      "return:conditional",
      "default",
      "break",
    ])
  })
})
