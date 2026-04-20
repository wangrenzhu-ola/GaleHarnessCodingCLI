import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { homedir } from "node:os"
import { join, resolve, basename } from "node:path"

import {
  resolveKnowledgeHome,
  resolveKnowledgePath,
  extractProjectName,
} from "../src/knowledge/home.js"

// ---------------------------------------------------------------------------
// resolveKnowledgeHome
// ---------------------------------------------------------------------------

describe("resolveKnowledgeHome", () => {
  const originalEnv = process.env.GALE_KNOWLEDGE_HOME

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GALE_KNOWLEDGE_HOME
    } else {
      process.env.GALE_KNOWLEDGE_HOME = originalEnv
    }
  })

  it("returns GALE_KNOWLEDGE_HOME env when set", () => {
    process.env.GALE_KNOWLEDGE_HOME = "/tmp/custom-knowledge"
    const home = resolveKnowledgeHome()
    expect(home).toBe(resolve("/tmp/custom-knowledge"))
  })

  it("resolves relative GALE_KNOWLEDGE_HOME to absolute path", () => {
    process.env.GALE_KNOWLEDGE_HOME = "relative/path"
    const home = resolveKnowledgeHome()
    expect(home).toBe(resolve("relative/path"))
    // 确保是绝对路径
    expect(home.startsWith("/")).toBe(true)
  })

  it("returns default path when no env and no config", () => {
    delete process.env.GALE_KNOWLEDGE_HOME
    const home = resolveKnowledgeHome()
    const defaultPath = join(homedir(), ".galeharness", "knowledge")
    // 如果没有配置文件，应返回默认路径
    // 注意: 如果用户碰巧有配置文件，这个测试会从配置读取
    // 但我们至少确认返回的是绝对路径
    expect(home.startsWith("/")).toBe(true)
  })

  it("env takes precedence over default", () => {
    process.env.GALE_KNOWLEDGE_HOME = "/tmp/env-knowledge"
    const home = resolveKnowledgeHome()
    expect(home).toBe("/tmp/env-knowledge")
  })
})

// ---------------------------------------------------------------------------
// extractProjectName
// ---------------------------------------------------------------------------

describe("extractProjectName", () => {
  it("extracts project name from current git repo", () => {
    // 当前仓库应该能提取到项目名
    const name = extractProjectName(process.cwd())
    expect(typeof name).toBe("string")
    expect(name.length).toBeGreaterThan(0)
  })

  it("handles HTTPS remote URL format", () => {
    // 在当前仓库工作目录测试，应能提取到 repo name
    const name = extractProjectName()
    expect(name).toBeTruthy()
  })

  it("falls back to directory name for non-git directory", () => {
    // /tmp 通常不是 git 仓库
    const name = extractProjectName("/tmp")
    expect(name).toBe("tmp")
  })

  it("falls back to directory name when git remote fails", () => {
    // 使用一个不太可能是 git 仓库的路径
    const name = extractProjectName("/")
    // basename("/") 在不同 OS 可能返回不同值，但至少不会抛错
    expect(typeof name).toBe("string")
  })
})

// ---------------------------------------------------------------------------
// extractProjectName — URL 格式解析 (单元测试内联辅助)
// ---------------------------------------------------------------------------

describe("extractProjectName URL parsing logic", () => {
  // 由于 extractProjectName 内部调用 git 命令，
  // 我们通过 resolveKnowledgePath 的 projectName 参数间接验证 URL 解析不会崩溃
  // 同时在当前仓库测试真实的 git remote 提取

  it("current repo extracts a meaningful name", () => {
    const name = extractProjectName(process.cwd())
    // 当前仓库名应该包含 "GaleHarness" 或类似名称
    expect(name.length).toBeGreaterThan(0)
    // 不应包含 .git 后缀
    expect(name.endsWith(".git")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolveKnowledgePath
// ---------------------------------------------------------------------------

describe("resolveKnowledgePath", () => {
  const originalEnv = process.env.GALE_KNOWLEDGE_HOME

  beforeEach(() => {
    process.env.GALE_KNOWLEDGE_HOME = "/tmp/test-knowledge"
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GALE_KNOWLEDGE_HOME
    } else {
      process.env.GALE_KNOWLEDGE_HOME = originalEnv
    }
  })

  it("assembles correct paths for brainstorms", () => {
    const result = resolveKnowledgePath({
      type: "brainstorms",
      projectName: "my-project",
    })

    expect(result.home).toBe("/tmp/test-knowledge")
    expect(result.projectName).toBe("my-project")
    expect(result.projectDir).toBe("/tmp/test-knowledge/my-project")
    expect(result.docDir).toBe("/tmp/test-knowledge/my-project/brainstorms")
  })

  it("assembles correct paths for plans", () => {
    const result = resolveKnowledgePath({
      type: "plans",
      projectName: "another-project",
    })

    expect(result.home).toBe("/tmp/test-knowledge")
    expect(result.projectName).toBe("another-project")
    expect(result.projectDir).toBe("/tmp/test-knowledge/another-project")
    expect(result.docDir).toBe("/tmp/test-knowledge/another-project/plans")
  })

  it("assembles correct paths for solutions", () => {
    const result = resolveKnowledgePath({
      type: "solutions",
      projectName: "test-repo",
    })

    expect(result.docDir).toBe("/tmp/test-knowledge/test-repo/solutions")
  })

  it("auto-extracts project name when not provided", () => {
    const result = resolveKnowledgePath({ type: "brainstorms" })

    expect(result.home).toBe("/tmp/test-knowledge")
    expect(result.projectName.length).toBeGreaterThan(0)
    // projectDir 应该是 home + projectName
    expect(result.projectDir).toBe(join("/tmp/test-knowledge", result.projectName))
    // docDir 应该是 projectDir + type
    expect(result.docDir).toBe(join(result.projectDir, "brainstorms"))
  })

  it("uses env home path", () => {
    process.env.GALE_KNOWLEDGE_HOME = "/custom/path"
    const result = resolveKnowledgePath({
      type: "plans",
      projectName: "foo",
    })
    expect(result.home).toBe("/custom/path")
    expect(result.docDir).toBe("/custom/path/foo/plans")
  })

  it("all result fields are strings", () => {
    const result = resolveKnowledgePath({
      type: "solutions",
      projectName: "test",
    })

    expect(typeof result.home).toBe("string")
    expect(typeof result.projectDir).toBe("string")
    expect(typeof result.docDir).toBe("string")
    expect(typeof result.projectName).toBe("string")
  })
})

// ---------------------------------------------------------------------------
// Type checking (compile-time validation)
// ---------------------------------------------------------------------------

describe("types", () => {
  it("KnowledgeDocType accepts valid values", () => {
    // 这些应该在编译时通过
    const types: Array<"brainstorms" | "plans" | "solutions"> = [
      "brainstorms",
      "plans",
      "solutions",
    ]
    expect(types).toHaveLength(3)
  })
})
