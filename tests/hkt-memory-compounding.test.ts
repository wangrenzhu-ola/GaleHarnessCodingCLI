import path from "path"
import { describe, expect, test } from "bun:test"
import { readFile } from "fs/promises"

/**
 * Tests for HKTMemory compounding (记忆复利) in workflow skills.
 *
 * Each workflow skill must:
 *   1. READ  from HKTMemory before acting  (retrieve phase)
 *   2. WRITE to HKTMemory after completing  (store phase)
 *
 * This creates the compounding loop:
 *   Brainstorm -> Plan -> Work -> Review -> Compound
 *   where each step reads past knowledge and writes new knowledge
 *   for the next iteration to build upon.
 *
 * HKT-PATCH naming convention:
 *   - Retrieve patches: phase-0.4, phase-0.5, phase-0.6, phase-0.7, stage-0.5
 *   - Store patches:     phase-2.3, phase-3.3, phase-4.5, phase-5.4b, phase-2.5, stage-6.5
 *   - Task events:      gale-task-start, gale-task-end, gale-task-memory
 */

const PLUGIN_ROOT = path.join(process.cwd(), "plugins", "galeharness-cli", "skills")

// All skills that participate in the compounding loop
const COMPOUNDING_SKILLS = [
  "gh-brainstorm",
  "gh-plan",
  "gh-work",
  "gh-review",
  "gh-compound",
  "gh-ideate",
] as const

type CompoundingSkill = (typeof COMPOUNDING_SKILLS)[number]

interface HktPatch {
  name: string
  line: number
}

function parseHktPatches(content: string): HktPatch[] {
  const patches: HktPatch[] = []
  const lines = content.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/<!--\s*HKT-PATCH:(\S+)\s*-->/)
    if (match) {
      patches.push({ name: match[1], line: i + 1 })
    }
  }
  return patches
}

// Retrieve patches: phase-0.X or stage-0.X
const RETRIEVE_PATTERNS = [/^phase-0\.\d+$/, /^stage-0\.\d+$/]
// Store patches: phase-X.X or phase-X.Xb (where X >= 2) or stage-X.X
// Covers 1-digit (phase-2.x) and 2-digit (phase-10.x, stage-11.x) phase numbers
const STORE_PATTERNS = [/^phase-1[0-9]\.\d+b?$/, /^phase-[2-9]\.\d+b?$/, /^stage-1[0-9]\.\d+b?$/, /^stage-[2-9]\.\d+b?$/]

function isRetrievePatch(name: string): boolean {
  return RETRIEVE_PATTERNS.some((p) => p.test(name))
}

function isStorePatch(name: string): boolean {
  return STORE_PATTERNS.some((p) => p.test(name))
}

function extractPhaseContext(content: string, patchName: string): string {
  const lines = content.split("\n")
  const idx = lines.findIndex((l) => l.includes(`HKT-PATCH:${patchName}`))
  if (idx === -1) return ""
  return lines.slice(idx, idx + 60).join("\n")
}

function extractBashBlock(content: string, subcommand: "retrieve" | "store"): string | null {
  // Closing ``` may be indented (e.g. "    ```") so we use \s* in the trailing part
  const pattern =
    subcommand === "retrieve"
      ? /```bash\s*\n([\s\S]*?hkt_memory_v5\.py retrieve[\s\S]*?)\n\s*```/
      : /```bash\s*\n([\s\S]*?hkt_memory_v5\.py store[\s\S]*?)\n\s*```/
  const match = content.match(pattern)
  return match ? match[1].trim() : null
}

// Map skill -> [retrieve patch name, store patch name]
const LOOP_PATCHES: Record<string, [string, string]> = {
  "gh-brainstorm": ["phase-0.4", "phase-3.3"],
  "gh-plan": ["phase-0.7", "phase-5.4b"],
  "gh-work": ["phase-0.6", "phase-4.5"],
  "gh-review": ["stage-0.5", "stage-6.5"],
  "gh-compound": ["phase-0.4", "phase-2.3"],
  "gh-ideate": ["phase-0.5", "phase-2.5"],
}

describe("HKTMemory Compounding — Core Contracts", () => {
  for (const skill of COMPOUNDING_SKILLS) {
    const skillPath = path.join(PLUGIN_ROOT, skill, "SKILL.md")

    test(`${skill}/SKILL.md exists and is non-empty`, async () => {
      const content = await readFile(skillPath, "utf8")
      expect(content.length).toBeGreaterThan(0)
    })

    test(`${skill} has exactly one retrieve phase`, async () => {
      const content = await readFile(skillPath, "utf8")
      const patches = parseHktPatches(content)
      const retrievePatches = patches.filter((p) => isRetrievePatch(p.name))

      expect(
        retrievePatches.length,
        `Expected 1 retrieve patch, found ${retrievePatches.length}: ${retrievePatches.map((p) => p.name).join(", ")}`,
      ).toBe(1)
    })

    test(`${skill} has exactly one store phase`, async () => {
      const content = await readFile(skillPath, "utf8")
      const patches = parseHktPatches(content)
      const storePatches = patches.filter((p) => isStorePatch(p.name))

      expect(
        storePatches.length,
        `Expected 1 store patch, found ${storePatches.length}: ${storePatches.map((p) => p.name).join(", ")}`,
      ).toBe(1)
    })

    test(`${skill} retrieve phase contains a valid hkt_memory_v5.py retrieve command`, async () => {
      const content = await readFile(skillPath, "utf8")
      const cmd = extractBashBlock(content, "retrieve")

      expect(cmd, `${skill} should have a hkt_memory_v5.py retrieve bash block`).not.toBeNull()
      expect(cmd).toContain("--query")
      expect(cmd).toContain("--limit")
      expect(cmd).toContain("--layer")
    })

    test(`${skill} store phase contains a valid hkt_memory_v5.py store command`, async () => {
      const content = await readFile(skillPath, "utf8")
      const cmd = extractBashBlock(content, "store")

      expect(cmd, `${skill} should have a hkt_memory_v5.py store bash block`).not.toBeNull()
      expect(cmd).toContain("--content")
      expect(cmd).toContain("--title")
      expect(cmd).toContain("--topic")
      expect(cmd).toContain("--layer")
    })
  }
})

