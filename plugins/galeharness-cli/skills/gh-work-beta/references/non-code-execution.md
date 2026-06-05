# Non-Code Execution (Knowledge-Work Carve-Out)

Loaded from Phase 0 Input Triage when the plan carries `execution: knowledge-work`. The plan is a production plan for a non-code deliverable, such as a synthesized document, a study artifact, or a research write-up. Execute it to produce the deliverable. This is a minority-case branch; the normal code lifecycle and beta delegation loop do not apply.

## What This Skips

Do not run code-shipping machinery for knowledge-work plans:

- No branch/worktree setup.
- No implementation-unit task list keyed on `Files:`.
- No Codex delegation batch.
- No Test Discovery or system-wide test check.
- No incremental code commits, PR flow, or `references/shipping-workflow.md` status flip.

## Execute The Production Plan

1. Read the plan fully. It is a decision artifact describing how the deliverable gets made: which sources to read, how to mine each, how they combine, the shape of the deliverable, and any confirmed forks.
2. Read the sources named by the plan. Treat user-named resources as authoritative; read them instead of working from memory. If a named source is missing, say so plainly rather than substituting.
3. Synthesize and produce the deliverable following the plan's intended shape and confirmed forks.
4. Save and report. Write the deliverable to a durable repo-tracked location by default, usually a sensible `docs/` subpath or a path the user named at the checkpoint. Report the absolute path.

## Stay Scoped

The carve-out is for knowledge-work output. If producing the deliverable legitimately requires emitting code, route that specific sub-step back through the normal code path so its safeguards still apply. The deliverable itself remains non-code.
