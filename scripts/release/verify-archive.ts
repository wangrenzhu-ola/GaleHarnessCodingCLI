/**
 * Verify a GaleHarnessCLI release archive without executing its binaries.
 *
 * Usage:
 *   bun run scripts/release/verify-archive.ts <archive.tar.gz>
 */

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import {
  RELEASE_PLATFORMS,
  getReleaseBinaryFileNames,
  getReleasePlatformConfig,
  isReleasePlatform,
} from "../../src/utils/release-platforms"

function fail(message: string): never {
  throw new Error(message)
}

function parseArchiveName(archivePath: string): { version: string; platform: string } {
  const basename = path.basename(archivePath)
  for (const platform of RELEASE_PLATFORMS) {
    const suffix = `-${platform}.tar.gz`
    if (basename.startsWith("galeharness-cli-") && basename.endsWith(suffix)) {
      const version = basename.slice("galeharness-cli-".length, -suffix.length)
      if (!version) fail(`Archive name is missing version: ${basename}`)
      return { version, platform }
    }
  }

  fail(
    `Archive name must match galeharness-cli-<version>-<platform>.tar.gz. Supported platforms: ${RELEASE_PLATFORMS.join(", ")}`,
  )
}

function assertSafeRelativeFileName(entry: string): void {
  if (!entry) fail("Archive contains an empty entry name")
  if (path.posix.isAbsolute(entry) || entry.startsWith("\\")) {
    fail(`Archive contains an absolute path: ${entry}`)
  }

  const parts = entry.split("/")
  if (parts.includes("..")) fail(`Archive contains path traversal: ${entry}`)
  if (parts.length !== 1) fail(`Archive contains nested path: ${entry}`)
}

function listArchiveNames(archivePath: string): string[] {
  return execFileSync("tar", ["-tzf", archivePath], { encoding: "utf-8" })
    .split(/\r?\n/)
    .filter(Boolean)
}

function listArchiveDetails(archivePath: string): string[] {
  return execFileSync("tar", ["-tvzf", archivePath], { encoding: "utf-8" })
    .split(/\r?\n/)
    .filter(Boolean)
}

export function verifyReleaseArchive(archivePath: string): void {
  const resolvedArchivePath = path.resolve(archivePath)
  if (!fs.existsSync(resolvedArchivePath)) fail(`Archive does not exist: ${archivePath}`)
  if (!fs.statSync(resolvedArchivePath).isFile()) fail(`Archive is not a regular file: ${archivePath}`)

  const { version, platform } = parseArchiveName(resolvedArchivePath)
  const platformConfig = getReleasePlatformConfig(platform)
  if (!isReleasePlatform(platformConfig.platform)) fail(`Unsupported release platform: ${platform}`)

  const expectedFiles = new Set([...getReleaseBinaryFileNames(platform), "VERSION"])
  const names = listArchiveNames(resolvedArchivePath)
  if (names.length !== expectedFiles.size) {
    fail(`Archive must contain exactly ${expectedFiles.size} files, found ${names.length}`)
  }

  const seen = new Set<string>()
  for (const name of names) {
    assertSafeRelativeFileName(name)
    if (seen.has(name)) fail(`Archive contains duplicate entry: ${name}`)
    seen.add(name)
    if (!expectedFiles.has(name)) fail(`Archive contains unexpected file: ${name}`)
  }

  for (const expectedFile of expectedFiles) {
    if (!seen.has(expectedFile)) fail(`Archive is missing expected file: ${expectedFile}`)
  }

  for (const detail of listArchiveDetails(resolvedArchivePath)) {
    const type = detail[0]
    if (type !== "-") {
      fail(`Archive entry is not a regular file: ${detail}`)
    }
  }

  const extractDir = fs.mkdtempSync(path.join(path.dirname(resolvedArchivePath), ".verify-archive-"))
  try {
    execFileSync("tar", ["-xzf", resolvedArchivePath, "-C", extractDir], { stdio: "pipe" })
    const versionFile = path.join(extractDir, "VERSION")
    if (!fs.statSync(versionFile).isFile()) fail("VERSION is not a regular file")
    const archiveVersion = fs.readFileSync(versionFile, "utf-8").trim()
    if (archiveVersion !== version) {
      fail(`VERSION content '${archiveVersion}' does not match archive version '${version}'`)
    }

    for (const fileName of expectedFiles) {
      const filePath = path.join(extractDir, fileName)
      const stat = fs.lstatSync(filePath)
      if (!stat.isFile() || stat.isSymbolicLink()) {
        fail(`Extracted entry is not a regular file: ${fileName}`)
      }
    }
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const archivePath = process.argv[2]
  if (!archivePath) {
    console.error("usage: bun run scripts/release/verify-archive.ts <archive.tar.gz>")
    process.exit(2)
  }

  try {
    verifyReleaseArchive(archivePath)
    console.log(`Verified ${archivePath}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
