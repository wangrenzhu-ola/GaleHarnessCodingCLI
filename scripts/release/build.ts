/**
 * Release build script — compile CLI binaries for distribution.
 *
 * Usage:
 *   bun run scripts/release/build.ts [--version <version>] [--platform <platform>]
 *
 * Options:
 *   --version   Version string (defaults to package.json version)
 *   --platform  Platform suffix, e.g. linux-x64 (defaults to current platform)
 *
 * Output:
 *   Writes galeharness-cli-{version}-{platform}.tar.gz to the repo root.
 *   Prints the tar.gz file path to stdout (for CI consumption).
 */

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  RELEASE_BINARY_BASENAMES,
  detectReleasePlatform,
  getReleaseBinaryFileName,
  getReleasePlatformConfig,
} from "../../src/utils/release-platforms"

// ── Parse CLI args ──────────────────────────────────────────────────────────

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1]
      i++
    }
  }
  return result
}

const parsed = parseArgs(process.argv.slice(2))

// ── Resolve version ─────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "../..")
const packageJsonPath = path.join(repoRoot, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
const version = parsed.version || packageJson.version
const platform = parsed.platform || detectReleasePlatform()
const platformConfig = getReleasePlatformConfig(platform)

// ── Build ───────────────────────────────────────────────────────────────────

const buildDir = path.join(os.tmpdir(), `galeharness-build-${version}-${platform}`)
const archiveName = `galeharness-cli-${version}-${platform}.tar.gz`
const archivePath = path.join(repoRoot, archiveName)

// Clean previous build artifacts
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true })
}
fs.mkdirSync(buildDir, { recursive: true })

if (fs.existsSync(archivePath)) {
  fs.unlinkSync(archivePath)
}

console.error(`[build] Compiling binaries (v${version}, ${platform}, target ${platformConfig.bunTarget})...`)

// 1. Compile gale-harness (src/index.ts)
const galeHarnessBinary = getReleaseBinaryFileName("gale-harness", platform)
execFileSync(
  "bun",
  [
    "build",
    "--compile",
    "src/index.ts",
    "--outfile",
    path.join(buildDir, galeHarnessBinary),
    "--target",
    platformConfig.bunTarget,
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
)

// 2. Copy as compound-plugin (same entry point, different binary name)
fs.copyFileSync(
  path.join(buildDir, galeHarnessBinary),
  path.join(buildDir, getReleaseBinaryFileName("compound-plugin", platform)),
)

// 3. Compile auxiliary CLIs.
for (const [basename, entrypoint] of [
  ["gale-knowledge", "cmd/gale-knowledge/index.ts"],
  ["gale-memory", "cmd/gale-memory/index.ts"],
] as const) {
  execFileSync(
    "bun",
    [
      "build",
      "--compile",
      entrypoint,
      "--outfile",
      path.join(buildDir, getReleaseBinaryFileName(basename, platform)),
      "--target",
      platformConfig.bunTarget,
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  )
}

// 4. Write VERSION file
fs.writeFileSync(path.join(buildDir, "VERSION"), `${version}\n`, "utf-8")

// 5. Package into tar.gz
console.error(`[build] Packaging ${archiveName}...`)
const archiveFiles = [
  ...RELEASE_BINARY_BASENAMES.map((basename) => getReleaseBinaryFileName(basename, platform)),
  "VERSION",
]
execFileSync("tar", ["-czf", archivePath, "-C", buildDir, ...archiveFiles], {
  cwd: repoRoot,
  stdio: "inherit",
})

// 6. Clean up build directory
fs.rmSync(buildDir, { recursive: true, force: true })

// 7. Print archive path to stdout (for CI)
console.log(archivePath)
