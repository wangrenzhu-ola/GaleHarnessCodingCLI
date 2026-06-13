# Ideation Markdown Rendering

Use this reference only when the user explicitly requests `output:md` or local config sets `ideate_output: md`.

## Invariant

Write exactly one markdown file. Do not also write an HTML artifact unless the user explicitly asks for a conversion after the markdown run.

## File Shape

- Path: `docs/ideation/YYYY-MM-DD-<topic>-ideation.md` (or the resolved `gale-knowledge` ideation directory plus the dual-write copy).
- Include YAML frontmatter with `date`, `topic`, `focus` when present, and `output: md`.
- Keep section headers in English even when prose is localized.

## Content Shape

Use the existing markdown artifact template from `post-ideation-workflow.md`, including Codebase Context, Ranked Ideas, and Rejection Summary.

Markdown mode is primarily for downstream tools that require markdown, including Proof sharing and document review. For human review, prefer the default self-contained HTML artifact.
