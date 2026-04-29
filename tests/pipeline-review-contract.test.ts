import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8")
}

describe("gh:work review contract", () => {
  test("requires code review before shipping", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")
    // Review content extracted to references/shipping-workflow.md
    const shipping = await readRepoFile("plugins/galeharness-cli/skills/gh-work/references/shipping-workflow.md")

    // SKILL.md should not contain extracted content
    expect(content).not.toContain("2. **Code Review**")
    expect(content).not.toContain("Consider Code Review")
    expect(content).not.toContain("Code Review** (Optional)")

    // Phase 3 has a mandatory code review step in the reference file
    expect(shipping).toContain("2. **Code Review**")

    // Two-tier rubric in reference file
    expect(shipping).toContain("**Tier 1: Inline self-review**")
    expect(shipping).toContain("**Tier 2: Full review (default)**")
    expect(shipping).toContain("gh:review")
    expect(shipping).toContain("mode:autofix")

    // Quality checklist includes review
    expect(shipping).toContain("Code review completed (inline self-review or full `gh:review`)")
  })

  test("delegates commit and PR to dedicated skills", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")
    // Commit/PR delegation content extracted to references/shipping-workflow.md
    const shipping = await readRepoFile("plugins/galeharness-cli/skills/gh-work/references/shipping-workflow.md")

    expect(shipping).toContain("`git-commit-push-pr` skill")
    expect(shipping).toContain("`git-commit` skill")

    // Should not contain inline PR templates or attribution placeholders
    expect(content).not.toContain("gh pr create")
    expect(content).not.toContain("[HARNESS_URL]")
  })

  test("gh:work-beta mirrors review and commit delegation", async () => {
    const beta = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")
    // Review/commit content extracted to references/shipping-workflow.md
    const shipping = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/references/shipping-workflow.md")

    // Extracted content in reference file
    expect(shipping).toContain("2. **Code Review**")
    expect(shipping).toContain("`git-commit-push-pr` skill")
    expect(shipping).toContain("`git-commit` skill")

    // Negative assertions stay on SKILL.md
    expect(beta).not.toContain("Consider Code Review")
    expect(beta).not.toContain("gh pr create")
  })

  test("includes per-task testing deliberation in execution loop", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")

    // Testing deliberation exists in the execution loop
    expect(content).toContain("Assess testing coverage")

    // Deliberation is between "Run tests after changes" and "Mark task as completed"
    const runTestsIdx = content.indexOf("Run tests after changes")
    const assessIdx = content.indexOf("Assess testing coverage")
    const markDoneIdx = content.indexOf("Mark task as completed")
    expect(runTestsIdx).toBeLessThan(assessIdx)
    expect(assessIdx).toBeLessThan(markDoneIdx)
  })

  test("quality checklist says 'Testing addressed' not 'Tests pass'", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")
    // Quality checklist extracted to references/shipping-workflow.md
    const shipping = await readRepoFile("plugins/galeharness-cli/skills/gh-work/references/shipping-workflow.md")

    // New language present in reference file
    expect(shipping).toContain("Testing addressed")

    // Old language fully removed from both
    expect(content).not.toContain("Tests pass (run project's test command)")
    expect(content).not.toContain("- All tests pass")
    expect(shipping).not.toContain("Tests pass (run project's test command)")
  })

  test("gh:work-beta mirrors testing deliberation and checklist changes", async () => {
    const beta = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")
    // Checklist extracted to references/shipping-workflow.md
    const shipping = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/references/shipping-workflow.md")

    // Testing deliberation stays in SKILL.md (Phase 2 content)
    expect(beta).toContain("Assess testing coverage")

    // New checklist language in reference file
    expect(shipping).toContain("Testing addressed")

    // Old language removed from both
    expect(beta).not.toContain("Tests pass (run project's test command)")
    expect(beta).not.toContain("- All tests pass")
    expect(shipping).not.toContain("Tests pass (run project's test command)")
  })

  test("SKILL.md stub points to shipping-workflow reference", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")

    // Stub references the shipping-workflow file
    expect(content).toContain("`references/shipping-workflow.md`")

    // Extracted content is not in SKILL.md
    expect(content).not.toContain("2. **Code Review**")
    expect(content).not.toContain("## Quality Checklist")
    expect(content).not.toContain("## Code Review Tiers")
  })

  test("gh:work-beta SKILL.md stub points to shipping-workflow reference", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    // Stub references the shipping-workflow file
    expect(content).toContain("`references/shipping-workflow.md`")

    // Extracted content is not in SKILL.md
    expect(content).not.toContain("2. **Code Review**")
    expect(content).not.toContain("## Quality Checklist")
    expect(content).not.toContain("## Code Review Tiers")
  })

  test("gh:work remains the stable non-delegating surface", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")

    expect(content).not.toContain("## Argument Parsing")
    expect(content).not.toContain("## Codex Delegation Mode")
    expect(content).not.toContain("delegate:codex")
  })
})

