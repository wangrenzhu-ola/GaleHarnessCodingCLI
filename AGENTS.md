# Agent Instructions

This repository is **GaleHarnessCLI** — a complete coding-agent workflow system combining gh: prefix skills with HKTMemory vector knowledge base.

It contains:
- `plugins/galeharness-cli/` — GaleHarnessCLI workflow skills (gh: prefix) and agents
- `vendor/hkt-memory/` — HKTMemory v5.0 vector knowledge base, vendored in full
- the Bun/TypeScript CLI that converts plugins into other agent platform formats
- additional plugins under `plugins/`, such as `coding-tutor`
- `scripts/` — release tooling

`AGENTS.md` is the canonical repo instruction file. Root `CLAUDE.md` exists only as a compatibility shim for tools and conversions that still look for it.

## Quick Start

```bash
bun install
bun test                  # full test suite
bun run release:validate  # check plugin/marketplace consistency
```

## GaleHarnessCLI Conventions

### HKTMemory

`vendor/hkt-memory/` contains HKTMemory v5.0. First-time setup:
```bash
bash vendor/hkt-memory/install.sh
```

Required environment variables:
```
HKT_MEMORY_API_KEY=<your key>
HKT_MEMORY_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
HKT_MEMORY_MODEL=embedding-3
```

Quick test:
```bash
hkt-memory stats
```

### SKILL Naming

All workflow skills use `gh:` prefix:
- `gh:compound` — document a solved problem (stores to HKTMemory automatically)
- `gh:plan`, `gh:work`, `gh:review`, `gh:debug`, etc.

The `learnings-researcher` agent queries HKTMemory before grep-searching `docs/solutions/`.

## Working Agreement

- **Branching:** Create a feature branch for any non-trivial change. If already on the correct branch for the task, keep using it; do not create additional branches or worktrees unless explicitly requested.
- **Merge policy:** All changes to `main` go through pull requests. Direct pushes and direct merges are not allowed; branch protection on `main` enforces this by requiring the `test` status check to pass. The direct path bypasses `release:validate`, the test suite, and PR title validation — past direct merges have caused version drift requiring multi-PR recovery (see `docs/solutions/workflow/release-please-version-drift-recovery.md`).
- **Safety:** Do not delete or overwrite user data. Avoid destructive commands.
- **Testing:** Run `bun test` after changes that affect parsing, conversion, or output.
- **Release versioning:** Releases are prepared by release automation, not normal feature PRs. The repo now has multiple release components (`cli`, `galeharness-cli`, `coding-tutor`, `marketplace`). GitHub release PRs and GitHub Releases are the canonical release-notes surface for new releases; root `CHANGELOG.md` is only a pointer to that history. Use conventional titles such as `feat:` and `fix:` so release automation can classify change intent, but do not hand-bump release-owned versions or hand-author release notes in routine PRs.
- **Linked versions (cli + galeharness-cli):** The `linked-versions` release-please plugin keeps `cli` and `galeharness-cli` at the same version. This is intentional — it simplifies version tracking across the CLI and the plugin it ships.
- **Output Paths:** Keep OpenCode output at `opencode.json` and `.opencode/{agents,skills,plugins}`. For OpenCode, commands go to `~/.config/opencode/commands/<name>.md`; `opencode.json` is deep-merged (never overwritten wholesale).
- **Scratch Space:** Two options depending on what the files are for:
  - **Workflow state** (`.context/`): Files that other skills or agents in the same session may need to read — plans in progress, gate files, inter-skill handoff artifacts. Namespace under `.context/galeharness-cli/<workflow-or-skill-name>/`, add a per-run subdirectory when concurrent runs are plausible, and clean up after successful completion unless the user asked to inspect them or another agent still needs them.
  - **Throwaway artifacts** (`mktemp -d`): Files consumed once and discarded — captured screenshots, stitched GIFs, intermediate build outputs, recordings. Use OS temp (`mktemp -d -t <prefix>-XXXXXX`) so they live outside the repo tree entirely. No `.gitignore` needed, no risk of accidental commits, OS handles cleanup.
  - **Rule of thumb:** If another skill might read it, `.context/`. If it gets uploaded/consumed and thrown away, OS temp. Durable outputs like plans, specs, learnings, and docs belong in neither — they go in `docs/`.
- **Character encoding:**
  - **Identifiers** (file names, agent names, command names): ASCII only — converters and regex patterns depend on it.
  - **Markdown tables:** Use pipe-delimited (`| col | col |`), never box-drawing characters.
  - **Prose and skill content:** Unicode is fine (emoji, punctuation, etc.). Prefer ASCII arrows (`->`, `<-`) over Unicode arrows in code blocks and terminal examples.

## Directory Layout

```
src/              CLI entry point, parsers, converters, target writers
plugins/          Plugin workspaces (galeharness-cli, coding-tutor)
.claude-plugin/   Claude marketplace catalog metadata
tests/            Converter, writer, and CLI tests + fixtures
docs/             Solutions and target specs
```

## Repo Surfaces

Changes in this repo may affect one or more of these surfaces:

- `galeharness-cli` under `plugins/galeharness-cli/`
- the Claude marketplace catalog under `.claude-plugin/`
- the converter/install CLI in `src/` and `package.json`
- secondary plugins such as `plugins/coding-tutor/`

Do not assume a repo change is "just CLI" or "just plugin" without checking which surface owns the affected files.

## Plugin Maintenance

When changing `plugins/galeharness-cli/` content:

- Update substantive docs like `plugins/galeharness-cli/README.md` when the plugin behavior, inventory, or usage changes.
- Do not hand-bump release-owned versions in plugin or marketplace manifests.
- Do not hand-add release entries to `CHANGELOG.md` or treat it as the canonical source for new releases.
- Run `bun run release:validate` if agents, commands, skills, MCP servers, or release-owned descriptions/counts may have changed.

