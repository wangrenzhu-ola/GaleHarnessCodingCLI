# HITL Review Mode

Human-in-the-loop iteration loop for a markdown document shared via Proof. Invoked either by an upstream skill (`gh-brainstorm`, `gh-ideate`, `gh-plan`) handing off a draft it produced, or directly by the user asking to iterate on an existing markdown file they already have on disk ("share this to proof and iterate", "HITL this doc with me"). Mechanics are identical in both cases: upload the local doc, let the user annotate in Proof's web UI, ingest feedback as in-thread replies and tracked edits, and sync the final doc back to disk.

This mode assumes a local markdown file exists. There is no "from scratch" entry — if the user wants a fresh doc, create one with the normal proof create workflow first, then invoke HITL.

Load this file when HITL review mode is requested — whether by an upstream caller or directly by the user.

---

## Invocation Contract

Inputs:

- **Source file path** (required): absolute or repo-relative path to the local markdown file. When an upstream caller invokes this mode, it passes the path explicitly. When the user invokes directly ("share that doc to proof and let's iterate"), derive the path from conversation context — the file the user just referenced, created, or edited. If ambiguous, ask the user which file.
- **Doc title** (required): display title for the Proof doc. Upstream callers pass this explicitly; on direct-user invocation, default to the file's H1 heading, falling back to the filename (minus extension) if no H1 exists.
- **Recommended next step** (optional, caller-specific): short string the caller wants echoed in the final terminal output (e.g., "Recommended next: `/gh:plan`"). Not used on direct-user invocation — the terminal report simply summarizes the iteration and asks what's next.

Agent identity is fixed, not a parameter: every API call uses agent ID `ai:galeharness-cli` and display name `GaleHarness CLI`. Callers do not override this.

Return shape (used by upstream callers to resume their handoff; also shown to the user in the terminal when invoked directly):

- `status`: `proceeded` | `done_for_now` | `aborted`
- `localPath`: the source file path (same as input)
- `localSynced`: `true` if Phase 5 wrote the reviewed doc back to `localPath`; `false` if the user declined the sync and local is stale. Only present on `proceeded`.
- `docUrl`: the tokenUrl for the Proof doc
- `openThreadCount`: number of unresolved threads still in the doc
- `revision`: final doc revision after end-sync (only on `proceeded`)

---

## Phase 1: Upload and Wait

1. Read the local markdown file into memory. Remember this content as `uploadedMarkdown` — Phase 5 compares against it to detect whether anything changed during the session.
2. `POST https://www.proofeditor.ai/share/markdown` with `{title, markdown}` → capture `slug`, `accessToken`, `tokenUrl`
3. `POST /api/agent/{slug}/presence` with `X-Agent-Id: ai:galeharness-cli`, `x-share-token: <token>`, body `{"name":"GaleHarness CLI","status":"reading","summary":"Uploaded doc for review"}`
4. Display prominently in the terminal:

   ```
   Doc ready for review: <tokenUrl>
   ```

5. Ask the user with the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). If no question tool is available, present the options in chat and wait for the reply.

   **Question:** "Highlight text in Proof to leave a comment. The agent will read each one, reply in-thread or apply the fix, then sync changes back to your local file. What's next?"

   **Options:**
   - **I'm done with feedback — read it and apply**
   - **I have no feedback — proceed**

   If the user is still reviewing, they leave the prompt open — the blocking question waits naturally. A third "still working" option would be a no-op wrapper for that.

   On **I have no feedback — proceed**: skip to Phase 5 (end-sync); return to caller with `status: proceeded`.

   On **I'm done with feedback**: continue to Phase 2.

---

## Phase 2: Ingest Pass

A single pass over the current doc state. Deterministic, idempotent, derivable from marks — no session cache, no sidecar state.

At the start of the pass, update presence to `status: "acting"` with a short summary like `"Reading your feedback"` so anyone watching the Proof tab sees the agent is live on their comments. Update to `status: "waiting"` before the Phase 3 terminal report so the tab signals "ball is in your court" while the terminal asks for the next signal. Same `POST /presence` call as Phase 1 — just different `status`/`summary`.

### 2.1 Read fresh state

```
GET /api/agent/{slug}/state
Headers: x-share-token: <token>
```

Capture:
- `markdown` (current body — includes any user direct edits and accepted suggestions)
- `revision`
- `marks` (object keyed by markId)
- `mutationBase.token` — the baseToken required for this round's mutations

### 2.2 Identify marks that need attention

Filter `marks` to items where **all** of the following hold:

