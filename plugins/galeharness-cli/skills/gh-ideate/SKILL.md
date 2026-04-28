---
name: gh:ideate
description: "Generate and critically evaluate grounded improvement ideas for the current project. Use when asking what to improve, requesting idea generation, exploring surprising improvements, or wanting the AI to proactively suggest strong project directions before brainstorming one in depth. Triggers on phrases like 'what should I improve', 'give me ideas', 'ideate on this project', 'surprise me with improvements', 'what would you change', or any request for AI-generated project improvement suggestions rather than refining the user's own idea."
argument-hint: "[feature, focus area, or constraint]"
---

# Generate Improvement Ideas

**Note: The current year is 2026.** Use this when dating ideation documents and checking recent ideation artifacts.

`gh:ideate` precedes `gh:brainstorm`.

- `gh:ideate` answers: "What are the strongest ideas worth exploring?"
- `gh:brainstorm` answers: "What exactly should one chosen idea mean?"
- `gh:plan` answers: "How should it be built?"

This workflow produces a ranked ideation artifact in `docs/ideation/`. It does **not** produce requirements, plans, or code.

## Interaction Method

Use the platform's blocking question tool when available (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). Otherwise, present numbered options in chat and wait for the user's reply before proceeding.

Ask one question at a time. Prefer concise single-select choices when natural options exist.

## Focus Hint

<focus_hint> #$ARGUMENTS </focus_hint>

Interpret any provided argument as optional context. It may be:

- a concept such as `DX improvements`
- a path such as `plugins/galeharness-cli/skills/`
- a constraint such as `low-complexity quick wins`
- a volume hint such as `top 3`, `100 ideas`, or `raise the bar`

If no argument is provided, treat the subject as unsettled and run the subject-identification gate before any dispatch.

## Core Principles

1. **Ground before ideating** - Scan the actual codebase first. Do not generate abstract product advice detached from the repository.
2. **Generate many -> critique all -> explain survivors only** - The quality mechanism is explicit rejection with reasons, not optimistic ranking. Do not let extra process obscure this pattern.
3. **Route action into brainstorming** - Ideation identifies promising directions; `gh:brainstorm` defines the selected one precisely enough for planning. Do not skip to planning from ideation output.

**Config:**
At the start of execution, use your native file-read tool to read `.compound-engineering/config.local.yaml` from the repository root. If the file is missing in the current worktree, check the main repository root (the parent of `.git/worktrees`). If the file is missing or unreadable, do not block the workflow — proceed silently with default settings.

If the config file contains `language: en`, write documents in English.
If the file is missing, contains `language: zh-CN`, or has no language key, write documents in Chinese (default).

## Execution Flow

<!-- HKT-PATCH:gale-task-start -->
### Phase -1: Task Lifecycle Start

Before any other action, log the skill start event so this execution appears on the task board:

1. Run `gale-task log skill_started --skill gh:ideate --title "<focus-or-topic>"` to register this execution on the task board.
2. If `gale-task` is not on PATH or the command fails, skip and continue — this must never block the skill.

<!-- /HKT-PATCH:gale-task-start -->

### Phase 0: Resume and Scope

#### 0.1 Check for Recent Ideation Work

Look in `docs/ideation/` for ideation documents created within the last 30 days.

Treat a prior ideation doc as relevant when:
- the topic matches the requested focus
- the path or subsystem overlaps the requested focus
- the request is open-ended and there is an obvious recent open ideation doc
- the issue-grounded status matches: do not offer to resume a non-issue ideation when the current argument indicates issue-tracker intent, or vice versa — treat these as distinct topics

If a relevant doc exists, ask whether to:
1. continue from it
2. start fresh

If continuing:
- read the document
- summarize what has already been explored
- preserve previous idea statuses
- update the existing file instead of creating a duplicate

#### 0.2 Subject-Identification Gate

Before classifying focus or dispatching any grounding, check whether the subject of ideation is identifiable. Every downstream agent — grounding and ideation — needs to know what it's working on. If the subject is ambiguous enough that reasonable sub-agents would diverge on what the topic even is (bare words like `improvements`, `ideas`, `quick wins`, `things to fix`), the output will be scattered.

