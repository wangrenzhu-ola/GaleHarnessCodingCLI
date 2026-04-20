---
name: gh:compound
description: Document a recently solved problem to compound your team's knowledge
---

# /compound

Coordinate multiple subagents working in parallel to document a recently solved problem.

## Purpose

Captures problem solutions while context is fresh, creating structured documentation in `docs/solutions/` with YAML frontmatter for searchability and future reference. Uses parallel subagents for maximum efficiency.

**Why "compound"?** Each documented solution compounds your team's knowledge. The first time you solve a problem takes research. Document it, and the next occurrence takes minutes. Knowledge compounds.

## Usage

```bash
/gh:compound                    # Document the most recent fix
/gh:compound [brief context]    # Provide additional context hint
```

## Support Files

These files are the durable contract for the workflow. Read them on-demand at the step that needs them — do not bulk-load at skill start.

- `references/schema.yaml` — canonical frontmatter fields and enum values (read when validating YAML)
- `references/yaml-schema.md` — category mapping from problem_type to directory (read when classifying)
- `assets/resolution-template.md` — section structure for new docs (read when assembling)

When spawning subagents, pass the relevant file contents into the task prompt so they have the contract without needing cross-skill paths.

## Execution Strategy

<!-- HKT-PATCH:gale-task-start -->
Before presenting mode options to the user, log the skill start event so this execution appears on the task board:

```bash
gale-task log skill_started --skill gh:compound --title "${ARGUMENTS:-compound}" 2>/dev/null || true
```

If `gale-task` is not on PATH, skip silently — this must never block the skill.

<!-- /HKT-PATCH:gale-task-start -->

**Config (pre-resolved):**
!`cat "$(git rev-parse --show-toplevel 2>/dev/null)/.compound-engineering/config.local.yaml" 2>/dev/null || cat "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")/.compound-engineering/config.local.yaml" 2>/dev/null || echo '__NO_CONFIG__'`

If the block above contains `language: en`, write documents in English.
If `__NO_CONFIG__` or `language: zh-CN` or no language key, write documents in Chinese (default).

Present the user with two options before proceeding, using the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini). If no question tool is available, present the options and wait for the user's reply.

```
1. Full (recommended) — the complete compound workflow. Researches,
   cross-references, and reviews your solution to produce documentation
   that compounds your team's knowledge.

2. Lightweight — same documentation, single pass. Faster and uses
   fewer tokens, but won't detect duplicates or cross-reference
   existing docs. Best for simple fixes or long sessions nearing
   context limits.
```

Do NOT pre-select a mode. Do NOT skip this prompt. Wait for the user's choice before proceeding.

**If the user chooses Full**, ask one follow-up question before proceeding. Detect which harness is running (Claude Code, Codex, or Cursor) and ask:

```
Would you also like to search your [harness name] session history
for relevant knowledge to help the Compound process? This adds
time and token usage.
```

If the user says yes, dispatch the Session Historian in Phase 1. If no, skip it. Do not ask this in lightweight mode.

---

### Full Mode

<critical_requirement>
**The primary output is ONE file - the final documentation.**

Phase 1 subagents return TEXT DATA to the orchestrator. They must NOT use Write, Edit, or create any files. Only the orchestrator writes files: the solution doc in Phase 2, and — if the Discoverability Check finds a gap — a small edit to a project instruction file (AGENTS.md or CLAUDE.md). The instruction-file edit is maintenance, not a second deliverable; it ensures future agents can discover the knowledge store.
</critical_requirement>


<!-- HKT-PATCH:phase-0.4 -->
### Phase 0.4: HKTMemory Retrieve

Before Phase 0.5, query the vector memory database for related solutions:

1. Extract a 1-2 sentence search query from: problem being documented, error messages, component names, fix approach
2. Run (requires env vars HKT_MEMORY_API_KEY, HKT_MEMORY_BASE_URL, HKT_MEMORY_MODEL):
   ```bash
   uv run vendor/hkt-memory/scripts/hkt_memory_v5.py retrieve \
     --query "<extracted query>" \
     --layer all --limit 10 --min-similarity 0.35 \
     --vector-weight 0.7 --bm25-weight 0.3
   ```
3. If results returned, prepare block and pass to Phase 1 subagents as extra context:
   ```
   ## Supplementary notes from HKTMemory
   Source: vector database. Treat as additional context, not primary evidence.
   [results here, each tagged with (similarity: X.XX)]
   ```
