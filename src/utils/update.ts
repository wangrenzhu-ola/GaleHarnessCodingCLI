/**
 * Core update logic for gale-harness CLI self-update.
 *
 * This module is decoupled from the command definition (src/commands/update.ts)
 * so the logic can be tested independently.
 *
 * Flow:
 *   check → query GitHub Release API → compare versions → report
 *   update → check → download → backup → replace
 *   rollback → restore from backup
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

// ── Constants ───────────────────────────────────────────────────────────────

const BINARY_NAMES = ["gale-harness", "compound-plugin", "gale-knowledge"] as const
const TAG_PREFIX = "galeharness-cli-v"
const DEFAULT_REPO = "wangrenzhu-ola/GaleHarnessCLI"
const BACKUP_DIR = path.join(os.homedir(), ".galeharness", "backup")

// ── Types ───────────────────────────────────────────────────────────────────

export interface VersionInfo {
  current: string
  latest: string
  assetUrl: string
  assetName: string
  hasUpdate: boolean
}

export interface UpdateResult {
  success: boolean
  message: string
  previousVersion?: string
  newVersion?: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve the GitHub source repo (owner/repo format).
 * Honors COMPOUND_PLUGIN_GITHUB_SOURCE env var (same as install command).
 */
export function resolveGitHubRepo(): string {
  const override = process.env.COMPOUND_PLUGIN_GITHUB_SOURCE
  if (override && override.trim()) {
    // Extract owner/repo from full URL or use as-is
    const trimmed = override.trim()
    const match = trimmed.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)
    return match ? match[1] : trimmed
  }
  return DEFAULT_REPO
}

/**
 * Get the current CLI version from package.json (embedded at compile time)
 * or from the VERSION file co-located with the binary.
 */
export function getCurrentVersion(): string {
  // Try VERSION file first (co-located with binary in compiled mode)
  try {
    const binDir = detectBinDir()
    const versionFile = path.join(binDir, "VERSION")
    if (fs.existsSync(versionFile)) {
      return fs.readFileSync(versionFile, "utf-8").trim()
    }
  } catch {
    // Fall through
  }

  // Fall back to package.json version (works in dev mode)
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const packageJsonPath = path.resolve(__dirname, "../../package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
    return packageJson.version
  } catch {
    return "unknown"
  }
}

/**
 * Detect the directory where the CLI binaries are installed.
 * Uses Bun.execPath to locate the running binary.
 */
export function detectBinDir(): string {
  const execPath = Bun.execPath
  if (!execPath) {
    // Fallback: if Bun.execPath is unavailable, use process.execPath
    return path.dirname(process.execPath)
  }
  return path.dirname(execPath)
}

/**
 * Check whether the CLI is running in compiled (standalone) mode.
 * In dev mode (bun run), Bun.execPath points to the bun runtime, not the script.
 */
export function isCompiledBinary(): boolean {
  const execPath = Bun.execPath || process.execPath
  if (!execPath) return false
  // If the executable name is one of our binaries, we're in compiled mode
  const basename = path.basename(execPath)
  return BINARY_NAMES.includes(basename as any) || basename === "gale-harness" || basename === "compound-plugin" || basename === "gale-knowledge"
}

/**
 * Query GitHub Release API for the latest version matching our tag prefix.
 */
