---
name: gh:update
description: |
  Check if the GaleHarnessCLI plugin is up to date and recommend the
  update command if not.
  Use when the user says "update gale harness", "check gale harness version",
  "gh update", "is gale harness up to date", "update gh plugin", or reports issues
  that might stem from a stale GaleHarnessCLI plugin version. This skill only works
  in Claude Code — it relies on the plugin harness cache layout.
disable-model-invocation: true
allowed-tools: Bash(bash *upstream-version.sh), Bash(bash *currently-loaded-version.sh), Bash(bash *marketplace-name.sh)
ce_platforms: [claude]
---

# Check Plugin Version

Verify the installed GaleHarnessCLI plugin version matches the upstream
`plugin.json` on `main`, and recommend the update command if it doesn't.
Claude Code only.

> **Note:** This skill updates the **plugin cache** only. To update the CLI binary
> itself, run `gale-harness update` from your terminal.

## Runtime probes

Only the **Skill directory** determines whether this session is Claude Code -- if empty or unresolved, the skill requires Claude Code. Probe versions at runtime rather than through `!` pre-resolution so Claude Code permission checks do not reject nested command substitutions or bundled shell scripts.

Run these probes from the skill body using the documented `${CLAUDE_SKILL_DIR}` substitution:

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/upstream-version.sh"
bash "${CLAUDE_SKILL_DIR}/scripts/currently-loaded-version.sh"
bash "${CLAUDE_SKILL_DIR}/scripts/marketplace-name.sh"
```

The upstream version comes from `plugins/galeharness-cli/.claude-plugin/plugin.json` on `main` rather than the latest GitHub release tag, because the marketplace installs plugin contents from `main` HEAD. Comparing against release tags false-positives whenever `main` is ahead of the last tag.

## Decision logic

### 1. Platform gate

If **Skill directory** is empty or unresolved: tell the user this skill
requires Claude Code and stop. No further action.

### 2. Handle failure cases

If **Latest upstream version** contains `__GH_UPDATE_VERSION_FAILED__`: tell
the user the upstream version could not be fetched (gh may be unavailable or
rate-limited) and stop.

If **Currently loaded version** contains `__GH_UPDATE_NOT_MARKETPLACE__`: this
session loaded the skill from outside the standard marketplace cache (typical
when using `claude --plugin-dir` for local development, or for a non-standard
install). Tell the user (substituting the actual path):

> "Skill is loaded from `{skill-directory}` -- not the standard marketplace
> cache at `~/.claude/plugins/cache/`. This is normal when using
> `claude --plugin-dir` for local development. No action for this session.
> Your marketplace install (if any) is unaffected -- run `/gh:update` in a
> regular Claude Code session (no `--plugin-dir`) to check that cache."

Then stop.

### 3. Compare versions

**Up to date** — `{currently loaded} == {latest upstream}`:

> "GaleHarnessCLI **v{version}** is installed and up to date."

**Out of date** — `{currently loaded} != {latest upstream}`:

> "GaleHarnessCLI is on **v{currently loaded}** but **v{latest upstream}** is available.
>
> Update with:
> ```
> claude plugin update galeharness-cli@{marketplace-name}
> ```
> Then restart Claude Code to apply."

The `claude plugin update` command ships with Claude Code itself and updates
installed plugins to their latest version; it replaces earlier manual cache
sweep / marketplace-refresh workarounds. The marketplace name is derived from
the skill path rather than hardcoded because this plugin may be distributed
under multiple marketplace names.

To also update the CLI binary, run `gale-harness update` from your terminal.