4. If no results or command error, proceed silently without blocking Phase 0.5.

### Phase 0.5: Auto Memory Scan

Before launching Phase 1 subagents, check the auto-memory block injected into your system prompt for notes relevant to the problem being documented.

1. Look for a block labeled "user's auto-memory" (Claude Code only) already present in your system prompt context — MEMORY.md's entries are inlined there
2. If the block is absent, empty, or this is a non-Claude-Code platform, skip this step and proceed to Phase 1 unchanged
3. Scan the entries for anything related to the problem being documented -- use semantic judgment, not keyword matching
4. If relevant entries are found, prepare a labeled excerpt block:

```
## Supplementary notes from auto memory
Treat as additional context, not primary evidence. Conversation history
and codebase findings take priority over these notes.

[relevant entries here]
```

5. Pass this block as additional context to the Context Analyzer and Solution Extractor task prompts in Phase 1. If any memory notes end up in the final documentation (e.g., as part of the investigation steps or root cause analysis), tag them with "(auto memory [claude])" so their origin is clear to future readers.

If no relevant entries are found, proceed to Phase 1 without passing memory context.

### Phase 1: Research

Launch research subagents. Each returns text data to the orchestrator.

**Dispatch order:**
- Launch `Context Analyzer`, `Solution Extractor`, and `Related Docs Finder` in parallel (background)
- Then dispatch `session-historian` in foreground — it reads session files outside the working directory that background agents may not have access to
- The foreground dispatch runs while the background agents work, adding no wall-clock time

<parallel_tasks>

#### 1. **Context Analyzer**
   - Extracts conversation history
   - Reads `references/schema.yaml` for enum validation and **track classification**
   - Determines the track (bug or knowledge) from the problem_type
   - Identifies problem type, component, and track-appropriate fields:
     - **Bug track**: symptoms, root_cause, resolution_type
     - **Knowledge track**: applies_when (symptoms/root_cause/resolution_type optional)
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence
   - Reads `references/yaml-schema.md` for category mapping into `docs/solutions/`
   - Suggests a filename using the pattern `[sanitized-problem-slug]-[date].md`
   - Returns: YAML frontmatter skeleton (must include `category:` field mapped from problem_type), category directory path, suggested filename, and which track applies
   - Does not invent enum values, categories, or frontmatter fields from memory; reads the schema and mapping files above
   - Does not force bug-track fields onto knowledge-track learnings or vice versa

#### 2. **Solution Extractor**
   - Reads `references/schema.yaml` for track classification (bug vs knowledge)
   - Adapts output structure based on the problem_type track
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence -- conversation history and the verified fix take priority; if memory notes contradict the conversation, note the contradiction as cautionary context

   **Bug track output sections:**

   - **Problem**: 1-2 sentence description of the issue
   - **Symptoms**: Observable symptoms (error messages, behavior)
   - **What Didn't Work**: Failed investigation attempts and why they failed
   - **Solution**: The actual fix with code examples (before/after when applicable)
   - **Why This Works**: Root cause explanation and why the solution addresses it
   - **Prevention**: Strategies to avoid recurrence, best practices, and test cases. Include concrete code examples where applicable (e.g., gem configurations, test assertions, linting rules)

   **Knowledge track output sections:**

   - **Context**: What situation, gap, or friction prompted this guidance
   - **Guidance**: The practice, pattern, or recommendation with code examples when useful
   - **Why This Matters**: Rationale and impact of following or not following this guidance
   - **When to Apply**: Conditions or situations where this applies
   - **Examples**: Concrete before/after or usage examples showing the practice in action

