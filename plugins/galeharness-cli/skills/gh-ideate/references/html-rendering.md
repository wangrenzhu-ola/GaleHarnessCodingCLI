# Ideation HTML Rendering

Use this reference when `gh:ideate` writes the default `output:html` artifact.

## Invariant

Write exactly one self-contained `.html` file. Do not also write a markdown artifact unless the user explicitly requested `output:md`.

## File Shape

- Path: `docs/ideation/YYYY-MM-DD-<topic>-ideation.html` (or the resolved `gale-knowledge` ideation directory plus the dual-write copy).
- Include `<!doctype html>`, `<html lang="...">`, `<meta charset="utf-8">`, a responsive viewport, and a `<title>` matching the artifact title.
- Inline CSS in a `<style>` block; do not reference external stylesheets, scripts, fonts, images, or CDN assets.
- Keep the artifact readable as a standalone file opened directly from disk.

## Content Shape

Render the same information as the markdown contract:

1. A concise header with title, date, topic, focus, output mode, and source context.
2. Codebase Context / grounding summary.
3. Ranked survivor cards with title, description, warrant, rationale, downsides, confidence, and complexity.
4. Rejection Summary table.
5. Next steps: brainstorm one idea, iterate on one idea, discard, or done.

Use semantic HTML (`<main>`, `<section>`, `<article>`, `<table>`) and plain text content. Escape all user-supplied or repository-derived text so it cannot become executable markup.

## Chat Summary

After writing the HTML file, do not paste the full artifact into chat. Report:

- the absolute path,
- the top 5-7 survivor titles with one-line rationales,
- any notable rejected class,
- the next-step menu.
