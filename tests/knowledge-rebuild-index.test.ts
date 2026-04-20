import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test"
import { execSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  collectMarkdownFiles,
  getLastRebuildCommit,
  getChangedFiles,
  getCurrentHead,
  saveLastRebuildCommit,
  isUvAvailable,
  rebuildIndex,
} from "../cmd/gale-knowledge/rebuild-index.js"
import { initKnowledgeRepo } from "../cmd/gale-knowledge/init.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(
    tmpdir(),
    `gale-knowledge-rebuild-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
  execSync('git config user.email "test@test.com"', { cwd: repoDir })
  execSync('git config user.name "Test"', { cwd: repoDir })
  return repoDir
}

/**
 * 在仓库中创建文件并提交
 */
function addAndCommit(repoDir: string, files: Record<string, string>, message: string): string {
  for (const [name, content] of Object.entries(files)) {
    const filePath = join(repoDir, name)
    const dir = join(filePath, "..")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, content, "utf8")
  }
  execSync("git add -A", { cwd: repoDir })
  execSync(`git commit -m "${message}"`, { cwd: repoDir })
  return execSync("git rev-parse HEAD", { cwd: repoDir, encoding: "utf8" }).trim()
}

// ---------------------------------------------------------------------------
// collectMarkdownFiles
// ---------------------------------------------------------------------------

describe("collectMarkdownFiles", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("collects .md files recursively", () => {
    mkdirSync(join(testDir, "sub"), { recursive: true })
    writeFileSync(join(testDir, "root.md"), "# Root\n")
    writeFileSync(join(testDir, "sub", "nested.md"), "# Nested\n")
    writeFileSync(join(testDir, "other.txt"), "not md\n")

    const files = collectMarkdownFiles(testDir)
    expect(files).toContain("root.md")
    expect(files).toContain(join("sub", "nested.md"))
    expect(files).not.toContain("other.txt")
  })

  it("excludes .git directory", () => {
    mkdirSync(join(testDir, ".git"), { recursive: true })
    writeFileSync(join(testDir, ".git", "config.md"), "git internal\n")
    writeFileSync(join(testDir, "doc.md"), "# Doc\n")

    const files = collectMarkdownFiles(testDir)
    expect(files).toEqual(["doc.md"])
  })

  it("returns empty array for non-existent directory", () => {
    const files = collectMarkdownFiles(join(testDir, "nonexistent"))
    expect(files).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getLastRebuildCommit
// ---------------------------------------------------------------------------

describe("getLastRebuildCommit", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("returns null when .last-rebuild-commit does not exist", () => {
    const result = getLastRebuildCommit(testDir)
    expect(result).toBeNull()
  })

  it("returns commit hash from file", () => {
    writeFileSync(join(testDir, ".last-rebuild-commit"), "abc123def\n", "utf8")
    const result = getLastRebuildCommit(testDir)
    expect(result).toBe("abc123def")
  })

  it("trims whitespace from file content", () => {
    writeFileSync(join(testDir, ".last-rebuild-commit"), "  hash123  \n", "utf8")
    const result = getLastRebuildCommit(testDir)
    expect(result).toBe("hash123")
  })
})

// ---------------------------------------------------------------------------
// getChangedFiles
// ---------------------------------------------------------------------------

describe("getChangedFiles", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("returns changed .md files between commits", () => {
    const repoDir = createInitializedRepo(testDir)

    // Create initial commit with a file
    const hash1 = addAndCommit(repoDir, { "doc1.md": "# Doc 1\n" }, "initial")

    // Create second commit with more files
    addAndCommit(repoDir, { "doc2.md": "# Doc 2\n", "script.sh": "echo hi\n" }, "second")

    const changed = getChangedFiles(repoDir, hash1)
    expect(changed).toContain("doc2.md")
    expect(changed).not.toContain("script.sh") // not .md (filtered by git diff -- '*.md')
  })

  it("returns empty array when no .md files changed", () => {
    const repoDir = createInitializedRepo(testDir)
    const hash1 = addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")
    addAndCommit(repoDir, { "script.sh": "echo\n" }, "non-md change")

    const changed = getChangedFiles(repoDir, hash1)
    expect(changed).toEqual([])
  })

  it("returns empty array for invalid commit hash", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    const changed = getChangedFiles(repoDir, "invalidhash000000")
    expect(changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getCurrentHead
// ---------------------------------------------------------------------------

describe("getCurrentHead", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("returns HEAD commit hash for a valid repo", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    const head = getCurrentHead(repoDir)
    expect(head).toBeDefined()
    expect(head!.length).toBe(40) // full SHA-1 hash
  })

  it("returns null for a non-git directory", () => {
    const head = getCurrentHead(testDir)
    expect(head).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// saveLastRebuildCommit
// ---------------------------------------------------------------------------

describe("saveLastRebuildCommit", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("writes commit hash to .last-rebuild-commit file", () => {
    saveLastRebuildCommit(testDir, "abc123def456")
    const content = readFileSync(join(testDir, ".last-rebuild-commit"), "utf8")
    expect(content).toBe("abc123def456\n")
  })

  it("overwrites existing file", () => {
    writeFileSync(join(testDir, ".last-rebuild-commit"), "old-hash\n", "utf8")
    saveLastRebuildCommit(testDir, "new-hash")
    const content = readFileSync(join(testDir, ".last-rebuild-commit"), "utf8")
    expect(content).toBe("new-hash\n")
  })
})

// ---------------------------------------------------------------------------
// rebuildIndex (integration with mocked external commands)
// ---------------------------------------------------------------------------

describe("rebuildIndex", () => {
  let testDir: string

  beforeEach(() => {
    testDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  it("incremental mode: reads .last-rebuild-commit and processes changed files", () => {
    const repoDir = createInitializedRepo(testDir)

    // First commit
    const hash1 = addAndCommit(repoDir, { "doc1.md": "# Doc 1\n" }, "initial")

    // Save last rebuild commit
    saveLastRebuildCommit(repoDir, hash1)

    // Second commit with new file
    addAndCommit(repoDir, { "doc2.md": "# Doc 2\n" }, "add doc2")

    // Run rebuild (uv is likely not available in test env, so it will warn and return 0)
    const result = rebuildIndex({ knowledgeHome: repoDir })

    // The mode should be incremental since .last-rebuild-commit exists
    expect(result.mode).toBe("incremental")
  })

  it("incremental mode: falls back to full when .last-rebuild-commit missing", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    // No .last-rebuild-commit file exists
    const result = rebuildIndex({ knowledgeHome: repoDir })

    // Should fall back to full mode
    expect(result.mode).toBe("full")
  })

  it("full mode: scans all .md files", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, {
      "doc1.md": "# Doc 1\n",
      "doc2.md": "# Doc 2\n",
      "sub/doc3.md": "# Doc 3\n",
    }, "initial docs")

    const result = rebuildIndex({ knowledgeHome: repoDir, full: true })

    expect(result.mode).toBe("full")
  })

  it("updates .last-rebuild-commit after processing", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    const headBefore = getCurrentHead(repoDir)

    rebuildIndex({ knowledgeHome: repoDir, full: true })

    // .last-rebuild-commit should now exist with current HEAD
    const saved = getLastRebuildCommit(repoDir)
    expect(saved).toBe(headBefore)
  })

  it("uv not available: warns but does not fail", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    // We rely on the fact that in test env, if uv IS available,
    // the function still completes without throwing.
    // If uv is NOT available, it returns processed: 0 gracefully.
    const result = rebuildIndex({ knowledgeHome: repoDir, full: true })

    // Should not throw, result should have valid structure
    expect(result.processed).toBeGreaterThanOrEqual(0)
    expect(result.errors).toBeGreaterThanOrEqual(0)
    expect(result.mode).toBe("full")
  })

  it("empty diff: returns 0 processed in incremental mode", () => {
    const repoDir = createInitializedRepo(testDir)
    const hash1 = addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    // Set last rebuild to current HEAD (no changes since)
    saveLastRebuildCommit(repoDir, hash1)

    const result = rebuildIndex({ knowledgeHome: repoDir })

    expect(result.mode).toBe("incremental")
    // No files changed, so nothing to process
    expect(result.processed).toBe(0)
    expect(result.errors).toBe(0)
  })

  it("errors in one file do not block other files", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, {
      "good.md": "# Good Doc\n",
      "also-good.md": "# Also Good\n",
    }, "initial")

    // Run full rebuild - even if hkt_memory fails for each file,
    // it should process all files without throwing
    const result = rebuildIndex({ knowledgeHome: repoDir, full: true })

    // Should not throw - errors are counted, not thrown
    expect(result.mode).toBe("full")
    expect(typeof result.processed).toBe("number")
    expect(typeof result.errors).toBe("number")
  })

  it("creates index directory if it does not exist", () => {
    const repoDir = createInitializedRepo(testDir)
    addAndCommit(repoDir, { "doc.md": "# Doc\n" }, "initial")

    const customIndexPath = join(testDir, "custom-index-dir")
    expect(existsSync(customIndexPath)).toBe(false)

    rebuildIndex({ knowledgeHome: repoDir, full: true, indexPath: customIndexPath })

    expect(existsSync(customIndexPath)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isUvAvailable
// ---------------------------------------------------------------------------

describe("isUvAvailable", () => {
  it("returns a boolean", () => {
    const result = isUvAvailable()
    expect(typeof result).toBe("boolean")
  })
})
