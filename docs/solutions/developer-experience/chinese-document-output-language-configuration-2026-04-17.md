---
title: Chinese Document Output via Language Configuration
date: 2026-04-17
category: docs/solutions/developer-experience/
module: documentation
problem_type: developer_experience
component: documentation
severity: medium
applies_when:
  - Teams using GaleHarnessCLI workflows primarily in Chinese
  - Projects requiring localized documentation output
  - Repositories with Chinese-speaking contributors
tags: [language, i18n, documentation, config, chinese, zh-CN]
---

# Chinese Document Output via Language Configuration

## Context

Chinese-speaking teams using GaleHarnessCLI workflow skills (`gh:brainstorm`, `gh:plan`, `gh:compound`, etc.) received all document output in English by default. This created friction for teams that communicate primarily in Chinese, as they needed to mentally translate or post-process documentation for local consumption.

The plugin is authored once but used by global teams. A language configuration option allows teams to specify output language preferences without modifying skill files or templates.

## Guidance

Add a `language` setting to `.compound-engineering/config.local.yaml` to control document output language:

```yaml
# .compound-engineering/config.local.yaml
language: zh-CN  # zh-CN (Chinese, default) or en (English)
```

**Implementation pattern** — Add a pre-resolution config block BEFORE all phases in each skill's SKILL.md:

```markdown
**Config (pre-resolved):**
!`cat "$(git rev-parse --show-toplevel 2>/dev/null)/.compound-engineering/config.local.yaml" 2>/dev/null || cat "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")/.compound-engineering/config.local.yaml" 2>/dev/null || echo '__NO_CONFIG__'`

If the block above contains `language: en`, write documents in English.
If `__NO_CONFIG__` or `language: zh-CN` or no language key, write documents in Chinese (default).
```

**Document Language directive** — Place in document writing sections:

```markdown
**Document Language**: When `language: zh-CN` (or default), write all prose content in Chinese. Keep section headers (`## Problem Frame`, `## Requirements`, etc.) and YAML frontmatter keys in English. Translate paragraphs, list items, and table content. Do NOT translate code blocks, inline code, file paths, or URLs.
```

## Why This Matters

1. **Reduces translation overhead** — Teams can immediately use generated documentation without translation step
2. **Maintains tool compatibility** — Structure remains English, only prose content changes
3. **Supports worktrees** — Config reading includes worktree-to-main fallback via `git-common-dir`
4. **Graceful degradation** — Missing config defaults to zh-CN, never blocks workflow

## When to Apply

- Chinese-speaking teams using GaleHarnessCLI workflows
- Projects with documentation consumers who prefer Chinese
- Any GaleHarnessCLI installation supporting multilingual teams

## Examples

**Config template addition** (`plugins/galeharness-cli/skills/gh-setup/references/config-template.yaml`):

```yaml
# --- Document language ---

# language: zh-CN                 # zh-CN | en (default: zh-CN)
                                 # Controls output language for workflow skills.
                                 # When zh-CN: prose in Chinese, structure in English.
                                 # When en: all output in English.
```

**Skill modification pattern** (applied to 6 skills):

| Skill | Files Modified |
|-------|----------------|
| `gh:brainstorm` | SKILL.md, references/requirements-capture.md |
| `gh:plan` | SKILL.md |
| `gh:compound` | SKILL.md, assets/resolution-template.md |
| `gh:compound-refresh` | SKILL.md, assets/resolution-template.md |
| `gh:ideate` | SKILL.md, references/post-ideation-workflow.md |
| `document-review` | SKILL.md, references/review-output-template.md |

**Headless mode behavior**:

Document-review's headless mode JSON output also follows language setting. Field names stay English for programmatic consumption; `description` content follows `language` config.

## Related

- Requirements doc: `docs/brainstorms/chinese-document-output-requirements.md`
- Plan doc: `docs/plans/2026-04-17-001-feat-chinese-document-output-plan.md`
- Config pattern source: `plugins/galeharness-cli/skills/gh-work-beta/SKILL.md:46-52`
