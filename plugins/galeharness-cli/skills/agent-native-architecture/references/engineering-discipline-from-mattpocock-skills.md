# Engineering discipline rules from mattpocock/skills

Source: https://github.com/mattpocock/skills
Snapshot evaluated: 2026-05-17
License: MIT
Demand-pool issue: https://github.com/wangrenzhu-ola/ai-infra-demand-pool/issues/275

This is a reference-only extraction. It is **not** a vendor copy, submodule, or runtime dependency. Do not import `.claude-plugin`, `~/.claude/skills`, or Claude-only slash semantics into Hermes.

## Absorption boundary

Allowed:

- Small Hermes-owned checklists or decision gates.
- Thin patches to existing general engineering skills.
- Links from `SKILL.md` to this reference for details.

Not allowed:

- Bulk-copying upstream `SKILL.md` files.
- Creating a parallel `diagnose/tdd/triage/...` skill family.
- Changing `gh compound` or `gstack` internals as part of this extraction.
- Treating this reference as a substitute for completion guard, active readback, or fact-source governance.

## Rule 1 — Feedback loop first

Before a non-trivial bug fix, build or identify the fastest deterministic pass/fail loop that reproduces the user-visible symptom.

Preferred loop order:

1. Failing test at the closest correct seam.
2. CLI or script with fixture input and explicit expected output.
3. HTTP/curl script against a running service.
4. Browser smoke/assertion that checks DOM, console, or network evidence.
5. Captured trace/HAR/log replay.
6. Manual HITL evidence only when automation is genuinely unavailable.

Minimum closeout:

- Original symptom reproduced or explicitly marked not reproducible with attempted evidence.
- Same loop passes after the fix.
- Temporary instrumentation is removed or clearly marked as intentional.

## Rule 2 — Vertical red-green-refactor

For feature or bug work that changes behavior, avoid horizontal slicing.

Bad pattern:

- Write a batch of imagined tests.
- Implement a batch of code.
- Retrospectively make everything green.

Preferred pattern:

1. Pick one observable behavior.
2. Write one failing behavior-level test or smoke.
3. Implement the minimal change.
4. Watch it pass.
5. Repeat for the next behavior.
6. Refactor only while green.

Tests should exercise public interfaces and observable behavior, not private implementation details.

## Rule 3 — Deep module architecture vocabulary

Use these terms in architecture review and refactor proposals:

- **Module**: anything with an interface and implementation.
- **Interface**: everything callers must know to use the module, including invariants, errors, ordering, and configuration.
- **Implementation**: the code hidden behind the interface.
- **Depth**: how much useful behavior is behind a simple interface.
- **Seam**: a place behavior can change without editing callers in place.
- **Adapter**: a concrete implementation at a seam.
- **Locality**: whether related change and bugs stay concentrated.
- **Leverage**: how much value callers get from the interface.

Architecture smells to flag:

- **Shallow module**: interface complexity is close to implementation complexity.
- **Pass-through helper**: deleting it removes complexity instead of concentrating it.
- **Fake seam**: only one adapter exists and no realistic second adapter is expected.
- **Mirror logic**: one business rule appears in lib/sync/UI inline/tests or multiple runtime paths.

Use the deletion test: if the module disappeared, would complexity vanish, or would it spread back into many callers?

## Rule 4 — Tracer-bullet task slicing

A work item should produce a narrow, independently verifiable end-to-end path.

Prefer:

- A thin vertical slice through data/model/API/UI/smoke where relevant.
- A slice that can be demoed or black-box verified alone.
- Explicit AFK vs HITL distinction.

Avoid:

- Separate schema/API/UI issues that cannot prove user value independently.
- Stories whose only acceptance is “files changed” or “PR merged”.

## Rule 5 — Progressive disclosure for skills

To avoid skill bloat:

- `SKILL.md` holds trigger conditions, core workflow, and short operational gates.
- Long explanations, examples, and evaluation matrices live in `references/`.
- Deterministic repeated operations live in `scripts/`.
- Patch an existing skill before creating a new synonym skill.
- Keep trigger descriptions narrow enough that unrelated tasks do not load the skill.

## Upstream-sync policy

Future updates from `mattpocock/skills` should be handled by re-scanning the source repo and comparing against this Hermes-owned reference. Do not merge upstream files directly. Update only the internal delta rules that are still relevant to our active pain points.
