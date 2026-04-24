---
name: proof
description: Create, share, view, comment on, edit, and run human-in-the-loop review loops over markdown documents via Proof, the collaborative markdown editor at proofeditor.ai ("Proof editor"). Use when the user wants to render or view a local markdown file in Proof, share markdown to get a URL, iterate collaboratively on a Proof doc, comment on or suggest edits in Proof, HITL a spec/plan/draft for human review, sync a Proof doc back to local, or work from a proofeditor.ai URL. Trigger on phrases like "view this in proof", "share to proof", "iterate with proof", or "HITL this doc", and on gh-brainstorm / gh-ideate / gh-plan handoffs for human review. Also match clear requests for a rendered/shared markdown review surface even if the user does not name Proof. Do not trigger on "proof" meaning evidence, math/logic proof, burden of proof, proof-of-concept, or bare "proofread this" requests where inline text review is expected.
allowed-tools:
  - Bash
  - Read
  - Write
  - WebFetch
---

# Proof - Collaborative Markdown Editor

Proof is a collaborative document editor for humans and agents. It supports two modes:

1. **Web API** - Create and edit shared documents via HTTP (no install needed)
2. **Local Bridge** - Drive the macOS Proof app via localhost:9847

## Identity and Attribution

Every write to a Proof doc must be attributed. Two fields carry the agent's identity:

- **Machine ID (`by` on every op, `X-Agent-Id` header):** `ai:galeharness-cli` — stable, lowercase-hyphenated, machine-parseable. Appears in marks, events, and the API response.
- **Display name (`name` on `POST /presence`):** `GaleHarness CLI` — human-readable, shown in Proof's presence chips and comment-author badges.

Set the display name once per doc session by posting to presence with the `X-Agent-Id` header; Proof binds the name to that agent ID for the session. These values are the defaults for any caller of this skill; callers running HITL review (`references/hitl-review.md`) may pass a different `identity` pair if a distinct sub-agent should own the doc. Do not use `ai:compound` or other ad-hoc variants — identity stays uniform unless a caller explicitly overrides it.

## Human-in-the-Loop Review Mode

Human-in-the-loop iteration over an existing local markdown file: upload to Proof, let the user annotate in Proof's web UI, ingest feedback as in-thread replies and tracked edits, and sync the final doc back to disk. Two entry points, identical mechanics — load `references/hitl-review.md` for the full loop spec (invocation contract, mark classification, idempotent ingest passes, exception-based terminal reporting, end-sync atomic write) in either case:

- **Direct user request** — a bare user phrase naming a local markdown file and asking to iterate collaboratively via Proof: "share this to proof so we can iterate", "iterate with proof on this doc", "HITL this file with me", "let's get feedback on this in proof", "open this in proof editor so I can review". The file is whichever markdown the user just created, edited, or referenced; if ambiguous, ask which file. This is a first-class entry point — do not require an upstream caller.
- **Upstream skill handoff** — `gh-brainstorm`, `gh-ideate`, or `gh-plan` finishes a draft and hands it off for human review before the next phase, passing the file path and title explicitly.

## Web API (Primary for Sharing)

### Create a Shared Document

No authentication required. Returns a shareable URL with access token.

```bash
curl -X POST https://www.proofeditor.ai/share/markdown \
  -H "Content-Type: application/json" \
  -d '{"title":"My Doc","markdown":"# Hello\n\nContent here."}'
```

**Response format:**
```json
{
  "slug": "abc123",
  "tokenUrl": "https://www.proofeditor.ai/d/abc123?token=xxx",
  "accessToken": "xxx",
  "ownerSecret": "yyy",
  "_links": {
    "state": "https://www.proofeditor.ai/api/agent/abc123/state",
    "ops": "https://www.proofeditor.ai/api/agent/abc123/ops"
  }
}
```

Use the `tokenUrl` as the shareable link. The `_links` give you the exact API paths.

### Read a Shared Document

```bash
curl -s "https://www.proofeditor.ai/api/agent/{slug}/state" \
  -H "x-share-token: <token>"
```

### Edit a Shared Document

All operations go to `POST https://www.proofeditor.ai/api/agent/{slug}/ops`

**Note:** Use the `/api/agent/{slug}/ops` path (from `_links` in create response), NOT `/api/documents/{slug}/ops`.

**Authentication for protected docs:**
- Header: `x-share-token: <token>` or `Authorization: Bearer <token>`
- Token comes from the URL parameter: `?token=xxx` or the `accessToken` from create response
- Header: `X-Agent-Id: ai:galeharness-cli` (required for presence; include on ops for consistent attribution)

