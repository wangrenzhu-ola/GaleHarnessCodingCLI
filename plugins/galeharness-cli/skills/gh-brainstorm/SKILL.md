---
name: gh:brainstorm
description: 'Explore requirements and approaches through collaborative dialogue before writing a right-sized requirements document and planning implementation. Use for feature ideas, problem framing, when the user says ''let''s brainstorm'', or when they want to think through options before deciding what to build. Also use when a user describes a vague or ambitious feature request, asks ''what should we build'', ''help me think through X'', presents a problem with multiple valid solutions, or seems unsure about scope or direction — even if they don''t explicitly ask to brainstorm.'
argument-hint: "[feature idea or problem to explore]"
---

# Brainstorm a Feature or Improvement

**Note: The current year is 2026.** Use this when dating requirements documents.

Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes `/gh:plan`, which answers **HOW** to build it.

The durable output of this workflow is a **requirements document**. In other workflows this might be called a lightweight PRD or feature brief. In compound engineering, keep the workflow name `brainstorm`, but make the written artifact strong enough that planning does not need to invent product behavior, scope boundaries, or success criteria.

This skill does not implement code. It explores, clarifies, and documents decisions for later planning or execution.

**IMPORTANT: All file references in generated documents must use repo-relative paths (e.g., `src/models/user.rb`), never absolute paths. Absolute paths break portability across machines, worktrees, and teammates.**

## Core Principles

1. **Assess scope first** - Match the amount of ceremony to the size and ambiguity of the work.
2. **Be a thinking partner** - Suggest alternatives, challenge assumptions, and explore what-ifs instead of only extracting requirements.
3. **Resolve product decisions here** - User-facing behavior, scope boundaries, and success criteria belong in this workflow. Detailed implementation belongs in planning.
4. **Keep implementation out of the requirements doc by default** - Do not include libraries, schemas, endpoints, file layouts, or code-level design unless the brainstorm itself is inherently about a technical or architectural change.
5. **Right-size the artifact** - Simple work gets a compact requirements document or brief alignment. Larger work gets a fuller document. Do not add ceremony that does not help planning.
6. **Apply YAGNI to carrying cost, not coding effort** - Prefer the simplest approach that delivers meaningful value. Avoid speculative complexity and hypothetical future-proofing, but low-cost polish or delight is worth including when its ongoing cost is small and easy to maintain.
7. **Challenge framing before committing** - Name the real problem, explicit assumptions, non-goals, and success criteria before locking the requirements. If the user's first framing looks like a proxy problem, present the simpler or higher-leverage framing without bulldozing their intent.
8. **Separate decisions from guesses** - Do not write an unconfirmed implementation idea as a product requirement. Record it as an assumption, rejected option, key decision, or deferred planning question depending on what was actually decided.

## Interaction Rules

These rules apply to every brainstorm, including the universal non-software flow routed to `references/universal-brainstorming.md`.

1. **Ask one question at a time** - One question per turn, even when related sub-questions feel tempting. Pick the single most useful question and wait for the answer.
2. **Prefer single-select multiple choice** - Use single-select when choosing one direction, one priority, or one next step.
3. **Use multi-select rarely and intentionally** - Use it only for compatible sets such as goals, constraints, non-goals, or success criteria that can all coexist. If prioritization matters, follow up by asking which selected item is primary.
4. **Default to the platform's blocking question tool** - When asking the user a question, prefer the platform's blocking question tool if one exists (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). Use numbered chat options only when no blocking tool exists or the call fails. Do not proceed silently or treat tool inconvenience as permission to skip the question.
5. **Use prose only for genuinely open probes** - Drop the blocking tool only when the answer is inherently narrative, a menu would leak your priors, or you cannot write distinct plausible options without padding. This includes the rigor probes in Phase 1.3. Rule 1 still applies: one prose probe per turn.

## Output Guidance

- **Keep outputs concise** - Prefer short sections, brief bullets, and only enough detail to support the next decision.
- **Use repo-relative paths** - When referencing files, use paths relative to the repo root (e.g., `src/models/user.rb`), never absolute paths. Absolute paths make documents non-portable across machines and teammates.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to explore? Please describe the feature, problem, or improvement you're thinking about."

Do not proceed until you have a feature description from the user.