describe("HKTMemory Compounding — Retrieve Before Store Ordering", () => {
  for (const skill of COMPOUNDING_SKILLS) {
    test(`${skill} calls retrieve BEFORE store (correct compounding order)`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
      const patches = parseHktPatches(content)

      const retrieve = patches.find((p) => isRetrievePatch(p.name))
      const store = patches.find((p) => isStorePatch(p.name))

      expect(retrieve, `${skill}: retrieve patch not found`).toBeDefined()
      expect(store, `${skill}: store patch not found`).toBeDefined()
      expect(
        retrieve!.line,
        `${skill}: retrieve (line ${retrieve!.line}) should come BEFORE store (line ${store!.line})`,
      ).toBeLessThan(store!.line)
    })
  }
})

describe("HKTMemory Compounding — Skill-Specific Contracts", () => {
  describe("gh:brainstorm", () => {
    test("Phase 0.4 retrieve context informs Phase 1.1", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-brainstorm", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.4")
      expect(ctx).toContain("Phase 1.1")
    })

    test("Phase 3.3 store reads back the written file before storing", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-brainstorm", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-3.3")
      expect(ctx).toContain("Read back the full content")
      expect(ctx).toContain("--content")
    })

    test("store command uses frontmatter title and topic", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-brainstorm", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-3.3")
      expect(ctx).toContain("--title")
      expect(ctx).toContain("--topic")
    })
  })

  describe("gh:plan", () => {
    test("Phase 0.7 retrieve searches for similar plans", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-plan", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.7")
      expect(ctx.toLowerCase()).toContain("historical")
    })

    test("Phase 5.4b store uses --content and --title", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-plan", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-5.4b")
      expect(ctx).toContain("--content")
      expect(ctx).toContain("--title")
    })
  })

  describe("gh:work", () => {
    test("Phase 0.6 retrieve searches for implementation patterns", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-work", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.6")
      expect(ctx.toLowerCase()).toContain("context")
    })

    test("Phase 4.5 store uses --content and --title", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-work", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-4.5")
      expect(ctx).toContain("--content")
      expect(ctx).toContain("--title")
    })
  })

  describe("gh:review", () => {
    test("Stage 0.5 retrieve includes context from HKTMemory", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-review", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "stage-0.5")
      expect(ctx.toLowerCase()).toContain("context")
    })

    test("Stage 6.5 store uses --content and --title", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-review", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "stage-6.5")
      expect(ctx).toContain("--content")
      expect(ctx).toContain("--title")
    })
  })

  describe("gh:compound", () => {
    test("Phase 0.4 retrieve searches for related solutions", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-compound", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.4")
      expect(ctx.toLowerCase()).toContain("related")
    })

    test("Phase 2.3 store uses --content, --title, and --topic", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-compound", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-2.3")
      expect(ctx).toContain("--content")
      expect(ctx).toContain("--title")
      expect(ctx).toContain("--topic")
    })

    test("Phase 2.3 logs memory_linked event after successful store", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-compound", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-2.3")
      expect(ctx).toContain("gale-task")
      expect(ctx).toContain("memory_linked")
    })
  })

  describe("gh:ideate", () => {
    test("Phase 0.5 retrieve searches historical ideation", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-ideate", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.5")
      expect(ctx.toLowerCase()).toContain("ideation")
    })

    test("Phase 2.5 store uses --content and --title", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-ideate", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-2.5")
      expect(ctx).toContain("--content")
      expect(ctx).toContain("--title")
    })
  })
})

describe("HKTMemory Compounding — Non-Blocking on HKTMemory Failure", () => {
  for (const skill of COMPOUNDING_SKILLS) {
    const [retrievePatch, storePatch] = LOOP_PATCHES[skill]

    test(`${skill} retrieve failure does not block the skill`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, retrievePatch)
      expect(
        ctx,
        `${skill} retrieve patch "${retrievePatch}" not found`,
      ).toBeTruthy()
      // Must have non-blocking fallback language
      expect(ctx).toMatch(/proceed silently|do not fail|on error.*proceed|skip silently|non-blocking|not.*critical/i)
    })

    test(`${skill} store failure does not block the skill`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, storePatch)
      expect(
        ctx,
        `${skill} store patch "${storePatch}" not found`,
      ).toBeTruthy()
      expect(ctx).toMatch(/non-blocking|do not fail|note.*error|on error.*proceed|not.*critical/i)
    })
  }
})

describe("HKTMemory Compounding — Loop Completeness", () => {
  test("All compounding loop steps are documented in README", async () => {
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8")
    expect(readme).toContain("Brainstorm")
    expect(readme).toContain("Plan")
    expect(readme).toContain("Work")
    expect(readme).toContain("Review")
    expect(readme).toContain("Compound")
    expect(readme).toContain("HKTMemory")
  })

  for (const [skill, [retrievePatch, storePatch]] of Object.entries(LOOP_PATCHES)) {
    test(`${skill} participates in the full compounding loop (${retrievePatch} + ${storePatch})`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
      expect(content).toContain(`HKT-PATCH:${retrievePatch}`)
      expect(content).toContain(`HKT-PATCH:${storePatch}`)
    })
  }
})
