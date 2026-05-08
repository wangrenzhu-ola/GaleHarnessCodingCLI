---
name: gh:nexus
description: "GitNexus code intelligence skill for analyzing repos. Run gitnexus analyze, query, cypher, context, and impact commands against indexed repositories. Auto-detects and installs gitnexus@1.6.3 if missing."
argument-hint: "[analyze <repo-path> | status | query <query> | cypher <cypher> | context <symbol> | impact <symbol>]"
---

# GitNexus Code Intelligence

Analyze repositories with GitNexus to extract code intelligence — symbols, dependencies, call graphs, and impact analysis.

> **License Caution:** GitNexus is distributed under the **PolyForm-Noncommercial-1.0.0** license. Use in commercial contexts requires a separate license. This skill is a convenience wrapper; license compliance is your responsibility.

> **Boundary Notes:** GitNexus integration is **optional and non-blocking**. If gitnexus is unavailable and cannot be installed, the skill reports the limitation and stops gracefully rather than failing the session.

## Commands

| Command | Description |
|---------|-------------|
| `gh-nexus analyze <repo-path>` | Run `gitnexus analyze` on the target repository to index it for queries |
| `gh-nexus status` | Check local GitNexus registry status (indexed repos, db health) |
| `gh-nexus query <query>` | Best-effort natural language query against indexed repos (experimental) |
| `gh-nexus cypher <cypher>` | Run a Cypher query against the indexed repo graph database |
| `gh-nexus context <symbol>` | Get full context for a symbol (definition, references, call chain) |
| `gh-nexus impact <symbol>` | Get impact analysis for a symbol (who calls it, what breaks if changed) |

## Auto-Install

Before running any command, detect whether `gitnexus` is available:

```bash
command -v gitnexus >/dev/null 2>&1
```

If missing, attempt installation in this order:

1. **Global npm install** (preferred for repeated use):
   ```bash
   npm install -g gitnexus@1.6.3
   ```

2. **npx fallback** (no global install needed):
   ```bash
   npx --yes gitnexus@1.6.3 <command>
   ```

After install, verify:
```bash
gitnexus --version
```

If both methods fail, report:
> "GitNexus is not available and could not be installed. Please install manually: `npm install -g gitnexus@1.6.3`"

Then stop gracefully — do not block the caller's workflow.

## Execution Flow

### Phase 0: Detect or Install

1. Check `command -v gitnexus` (or `shutil.which("gitnexus")` in Python)
2. If found, use it directly
3. If missing, run the auto-install sequence above
4. If still missing after install attempts, report gracefully and stop

### Phase 1: Dispatch Command

| Subcommand | gitnexus equivalent | Notes |
|------------|---------------------|-------|
| `analyze <repo-path>` | `gitnexus analyze <repo-path>` | Indexes the repo; may take time for large codebases |
| `status` | `gitnexus status` | Shows registry state, indexed repos, db size |
| `query <query>` | `gitnexus query "<query>"` | Best-effort NL query; experimental quality |
| `cypher <cypher>` | `gitnexus cypher "<cypher>"` | Direct Cypher against the graph; requires indexed repo |
| `context <symbol>` | `gitnexus context <symbol>` | Symbol resolution (function, class, variable) |
| `impact <symbol>` | `gitnexus impact <symbol>` | Change-impact analysis for the symbol |

For `npx` fallback usage, prefix commands with `npx --yes gitnexus@1.6.3` instead of `gitnexus`.

### Phase 2: Present Results

- Stream command output to the user
- If the command returns non-zero, capture stderr and present the error
- For `analyze`, note that indexing is async/background and may need a moment before queries work
- For `query`, flag that results are experimental and should be verified

## Error Handling

| Scenario | Response |
|----------|----------|
| gitnexus not found, install fails | Graceful stop with manual install instructions |
| Repo not indexed | Suggest running `gh-nexus analyze <repo-path>` first |
| Cypher syntax error | Pass through gitnexus error; suggest checking Cypher syntax |
| Symbol not found | Report "Symbol not found in indexed repo" |
| Query returns empty | Report "No results — try rephrasing or check if repo is indexed" |

## Metadata

- **GitNexus version:** 1.6.3
- **Node requirement:** v18+ (tested on v22.22.2)
- **npm requirement:** 8+ (tested on 10.9.7)
- **License:** PolyForm-Noncommercial-1.0.0 (GitNexus itself)
