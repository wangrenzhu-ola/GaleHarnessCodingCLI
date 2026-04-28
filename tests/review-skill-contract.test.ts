import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"
import { parseFrontmatter } from "../src/utils/frontmatter"

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8")
}

describe("ce-review contract", () => {
  test("documents explicit modes and orchestration boundaries", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toContain("## Mode Detection")
    expect(content).toContain("mode:autofix")
    expect(content).toContain("mode:report-only")
    expect(content).toContain("mode:headless")
    expect(content).toContain(".context/galeharness-cli/gh-review/<run-id>/")
    expect(content).toContain("Do not write run artifacts.")
    expect(content).toContain(
      "Do not start a mutating review round concurrently with browser testing on the same checkout.",
    )
    expect(content).toContain("mode:report-only cannot switch the shared checkout to review a PR target")
    expect(content).toContain("mode:report-only cannot switch the shared checkout to review another branch")
    expect(content).toContain("Resolve the base ref from the PR's actual base repository, not by assuming `origin`")
    expect(content).not.toContain("Which severities should I fix?")
  })

  test("documents headless mode contract for programmatic callers", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    // Headless mode has its own rules section
    expect(content).toContain("### Headless mode rules")

    // No interactive prompts (cross-platform)
    expect(content).toContain(
      "Never use the platform question tool",
    )

    // Structured output format
    expect(content).toContain("### Headless output format")
    expect(content).toContain("Code review complete (headless mode).")
    expect(content).toContain('"Review complete" as the terminal signal')

    // Applies safe_auto fixes but NOT safe for concurrent use
    expect(content).toContain(
      "Not safe for concurrent use on a shared checkout.",
    )

    // Writes artifacts but no externalized work, no commit/push/PR
    expect(content).toContain("Do not file tickets or externalize work.")
    expect(content).toContain(
      "Never commit, push, or create a PR",
    )

    // Single-pass fixing, no bounded re-review rounds
    expect(content).toContain("No bounded re-review rounds")

    // Checkout guard — headless shares report-only's guard
    expect(content).toMatch(/mode:headless.*must run in an isolated checkout\/worktree or stop/)

    // Conflicting mode flags
    expect(content).toContain("**Conflicting mode flags:**")

    // Structured error for missing scope
    expect(content).toContain("Review failed (headless mode). Reason: no diff scope detected.")

    // Degraded signal when all reviewers fail
    expect(content).toContain("Code review degraded (headless mode).")
  })

  test("documents policy-driven routing and residual handoff", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toContain("## Action Routing")
    expect(content).toContain("Only `safe_auto -> review-fixer` enters the in-skill fixer queue automatically.")
    expect(content).toContain(
      "Only include `gated_auto` findings in the fixer queue after the user explicitly approves the specific items.",
    )
    expect(content).toContain(
      "If no `gated_auto` or `manual` findings remain after safe fixes, skip the policy question entirely",
    )
    // Autofix-mode residual handoff is the run artifact (file-based todo system removed).
    expect(content).toContain(
      "In autofix mode, the run artifact is the handoff.",
    )
    expect(content).not.toContain("todo-create")
    expect(content).not.toContain("create durable todo files")
    expect(content).toContain("**On the resolved review base/default branch:**")
    expect(content).toContain("git push --set-upstream origin HEAD")
    expect(content).not.toContain("**On main/master:**")
  })

  test("keeps findings schema and downstream docs aligned", async () => {
    const rawSchema = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/findings-schema.json",
    )
    const schema = JSON.parse(rawSchema) as {
      _meta: {
        confidence_thresholds: { suppress: string; report: string }
        confidence_anchors: Record<string, string>
      }
      properties: {
        findings: {
          items: {
            properties: {
              autofix_class: { enum: string[] }
              owner: { enum: string[] }
              requires_verification: { type: string }
              confidence: { type: string; enum: number[] }
            }
            required: string[]
          }
        }
      }
    }

    expect(schema.properties.findings.items.required).toEqual(
      expect.arrayContaining(["autofix_class", "owner", "requires_verification"]),
    )
    expect(schema.properties.findings.items.properties.autofix_class.enum).toEqual([
      "safe_auto",
      "gated_auto",
      "manual",
      "advisory",
    ])
    expect(schema.properties.findings.items.properties.owner.enum).toEqual([
      "review-fixer",
      "downstream-resolver",
      "human",
      "release",
    ])
    expect(schema.properties.findings.items.properties.requires_verification.type).toBe("boolean")
    expect(schema.properties.findings.items.properties.confidence.type).toBe("integer")
    expect(schema.properties.findings.items.properties.confidence.enum).toEqual([0, 25, 50, 75, 100])
    expect(schema._meta.confidence_thresholds.suppress).toContain("anchor 75")
    expect(schema._meta.confidence_thresholds.suppress).toContain("anchor 50")
    expect(schema._meta.confidence_thresholds.suppress).toMatch(/P0/)
    expect(schema._meta.confidence_anchors["0"]).toBeDefined()
    expect(schema._meta.confidence_anchors["25"]).toBeDefined()
    expect(schema._meta.confidence_anchors["50"]).toBeDefined()
    expect(schema._meta.confidence_anchors["75"]).toBeDefined()
    expect(schema._meta.confidence_anchors["100"]).toBeDefined()

    // File-based todo skills removed in upstream sync patch 0010.
    // No durable todo handoff from gh:review autofix mode.
  })

  test("subagent template carries anchored confidence rubric and lint-ignore suppression", async () => {
    const template = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/subagent-template.md",
    )

    expect(template).toMatch(/`0` -- Not confident/)
    expect(template).toMatch(/`25` -- Somewhat confident/)
    expect(template).toMatch(/`50` -- Moderately confident/)
    expect(template).toMatch(/`75` -- Highly confident/)
    expect(template).toMatch(/`100` -- Absolutely certain/)
    expect(template).toContain("`0`, `25`, `50`, `75`, or `100`")
    expect(template).toMatch(/0\.85.*validation failures/i)
    expect(template).toMatch(/lint-ignore|lint disable|eslint-disable/i)
    expect(template).toMatch(/unless the suppression itself violates/i)
    expect(template).toMatch(/Advisory observations/i)
  })

  test("autofix_class decision guide includes safe_auto operational test and boundary cases", async () => {
    const template = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/subagent-template.md",
    )

    // Symmetry-of-error framing: classifying a mechanical fix as gated_auto has cost
    expect(template).toMatch(/wrong-side cost is symmetric/i)
    expect(template).toMatch(/Bias toward `safe_auto`/i)

    // Operational test for safe_auto: one-sentence + no-contract-change exclusion list
    expect(template).toMatch(/one sentence with no .depends on. clauses/i)
    expect(template).toMatch(/function signature.*public-API.*error contract.*security posture.*permission model/i)

    // The four boundary cases that often feel risky but are still safe_auto
    expect(template).toMatch(/Boundary cases that often feel risky but are still `safe_auto`/i)
    expect(template).toMatch(/nil guard that turns a crash into a nil-return is `safe_auto`/i)
    expect(template).toMatch(/off-by-one fix is `safe_auto`/i)
    expect(template).toMatch(/Dead-code removal is `safe_auto`/i)
    expect(template).toMatch(/Helper extraction is `safe_auto`/i)

    // Cross-file extraction discriminator (the F4b case from the calibration eval)
    expect(template).toMatch(/naming or placement requires a design conversation/i)

    // Anti-default guards on both sides
    expect(template).toMatch(/Do not default to `advisory`/i)
    expect(template).toMatch(/Do not default to `gated_auto` when the fix is mechanical/i)
  })

  test("Stage 5 synthesis uses anchor gate and one-anchor promotion", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toMatch(/confidence:\s*integer in \{0, 25, 50, 75, 100\}/)
    expect(content).toMatch(/suppress remaining findings below anchor 75/i)
    expect(content).toMatch(/P0 findings at anchor 50\+ survive/)
    expect(content).toMatch(/gate runs late deliberately/i)
    expect(content).toMatch(/one anchor step.*50 -> 75.*75 -> 100/)
    expect(content).not.toContain("boost the merged confidence by 0.10")
    expect(content).toMatch(/anchor \(descending\)/)
  })

  test("Stage 5b validation pass dispatches conditionally and bounds parallelism", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")
    const validatorTemplate = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/validator-template.md",
    )

    expect(content).toContain("### Stage 5b: Validation pass")
    expect(content).toContain("`headless`")
    expect(content).toContain("`autofix`")
    // Stage 5b runs on headless/autofix only; interactive mode does not use LFG or File-tickets routing.
    expect(content).toMatch(/report-only/i)
    expect(content).toMatch(/Per-finding parallel dispatch/i)
    expect(content).toMatch(/Independence is the point/i)
    expect(content).toMatch(/exceeds 15 findings/i)
    expect(content).toMatch(/highest-severity 15/i)
    expect(validatorTemplate).toContain("independent validator")
    expect(validatorTemplate).toContain("operationally read-only")
    expect(validatorTemplate).toContain('"validated": true | false')
    expect(validatorTemplate).toMatch(/introduced by THIS diff/i)
    expect(validatorTemplate).toMatch(/handled elsewhere/i)
  })

  test("Stage 5 action derivation uses suggested_fix as the authoritative signal", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    // The mapping table documents the per-finding recommended action.
    expect(content).toMatch(/manual.*yes.*Apply/)
    expect(content).toMatch(/manual.*no.*Defer/)
    expect(content).toMatch(/gated_auto.*yes.*Apply/)
    expect(content).toMatch(/gated_auto.*no.*Defer/)
    expect(content).toMatch(/advisory.*n\/a.*Acknowledge/)

    // Cross-reviewer tie-break order is unchanged.
    expect(content).toMatch(/Skip > Defer > Apply > Acknowledge/)
  })

  test("subagent template pushes suggested_fix aggressively", async () => {
    const template = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/subagent-template.md",
    )

    expect(template).toMatch(/Propose a `suggested_fix` whenever any defensible code change is reachable/)
    expect(template).toMatch(/Imperfect information is not grounds for omission/)
    expect(template).toMatch(/Genuinely-omit cases are rare/)
    expect(template).toMatch(/no fix proposed by reviewer/)
  })

  test("findings schema tightens suggested_fix description", async () => {
    const rawSchema = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/findings-schema.json",
    )
    const schema = JSON.parse(rawSchema)

    expect(schema.properties.findings.items.properties.suggested_fix.description).toMatch(
      /Concrete minimal fix the reviewer can defend/,
    )
    expect(schema.properties.findings.items.properties.suggested_fix.description).toMatch(
      /Imperfect information is not grounds for omission/,
    )
    expect(schema.properties.findings.items.properties.suggested_fix.description).toMatch(
      /genuinely no code-level change to propose/,
    )
  })

  test("PR-mode skip-condition pre-check stops without dispatching reviewers", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toContain("**Skip-condition pre-check.**")
    expect(content).toMatch(/gh pr view.*--json state,title,body,files/)
    expect(content).toMatch(/`state` is `CLOSED` or `MERGED`/)
    expect(content).toMatch(/Draft PRs are reviewed normally/)
    expect(content).toMatch(/lightweight sub-agent/)
    expect(content).toMatch(/model: haiku/i)
    expect(content).toMatch(/stop without dispatching reviewers/)
    expect(content).toMatch(/Standalone branch mode and `base:` mode are unaffected/)
  })

  test("mode-aware demotion routes weak general-quality findings to soft buckets", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toMatch(/Mode-aware demotion of weak general-quality findings/i)
    expect(content).toContain("`testing` or `maintainability`")
    expect(content).toMatch(/Severity is P2 or P3/)
    expect(content).toMatch(/`autofix_class` is `advisory`/)
    expect(content).toMatch(/append `<file:line> -- <title>` to `testing_gaps`/)
    expect(content).toMatch(/append the same shape to `residual_risks`/)
    expect(content).toMatch(/title only/i)
    expect(content).toMatch(/Headless and autofix modes.*Suppress/)
    expect(content).toMatch(/mode-aware demotion/)
  })

  test("personas use anchored rubric language and no float references remain", async () => {
    const personas = [
      "correctness-reviewer",
      "testing-reviewer",
      "maintainability-reviewer",
      "project-standards-reviewer",
      "security-reviewer",
      "performance-reviewer",
      "api-contract-reviewer",
      "data-migrations-reviewer",
      "reliability-reviewer",
      "adversarial-reviewer",
      "cli-readiness-reviewer",
      "previous-comments-reviewer",
      "dhh-rails-reviewer",
      "gale-rails-reviewer",
      "gale-python-reviewer",
      "gale-typescript-reviewer",
      "julik-frontend-races-reviewer",
      "swift-ios-reviewer",
      "agent-native-reviewer",
    ]

    for (const persona of personas) {
      const content = await readRepoFile(`plugins/galeharness-cli/agents/${persona}.md`)

      expect(content).toMatch(/Anchor (75|100)/)
      expect(content).toMatch(/Anchor 25 or below.*suppress/i)
      expect(content).not.toMatch(/0\.\d{2}\+/)
      expect(content).not.toMatch(/0\.60-0\.79/)
      expect(content).not.toMatch(/below 0\.60/)
    }
  })

  test("documents stack-specific conditional reviewers for the JSON pipeline", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")
    const catalog = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/persona-catalog.md",
    )

    for (const agent of [
      "galeharness-cli:dhh-rails-reviewer",
      "galeharness-cli:gale-rails-reviewer",
      "galeharness-cli:gale-python-reviewer",
      "galeharness-cli:gale-typescript-reviewer",
      "galeharness-cli:julik-frontend-races-reviewer",
    ]) {
      expect(content).toContain(agent)
      expect(catalog).toContain(agent)
    }

    expect(content).toContain("## Language-Aware Conditionals")
    expect(content).not.toContain("## Language-Agnostic")
  })

  test("stack-specific reviewer agents follow the structured findings contract", async () => {
    const reviewers = [
      {
        path: "plugins/galeharness-cli/agents/dhh-rails-reviewer.md",
        reviewer: "dhh-rails",
      },
      {
        path: "plugins/galeharness-cli/agents/gale-rails-reviewer.md",
        reviewer: "gale-rails",
      },
      {
        path: "plugins/galeharness-cli/agents/gale-python-reviewer.md",
        reviewer: "gale-python",
      },
      {
        path: "plugins/galeharness-cli/agents/gale-typescript-reviewer.md",
        reviewer: "gale-typescript",
      },
      {
        path: "plugins/galeharness-cli/agents/julik-frontend-races-reviewer.md",
        reviewer: "julik-frontend-races",
      },
    ]

    for (const reviewer of reviewers) {
      const content = await readRepoFile(reviewer.path)
      const parsed = parseFrontmatter(content)
      const tools = String(parsed.data.tools ?? "")

      expect(String(parsed.data.description)).toContain("Conditional code-review persona")
      expect(tools).toContain("Read")
      expect(tools).toContain("Grep")
      expect(tools).toContain("Glob")
      expect(tools).toContain("Bash")
      expect(content).toContain("## Confidence calibration")
      expect(content).toContain("## What you don't flag")
      expect(content).toContain("Return your findings as JSON matching the findings schema. No prose outside the JSON.")
      expect(content).toContain(`"reviewer": "${reviewer.reviewer}"`)
    }
  })

  test("leaves data-migration-expert as the unstructured review format", async () => {
    const content = await readRepoFile(
      "plugins/galeharness-cli/agents/data-migration-expert.md",
    )

    expect(content).toContain("## Reviewer Checklist")
    expect(content).toContain("Refuse approval until there is a written verification + rollback plan.")
    expect(content).not.toContain("Return your findings as JSON matching the findings schema.")
  })

  test("fails closed when merge-base is unresolved instead of falling back to git diff HEAD", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    // No scope path should fall back to `git diff HEAD` or `git diff --cached` — those only
    // show uncommitted changes and silently produce empty diffs on clean feature branches.
    expect(content).not.toContain("git diff --name-only HEAD")
    expect(content).not.toContain("git diff -U10 HEAD")
    expect(content).not.toContain("git diff --cached")

    // PR mode still has an inline error for unresolved base
    expect(content).toContain('echo "ERROR: Unable to resolve PR base branch')

    // Branch and standalone modes delegate to resolve-base.sh and check its ERROR: output.
    // The script itself emits ERROR: when the base is unresolved.
    expect(content).toContain("references/resolve-base.sh")
    const resolveScript = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-review/references/resolve-base.sh",
    )
    expect(resolveScript).toContain("ERROR:")

    // Branch and standalone modes must stop on script error, not fall back
    expect(content).toContain(
      "If the script outputs an error, stop instead of falling back to `git diff HEAD`",
    )
  })

  test("orchestration callers pass explicit mode flags", async () => {
    const lfg = await readRepoFile("plugins/galeharness-cli/skills/lfg/SKILL.md")
    expect(lfg).toMatch(/gh-review[^\n]*mode:autofix/)

  })
})