#### 3. **Related Docs Finder**
   - Searches `docs/solutions/` for related documentation
   - Identifies cross-references and links
   - Finds related GitHub issues
   - Flags any related learning or pattern docs that may now be stale, contradicted, or overly broad
   - **Assesses overlap** with the new doc being created across five dimensions: problem statement, root cause, solution approach, referenced files, and prevention rules. Score as:
     - **High**: 4-5 dimensions match — essentially the same problem solved again
     - **Moderate**: 2-3 dimensions match — same area but different angle or solution
     - **Low**: 0-1 dimensions match — related but distinct
   - Returns: Links, relationships, refresh candidates, and overlap assessment (score + which dimensions matched)

   **Search strategy (grep-first filtering for efficiency):**

   1. Extract keywords from the problem context: module names, technical terms, error messages, component types
   2. If the problem category is clear, narrow search to the matching `docs/solutions/<category>/` directory
   3. Use the native content-search tool (e.g., Grep in Claude Code) to pre-filter candidate files BEFORE reading any content. Run multiple searches in parallel, case-insensitive, targeting frontmatter fields. These are template patterns -- substitute actual keywords:
      - `title:.*<keyword>`
      - `tags:.*(<keyword1>|<keyword2>)`
      - `module:.*<module name>`
      - `component:.*<component>`
   4. If search returns >25 candidates, re-run with more specific patterns. If <3, broaden to full content search
   5. Read only frontmatter (first 30 lines) of candidate files to score relevance
   6. Fully read only strong/moderate matches
   7. Return distilled links and relationships, not raw file contents

   **GitHub issue search:**

   Prefer the `gh` CLI for searching related issues: `gh issue list --search "<keywords>" --state all --limit 5`. If `gh` is not installed, fall back to the GitHub MCP tools (e.g., `unblocked` data_retrieval) if available. If neither is available, skip GitHub issue search and note it was skipped in the output.

</parallel_tasks>

#### 4. **Session Historian** (foreground, after launching the above — only if the user opted in)
   - **Skip entirely** if the user declined session history in the follow-up question
   - Dispatched as `galeharness-cli:research:session-historian`
   - Dispatch in **foreground** — this agent reads session files outside the working directory (`~/.claude/projects/`, `~/.codex/sessions/`, `~/.cursor/projects/`) which background agents may not have access to
   - Searches prior Claude Code, Codex, and Cursor sessions for the same project to find related investigation context
   - Correlates sessions by repo name across all platforms (matches sessions from main checkouts, worktrees, and Conductor workspaces)
   - In the dispatch prompt, pass:
     - A specific description of the problem being documented — not a generic topic, but the concrete issue (error messages, module names, what broke and how it was fixed). This is what the agent filters its findings against.
     - The current git branch and working directory
     - The instruction: "Only surface findings from prior sessions that are directly relevant to this specific problem. Ignore unrelated work from the same sessions or branches."
     - The output format:

       ```
       Structure your response with these sections (omit any with no findings):
       - What was tried before: prior approaches to this specific problem
       - What didn't work: failed attempts at this problem from prior sessions
       - Key decisions: choices made about this problem and their rationale
       - Related context: anything else from prior sessions that directly informs this problem's documentation
       ```
   - Omit the `mode` parameter so the user's configured permission settings apply
   - Dispatch on the mid-tier model (e.g., `model: "sonnet"` in Claude Code) — the synthesis feeds into compound assembly and doesn't need frontier reasoning
   - Returns: structured digest of findings from prior sessions, or "no relevant prior sessions" if none found

### Phase 2: Assembly & Write

<sequential_tasks>

**WAIT for all Phase 1 subagents to complete before proceeding.**

**Document Language**: When `language: zh-CN` (or default), write all prose content in Chinese. Keep section headers (`## Problem`, `## Solution`, etc.) and YAML frontmatter keys in English. Translate paragraphs, list items, and table content. Do NOT translate code blocks, inline code, file paths, or URLs.

The orchestrating agent (main conversation) performs these steps:

1. Collect all text results from Phase 1 subagents
2. **Check the overlap assessment** from the Related Docs Finder before deciding what to write:

   | Overlap | Action |
   |---------|--------|
   | **High** — existing doc covers the same problem, root cause, and solution | **Update the existing doc** with fresher context (new code examples, updated references, additional prevention tips) rather than creating a duplicate. The existing doc's path and structure stay the same. |
   | **Moderate** — same problem area but different angle, root cause, or solution | **Create the new doc** normally. Flag the overlap for Phase 2.5 to recommend consolidation review. |
   | **Low or none** | **Create the new doc** normally. |

   The reason to update rather than create: two docs describing the same problem and solution will inevitably drift apart. The newer context is fresher and more trustworthy, so fold it into the existing doc rather than creating a second one that immediately needs consolidation.

   When updating an existing doc, preserve its file path and frontmatter structure. Update the solution, code examples, prevention tips, and any stale references. Add a `last_updated: YYYY-MM-DD` field to the frontmatter. Do not change the title unless the problem framing has materially shifted.