- `by` starts with `human:` (authored by a human, not the agent)
- `resolved` is `false`
- Either `thread` has no entry authored by any `ai:*` identity, **OR** the latest entry in `thread` is authored by `human:*` with an `at` timestamp newer than the latest `ai:*` entry (user responded to a prior agent reply)

Skip everything else. Agent-authored marks, resolved threads, and threads already replied to with no new human response are done.

### 2.3 Read each mark and decide how to respond

The point of HITL is to give the user a natural way to steer the doc without dragging every decision into the terminal. Most feedback can be auto-applied. Only escalate when the agent genuinely can't make a confident call alone.

Real feedback blends types — "this is wrong, rename to Y" is both objection and directive; "why X? I'd prefer Z" is both question and suggestion. Don't force a clean classification. Read the comment text, the anchored `quote`, and any prior thread replies, and decide:

**Can the agent apply a fix directly with confidence?** Imperatives ("rename X to Y", "remove this", "add a section about Z") usually qualify. Apply the edit, reply with a one-line summary of what changed, resolve.

**Is this a question with a clear answer?** Answer in-thread. Resolve if the answer stands on its own. If answering surfaces a new decision the user should weigh in on, leave open and surface it in the terminal report.

**Is this a disagreement?** ("this is wrong", "contradicts §2", "this won't work"). Evaluate the claim against current content. If the agent agrees, fix and reply "Agreed — updated to X". If the agent disagrees, reply with the reasoning and leave open. Don't silently apply an objection without evaluating it — the whole point is that the user flagged it *because* they think the plan is wrong.

**Is the intent genuinely unclear?** First try: attempt the most reasonable interpretation, apply it, and reply "I read this as X — let me know if I should revert." That's cheaper than a round-trip when stakes are low. Ask for clarification only when the interpretations lead to meaningfully different outcomes. When asking, use the platform's blocking question tool for a quick multiple-choice when the options are discrete, or leave it as an open thread comment when free-form response is more natural. Either way the thread stays open so the next pass picks up the user's reply.

**Invariant:** every attention-needing mark ends the pass with an agent reply in its thread. Unreplied = "still to do" — the next pass re-classifies it. This is what makes the loop idempotent without a sidecar: mark state *is* the state. Even when the agent disagrees or can't decide, reply (with reasoning or a question) rather than silently skip.

**Parallelize independent thread ops.** `comment.reply` and `comment.resolve` operations on different marks do not conflict. When a pass has more than roughly three attention-needing marks that are clearly plain replies or resolves, dispatch those independent writes in parallel (`Agent`/`Task` in Claude, `spawn_agent` in Codex, subagent dispatch in Pi) and then re-read state once. Keep block-mutating edits sequential unless you can batch them into a single `/edit/v2` request.

### 2.4 Apply edits

The user is collaborating in the doc, not waiting on approval. Every mutation works with live clients — only whole-doc `rewrite.apply` is gated. Pick the tool that matches intent:

**Default: `suggestion.add` with `status: "accepted"`** for content changes anchored on a quote (reword, rename, clarify, correct, add a sentence inline). One call creates a tracked suggestion mark *and* commits the change. The user sees committed text (no pending approval needed), and the mark persists as audit trail with per-edit attribution and a one-click reject-to-revert. This is the right primitive for HITL auto-applied edits — it gives the user a reversible trail without asking them to re-review anything.

```json
{"type":"suggestion.add","kind":"replace","quote":"<anchor>","content":"<new>","by":"ai:galeharness-cli","status":"accepted","baseToken":"<token>"}
```

Use `kind: "insert" | "delete" | "replace"` as appropriate; all three support `status: "accepted"`.

**Use `/edit/v2` silently** only when the trail is actively wrong or technically blocked:

- **Atomicity is required** — multiple coordinated edits must commit together or not at all (e.g., insert new section + update a reference in another block + delete the obsolete paragraph). `/edit/v2` takes an `operations` array that commits atomically; separate `suggestion.add` calls can partially succeed.
- **Pre-user self-correction** — the agent is fixing its own output *before* the user has looked at the doc (e.g., spotted a mistake mid-ingest-pass). A tracked mark would imply "there was an old version," which is misleading from the user's perspective.
- **Pure structural insertion with no quote anchor** — adding an entirely new block/section where no existing text serves as an anchor. `suggestion.add` requires a `quote`; `/edit/v2` has `insert_before` / `insert_after` keyed on block `ref`.
- **Structural list-item or block removal** — `suggestion.add` with `kind: "delete"` only deletes the text inside a list item; the bullet marker (`*`, `-`, or numeric `1.`) stays behind as an orphan line. Use `/edit/v2 delete_block` to remove an entire block, or `find_replace_in_block` to splice out the item plus its surrounding whitespace cleanly.