describe("gh:work-beta codex delegation contract", () => {
  test("has argument parsing with delegate tokens", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    // Argument parsing section exists with delegation tokens
    expect(content).toContain("## Argument Parsing")
    expect(content).toContain("`delegate:codex`")
    expect(content).toContain("`delegate:local`")

    // Resolution chain present
    expect(content).toContain("### Settings Resolution Chain")
    expect(content).toContain("work_delegate")
    expect(content).toContain("config.local.yaml")
  })

  test("argument-hint includes delegate:codex for discoverability", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("argument-hint:")
    expect(content).toContain("delegate:codex")
  })

  test("remains manual-invocation beta during rollout", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("disable-model-invocation: true")
    expect(content).toContain("Invoke `gh:work-beta` manually")
    expect(content).toContain("planning and workflow handoffs remain pointed at stable `gh:work`")
  })

  test("SKILL.md has delegation routing stub pointing to reference", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("## Codex Delegation Mode")
    expect(content).toContain("references/codex-delegation-workflow.md")
    // Delegation details are NOT in SKILL.md body — they're in the reference
    expect(content).not.toContain("### Pre-Delegation Checks")
    expect(content).not.toContain("### Prompt Template")
    expect(content).not.toContain("### Execution Loop")
  })

  test("delegation routing gate in Phase 1 Step 4", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    const gateIdx = content.indexOf("Delegation routing gate")
    const strategyTableIdx = content.indexOf("| **Inline**")
    expect(gateIdx).toBeGreaterThan(0)
    expect(gateIdx).toBeLessThan(strategyTableIdx)
    expect(content).toContain("Codex delegation requires a plan file")
  })

  test("delegation branches in Phase 2 task loop", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("If delegation_active: branch to the Codex Delegation Execution Loop")
  })

  test("delegation reference has all required sections", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md")

    // Pre-delegation checks
    expect(content).toContain("## Pre-Delegation Checks")
    expect(content).toContain("Platform Gate")
    expect(content).toContain("CODEX_SANDBOX")
    expect(content).toContain("command -v codex")
    expect(content).toContain("Consent Flow")

    // Batching
    expect(content).toContain("## Batching")

    // Prompt template
    expect(content).toContain("## Prompt Template")
    expect(content).toContain("<task>")
    expect(content).toContain("<constraints>")
    expect(content).toContain("<output_contract>")
    expect(content).toContain("the orchestrator will not re-run verification independently")

    // Result schema and execution loop
    expect(content).toContain("## Result Schema")
    expect(content).toContain("## Execution Loop")
    expect(content).toContain("codex exec")

    // Circuit breaker
    expect(content).toContain("consecutive_failures")
    expect(content).toContain("3 consecutive failures")

    // Rollback safety
    expect(content).toContain("git diff --quiet HEAD")
    expect(content).toContain("git checkout -- .")
    expect(content).toContain("Do NOT use bare `git clean -fd` without path arguments")

    // Mixed-model attribution
    expect(content).toContain("## Mixed-Model Attribution")
  })

  test("delegation reference has decision prompts for ask mode", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/references/codex-delegation-workflow.md")

    expect(content).toContain("## Delegation Decision")
    expect(content).toContain("work_delegate_decision")
    expect(content).toContain("Execute with Claude Code instead")
    expect(content).toContain("Delegate to Codex anyway")
    expect(content).toContain("the cost of delegating outweighs having Claude Code do them")
  })

  test("settings resolution includes delegation decision setting", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("work_delegate_decision")
    expect(content).toContain("`auto`")
    expect(content).toContain("`ask`")
  })

  test("has frontend design guidance ported from beta", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    expect(content).toContain("**Frontend Design Guidance**")
    expect(content).toContain("`frontend-design` skill")
  })
})