**Config:**
At the start of execution, use your native file-read tool to read `.compound-engineering/config.local.yaml` from the repository root. If the file is missing in the current worktree, check the main repository root (the parent of `.git/worktrees`). If the file is missing or unreadable, do not block the workflow — proceed silently with default settings.

If the config file contains `language: en`, write documents in English.
If the file is missing, contains `language: zh-CN`, or has no language key, write documents in Chinese (default).

## Execution Flow

<!-- HKT-PATCH:gale-task-start -->
### Phase -1: Task Lifecycle Start

Before any other action, log the skill start event so this execution appears on the task board:

1. Run `gale-task log skill_started --skill gh:brainstorm --title "<brainstorm-topic>"` to register this execution on the task board.
2. If `gale-task` is not on PATH or the command fails, skip and continue — this must never block the skill.

<!-- /HKT-PATCH:gale-task-start -->

### Phase 0: Resume, Assess, and Route

#### 0.1 Resume Existing Work When Appropriate

If the user references an existing brainstorm topic or document, or there is an obvious recent matching `*-requirements.md` file in `docs/brainstorms/`:
- Read the document
- Confirm with the user before resuming: "Found an existing requirements doc for [topic]. Should I continue from this, or start fresh?"
- If resuming, summarize the current state briefly, continue from its existing decisions and outstanding questions, and update the existing document instead of creating a duplicate

#### 0.1b Classify Task Domain

Before proceeding to Phase 0.2, classify whether this is a software task. The key question is: **does the task involve building, modifying, or architecting software?** -- not whether the task *mentions* software topics.

**Software** (continue to Phase 0.2) -- the task references code, repositories, APIs, databases, or asks to build/modify/debug/deploy software.

**Non-software brainstorming** (route to universal brainstorming) -- BOTH conditions must be true:
- None of the software signals above are present
- The task describes something the user wants to explore, decide, or think through in a non-software domain

**Neither** (respond directly, skip all brainstorming phases) -- the input is a quick-help request, error message, factual question, or single-step task that doesn't need a brainstorm.

**If non-software brainstorming is detected:** Read `references/universal-brainstorming.md` and use those facilitation principles. Do not follow the software brainstorming phases below, but the Core Principles and Interaction Rules above still apply unchanged, including one-question-per-turn and the default to the platform's blocking question tool.

#### 0.2 Assess Whether Brainstorming Is Needed

**Clear requirements indicators:**
- Specific acceptance criteria provided
- Referenced existing patterns to follow
- Described exact expected behavior
- Constrained, well-defined scope

**If requirements are already clear:**
Keep the interaction brief. Confirm understanding and present concise next-step options rather than forcing a long brainstorm. Only write a short requirements document when a durable handoff to planning or later review would be valuable. Skip Phase 1.1 and 1.2 entirely — go straight to Phase 1.3 or Phase 2.5 in announce-mode (synthesis emitted for visibility, no blocking confirmation), then to Phase 3.

#### 0.3 Assess Scope

Use the feature description plus a light repo scan to classify the work:
- **Lightweight** - small, well-bounded, low ambiguity
- **Standard** - normal feature or bounded refactor with some decisions to make
- **Deep** - cross-cutting, strategic, or highly ambiguous

If the scope is unclear, ask one targeted question to disambiguate and then proceed.

<!-- HKT-PATCH:phase-0.4 -->
#### 0.4 HKTMemory Retrieve

Before Phase 1, query the vector memory database for related brainstorms and requirements:

1. Extract a 1-2 sentence search query from the feature description, including:
   - Core problem or feature being explored
   - Key component names or domain terms
   - User goals or outcomes mentioned

2. Run (requires env vars HKT_MEMORY_API_KEY, HKT_MEMORY_BASE_URL, HKT_MEMORY_MODEL):
   ```bash
   memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
   [ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
   hkt-memory retrieve \
     --query "<extracted query>" \
     --layer all --limit 10 --min-similarity 0.35 \
     --vector-weight 0.7 --bm25-weight 0.3
   ```

3. If results returned, prepare a context block and use it to inform Phase 1.1 (Existing Context Scan):
   ```
   ## Related historical brainstorms from HKTMemory
   Source: vector database. Treat as additional context, not primary evidence.
   [results here, each tagged with (similarity: X.XX)]
   ```

