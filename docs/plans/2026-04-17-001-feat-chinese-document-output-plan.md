---
title: Chinese Document Output
type: feat
status: active
date: 2026-04-17
origin: docs/brainstorms/chinese-document-output-requirements.md
---

# Chinese Document Output

## Overview

Add a `language` configuration setting to GaleHarnessCLI that controls document output language. When set to `zh-CN` (default), workflow skills produce Chinese prose while keeping document structure in English.

## Problem Frame

Chinese-speaking teams experience friction when reviewing English documentation produced by workflow skills. This feature enables Chinese document output via a global configuration setting, reducing translation overhead while maintaining tool compatibility.

## Requirements Trace

| ID | Requirement |
|----|-------------|
| R1 | Support `language` setting in `.compound-engineering/config.local.yaml` |
| R2 | Valid values: `zh-CN` (Chinese) and `en` (English) |
| R3 | Default to `zh-CN` when not configured |
| R4 | `gh:setup` includes `language` in config template |
| R5-R10 | 6 skills write Chinese when `language: zh-CN` |
| R11 | All documents MUST keep section headers in English |
| R12 | All documents MUST keep YAML frontmatter keys in English |
| R13 | Only prose content and bullet points MUST be written in Chinese |

## Scope Boundaries

- NOT translating SKILL.md files
- NOT translating reference files (`references/*.md`, `assets/*.md`)
- NOT changing HKTMemory storage behavior
- NOT adding multi-language support beyond Chinese and English

## Context & Research

### Relevant Code and Patterns

- **Config reading pattern**: `plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:46-52` — pre-resolution command with worktree fallback and `__NO_CONFIG__` sentinel
- **Config template**: `plugins/galeharness-cli/skills/gh-setup/references/config-template.yaml`
- **Document templates**:
  - `plugins/galeharness-cli/skills/gh-brainstorm/references/requirements-capture.md`
  - `plugins/galeharness-cli/skills/gh-compound/assets/resolution-template.md`

### Institutional Learnings

- **Platform-agnostic config**: Use relative paths and pre-resolution pattern, avoid platform-specific env vars
- **Explicit opt-in**: Language setting is explicit config, not auto-detection
- **Cross-skill consistency**: Shared patterns should be identical across skills

### Key Technical Decisions

1. **Use established config pattern**: Adopt the gh-work-beta pre-resolution command with worktree fallback, not the simpler pattern proposed in requirements. Handles git worktrees correctly.

2. **`__NO_CONFIG__` sentinel**: When config missing, return sentinel string, not YAML. Skill content handles default resolution. Keeps config reading consistent with existing pattern.

3. **Define "prose content" scope**: Translate paragraphs, list items, table content. Do NOT translate code blocks, inline code, file paths, URLs, commands, YAML keys.

4. **Config block placement**: Place config reading block BEFORE all phases (consistent with gh-work-beta pattern), not after Phase 0 header. Ensures config is available at the earliest point.

5. **Headless mode language**: document-review headless mode JSON findings follow language setting. Field names stay English for programmatic consumption; `description` content follows `language` config.

## Open Questions

### Resolved During Planning

- **Config file missing but directory exists**: Return `__NO_CONFIG__`, default to zh-CN
- **Config exists but no `language` key**: Default to zh-CN
- **Invalid `language` value**: Fall through to default zh-CN

### Deferred to Implementation

- None — scope is well-defined

## Implementation Units

- [ ] **Unit 1: Update Config Template**

**Goal:** Add `language` setting to the config template with documentation

**Requirements:** R1, R2, R4

