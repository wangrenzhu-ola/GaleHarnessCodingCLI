---
title: "GaleHarness Task Board: SQLite Migration Pitfalls and Frontend Fixes"
date: 2026-04-17
category: integration-issues
problem_type: integration_issue
tags: [sqlite, bun, react, caching, testing]
module: galeharness-task-board
---

# GaleHarness Task Board: SQLite Migration Pitfalls and Frontend Fixes

## Problem

After migrating the GaleHarness Task Board from JSONL (`~/.galeharness/tasks.jsonl`) to SQLite (`~/.galeharness/tasks.db`), several P0/P1 issues emerged across the backend, frontend, and test layers. The board needed to reliably read from SQLite (without write responsibility), fix frontend caching and styling bugs, and achieve full integration test coverage.

## Symptoms

- `SQLiteError: flags must include SQLITE_OPEN_READONLY or SQLITE_OPEN_READWRITE` when opening the database with invalid `bun:sqlite` options (`{ readonly: true }` is not valid)
- `Database()` constructor called outside `try/catch`, causing unhandled crashes on corrupt/missing DB files
- Frontend `usePR` hook cached PR data by `taskId` instead of `prUrl`, causing stale data when a task's linked PR changed
- Imperative DOM mutations via `onMouseEnter/Leave` in React components, creating virtual DOM drift and per-instance `<style>` tag injection
- Missing skill type filter in the task list UI
- No integration tests for the SQLite read path; tests only covered the pure `mergeEvents` function

## What Didn't Work

- Using `new Database(path, { readonly: true })` — `bun:sqlite` does not accept a `readonly` key. The correct approach for read-only with schema creation fallback is `{ readwrite: true, create: false }` (schema creation requires write, but `create: false` prevents creating a new file if it doesn't exist)
- Spreading a destructured object (`({ ...task }) => task`) to "sanitize" it — this is a no-op and does not strip fields like `project_path`
- Using `localeCompare` on ISO timestamp strings for sorting — works for well-formed ISO strings but fails silently on malformed dates; numeric `Date.getTime()` comparison is more robust
- Letting each `TaskCard` instance inject its own `<style>` tag for `@keyframes blink` — bloats the DOM and breaks React's declarative model

## Solution

### 1. Fix `bun:sqlite` database opening and error handling

**Before:**
```ts
const db = new Database(DB_PATH, { readonly: true })
try {
  // query
} catch (err) { /* ... */ } finally {
  db.close()
}
```

**After:**
```ts
export async function readAndMergeTasks(overrideDbPath?: string): Promise<DerivedTask[]> {
  const dbPath = overrideDbPath ?? DB_PATH
  if (!existsSync(dbPath)) return []

  try {
    const db = new Database(dbPath, { readwrite: true, create: false })
    try {
      db.run(`CREATE TABLE IF NOT EXISTS task_events (...)`)
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events(task_id)`)
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_events_timestamp ON task_events(timestamp)`)
      const query = db.query(`SELECT ... FROM task_events ORDER BY timestamp ASC`)
      const rows = query.all() as TaskEvent[]
      query.finalize()
      return mergeEvents(rows)
    } finally {
      db.close()
    }
  } catch (err) {
    console.error("Failed to read tasks db:", err)
    return []
  }
}
```

Key decisions:
- `readwrite: true, create: false` allows schema `CREATE IF NOT EXISTS` while still failing safely if the file is not a valid DB
- Constructor is inside `try/catch`
- `finally` ensures `db.close()` even on query errors
- Returns `[]` for missing, locked, or corrupted DBs

### 2. Harden `mergeEvents` sorting and stale detection

```ts
evs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
// ...
const startedMs = new Date(started_at).getTime()
const hours = staleHours ?? STALE_HOURS
const staleMs = hours * 60 * 60 * 1000
const currentTime = now ?? Date.now()
if (!Number.isNaN(startedMs) && currentTime - startedMs > staleMs) {
  status = "stale"
}
```

Also added `Number.isFinite()` guard for `BOARD_STALE_HOURS` environment variable.

### 3. Fix frontend `usePR` cache key

**Before:**
```ts
export function usePR(taskId: string) {
  // cache keyed by taskId
}
```

**After:**
```ts
export function usePR(taskId: string, prUrl: string) {
  if (cache.has(prUrl)) {
    setPR(cache.get(prUrl)!)
    return
  }
  // fetch and cache.set(prUrl, data.pr)
}
```

### 4. Replace imperative hover DOM mutations with global CSS

Moved all hover effects into `frontend/index.html` global `<style>`:

```css
.task-card:hover {
  border-color: #00ffff !important;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1) !important;
  background: rgba(30, 30, 50, 0.9) !important;
}
.filter-btn:hover {
  border-color: var(--hover-color) !important;
  color: var(--hover-color) !important;
}
```

Removed `onMouseEnter/Leave` handlers and per-instance `<style>` tags from `TaskCard.tsx` and `TaskList.tsx`.

### 5. Add skill filter and task timeline UI

- `TaskList.tsx`: Added `skillFilter` state and a `<select>` dropdown populated from unique `task.skill` values
- `TaskCard.tsx`: Added an "执行时间线" (execution timeline) section in the expanded detail view, showing `started_at`, `completed_at`/`failed_at`, and `stale` status

### 6. Add SQLite integration tests

Created temporary DB fixtures using `mkdtempSync` and `Database`, testing:
- Normal read and merge from SQLite
- Missing DB → `[]`
- Corrupted DB → `[]` with error logged
- Empty DB → schema auto-created via `CREATE TABLE/INDEX IF NOT EXISTS`
- Stale boundary cases with injected `now` parameter

## Why This Works

- `bun:sqlite` requires explicit readwrite flags when schema mutations are possible, even for a nominally "read-only" board that just ensures tables exist
- Caching by the actual data identifier (`prUrl`) rather than the container (`taskId`) prevents stale cache hits when the underlying resource changes
- React components should not imperatively mutate DOM styles; CSS `:hover` and custom properties are declarative, performant, and don't fight React's reconciliation
- Integration tests against a real SQLite file prove the actual read path works, rather than only testing pure in-memory logic

## Prevention

1. **Always test `bun:sqlite` flags against the actual runtime.** The Bun SQLite API differs from better-known Node SQLite libraries. Verify with a real file, not just type-checking.
2. **Cache by the resource URL/ID, not the parent container ID.** If fetching data about `prUrl`, the cache key should be `prUrl`.
3. **Avoid `onMouseEnter/Leave` for simple hover states in React.** Use CSS `:hover` and custom properties (`--hover-color`) for dynamic color theming.
4. **Don't rely on pure-function unit tests for I/O paths.** Add integration tests that exercise the actual database/driver/file system, especially for error paths (missing files, corruption, locking).
5. **When stripping sensitive fields for HTTP responses, be explicit.** `({ project_path, ...rest }) => rest` is explicit; `({ ...task }) => task` is a no-op.