4. If no results or command error, proceed silently without blocking Phase 1.

**Integration with Phase 1.1:** When HKTMemory returns relevant results, cross-reference them during the "Topic Scan" step. Look for:
- Similar problems already explored
- Related requirements documents that might inform scope
- Past decisions or constraints that still apply

### Phase 0.5: Environment Setup (Branch / Worktree)

Before starting substantive brainstorming work, set up an isolated working environment. Brainstorm produces documents (requirements docs in `docs/brainstorms/`), not code, but keeping the default branch clean is still good practice.

1. Check the current branch:

   ```bash
   current_branch=$(git branch --show-current)
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
   if [ -z "$default_branch" ]; then
     default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
   fi
   ```

2. **If already on a feature branch** (not the default branch):
   - Continue on the current branch — no action needed

3. **If on the default branch**, offer options using the platform's blocking question tool:

   ```
   1. Create a feature branch (quick — stays in current checkout)
   2. Use a worktree (isolated — recommended for parallel work)
   3. Stay on [default_branch] (only if you're sure)
   ```

   **Option 1: Create a feature branch**
   ```bash
   git pull origin [default_branch]
   git checkout -b brainstorm/<descriptive-name>
   ```
   Derive the branch name from the brainstorm topic (e.g., `brainstorm/global-knowledge-repo`).

   **Option 2: Use a worktree (recommended for parallel development)**
   ```bash
   skill: git-worktree
   # The skill will create a new branch from the default branch in an isolated worktree
   ```
   Use a branch name like `brainstorm/<descriptive-name>`.

   **Option 3: Stay on default branch**
   - Requires explicit user confirmation
   - Only proceed after user explicitly says "yes, stay on [default_branch]"

   **Recommendation**: Use worktree if:
   - You are working on multiple brainstorms or tasks simultaneously
   - You want to keep the default branch clean
   - You may want to switch between branches during the brainstorm

**Deep sub-mode: feature vs product.** For Deep scope, also classify whether the brainstorm must establish product shape or inherit it:

- **Deep — feature** (default): existing product shape anchors decisions. Primary actors, core outcome, positioning, and primary flows are already established in the product or repo. The brainstorm extends or refines within that shape.
- **Deep — product**: the brainstorm must establish product shape rather than inherit it. Primary actors, core outcome, positioning against adjacent products, or primary end-to-end flows are materially unresolved. Existing code lowers the odds of product-tier but does not by itself rule it out — a half-built tool with ambiguous shape is still product-tier.

Product-tier triggers additional Phase 1.2 questions and additional sections in the requirements document. Feature-tier uses the current Deep behavior unchanged.

### Phase 1: Understand the Idea

#### 1.1 Existing Context Scan

Scan the repo before substantive brainstorming. Match depth to scope:

**Lightweight** — Search for the topic, check if something similar already exists, and move on.

**Standard and Deep** — Two passes:

*Constraint Check* — Check project instruction files (`AGENTS.md`, and `CLAUDE.md` only if retained as compatibility context) for workflow, product, or scope constraints that affect the brainstorm. If these add nothing, move on.

*Topic Scan* — Search for relevant terms. Read the most relevant existing artifact if one exists (brainstorm, plan, spec, skill, feature doc). Skim adjacent examples covering similar behavior.

If nothing obvious appears after a short scan, say so and continue. Two rules govern technical depth during the scan:

1. **Verify before claiming** — When the brainstorm touches checkable infrastructure (database tables, routes, config files, dependencies, model definitions), read the relevant source files to confirm what actually exists. Any claim that something is absent — a missing table, an endpoint that doesn't exist, a dependency not in the Gemfile, a config option with no current support — must be verified against the codebase first; if not verified, label it as an unverified assumption. This applies to every brainstorm regardless of topic.

2. **Defer design decisions to planning** — Implementation details like schemas, migration strategies, endpoint structure, or deployment topology belong in planning, not here — unless the brainstorm is itself about a technical or architectural decision, in which case those details are the subject of the brainstorm and should be explored.

**Slack context** (opt-in, Standard and Deep only) — never auto-dispatch. Route by condition:

- **Tools available + user asked**: Dispatch `galeharness-cli:slack-researcher` with a brief summary of the brainstorm topic alongside Phase 1.1 work. Incorporate findings into constraint and context awareness.
- **Tools available + user didn't ask**: Note in output: "Slack tools detected. Ask me to search Slack for organizational context at any point, or include it in your next prompt."
- **No tools + user asked**: Note in output: "Slack context was requested but no Slack tools are available. Install and authenticate the Slack plugin to enable organizational context search."

#### 1.2 Product Pressure Test

Before generating approaches, scan the user's opening for rigor gaps. Match depth to scope.

This is agent-internal analysis, not a user-facing checklist. Read the opening, note which gaps actually exist, and raise only those as questions during Phase 1.3 — folded into the normal flow of dialogue, not fired as a pre-flight gauntlet. A fuzzy opening may earn three or four probes; a concrete, well-framed one may earn zero because no scope-appropriate gaps were found.

**Lightweight:**
- Is this solving the real user problem?
- Are we duplicating something that already covers this?
- Is there a clearly better framing with near-zero extra cost?

**Standard — scan for these gaps:**

- **Evidence gap.** The opening asserts want or need, but doesn't point to anything the would-be user has already done — time spent, money paid, workarounds built — that would make the want observable. When present, ask for the most concrete thing someone has already done about this.

- **Specificity gap.** The opening describes the beneficiary at a level of abstraction where the agent couldn't design without silently inventing who they are and what changes for them. When present, ask the user to name a specific person or narrow segment, and what changes for that person when this ships.

- **Counterfactual gap.** The opening doesn't make visible what users do today when this problem arises, nor what changes if nothing ships. When present, ask what the current workaround is, even if it's messy — and what it costs them.

- **Attachment gap.** The opening treats a particular solution shape as the thing being built, rather than the value that shape is supposed to deliver, and hasn't been examined against smaller forms that might deliver the same value. When present, ask what the smallest version that still delivers real value would look like.

Plus these synthesis questions — not gap lenses, product-judgment the agent weighs in its own reasoning:
- Is there a nearby framing that creates more user value without more carrying cost? If so, what complexity does it add?
- Given the current project state, user goal, and constraints, what is the single highest-leverage move right now: the request as framed, a reframing, one adjacent addition, a simplification, or doing nothing?
- Favor moves that compound value, reduce future carrying cost, or make the product meaningfully more useful or compelling. Use the result to sharpen the conversation, not to bulldoze the user's intent.

**Deep** — Standard lenses and synthesis questions plus:
- Is this a local patch, or does it move the broader system toward where it wants to be?

**Deep — product** — Deep plus:

- **Durability gap.** The opening's value proposition rests on a current state of the world that may shift in predictable ways within the horizon the user cares about. When present, ask how the idea fares under the most plausible near-term shifts — and push past rising-tide answers every competitor could make.

- What adjacent product could we accidentally build instead, and why is that the wrong one?
- What would have to be true in the world for this to fail?

These questions force an explicit product thesis and feed the Scope Boundaries subsections ("Deferred for later" and "Outside this product's identity") and Dependencies / Assumptions in the requirements document.

#### 1.3 Collaborative Dialogue

Follow the Interaction Rules above. Use the platform's blocking question tool when available.