export async function getLatestVersion(repo: string): Promise<{ version: string; assetUrl: string; assetName: string }> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "gale-harness-update",
      "Accept": "application/vnd.github+json",
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No releases found for ${repo}. Ensure at least one release exists with tag prefix '${TAG_PREFIX}'.`)
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const release = (await response.json()) as {
    tag_name: string
    assets: Array<{ name: string; browser_download_url: string; size: number }>
  }

  // Verify tag prefix
  if (!release.tag_name.startsWith(TAG_PREFIX)) {
    throw new Error(`Latest release tag '${release.tag_name}' does not match expected prefix '${TAG_PREFIX}'.`)
  }

  const version = release.tag_name.slice(TAG_PREFIX.length)

  // Find the platform-specific asset
  const platform = detectPlatform()
  const expectedAssetSuffix = `${platform}.tar.gz`
  const asset = release.assets.find((a) => a.name.endsWith(expectedAssetSuffix))

  if (!asset) {
    const available = release.assets.map((a) => a.name).join(", ") || "(none)"
    throw new Error(
      `No release asset found for platform '${platform}'. Expected suffix: '${expectedAssetSuffix}'. Available assets: ${available}`,
    )
  }

  return {
    version,
    assetUrl: asset.browser_download_url,
    assetName: asset.name,
  }
}

/**
 * Detect the current platform suffix for asset selection.
 */
export function detectPlatform(): string {
  const platform = os.platform()
  const arch = os.arch()
  const platformMap: Record<string, Record<string, string>> = {
    darwin: { arm64: "darwin-arm64", x64: "darwin-x64" },
    linux: { x64: "linux-x64", arm64: "linux-arm64" },
    win32: { x64: "windows-x64" },
  }
  return platformMap[platform]?.[arch] || `${platform}-${arch}`
}

// ── Check ───────────────────────────────────────────────────────────────────

/**
 * Check for available updates without performing them.
 */
export async function checkForUpdate(): Promise<VersionInfo> {
  const repo = resolveGitHubRepo()
  const current = getCurrentVersion()
  const latest = await getLatestVersion(repo)

  return {
    current,
    latest: latest.version,
    assetUrl: latest.assetUrl,
    assetName: latest.assetName,
    hasUpdate: current !== latest.version && current !== "unknown",
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

/**
 * Perform the self-update: download, backup, replace.
 */
export async function performUpdate(): Promise<UpdateResult> {
  if (!isCompiledBinary()) {
    return {
      success: false,
      message:
        "Self-update is only available for compiled binaries. " +
        "You appear to be running in development mode (bun run). " +
        "Build a compiled binary first with: bun run build:cli",
    }
  }

  const info = await checkForUpdate()
  if (!info.hasUpdate) {
    return {
      success: true,
      message: `Already up to date (v${info.current})`,
    }
  }

  const binDir = detectBinDir()

  // 1. Download to temp directory
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "galeharness-update-"))
  try {
    const archivePath = path.join(tempDir, info.assetName)
    await downloadAsset(info.assetUrl, archivePath)

    // 2. Validate download
    const stat = fs.statSync(archivePath)
    if (stat.size === 0) {
      throw new Error("Downloaded archive is empty.")
    }

    // 3. Extract
    const extractDir = path.join(tempDir, "extracted")
    fs.mkdirSync(extractDir, { recursive: true })
    execSync(`tar -xzf ${archivePath} -C ${extractDir}`, { stdio: "pipe" })

    // Verify extracted files
    for (const name of BINARY_NAMES) {
      const extracted = path.join(extractDir, name)
      if (!fs.existsSync(extracted)) {
        throw new Error(`Expected binary '${name}' not found in archive.`)
      }
    }

    // 4. Backup current binaries
    await backupBinaries(binDir, info.current)

    // 5. Replace binaries
    try {
      await replaceBinaries(binDir, extractDir)
    } catch (replaceError) {
      // Auto-rollback on failure
      console.error(`Update failed, rolling back: ${replaceError}`)
      await rollbackBinaries(binDir, info.current)
      throw replaceError
    }

    return {
      success: true,
      message: `Updated: v${info.current} -> v${info.latest}`,
      previousVersion: info.current,
      newVersion: info.latest,
    }
  } finally {
    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Download a release asset to a local path.
 */
async function downloadAsset(url: string, destPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "gale-harness-update",
      "Accept": "application/octet-stream",
    },
    redirect: "follow",
  })

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status} ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  await fs.promises.writeFile(destPath, new Uint8Array(buffer))
}

/**
 * Backup current binaries to ~/.galeharness/backup/{version}/
 * Only keeps one backup version — removes older backups.
 */
async function backupBinaries(binDir: string, version: string): Promise<void> {
  // Clean up any existing backups (keep only one)
  if (fs.existsSync(BACKUP_DIR)) {
    const entries = await fs.promises.readdir(BACKUP_DIR)
    for (const entry of entries) {
      if (entry !== version) {
        await fs.promises.rm(path.join(BACKUP_DIR, entry), { recursive: true, force: true })
      }
    }
  }

  const versionBackupDir = path.join(BACKUP_DIR, version)
  fs.mkdirSync(versionBackupDir, { recursive: true })

  for (const name of BINARY_NAMES) {
    const src = path.join(binDir, name)
    if (fs.existsSync(src)) {
      await fs.promises.copyFile(src, path.join(versionBackupDir, name))
    }
  }

  // Also backup VERSION file if it exists
  const versionFile = path.join(binDir, "VERSION")
  if (fs.existsSync(versionFile)) {
    await fs.promises.copyFile(versionFile, path.join(versionBackupDir, "VERSION"))
  }
}

/**
 * Replace binaries in the install directory with new ones from extractDir.
 */
async function replaceBinaries(binDir: string, extractDir: string): Promise<void> {
  for (const name of BINARY_NAMES) {
    const src = path.join(extractDir, name)
    const dest = path.join(binDir, name)
    await fs.promises.copyFile(src, dest)
    // Ensure executable permission
    await fs.promises.chmod(dest, 0o755)
  }

  // Update VERSION file
  const versionSrc = path.join(extractDir, "VERSION")
  if (fs.existsSync(versionSrc)) {
    await fs.promises.copyFile(versionSrc, path.join(binDir, "VERSION"))
  }
}

// ── Rollback ────────────────────────────────────────────────────────────────

/**
 * Roll back to the most recent backup version.
 */
export async function performRollback(): Promise<UpdateResult> {
  if (!isCompiledBinary()) {
    return {
      success: false,
      message: "Rollback is only available for compiled binaries.",
    }
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    return {
      success: false,
      message: "No backup available. Backup directory does not exist.",
    }
  }

  const entries = await fs.promises.readdir(BACKUP_DIR)
  if (entries.length === 0) {
    return {
      success: false,
      message: "No backup available. No backup versions found.",
    }
  }

  // Use the only (or most recent) backup
  const backupVersion = entries.sort().pop()!
  return await rollbackBinaries(detectBinDir(), backupVersion)
}

/**
 * Restore binaries from a specific backup version.
 */
async function rollbackBinaries(binDir: string, version: string): Promise<UpdateResult> {
  const backupVersionDir = path.join(BACKUP_DIR, version)
  if (!fs.existsSync(backupVersionDir)) {
    return {
      success: false,
      message: `No backup found for version ${version}.`,
    }
  }

  for (const name of BINARY_NAMES) {
    const src = path.join(backupVersionDir, name)
    const dest = path.join(binDir, name)
    if (fs.existsSync(src)) {
      await fs.promises.copyFile(src, dest)
      await fs.promises.chmod(dest, 0o755)
    }
  }

  // Restore VERSION file if it exists in backup
  const versionBackup = path.join(backupVersionDir, "VERSION")
  if (fs.existsSync(versionBackup)) {
    await fs.promises.copyFile(versionBackup, path.join(binDir, "VERSION"))
  }

  return {
    success: true,
    message: `Rolled back to v${version}`,
    newVersion: version,
  }
}