**Dependencies:** None

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-setup/references/config-template.yaml`

**Approach:**
Add a new section for Document Language settings. Include both `language` key and inline documentation explaining valid values and defaults.

**Patterns to follow:**
- Existing comment style in config-template.yaml
- Commented-out default values pattern

**Test expectation:** none — config template is documentation

**Verification:**
- Config template contains `language` setting with valid documentation
- `gh:setup` references this file for local config creation

---

- [ ] **Unit 2: Add Language Config to gh:brainstorm**

**Goal:** gh:brainstorm reads language config and writes Chinese requirements docs when language=zh-CN

**Requirements:** R5, R11-R13

**Dependencies:** Unit 1 (config template reference)

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md`
- Modify: `plugins/galeharness-cli/skills/gh-brainstorm/references/requirements-capture.md`

**Approach:**

1. Add config reading block BEFORE all phases (follow gh-work-beta pattern exactly):
```markdown
**Config (pre-resolved):**
!`cat "$(git rev-parse --show-toplevel 2>/dev/null)/.compound-engineering/config.local.yaml" 2>/dev/null || cat "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")/.compound-engineering/config.local.yaml" 2>/dev/null || echo '__NO_CONFIG__'`

If the block above contains `language: en`, write documents in English.
If `__NO_CONFIG__` or `language: zh-CN` or no language key, write documents in Chinese (default).
```

2. Add language directive to Phase 3 (requirements-capture.md):
```markdown
**Document Language**: When `language: zh-CN` (or default), write all prose content in Chinese. Keep section headers (`## Problem Frame`, `## Requirements`, etc.) and YAML frontmatter keys in English. Translate paragraphs, list items, and table content. Do NOT translate code blocks, inline code, file paths, or URLs.
```

**Patterns to follow:**
- Config reading pattern from `gh-work-beta/SKILL.md:46-52`
- Instruction placement near document writing logic

**Test scenarios:**
- Happy path: Config has `language: zh-CN` → requirements doc has Chinese prose, English headers
- Happy path: Config has `language: en` → requirements doc is English
- Edge case: Config missing → defaults to Chinese
- Edge case: Config exists but no `language` key → defaults to Chinese
- Edge case: Invalid language value → defaults to Chinese

**Verification:**
- Run gh:brainstorm in a test repo with no config → produces Chinese requirements doc
- Run with `language: en` config → produces English requirements doc

---

- [ ] **Unit 3: Add Language Config to gh:plan**

**Goal:** gh:plan reads language config and writes Chinese plans when language=zh-CN

**Requirements:** R6, R11-R13

**Dependencies:** Unit 1

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-plan/SKILL.md`

**Approach:**
Same pattern as Unit 2:
1. Add config reading block BEFORE all phases
2. Add language directive in Phase 4 (Write Plan) section, near the plan template

**Patterns to follow:**
- Identical config reading block as gh:brainstorm
- Language directive placement in document writing section

**Test scenarios:**
- Happy path: Config `language: zh-CN` → plan has Chinese prose, English headers
- Happy path: Config `language: en` → plan is English
- Edge case: Config missing → defaults to Chinese

**Verification:**
- Run gh:plan with Chinese requirements doc → produces Chinese plan with English structure

---

- [ ] **Unit 4: Add Language Config to gh:compound**

**Goal:** gh:compound reads language config and writes Chinese solution docs when language=zh-CN

**Requirements:** R7, R11-R13

**Dependencies:** Unit 1

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-compound/SKILL.md`
- Modify: `plugins/galeharness-cli/skills/gh-compound/assets/resolution-template.md`

**Approach:**
1. Add config reading block near the start (after mode selection)
2. Add language directive in Phase 2 (Assembly & Write) and in the resolution-template

**Patterns to follow:**
- Same config reading block pattern
- Language directive in template file for consistency

**Test scenarios:**
- Happy path: Config `language: zh-CN` → solution doc has Chinese prose
- Edge case: Worktree scenario → config still readable via fallback

**Verification:**
- Run gh:compound after a fix → produces Chinese solution doc

---

- [ ] **Unit 5: Add Language Config to gh:compound-refresh**

**Goal:** gh:compound-refresh reads language config and writes Chinese updates when language=zh-CN

**Requirements:** R8, R11-R13

**Dependencies:** Unit 1, Unit 4 (shared pattern)

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-compound-refresh/SKILL.md`

