---
title: "feat: Windows deployment verification with 4-layer CI guardrails"
type: feat
status: active
date: 2026-04-18
origin: docs/brainstorms/2026-04-18-windows-deploy-verification-requirements.md
---

# feat: Windows deployment verification with 4-layer CI guardrails

## Overview

Hermes Agent currently lacks Windows CI coverage and systematic bash-compatibility detection. This plan introduces a 4-layer verification stack — Windows CI smoke tests, a bash-compatibility static scanner, `path.win32` simulation tests, and a Reviewer Agent gate — to catch Windows deployment failures before they reach users.

## Problem Frame

Windows users experience silent or hard failures during installation and deployment because:
- No CI runs on `windows-latest`, so Windows-specific regressions are only discovered in production.
- Bash scripts (`install.sh`, `setup-hermes.sh`, `scripts/kill_modal.sh`) and Python `subprocess` calls with hard-coded `bash`/`sh` are not automatically flagged.
- The colon-path fix landed without automated verification, leaving a gap in path-handling coverage.
- There is no automated gate to ensure new bash dependencies are reviewed for Windows impact.

(see origin: docs/brainstorms/2026-04-18-windows-deploy-verification-requirements.md)

## Requirements Trace

- **R1** → Unit 1: Add `windows-latest` CI job with smoke tests for install, deploy, and health-check paths.
- **R2** → Unit 2: Build a static scanner that detects bash shebangs, `command -v`, `brew install`, `rm -rf`, `mkdir -p`, hard-coded `/` paths, and Python `subprocess` calls to `bash`/`sh`.
- **R3** → Unit 3: Create `path.win32` simulation tests covering path joining, cache directory resolution, config file writes, and colon-path edge cases.
- **R4** → Unit 4: Define Reviewer Agent rules, PR label automation (`windows-compat-review-required`), and a review checklist. Initial mode is mark-and-notify only; no merge blocking.

## Scope Boundaries

- In Scope: CI configuration, static scanner, path simulation tests, Reviewer Agent rules and labels.
- Out of Scope: Rewriting existing bash scripts as PowerShell (deferred to future work); general cross-platform abstraction library design; uv or third-party Windows native fixes.

## Context & Research

### Relevant Code and Patterns

- `scripts/install.sh` exits with error on Windows (CYGWIN/MINGW/MSYS detection) and redirects to `scripts/install.ps1`.
- `scripts/install.ps1` is a 930-line PowerShell installer handling uv, Python, Node.js, PATH, and git atomic I/O workarounds.
- `tools/environments/local.py` uses `_IS_WINDOWS = platform.system() == "Windows"` to guard `preexec_fn=os.setsid` and `os.killpg`.
- `tests/tools/test_windows_compat.py` already uses AST parsing to verify no unguarded POSIX-only calls in `local.py`, `process_registry.py`, `code_execution_tool.py`, and `whatsapp.py`.
- `tools/code_execution_tool.py` is entirely disabled on Windows (`SANDBOX_AVAILABLE = sys.platform != "win32"`) due to Unix domain sockets.
- `hermes_cli/config.py` forces `encoding="utf-8"` on Windows to avoid `cp1252` defaults.
- No `.github/workflows/` directory exists; CI must be built from scratch.
- No `docs/solutions/` directory exists.

### Institutional Learnings

- HKTMemory records confirm recurring Windows issues: uv PATH failures, bash script incompatibilities, and colon-path problems.
- The existing `_IS_WINDOWS` guard pattern is the established convention; new cross-platform code should follow it.

### External References

- GitHub Actions billing: `windows-latest` costs 2× Linux minutes; Free Tier = 2000 min/month.
- `path.win32` documentation (Node.js): https://nodejs.org/api/path.html#pathwin32

## Key Technical Decisions

1. **Scanner as a TypeScript CLI (`scripts/windows-compat-scan.ts`)**: The project already uses Node.js for browser and WhatsApp bridge tooling. Using TypeScript for the scanner keeps it in the same toolchain as the Node-based parts of the project and makes it easy to run in CI via `bun`/`tsx`.
2. **path.win32 tests in TypeScript (`tests/path-win32-compat.test.ts`)**: Using the Node.js `path.win32` module allows simulation of Windows path semantics on Linux CI runners, removing the need for a real Windows host for path-level tests.
3. **CI smoke test scope limited to `bun install → release:validate → bun test`**: Rather than running the full Python test suite (which has Windows-incompatible components like UDS sandbox), the Windows CI focuses on install-time validation and the Windows-compat test subset. This keeps minutes under budget.
4. **Reviewer Agent initial mode = notify only**: Hard merge-blocking is deferred until the Reviewer Agent has been calibrated and proven reliable. This avoids bug-induced PR lockouts.

## Open Questions

### Resolved During Planning

- **Q: Should the scanner block CI on findings?** → Yes for R2, but only as a required check after a grace period. Initially run in report-only mode for one week to tune false positives.
- **Q: Should path.win32 tests run on Linux CI too?** → Yes. They are simulation tests; running them on both Linux and Windows CI provides regression coverage on the cheapest runner.