describe("gh:plan remains neutral during gh:work-beta rollout", () => {
  test("removes delegation-specific execution posture guidance", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/SKILL.md")

    // Old tag removed from execution posture signals
    expect(content).not.toContain("add `Execution target: external-delegate`")

    // Old tag removed from execution note examples
    expect(content).not.toContain("Execution note: Execution target: external-delegate")

    // Planner stays neutral instead of teaching beta-only invocation
    expect(content).not.toContain("delegate:codex")
  })
})

describe("Karpathy workflow guardrails contract", () => {
  test("gh:brainstorm challenges framing without bloating lightweight work", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md")
    const capture = await readRepoFile("plugins/galeharness-cli/skills/gh-brainstorm/references/requirements-capture.md")

    expect(content).toContain("Challenge framing before committing")
    expect(content).toContain("explicit assumptions, non-goals, and success criteria")
    expect(content).toContain("without bulldozing their intent")
    expect(content).toContain("Right-size the artifact")
    expect(capture).toContain("unconfirmed implementation proposal")
    expect(capture).toContain("Confirmed requirements, deliberate non-goals, explicit assumptions, success criteria")
  })

  test("gh:brainstorm inherits interaction rules in universal flow and probes rigor gaps selectively", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md")
    const universal = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-brainstorm/references/universal-brainstorming.md",
    )

    expect(content).toContain("These rules apply to every brainstorm")
    expect(content).toContain("including the universal non-software flow")
    expect(content).toContain("one-question-per-turn")
    expect(content).toContain("default to the platform's blocking question tool")
    expect(universal).toContain("parent `gh-brainstorm/SKILL.md`")
    expect(universal).toContain("one-question-per-turn")
    expect(universal).toContain("does not relax them")
    expect(universal).toContain("silently skipping questions")

    for (const lens of ["Evidence gap", "Specificity gap", "Counterfactual gap", "Attachment gap", "Durability gap"]) {
      expect(content).toContain(lens)
    }

    expect(content).toContain("user-facing checklist")
    expect(content).toContain("Rigor probes fire before Phase 2 and are prose, not menus")
    expect(content).toContain("direct prose probe")
    expect(content).toContain("Prose forces them to produce real observation")
    expect(content).toContain("record it as an explicit assumption")
  })

  test("gh:plan requires complexity justification and classified uncertainty", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/SKILL.md")

    expect(content).toContain("Justify complexity from source material")
    expect(content).toContain("requirement, success criterion, risk, or explicit constraint")
    expect(content).toContain("blocker, assumption, deferred technical question, or implementation-time unknown")
    expect(content).toContain("Complexity justification gate")
    expect(content).not.toContain("delegate:codex")
  })

  test("gh:work and gh:work-beta share execution contract and surgical-change rules", async () => {
    const stable = await readRepoFile("plugins/galeharness-cli/skills/gh-work/SKILL.md")
    const beta = await readRepoFile("plugins/galeharness-cli/skills/gh-work-beta/SKILL.md")

    for (const content of [stable, beta]) {
      expect(content).toContain("lightweight execution contract")
      expect(content).toContain("current assumptions, minimal change, explicit non-goals, and verification criteria")
      expect(content).toContain("Surgical-change guardrails")
      expect(content).toContain("Every changed line should trace to the request")
      expect(content).toContain("Clean up only orphans created by this change")
      expect(content).toContain("pre-existing dead code or unrelated quality issues")
      expect(content).toContain("Scope Boundaries")
      expect(content).toContain("Execution note")
      expect(content).toContain("Verification")
    }
  })

  test("preserves review diff hygiene guardrail outside brainstorm and ideate edits", async () => {
    const review = await readRepoFile("plugins/galeharness-cli/skills/gh-review/SKILL.md")

    expect(review).toContain("diff-hygiene anchor")
    expect(review).toContain("Classify diff-hygiene findings")
    expect(review).toContain("every substantive changed file and behavior change should trace")
    expect(review).toContain("pre-existing dead code or unrelated quality issues should be reported, not silently fixed")
  })
})

