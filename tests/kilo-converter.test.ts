import { describe, expect, test } from "bun:test"
import { convertClaudeToKilo, transformContentForKilo } from "../src/converters/claude-to-kilo"
import { parseFrontmatter } from "../src/utils/frontmatter"
import type { ClaudePlugin } from "../src/types/claude"

const fixturePlugin: ClaudePlugin = {
  root: "/tmp/plugin",
  manifest: { name: "fixture", version: "1.0.0" },
  agents: [
    {
      name: "security-sentinel",
      description: "Security-focused agent",
      capabilities: ["Threat modeling", "OWASP"],
      model: "claude-sonnet-4-20250514",
      body: "Focus on vulnerabilities.",
      sourcePath: "/tmp/plugin/agents/security-sentinel.md",
    },
  ],
  commands: [
    {
      name: "workflows:plan",
      description: "Planning command",
      argumentHint: "[FOCUS]",
      model: "inherit",
      allowedTools: ["Read"],
      body: "Plan the work.",
      sourcePath: "/tmp/plugin/commands/workflows/plan.md",
    },
  ],
  skills: [
    {
      name: "existing-skill",
      description: "Existing skill",
      sourceDir: "/tmp/plugin/skills/existing-skill",
      skillPath: "/tmp/plugin/skills/existing-skill/SKILL.md",
    },
  ],
  hooks: undefined,
  mcpServers: {
    local: { command: "echo", args: ["hello"] },
  },
}

const defaultOptions = {
  agentMode: "subagent" as const,
  inferTemperature: false,
  permissions: "none" as const,
}

describe("convertClaudeToKilo", () => {
  test("converts agents to Kilo agent markdown files", () => {
    const bundle = convertClaudeToKilo(fixturePlugin, defaultOptions)

    const agent = bundle.agents.find((a) => a.name === "security-sentinel")
    expect(agent).toBeDefined()
    const parsed = parseFrontmatter(agent!.content)
    expect(parsed.data.description).toBe("Security-focused agent")
    expect(parsed.data.mode).toBe("subagent")
    expect(parsed.data.model).toBe("anthropic/claude-sonnet-4-20250514")
    expect(parsed.body).toContain("Focus on vulnerabilities.")
  })

  test("agent with capabilities prepended to body", () => {
    const bundle = convertClaudeToKilo(fixturePlugin, defaultOptions)
    const agent = bundle.agents.find((a) => a.name === "security-sentinel")
    const parsed = parseFrontmatter(agent!.content)
    expect(parsed.body).toContain("## Capabilities")
    expect(parsed.body).toContain("- Threat modeling")
    expect(parsed.body).toContain("- OWASP")
  })

  test("agent model inherit is omitted", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: "inherit-agent",
          description: "Inherit model",
          body: "Do things.",
          sourcePath: "/tmp/plugin/agents/inherit.md",
          model: "inherit",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, defaultOptions)
    const agent = bundle.agents.find((a) => a.name === "inherit-agent")
    const parsed = parseFrontmatter(agent!.content)
    expect(parsed.data.model).toBeUndefined()
  })

  test("converts commands to Kilo command markdown files", () => {
    const bundle = convertClaudeToKilo(fixturePlugin, defaultOptions)

    expect(bundle.commandFiles).toHaveLength(1)
    const cmd = bundle.commandFiles[0]
    expect(cmd.name).toBe("workflows:plan")
    const parsed = parseFrontmatter(cmd.content)
    expect(parsed.data.description).toBe("Planning command")
    expect(parsed.body).toContain("Plan the work.")
  })

  test("command with disable-model-invocation is excluded", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      commands: [
        {
          name: "disabled-command",
          description: "Disabled command",
          disableModelInvocation: true,
          body: "Disabled body.",
          sourcePath: "/tmp/plugin/commands/disabled.md",
        },
      ],
      agents: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, defaultOptions)
    expect(bundle.commandFiles).toHaveLength(0)
  })

  test("skills pass through as directory references", () => {
    const bundle = convertClaudeToKilo(fixturePlugin, defaultOptions)

    expect(bundle.skillDirs).toHaveLength(1)
    expect(bundle.skillDirs[0].name).toBe("existing-skill")
    expect(bundle.skillDirs[0].sourceDir).toBe("/tmp/plugin/skills/existing-skill")
  })

  test("MCP stdio servers convert correctly", () => {
    const bundle = convertClaudeToKilo(fixturePlugin, defaultOptions)
    expect(bundle.mcpServers.local.command).toBe("echo")
    expect(bundle.mcpServers.local.args).toEqual(["hello"])
  })

  test("MCP HTTP servers converted with url", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      mcpServers: {
        httpServer: { url: "https://example.com/mcp" },
      },
      agents: [],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, defaultOptions)

    expect(Object.keys(bundle.mcpServers)).toHaveLength(1)
    expect(bundle.mcpServers.httpServer).toEqual({ url: "https://example.com/mcp" })
  })

  test("empty plugin produces empty bundle", () => {
    const plugin: ClaudePlugin = {
      root: "/tmp/empty",
      manifest: { name: "empty", version: "1.0.0" },
      agents: [],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, defaultOptions)
    expect(bundle.agents).toHaveLength(0)
    expect(bundle.commandFiles).toHaveLength(0)
    expect(bundle.skillDirs).toHaveLength(0)
    expect(Object.keys(bundle.mcpServers)).toHaveLength(0)
  })

  test("infers temperature for review agents", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: "code-reviewer",
          description: "Reviews code",
          body: "Review code.",
          sourcePath: "/tmp/plugin/agents/reviewer.md",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, {
      ...defaultOptions,
      inferTemperature: true,
    })

    const agent = bundle.agents[0]
    const parsed = parseFrontmatter(agent.content)
    expect(parsed.data.temperature).toBe(0.1)
  })

  test("infers temperature for brainstorm agents", () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: "ideator",
          description: "Generate creative ideas",
          body: "Brainstorm.",
          sourcePath: "/tmp/plugin/agents/ideator.md",
        },
      ],
      commands: [],
      skills: [],
    }

    const bundle = convertClaudeToKilo(plugin, {
      ...defaultOptions,
      inferTemperature: true,
    })

    const agent = bundle.agents[0]
    const parsed = parseFrontmatter(agent.content)
    expect(parsed.data.temperature).toBe(0.7)
  })
})

describe("transformContentForKilo", () => {
  test("rewrites .claude/ paths to .kilo/", () => {
    const result = transformContentForKilo("Read .claude/settings.json for config.")
    expect(result).toContain(".kilo/settings.json")
    expect(result).not.toContain(".claude/")
  })

  test("rewrites ~/.claude/ paths to ~/.config/kilo/", () => {
    const result = transformContentForKilo("Check ~/.claude/config for settings.")
    expect(result).toContain("~/.config/kilo/config")
    expect(result).not.toContain("~/.claude/")
  })

  test("leaves unrelated text unchanged", () => {
    const input = "Use the Bash tool to run commands."
    expect(transformContentForKilo(input)).toBe(input)
  })

  test("rewrites .claude/ paths after punctuation like parentheses", () => {
    const result = transformContentForKilo("See (.claude/config) and [~/.claude/settings].")
    expect(result).toContain("(.kilo/config)")
    expect(result).toContain("[~/.config/kilo/settings]")
    expect(result).not.toContain(".claude/")
  })

  test("does not rewrite my.claude/ as a false positive", () => {
    const input = "Visit my.claude/page for info."
    expect(transformContentForKilo(input)).toBe(input)
  })
})