### Deferred to Implementation

- **Exact scanner rule severity weights**: Determined after tuning on the real codebase during the grace period.
- **Reviewer Agent implementation mechanism**: Whether it runs as a GitHub Action, a dedicated bot, or an external webhook will be decided when the agent itself is built.

## Implementation Units

**Execution order:** Units 1, 2, and 3 can be developed in parallel. Unit 4 depends on Unit 2 (the scanner must exist to generate bash-change signals for PR labeling), so Unit 4 should start after Unit 2 is functional.

- [ ] **Unit 1: GitHub Actions Windows CI workflow**

**Goal:** Create a `.github/workflows/ci.yml` that runs smoke tests on `windows-latest` within the Free Tier budget.

**Requirements:** R1, Success Criteria #1

**Dependencies:** None

**Files:**
- Create: `.github/workflows/ci.yml`
- Test: `.github/workflows/ci.yml` (validated via workflow dispatch or PR)

**Approach:**
- Use a matrix strategy with `os: [ubuntu-latest, windows-latest]`.
- Limit Windows job to smoke tests: `bun install`, `release:validate`, `bun test`.
- Skip known Windows-incompatible Python tests via `@pytest.mark.skipif(sys.platform == "win32", reason="...")` for individual tests (e.g., Unix domain socket tests in `test_code_execution.py`), and use `pytest --ignore=tests/tools/test_code_execution.py` in the CI workflow for entire files that are fundamentally incompatible.
- Set job timeout to 15 minutes to stay within budget.

**Patterns to follow:**
- Standard GitHub Actions workflow syntax.

**Test scenarios:**
- Happy path: Workflow runs successfully on `windows-latest` and reports green.
- Edge case: Workflow gracefully skips Windows-incompatible test files (e.g., `test_code_execution.py`).
- Error path: A deliberate Windows breakage (e.g., unconditional `os.setsid`) causes the Windows job to fail while the Ubuntu job passes.

**Verification:**
- Opening a PR triggers the workflow; the Windows job completes in under 15 minutes.

---

- [ ] **Unit 2: Bash-compatibility static scanner**

**Goal:** Build `scripts/windows-compat-scan.ts` that detects bash-specific constructs and hard-coded Unix assumptions.

**Requirements:** R2, Success Criteria #2

**Dependencies:** None