describe("gh:ideate rigor contract", () => {
  test("settles subject before focus dispatch and keeps surprise-me deterministic", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-ideate/SKILL.md")

    const subjectIdx = content.indexOf("#### 0.2 Subject-Identification Gate")
    const focusIdx = content.indexOf("#### 0.3 Interpret Focus and Volume")
    const hktIdx = content.indexOf("#### 0.5 HKTMemory Retrieve")
    expect(subjectIdx).toBeGreaterThan(0)
    expect(subjectIdx).toBeLessThan(focusIdx)
    expect(focusIdx).toBeLessThan(hktIdx)

    expect(content).toContain("being in a repo does not turn vague prompts")
    expect(content).toContain("What should the agent ideate about?")
    expect(content).toContain("Surprise me — let the agent decide what to focus on")
    expect(content).toContain("mark the run as **surprise-me mode** immediately")
    expect(content).toContain("Do not ask the user to confirm the same choice again")
    expect(content).toContain("This is a first-class mode")
    expect(content).toContain("route deterministically to repo-grounded ideation")
    expect(content).toContain("require at least one piece of substance")
  })

  test("narrows issue-tracker intent and preserves HKT/Gale anchors", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-ideate/SKILL.md")

    expect(content).toContain("Issue-tracker intent requires explicit tracker/report phrasing")
    expect(content).toContain("top 3 bugs in authentication")
    expect(content).toContain("regular bug-focused ideation prompts")
    expect(content).toContain("gale-task log skill_started --skill gh:ideate")
    expect(content).toContain("HKTMemory Retrieve")
    expect(content).toContain("HKTMemory Store")
    expect(content).toContain("galeharness-cli:learnings-researcher")
    expect(content).toContain("galeharness-cli:issue-intelligence-analyst")
  })

  test("requires warrant on candidates and filters unsupported survivors", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-ideate/SKILL.md")
    const post = await readRepoFile(
      "plugins/galeharness-cli/skills/gh-ideate/references/post-ideation-workflow.md",
    )

    expect(content).toContain("Per-idea warrant contract")
    expect(content).toContain("direct:")
    expect(content).toContain("external:")
    expect(content).toContain("reasoned:")
    expect(content).toContain("Warrant is required, not optional")
    expect(content).toContain("meeting-test")
    expect(content).toContain("subject-replacement moves are out")

    expect(post).toContain("unjustified — no articulated warrant")
    expect(post).toContain("unsupported — the stated warrant does not actually support the claimed move")
    expect(post).toContain("subject-replacement")
    expect(post).toContain("below ambition floor")
    expect(post).toContain("**Warrant:**")
    expect(post).toContain("Do **not** skip brainstorming and go straight to planning")
  })
})

describe("gh:brainstorm review contract", () => {
  test("exposes document review as an opt-in handoff option", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md")
    const handoff = await readRepoFile("plugins/galeharness-cli/skills/gh-brainstorm/references/handoff.md")

    // Document review is no longer a forced Phase 3.5 step. Users opt in from the Phase 4 menu.
    expect(content).not.toContain("Phase 3.5")

    // Phase 3 and Phase 4 are extracted to references for token optimization
    expect(content).toContain("`references/requirements-capture.md`")
    expect(content).toContain("`references/handoff.md`")

    // Phase 4 menu exposes agent review as a first-class option and routes to document-review
    expect(handoff).toContain("Agent review of requirements doc with `document-review`")
    expect(handoff).toContain("Load the `document-review` skill")

    // Subsequent-round residual findings are surfaced as a prose nudge, not a separate menu option
    expect(handoff).toContain("Post-review nudge")
    expect(handoff).not.toContain("**Review and refine**")
  })
})

describe("gh:plan testing contract", () => {
  test("flags blank test scenarios on feature-bearing units as incomplete", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/SKILL.md")

    // Phase 5.1 review checklist addresses blank test scenarios
    expect(content).toContain("blank or missing test scenarios")
    expect(content).toContain("Test expectation: none")

    // Template comment mentions the annotation convention
    expect(content).toContain("Test expectation: none -- [reason]")
  })
})