If the prompt explicitly asks the agent to choose the focus, such as `surprise me`, `pick for me`, or `you decide`, mark the run as **surprise-me mode** immediately and use the Surprise me routing below. Do not ask the user to confirm the same choice again.

The repo can ground a settled subject, but being in a repo does not turn vague prompts like `improvements`, `ideas`, `quick wins`, `things to fix`, or an empty prompt into a coherent topic. Downstream agents need to know what they are ideating about before they scan or generate.

**Questioning principles (apply in this phase and in 0.3):**

- Questions exist only to supply what sub-agents need to operate: an identifiable subject (this phase) and enough context for the agent to say something specific about it (0.3, elsewhere modes only). Nothing else.
- Never ask about solution direction, constraints, audience, tone, success criteria, or anything that characterizes the subject — those belong to `gh:brainstorm`.
- Always keep "Surprise me" (letting the agent decide the focus) as a real option, not a fallback for when the user can't name a subject. Ideation is allowed to be greenfield by design.
- Stop as soon as the subject is identifiable or the user has delegated to "Surprise me." More than 3 total questions across 0.2 and 0.3 is a smell that ideation is not the right workflow — consider suggesting `gh:brainstorm`.

**Detection — issue-tracker intent (subject-identifying).**

Issue-tracker intent requires explicit tracker/report phrasing. Trigger only when the prompt explicitly references the tracker or reports filed in it — phrases like `github issues`, `open issues`, `issue patterns`, `issue themes`, `what users are reporting`, or `bug reports` — the subject is "issues in the tracker." Proceed to 0.3 with issue-tracker intent flagged.

Do NOT trigger on arguments that merely mention bugs as a focus: `bug in auth`, `fix the login issue`, `the signup bug`, `top 3 bugs in authentication` — these are focus hints on regular ideation, not requests to analyze the issue tracker. A bare `bugs` with no tracker phrasing is handled by the vagueness check below, not here. Note: `top 3 bugs in authentication` without explicit tracker wording is a regular bug-focused ideation prompts, not issue intelligence.

When combined (e.g., `top 3 issue themes in authentication`, `biggest bug reports about checkout`): detect issue-tracker intent first, volume override in 0.3, remainder is the focus hint. The focus narrows which issues matter; the volume override controls survivor count.

**Detection — subject identifiability.**

The test: would a reader, seeing only this prompt, know what subject the agent should ideate on? Apply judgment to what the words *refer to*, not to their length or surface form.

- **Vague — ask the scope question.** The prompt refers to a quality, category, or placeholder without naming a specific thing. Reasonable readers would pick different subjects. Illustrative cases: `improvements`, `ideas`, `things to fix`, `quick wins`, `what to build`, `bugs` (as the whole prompt, not as a topic like "bugs in auth"), an empty prompt. These are examples of the pattern, not a lookup table — recognize vagueness by what the words point to (a catch-all quality), not by matching specific words.

- **Identifiable — proceed to 0.3.** The prompt names or plausibly names a specific subject: a feature, concept, document, subsystem, page, flow, or concrete topic. A reader would know where to direct thought even without knowing the domain. Illustrative cases: `authentication system`, `our sign-up page`, `browser sniff`, `dark mode`, `cache invalidation`.

**Key distinction:** vagueness is about what the words *refer to*, not phrase length. `browser sniff` is two words but plausibly names a feature, so it is identifiable. `quick wins` is two words but refers only to a quality, so it is vague. Do not treat short phrases as vague by default.

**Being inside a repo does not settle vagueness.** `improvements` in any repo is still scattered across DX, reliability, features, docs, tests, architecture. The repo provides material for grounding *after* a subject is settled, not the subject itself. Do not silently interpret a vague prompt as "about this repo" and proceed.

**Genuine ambiguity (repo mode).** When judgment leaves real doubt on a short phrase — it could be a named feature or a vague concept — a single cheap check settles it: Glob for the phrase in filenames, or Grep for it in README/docs. If it appears anywhere, treat as identifiable and proceed. If it has no repo footprint and still reads vaguely, ask the scope question.