```bash
# Get snapshot for block refs + baseToken
curl -s "https://www.proofeditor.ai/api/agent/{slug}/snapshot" -H "x-share-token: <token>"
# Apply
curl -X POST "https://www.proofeditor.ai/api/agent/{slug}/edit/v2" \
  -H "Content-Type: application/json" -H "x-share-token: <token>" \
  -H "X-Agent-Id: ai:galeharness-cli" -H "Idempotency-Key: <uuid>" \
  -d '{"by":"ai:galeharness-cli","baseToken":"<token>","operations":[...]}'
```

Supported op body shapes:

```json
{"op":"replace_block","ref":"b8","block":{"markdown":"new content"}}
{"op":"insert_after","ref":"b3","blocks":[{"markdown":"new block"}]}
{"op":"insert_before","ref":"b3","blocks":[{"markdown":"new block"}]}
{"op":"delete_block","ref":"b6"}
{"op":"find_replace_in_block","ref":"b4","find":"old","replace":"new","occurrence":"first"}
{"op":"replace_range","fromRef":"b2","toRef":"b5","blocks":[{"markdown":"..."}]}
```

Block `ref` values drift across revisions. If any write has landed since the last snapshot, re-fetch `/snapshot` for fresh refs before building `/edit/v2` operations.

**Bulk mechanical sweep:** for uniform changes across more than roughly five blocks, prefer one `/edit/v2` request with a batch of operations over N separate `suggestion.add` calls. The batch commits atomically and avoids leaving the doc half-updated if one later edit fails.

**Use pending `suggestion.add` (no status)** when the change is judgment-sensitive enough that the agent wants explicit user approval before commit — rare in HITL, since the point of auto-applied edits is to reduce round-trips. Most judgment-sensitive cases are better handled by leaving the thread open with a clarifying question.

**`rewrite.apply` is not needed during a live review.** It's blocked by `LIVE_CLIENTS_PRESENT` anyway.

**Mutation requirements (every write, including replies and resolves):**

- Top-level field is `type` on `/ops`; `operations[].op` on `/edit/v2`. Do not mix.
- Include `baseToken` from `/state.mutationBase.token` (or `/snapshot.mutationBase.token` for `/edit/v2`).
- Set `by: "ai:galeharness-cli"` and header `X-Agent-Id: ai:galeharness-cli`.
- Include an `Idempotency-Key` header. Use a fresh UUID per logical write; reuse the same key only when retrying the same payload after proving the first attempt did not commit.
- Reply: `{"type":"comment.reply","markId":"<id>","by":"ai:galeharness-cli","text":"..."}`. Resolve: `{"type":"comment.resolve","markId":"<id>","by":"ai:galeharness-cli"}`. Reopen if needed: `{"type":"comment.unresolve", ...}`.

**Retry after any error is verify-first.**

- Token errors (`STALE_BASE`, `BASE_TOKEN_REQUIRED`, `MISSING_BASE`, `INVALID_BASE_TOKEN`) are safe to auto-retry once after a fresh `/state` or `/snapshot`.
- Anchor errors (`QUOTE_NOT_FOUND`, `AMBIGUOUS_QUOTE`, missing block `ref`) mean the write did not commit, but re-read and update the quote/ref instead of retrying the same request.
- Invalid payloads (`422`, invalid op shape, unsupported field) do not improve by retrying unchanged.
- Ambiguous failures (`COLLAB_SYNC_FAILED`, `REWRITE_BARRIER_FAILED`, `PROJECTION_STALE`, `INTERNAL_ERROR`, `5xx`, network timeout, or any `202` with `collab.status: "pending"`) may already have written. Re-read `/state`, check whether the intended mark/edit exists, and retry only if it is absent.
- Idempotency only protects the exact same request. Changing the body or key creates a new logical write.

Break the loop and report a bug if verification cannot prove whether the write landed. Duplicate suggestions/comments usually come from retrying ambiguous failures without this state check.

**When the loop breaks.** If a mutation keeps failing after a fresh read and one retry, or two reads disagree about state, call `POST https://www.proofeditor.ai/api/bridge/report_bug` with the request ID, slug, and raw response body before falling back. Don't silently skip — that loses the audit trail the user is relying on.

---

## Phase 3: Terminal Report

Exception-based. Don't replay what the user can already see in the Proof doc — the full reasoning for each thread lives there. The terminal is for the decisions the user needs to make next.