Useful validation commands:

```bash
bun run release:validate
cat .claude-plugin/marketplace.json | jq .
cat plugins/galeharness-cli/.claude-plugin/plugin.json | jq .
```

## Coding Conventions

- Prefer explicit mappings over implicit magic when converting between platforms.
- Keep target-specific behavior in dedicated converters/writers instead of scattering conditionals across unrelated files.
- Preserve stable output paths and merge semantics for installed targets; do not casually change generated file locations.
- When adding or changing a target, update fixtures/tests alongside implementation rather than treating docs or examples as sufficient proof.

## Commit Conventions

- **Prefix is based on intent, not file type.** Use conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, etc.) but classify by what the change does, not the file extension. Files under `plugins/*/skills/`, `plugins/*/agents/`, and `.claude-plugin/` are product code even though they are Markdown or JSON. Reserve `docs:` for files whose sole purpose is documentation (`README.md`, `docs/`, `CHANGELOG.md`).
- **Include a component scope.** The scope appears verbatim in the changelog. Pick the narrowest useful label: skill/agent name (`document-review`, `learnings-researcher`), plugin or CLI area (`coding-tutor`, `cli`), or shared area when cross-cutting (`review`, `research`, `converters`). Never use `galeharness-cli` as scope alone — it's the entire plugin and tells the reader nothing. Omit scope only when no single label adds clarity.
- Breaking changes must be explicit with `!` or a breaking-change footer so release automation can classify them correctly.

## Adding a New Target Provider

Only add a provider when the target format is stable, documented, and has a clear mapping for tools/permissions/hooks. Use this checklist:

1. **Define the target entry**
   - Add a new handler in `src/targets/index.ts` with `implemented: false` until complete.
   - Use a dedicated writer module (e.g., `src/targets/codex.ts`).

2. **Define types and mapping**
   - Add provider-specific types under `src/types/`.
   - Implement conversion logic in `src/converters/` (from Claude → provider).
   - Keep mappings explicit: tools, permissions, hooks/events, model naming.

3. **Wire the CLI**
   - Ensure `convert` and `install` support `--to <provider>` and `--also`.
   - Keep behavior consistent with OpenCode (write to a clean provider root).

4. **Tests (required)**
   - Extend fixtures in `tests/fixtures/sample-plugin`.
   - Add spec coverage for mappings in `tests/converter.test.ts`.
   - Add a writer test for the new provider output tree.
   - Add a CLI test for the provider (similar to `tests/cli.test.ts`).

5. **Docs**
   - Update README with the new `--to` option and output locations.

## Agent References in Skills

When referencing agents from within skill SKILL.md files (e.g., via the `Agent` or `Task` tool), always use the two-segment plugin namespace: `galeharness-cli:<agent-name>`. The `<agent-name>` must match a real file in `plugins/galeharness-cli/agents/<agent-name>.md`. Never use the short agent name alone, and do not add a category segment.

Example:
- `galeharness-cli:learnings-researcher` (correct)
- `learnings-researcher` (wrong — will fail to resolve at runtime)
- `galeharness-cli:<category>:<agent-name>` (wrong — GaleHarnessCLI agents are currently flat)

This prevents resolution failures when the plugin is installed alongside other plugins that may define agents with the same short name.

## File References in Skills

Each skill directory is a self-contained unit. A SKILL.md file must only reference files within its own directory tree (e.g., `references/`, `assets/`, `scripts/`) using relative paths from the skill root. Never reference files outside the skill directory — whether by relative traversal or absolute path.

Broken patterns:

- `../other-skill/references/schema.yaml` — relative traversal into a sibling skill
- `/home/user/plugins/galeharness-cli/skills/other-skill/file.md` — absolute path to another skill

Why this matters:

- **Runtime resolution:** Skills execute from the user's working directory, not the skill directory. Cross-directory paths and absolute paths will not resolve as expected.
- **Unpredictable install paths:** Plugins installed from the marketplace are cached at versioned paths. Absolute paths that worked in the source repo will not match the installed layout.
- **Converter portability:** The CLI copies each skill directory as an isolated unit when converting to other agent platforms. Cross-directory references break because sibling directories are not included in the copy.

If two skills need the same supporting file, duplicate it into each skill's directory. Prefer small, self-contained reference files over shared dependencies.

## Platform-Specific Variables in Skills

This plugin is authored once and converted for multiple agent platforms (Claude Code, Codex, Gemini CLI, etc.). Do not use platform-specific environment variables or string substitutions (e.g., `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_SESSION_ID}`, `CODEX_SANDBOX`, `CODEX_SESSION_ID`) in skill content without a graceful fallback that works when the variable is unavailable or unresolved.

**Preferred approach — relative paths:** Reference co-located scripts and files using relative paths from the skill directory (e.g., `bash scripts/my-script.sh ARG`). All major platforms resolve these relative to the skill's directory. No variable prefix needed.

**When a platform variable is unavoidable:** Use the pre-resolution pattern (`!` backtick syntax) and include explicit fallback instructions in the skill content, so the agent knows what to do if the value is empty, literal, or an error.

## Repository Docs Convention

- **Solutions** live in `docs/solutions/` — documented decisions and patterns.
- **Specs** live in `docs/specs/` — target platform format specifications.

### Solution categories (`docs/solutions/`)

- **`developer-experience/`** — Issues with contributing to this repo: local dev setup, shell aliases, test ergonomics, CI friction.
- **`integrations/`** — Issues where plugin output doesn't work correctly on a target platform or OS.
- **`workflow/`**, **`skill-design/`** — Plugin skill and agent design patterns, workflow improvements.