When in doubt otherwise, err toward asking — one question is trivial compared to dispatching agents on a scattered interpretation.

**The scope question.**

Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to numbered options in chat only when no blocking tool exists or the call errors — not because a schema load is required. Never silently skip.

- **Stem:** "What should the agent ideate about?"
- **Options:**
  - "Specify a subject the agent should ideate on"
  - "Surprise me — let the agent decide what to focus on"
  - "Cancel — let me rephrase"

Routing:

- **Specify** → accept the user's follow-up as the subject. Re-apply the identifiability check once. If still ambiguous, ask once more with "Surprise me" still on the menu. Do not cascade toward specificity about *how* to solve — only about *what* the subject is.
- **Surprise me** → mark the run as **surprise-me mode**. The agent will discover subjects from Phase 1 material rather than carry a user-specified subject. If CWD is inside a git repo, route deterministically to repo-grounded ideation and let the codebase supply the substance. If CWD is not inside a git repo, require at least one piece of substance before dispatching: a URL, a short description, a draft, or pasted material. If the user cannot provide substance outside a repo, end cleanly and ask them to re-run with material. This is a first-class mode — it changes how Phase 1 scans and how Phase 2 sub-agents operate (see those phases). **Dispatch routing for surprise-me is deterministic:** outside a repo, substance is required before dispatching — "surprise me" without material is only viable once the user has supplied something to surprise them about.
- **Cancel** → exit cleanly. Narrate that the user can rephrase and re-invoke.

#### 0.3 Interpret Focus and Volume

Infer two things from the argument and any intake so far:

- **Focus context** — concept, path, constraint, or open-ended
- **Volume override** — any hint that changes candidate or survivor counts

Default volume:
- each ideation sub-agent generates about 8-10 ideas (yielding ~30 raw ideas across agents, ~20-25 after dedupe)
- keep the top 5-7 survivors

Honor clear overrides such as:
- `top 3`
- `100 ideas`
- `go deep`
- `raise the bar`

**Tactical scope detection.** Parse the focus hint (and any intake answers from 0.2 specify path) for tactical signals: `polish`, `typo`, `typos`, `quick wins`, `small improvements`, `cleanup`, `small fixes`. When present, lower the Phase 2 ambition floor — the user has explicitly opted into tactical scope. Default otherwise is step-function (see Phase 2 meeting-test floor).

Use reasonable interpretation rather than formal parsing.

<!-- HKT-PATCH:phase-0.5 -->
#### 0.5 HKTMemory Retrieve

Before Phase 1, query the vector memory database for related ideation and improvement ideas:

1. Extract a search query from the focus hint:
   - Focus area or concept (e.g., "DX improvements", "auth flow")
   - Project domain or technology
   - Constraint keywords (e.g., "low-complexity", "quick wins")

2. Run (requires env vars HKT_MEMORY_API_KEY, HKT_MEMORY_BASE_URL, HKT_MEMORY_MODEL):
   ```bash
   memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
   [ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
   hkt-memory retrieve \
     --query "<extracted query>" \
     --layer all --limit 10 --min-similarity 0.35 \
     --vector-weight 0.7 --bm25-weight 0.3
   ```

3. If results returned, prepare context for Phase 1 and Phase 2:
   ```
   ## Related ideation from HKTMemory
   Source: vector database. Treat as additional context, not primary evidence.
   [results here, each tagged with (similarity: X.XX)]
   ```
   
   Use this to:
   - Avoid duplicating previously explored ideas
   - Build upon or refine past ideation
   - Identify patterns in improvement opportunities

4. If no results or command error, proceed silently.

### Phase 1: Codebase Scan

Before generating ideas, gather codebase context.

Run agents in parallel in the **foreground** (do not use background dispatch — the results are needed before proceeding):

