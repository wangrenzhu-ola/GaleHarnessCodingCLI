import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import type { ClaudeHomeConfig } from "../src/parsers/claude-home"
import { syncToQoder } from "../src/sync/qoder"

describe("syncToQoder", () => {
  test("symlinks skills and writes commands", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-qoder-"))
    const fixtureSkillDir = path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one")

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

    await syncToQoder(config, tempRoot)

    const skillPath = path.join(tempRoot, "skills", "skill-one")
    expect((await fs.lstat(skillPath)).isSymbolicLink()).toBe(true)

    const commandPath = path.join(tempRoot, "commands", "workflows-plan.md")
    const commandContent = await fs.readFile(commandPath, "utf8")
    expect(commandContent).toContain("name: workflows:plan")
    expect(commandContent).toContain("description: Planning command")
    expect(commandContent).toContain("Plan the work.")
  })

  test("warns when MCP servers are present", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sync-qoder-mcp-"))
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (message?: unknown) => {
      warnings.push(String(message))
    }

    try {
      const config: ClaudeHomeConfig = {
        skills: [],
        mcpServers: {
          local: { command: "echo" },
        },
      }

      await syncToQoder(config, tempRoot)
    } finally {
      console.warn = originalWarn
    }

    expect(warnings.some((w) => w.includes("Qoder MCP sync is skipped"))).toBe(true)
  })
})