**Guidelines:**
- Ask what the user is already thinking before offering your own ideas. This surfaces hidden context and prevents fixation on AI-generated framings.
- Start broad (problem, users, value) then narrow (constraints, exclusions, edge cases)
- **Rigor probes fire before Phase 2 and are prose, not menus.** Narrowing is legitimate, but Phase 1 cannot end with un-probed rigor gaps. Each scope-appropriate gap from Phase 1.2 fires as a **separate** direct prose probe — one probe satisfies one gap, not multiple. Standard brainstorms scan four gap lenses (evidence, specificity, counterfactual, attachment); Deep-product adds durability (five total), but only the gaps actually present in the opening must be probed. Surface those probes progressively across the conversation — interleaving with narrowing moves is fine, as long as every scope-appropriate gap that was found in Phase 1.2 has been probed in prose before Phase 2. Rigor probes map to Interaction Rule 5(b): a 4-option menu signals which kinds of evidence count and lets the user pick rather than produce. Prose forces them to produce real observation or surface their uncertainty. Examples (one per gap): *evidence — "What's the most concrete thing someone's already done about this — paid, built a workaround, quit a tool over it?"* / *specificity — "Can you name a team you've actually watched hit this, or are you reasoning?"* / *counterfactual — "What do teams do today when this breaks — who reconciles?"* / *attachment — "Before we move to shapes or approaches — what's the smallest version that would still prove the bet right, and what's excluded?"* — **attachment is the final rigor probe before Phase 2 when the attachment gap is present. Fire it regardless of whether a specific shape has emerged through narrowing; its job is to pressure-test the user's implicit framing of the product before Phase 2 inherits it** / *durability — "Under the most plausible near-term shifts, how does this bet hold?"* If the answer reveals genuine uncertainty, record it as an explicit assumption in the requirements document rather than skipping the probe.
- Clarify the problem frame, validate assumptions, and ask about success criteria
- Make requirements concrete enough that planning will not need to invent behavior
- Surface dependencies or prerequisites only when they materially affect scope
- Resolve product decisions here; leave technical implementation choices for planning
- Bring ideas, alternatives, and challenges instead of only interviewing

**Exit condition:** Continue until the idea is clear OR the user explicitly wants to proceed.

### Phase 2: Explore Approaches

If multiple plausible directions remain, propose **2-3 concrete approaches** based on research and conversation. Otherwise state the recommended direction directly.

