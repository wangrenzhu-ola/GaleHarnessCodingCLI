import { describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { verifyReleaseArchive } from "../scripts/release/verify-archive"
import { getReleaseBinaryFileNames } from "../src/utils/release-platforms"
import { createTarGz, type TarFixtureEntry } from "./tar-fixtures"

async function writeArchive(name: string, entries: TarFixtureEntry[]): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "release-archive-test-"))
  const archivePath = path.join(dir, name)
  await fs.writeFile(archivePath, createTarGz(entries))
  return archivePath
}

function validEntries(platform: string, version = "9.8.7"): TarFixtureEntry[] {
  return [
    ...getReleaseBinaryFileNames(platform).map((name) => ({
      name,
      content: `#!/bin/sh\necho ${name}\n`,
    })),
    { name: "VERSION", content: `${version}\n` },
  ]
}

describe("release archive verifier", () => {
  test("accepts a linux archive with all release CLI binaries and VERSION", async () => {
    const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", validEntries("linux-x64"))

    expect(() => verifyReleaseArchive(archive)).not.toThrow()
  })

  test("accepts Windows .exe binary names", async () => {
    const archive = await writeArchive("galeharness-cli-9.8.7-windows-x64.tar.gz", validEntries("windows-x64"))

    expect(() => verifyReleaseArchive(archive)).not.toThrow()
  })

  test("rejects missing expected binaries", async () => {
    const entries = validEntries("linux-x64").filter((entry) => entry.name !== "gale-memory")
    const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", entries)

    expect(() => verifyReleaseArchive(archive)).toThrow(/exactly|missing/)
  })

  test("rejects unknown top-level files", async () => {
    const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", [
      ...validEntries("linux-x64"),
      { name: "README.md", content: "extra\n" },
    ])

    expect(() => verifyReleaseArchive(archive)).toThrow(/exactly|unexpected/)
  })

  test("rejects unsafe paths and non-regular entries", async () => {
    for (const entry of [
      { name: "../gale-harness", content: "bad\n" },
      { name: "/gale-harness", content: "bad\n" },
      { name: "nested/gale-harness", content: "bad\n" },
      { name: "gale-harness", type: "symlink" as const, linkName: "/tmp/gale-harness" },
      { name: "gale-harness", type: "hardlink" as const, linkName: "compound-plugin" },
      { name: "gale-harness", type: "character-device" as const },
    ]) {
      const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", [
        entry,
        ...validEntries("linux-x64").filter((candidate) => candidate.name !== "gale-harness"),
      ])

      expect(() => verifyReleaseArchive(archive)).toThrow()
    }
  })

  test("rejects duplicate entries", async () => {
    const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", [
      ...validEntries("linux-x64"),
      { name: "VERSION", content: "9.8.7\n" },
    ])

    expect(() => verifyReleaseArchive(archive)).toThrow(/duplicate|exactly/)
  })

  test("rejects VERSION content that does not match archive version", async () => {
    const archive = await writeArchive("galeharness-cli-9.8.7-linux-x64.tar.gz", validEntries("linux-x64", "1.2.3"))

    expect(() => verifyReleaseArchive(archive)).toThrow(/VERSION/)
  })
})
