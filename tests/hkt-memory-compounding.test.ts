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
  const idx = lines.findIndex((l) => l.trim() === `<!-- HKT-PATCH:${patchName} -->`)
  if (idx === -1) return ""
  return lines.slice(idx, idx + 60).join("\n")
}

function extractBashBlock(content: string, subcommand: "retrieve" | "store" | "session-search"): string | null {
  // Closing ``` may be indented (e.g. "    ````") so we use \s* in the trailing part
  // Matches both the new `hkt-memory` command and the legacy `hkt_memory_v5.py` path
  const hktCmd = /(?:hkt-memory|uv run [^\s]+hkt_memory_v5\.py)/
  const pattern =
    subcommand === "retrieve"
      ? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " retrieve[\\s\\S]*?)\\n\\s*```")
      : subcommand === "store"
        ? new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " store[\\s\\S]*?)\\n\\s*```")
        : new RegExp("```bash\\s*\\n([\\s\\S]*?" + hktCmd.source + " session-search[\\s\\S]*?)\\n\\s*```")
  const match = content.match(pattern)
  return match ? match[1].trim() : null
}

// Map skill -> [retrieve patch name, store patch name]
const LOOP_PATCHES: Record<CompoundingSkill, readonly [string, string]> = {
  "gh-brainstorm": ["phase-0.4", "phase-3.3"],
  "gh-plan": ["phase-0.8", "phase-5.4b"],
  "gh-work": ["phase-0.6", "phase-4.5"],
  "gh-review": ["stage-0.5", "stage-6.5"],
  "gh-compound": ["phase-0.4", "phase-2.3"],
  "gh-ideate": ["phase-0.5", "phase-2.5"],
}

