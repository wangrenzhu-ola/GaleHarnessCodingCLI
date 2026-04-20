# GaleHarness Task Board — Requirements

**Date:** 2026-04-17  
**Status:** Ready for Planning  
**Scope:** GaleHarnessCodingTaskBoard repo — Web UI for tracking gh: skill executions

---

## Problem

GaleHarnessCLI provides a rich set of `gh:` workflow skills (brainstorm → plan → work → compound). But once a session ends, there is no persistent, cross-project view of what was worked on, what knowledge was captured, and what PRs were produced. Engineers lose context switching between repos and have no way to audit the output of their AI-assisted workflows at a glance.

Note: `ce-sessions` provides conversational retrieval of past session history. This board complements it by offering a persistent visual overview with PR status, project grouping, and HKTMemory linkage — neither of which `ce-sessions` provides.

---

## Goal

Build a local-first task board that makes every `gh:` skill invocation visible — across all projects on the developer's machine — with links to associated PRs and HKTMemory knowledge entries.

---

## Users

Single user: the engineer running GaleHarnessCLI on their local machine.

> Scope decision: Multi-user, shared machines, and remote-hosted boards are out of scope for this version.

---

## Functional Requirements

### FR-1: Global Task Log (Data Contract)

The task log uses a **SQLite database** stored locally. The board is **read-only**; writes are performed by the GaleHarnessCLI platform layer (skill dispatcher), not by individual skills.

**Why SQLite instead of JSONL:**
- Bun ships with `bun:sqlite` (zero dependencies).
- WAL mode handles concurrent reads/writes safely across multiple CLI processes.
- Transactions eliminate truncated/corrupt records.
- Querying and indexing are standard, not hand-rolled.

**Storage location:** `~/.galeharness/tasks.db`

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  project TEXT,
  project_path TEXT,
  skill TEXT,
  title TEXT,
  parent_task_id TEXT,
  error TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  memory_id TEXT,
  memory_title TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_task_id ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON task_events(timestamp);
