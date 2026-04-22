---
title: "HKTMemory PR #2 Review — Critical Bugs in Session Search and Recall Orchestrator"
date: 2026-04-21
last_updated: 2026-04-21
category: best-practices
module: hktmemory
problem_type: best_practice
component: service_object
severity: high
applies_when:
  - Reviewing or implementing memory system features involving mode selection, token budgets, or BM25 indexing
  - Adding regex-based secret detection to Python services
  - Implementing fallback search paths with optional external indexes
  - Writing classification heuristics that risk over-matching
related_components:
  - tooling
  - database
tags:
  - hktmemory
  - code-review
  - session-search
  - recall-orchestrator
  - memory-safety
  - bm25-index
  - token-budget
  - mode-normalization
---

# HKTMemory PR #2 Review — Critical Bugs in Session Search and Recall Orchestrator

## Context

During code review of PR #2 (`feat/session-search-recent-mode`, 14 files, ~2,800 lines), which added session transcript search, a recall orchestrator, a memory safety gate, and a prefetch provider to HKTMemory v5, multiple critical bugs were identified across `runtime/orchestrator.py`, `runtime/safety.py`, and `layers/manager_v5.py`. These bugs share a common theme: **silent failures** — they don't raise exceptions but produce incorrect behavior, security gaps, or data inconsistency.

This document captures the most severe findings, their root causes, and concrete prevention strategies to avoid recurrence in future memory-system work.

## Guidance

### 1. Alias normalization dicts must include self-mapping

When normalizing mode aliases, always include the canonical name as a key mapping to itself. Omitting it causes the canonical form to fall through to the default.

### 2. Token budget checks must not have "first-item free" loopholes

A budget guard like `if total + cost > budget and results:` lets the first item bypass the limit entirely. Use `if total + cost > budget:` without the extra guard.

### 3. Secret-detection regexes must handle quoted values and non-word-prefix keys

`\b(api[_-]?key...)` fails on `_api_key` (underscore prefix) and `api_key = "secret"` (quoted value). Test regexes against realistic secret formats including quoted strings and various prefix styles.

### 4. Heuristic classification should be explicit, not overly broad

Falling back to `scope.startswith("session:")` as a transcript classifier catches non-transcript entries. Use explicit markers (`artifact_type == "session_transcript"`) and fail closed.

### 5. Index sync errors must be propagated or logged, never silently discarded

When a BM25 or secondary-index update returns `False`, the calling code must either raise, log, or bubble the failure. Discarding the return value creates invisible desync.

### 6. Don't trigger expensive full rebuilds on targeted operations

`forget()` and `restore()` already perform targeted index updates. Calling `rebuild_aggregates()` (O(N) full rebuild) on every targeted operation wastes time and hides targeted-update bugs.

## Examples (continued)

### Bug 6: Expensive full rebuild on forget/restore

**Before (buggy):**

```python
def forget(self, memory_id: str, force: bool = False) -> Dict[str, Any]:
    ...
    return {
        **result,
        "removed_from_session_transcript_index": transcript_removed,
        "aggregate_rebuild": self.rebuild_aggregates(),  # O(N) full rebuild
    }

def restore(self, memory_id: str) -> Dict[str, Any]:
    ...
    return {
        **result,
        "restored_to_session_transcript_index": transcript_reindexed,
        "aggregate_rebuild": self.rebuild_aggregates(),  # O(N) full rebuild
    }
```

**After (fixed):**

```python
def forget(self, memory_id: str, force: bool = False) -> Dict[str, Any]:
    ...
    return {
        **result,
        "removed_from_session_transcript_index": transcript_removed,
    }

def restore(self, memory_id: str) -> Dict[str, Any]:
    ...
    return {
        **result,
        "restored_to_session_transcript_index": transcript_reindexed,
    }
```

The targeted updates (`_remove_session_transcript_index_entry` / `_sync_session_transcript_index_memory`) already keep the transcript index consistent. The full rebuild is redundant and obscures whether the targeted update itself is working correctly.

## Why This Matters

Silent failures are the most dangerous category of bug because:

- **They reach production.** No exception means no alerting, no test failure, no user complaint until downstream behavior is visibly wrong.
- **They're hard to debug.** By the time the symptom appears (wrong mode selected, budget exceeded, secret leaked), the original cause is buried under layers of correct-looking code.
- **They compound.** A desynced BM25 index silently returns stale or missing results, which then trains users to distrust search, which then causes workarounds that embed the bug deeper.

The `_normalize_mode` bug is particularly insidious: `task_start` is the *canonical* mode name, yet it remaps to `implement` because the aliases dict omits the self-key. This means any caller passing the documented canonical mode gets silently downgraded.

## When to Apply

- Any PR touching `runtime/orchestrator.py`, `runtime/safety.py`, or `layers/manager_v5.py`
- Adding new MCP tool parameters with aliases or fallback defaults
- Introducing regex-based detection (secrets, PII, injection patterns)
- Implementing BM25 or secondary-index lifecycle operations (store, forget, restore, rebuild)
- Writing token-budget or rate-limit logic with early-iteration special cases