Every report covers three things, phrased naturally for the current state:

- **What got handled** (e.g., how many comments resolved, any edits auto-applied)
- **What's still open** — if any escalations remain, each one gets one line of anchored quote plus one line of the agent's reply or question. Fuller context stays in the Proof thread
- **The doc URL** — always include it; the user may have closed the tab

Keep the whole report scannable at a glance. Three common shapes fall out of this naturally:

- A clean pass with everything handled collapses to a single line plus the doc URL
- An escalation pass lists the open threads compactly after a one-line summary of what was handled
- A pass with no new feedback just notes that and points to the doc

Phrase them in whatever voice matches the situation rather than matching a template — "handled 4, 1 still needs you" and "all 5 addressed, doc's ready" are both fine.

---

## Phase 4: Next-Signal Prompt

Ask the user with the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). If no question tool is available, present the options in chat and wait for the reply.

**Question:** "Proof review pass done. What's next?"

Offer options that cover these intents — use concrete user-facing labels, not agent-internal jargon (no "end-sync", "ingest pass", etc.). Only include the options that fit the current state. Keep labels imperative and third-person (no "I'll" / "I'm" — it is ambiguous in a tool-mediated menu whether the speaker is the user or the agent) and keep the `[short label] — [description]` shape consistent across every option. A "still working, come back later" option is not offered: the blocking question already waits, so that option would be a no-op wrapper (per the Interactive Question Tool Design rules in `plugins/galeharness-cli/AGENTS.md`).

- **Discuss** → `Discuss — walk through the open threads in terminal`
  Talk through open threads in the terminal; the agent echoes decisions back to Proof threads. Only useful when escalations are open.
- **Proceed** → `Save — save the reviewed doc back to the local file`
  Go to Phase 5 end-sync. If escalations are still open, name that in the label (e.g., `Save with 3 threads still open`) so the user is accepting the tradeoff explicitly instead of via a nested confirm.
- **Another pass** → `Re-check — look for new comments in Proof`
  Re-read state and re-ingest. Worth offering even after a clean pass, since the user may have added comments while the report rendered.
- **Done for now** → `Pause — stop without saving`
  Stop without syncing; return to caller with `status: done_for_now`, no end-sync.

The sync confirmation happens in Phase 5 regardless of whether threads are open — this step only asks what the user wants next, not whether to overwrite the local file.

---

## Phase 5: End-Sync

Runs when the user selects **Proceed**. Before prompting anything, check whether the Proof content actually diverged from what was uploaded — if not, there's nothing to sync and no reason to ask.

1. Fetch current state: `GET /api/agent/{slug}/state` with `x-share-token: <token>`. Save the full response body to a temp file (`$STATE_TMP`) so the markdown bytes can later be streamed to disk without passing through `$(...)` (which would strip trailing newlines). Extract `state.revision` from that file into `$REVISION`. Read `state.markdown` from that file for the comparison in step 2.

2. Compare `state.markdown` to `uploadedMarkdown` (captured in Phase 1).

   **If identical** — no content changes happened during the session. Skip the sync prompt entirely. Display:

   ```
   No changes to sync. Local file is unchanged.
   Doc: <tokenUrl>
   ```

   Set presence `status: completed`, summary `"Review complete, no changes"`. Return to the caller with `status: proceeded`, `localSynced: true` (local matches Proof — no write needed, local is not stale), `revision: <state.revision>`, and the rest of the standard fields.

   **If different** — continue to step 3.

3. Ask with the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension)). If no question tool is available, present the options in chat and wait for the reply.

   **Question:** "Sync the reviewed doc back to `<localPath>`? Proof has your review changes; local still has the pre-review copy."

   **Options:**
   - **Yes, sync now** (default, recommended)
   - **Not yet, I'll pull it later** (returns to caller with `localSynced: false`)

   Why the extra prompt: the user may have started review hours ago and lost track of the local file at stake. A brief confirm makes the file write visible rather than a silent side-effect of clicking Proceed earlier. The caller signals via `localSynced` so downstream workflows can warn that local is stale.

4. On **Yes, sync now**, write the fetched markdown to local — see `Workflow: Pull a Proof Doc to Local` in `SKILL.md`:

   ```bash
   # $STATE_TMP is the temp file holding the /state response from step 1.
   TMP="${SOURCE}.proof-sync.$$"
   jq -jr '.markdown' "$STATE_TMP" > "$TMP" && mv "$TMP" "$SOURCE"
   rm "$STATE_TMP"
   ```

   Stream `.markdown` bytes directly from the saved state file with `jq -jr` — do not capture the markdown into a shell variable, since `$(...)` would strip trailing newlines and corrupt the write. `$REVISION` (extracted separately in step 1) is safe to keep as a variable; it's an opaque scalar.

   On **Not yet**, skip the write (still clean up `$STATE_TMP`).

