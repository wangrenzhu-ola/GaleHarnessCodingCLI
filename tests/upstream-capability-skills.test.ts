import { existsSync, readFileSync, readdirSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

const repoRoot = process.cwd()
const skillRoot = path.join(repoRoot, "plugins/galeharness-cli/skills")

function readSkill(relativePath: string): string {
  return readFileSync(path.join(skillRoot, relativePath), "utf8")
}

function collectMarkdownFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(skillRoot, relativeDir)
  const files: string[] = []

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(absolutePath)
        continue
      }
      if (entry.name.endsWith(".md")) {
        files.push(path.relative(skillRoot, absolutePath).split(path.sep).join("/"))
      }
    }
  }

  walk(absoluteDir)
  return files.sort()
}

describe("upstream PM and simplification capabilities", () => {
  const importedSkills = [
    { dir: "gh-strategy", frontmatterName: "gh:strategy" },
    { dir: "gh-product-pulse", frontmatterName: "gh:product-pulse" },
    { dir: "gh-simplify-code", frontmatterName: "gh:simplify-code" },
  ]

  test("imports each capability as a Gale-native gh:* skill", () => {
    for (const skill of importedSkills) {
      const skillPath = `${skill.dir}/SKILL.md`
      expect(existsSync(path.join(skillRoot, skillPath)), skillPath).toBe(true)
      expect(readSkill(skillPath)).toContain(`name: ${skill.frontmatterName}`)
    }
  })

  test("does not leave upstream ce-prefixed command references in imported skills", () => {
    const failures: string[] = []

    for (const skill of importedSkills) {
      for (const file of collectMarkdownFiles(skill.dir)) {
        const content = readSkill(file)
        const disallowed = content.match(/(^|[^A-Za-z])(?:ce-[A-Za-z0-9_-]+|\/ce-[A-Za-z0-9_-]+)/g)
        if (disallowed) failures.push(`${file}: ${disallowed.join(", ")}`)
      }
    }

    expect(failures).toEqual([])
  })

  test("adapts strategy and pulse to GaleHarness durable knowledge conventions", () => {
    expect(readSkill("gh-strategy/SKILL.md")).toContain("HKTMemory/gale-memory")
    expect(readSkill("gh-product-pulse/SKILL.md")).toContain("Gale-managed HKTMemory")
    expect(readSkill("gh-product-pulse/SKILL.md")).toContain(".compound-engineering/config.local.yaml")
    expect(readSkill("gh-simplify-code/SKILL.md")).toContain("Run tests scoped to the changed paths")
  })
})
