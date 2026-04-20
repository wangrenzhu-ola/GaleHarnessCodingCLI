import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { commitKnowledgeChanges, sanitizeTitle } from "../cmd/gale-knowledge/git-ops.js"
import { initKnowledgeRepo } from "../cmd/gale-knowledge/init.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(
    tmpdir(),
    `gale-knowledge-git-ops-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  mkdirSync(dir, { recursive: true })
  return dir
}

function cleanDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

/**
 * 创建一个已初始化的知识仓库，返回仓库路径
 */
function createInitializedRepo(baseDir: string): string {
  const repoDir = join(baseDir, "knowledge")
  initKnowledgeRepo(repoDir)
  // 配置 git user 以避免 commit 时缺少身份信息
  execSync('git config user.email "test@test.com"', { cwd: repoDir })
  execSync('git config user.name "Test"', { cwd: repoDir })
  return repoDir
}

// ---------------------------------------------------------------------------
// sanitizeTitle
// ---------------------------------------------------------------------------

describe("sanitizeTitle", () => {
  it("passes through a plain title unchanged", () => {
    expect(sanitizeTitle("user-auth-requirements")).toBe("user-auth-requirements")
  })

  it("replaces double quotes with single quotes", () => {
    expect(sanitizeTitle('hello "world"')).toBe("hello 'world'")
  })

  it("replaces backticks with single quotes", () => {
    expect(sanitizeTitle("use `fetch` api")).toBe("use 'fetch' api")
  })

  it("removes dollar signs", () => {
    expect(sanitizeTitle("cost $100")).toBe("cost 100")
  })

  it("removes backslashes", () => {
    expect(sanitizeTitle("path\\to\\file")).toBe("pathtofile")
  })

  it("replaces newlines with spaces", () => {
    expect(sanitizeTitle("line1\nline2\r\nline3")).toBe("line1 line2 line3")
  })

  it("trims whitespace", () => {
    expect(sanitizeTitle("  hello  ")).toBe("hello")
  })
})

// ---------------------------------------------------------------------------
// commitKnowledgeChanges
// ---------------------------------------------------------------------------

describe("commitKnowledgeChanges", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("creates a commit when there are changes", () => {
    const repoDir = createInitializedRepo(testDir)

    // 创建一个新文件
    writeFileSync(join(repoDir, "test-doc.md"), "# Test Document\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "brainstorm",
      title: "user-auth-requirements",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)
    expect(result.hash).toBeDefined()
    expect(result.hash!.length).toBeGreaterThan(0)
    expect(result.message).toBe("docs(my-project/brainstorm): user-auth-requirements")
  })

  it("generates correct commit message format", () => {
    const repoDir = createInitializedRepo(testDir)
    writeFileSync(join(repoDir, "doc.md"), "content\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "gale-harness-cli",
      type: "plan",
      title: "api-redesign",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)

    // 验证 git log 中的 commit message
    const log = execSync("git log -1 --pretty=%s", {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()

    expect(log).toBe("docs(gale-harness-cli/plan): api-redesign")
  })

  it("returns committed: false when there are no changes", () => {
    const repoDir = createInitializedRepo(testDir)

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "solution",
      title: "some-title",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(false)
    expect(result.message).toBe("No changes to commit")
    expect(result.hash).toBeUndefined()
  })

  it("assembles project, type, and title correctly into commit message", () => {
    const repoDir = createInitializedRepo(testDir)
    writeFileSync(join(repoDir, "file.md"), "data\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "awesome-app",
      type: "solution",
      title: "database-migration-strategy",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)
    expect(result.message).toBe("docs(awesome-app/solution): database-migration-strategy")
  })

  it("handles special characters in title", () => {
    const repoDir = createInitializedRepo(testDir)
    writeFileSync(join(repoDir, "special.md"), "content\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "brainstorm",
      title: 'title with "quotes" and `backticks` and $vars',
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)
    // 双引号 -> 单引号, 反引号 -> 单引号, $ 被移除
    expect(result.message).toBe(
      "docs(my-project/brainstorm): title with 'quotes' and 'backticks' and vars",
    )

    // 验证 git log 中的 commit message 正确
    const log = execSync("git log -1 --pretty=%s", {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()
    expect(log).toBe(
      "docs(my-project/brainstorm): title with 'quotes' and 'backticks' and vars",
    )
  })

  it("handles title with spaces", () => {
    const repoDir = createInitializedRepo(testDir)
    writeFileSync(join(repoDir, "spaces.md"), "content\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "plan",
      title: "my document title with spaces",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)
    expect(result.message).toBe("docs(my-project/plan): my document title with spaces")
  })

  it("returns error result for non-git directory", () => {
    const nonGitDir = join(testDir, "not-a-repo")
    mkdirSync(nonGitDir, { recursive: true })

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "brainstorm",
      title: "test",
      knowledgeHome: nonGitDir,
    })

    expect(result.committed).toBe(false)
    expect(result.message).toContain("Commit failed")
  })

  it("commits multiple files at once", () => {
    const repoDir = createInitializedRepo(testDir)

    // 创建多个文件
    const subDir = join(repoDir, "my-project", "brainstorms")
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(subDir, "doc1.md"), "# Doc 1\n", "utf8")
    writeFileSync(join(subDir, "doc2.md"), "# Doc 2\n", "utf8")
    writeFileSync(join(subDir, "doc3.md"), "# Doc 3\n", "utf8")

    const result = commitKnowledgeChanges({
      project: "my-project",
      type: "brainstorm",
      title: "batch-docs",
      knowledgeHome: repoDir,
    })

    expect(result.committed).toBe(true)

    // 验证所有文件都在同一个 commit 中
    const filesInCommit = execSync("git diff-tree --no-commit-id --name-only -r HEAD", {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()

    expect(filesInCommit).toContain("doc1.md")
    expect(filesInCommit).toContain("doc2.md")
    expect(filesInCommit).toContain("doc3.md")
  })
})
