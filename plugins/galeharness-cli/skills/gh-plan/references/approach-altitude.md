# Approach Altitude

Loaded from SKILL.md Phase 0.1a when a request is answered one level up: produce a grounded **approach-plan** (a plan for *how the deliverable will be made*), hold at a checkpoint, then execute now or save for later. Entered explicitly ("plan for a plan") or via an accepted proactive offer. Domain-general: the deliverable may be a document, a synthesis, a study artifact, or a software implementation plan. The boundary this preserves is **code vs. knowledge-work**, not plan vs. execute: `gh:plan` never writes or runs code; code execution always belongs to `gh:work`.

## Stage 1: Light Recon

The approach-plan needs to be specific enough to judge. Generic methodology ("read the book, extract themes, synthesize") is not worth approving. Before composing it, skim the provided inputs enough to ground the approach in specifics, but do not do the full read; that is the deliverable's work, deferred to execution.

- Bound recon per input type so the checkpoint stays cheap. Directional guidance: for a PDF, section headers plus first/last pages and a few sampled sections; for a long transcript, sampled spans plus topic shifts; for a codebase, entry points and the relevant module shape.
- Ground in specifics: name the concrete bridges the approach will make, not a generic recipe.
- Degrade gracefully. If inputs are absent or arrive later, fall back to proposing from the request alone and mark the approach-plan as provisional/ungrounded.
- Avoid process exhaust. The approach-plan should surface what you concluded, not the mechanics used to inspect the inputs.

## Stage 2: Compose The Approach-Plan

Deliver the approach-plan in chat first. It is file-optional until the user decides to persist it. Keep it scannable and right-sized to the request:

- How each input will be handled.
- How the inputs combine.
- The shape of the deliverable.
- The forks worth confirming.
- Open questions that should be answered before execution.

This is not a software plan template unless the deliverable itself is a software implementation plan. If the user chooses to execute a software deliverable, route into the normal `gh:plan` flow rather than composing the implementation plan here.

## Stage 3: Checkpoint

Hold at the approach. Use the platform's blocking question tool when available (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini/Pi). Fall back to numbered options in chat only when no blocking tool exists or the call errors; never silently skip.

Sequence orthogonal decisions instead of cramming them into one menu:

1. First ask whether to execute now or save for later.
2. Then, only if executing now and the domain is not already obvious, confirm code vs. knowledge-work deliverable.

## Stage 4: Route

**Save for later.** Persist the approach-plan to `docs/plans/` so it survives. If the deliverable is non-code, write `execution: knowledge-work` in the plan frontmatter at persist time so a later `gh:work` invocation routes to the carve-out. Keep the plan agent-agnostic, without `gh:work`-specific choreography in the body.

**Execute now -- code deliverable.** The approach-plan's job is done; continue into the normal `gh:plan` flow to produce the implementation plan, then hand off to `gh:work` for the code. `gh:plan` never writes code itself.

**Execute now -- non-code deliverable.** Route to `gh:work`'s knowledge-work carve-out:

1. Write `execution: knowledge-work` into the plan frontmatter.
2. Persist the marked plan to `docs/plans/` so the marker can travel with the artifact.
3. Invoke `gh:work` with the plan path through the platform's skill-invocation primitive when one exists; otherwise continue with the carve-out instructions directly.

## Boundaries

Approach altitude is distinct from three nearby mechanics:

- Answer-seeking plan-of-attack (`references/universal-planning.md`): non-blocking, proceeds immediately, and produces a chat answer.
- Scoping synthesis (Phase 0.7 / 5.1.5): confirms scope for a deliverable already committed to.
- Deepening (Phase 5.3): strengthens an existing plan. Approach altitude happens before any artifact exists.