describe("HKTMemory Compounding — Helper Boundary Cases", () => {
  test("parseHktPatches returns empty array for empty content", () => {
    expect(parseHktPatches("")).toEqual([])
  })

  test("parseHktPatches returns empty array when no patches present", () => {
    expect(parseHktPatches("# Hello\nSome text\nNo patch here")).toEqual([])
  })

  test("parseHktPatches captures duplicate patches", () => {
    const content = "<!-- HKT-PATCH:phase-0.1 -->\n<!-- HKT-PATCH:phase-0.1 -->"
    const patches = parseHktPatches(content)
    expect(patches.length).toBe(2)
    expect(patches[0].name).toBe("phase-0.1")
    expect(patches[1].name).toBe("phase-0.1")
  })

  test("parseHktPatches ignores malformed patch comments", () => {
    const content = "<!-- HKT-PATCH:phase-0.1 -->\n<!-- HKT PATCH:phase-0.2 -->\n<!--HKT-PATCH:phase-0.3-->"
    const patches = parseHktPatches(content)
    expect(patches.length).toBe(2)
    expect(patches.map((p) => p.name)).toEqual(["phase-0.1", "phase-0.3"])
  })

  test("isRetrievePatch matches phase-0.X and stage-0.X", () => {
    expect(isRetrievePatch("phase-0.1")).toBe(true)
    expect(isRetrievePatch("stage-0.5")).toBe(true)
    expect(isRetrievePatch("phase-0.10")).toBe(true)
  })

  test("isRetrievePatch rejects non-retrieve patterns", () => {
    expect(isRetrievePatch("phase-1.0")).toBe(false)
    expect(isRetrievePatch("phase-2.3")).toBe(false)
    expect(isRetrievePatch("stage-1.0")).toBe(false)
    expect(isRetrievePatch("gale-task-start")).toBe(false)
  })

  test("isStorePatch matches phase-X.X (X >= 2) and stage-X.X", () => {
    expect(isStorePatch("phase-2.3")).toBe(true)
    expect(isStorePatch("phase-5.4b")).toBe(true)
    expect(isStorePatch("phase-10.1")).toBe(true)
    expect(isStorePatch("stage-6.5")).toBe(true)
    expect(isStorePatch("stage-11.0")).toBe(true)
  })

  test("isStorePatch rejects non-store patterns", () => {
    expect(isStorePatch("phase-0.1")).toBe(false)
    expect(isStorePatch("phase-1.0")).toBe(false)
    expect(isStorePatch("stage-0.5")).toBe(false)
    expect(isStorePatch("gale-task-start")).toBe(false)
  })

  test("extractPhaseContext returns empty string when patch not found", () => {
    expect(extractPhaseContext("no patch here", "phase-0.1")).toBe("")
  })

  test("extractPhaseContext distinguishes phase-0.4 from phase-0.4b", () => {
    // Add 100 blank lines to exceed the 60-line window
    const content = "line1\n<!-- HKT-PATCH:phase-0.4 -->\ncontext A\n" + "\n".repeat(100) + "<!-- HKT-PATCH:phase-0.4b -->\ncontext B"
    const ctx1 = extractPhaseContext(content, "phase-0.4")
    const ctx2 = extractPhaseContext(content, "phase-0.4b")
    expect(ctx1).toContain("context A")
    expect(ctx1).not.toContain("context B")
    expect(ctx2).toContain("context B")
    expect(ctx2).not.toContain("context A")
  })
})

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
      expect(ctx).toContain("Compose a concise summary")
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
    test("Phase 0.8 retrieve searches for similar plans", async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, "gh-plan", "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "phase-0.8")
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

describe("HKTMemory Compounding — Safe Root Fallback", () => {
  for (const skill of COMPOUNDING_SKILLS) {
    test(`${skill} never exports an empty resolved memory root`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")

      expect(content).not.toContain('HKT_MEMORY_DIR="$(gale-memory resolve-root 2>/dev/null || true)"')
      expect(content).toContain('memory_root="$(gale-memory resolve-root 2>/dev/null || true)"')
      expect(content).toContain('[ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"')
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

// Session search patches: phase-0.Xb (补充在 retrieve 后)
const SESSION_SEARCH_PATCHES: Record<"gh-work", string> = {
  "gh-work": "phase-0.6b",
}

describe("HKTMemory Session Search Integration", () => {
  for (const [skill, patchName] of Object.entries(SESSION_SEARCH_PATCHES)) {
    describe(skill, () => {
      test(`SKILL.md contains ${patchName} session_search patch`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
        const patches = parseHktPatches(content)
        const found = patches.find(p => p.name === patchName)
        expect(found).toBeDefined()
      })

      test(`${patchName} contains session_search command with --query and --limit`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
        const cmd = extractBashBlock(content, "session-search")
        expect(cmd, `${skill} should have a hkt_memory_v5.py session-search bash block`).not.toBeNull()
        expect(cmd).toContain("--query")
        expect(cmd).toContain("--limit")
      })

      test(`${patchName} appears after retrieve patch`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
        const patches = parseHktPatches(content)
        // Get the retrieve patch for this skill
        const retrievePatch = patches.find(p => isRetrievePatch(p.name))
        const sessionPatch = patches.find(p => p.name === patchName)
        expect(retrievePatch).toBeDefined()
        expect(sessionPatch).toBeDefined()
        if (retrievePatch && sessionPatch) {
          expect(sessionPatch.line).toBeGreaterThan(retrievePatch.line)
        }
      })

      test(`${patchName} has non-blocking fallback`, async () => {
        const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
        const ctx = extractPhaseContext(content, patchName)
        // Should mention silent continuation or non-blocking behavior
        expect(ctx).toMatch(/静默继续|不阻塞|silently|proceed silently|continue silently|non-blocking|not.*critical/i)
      })
    })
  }
})

describe("Gale Task Memory Runtime Pilot", () => {
  test("gh-debug start path calls gale-memory helper instead of raw HKT retrieve", async () => {
    const content = await readFile(path.join(PLUGIN_ROOT, "gh-debug", "SKILL.md"), "utf8")
    const ctx = extractPhaseContext(content, "phase-0.4")

    expect(ctx).toContain("gale-memory start")
    expect(ctx).toContain("--skill gh:debug")
    expect(ctx).toContain("--mode debug")
    expect(ctx).toContain("--artifact-type debug_session")
    expect(ctx).not.toContain("hkt-memory retrieve")
  })

  test("gh-debug ledger resume avoids separate raw session-search main path", async () => {
    const content = await readFile(path.join(PLUGIN_ROOT, "gh-debug", "SKILL.md"), "utf8")
    const ctx = extractPhaseContext(content, "phase-0.4b")

    expect(ctx).toContain("gale-memory start")
    expect(ctx).toContain("trace_id")
    expect(ctx).not.toContain("hkt-memory session-search")
  })

  test("gh-debug capture path writes structured task events through gale-memory", async () => {
    const content = await readFile(path.join(PLUGIN_ROOT, "gh-debug", "SKILL.md"), "utf8")
    const ctx = extractPhaseContext(content, "phase-3.5")

    expect(ctx).toContain("gale-memory capture")
    expect(ctx).toContain("--event-type verification_result")
    expect(ctx).toContain("--event-type failed_attempt")
    expect(ctx).toContain("--event-type root_cause")
    expect(ctx).not.toContain("hkt-memory store")
  })

  for (const [skill, mode] of [
    ["gh-work", "gh:work"],
    ["gh-debug", "gh:debug"],
    ["gh-compound", "gh:compound"],
  ]) {
    test(`${skill} completion stores a session transcript through gale-memory`, async () => {
      const content = await readFile(path.join(PLUGIN_ROOT, skill, "SKILL.md"), "utf8")
      const ctx = extractPhaseContext(content, "gale-task-end")

      expect(ctx).toContain("gale-memory store-session-transcript")
      expect(ctx).toContain(`--skill ${mode}`)
      expect(ctx).toContain("--phase completed")
      expect(ctx).toContain("list-recent")
      expect(ctx).toContain("session-search")
      expect(ctx).toMatch(/never block the skill/i)
    })
  }
})