3. **Incorporate session history findings** (if available). When the Session History Researcher returned relevant prior-session context:
   - Fold investigation dead ends and failed approaches into the **What Didn't Work** section (bug track) or **Context** section (knowledge track)
   - Use cross-session patterns to enrich the **Prevention** or **Why This Matters** sections
   - Tag session-sourced content with "(session history)" so its origin is clear to future readers
   - If findings are thin or "no relevant prior sessions," proceed without session context
4. Assemble complete markdown file from the collected pieces, reading `assets/resolution-template.md` for the section structure of new docs
<!-- HKT-PATCH:knowledge-write-path -->
### Knowledge Repository Write Path

Before writing the solution document, resolve the target directory:

```bash
# Try global knowledge repo first, fall back to project docs/
KNOWLEDGE_PATH=$(gale-knowledge resolve-path --type solutions 2>/dev/null)
if [ -z "$KNOWLEDGE_PATH" ] || [ $? -ne 0 ]; then
  KNOWLEDGE_PATH="docs/solutions"
fi
```

Use `$KNOWLEDGE_PATH/[category]/` as the target directory for the solution document instead of the hardcoded `docs/solutions/[category]/` path.

<!-- /HKT-PATCH:knowledge-write-path -->

5. Validate YAML frontmatter against `references/schema.yaml`
6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
7. Write the file: either the updated existing doc or the new `docs/solutions/[category]/[filename].md`

When creating a new doc, preserve the section order from `assets/resolution-template.md` unless the user explicitly asks for a different structure.

</sequential_tasks>


<!-- HKT-PATCH:phase-2.3 -->
### Phase 2.3: HKTMemory Store

After successfully writing the solution doc to `docs/solutions/`:

1. Compose a concise summary (2-4 sentences) covering: the problem, the solution, key decisions, and the repo-relative file path to the solution document
2. Extract `title` and `category` values from its YAML frontmatter
3. Run:
   ```bash
   uv run vendor/hkt-memory/scripts/hkt_memory_v5.py store \
     --content "<summary + repo-relative file path>" \
     --title "<frontmatter title>" \
     --topic "<frontmatter category>" \
     --layer all
   ```
4. Log: `Stored to HKTMemory: [title]` on success, or note the error (non-blocking — do not fail the compound workflow if HKTMemory is unavailable).

**Rationale:** The vector database's job is *discovery*, not full-text storage. The document already lives in a git-managed file. Store the summary and path so retrieval can surface it; the agent reads the actual file when details are needed.

<!-- HKT-PATCH:gale-task-memory -->
5. After a successful HKTMemory store, log the memory_linked event (use the same `<frontmatter title>` as the `--memory-title` value):
   ```bash
   gale-task log memory_linked --memory-title "<frontmatter title>" 2>/dev/null || true
   ```
<!-- /HKT-PATCH:gale-task-memory -->

<!-- HKT-PATCH:knowledge-commit -->
### Knowledge Repository Commit

After the solution document is written and stored to HKTMemory:

```bash
gale-knowledge commit --project "$(gale-knowledge extract-project 2>/dev/null || basename $(pwd))" --type solution --title "<frontmatter-title>" 2>/dev/null || true
```

If `gale-knowledge` is not on PATH, skip silently — this must never block the skill.

<!-- /HKT-PATCH:knowledge-commit -->

### Phase 2.5: Selective Refresh Check

After writing the new learning, decide whether this new solution is evidence that older docs should be refreshed.

`gh:compound-refresh` is **not** a default follow-up. Use it selectively when the new learning suggests an older learning or pattern doc may now be inaccurate.

It makes sense to invoke `gh:compound-refresh` when one or more of these are true:

1. A related learning or pattern doc recommends an approach that the new fix now contradicts
2. The new fix clearly supersedes an older documented solution
3. The current work involved a refactor, migration, rename, or dependency upgrade that likely invalidated references in older docs
4. A pattern doc now looks overly broad, outdated, or no longer supported by the refreshed reality
5. The Related Docs Finder surfaced high-confidence refresh candidates in the same problem space
6. The Related Docs Finder reported **moderate overlap** with an existing doc — there may be consolidation opportunities that benefit from a focused review

