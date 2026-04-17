# Handoff

This content is loaded when Phase 4 begins — after the requirements document is written and reviewed.

---

#### 4.1 Present Next-Step Options

Present the options using the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini). If no question tool is available, present the numbered options in chat and wait for the user's reply before proceeding.

If `Resolve Before Planning` contains any items:
- Ask the blocking questions now, one at a time, by default
- If the user explicitly wants to proceed anyway, first convert each remaining item into an explicit decision, assumption, or `Deferred to Planning` question
- If the user chooses to pause instead, present the handoff as paused or blocked rather than complete
- Do not offer `Proceed to planning` or `Proceed directly to work` while `Resolve Before Planning` remains non-empty

**Question when no blocking questions remain:** "Brainstorm complete. What would you like to do next?"

**Question when blocking questions remain and user wants to pause:** "Brainstorm paused. Planning is blocked until the remaining questions are resolved. What would you like to do next?"

Present only the options that apply, keeping the total at 4 or fewer:

- **Proceed to planning (Recommended)** - Move to `/gh:plan` for structured implementation planning. Shown only when `Resolve Before Planning` is empty.
- **Proceed directly to work** - Skip planning and move to `/gh:work`; suited to lightweight, well-defined changes. Shown only when `Resolve Before Planning` is empty **and** scope is lightweight, success criteria are clear, scope boundaries are clear, and no meaningful technical or research questions remain (the "direct-to-work gate").
- **Continue the brainstorm** - Answer more clarifying questions to tighten scope, edge cases, and preferences. Always shown.
- **View & share in Proof** - Open the requirements doc in Proof to read, comment, collaborate, and share a link. Shown only when a requirements document exists **and** the direct-to-work gate is not satisfied (when both conditions collide, `Proceed directly to work` takes priority and Proof becomes reachable via free-form request).
- **Done for now** - Pause; the requirements doc is saved and can be resumed later. Always shown.

**Surface additional document review contextually, not as a menu fixture:** When the prior document-review pass surfaced residual P0/P1 findings that the user has not addressed, mention them adjacent to the menu and offer another review pass in prose (e.g., "Document review flagged 2 P1 findings you may want to address — want me to run another pass?"). Do not add it to the option list.

#### 4.2 Handle the Selected Option

**If user selects "Proceed to planning (Recommended)":**

Immediately run `/gh:plan` in the current session. Pass the requirements document path when one exists; otherwise pass a concise summary of the finalized brainstorm decisions. Do not print the closing summary first.

**If user selects "Proceed directly to work":**

Immediately run `/gh:work` in the current session using the finalized brainstorm output as context. If a compact requirements document exists, pass its path. Do not print the closing summary first.

**If user selects "Continue the brainstorm":** Return to Phase 1.3 (Collaborative Dialogue) and continue asking the user clarifying questions one at a time to further refine scope, edge cases, constraints, and preferences. Continue until the user is satisfied, then return to Phase 4. Do not show the closing summary yet.

**If user selects "View & share in Proof":**

```bash
CONTENT=$(cat docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md)
TITLE="Requirements: <topic title>"
RESPONSE=$(curl -s -X POST https://www.proofeditor.ai/share/markdown \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg title "$TITLE" --arg markdown "$CONTENT" --arg by "ai:compound" '{title: $title, markdown: $markdown, by: $by}')")
PROOF_URL=$(echo "$RESPONSE" | jq -r '.tokenUrl')
```

Display the URL prominently: `View & collaborate in Proof: <PROOF_URL>`

If the curl fails, skip silently. Then return to the Phase 4 options.

**If the user asks to run another document review** (either from the contextual prompt when P0/P1 findings remain, or by free-form request):

Load the `document-review` skill and apply it to the requirements document for another pass. When document-review returns "Review complete", return to the normal Phase 4 options and present only the options that still apply. Do not show the closing summary yet.

**If user selects "Done for now":** Display the closing summary (see 4.3) and end the turn.

#### 4.3 Closing Summary

Use the closing summary only when this run of the workflow is ending or handing off, not when returning to the Phase 4 options.

When complete and ready for planning, display:

```text
Brainstorm complete!

Requirements doc: docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md  # if one was created

Key decisions:
- [Decision 1]
- [Decision 2]

Recommended next step: `/gh:plan`
```

If the user pauses with `Resolve Before Planning` still populated, display:

```text
Brainstorm paused.

Requirements doc: docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md  # if one was created

Planning is blocked by:
- [Blocking question 1]
- [Blocking question 2]

Resume with `/gh:brainstorm` when ready to resolve these before planning.
```