**Wire-format reminder.** `/api/agent/{slug}/ops` uses a top-level `type` field; `/api/agent/{slug}/edit/v2` uses an `operations` array where each entry has `op`. Do not mix — sending `op` to `/ops` returns 422.

**Every mutation requires a `baseToken`.** Use the `mutationBase.token` from your most recent `/state` or `/snapshot` read and include it in the request body. These tokens do not go stale within seconds just because another write happened; `STALE_BASE` is recoverable. If you get `BASE_TOKEN_REQUIRED`, `MISSING_BASE`, `INVALID_BASE_TOKEN`, or `STALE_BASE`, re-read and retry once. Only do a pre-mutation read when you have not read `/state` or `/snapshot` in the current session. See the baseToken recipe in `references/hitl-review.md`.

**`Idempotency-Key` header** is recommended on every mutation and required when `/state.contract.idempotencyRequired` is true. Reuse the same key only when retrying the exact same logical write with the same body. A changed body or fresh key is a new logical write.

**Retry discipline after mutation errors — verify before retrying.**

- Token errors (`STALE_BASE`, `BASE_TOKEN_REQUIRED`, `MISSING_BASE`, `INVALID_BASE_TOKEN`) are safe to auto-retry once after a fresh `/state` or `/snapshot`.
- Anchor errors (`QUOTE_NOT_FOUND`, `AMBIGUOUS_QUOTE`, missing block `ref`) mean the write did not commit, but do not blindly retry. Re-read, update the quote/ref, and decide whether the original intent still applies.
- Payload errors (`422`, invalid op shape, unsupported field) should not be retried unchanged.
- Ambiguous failures (`COLLAB_SYNC_FAILED`, `REWRITE_BARRIER_FAILED`, `PROJECTION_STALE`, `INTERNAL_ERROR`, `5xx`, network timeout, or any `202` with `collab.status: "pending"`) may already have written. Re-read `/state`, verify whether the intended mark/edit exists, and retry only if it is absent.
- Idempotency only protects retries of the exact same request. If you change the body or key, the server treats it as a new write.

Duplicate marks usually come from retrying after an ambiguous failure without first verifying current state.

**Comment on text:**
```json
{"type": "comment.add", "quote": "text to comment on", "by": "ai:galeharness-cli", "text": "Your comment here", "baseToken": "<token>"}
```

**Reply to a comment:**
```json
{"type": "comment.reply", "markId": "<id>", "by": "ai:galeharness-cli", "text": "Reply text", "baseToken": "<token>"}
```

**Resolve / unresolve a comment:**
```json
{"type": "comment.resolve", "markId": "<id>", "by": "ai:galeharness-cli", "baseToken": "<token>"}
{"type": "comment.unresolve", "markId": "<id>", "by": "ai:galeharness-cli", "baseToken": "<token>"}
```

**Suggest a replacement (pending — user must accept/reject):**
```json
{"type": "suggestion.add", "kind": "replace", "quote": "original text", "by": "ai:galeharness-cli", "content": "replacement text", "baseToken": "<token>"}
```

**Suggest and immediately apply (tracked but committed — user can reject to revert):**
```json
{"type": "suggestion.add", "kind": "replace", "quote": "original text", "by": "ai:galeharness-cli", "content": "replacement text", "status": "accepted", "baseToken": "<token>"}
```

`status: "accepted"` creates the suggestion mark and commits the change in one call. The mark persists as an audit trail with per-edit attribution and a reject-to-revert affordance. Works with `kind: "insert" | "delete" | "replace"`.

**Accept or reject an existing suggestion:**
```json
{"type": "suggestion.accept", "markId": "<id>", "by": "ai:galeharness-cli", "baseToken": "<token>"}
{"type": "suggestion.reject", "markId": "<id>", "by": "ai:galeharness-cli", "baseToken": "<token>"}
```

`suggestion.resolve` is not supported — use accept or reject instead.

**Bulk rewrite (whole-doc replacement):**
```json
{"type": "rewrite.apply", "content": "full new markdown", "by": "ai:galeharness-cli", "baseToken": "<token>"}
```

**Block-level edits via `/edit/v2`** (separate endpoint, separate shape):
```bash
curl -X POST "https://www.proofeditor.ai/api/agent/{slug}/edit/v2" \
  -H "Content-Type: application/json" \
  -H "x-share-token: <token>" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -H "Idempotency-Key: <uuid>" \
  -d '{
    "by": "ai:galeharness-cli",
    "baseToken": "mt1:<token>",
    "operations": [
      {"op": "replace_block", "ref": "b3", "block": {"markdown": "Updated paragraph."}},
      {"op": "insert_after", "ref": "b3", "blocks": [{"markdown": "## New section"}]}
    ]
  }'
```