```

**Schema ownership:** The board's `server/lib/events-reader.ts` must execute `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` on first read. This ensures the db file is valid even if GaleHarnessCLI's writer has not yet run, and avoids "table not found" errors on first launch.

**Event types:**

| `event_type` | When written |
|---|---|
| `skill_started` | At skill invocation start; written by the CLI dispatcher |
| `skill_completed` | At skill completion; written by the CLI dispatcher |
| `skill_failed` | If the skill exits with an error or is interrupted; written by the CLI dispatcher |
| `pr_linked` | When a PR number/URL becomes known (may be after `skill_completed`) |
| `memory_linked` | When an HKTMemory entry is created during the task |

**Fields per event (all events):**

| Field | Description |
|-------|-------------|
| `task_id` | UUID generated once at `skill_started`; all subsequent events for this task share the same `task_id` |
| `event_type` | One of the types above |
| `timestamp` | ISO 8601 |
| `project` | Git remote repo name (from `git remote get-url origin`) if available; falls back to working directory basename |
| `project_path` | Absolute path to the project root (used for git resolution; stripped before sending to browser) |
| `skill` | The `gh:` skill called (e.g., `gh:brainstorm`, `gh:work`) |

**Additional fields by event type:**

- `skill_started`: `title` (short description of the task), `parent_task_id` (nullable — links to a prior task in the same logical workflow)
- `skill_completed`: no extra fields beyond core
- `skill_failed`: `error` (short error message, optional)
- `pr_linked`: `pr_number`, `pr_url`
- `memory_linked`: `memory_id`, `memory_title` (copied from HKTMemory manifest at write time to avoid later resolution)

**Derived task state (board read layer):**

The board reads all events, groups by `task_id`, and computes:
- `status`: `in_progress` (only `skill_started` seen) | `completed` | `failed`
- `started_at`: timestamp of the earliest `skill_started`
- `completed_at`: timestamp of the latest `skill_completed` or `skill_failed`
- `skill`: the `skill` value from the **latest** `skill_started` event (last-write-wins)
- `pr_url`, `pr_number`: from the latest `pr_linked` event (last-write-wins)
- `memory_ids`: collected from all `memory_linked` events (array accumulation)

> Note: `skill_chain` (a multi-step chain like `brainstorm → plan → work`) is **explicitly out of scope for MVP**. The `parent_task_id` field is reserved for future chaining, but the board only displays the single most recent `skill` per task in this version.

**Error handling requirements for the read layer:**
- If `tasks.db` does not exist, return an empty task list (first-run experience).
- If the db file exists but cannot be opened (corrupt, permission denied, locked), catch the error, log it to stderr, and return an empty task list. The board must never crash the HTTP request due to local db issues.
- Malformed `timestamp` values must not crash stale detection. If a timestamp is unparseable, the task retains `in_progress` status rather than becoming `stale`.

### FR-2: Web UI — Task Board View

The board displays all recorded tasks as cards, grouped or sorted by recency.

**Board layout:**
- Cards ordered by `started_at` descending (most recent first)
- Each card shows:
  - Task title
  - Project name (badge)
  - Skill name (single skill, not chain)
  - Status indicator (`in_progress`, `completed`, `failed`)
  - Start time (formatted as `MM-DD HH:mm`)
  - PR link (if `pr_url` is set): clickable, opens in browser
  - HKTMemory entries count with expandable list showing `memory_id` + title
- Clicking a card expands it to show full detail

**Filtering:**
- Filter by project name
- Filter by status
- Filter by skill type (e.g., show only `gh:work` tasks) — **MVP requirement**

**Search:**
- Full-text search across task titles

### FR-3: Task Detail View

Expanding or navigating to a task shows:
- All fields from FR-1
- Skill execution timeline: show each lifecycle event (`skill_started`, `skill_completed`, `skill_failed`) with its timestamp
- HKTMemory entries: each entry shows `memory_id`, `memory_title`
- PR details: PR title, state (open/merged/closed), author, created date
- Error message (if `skill_failed`)

### FR-4: Local Server

The board runs as a local HTTP server:
- Start command: `bun run board` or `bun run dev` from the repo root
- Default port: `4321` (configurable via env `BOARD_PORT`)
- Reads `~/.galeharness/tasks.db` on each API request (no caching needed for MVP)
- No authentication (local-only, loopback). The server MUST bind to `127.0.0.1`, not `0.0.0.0`.

### FR-5: GitHub PR Data

For tasks with a `pr_url`, the board server-side fetches PR status via the `gh` CLI (using the local user's authenticated session). This keeps the GitHub token on the server side and never exposes it to the browser.

- Displayed: PR title, state (open/merged/closed), author, created date
- Fetch timing: on-demand when a task card is expanded, not on board page load (avoids N GitHub calls per load)
- Graceful degradation: if `gh` is unavailable, unauthenticated, or the network is unreachable, show the stored `pr_url` as a plain clickable link
- Caching: responses cached for 5 minutes in-process (TTL per `pr_url`) to avoid redundant API calls on re-expand
- **Frontend cache requirement:** The frontend `usePR` hook must use the `pr_url` as its cache key (or a composite of `taskId + pr_url`), not just `taskId`. This ensures that if a task's PR URL changes, the frontend fetches the new PR data instead of serving stale cache.

---

## Non-Goals (Explicit Scope Boundaries)

- **No write-back:** The board is read-only. It does not trigger, restart, or modify tasks.
- **No real-time push:** No WebSocket or SSE. Page refresh or manual reload is sufficient for MVP.
- **No multi-user / team sharing:** Single local user only.
- **No file browser:** The board does not serve or display file contents from project repos.
- **No HKTMemory search:** The board shows which memories were created per task, but does not provide a full memory search UI. That belongs to HKTMemory's own tooling.
- **No mobile / responsive:** Desktop browser only for MVP.
- **No authentication or HTTPS:** Local loopback only.
- **No skill_chain multi-step visualization:** Only single skill per task for MVP. `parent_task_id` is stored but not traversed.

---

## Success Criteria

1. Running `bun run board` opens a board in the browser showing tasks from all local projects that used `gh:` skills.
2. A task created by `gh:brainstorm` appears on the next page load with project, title, skill, and status — without requiring any manual data entry.
3. Once `gh:work` produces a PR, the board shows the PR link and live status without any manual data entry.
4. HKTMemory entries created during a task are listed on the task card with their titles.
5. Filtering by project reduces the visible cards to only that project's tasks.
6. Filtering by skill type (e.g., `gh:work`) works correctly.
7. When `gh:` skills have been used in 3 or more distinct repos, the board shows tasks from all of them in a single view, correctly grouped by project name.
8. `bun test` passes with integration tests covering the SQLite read path, stale status logic, and error handling.

---

## Open Questions

1. **Task continuity rules:** When a user runs `gh:work` after `gh:plan` in a new session but for the same feature, should the board link them as one logical task chain? The `parent_task_id` field supports this, but the rule for determining continuity (same brainstorm doc? same branch? user-declared?) must be defined in the CLI dispatcher design.
2. **Empty / first-run state:** When `tasks.db` does not exist or contains zero entries, the board shows a welcome message explaining that tasks will appear here after the first `gh:` skill invocation. Exact copy is an implementation detail.
3. **`in_progress` staleness:** If a skill crashes without writing `skill_completed`, the task is permanently `in_progress`. The board should visually distinguish tasks that have been `in_progress` for more than a configurable threshold (default: 2 hours) as likely stale. Exact UX (e.g., greyed badge, tooltip) is an implementation detail.
