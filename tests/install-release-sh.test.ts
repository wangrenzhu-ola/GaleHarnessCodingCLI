import { describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { detectReleasePlatform, getReleaseBinaryFileNames } from "../src/utils/release-platforms"
import { createTarGz, type TarFixtureEntry } from "./tar-fixtures"

const repoRoot = path.resolve(import.meta.dir, "..")
const installerPath = path.join(repoRoot, "scripts", "install-release.sh")

async function writeLocalArchive(version = "9.8.7"): Promise<{ archivePath: string; platform: string }> {
  const platform = detectReleasePlatform()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-archive-"))
  const archivePath = path.join(dir, `galeharness-cli-${version}-${platform}.tar.gz`)
  const entries: TarFixtureEntry[] = [
    ...getReleaseBinaryFileNames(platform).map((name) => ({
      name,
      content: `#!/usr/bin/env sh\necho ${name} ${version}\n`,
    })),
    { name: "VERSION", content: `${version}\n` },
  ]
  await fs.writeFile(archivePath, createTarGz(entries))
  return { archivePath, platform }
}

async function runInstaller(env: Record<string, string>): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bash", installerPath], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { exitCode, stdout, stderr }
}

const describeIfUnix = process.platform === "win32" ? describe.skip : describe

describeIfUnix("install-release.sh local archive mode", () => {
  test("requires CI or explicit opt-in for local archives", async () => {
    const { archivePath } = await writeLocalArchive()
    const installDir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-bin-"))

    const result = await runInstaller({
      GALE_RELEASE_ARCHIVE: archivePath,
      INSTALL_DIR: installDir,
      CI: "",
      GALE_INSTALL_ALLOW_LOCAL_ARCHIVE: "",
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("GALE_RELEASE_ARCHIVE is only allowed")
  })

  test("installs a local archive without calling curl and replaces old symlinks plus VERSION", async () => {
    const { archivePath, platform } = await writeLocalArchive()
    const installDir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-bin-"))
    const fakeBinDir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-path-"))
    const oldTargetDir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-old-"))
    const oldTarget = path.join(oldTargetDir, "gale-harness-old")

    await fs.writeFile(oldTarget, "old\n")
    await fs.symlink(oldTarget, path.join(installDir, getReleaseBinaryFileNames(platform)[0]))
    await fs.writeFile(path.join(installDir, "VERSION"), "0.0.1\n")
    await fs.writeFile(path.join(fakeBinDir, "curl"), "#!/usr/bin/env sh\necho curl should not run >&2\nexit 42\n")
    await fs.chmod(path.join(fakeBinDir, "curl"), 0o755)

    const result = await runInstaller({
      GALE_RELEASE_ARCHIVE: archivePath,
      INSTALL_DIR: installDir,
      CI: "1",
      PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Installing GaleHarnessCLI from local archive")
    expect(result.stderr).not.toContain("curl should not run")

    for (const fileName of getReleaseBinaryFileNames(platform)) {
      const filePath = path.join(installDir, fileName)
      const stat = await fs.lstat(filePath)
      expect(stat.isFile()).toBe(true)
      expect(stat.isSymbolicLink()).toBe(false)
    }
    expect(await fs.readFile(path.join(installDir, "VERSION"), "utf-8")).toBe("9.8.7\n")
  })

  test("rejects local archives with symlink entries before install", async () => {
    const platform = detectReleasePlatform()
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-bad-"))
    const archivePath = path.join(dir, `galeharness-cli-9.8.7-${platform}.tar.gz`)
    await fs.writeFile(
      archivePath,
      createTarGz([
        { name: getReleaseBinaryFileNames(platform)[0], type: "symlink", linkName: "/tmp/bad" },
        ...getReleaseBinaryFileNames(platform)
          .slice(1)
          .map((name) => ({ name, content: `#!/usr/bin/env sh\necho ${name}\n` })),
        { name: "VERSION", content: "9.8.7\n" },
      ]),
    )

    const installDir = await fs.mkdtemp(path.join(os.tmpdir(), "install-release-bin-"))
    const result = await runInstaller({
      GALE_RELEASE_ARCHIVE: archivePath,
      INSTALL_DIR: installDir,
      CI: "1",
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("non-regular")
  })
})
