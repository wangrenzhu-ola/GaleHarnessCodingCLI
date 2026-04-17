import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import type { ClaudeHomeConfig } from "../src/parsers/claude-home"
import { syncToKimi } from "../src/sync/kimi"

describe("syncToKimi", () => {
  test("symlinks skills and writes MCP servers to mcp.json", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-kimi-"))
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
        local: { command: "echo", args: ["hello"], env: { KEY: "VALUE" } },
        remote: { url: "https://example.com/mcp", headers: { Authorization: "Bearer token" } },
      },
    }

    await syncToKimi(config, tempRoot)

    const skillPath = path.join(tempRoot, "skills", "skill-one")
    expect((await fs.lstat(skillPath)).isSymbolicLink()).toBe(true)

    const mcpPath = path.join(tempRoot, "mcp.json")
    const mcpContent = await fs.readFile(mcpPath, "utf8")
    const mcpJson = JSON.parse(mcpContent)
    expect(mcpJson.mcpServers.local.command).toBe("echo")
    expect(mcpJson.mcpServers.local.args).toEqual(["hello"])
    expect(mcpJson.mcpServers.local.env).toEqual({ KEY: "VALUE" })
    expect(mcpJson.mcpServers.remote.url).toBe("https://example.com/mcp")
    expect(mcpJson.mcpServers.remote.headers).toEqual({ Authorization: "Bearer token" })

    const perms = (await fs.stat(mcpPath)).mode & 0o777
    expect(perms).toBe(0o600)
  })

  test("warns when commands are present", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-kimi-cmds-"))
    const fixtureSkillDir = path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one")
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (message?: unknown) => {
      warnings.push(String(message))
    }

    try {
      const config: ClaudeHomeConfig = {
        skills: [
          {
            name: "skill-one",
            sourceDir: fixtureSkillDir,
            skillPath: path.join(fixtureSkillDir, "SKILL.md"),
          },
        ],
        commands: [
          {
            name: "workflows:plan",
            description: "Planning command",
            body: "Plan the work.",
            sourcePath: "/tmp/workflows/plan.md",
          },
        ],
        mcpServers: {},
      }

      await syncToKimi(config, tempRoot)
    } finally {
      console.warn = originalWarn
    }

    expect(warnings.some((w) => w.includes("Kimi personal command sync is skipped"))).toBe(true)
  })
})
