---
date: 2026-04-17
topic: chinese-document-output
---

# Chinese Document Output

## Problem Frame

The GaleHarnessCLI workflow skills (`gh:brainstorm`, `gh:plan`, `gh:compound`, etc.) currently produce all output documents in English. For Chinese-speaking teams, this creates friction when reviewing requirements documents, implementation plans, and solution writeups. Team members must mentally translate or use external tools to convert documentation to Chinese.

The user needs all workflow-generated documents to be written in Chinese by default, while keeping the document structure (section headers, template formats) in English for tool compatibility.

## Requirements

**Configuration**

- R1. The plugin MUST support a `language` setting in `.compound-engineering/config.local.yaml`
- R2. Valid values MUST be `zh-CN` (Chinese) and `en` (English)
- R3. Default value MUST be `zh-CN` (Chinese) when not configured
- R4. The `gh:setup` skill MUST include `language` in the config template with documentation

**Skill Behavior**

- R5. `gh:brainstorm` MUST write requirements documents in Chinese when `language: zh-CN`
- R6. `gh:plan` MUST write implementation plans in Chinese when `language: zh-CN`
- R7. `gh:compound` MUST write solution documents in Chinese when `language: zh-CN`
- R8. `gh-compound-refresh` MUST write updated solution documents in Chinese when `language: zh-CN`
- R9. `gh:ideate` MUST present ideation results in Chinese when `language: zh-CN`
- R10. `document-review` MUST present review findings in Chinese when `language: zh-CN`

**Document Structure Preservation**

- R11. All documents MUST keep section headers in English (e.g., `## Problem Frame`, `## Requirements`)
- R12. All documents MUST keep YAML frontmatter keys in English
- R13. Only prose content and bullet points MUST be written in Chinese

## Success Criteria

- When `language: zh-CN` is set (or defaulted), all workflow documents are written in Chinese
- When `language: en` is set, documents remain in English (current behavior)
- Document structure remains compatible with existing tools and parsers
- No breaking changes to document formats or frontmatter schemas

## Scope Boundaries

- NOT translating the SKILL.md files themselves
- NOT translating reference files (`references/*.md`, `assets/*.md`)
- NOT changing HKTMemory storage behavior (vector embeddings remain language-agnostic)
- NOT adding multi-language support beyond Chinese and English

## Key Decisions

- **Default to Chinese**: When no config exists, documents default to Chinese. This reduces friction for Chinese teams while allowing English teams to opt-out via explicit `language: en` setting.
- **English structure, Chinese content**: Section headers and template structure stay in English for tool compatibility. Only prose content becomes Chinese.

## Dependencies / Assumptions

- Assumes the LLM executing the skill can follow language instructions in the skill content
- Assumes config file location follows existing convention (`.compound-engineering/config.local.yaml`)
- Assumes config reading pattern using pre-resolution commands works across all agent platforms

## Implementation Notes

**Config Template Addition** (`gh-setup/references/config-template.yaml`):

```yaml
# --- Document Language ---

# language: zh-CN  # zh-CN (Chinese, default) | en (English)
```

**Skill Modification Pattern**:

Each affected skill should include:

1. Pre-resolution command to read config:
   ```
   !`cat "$(git rev-parse --show-toplevel 2>/dev/null)/.compound-engineering/config.local.yaml" 2>/dev/null || echo 'language: zh-CN'`
   ```

2. Language directive in the document writing section:
   ```
   **Document Language**: Write all prose content in Chinese (zh-CN). Keep section headers, YAML keys, and template structure in English.
   ```

## Next Steps

-> /gh:plan for structured implementation planning
