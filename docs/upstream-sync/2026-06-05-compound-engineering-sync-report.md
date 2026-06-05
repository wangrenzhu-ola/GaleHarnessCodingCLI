# Compound Engineering Upstream Sync Report - 2026-06-05

## Summary

Synchronized selected workflow improvements from `https://github.com/everyinc/compound-engineering-plugin` into GaleHarnessCLI using the repo's `gh:` naming and Gale/HKT conventions. This is a semantic sync, not a whole-repo merge: upstream and GaleHarnessCLI have diverged structurally, so direct merge would replace local Gale-specific surfaces and vendor/runtime work.

## Source Range

- Upstream repo: `everyinc/compound-engineering-plugin`
- Previous effective sync anchor: `82b8af4` (`fix(ce-coherence-reviewer): remove Bash from tool allowlist`)
- Upstream target inspected: `c905322` (`chore: release main (#902)`)
- Local base: `origin/main` at `94fc651`
- Working branch: `chore/sync-upstream-compound-20260605`

## Imported Changes

| Upstream commit | GaleHarnessCLI adaptation |
| --- | --- |
| `fbd0faf` `feat(ce-plan): approach-altitude plan-for-a-plan with ce-work non-code carve-out` | Added `gh-plan` approach-altitude routing, plus `gh-work` and `gh-work-beta` handling for `execution: knowledge-work` plans. Added dedicated reference files. |
| `63b6b26` `fix(ce-polish): promote from beta to stable` | Renamed `gh-polish-beta` to stable `gh-polish`, updated README and `gh-review` downstream references, and added regression coverage that the beta directory is gone. |
| `7c4bb16` `feat(skill): introduce CONCEPTS.md as shared vocabulary substrate` | Added root `CONCEPTS.md`, duplicated `concepts-vocabulary.md` into `gh-compound` and `gh-compound-refresh`, and wired conservative vocabulary capture/reconciliation instructions into both skills. |

## Adaptation Rules Applied

- Preserved `gh:` command naming and `plugins/galeharness-cli/` layout.
- Preserved GaleHarness-specific HKTMemory and `gale-knowledge` behavior in `gh-compound`.
- Did not import upstream release automation, package version bumps, or broad docs reshuffles.
- Did not mechanically merge upstream `ce:` skill bodies where they would overwrite local workflow customizations.

## Not Included In This PR

- Upstream release-only commits and changelog/version changes.
- Large `ce-plan` / `ce-brainstorm` HTML-output contract changes from `11e12e5`; they require a separate product decision because this repo currently keeps different planning and HKT flow structure.
- Large `ce-code-review` lean-skill refactors from `3eedade` and `d54501c`; those touch a wide review contract and should land as a focused review PR.
- Upstream `ce-promote` and `ce-dogfood-beta` new skills; they need separate naming, docs, and release-validation review before import.

## Verification

- `bun test tests/compound-support-files.test.ts tests/pipeline-review-contract.test.ts tests/upstream-capability-skills.test.ts` -> pass
- `bun run release:validate` -> pass
- `bun test` -> pass: 1388 pass, 3 skip, 0 fail
- Namespace scan over changed active files found no real `ce:` / `ce-` command-token leftovers.

## Residual Risks

- `gh-polish` promotion removes the beta command directory. Historical docs and changelog entries still mention `gh-polish-beta` as past context; active README and skill references now use `gh-polish`.
- `CONCEPTS.md` starts with upstream-seeded vocabulary adapted to GaleHarnessCLI. Future `gh-compound` and `gh-compound-refresh` runs should refine definitions as real project terms surface.