Supported `op` kinds inside `operations`:

| op | Shape |
|----|-------|
| `replace_block` | `{"op":"replace_block","ref":"b8","block":{"markdown":"new content"}}` |
| `insert_after` | `{"op":"insert_after","ref":"b3","blocks":[{"markdown":"new block"}]}` |
| `insert_before` | `{"op":"insert_before","ref":"b3","blocks":[{"markdown":"new block"}]}` |
| `delete_block` | `{"op":"delete_block","ref":"b6"}` |
| `replace_range` | `{"op":"replace_range","fromRef":"b2","toRef":"b5","blocks":[{"markdown":"replacement"}]}` |
| `find_replace_in_block` | `{"op":"find_replace_in_block","ref":"b4","find":"old","replace":"new","occurrence":"first"}` |

`/edit/v2` commits the whole `operations` array atomically and can batch dozens of block edits in one request. Read `/snapshot` to get block `ref` IDs and the `mutationBase.token`; if any write has landed since the last snapshot, re-fetch `/snapshot` before building block operations.

**Editing while a client is connected is fine.** `/edit/v2`, `suggestion.add` (including `status: "accepted"`), and all comment ops work during active collab. Only `rewrite.apply` is blocked by `LIVE_CLIENTS_PRESENT` — it would clobber in-flight Yjs edits.

**When the loop breaks.** If a mutation keeps failing after a fresh read and one retry, or state across reads looks inconsistent, call `POST https://www.proofeditor.ai/api/bridge/report_bug` with the failing request ID, slug, and raw response. The server enriches and files an issue.

### Known Limitations (Web API)

- Bridge-style endpoints (`/d/{slug}/bridge/*`) require client version headers (`x-proof-client-version`, `x-proof-client-build`, `x-proof-client-protocol`) and return 426 CLIENT_UPGRADE_REQUIRED without them. Use `/api/agent/{slug}/ops` instead.

## Local Bridge (macOS App)

Requires Proof.app running. Bridge at `http://localhost:9847`.

**Required headers:**
- `X-Agent-Id: ai:galeharness-cli` (identity for presence)
- `Content-Type: application/json`
- `X-Window-Id: <uuid>` (when multiple docs open)

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/windows` | List open documents |
| GET | `/state` | Read markdown, cursor, word count |
| GET | `/marks` | List all suggestions and comments |
| POST | `/marks/suggest-replace` | `{"quote":"old","by":"ai:galeharness-cli","content":"new"}` |
| POST | `/marks/suggest-insert` | `{"quote":"after this","by":"ai:galeharness-cli","content":"insert"}` |
| POST | `/marks/suggest-delete` | `{"quote":"delete this","by":"ai:galeharness-cli"}` |
| POST | `/marks/comment` | `{"quote":"text","by":"ai:galeharness-cli","text":"comment"}` |
| POST | `/marks/reply` | `{"markId":"<id>","by":"ai:galeharness-cli","text":"reply"}` |
| POST | `/marks/resolve` | `{"markId":"<id>","by":"ai:galeharness-cli"}` |
| POST | `/marks/accept` | `{"markId":"<id>"}` |
| POST | `/marks/reject` | `{"markId":"<id>"}` |
| POST | `/rewrite` | `{"content":"full markdown","by":"ai:galeharness-cli"}` |
| POST | `/presence` | `{"status":"reading","summary":"..."}` |
| GET | `/events/pending` | Poll for user actions |

### Presence Statuses

`thinking`, `reading`, `idle`, `acting`, `waiting`, `completed`

## Workflow: Review a Shared Document

When given a Proof URL like `https://www.proofeditor.ai/d/abc123?token=xxx`:

1. Extract the slug (`abc123`) and token from the URL
2. Read the document state via the API
3. Add comments or suggest edits using the ops endpoint
4. The author sees changes in real-time

