import os from "node:os"

export const RELEASE_BINARY_BASENAMES = [
  "gale-harness",
  "compound-plugin",
  "gale-knowledge",
  "gale-memory",
] as const

export type ReleaseBinaryBaseName = (typeof RELEASE_BINARY_BASENAMES)[number]

export const RELEASE_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "windows-arm64",
  "windows-x64",
] as const

export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number]

export interface ReleasePlatformConfig {
  platform: ReleasePlatform
  bunTarget: string
  executableExtension: "" | ".exe"
}

const RELEASE_PLATFORM_CONFIGS: Record<ReleasePlatform, ReleasePlatformConfig> = {
  "darwin-arm64": {
    platform: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    executableExtension: "",
  },
  "darwin-x64": {
    platform: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    executableExtension: "",
  },
  "linux-arm64": {
    platform: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    executableExtension: "",
  },
  "linux-x64": {
    platform: "linux-x64",
    bunTarget: "bun-linux-x64",
    executableExtension: "",
  },
  "windows-arm64": {
    platform: "windows-arm64",
    bunTarget: "bun-windows-arm64",
    executableExtension: ".exe",
  },
  "windows-x64": {
    platform: "windows-x64",
    bunTarget: "bun-windows-x64",
    executableExtension: ".exe",
  },
}

export function getReleasePlatformConfig(platform: string): ReleasePlatformConfig {
  if (isReleasePlatform(platform)) {
    return RELEASE_PLATFORM_CONFIGS[platform]
  }

  throw new Error(
    `Unsupported release platform '${platform}'. Supported platforms: ${RELEASE_PLATFORMS.join(", ")}`,
  )
}

export function isReleasePlatform(platform: string): platform is ReleasePlatform {
  return (RELEASE_PLATFORMS as readonly string[]).includes(platform)
}

export function detectReleasePlatform(
  platform: NodeJS.Platform = os.platform(),
  arch: string = os.arch(),
): ReleasePlatform {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64"
  if (platform === "darwin" && arch === "x64") return "darwin-x64"
  if (platform === "linux" && arch === "arm64") return "linux-arm64"
  if (platform === "linux" && arch === "x64") return "linux-x64"
  if (platform === "win32" && arch === "arm64") return "windows-arm64"
  if (platform === "win32" && arch === "x64") return "windows-x64"

  throw new Error(`Unsupported platform: ${platform} ${arch}`)
}

export function getReleaseBinaryFileName(
  basename: ReleaseBinaryBaseName,
  platform: string,
): string {
  return `${basename}${getReleasePlatformConfig(platform).executableExtension}`
}

export function getReleaseBinaryFileNames(platform: string): string[] {
  return RELEASE_BINARY_BASENAMES.map((basename) => getReleaseBinaryFileName(basename, platform))
}