Use at least one non-obvious angle — inversion (what if we did the opposite?), constraint removal (what if X weren't a limitation?), or analogy from how another domain solves this. The first approaches that come to mind are usually variations on the same axis.

Present approaches first, then evaluate. Let the user see all options before hearing which one is recommended — leading with a recommendation before the user has seen alternatives anchors the conversation prematurely.

When useful, include one deliberately higher-upside alternative:
- Identify what adjacent addition or reframing would most increase usefulness, compounding value, or durability without disproportionate carrying cost. Present it as a challenger option alongside the baseline, not as the default. Omit it when the work is already obviously over-scoped or the baseline request is clearly the right move.

At product tier, alternatives should differ on *what* is built (product shape, actor set, positioning), not *how* it is built. Implementation-variant alternatives belong at feature tier.

For each approach, provide:
- Brief description (2-3 sentences)
- Pros and cons
- Key risks or unknowns
- When it's best suited

**Approach granularity: mechanism / product shape, not architecture.** Approach descriptions name mechanism-level distinctions ("pause as a rule property" vs "pause as an event filter" vs "pause as a separate entity") and product-relevant trade-offs (plan-tier coupling, complexity surface, migration difficulty). They do NOT name implementation specifics — column names, table names, file paths, service classes, JSON shapes, exact method names. Those are gh-plan's job. Bringing architecture forward at brainstorm time forces the user to make architectural decisions on gh-brainstorm's intentionally-shallow research, and the synthesis at Phase 2.5 then has to filter out the leak.

After presenting all approaches, state your recommendation and explain why. Prefer simpler solutions when added complexity creates real carrying cost, but do not reject low-cost, high-value polish just because it is not strictly necessary.

If one approach is clearly best and alternatives are not meaningful, skip the menu and state the recommendation directly.

If relevant, call out whether the choice is:
- Reuse an existing pattern
- Extend an existing capability
- Build something net new

### Phase 2.5: Synthesis Summary

**STOP. Before composing the synthesis, read `references/synthesis-summary.md`.** The discipline rules, prose-summary requirement, three-bucket structure, anti-pattern guidance, soft-cut behavior, self-redirect support, prose-feedback rules, and bucket-content routing into doc body sections all live there. Composing a synthesis without these rules loaded reliably produces malformed output — missing prose summary, implementation-detail leakage, the proposal-pitch anti-pattern. This is not optional supplementary reading; it is the source of truth for how the phase behaves.

Surface a synthesis to the user before Phase 3 writes the requirements doc — the user's last opportunity to correct scope before the artifact lands.

Fires for **all tiers** including Lightweight. Skip Phase 2.5 entirely on the Phase 0.1b non-software (universal-brainstorming) route.

**Headless mode** (LFG / `disable-model-invocation`): the synthesis is composed but not confirmed. Inferred bets route to a `## Assumptions` section in the doc (so downstream review can scrutinize them as un-validated), not into Key Decisions. See `references/synthesis-summary.md` Headless mode for the full routing.

**Announce-mode (Phase 0.2 fast path)**: on the "requirements already clear" fast path, Phase 2.5 fires in announce-mode — emit the synthesis (Stated / Inferred / Out) for visibility, then **end the turn**. Do NOT call the Write tool in the same turn as the synthesis emission. On the user's next message: if it's an acknowledgment, follow-up, or any non-correcting input, proceed to Phase 3 doc-write; if it indicates a correction (push-back on an Inferred bullet, scope adjustment), revise the synthesis and emit again. Lighter than full Phase 2.5 (no `AskUserQuestion` menu, no formal confirm option) but still gives the user a real interruption window before the doc lands. gh-brainstorm sits early in the workflow; a wrong-doc has downstream consequence (feeds gh-plan, then implementation), so the turn boundary is justified even on the fast path.

<!-- HKT-PATCH:knowledge-write-path -->
### Knowledge Repository Write Path

Before writing the output document, resolve the target directory:

1. Run `gale-knowledge resolve-path --type brainstorms` to get the target directory path (the command outputs a plain path string). If the command fails or `gale-knowledge` is not available, fall back to `docs/brainstorms`.
2. Write the document to `<resolved-path>/<filename>.md`.

<!-- /HKT-PATCH:knowledge-write-path -->

### Phase 3: Capture the Requirements

Write or update a requirements document only when the conversation produced durable decisions worth preserving. Read `references/requirements-capture.md` for the document template, formatting rules, visual aid guidance, and completeness checks.

**Document Language**: When `language: zh-CN` (or default), write all prose content in Chinese. Keep section headers (`## Problem Frame`, `## Requirements`, etc.) and YAML frontmatter keys in English. Translate paragraphs, list items, and table content. Do NOT translate code blocks, inline code, file paths, or URLs.

For **Lightweight** brainstorms, keep the document compact. Skip document creation when the user only needs brief alignment and no durable decisions need to be preserved.

<!-- HKT-PATCH:phase-3.3 -->
### Phase 3.3: HKTMemory Store

After successfully writing or updating the requirements document:

1. Compose a concise summary (2-4 sentences) covering: the problem, the chosen approach, key decisions, and the repo-relative file path to the document
2. Extract `title` and `category` values from its YAML frontmatter (if present)
3. Run:
   ```bash
   memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
   [ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
   hkt-memory store \
     --content "<summary + repo-relative file path>" \
     --title "<frontmatter title or filename>" \
     --topic "<frontmatter category or 'brainstorm'>" \
     --layer all
   ```
4. Log on success: `Stored to HKTMemory: [title]`
5. On error, note it briefly but do not fail the brainstorm workflow — memory storage is supplementary, not critical path

**Rationale:** The vector database's job is *discovery* — helping future sessions find related past work. The full document already lives in a git-managed file; storing it again in the vector DB is redundant, expensive, and may exceed content limits. Store the summary and path so retrieval can surface it; the agent reads the actual file when details are needed.

**Note:** This enables future brainstorms to discover and build upon this work through Phase 0.4's retrieve step.

<!-- HKT-PATCH:knowledge-commit -->
### Knowledge Repository Commit

After the document is written:

1. Run `gale-knowledge extract-project` to get the project name. If the command fails or is not available, use the current directory basename as the project name instead.
2. Run `gale-knowledge commit --project "<project-name>" --type brainstorm --title "<document-title>"` to commit the knowledge document. If this command fails, log the error but continue — the document has already been written to disk.
3. If `gale-knowledge` is not on PATH, skip both steps and continue — this must never block the skill.

<!-- /HKT-PATCH:knowledge-commit -->

### Phase 4: Handoff

Present next-step options and execute the user's selection. Read `references/handoff.md` for the option logic, dispatch instructions, and closing summary format.

<!-- HKT-PATCH:gale-task-end -->
After presenting handoff options and completing this skill, log the completion event:

1. Run `gale-task log skill_completed` to record the completion event.
2. If `gale-task` is not on PATH or the command fails, skip and continue — this must never block the skill.

<!-- /HKT-PATCH:gale-task-end -->