**Approach:**
Same pattern as gh:compound — add config reading and language directive.

**Test scenarios:**
- Happy path: Refresh with Chinese config → updates in Chinese

**Verification:**
- Run gh-compound-refresh on existing solution → updates preserve language

---

- [ ] **Unit 6: Add Language Config to gh:ideate**

**Goal:** gh:ideate reads language config and presents Chinese ideation results when language=zh-CN

**Requirements:** R9

**Dependencies:** Unit 1

**Files:**
- Modify: `plugins/galeharness-cli/skills/gh-ideate/SKILL.md`
- Modify: `plugins/galeharness-cli/skills/gh-ideate/references/post-ideation-workflow.md`

**Approach:**
Add config reading block and language directive. gh:ideate produces a durable ideation artifact in `docs/ideation/` — treat identically to gh:brainstorm and gh:plan. Apply language directive to both chat presentation and artifact writing.

**Test scenarios:**
- Happy path: Config `language: zh-CN` → ideation summary in Chinese

**Verification:**
- Run gh:ideate → outputs Chinese ideation summary

---

- [ ] **Unit 7: Add Language Config to document-review**

**Goal:** document-review reads language config and presents Chinese findings when language=zh-CN

**Requirements:** R10

**Dependencies:** Unit 1

**Files:**
- Modify: `plugins/galeharness-cli/skills/document-review/SKILL.md`
- Modify: `plugins/galeharness-cli/skills/document-review/references/review-output-template.md`

**Approach:**
Add config reading block and language directive. Review findings are structured output — translate finding descriptions while keeping severity labels and field names in English.

**Headless mode:** In headless mode, JSON findings also follow the language setting. Finding `description` fields are in Chinese when `language: zh-CN`, while field names (`severity`, `category`, `finding`) remain in English for programmatic consumption.

**Test scenarios:**
- Happy path: Config `language: zh-CN` → findings prose in Chinese, severity labels in English
- Happy path: Config `language: en` → all findings in English

**Verification:**
- Run document-review on a Chinese requirements doc → Chinese findings

---

- [ ] **Unit 8: Update Plugin Documentation**

**Goal:** Document the language configuration in plugin README

**Requirements:** R4 (documentation aspect)

**Dependencies:** Units 1-7 complete

**Files:**
- Modify: `plugins/galeharness-cli/README.md`
- Modify: `plugins/galeharness-cli/AGENTS.md` (config section)

**Approach:**
Add a "Document Language" section explaining:
- How to set `language` in config
- Default behavior (Chinese)
- Which skills are affected
- What gets translated vs. preserved

**Test expectation:** none — documentation update

**Verification:**
- README mentions language configuration
- AGENTS.md config section includes language

## System-Wide Impact

- **Interaction graph:** 5 skills write durable documents to `docs/` directories; document-review produces structured JSON findings consumed within workflows — no cross-skill callbacks
- **Error propagation:** Config read failures fall through to default (zh-CN), no error states
- **Unchanged invariants:** Document structure remains identical; only prose content language changes

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Inconsistent implementation across 6 skills | Use identical config reading block in all skills; copy-paste from gh-work-beta |
| LLM ignores language directive | Directive placed prominently in document writing sections; reinforced in templates |
| Worktree config not found | Pre-resolution command includes worktree-to-main fallback |
| User expects English by default | Documentation clearly states zh-CN is default; explain how to opt-out |

## Documentation / Operational Notes

- Add "Document Language" section to plugin README
- Update AGENTS.md config section to mention language setting
- No HKTMemory changes needed — embeddings are language-agnostic

## Sources & References

- **Origin document:** [docs/brainstorms/chinese-document-output-requirements.md](docs/brainstorms/chinese-document-output-requirements.md)
- Config pattern: `plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:46-52`
- Config template: `plugins/galeharness-cli/skills/gh-setup/references/config-template.yaml`
