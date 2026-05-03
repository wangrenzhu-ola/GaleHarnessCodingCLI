import { execFileSync } from "child_process"
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"
import { describe, expect, test } from "bun:test"

const SKILL_PATH = path.join(
  process.cwd(),
  "plugins/galeharness-cli/skills/gh-update/SKILL.md",
)
const SKILL_BODY = readFileSync(SKILL_PATH, "utf8")

describe("gh-update SKILL.md", () => {
  test("uses claude plugin update instead of cache deletion", () => {
    expect(SKILL_BODY).toContain("claude plugin update galeharness-cli@{marketplace-name}")
    expect(SKILL_BODY).toContain("${CLAUDE_SKILL_DIR}")
    expect(SKILL_BODY).not.toContain("rm -rf")
    expect(SKILL_BODY).not.toContain("${CLAUDE_PLUGIN_ROOT}")
  })
})

// Regression guard adapted from upstream compound-engineering-plugin #660.
//
// The marketplace installs plugin contents from `main` HEAD, so the cache
// folder basename reflects `plugin.json` at install time, not any release tag.
// Comparing the installed folder against the latest GitHub release tag caused
// a persistent false-positive "out of date" whenever `main` was ahead of the
// last tag, and the prescribed fix reinstalled the same version in a loop.
describe("gh-update runtime probe scripts", () => {
  test("declares runtime script probes instead of unsafe pre-resolution commands", () => {
    expect(SKILL_BODY).toContain("## Runtime probes")
    expect(SKILL_BODY).toContain('bash "${CLAUDE_SKILL_DIR}/scripts/upstream-version.sh"')
    expect(SKILL_BODY).toContain('bash "${CLAUDE_SKILL_DIR}/scripts/currently-loaded-version.sh"')
    expect(SKILL_BODY).toContain('bash "${CLAUDE_SKILL_DIR}/scripts/marketplace-name.sh"')
    expect(SKILL_BODY).not.toMatch(/\*\*Latest upstream version:\*\*\s*\n!`/)
  })

  test("returns the version from main's plugin.json, not any release tag", () => {
    const stdout = runUpstreamCommand(upstreamVersionScript(), {
      pluginJsonVersion: "99.0.0",
      releaseTagVersion: "1.0.0",
    })

    expect(stdout).toBe("99.0.0")
  })

  test("emits __GH_UPDATE_VERSION_FAILED__ when upstream plugin.json cannot be read", () => {
    const stdout = runUpstreamCommand(upstreamVersionScript(), {
      ghExitCode: 1,
    })

    expect(stdout).toContain("__GH_UPDATE_VERSION_FAILED__")
  })
})

function upstreamVersionScript(): string {
  return path.join(
    process.cwd(),
    "plugins/galeharness-cli/skills/gh-update/scripts/upstream-version.sh",
  )
}

type MockOptions = {
  pluginJsonVersion?: string
  releaseTagVersion?: string
  ghExitCode?: number
}

function runUpstreamCommand(command: string, options: MockOptions): string {
  const { pluginJsonVersion, releaseTagVersion, ghExitCode } = options
  const mockDir = mkdtempSync(path.join(tmpdir(), "gh-update-gh-"))

  try {
    const pluginJsonB64 = pluginJsonVersion
      ? Buffer.from(
          JSON.stringify({ name: "galeharness-cli", version: pluginJsonVersion }),
        ).toString("base64")
      : ""
    const releaseJson = releaseTagVersion
      ? JSON.stringify([{ tagName: `galeharness-cli-v${releaseTagVersion}` }])
      : "[]"

    const ghScript = `#!/bin/bash
${ghExitCode !== undefined ? `exit ${ghExitCode}` : `
subcommand="$1"; shift
jq_filter=""
while [ $# -gt 0 ]; do
  case "$1" in
    --jq) jq_filter="$2"; shift 2 ;;
    *) shift ;;
  esac
done
case "$subcommand" in
  api)
    case "$jq_filter" in
      *'.version'*) printf '%s\\n' '${pluginJsonVersion ?? ""}' ;;
      '') printf '%s\\n' '{"content":"${pluginJsonB64}"}' ;;
      *) echo "unexpected --jq filter for gh api: $jq_filter" >&2; exit 2 ;;
    esac
    ;;
  release)
    case "$jq_filter" in
      *'tagName'*) printf '%s\\n' '${releaseTagVersion ?? ""}' ;;
      '') printf '%s\\n' '${releaseJson}' ;;
      *) echo "unexpected --jq filter for gh release: $jq_filter" >&2; exit 2 ;;
    esac
    ;;
  *) exit 1 ;;
esac
`}`
    const ghPath = path.join(mockDir, "gh")
    writeFileSync(ghPath, ghScript)
    chmodSync(ghPath, 0o755)

    return execFileSync("bash", [command], {
      env: { ...process.env, PATH: `${mockDir}:${process.env.PATH ?? ""}` },
      encoding: "utf8",
    }).trim()
  } finally {
    rmSync(mockDir, { recursive: true, force: true })
  }
}