It does **not** make sense to invoke `gh:compound-refresh` when:

1. No related docs were found
2. Related docs still appear consistent with the new learning
3. The overlap is superficial and does not change prior guidance
4. Refresh would require a broad historical review with weak evidence

Use these rules:

- If there is **one obvious stale candidate**, invoke `gh:compound-refresh` with a narrow scope hint after the new learning is written
- If there are **multiple candidates in the same area**, ask the user whether to run a targeted refresh for that module, category, or pattern set
- If context is already tight or you are in lightweight mode, do not expand into a broad refresh automatically; instead recommend `gh:compound-refresh` as the next step with a scope hint

When invoking or recommending `gh:compound-refresh`, be explicit about the argument to pass. Prefer the narrowest useful scope:

- **Specific file** when one learning or pattern doc is the likely stale artifact
- **Module or component name** when several related docs may need review
- **Category name** when the drift is concentrated in one solutions area
- **Pattern filename or pattern topic** when the stale guidance lives in `docs/solutions/patterns/`

Examples:

- `/gh:compound-refresh plugin-versioning-requirements`
- `/gh:compound-refresh payments`
- `/gh:compound-refresh performance-issues`
- `/gh:compound-refresh critical-patterns`

A single scope hint may still expand to multiple related docs when the change is cross-cutting within one domain, category, or pattern area.

Do not invoke `gh:compound-refresh` without an argument unless the user explicitly wants a broad sweep.

Always capture the new learning first. Refresh is a targeted maintenance follow-up, not a prerequisite for documentation.

### Discoverability Check

After the learning is written and the refresh decision is made, check whether the project's instruction files would lead an agent to discover and search `docs/solutions/` before starting work in a documented area. This runs every time — the knowledge store only compounds value when agents can find it.

1. Identify which root-level instruction files exist (AGENTS.md, CLAUDE.md, or both). Read the file(s) and determine which holds the substantive content — one file may just be a shim that `@`-includes the other (e.g., `CLAUDE.md` containing only `@AGENTS.md`, or vice versa). The substantive file is the assessment and edit target; ignore shims. If neither file exists, skip this check entirely.
2. Assess whether an agent reading the instruction files would learn three things:
   - That a searchable knowledge store of documented solutions exists
   - Enough about its structure to search effectively (category organization, YAML frontmatter fields like `module`, `tags`, `problem_type`)
   - When to search it (before implementing features, debugging issues, or making decisions in documented areas — learnings may cover bugs, best practices, workflow patterns, or other institutional knowledge)

   This is a semantic assessment, not a string match. The information could be a line in an architecture section, a bullet in a gotchas section, spread across multiple places, or expressed without ever using the exact path `docs/solutions/`. Use judgment — if an agent would reasonably discover and use the knowledge store after reading the file, the check passes.

