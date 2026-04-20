import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { readKnowledgeDocuments } from "../src/board/knowledge-reader.ts"

function createTempDir(): string {
  const dir = join(tmpdir(), `knowledge-reader-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe("readKnowledgeDocuments", () => {
  let tempHome: string

  beforeEach(() => {
    tempHome = createTempDir()
  })

  afterEach(() => {
    try {
      rmSync(tempHome, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }
  })

  test("returns empty array when knowledge home does not exist", () => {
    const result = readKnowledgeDocuments({ knowledgeHome: "/nonexistent/path/xyz" })
    expect(result).toEqual([])
  })

  test("returns empty array for empty knowledge home", () => {
    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toEqual([])
  })

  test("scans directory structure correctly", () => {
    // Setup: <home>/my-project/plans/2026-04-20-test-plan.md
    const projectDir = join(tempHome, "my-project", "plans")
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(join(projectDir, "2026-04-20-test-plan.md"), "---\ntitle: Test Plan\n---\n\n# Plan content\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].project).toBe("my-project")
    expect(result[0].type).toBe("plans")
    expect(result[0].title).toBe("Test Plan")
    expect(result[0].date).toBe("2026-04-20")
    expect(result[0].path).toBe("my-project/plans/2026-04-20-test-plan.md")
  })

  test("parses frontmatter title, date, project, topic", () => {
    const projectDir = join(tempHome, "proj-a", "solutions")
    mkdirSync(projectDir, { recursive: true })
    const content = [
      "---",
      "title: My Solution",
      "date: 2026-04-15",
      "project: custom-project",
      "topic: authentication",
      "---",
      "",
      "# Solution",
    ].join("\n")
    writeFileSync(join(projectDir, "some-doc.md"), content)

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("My Solution")
    expect(result[0].date).toBe("2026-04-15")
    expect(result[0].project).toBe("custom-project")
    expect(result[0].topic).toBe("authentication")
  })

  test("extracts date from filename prefix when frontmatter has no date", () => {
    const projectDir = join(tempHome, "proj-b", "brainstorms")
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(join(projectDir, "2026-03-10-ideas.md"), "# Just ideas\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe("2026-03-10")
    expect(result[0].title).toBe("ideas")
  })

  test("uses filename as title when no frontmatter title", () => {
    const projectDir = join(tempHome, "proj-c", "plans")
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(join(projectDir, "my-great-plan.md"), "# Content\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("my-great-plan")
  })

  test("filters by project", () => {
    // Create docs in two projects
    mkdirSync(join(tempHome, "proj-x", "plans"), { recursive: true })
    mkdirSync(join(tempHome, "proj-y", "plans"), { recursive: true })
    writeFileSync(join(tempHome, "proj-x", "plans", "doc1.md"), "# Doc 1\n")
    writeFileSync(join(tempHome, "proj-y", "plans", "doc2.md"), "# Doc 2\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome, project: "proj-x" })
    expect(result).toHaveLength(1)
    expect(result[0].project).toBe("proj-x")
  })

  test("filters by type", () => {
    mkdirSync(join(tempHome, "proj", "plans"), { recursive: true })
    mkdirSync(join(tempHome, "proj", "solutions"), { recursive: true })
    writeFileSync(join(tempHome, "proj", "plans", "plan.md"), "# Plan\n")
    writeFileSync(join(tempHome, "proj", "solutions", "sol.md"), "# Sol\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome, type: "solutions" })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("solutions")
  })

  test("results sorted by date descending", () => {
    mkdirSync(join(tempHome, "proj", "plans"), { recursive: true })
    writeFileSync(join(tempHome, "proj", "plans", "2026-01-01-old.md"), "# Old\n")
    writeFileSync(join(tempHome, "proj", "plans", "2026-04-20-new.md"), "# New\n")
    writeFileSync(join(tempHome, "proj", "plans", "2026-02-15-mid.md"), "# Mid\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(3)
    expect(result[0].date).toBe("2026-04-20")
    expect(result[1].date).toBe("2026-02-15")
    expect(result[2].date).toBe("2026-01-01")
  })

  test("ignores hidden files and directories", () => {
    mkdirSync(join(tempHome, ".git"), { recursive: true })
    mkdirSync(join(tempHome, "proj", "plans"), { recursive: true })
    writeFileSync(join(tempHome, "proj", "plans", ".hidden.md"), "# Hidden\n")
    writeFileSync(join(tempHome, "proj", "plans", "visible.md"), "# Visible\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("visible")
  })

  test("handles empty type directories gracefully", () => {
    mkdirSync(join(tempHome, "proj", "plans"), { recursive: true })
    mkdirSync(join(tempHome, "proj", "solutions"), { recursive: true })
    // plans directory is empty, solutions has a file
    writeFileSync(join(tempHome, "proj", "solutions", "doc.md"), "# Doc\n")

    const result = readKnowledgeDocuments({ knowledgeHome: tempHome })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("solutions")
  })
})
