import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import type { ClaudeHomeConfig } from "../src/parsers/claude-home"
import { syncToKilo } from "../src/sync/kilo"

describe("syncToKilo", () => {
  test("writes user-scope command files and mcp.json", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-kilo-"))
    const fixtureSkillDir = path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one")

    const config: ClaudeHomeConfig = {
      skills: [
        {
          name: "skill-one",
          sourceDir: fixtureSkillDir,
          skillPath: path.join(fixtureSkillDir, "SKILL.md"),
        },
      ],
      mcpServers: {
        local: { command: "echo", args: ["hello"], env: { TOKEN: "secret" } },
        remote: { url: "https://example.com/mcp", headers: { Authorization: "Bearer token" } },
      },
    }

    await syncToKilo(config, tempRoot)

    expect((await fs.lstat(path.join(tempRoot, "skills", "skill-one"))).isSymbolicLink()).toBe(true)

    const content = JSON.parse(
      await fs.readFile(path.join(tempRoot, "kilo.json"), "utf8"),
    ) as {
      mcpServers: Record<string, {
        command?: string
        args?: string[]
        env?: Record<string, string>
        url?: string
        headers?: Record<string, string>
      }>
    }

    expect(content.mcpServers.local?.command).toBe("echo")
    expect(content.mcpServers.local?.args).toEqual(["hello"])
    expect(content.mcpServers.local?.env).toEqual({ TOKEN: "secret" })
    expect(content.mcpServers.remote?.url).toBe("https://example.com/mcp")
    expect(content.mcpServers.remote?.headers).toEqual({ Authorization: "Bearer token" })
  })

  test("merges existing kilo.json", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-kilo-merge-"))
    await fs.writeFile(
      path.join(tempRoot, "kilo.json"),
      JSON.stringify({
        note: "preserve",
        mcpServers: {
          existing: { command: "node" },
        },
      }, null, 2),
    )

    const config: ClaudeHomeConfig = {
      skills: [],
      mcpServers: {
        remote: { url: "https://example.com/mcp" },
      },
    }

    await syncToKilo(config, tempRoot)

    const content = JSON.parse(
      await fs.readFile(path.join(tempRoot, "kilo.json"), "utf8"),
    ) as {
      note: string
      mcpServers: Record<string, { command?: string; url?: string }>
    }

    expect(content.note).toBe("preserve")
    expect(content.mcpServers.existing?.command).toBe("node")
    expect(content.mcpServers.remote?.url).toBe("https://example.com/mcp")
  })
})