**Files:**
- Create: `scripts/windows-compat-scan.ts`
- Create: `scripts/windows-compat-scan-config.json` (rule severity config)
- Test: `tests/windows-compat-scan.test.ts` (unit tests for the scanner's detection logic — each rule is tested against synthetic positive/negative samples)

**Approach:**
- Parse source files with lightweight line-by-line scanning (no heavy NLP).
- Detect categories:
  - Bash shebangs (`#!/bin/bash`, `#!/bin/sh`)
  - `command -v` usage
  - `brew install` / `apt-get` / `yum`
  - `rm -rf`, `mkdir -p`, `cp -r`
  - Hard-coded forward-slash paths (e.g., `/tmp/`, `/usr/local/`)
  - Python `subprocess` calls with `bash` or `sh` as the executable
- Output structured JSON or SARIF for CI consumption.
- Configurable severity per rule.

**Execution note:** Run in report-only mode for one week before enabling as a required check.

**Patterns to follow:**
- Keep the scanner fast (< 5s for the whole repo) using simple regex/AST, matching the lightweight style of `tests/tools/test_windows_compat.py`.

**Test scenarios:**
- Happy path: Scanning the current repo produces a report with known bash scripts flagged at the correct line numbers.
- Edge case: A Python file using `subprocess.run(["bash", "-c", ...])` is flagged; one using `subprocess.run(["cmd", "/c", ...])` on a `_IS_WINDOWS` branch is not.
- Error path: A file with a false positive can be excluded via `windows-compat-scan-config.json`.
- Integration: Running the scanner in CI exits 0 during the grace period and exits 1 after grace period if new bash dependencies are introduced.

**Verification:**
- Run `time bun scripts/windows-compat-scan.ts` against the repo and confirm it flags `scripts/install.sh`, `setup-hermes.sh`, and Python subprocess/bash calls. Measure wall-clock time with `time` or CI timestamps; the scanner should consistently complete in under 5 seconds.

---

- [ ] **Unit 3: path.win32 simulation test suite**

**Goal:** Create `tests/path-win32-compat.test.ts` to validate Windows path semantics using Node.js `path.win32` on Linux CI.

**Requirements:** R3, Success Criteria #3

**Dependencies:** None

**Files:**
- Create: `tests/path-win32-compat.test.ts`
- Modify: `tests/tools/test_windows_compat.py` (add cross-reference comment if needed)

**Approach:**
- Use `path.win32.join`, `path.win32.resolve`, `path.win32.normalize` to simulate Windows path behavior.
- Cover:
  - Cache directory resolution (e.g., `~/.hermes/` → `C:\Users\<user>\.hermes\`)
  - Config file write paths
  - Colon in paths (the known fixed bug)
  - Drive letter handling (`C:\` vs `D:\`)
  - Backslash vs forward slash normalization
  - Path segments with spaces
- Mirror the test style of existing `tests/tools/test_windows_compat.py` for consistency in intent.

**Patterns to follow:**
- Node.js `path.win32` API.
- Existing `tests/tools/test_windows_compat.py` naming and organization conventions.

**Test scenarios:**
- Happy path: `path.win32.join('C:\\Users', 'hermes', 'config.yaml')` produces `C:\Users\hermes\config.yaml`. (Note: in JS source code `'C:\\Users'` is a string literal containing one backslash; `path.win32.join` returns a string with single backslashes.)
- Edge case: Path containing a colon (not drive letter) is handled correctly, verifying the known fix.
- Edge case: Path with mixed `/` and `\` separators normalizes to `\`.
- Error path: Attempting to resolve an invalid Windows path (e.g., reserved name `CON`) produces expected behavior.
- Integration: Tests pass on both `ubuntu-latest` and `windows-latest` CI runners.

**Verification:**
- `bun test tests/path-win32-compat.test.ts` passes locally and in CI.

---

- [ ] **Unit 4: Reviewer Agent gate rules and PR automation**

**Goal:** Define the Reviewer Agent behavior, PR labeling rules, and review checklist for bash-dependent changes.

**Requirements:** R4, Success Criteria #4

**Dependencies:** Unit 2 (scanner must exist to detect bash changes for labeling)

**Files:**
- Create: `agents/review/windows-compat-reviewer.md`
- Create: `.github/labeler.yml` or equivalent PR label automation config

**Approach:**
- Document the review checklist in `agents/review/windows-compat-reviewer.md`:
  - Does the change provide a PowerShell equivalent or abstraction?
  - Is the shell difference hidden behind an `_IS_WINDOWS` or equivalent guard?
  - Is Windows support status documented in the relevant README or AGENTS.md?
- Configure PR automation so that when Unit 2's scanner detects new/modified bash scripts, the label `windows-compat-review-required` is applied.
- State explicitly that the Reviewer Agent starts in **notify-only mode**; merge blocking is deferred.

**Patterns to follow:**
- Existing PR automation conventions in the repo (if any; otherwise establish minimal GitHub-native patterns).

**Test scenarios:**
- Happy path: A PR adding a new `.sh` file gets the `windows-compat-review-required` label automatically.
- Happy path: A PR modifying only `.py` files with no bash references does not get the label.
- Edge case: A PR that removes a bash script does not trigger the label.
- Integration: The review checklist is referenced by a human reviewer or the Reviewer Agent and produces actionable feedback.

**Verification:**
- A test PR with a new `.sh` file receives the label within seconds of opening.

## System-Wide Impact

- **Interaction graph:** The CI workflow touches the PR merge path; the scanner touches the lint/check path; the Reviewer Agent touches PR labels and review state.
- **Error propagation:** A failing Windows CI job or scanner finding should surface as a PR status check failure (after grace period).
- **State lifecycle risks:** The scanner config JSON may need versioning if rules evolve; document this in the scanner's README.
- **API surface parity:** No public API changes.
- **Integration coverage:** End-to-end validation: open a PR with a new bash script → label applied → scanner flags it → Windows CI smoke test still passes (if the script is not executed in smoke tests) → reviewer uses checklist.
- **Unchanged invariants:** Existing Unix/macOS install flows (`scripts/install.sh`, `setup-hermes.sh`) remain unchanged. The PowerShell installer (`scripts/install.ps1`) is not modified.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Windows CI exceeds 2000 min/month Free Tier | Limit to smoke tests only; 15-minute timeout; run on PRs only, not every push. |
| Scanner false positives exceed 5% | One-week grace period in report-only mode; configurable exclusions in `windows-compat-scan-config.json`. |
| `path.win32` tests do not catch real Windows path bugs | Supplement with actual `windows-latest` CI runs; simulation tests are regression guards, not replacements. |
| Reviewer Agent not yet implemented | Initial mode is mark-and-notify only; no merge blocking until the agent is built and calibrated. |
| Colon-path fix has no existing test to backfill | Unit 3 explicitly includes a colon-path regression test as a priority scenario. |

## Documentation / Operational Notes

- Add a "Windows Compatibility" section to the root README or CONTRIBUTING.md after Units 1–3 are landed.
- Document how to run the scanner locally: `bun scripts/windows-compat-scan.ts`.
- Document the grace period policy for the scanner (report-only → required check).

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-18-windows-deploy-verification-requirements.md](../brainstorms/2026-04-18-windows-deploy-verification-requirements.md)
- Related code: `scripts/install.sh`, `scripts/install.ps1`, `tools/environments/local.py`, `tests/tools/test_windows_compat.py`
- External docs: [Node.js path.win32 API](https://nodejs.org/api/path.html#pathwin32)