```bash
# Read once and reuse the mutationBase token from that response
STATE=$(curl -s "https://www.proofeditor.ai/api/agent/abc123/state" \
  -H "x-share-token: xxx")
BASE=$(printf '%s' "$STATE" | jq -r '.mutationBase.token')
# Inspect doc fields from "$STATE" as needed...

# Comment
curl -X POST "https://www.proofeditor.ai/api/agent/abc123/ops" \
  -H "Content-Type: application/json" \
  -H "x-share-token: xxx" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -d "$(jq -n --arg base "$BASE" '{type:"comment.add",quote:"text",by:"ai:galeharness-cli",text:"comment",baseToken:$base}')"

# Suggest edit (tracked, pending)
curl -X POST "https://www.proofeditor.ai/api/agent/abc123/ops" \
  -H "Content-Type: application/json" \
  -H "x-share-token: xxx" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -d "$(jq -n --arg base "$BASE" '{type:"suggestion.add",kind:"replace",quote:"old",by:"ai:galeharness-cli",content:"new",baseToken:$base}')"

# Suggest and immediately apply (tracked, committed)
curl -X POST "https://www.proofeditor.ai/api/agent/abc123/ops" \
  -H "Content-Type: application/json" \
  -H "x-share-token: xxx" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -d "$(jq -n --arg base "$BASE" '{type:"suggestion.add",kind:"replace",quote:"old",by:"ai:galeharness-cli",content:"new",status:"accepted",baseToken:$base}')"
```

## Workflow: Create and Share a New Document

```bash
# 1. Create
RESPONSE=$(curl -s -X POST https://www.proofeditor.ai/share/markdown \
  -H "Content-Type: application/json" \
  -d '{"title":"My Doc","markdown":"# Title\n\nContent here."}')

# 2. Extract URL and token
URL=$(echo "$RESPONSE" | jq -r '.tokenUrl')
SLUG=$(echo "$RESPONSE" | jq -r '.slug')
TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')

# 3. Bind display name via presence
curl -s -X POST "https://www.proofeditor.ai/api/agent/$SLUG/presence" \
  -H "Content-Type: application/json" \
  -H "x-share-token: $TOKEN" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -d '{"name":"GaleHarness CLI","status":"reading","summary":"Uploaded doc"}'

# 4. Share the URL
echo "$URL"

# 5. Make edits using the ops endpoint (baseToken required)
BASE=$(curl -s "https://www.proofeditor.ai/api/agent/$SLUG/state" \
  -H "x-share-token: $TOKEN" | jq -r '.mutationBase.token')
curl -X POST "https://www.proofeditor.ai/api/agent/$SLUG/ops" \
  -H "Content-Type: application/json" \
  -H "x-share-token: $TOKEN" \
  -H "X-Agent-Id: ai:galeharness-cli" \
  -d "$(jq -n --arg base "$BASE" '{type:"comment.add",quote:"Content here",by:"ai:galeharness-cli",text:"Added a note",baseToken:$base}')"
```

## Workflow: Pull a Proof Doc to Local

Sync the current Proof doc state to a local markdown file. Used by:

- HITL review end-sync (`references/hitl-review.md` Phase 5) when the doc originated from a local file
- Ad-hoc snapshots of a Proof doc to disk (before closing the tab, archiving, handing off)
- Refreshing a local working copy against the live Proof version

```bash
SLUG=<slug>
TOKEN=<accessToken>
LOCAL=<absolute-path>

# One read to a temp file — avoids passing markdown through $(...), which would strip trailing newlines.
STATE_TMP=$(mktemp)
curl -s "https://www.proofeditor.ai/api/agent/$SLUG/state" \
  -H "x-share-token: $TOKEN" > "$STATE_TMP"
REVISION=$(jq -r '.revision' "$STATE_TMP")

# Atomic write: stream .markdown bytes directly to a temp sibling, then rename.
TMP="${LOCAL}.proof-sync.$$"
jq -jr '.markdown' "$STATE_TMP" > "$TMP" && mv "$TMP" "$LOCAL"
rm "$STATE_TMP"
```

`jq -jr` (`-j` no trailing newline, `-r` raw string) streams the markdown bytes straight to the temp file without going through a shell variable, so trailing newlines survive intact. `mv` within the same filesystem is atomic — a crashed write leaves the original untouched rather than a half-written file.

**Confirm before writing when the pull isn't directly asked for.** If a workflow ends up pulling as a side-effect of a different action (e.g., HITL review completion), surface the impending write with a short confirm like "Sync reviewed doc to `<localPath>`?" A silent overwrite is surprising — the user may have forgotten the local file exists in that session, or expected Proof to stay canonical until they explicitly asked to pull.

## Safety

- Use `/state` content as source of truth before editing
- During active collab use `edit/v2` (direct block changes) or `suggestion.add` (tracked changes); reserve `rewrite.apply` for no-client scenarios since it's blocked by `LIVE_CLIENTS_PRESENT` when anyone is connected
- Don't span table cells in a single replace
- Always include `by: "ai:galeharness-cli"` on every op and `X-Agent-Id: ai:galeharness-cli` in headers for consistent attribution
- Reuse `baseToken` from your most recent `/state` or `/snapshot` read; on token errors, re-read and retry once