1. **Quick context scan** — dispatch a general-purpose sub-agent using the platform's cheapest capable model (e.g., `model: "haiku"` in Claude Code) with this prompt:

   > Read the project's AGENTS.md (or CLAUDE.md only as compatibility fallback, then README.md if neither exists), then discover the top-level directory layout using the native file-search/glob tool (e.g., `Glob` with pattern `*` or `*/*` in Claude Code). Return a concise summary (under 30 lines) covering:
   > - project shape (language, framework, top-level directory layout)
   > - notable patterns or conventions
   > - obvious pain points or gaps
   > - likely leverage points for improvement
   >
   > Keep the scan shallow — read only top-level documentation and directory structure. Do not analyze GitHub issues, templates, or contribution guidelines. Do not do deep code search.
   >
   > Focus hint: {focus_hint}

2. **Learnings search** — dispatch `galeharness-cli:learnings-researcher` with a brief summary of the ideation focus.

3. **Issue intelligence** (conditional) — if issue-tracker intent was detected in Phase 0.2, dispatch `galeharness-cli:issue-intelligence-analyst` with the focus hint. If a focus hint is present, pass it so the agent can weight its clustering toward that area. Run this in parallel with agents 1 and 2.

   If the agent returns an error (gh not installed, no remote, auth failure), log a warning to the user ("Issue analysis unavailable: {reason}. Proceeding with standard ideation.") and continue with the existing two-agent grounding.

   If the agent reports fewer than 5 total issues, note "Insufficient issue signal for theme analysis" and proceed with default ideation frames in Phase 2.

Consolidate all results into a short grounding summary. When issue intelligence is present, keep it as a distinct section so ideation sub-agents can distinguish between code-observed and user-reported signals:

- **Codebase context** — project shape, notable patterns, obvious pain points, likely leverage points
- **Past learnings** — relevant institutional knowledge from docs/solutions/
- **Issue intelligence** (when present) — theme summaries from the issue intelligence agent, preserving theme titles, descriptions, issue counts, and trend directions

**Slack context** (opt-in) — never auto-dispatch. Route by condition:

- **Tools available + user asked**: Dispatch `galeharness-cli:slack-researcher` with the focus hint in parallel with other Phase 1 agents. Include findings in the grounding summary.
- **Tools available + user didn't ask**: Note in output: "Slack tools detected. Ask me to search Slack for organizational context at any point, or include it in your next prompt."
- **No tools + user asked**: Note in output: "Slack context was requested but no Slack tools are available. Install and authenticate the Slack plugin to enable organizational context search."

Do **not** do external research in v1.

### Phase 2: Divergent Ideation

Generate the full candidate list before critiquing any idea.

**Document Language**: When `language: zh-CN` (or default), write all prose content in Chinese. Keep section headers (`## Survivors`, `## Rejected Ideas`, etc.) and YAML frontmatter keys in English. Translate paragraphs, list items, and table content. Do NOT translate code blocks, inline code, file paths, or URLs.