3. If the spirit is already met, no action needed — move on.
4. If not:
   a. Based on the file's existing structure, tone, and density, identify where a mention fits naturally. Before creating a new section, check whether the information could be a single line in the closest related section — an architecture tree, a directory listing, a documentation section, or a conventions block. A line added to an existing section is almost always better than a new headed section. Only add a new section as a last resort when the file has clear sectioned structure and nothing is even remotely related.
   b. Draft the smallest addition that communicates the three things. Match the file's existing style and density. The addition should describe the knowledge store itself, not the plugin — an agent without the plugin should still find value in it.

      Keep the tone informational, not imperative. Express timing as description, not instruction — "relevant when implementing or debugging in documented areas" rather than "check before implementing or debugging." Imperative directives like "always search before implementing" cause redundant reads when a workflow already includes a dedicated search step. The goal is awareness: agents learn the folder exists and what's in it, then use their own judgment about when to consult it.

      Examples of calibration (not templates — adapt to the file):

      When there's an existing directory listing or architecture section — add a line:
      ```
      docs/solutions/  # documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (module, tags, problem_type)
      ```

      When nothing in the file is a natural fit — a small headed section is appropriate:
      ```
      ## Documented Solutions

      `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
      ```
   c. In full mode, explain to the user why this matters — agents working in this repo (including fresh sessions, other tools, or collaborators without the plugin) won't know to check `docs/solutions/` unless the instruction file surfaces it. Show the proposed change and where it would go, then use the platform's blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini) to get consent before making the edit. If no question tool is available, present the proposal and wait for the user's reply. In lightweight mode, output a one-liner note and move on

### Phase 3: Optional Enhancement

**WAIT for Phase 2 to complete before proceeding.**

<parallel_tasks>

Based on problem type, optionally invoke specialized agents to review the documentation:

- **performance_issue** → `galeharness-cli:review:performance-oracle`
- **security_issue** → `galeharness-cli:review:security-sentinel`
- **database_issue** → `galeharness-cli:review:data-integrity-guardian`
- Any code-heavy issue → always run `galeharness-cli:review:code-simplicity-reviewer`, and additionally run the gale reviewer that matches the repo's primary stack:
  - Ruby/Rails → also run `galeharness-cli:review:gale-rails-reviewer`
  - Python → also run `galeharness-cli:review:gale-python-reviewer`
  - TypeScript/JavaScript → also run `galeharness-cli:review:gale-typescript-reviewer`
  - Other stacks → no gale reviewer needed

</parallel_tasks>

---

### Lightweight Mode

<critical_requirement>
**Single-pass alternative — same documentation, fewer tokens.**

This mode skips parallel subagents entirely. The orchestrator performs all work in a single pass, producing the same solution document without cross-referencing or duplicate detection.
</critical_requirement>

The orchestrator (main conversation) performs ALL of the following in one sequential pass:

1. **Extract from conversation**: Identify the problem and solution from conversation history. Also scan the "user's auto-memory" block injected into your system prompt, if present (Claude Code only) -- use any relevant notes as supplementary context alongside conversation history. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])"
2. **Classify**: Read `references/schema.yaml` and `references/yaml-schema.md`, then determine track (bug vs knowledge), category, and filename
3. **Write minimal doc**: Create `docs/solutions/[category]/[filename].md` using the appropriate track template from `assets/resolution-template.md`, with:
   - YAML frontmatter with track-appropriate fields
   - Bug track: Problem, root cause, solution with key code snippets, one prevention tip
   - Knowledge track: Context, guidance with key examples, one applicability note
4. **Skip specialized agent reviews** (Phase 3) to conserve context

**Lightweight output:**
```
✓ Documentation complete (lightweight mode)

File created:
- docs/solutions/[category]/[filename].md

