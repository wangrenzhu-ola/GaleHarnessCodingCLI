import { describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import path from "node:path"

const readmePath = path.resolve(import.meta.dir, "..", "README.md")

describe("README install guidance", () => {
  test("keeps release binary installer in the first screen", async () => {
    const readme = await fs.readFile(readmePath, "utf-8")
    const firstScreen = readme.slice(0, readme.indexOf("## 目录"))

    expect(firstScreen).toContain("## 快速安装 / 新手一键安装")
    expect(firstScreen).toContain(
      "curl -fsSL https://raw.githubusercontent.com/wangrenzhu-ola/GaleHarnessCodingCLI/main/scripts/install-release.sh | bash",
    )
    expect(firstScreen).toContain("gale-harness --version")
  })

  test("states the Windows release installer boundary before source-mode setup", async () => {
    const readme = await fs.readFile(readmePath, "utf-8")
    const firstScreen = readme.slice(0, readme.indexOf("## 目录"))

    expect(firstScreen).toContain("Windows release binary installer 尚未进入 P0a 范围")
    expect(firstScreen).toContain("不要把 source-mode")
    expect(firstScreen).toContain("普通用户默认一键安装")
    expect(firstScreen).not.toContain(".\\scripts\\setup.ps1")
    expect(firstScreen).not.toContain("bootstrap.ps1 | iex")
  })
})
