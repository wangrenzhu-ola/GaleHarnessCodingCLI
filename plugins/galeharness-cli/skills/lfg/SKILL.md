---
name: lfg
description: Full autonomous engineering workflow
argument-hint: "[feature description]"
disable-model-invocation: true
---

CRITICAL: You MUST execute every step below IN ORDER. Do NOT skip any required step. Do NOT jump ahead to coding or implementation. The plan phase (step 2) MUST be completed and verified BEFORE any work begins. Violating this order produces bad output.

When invoking any skill referenced below, resolve its name against the available-skills list the host platform provides and use that exact entry. Some platforms list skills under a plugin namespace (e.g., `galeharness-cli:gh-plan`); others list the bare name. Invoking a short-form guess that isn't in the list will fail — always match a listed entry verbatim before calling the Skill/Task tool.

1. **Optional:** If the `ralph-loop` skill is available, invoke it with `"finish all slash commands" --completion-promise "DONE"`. If not available or it fails, skip and continue to step 2 immediately.

2. Invoke the `gh-plan` skill with `$ARGUMENTS`.

   GATE: STOP. If gh:plan reported the task is non-software and cannot be processed in pipeline mode, stop the pipeline and inform the user that LFG requires software tasks. Otherwise, verify that the `gh:plan` workflow produced a plan file in `docs/plans/`. If no plan file was created, invoke `gh-plan` again with `$ARGUMENTS`. Do NOT proceed to step 3 until a written plan exists. **Record the plan file path** — it will be passed to gh:review in step 4.

3. Invoke the `gh-work` skill.

   GATE: STOP. Verify that implementation work was performed - files were created or modified beyond the plan. Do NOT proceed to step 4 if no code changes were made.

4. Invoke the `gh-review` skill with `mode:autofix plan:<plan-path-from-step-2>`.

   Pass the plan file path from step 2 so gh:review can verify requirements completeness.

5. Invoke the `test-browser` skill.

6. Output `<promise>DONE</promise>` when complete

Start with step 2 now (or step 1 if ralph-loop is available). Remember: plan FIRST, then work. Never skip the plan.