[If discoverability check found instruction files don't surface the knowledge store:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface docs/solutions/ to agents —
a brief mention helps all agents discover these learnings.

Note: This was created in lightweight mode. For richer documentation
(cross-references, detailed prevention strategies, specialized reviews),
re-run /compound in a fresh session.
```

**No subagents are launched. No parallel tasks. One file written.**

In lightweight mode, the overlap check is skipped (no Related Docs Finder subagent). This means lightweight mode may create a doc that overlaps with an existing one. That is acceptable — `gh:compound-refresh` will catch it later. Only suggest `gh:compound-refresh` if there is an obvious narrow refresh target. Do not broaden into a large refresh sweep from a lightweight session.

---

## What It Captures

- **Problem symptom**: Exact error messages, observable behavior
- **Investigation steps tried**: What didn't work and why
- **Root cause analysis**: Technical explanation
- **Working solution**: Step-by-step fix with code examples
- **Prevention strategies**: How to avoid in future
- **Cross-references**: Links to related issues and docs

## Preconditions

<preconditions enforcement="advisory">
  <check condition="problem_solved">
    Problem has been solved (not in-progress)
  </check>
  <check condition="solution_verified">
    Solution has been verified working
  </check>
  <check condition="non_trivial">
    Non-trivial problem (not simple typo or obvious error)
  </check>
</preconditions>

## What It Creates

**Organized documentation:**

- File: `docs/solutions/[category]/[filename].md`

**Categories auto-detected from problem:**

Bug track:
- build-errors/
- test-failures/
- runtime-errors/
- performance-issues/
- database-issues/
- security-issues/
- ui-bugs/
- integration-issues/
- logic-errors/

Knowledge track:
- best-practices/
- workflow-issues/
- developer-experience/
- documentation-gaps/

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| Subagents write files like `context-analysis.md`, `solution-draft.md` | Subagents return text data; orchestrator writes one final file |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | One solution doc written or updated: `docs/solutions/[category]/[filename].md` (plus an optional small edit to a project instruction file for discoverability) |
| Creating a new doc when an existing doc covers the same problem | Check overlap assessment; update the existing doc when overlap is high |

## Success Output

```
✓ Documentation complete

Auto memory: 2 relevant entries used as supplementary evidence

Subagent Results:
  ✓ Context Analyzer: Identified performance_issue in brief_system, category: performance-issues/
  ✓ Solution Extractor: 3 code fixes, prevention strategies
  ✓ Related Docs Finder: 2 related issues
  ✓ Session History: 3 prior sessions on same branch, 2 failed approaches surfaced

Specialized Agent Reviews (Auto-Triggered):
  ✓ performance-oracle: Validated query optimization approach
  ✓ gale-rails-reviewer: Code examples meet Rails conventions
  ✓ code-simplicity-reviewer: Solution is appropriately minimal

File created:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

What's next?
1. Continue workflow (recommended)
2. Link related documentation
3. Update other references
4. View documentation
5. Other
```

**After displaying the success output, present the "What's next?" options using the platform's blocking question tool** (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini). If no question tool is available, present the numbered options and wait for the user's reply before proceeding. Do not continue the workflow or end the turn without the user's selection.

**Alternate output (when updating an existing doc due to high overlap):**

```
✓ Documentation updated (existing doc refreshed with current context)

Overlap detected: docs/solutions/performance-issues/n-plus-one-queries.md
  Matched dimensions: problem statement, root cause, solution, referenced files
  Action: Updated existing doc with fresher code examples and prevention tips

File updated:
- docs/solutions/performance-issues/n-plus-one-queries.md (added last_updated: 2026-03-24)
```

## The Compounding Philosophy

This creates a compounding knowledge system:

1. First time you solve "N+1 query in brief generation" → Research (30 min)
2. Document the solution → docs/solutions/performance-issues/n-plus-one-briefs.md (5 min)
3. Next time similar issue occurs → Quick lookup (2 min)
4. Knowledge compounds → Team gets smarter

The feedback loop:

```
Build → Test → Find Issue → Research → Improve → Document → Validate → Deploy
    ↑                                                                      ↓
    └──────────────────────────────────────────────────────────────────────┘
```

**Each unit of engineering work should make subsequent units of work easier—not harder.**

## Auto-Invoke

<auto_invoke> <trigger_phrases> - "that worked" - "it's fixed" - "working now" - "problem solved" </trigger_phrases>

<manual_override> Use /gh:compound [context] to document immediately without waiting for auto-detection. </manual_override> </auto_invoke>

## Output

Writes the final learning directly into `docs/solutions/`.

## Applicable Specialized Agents

Based on problem type, these agents can enhance documentation:

### Code Quality & Review
- **galeharness-cli:review:gale-rails-reviewer**: Reviews code examples for Rails best practices
- **galeharness-cli:review:gale-python-reviewer**: Reviews code examples for Python best practices
- **galeharness-cli:review:gale-typescript-reviewer**: Reviews code examples for TypeScript best practices
- **galeharness-cli:review:code-simplicity-reviewer**: Ensures solution code is minimal and clear
- **galeharness-cli:review:pattern-recognition-specialist**: Identifies anti-patterns or repeating issues

### Specific Domain Experts
- **galeharness-cli:review:performance-oracle**: Analyzes performance_issue category solutions
- **galeharness-cli:review:security-sentinel**: Reviews security_issue solutions for vulnerabilities
- **galeharness-cli:review:data-integrity-guardian**: Reviews database_issue migrations and queries

### Enhancement & Research
- **galeharness-cli:research:best-practices-researcher**: Enriches solution with industry best practices
- **galeharness-cli:research:framework-docs-researcher**: Links to framework/library documentation references

### When to Invoke
- **Auto-triggered** (optional): Agents can run post-documentation for enhancement
- **Manual trigger**: User can invoke agents after /gh:compound completes for deeper review

## Related Commands

- `/research [topic]` - Deep investigation (searches docs/solutions/ for patterns)
- `/gh:plan` - Planning workflow (references documented solutions)

<!-- HKT-PATCH:gale-task-end -->
## Task Lifecycle End

After the compound workflow is fully complete (documentation written, discoverability check done), log the completion event:

```bash
gale-task log skill_completed 2>/dev/null || true
```

If `gale-task` is not on PATH, skip silently — this must never block the skill.
<!-- /HKT-PATCH:gale-task-end -->