describe("testing-reviewer contract", () => {
  test("includes behavioral-changes-with-no-test-additions check", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/agents/testing-reviewer.md")

    // New check exists in "What you're hunting for" section
    expect(content).toContain("Behavioral changes with no test additions")

    // Check is distinct from untested branches check
    expect(content).toContain("distinct from untested branches")

    // Non-behavioral changes are excluded
    expect(content).toContain("Non-behavioral changes")
  })
})

describe("Karpathy diff hygiene review contract", () => {
  test("gh:review synthesizes intent-aware diff hygiene findings", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(content).toContain("diff-hygiene anchor")
    expect(content).toContain("Unrelated refactors, speculative abstractions, adjacent formatting/comment churn")
    expect(content).toContain("Classify diff-hygiene findings")
    expect(content).toContain("Necessary cleanup is allowed when it removes orphans created by this diff")
    expect(content).toContain("Diff Hygiene")
    expect(content).toContain("pre-existing dead code or unrelated quality issues should be reported, not silently fixed")
  })

  test("always-on personas understand scoped cleanup boundaries", async () => {
    const maintainability = await readRepoFile("plugins/galeharness-cli/agents/maintainability-reviewer.md")
    const standards = await readRepoFile("plugins/galeharness-cli/agents/project-standards-reviewer.md")

    expect(maintainability).toContain("Speculative abstraction outside the change intent")
    expect(maintainability).toContain("Drive-by cleanup")
    expect(maintainability).toContain("Cleanup required by this diff")
    expect(standards).toContain("Plan and intent traceability violations")
    expect(standards).toContain("Require a cited standard, plan boundary, or explicit review-context intent")
  })
})
