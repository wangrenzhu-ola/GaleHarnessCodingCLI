import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterEach, beforeEach, describe, expect, test, mock, spyOn } from "bun:test"

import {
  writeKnowledgeDocument,
  injectProjectFrontmatter,
} from "../src/knowledge/writer"
import * as homeModule from "../src/knowledge/home"

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTmpDir(prefix: string): string {
  const dir = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

// ---------------------------------------------------------------------------
// injectProjectFrontmatter
// ---------------------------------------------------------------------------

describe("injectProjectFrontmatter", () => {
  test("adds frontmatter when content has none", () => {
    const result = injectProjectFrontmatter("# Hello World\n\nSome content.", "my-project")
    expect(result).toContain("---")
    expect(result).toContain("project: my-project")
    expect(result).toContain("# Hello World")
    expect(result).toContain("Some content.")
  })

  test("adds project field to existing frontmatter", () => {
    const input = `---
title: My Doc
tags: alpha
---

# Body`
    const result = injectProjectFrontmatter(input, "my-project")
    expect(result).toContain("project: my-project")
    expect(result).toContain("title: My Doc")
    expect(result).toContain("tags: alpha")
    expect(result).toContain("# Body")
  })

  test("preserves existing project field", () => {
    const input = `---
project: existing-project
title: My Doc
---

Content`
    const result = injectProjectFrontmatter(input, "new-project")
    expect(result).toContain("project: existing-project")
    expect(result).not.toContain("project: new-project")
  })

  test("handles empty content", () => {
    const result = injectProjectFrontmatter("", "my-project")
    expect(result).toContain("project: my-project")
  })
})

// ---------------------------------------------------------------------------
// writeKnowledgeDocument
// ---------------------------------------------------------------------------

describe("writeKnowledgeDocument", () => {
  let knowledgeHome: string
  let projectDir: string

  beforeEach(() => {
    knowledgeHome = makeTmpDir("knowledge-home")
    projectDir = makeTmpDir("project-cwd")

    // Stub resolveKnowledgePath to use our temp knowledge home
    spyOn(homeModule, "resolveKnowledgePath").mockImplementation((opts) => {
      const projectName = opts.projectName || "test-project"
      const pDir = join(knowledgeHome, projectName)
      const docDir = join(pDir, opts.type)
      return { home: knowledgeHome, projectDir: pDir, projectName, docDir }
    })

    // Stub extractProjectName to return a stable value
    spyOn(homeModule, "extractProjectName").mockReturnValue("test-project")
  })

  afterEach(() => {
    mock.restore()
    // Clean up temp dirs
    try { rmSync(knowledgeHome, { recursive: true, force: true }) } catch {}
    try { rmSync(projectDir, { recursive: true, force: true }) } catch {}
  })

  test("writes to knowledge repo path", () => {
    const result = writeKnowledgeDocument({
      type: "brainstorms",
      filename: "test-doc.md",
      content: "# Test\n\nHello",
      projectName: "test-project",
      cwd: projectDir,
    })

    expect(result.usedFallback).toBe(false)
    expect(result.warning).toBeUndefined()
    expect(result.path).toBe(join(knowledgeHome, "test-project", "brainstorms", "test-doc.md"))
    expect(existsSync(result.path)).toBe(true)

    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("project: test-project")
    expect(written).toContain("# Test")
  })

  test("creates directories automatically", () => {
    const result = writeKnowledgeDocument({
      type: "plans",
      filename: "plan.md",
      content: "# Plan",
      projectName: "deep-project",
      cwd: projectDir,
    })

    expect(result.usedFallback).toBe(false)
    expect(existsSync(result.path)).toBe(true)
  })

  test("falls back to docs/ when knowledge repo is not writable", () => {
    // Make resolveKnowledgePath return an impossible path
    ;(homeModule.resolveKnowledgePath as ReturnType<typeof spyOn>).mockImplementation((opts: { type: string; projectName?: string }) => {
      const projectName = opts.projectName || "test-project"
      return {
        home: "/nonexistent/readonly/path",
        projectDir: `/nonexistent/readonly/path/${projectName}`,
        projectName,
        docDir: `/nonexistent/readonly/path/${projectName}/${opts.type}`,
      }
    })

    const result = writeKnowledgeDocument({
      type: "solutions",
      filename: "fallback.md",
      content: "# Fallback content",
      projectName: "test-project",
      cwd: projectDir,
    })

    expect(result.usedFallback).toBe(true)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain("falling back to")
    expect(result.path).toBe(join(projectDir, "docs", "solutions", "fallback.md"))
    expect(existsSync(result.path)).toBe(true)

    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("project: test-project")
  })

  test("projectName is passed through correctly", () => {
    const result = writeKnowledgeDocument({
      type: "brainstorms",
      filename: "named.md",
      content: "# Named",
      projectName: "custom-name",
      cwd: projectDir,
    })

    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("project: custom-name")
  })

  test("preserves existing frontmatter fields", () => {
    const content = `---
title: My Brainstorm
tags: draft
---

# Content here`

    const result = writeKnowledgeDocument({
      type: "brainstorms",
      filename: "with-fm.md",
      content,
      projectName: "test-project",
      cwd: projectDir,
    })

    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("title: My Brainstorm")
    expect(written).toContain("tags: draft")
    expect(written).toContain("project: test-project")
    expect(written).toContain("# Content here")
  })

  test("handles empty content", () => {
    const result = writeKnowledgeDocument({
      type: "plans",
      filename: "empty.md",
      content: "",
      projectName: "test-project",
      cwd: projectDir,
    })

    expect(result.usedFallback).toBe(false)
    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("project: test-project")
  })

  test("uses extractProjectName when projectName not provided", () => {
    ;(homeModule.extractProjectName as ReturnType<typeof spyOn>).mockReturnValue("auto-detected")

    const result = writeKnowledgeDocument({
      type: "brainstorms",
      filename: "auto.md",
      content: "# Auto",
      cwd: projectDir,
    })

    const written = readFileSync(result.path, "utf8")
    expect(written).toContain("project: auto-detected")
  })
})
