---
name: gh:sessions
description: "Search and ask questions about your coding agent session history. Use when asking what you worked on, what was tried before, how a problem was investigated across sessions, what happened recently, or any question about past agent sessions. Also use when the user references prior sessions, previous attempts, or past investigations — even without saying 'sessions' explicitly."
---

# /gh:sessions

Search your session history.

## Usage

```
/gh:sessions [question or topic]
/gh:sessions
```

## Pre-resolved context

**Repo and Branch Context:**
Determine the current repository name and active git branch before dispatching. You can use native tools or simple safe commands (like `git rev-parse --abbrev-ref HEAD`) to find them. Do not use complex chained shell substitutions.
- For repo name: resolve the basename of the repository root (handle worktrees appropriately).
- For branch: resolve the current active branch.

If you cannot quickly determine these values, omit them from the dispatch and let the agent derive them at runtime.

## Execution

If no argument is provided, ask what the user wants to know about their session history. Use the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini). If no question tool is available, ask in plain text and wait for a reply.

Dispatch `galeharness-cli:research:session-historian` with the user's question as the task prompt. Omit the `mode` parameter so the user's configured permission settings apply. Include in the dispatch prompt:

- The user's question
- The current working directory
- The repo name and git branch from pre-resolved context (only if they resolved to plain values — do not pass literal command strings)
