---
title: "Upstream Compound Engineering v3.12.0 workflow sync mapping"
date: 2026-06-13
category: workflow
module: galeharness-cli
upstream_repo: EveryInc/compound-engineering-plugin
upstream_release: compound-engineering-v3.12.0
upstream_release_commit: 4719dc5
upstream_feature_commit: e74e29864fbfa2f800fc3e08509e2966e4947f1e
upstream_fix_commit: b6250490bec4c0488d68ad66d72bd99f6edb95fd
sync_scope: selected-workflow-adaptation
---

# Upstream Compound Engineering v3.12.0 workflow sync mapping

## Context

The upstream Compound Engineering repository latest published release checked for this sync was `compound-engineering-v3.12.0`, tagged at release commit `4719dc5` on 2026-06-09. The release notes called out two relevant source commits:

- `e74e29864fbfa2f800fc3e08509e2966e4947f1e` — HTML-first ideation docs and a status-free plan model.
- `b6250490bec4c0488d68ad66d72bd99f6edb95fd` — `ce-release-notes` placeholder links.

The local shell environment could not clone or fetch GitHub directly because HTTPS requests failed with a `CONNECT tunnel failed, response 403` error. This sync therefore used the GitHub web-rendered release and commit diff as the upstream source of truth and adapted the workflow behavior manually into GaleHarnessCLI's `gh:` namespace.

## Local Adaptation

This PR maps the upstream workflow changes into GaleHarnessCLI as follows:

| Upstream intent | GaleHarnessCLI adaptation |
|---|---|
| Ideation artifacts are HTML-first and human-facing by default. | `gh:ideate` now defaults to a single self-contained HTML artifact, with `output:md` as the explicit markdown escape hatch. |
| HTML and markdown outputs are mutually exclusive per run. | The ideation workflow and rendering references instruct agents to write exactly one artifact for the selected mode. |
| Ideation handoff should not depend on status markers. | `gh:ideate` passes selected idea substance directly into `gh:brainstorm`; legacy `Status:` markers are no longer the handoff contract. |
| Plans are decision artifacts, not execution state. | New `gh:plan` templates omit `status: active`; `gh:work` and `gh:work-beta` leave plan frontmatter/body read-only and derive shipped state from git, PR metadata, and task-board events. |

## Baseline Note

`.upstream-ref` remains unchanged in this PR. The changes are a selected workflow adaptation from the latest upstream release, not a full replay of every upstream commit since the current recorded baseline. Keeping `.upstream-ref` unchanged preserves the integrity of the per-commit sync tooling, which expects that file to mean every upstream commit through that SHA has been processed.