5. Set presence `status: completed`, summary `"Review synced to <localPath>"` (or `"Review complete, local not updated"` if sync was declined) so the Proof UI shows the loop has finished.

6. Display one of:

   Synced:
   ```
   Doc synced to <localPath> (revision <N>).
   Doc: <tokenUrl>
   ```

   Declined:
   ```
   Review complete. Local file kept as-is — pull from Proof when ready.
   Doc: <tokenUrl>
   ```

7. Return to the caller with:
   ```
   status: proceeded
   localPath: <source>
   localSynced: true | false
   docUrl: <tokenUrl>
   openThreadCount: <K>
   revision: <N>
   ```

Do **not** delete the Proof doc. It remains the durable review record; the caller's workflow may want to link back to it.

---

## Recipes

### BaseToken-aware mutation

```bash
SLUG=<slug>
TOKEN=<accessToken>
AGENT_ID=ai:galeharness-cli

mutate() {
  local PAYLOAD="$1"  # JSON object without baseToken
  local BASE IDEM_KEY BODY RESP CODE ERR

  BASE=$(curl -s "https://www.proofeditor.ai/api/agent/$SLUG/state" \
    -H "x-share-token: $TOKEN" | jq -r '.mutationBase.token')
  IDEM_KEY=$(uuidgen)
  BODY=$(jq -n --arg base "$BASE" --argjson payload "$PAYLOAD" '$payload + {baseToken: $base}')

  RESP=$(mktemp)
  CODE=$(curl -s -o "$RESP" -w "%{http_code}" -X POST "https://www.proofeditor.ai/api/agent/$SLUG/ops" \
    -H "Content-Type: application/json" \
    -H "x-share-token: $TOKEN" \
    -H "X-Agent-Id: $AGENT_ID" \
    -H "Idempotency-Key: $IDEM_KEY" \
    -d "$BODY")

  if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 300 ]; then
    cat "$RESP"
    rm "$RESP"
    return 0
  fi

  ERR=$(jq -r '.error.code // .code // empty' "$RESP" 2>/dev/null)
  case "$ERR" in
    STALE_BASE|BASE_TOKEN_REQUIRED|MISSING_BASE|INVALID_BASE_TOKEN)
      BASE=$(curl -s "https://www.proofeditor.ai/api/agent/$SLUG/state" \
        -H "x-share-token: $TOKEN" | jq -r '.mutationBase.token')
      BODY=$(jq -n --arg base "$BASE" --argjson payload "$PAYLOAD" '$payload + {baseToken: $base}')
      # Reuse the same idempotency key: this is still the same logical write.
      curl -s -X POST "https://www.proofeditor.ai/api/agent/$SLUG/ops" \
        -H "Content-Type: application/json" \
        -H "x-share-token: $TOKEN" \
        -H "X-Agent-Id: $AGENT_ID" \
        -H "Idempotency-Key: $IDEM_KEY" \
        -d "$BODY"
      ;;
    *)
      cat "$RESP" >&2
      rm "$RESP"
      return 1
      ;;
  esac

  rm "$RESP"
}
```

Every logical mutation starts with a fresh `Idempotency-Key`; retries of the same logical mutation reuse that same key. This is required when `/state.contract.idempotencyRequired` is true and harmless otherwise.

For ambiguous failures (`5xx`, network timeout, `COLLAB_SYNC_FAILED`, `PROJECTION_STALE`, etc.), do not call `mutate` again immediately. Re-read `/state`, verify whether the intended reply/comment/edit is already present, and only issue a new logical write if it is absent.

### jq gotcha when inspecting responses

When extracting fields from API responses with jq's `//` alternative operator, parenthesize inside object constructors — jq parses `{markId: .markId // .result.markId}` as a syntax error. Use `{markId: (.markId // .result.markId)}`, or pull the value outside the object: `jq -r '.markId // .result.markId'`.

### Identity

All ops must include:
- `by: "ai:galeharness-cli"` in the request body
- `X-Agent-Id: ai:galeharness-cli` in headers (required for presence; recommended for ops for consistent attribution)

Display name `GaleHarness CLI` is bound via `POST /presence` with `{"name":"GaleHarness CLI", ...}`. Set this once after upload; it carries across subsequent ops.
