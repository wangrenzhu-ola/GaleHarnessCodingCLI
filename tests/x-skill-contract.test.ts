import path from "path"
import { readFile } from "fs/promises"
import { describe, expect, test } from "bun:test"
import { parseFrontmatter } from "../src/utils/frontmatter"

const SKILL_ROOT = path.join(process.cwd(), "plugins", "galeharness-cli", "skills")

const X_SKILLS = [
  {
    dir: "gh-work-x",
    name: "gh:work-x",
    anchors: [
      "Phase 0: Input Triage",
      "Setup Environment",
      "Create Task List",
      "quality checks",
      "HKTMemory Session Search",
    ],
  },
  {
    dir: "gh-debug-x",
    name: "gh:debug-x",
    anchors: [
      "Phase 0: Triage",
      "Phase 1: Investigate",
      "Causal chain gate",
      "test-first",
      "Debug-X Summary",
    ],
  },
] as const

async function readSkill(dir: string): Promise<string> {
  return readFile(path.join(SKILL_ROOT, dir, "SKILL.md"), "utf8")
}

function hktPatchLine(content: string, patchName: string): number {
  const lines = content.split("\n")
  const index = lines.findIndex((line) => line.trim() === `<!-- HKT-PATCH:${patchName} -->`)
  return index === -1 ? -1 : index + 1
}

describe("Morph-X skill contract", () => {
  for (const skill of X_SKILLS) {
    test(`${skill.dir} has parseable frontmatter`, async () => {
      const content = await readSkill(skill.dir)
      const parsed = parseFrontmatter(content, `${skill.dir}/SKILL.md`)

      expect(parsed.data.name).toBe(skill.name)
      expect(parsed.data.description).toEqual(expect.any(String))
      expect(String(parsed.data.description)).toContain("Morph-X")
      expect(parsed.data["argument-hint"]).toEqual(expect.any(String))
      expect(parsed.body.length).toBeGreaterThan(100)
    })

    test(`${skill.dir} preserves base workflow anchors`, async () => {
      const content = await readSkill(skill.dir)

      for (const anchor of skill.anchors) {
        expect(content).toContain(anchor)
      }
    })

    test(`${skill.dir} documents Morph-X phases and compliance boundary`, async () => {
      const content = await readSkill(skill.dir)

      expect(content).toContain("Morph-X Blueprint Constraints")
      expect(content).toContain(".morph-config.yaml")
      expect(content).toContain("gale-harness morph --apply")
      expect(content).toContain("gale-harness audit --similarity")
      expect(content).toContain("strategy fingerprint")
      expect(content).toContain("threshold")
      expect(content).toContain("template-code repetition risk")
      expect(content).toContain("does not guarantee App Review success")
    })

    test(`${skill.dir} has HKTMemory retrieve, session search, store, and non-blocking fallbacks`, async () => {
      const content = await readSkill(skill.dir)

      expect(content).toContain("hkt-memory retrieve")
      expect(content).toContain("hkt-memory session-search")
      expect(content).toContain("hkt-memory store")
      expect(content).toMatch(/blueprint\/strategy fingerprints|blueprint constraints, strategy fingerprint/)
      expect(content).toMatch(/non-blocking|proceed silently|continue silently|skip silently/i)
    })

    test(`${skill.dir} retrieves before storing fingerprints`, async () => {
      const content = await readSkill(skill.dir)
      const retrieveLine = skill.dir === "gh-work-x" ? hktPatchLine(content, "phase-0.6") : hktPatchLine(content, "phase-0.4")
      const storeLine = hktPatchLine(content, "phase-4.5")

      expect(retrieveLine).toBeGreaterThan(0)
      expect(storeLine).toBeGreaterThan(0)
      expect(retrieveLine).toBeLessThan(storeLine)
    })

    test(`${skill.dir} is self-contained and avoids sibling or absolute skill references`, async () => {
      const content = await readSkill(skill.dir)

      expect(content).not.toMatch(/\.\.\//)
      expect(content).not.toMatch(/plugins\/galeharness-cli\/skills\/gh-(work|debug)/)
      expect(content).not.toMatch(/\/Users\/|\/home\/|\/tmp\/plugin\/skills/)
      expect(content).not.toMatch(/Skill:\s*gh:(work|debug)\b|skill:\s*gh-(work|debug)\b/i)
    })
  }
})