Dispatch 3-4 parallel ideation sub-agents on the inherited model (do not tier down -- creative ideation needs the orchestrator's reasoning level). Omit the `mode` parameter so the user's configured permission settings apply. Each targets ~8-10 ideas (yielding ~30 raw ideas, ~20-25 after dedupe). Adjust per-agent targets when volume overrides apply (e.g., "100 ideas" raises it, "top 3" may lower the survivor count instead).

Give each sub-agent: the grounding summary, the focus hint, the per-agent volume target, and an instruction to generate raw candidates only (not critique). Each agent's first few ideas tend to be obvious -- push past them. Ground every idea in the Phase 1 scan.

Assign each sub-agent a different ideation frame as a **starting bias, not a constraint**. Prompt each to begin from its assigned perspective but follow any promising thread -- cross-cutting ideas that span multiple frames are valuable.

**Frame selection:**
- **When issue-tracker intent is active and themes were returned:** Each high/medium-confidence theme becomes a frame. Pad with default frames if fewer than 3 cluster-derived frames. Cap at 4 total.
- **Default frames (no issue-tracker intent):** (1) user/operator pain and friction, (2) inversion, removal, or automation of a painful step, (3) assumption-breaking or reframing, (4) leverage and compounding effects.

**Per-idea warrant contract (uniform across all frames, all modes):**

Each sub-agent returns this structure per idea:

- **title**
- **summary** (2-4 sentences)
- **warrant** (required, tagged) — one of:
  - `direct:` quoted line / specific file / named issue / explicit user-supplied context
  - `external:` named prior art, domain research, adjacent pattern, with source
  - `reasoned:` explicit first-principles argument for why this move likely applies — not a gesture; the argument is written out
- **why_it_matters** — connects the warrant to the move's significance
- **meeting_test** — one line confirming this would warrant team discussion (waived when Phase 0.3 detected tactical focus signals)

Warrant is required, not optional. If a sub-agent cannot articulate warrant of at least one type, the idea does not surface. The failure mode to prevent is generic "AI-slop" ideas that sound plausible but lack a basis the user can verify.

**Generation rules (uniform across frames, all modes):**

- Every idea carries articulated warrant. Unjustified speculation does not surface, regardless of how plausible it sounds.
- Bias toward the warrant type your frame naturally produces — pain/inversion/leverage tend toward `direct:`; analogy and constraint-flipping tend toward `reasoned:`; assumption-breaking is mixed — but don't exclude other warrant types.
- Apply the meeting-test as a default floor: would this idea warrant team discussion? If not, it's below the floor and does not surface. The floor is relaxed only when Phase 0.3 detected tactical focus signals.
- Stay within the subject's identity. Product expansions, new surfaces, new markets, retirements, and architectural pivots are fair game when warrant supports them. Subject-replacement moves (abandoning the project, pivoting to unrelated domains, becoming a different organization) are out regardless of warrant. In other words, subject-replacement moves are out.

**Surprise-me mode addendum.** When Phase 0.2 routed to surprise-me, include this additional instruction in each sub-agent's dispatch prompt:

> No user-specified subject. Through your frame's lens, explore the Phase 1 material and identify the subject(s) you find most interesting for this frame. Different frames finding different subjects is the feature — cross-subject divergence is what makes surprise-me valuable. Each idea still carries warrant; warrant may include identification of the subject itself (why *this* subject is worth ideating on through your lens, citing what in the Phase 1 material signals it).

After all sub-agents return:
1. Merge and dedupe into one master candidate list.
2. Synthesize cross-cutting combinations -- scan for ideas from different frames that combine into something stronger. In specified mode, expect 3-5 additions at most. **In surprise-me mode, cross-cutting is the magic layer** — frames often converge on overlapping subjects or find complementary angles; expect 5-8 additions and give this step more attention. Surface combinations that span multiple frame-chosen subjects as a distinctive surprise-me output pattern.
3. If a focus was provided, weight the merged list toward it without excluding stronger adjacent ideas.
4. Spread ideas across multiple dimensions when justified: workflow/DX, reliability, extensibility, missing capabilities, docs/knowledge compounding, quality/maintenance, leverage on future work.

After merging and synthesis, read `references/post-ideation-workflow.md` for the adversarial filtering rubric, presentation format, artifact template, handoff options, and quality bar. Do not load this file before Phase 2 agent dispatch completes.

<!-- HKT-PATCH:phase-2.5 -->
### Phase 2.5: HKTMemory Store

After the ideation artifact is written to `docs/ideation/`:

1. Read back the full content of the ideation document
2. Extract the title and key themes from the frontmatter/content
3. Run:
   ```bash
   memory_root="$(gale-memory resolve-root 2>/dev/null || true)"
   [ -n "$memory_root" ] && export HKT_MEMORY_DIR="$memory_root"
   hkt-memory store \
     --content "<full ideation document>" \
     --title "Ideation: [document title]" \
     --topic "ideation" \
     --layer all
   ```
4. Log on success: `Stored ideation to HKTMemory`
5. On error, proceed silently — storage is supplementary

**Note:** This enables future ideation sessions to discover and build upon these ideas through Phase 0.5's retrieve step.

<!-- HKT-PATCH:gale-task-end -->
After the ideation workflow is fully complete, log the completion event:

1. Run `gale-task log skill_completed` to record the completion event.
2. If `gale-task` is not on PATH or the command fails, skip and continue — this must never block the skill.
<!-- /HKT-PATCH:gale-task-end -->