describe("gh:plan review contract", () => {
  test("requires document review after confidence check", async () => {
    // Document review instructions extracted to references/plan-handoff.md
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/references/plan-handoff.md")

    // Phase 5.3.8 runs document-review before final checks (5.3.9)
    expect(content).toContain("## 5.3.8 Document Review")
    expect(content).toContain("`document-review` skill")

    // Document review must come before final checks so auto-applied edits are validated
    const docReviewIdx = content.indexOf("5.3.8 Document Review")
    const finalChecksIdx = content.indexOf("5.3.9 Final Checks")
    expect(docReviewIdx).toBeLessThan(finalChecksIdx)
  })

  test("SKILL.md stub points to plan-handoff reference", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/SKILL.md")

    // Stub references the handoff file and marks document review as mandatory
    expect(content).toContain("`references/plan-handoff.md`")
    expect(content).toContain("Document review is mandatory")
  })

  test("uses headless mode in pipeline context", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/references/plan-handoff.md")

    // Pipeline mode runs document-review headlessly, not skipping it
    expect(content).toContain("document-review` with `mode:headless`")
    expect(content).not.toContain("skip document-review and return control")
  })

  test("handoff options recommend gh:work after review", async () => {
    const content = await readRepoFile("plugins/galeharness-cli/skills/gh-plan/references/plan-handoff.md")

    // gh:work is recommended (review already happened)
    expect(content).toContain("**Start `/gh:work`**")
    expect(content).toContain("(recommended)")

    // Document review option is for additional passes
    expect(content).toContain("another document review")

    // No conditional ordering based on plan depth (review already ran)
    expect(content).not.toContain("**Options when document-review is recommended:**")
    expect(content).not.toContain("**Options for Standard or Lightweight plans:**")
  })
})

describe("document-review contract", () => {
  test("findings schema enforces discrete confidence anchors", async () => {
    const schema = JSON.parse(
      await readRepoFile("plugins/galeharness-cli/skills/document-review/references/findings-schema.json")
    )
    const confidence = schema.properties.findings.items.properties.confidence

    // Anchored integer enum, not continuous float
    expect(confidence.type).toBe("integer")
    expect(confidence.enum).toEqual([0, 25, 50, 75, 100])

    // No stale continuous-range properties
    expect(confidence.minimum).toBeUndefined()
    expect(confidence.maximum).toBeUndefined()

    // Rubric text embedded in the description so persona agents see it
    expect(confidence.description).toContain("Absolutely certain")
    expect(confidence.description).toContain("Highly confident")
    expect(confidence.description).toContain("Moderately confident")
    expect(confidence.description).toContain("double-checked")
    expect(confidence.description).toContain("evidence directly confirms")
  })

  test("subagent template embeds anchor rubric and bans float confidence", async () => {
    const template = await readRepoFile(
      "plugins/galeharness-cli/skills/document-review/references/subagent-template.md"
    )

    // Rubric section embedded verbatim in the persona-facing template
    expect(template).toContain("Confidence rubric")
    expect(template).toContain("`0`")
    expect(template).toContain("`25`")
    expect(template).toContain("`50`")
    expect(template).toContain("`75`")
    expect(template).toContain("`100`")

    // Example finding uses anchor, not float
    expect(template).toContain('"confidence": 100')
    expect(template).not.toMatch(/"confidence":\s*0\.\d+/)

    // Advisory observations route to anchor 50, not to a 0.40-0.59 band
    expect(template).toContain("`confidence: 50`")
    expect(template).not.toContain("0.40–0.59 LOW/Advisory band")
    expect(template).not.toContain("0.40-0.59 LOW/Advisory band")
  })
})

describe("skill compatibility contract", () => {
  test("skills do not use inline pre-resolved shell with command substitution", async () => {
    const files = [
      "plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md",
      "plugins/galeharness-cli/skills/gh-plan/SKILL.md",
      "plugins/galeharness-cli/skills/gh-ideate/SKILL.md",
      "plugins/galeharness-cli/skills/gh-compound/SKILL.md",
      "plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md",
      "plugins/galeharness-cli/skills/document-review/SKILL.md",
      "plugins/galeharness-cli/skills/gh-work-beta/SKILL.md",
      "plugins/galeharness-cli/skills/gh-sessions/SKILL.md",
    ]

    for (const file of files) {
      const content = await readRepoFile(file)
      // Check for !` followed by anything containing $(
      const match = content.match(/!`[^`]*\$\(/)
      expect(match).toBeNull()
      
      // Should not contain the old unresolved command string instruction
      expect(content).not.toContain("unresolved command string")
    }
  })
})