## Examples

### Bug 1: Missing self-mapping in mode alias dict

**Before (buggy):**

```python
def _normalize_mode(self, mode: Optional[str]) -> str:
    lowered = str(mode or "implement").strip().lower()
    aliases = {
        "start": "task_start",
        "task-start": "task_start",
        "implement": "implement",
        # MISSING: "task_start": "task_start"
    }
    return aliases.get(lowered, "implement")
```

**After (fixed):**

```python
def _normalize_mode(self, mode: Optional[str]) -> str:
    lowered = str(mode or "implement").strip().lower()
    aliases = {
        "start": "task_start",
        "task-start": "task_start",
        "task_start": "task_start",  # self-mapping
        "implement": "implement",
    }
    return aliases.get(lowered, "implement")
```

### Bug 2: First item bypasses token budget

**Before (buggy):**

```python
for snippet in candidates:
    if total_chars + len(snippet) > budget_chars and results:
        break  # First item always passes because results is empty
    results.append(snippet)
    total_chars += len(snippet)
```

**After (fixed):**

```python
for snippet in candidates:
    if total_chars + len(snippet) > budget_chars:
        break  # Budget applies to every item, including the first
    results.append(snippet)
    total_chars += len(snippet)
```

### Bug 3: Credential regex misses quoted secrets and underscore-prefixed keys

**Before (buggy):**

```python
(
    "credential_assignment",
    re.compile(
        r"\b(api[_-]?key|access[_-]?token|token|password|passwd|secret)\s*[:=]\s*([^\s'\"`;,]+)",
        re.IGNORECASE,
    ),
),
```

This pattern:
- Misses `_api_key` because `\b` doesn't match after `_`
- Misses `api_key = "shh-secret"` because the value capture stops at `"`

**After (fixed):**

```python
(
    "credential_assignment",
    re.compile(
        r"(?<![A-Za-z0-9])(api[_-]?key|access[_-]?token|token|password|passwd|secret)"
        r"\s*[:=]\s*('[^']*'|\"[^\"]*\"|`[^`]*`|[^\s'\"`;,]+)",
        re.IGNORECASE,
    ),
),
```

`(?<![A-Za-z0-9])` ensures the key is preceded by a non-alphanumeric (or start of string), so `_api_key` matches while `myapi_key` does not. The value group captures quoted strings (single, double, backtick) as well as bare tokens.

Also test regexes against a corpus including:

```python
test_cases = [
    'api_key=sk-123',           # basic
    '_api_key = "sk-123"',      # underscore prefix + quoted
    'access_token=`tok`',       # backtick quoted
    "password:'hunter2'",       # colon + single-quoted
    'secret=shh',               # short unquoted
]
```

Consider using a dedicated secret-scanning library (e.g., `git-secrets` patterns, `detect-secrets`) rather than maintaining ad-hoc regexes.

### Bug 4: Overly broad session transcript heuristic

**Before (buggy):**

```python
def _is_session_transcript_entry(self, entry: Dict[str, Any]) -> bool:
    metadata = entry.get("metadata", {}) or {}
    scope = str(entry.get("scope") or metadata.get("scope") or "")
    return (
        metadata.get("artifact_type") == "session_transcript"
        or metadata.get("source") == "auto_capture"
        or scope.startswith("session:")  # Catches non-transcripts too
    )
```

**After (fixed):**

```python
def _is_session_transcript_entry(self, entry: Dict[str, Any]) -> bool:
    metadata = entry.get("metadata", {}) or {}
    # Explicit marker first — fail closed
    if metadata.get("artifact_type") == "session_transcript":
        return True
    # Narrow fallback: both source AND scope must match
    if metadata.get("source") == "auto_capture" and scope.startswith("session:"):
        return True
    return False
```

### Bug 5: Silent index sync failure

**Before (buggy):**

```python
if entry and self._is_session_transcript_entry(entry):
    self._sync_session_transcript_index_memory(l2_id)
# Return value discarded — failure is invisible
```

**After (fixed):**

```python
if entry and self._is_session_transcript_entry(entry):
    sync_ok = self._sync_session_transcript_index_memory(l2_id)
    if not sync_ok:
        print(f"⚠️ Session transcript index sync failed for {l2_id}")
```

## Related

- [HKTMemory v5 → 生产级 Agent 自治记忆：差距闭合方案](../hktmemory-openvikings-gap-closure-roadmap.md) — Prior roadmap documenting Auto-Recall orchestrator design (TASK-03) and session scope lifecycle
- [TASK-06/07/08 实现总结](../implement-task-06-07-08-knowledge-graph-reflection-sqlite-vector.md) — MCP tool extension patterns and lifecycle manifest integration
- PR #2: `feat/session-search-recent-mode` — The reviewed PR adding session transcript search, recall orchestrator, memory safety gate, and prefetch provider
- Fix commit: `a398d0d` — Address 6 critical bugs from PR #2 code review
