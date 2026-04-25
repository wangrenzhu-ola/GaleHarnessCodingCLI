import { readdirSync, readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

const repoRoot = process.cwd()
const pluginRoot = "plugins/galeharness-cli"
const agentRoot = `${pluginRoot}/agents`
const skillRoot = `${pluginRoot}/skills`

type ReferenceFailure = {
  file: string
  reference: string
  reason: string
  recommendation: string
}

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function collectMarkdownFiles(relativeDir: string): string[] {
  const results: string[] = []
  const absoluteDir = path.join(repoRoot, relativeDir)

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(absolutePath)
        continue
      }
      if (!entry.name.endsWith(".md")) continue
      results.push(path.relative(repoRoot, absolutePath))
    }
  }

  walk(absoluteDir)
  return results.sort()
}

function frontmatterName(relativePath: string): string | undefined {
  const raw = readRepoFile(relativePath)
  const lines = raw.split(/\r?\n/)
  if (lines[0]?.trim() !== "---") return undefined

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() === "---") return undefined
    const match = line.match(/^name:\s*(.+?)\s*$/)
    if (!match) continue
    return match[1].replace(/^["']|["']$/g, "")
  }

  return undefined
}

function buildAgentNames(): Set<string> {
  return new Set(
    collectMarkdownFiles(agentRoot).map((file) => {
      return frontmatterName(file) ?? path.basename(file, ".md")
    }),
  )
}

function buildSkillNames(): Set<string> {
  const names = new Set<string>()
  for (const skillFile of collectMarkdownFiles(skillRoot).filter((file) => file.endsWith("/SKILL.md"))) {
    const directoryName = path.basename(path.dirname(skillFile))
    names.add(directoryName)
    const name = frontmatterName(skillFile)
    if (name) names.add(name)
  }
  return names
}

function scanReferenceFailures(files: string[], agentNames: Set<string>, skillNames: Set<string>): ReferenceFailure[] {
  return scanReferenceEntries(
    files.map((file) => ({ file, content: readRepoFile(file) })),
    agentNames,
    skillNames,
  )
}

function scanReferenceEntries(
  entries: { file: string; content: string }[],
  agentNames: Set<string>,
  skillNames: Set<string>,
): ReferenceFailure[] {
  const failures: ReferenceFailure[] = []
  const referencePattern = /galeharness-cli:[A-Za-z0-9_-]+(?::[A-Za-z0-9_-]+)*/g

  for (const { file, content } of entries) {
    for (const match of content.matchAll(referencePattern)) {
      const reference = match[0]
      const before = content[match.index - 1]
      if (before === "/") continue

      const parts = reference.split(":")
      const pluginLocalName = reference.slice("galeharness-cli:".length)
      const localName = parts.at(-1) ?? ""

      if (skillNames.has(pluginLocalName)) continue

      if (parts.length === 2) {
        if (agentNames.has(localName) || skillNames.has(localName)) continue

        failures.push({
          file,
          reference,
          reason: `Unknown GaleHarnessCLI reference "${localName}". It is not a real agent or skill.`,
          recommendation: "Use galeharness-cli:<agent-name> where <agent-name> exists under plugins/galeharness-cli/agents/*.md, or use a real skill name.",
        })
        continue
      }

      if (parts.length === 3 && agentNames.has(localName)) {
        failures.push({
          file,
          reference,
          reason: "Three-segment agent references are not the current GaleHarnessCLI standard.",
          recommendation: `Use galeharness-cli:${localName}.`,
        })
        continue
      }

      failures.push({
        file,
        reference,
        reason: "Only two-segment GaleHarnessCLI agent references are supported in source docs.",
        recommendation: "Use galeharness-cli:<agent-name> for agents, or a real two-segment skill reference.",
      })
    }
  }

  return failures
}

describe("GaleHarnessCLI agent reference contract", () => {
  test("uses two-segment references for real plugin agents", () => {
    const agentNames = buildAgentNames()
    const skillNames = buildSkillNames()
    const files = [
      "AGENTS.md",
      `${pluginRoot}/AGENTS.md`,
      ...collectMarkdownFiles(skillRoot),
      ...collectMarkdownFiles(agentRoot),
    ]

    const failures = scanReferenceFailures(files, agentNames, skillNames)

    expect(
      failures,
      failures.map((failure) => [
        `${failure.file}: ${failure.reference}`,
        `reason: ${failure.reason}`,
        `fix: ${failure.recommendation}`,
      ].join("\n")).join("\n\n"),
    ).toEqual([])
  })

  test("rejects three-segment references to real agents", () => {
    const failures = scanReferenceEntries(
      [{ file: "inline.md", content: "Task galeharness-cli:research:learnings-researcher" }],
      new Set(["learnings-researcher"]),
      new Set(),
    )

    expect(failures).toEqual([
      {
        file: "inline.md",
        reference: "galeharness-cli:research:learnings-researcher",
        reason: "Three-segment agent references are not the current GaleHarnessCLI standard.",
        recommendation: "Use galeharness-cli:learnings-researcher.",
      },
    ])
  })

  test("rejects unknown two-segment references", () => {
    const failures = scanReferenceEntries(
      [{ file: "inline.md", content: "Task galeharness-cli:not-real-agent" }],
      new Set(["repo-research-analyst"]),
      new Set(["gh:plan"]),
    )

    expect(failures).toEqual([
      {
        file: "inline.md",
        reference: "galeharness-cli:not-real-agent",
        reason: 'Unknown GaleHarnessCLI reference "not-real-agent". It is not a real agent or skill.',
        recommendation: "Use galeharness-cli:<agent-name> where <agent-name> exists under plugins/galeharness-cli/agents/*.md, or use a real skill name.",
      },
    ])
  })

  test("does not treat slash commands or known skills as agent failures", () => {
    const failures = scanReferenceEntries(
      [{
        file: "inline.md",
        content: "/galeharness-cli:agent-native-architecture and galeharness-cli:gh:plan",
      }],
      new Set(["repo-research-analyst"]),
      new Set(["gh:plan", "agent-native-architecture"]),
    )

    expect(failures).toEqual([])
  })
})
