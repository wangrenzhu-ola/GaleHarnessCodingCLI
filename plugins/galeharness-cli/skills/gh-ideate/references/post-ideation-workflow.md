# Post-Ideation Workflow

Read this file after Phase 2 ideation agents return and the orchestrator has merged and deduped their outputs into a master candidate list. Do not load before Phase 2 completes.

## Phase 3: Adversarial Filtering

Review every candidate idea critically. The orchestrator performs this filtering directly -- do not dispatch sub-agents for critique.

Do not generate replacement ideas in this phase unless explicitly refining.

For each rejected idea, write a one-line reason.

Rejection criteria:
- too vague
- not actionable
- duplicates a stronger idea
- not grounded in the current codebase
- too expensive relative to likely value
- already covered by existing workflows or docs
- interesting but better handled as a brainstorm variant, not a product improvement
- unjustified — no articulated warrant tagged `direct:`, `external:`, or `reasoned:`
- unsupported — the stated warrant does not actually support the claimed move
- subject-replacement — abandons or replaces the subject of ideation rather than operating on it — e.g., "pivot to an unrelated domain," "become a different organization"
- below ambition floor — fails the meeting-test: would not warrant team discussion — except when Phase 0.3 detected tactical focus signals, in which case this criterion is waived

Score survivors using a consistent rubric weighing: groundedness in the current repo, **warrant strength** (`direct:` > `external:` > `reasoned:`; none excluded, but direct-evidence ideas score higher all else equal), expected value, novelty, pragmatism, leverage on future work, implementation burden, and overlap with stronger ideas.

Target output:
- keep 5-7 survivors by default
- if too many survive, run a second stricter pass
- if fewer than 5 survive, report that honestly rather than lowering the bar

## Phase 4: Present the Survivors

Present the surviving ideas to the user before writing the durable artifact. This is a review checkpoint, not the final archived result.

Present only the surviving ideas in structured form:

- title
- description
- warrant (`direct:`, `external:`, or `reasoned:`)
- rationale
- downsides
- confidence score
- estimated complexity

Then include a brief rejection summary so the user can see what was considered and cut.

Keep the presentation concise. The durable artifact holds the full record.

Allow brief follow-up questions and lightweight clarification before writing the artifact.

Do not write the ideation doc yet unless:
- the user indicates the candidate set is good enough to preserve
- the user asks to refine and continue in a way that should be recorded
- the workflow is about to hand off to `gh:brainstorm`, Proof sharing, or session end

## Phase 5: Write the Ideation Artifact

Write the ideation artifact after the candidate set has been reviewed enough to preserve.

**Document Language** — When the skill's config contains `language: zh-CN` (or no language config, defaulting to zh-CN):
- Write all prose content in Chinese: paragraphs, list items, table content
- Keep section headers (`## Ranked Ideas`, `## Rejection Summary`, etc.) in English
- Keep YAML frontmatter keys (`date`, `topic`, `focus`, etc.) in English
- Do NOT translate code blocks, inline code, file paths, or URLs

Always write or update the artifact before:
- handing off to `gh:brainstorm`
- sharing to Proof
- ending the session

To write the artifact:

1. Ensure `docs/ideation/` exists
2. Choose the file path:
   - `docs/ideation/YYYY-MM-DD-<topic>-ideation.md`
   - `docs/ideation/YYYY-MM-DD-open-ideation.md` when no focus exists
3. Write or update the ideation document

Use this structure and omit clearly irrelevant fields only when necessary:

```markdown
---
date: YYYY-MM-DD
topic: <kebab-case-topic>
focus: <optional focus hint>
---

# Ideation: <Title>

## Codebase Context
[Grounding summary from Phase 1]

## Ranked Ideas

### 1. <Idea Title>
**Description:** [Concrete explanation]
**Warrant:** [`direct:` / `external:` / `reasoned:` — the actual basis, quoted or cited]
**Rationale:** [How the warrant connects to the move's significance]
**Downsides:** [Tradeoffs or costs]
**Confidence:** [0-100%]
**Complexity:** [Low / Medium / High]
**Status:** [Unexplored / Explored]

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | <Idea> | <Reason rejected> |
```

If resuming:
- update the existing file in place
- preserve explored markers

## Phase 6: Refine or Hand Off

After presenting the results, ask what should happen next.

Offer these options:
1. brainstorm a selected idea
2. refine the ideation
3. share to Proof
4. end the session

### 6.1 Brainstorm a Selected Idea

If the user selects an idea:
- write or update the ideation doc first
- mark that idea as `Explored`
- note the brainstorm date in the session log
- invoke `gh:brainstorm` with the selected idea as the seed

Do **not** skip brainstorming and go straight to planning from ideation output.

### 6.2 Refine the Ideation

Route refinement by intent:

- `add more ideas` or `explore new angles` -> return to Phase 2
- `re-evaluate` or `raise the bar` -> return to Phase 3
- `dig deeper on idea #N` -> expand only that idea's analysis

After each refinement:
- update the ideation document before any handoff, sharing, or session end
- append a session log entry

### 6.3 Share to Proof

If requested, invoke HITL review mode by loading `references/hitl-review.md` from the `proof` skill with:
- `localPath`: the ideation document path
- `title`: from the document's H1 or filename

Handle the HITL return (sync or warn) and return to the next-step options.

### 6.4 End the Session

When ending:
- offer to commit only the ideation doc
- do not create a branch
- do not push
- if the user declines, leave the file uncommitted

## Quality Bar

Before finishing, check:

- the idea set is grounded in the actual repo
- **every surviving idea has articulated warrant** (`direct:`, `external:`, or `reasoned:`) that actually supports the claimed move — speculation dressed as ambition was rejected, with reasons
- **every surviving idea passes the meeting-test** unless Phase 0.3 detected tactical focus signals that waived the floor
- **no surviving idea replaces the subject** rather than operating on it
- the candidate list was generated before filtering
- the original many-ideas -> critique -> survivors mechanism was preserved
- if sub-agents were used, they improved diversity without replacing the core workflow
- every rejected idea has a reason
- survivors are materially better than a naive "give me ideas" list
- the artifact was written before any handoff, sharing, or session end
- acting on an idea routes to `gh:brainstorm`, not directly to implementation
