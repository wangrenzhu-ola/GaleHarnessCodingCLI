---
title: "Codex copied skill reference Markdown must not be transformed"
date: 2026-04-24
category: integration-issues
module: src/targets/codex.ts
problem_type: integration_issue
component: tooling
symptoms:
  - "Codex copied skill reference files were rewritten even though only SKILL.md should be platform-adapted"
  - "Reference examples such as /gh:work became /prompts:gh-work"
  - "Model override examples in reference Markdown could be damaged by the Codex model sanitizer"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - src/utils/files.ts
  - src/utils/codex-content.ts
  - tests/codex-writer.test.ts
tags:
  - codex
  - markdown-transform
  - copied-skills
  - target-writer
  - converter-boundary
---

# Codex copied skill reference Markdown must not be transformed

## Problem

The Codex target writer copied full skill directories into Codex skill output. `copySkillDir` already treats `SKILL.md` as the executable instruction entrypoint and only transforms that file by default, but `src/targets/codex.ts` passed `true` for the `transformAllMarkdown` option.

That widened the Codex rewrite boundary from executable skill instructions to every Markdown file under the skill directory, including references, examples, templates, and handoff documents.

## Symptoms

Review of PR #57 caught that real Codex output rewrote reference Markdown content that should have stayed source-accurate:

- `references/plan-handoff.md` examples changed from `/gh:work` to `/prompts:gh-work`.
- Reference or example snippets containing model override syntax could be modified by the Codex model sanitizer.
- The generated docs no longer faithfully represented GaleHarnessCLI source examples.

## What Didn't Work

Treating every copied Markdown file as executable instructions was too broad. Reference files are often documentation, fixtures, or examples; they can intentionally mention source-platform commands, frontmatter, or code snippets that should not be normalized for Codex runtime behavior.

Relying on `unknownSlashBehavior: "preserve"` also did not protect this case. Known GaleHarness workflow commands like `/gh:work` are valid rewrite targets inside executable instructions, so they were converted even when they appeared in examples.

The old writer test encoded the wrong boundary by expecting a sidecar `notes.md` file to be transformed.

## Solution

Remove the broad Markdown transform flag from the Codex writer and let `copySkillDir` keep its default behavior: transform `SKILL.md`, copy sidecar Markdown files byte-for-byte.

Before:

```ts
await copySkillDir(
  sourceDir,
  destDir,
  skill,
  (content) => transformContentForCodex(content, transformOptions),
  true
);
```

After:

```ts
await copySkillDir(
  sourceDir,
  destDir,
  skill,
  (content) => transformContentForCodex(content, transformOptions)
);
```

Update the Codex writer test to assert both halves of the contract:

- copied `SKILL.md` files still get Codex invocation rewrites;
- copied reference Markdown files still preserve source examples such as `/gh:plan`.

## Why This Works

`SKILL.md` is the runtime instruction surface that Codex needs to adapt. Reference Markdown files are supporting source material. Keeping transforms limited to `SKILL.md` preserves the Codex runtime behavior without corrupting examples or reference docs.

This keeps other Codex-specific fixes intact, including frontmatter-aware description truncation and embedded agent instruction rewrites for executable skill instructions.

## Prevention

When adding or changing target writers, include sidecar Markdown fixtures in writer tests and assert whether they should be transformed or preserved. For copied skill directories, default to preserving non-entrypoint Markdown unless the transform is explicitly Markdown-aware and safe for examples, code fences, and reference material.

Real output smoke tests should inspect reference files, not only top-level generated command or skill entrypoints.

## Related

- PR: https://github.com/wangrenzhu-ola/GaleHarnessCodingCLI/pull/57
- Similar Codex target boundary issue: `docs/solutions/integration-issues/codex-skill-description-limit-2026-04-24.md`
