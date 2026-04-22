import { describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"
import { writeKiloBundle } from "../src/targets/kilo"
import type { KiloBundle } from "../src/types/kilo"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const emptyBundle: KiloBundle = {
  agents: [],
  commandFiles: [],
  skillDirs: [],
  mcpServers: {},
}

describe("writeKiloBundle", () => {
  test("writes agents, commands, skills, and mcp config", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-test-"))
    const bundle: KiloBundle = {
      agents: [
        {
          name: "security-sentinel",
          content: "---\ndescription: Security agent\nmode: subagent\n---\n\nFocus on vulnerabilities.",
        },
      ],
      commandFiles: [
        {
          name: "workflows-plan",
          content: "---\ndescription: Plan work\n---\n\nPlan the work.",
        },
      ],
      skillDirs: [
        {
          name: "skill-one",
          sourceDir: path.join(import.meta.dir, "fixtures", "sample-plugin", "skills", "skill-one"),
        },
      ],
      mcpServers: {
        playwright: { command: "npx", args: ["-y", "@anthropic/mcp-playwright"] },
      },
    }

    await writeKiloBundle(tempRoot, bundle)

    // Agent file
    const agentPath = path.join(tempRoot, ".kilo", "agents", "security-sentinel.md")
    expect(await exists(agentPath)).toBe(true)
    const agentContent = await fs.readFile(agentPath, "utf8")
    expect(agentContent).toContain("Focus on vulnerabilities.")

    // Command file
    const commandPath = path.join(tempRoot, ".kilo", "command", "workflows-plan.md")
    expect(await exists(commandPath)).toBe(true)
    const commandContent = await fs.readFile(commandPath, "utf8")
    expect(commandContent).toContain("Plan the work.")

    // Copied skill
    expect(await exists(path.join(tempRoot, ".kilo", "skills", "skill-one", "SKILL.md"))).toBe(true)

    // MCP config
    const mcpPath = path.join(tempRoot, ".kilo", "kilo.json")
    expect(await exists(mcpPath)).toBe(true)
    const mcpContent = JSON.parse(await fs.readFile(mcpPath, "utf8"))
    expect(mcpContent.mcpServers.playwright.command).toBe("npx")
  })

  test("does not double-nest when output root is .kilo", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-home-"))
    const kiloRoot = path.join(tempRoot, ".kilo")
    const bundle: KiloBundle = {
      ...emptyBundle,
      agents: [
        {
          name: "reviewer",
          content: "---\ndescription: Reviewer\n---\n\nReview content.",
        },
      ],
    }

    await writeKiloBundle(kiloRoot, bundle)

    expect(await exists(path.join(kiloRoot, "agents", "reviewer.md"))).toBe(true)
    // Should NOT double-nest under .kilo/.kilo
    expect(await exists(path.join(kiloRoot, ".kilo"))).toBe(false)
  })

  test("handles empty bundles gracefully", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-empty-"))

    await writeKiloBundle(tempRoot, emptyBundle)
    expect(await exists(tempRoot)).toBe(true)
  })

  test("backs up existing kilo.json before overwrite", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-backup-"))
    const kiloRoot = path.join(tempRoot, ".kilo")
    await fs.mkdir(kiloRoot, { recursive: true })

    const configPath = path.join(kiloRoot, "kilo.json")
    await fs.writeFile(configPath, JSON.stringify({ mcpServers: { old: { command: "old-cmd" } } }))

    const bundle: KiloBundle = {
      ...emptyBundle,
      mcpServers: { newServer: { command: "new-cmd" } },
    }

    await writeKiloBundle(kiloRoot, bundle)

    // New config should have the new content
    const newContent = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(newContent.mcpServers.newServer.command).toBe("new-cmd")

    // A backup file should exist
    const files = await fs.readdir(kiloRoot)
    const backupFiles = files.filter((f) => f.startsWith("kilo.json.bak."))
    expect(backupFiles.length).toBeGreaterThanOrEqual(1)
  })

  test("merges mcpServers into existing kilo.json without clobbering other keys", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-merge-"))
    const kiloRoot = path.join(tempRoot, ".kilo")
    await fs.mkdir(kiloRoot, { recursive: true })

    const configPath = path.join(kiloRoot, "kilo.json")
    await fs.writeFile(configPath, JSON.stringify({
      customKey: "preserve-me",
      mcpServers: { old: { command: "old-cmd" } },
    }))

    const bundle: KiloBundle = {
      ...emptyBundle,
      mcpServers: { newServer: { command: "new-cmd" } },
    }

    await writeKiloBundle(kiloRoot, bundle)

    const content = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(content.customKey).toBe("preserve-me")
    expect(content.mcpServers.old.command).toBe("old-cmd")
    expect(content.mcpServers.newServer.command).toBe("new-cmd")
  })

  test("kilo.json fresh write when no existing file", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-fresh-"))
    const bundle: KiloBundle = {
      ...emptyBundle,
      mcpServers: { myServer: { command: "my-cmd", args: ["--flag"] } },
    }

    await writeKiloBundle(tempRoot, bundle)

    const configPath = path.join(tempRoot, ".kilo", "kilo.json")
    expect(await exists(configPath)).toBe(true)
    const content = JSON.parse(await fs.readFile(configPath, "utf8"))
    expect(content.mcpServers.myServer.command).toBe("my-cmd")
    expect(content.mcpServers.myServer.args).toEqual(["--flag"])
  })
})
