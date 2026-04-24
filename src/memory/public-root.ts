import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import yaml from "js-yaml"
import { extractProjectName, resolveKnowledgeHome, sanitizePathComponent } from "../knowledge/home.js"

export type MemoryRootSource = "explicit" | "env" | "config" | "derived"

export interface ResolvePublicMemoryRootOptions {
  cwd?: string
  project?: string
  memoryDir?: string
}

export interface PublicMemoryRoot {
  project: string
  knowledgeHome: string
  memoryDir: string
  source: MemoryRootSource
  diagnostics: Record<string, unknown>
}

const CONFIG_JSON = path.join(homedir(), ".galeharness", "config.json")
const CONFIG_YAML = path.join(homedir(), ".galeharness", "config.yaml")

const STANDARD_DIRS = [
  "L0-Abstract/topics",
  "L1-Overview/topics",
  "L2-Full/daily",
  "L2-Full/evergreen",
  "L2-Full/episodes",
]

const STANDARD_FILES = [
  "L0-Abstract/index.md",
  "L1-Overview/index.md",
  "L2-Full/evergreen/MEMORY.md",
]

export function resolvePublicMemoryRoot(options: ResolvePublicMemoryRootOptions = {}): PublicMemoryRoot {
  const cwd = options.cwd ?? process.cwd()
  const project = sanitizePathComponent(options.project ?? extractProjectName(cwd))
  const knowledgeHome = resolveKnowledgeHome()

  if (options.memoryDir) {
    return root(project, knowledgeHome, options.memoryDir, "explicit")
  }

  if (process.env.HKT_MEMORY_DIR) {
    return root(project, knowledgeHome, process.env.HKT_MEMORY_DIR, "env")
  }

  const configured = readConfiguredMemoryDir()
  if (configured) {
    return root(project, knowledgeHome, configured, "config")
  }

  return root(project, knowledgeHome, path.join(knowledgeHome, project, "hkt-memory"), "derived")
}

export function ensurePublicMemoryRoot(memoryDir: string): void {
  for (const dir of STANDARD_DIRS) {
    mkdirSync(path.join(memoryDir, dir), { recursive: true })
  }
  for (const file of STANDARD_FILES) {
    const filePath = path.join(memoryDir, file)
    if (!existsSync(filePath)) {
      mkdirSync(path.dirname(filePath), { recursive: true })
      writeFileSync(filePath, "", "utf8")
    }
  }
}

export function standardMemoryPaths(): { dirs: string[]; files: string[] } {
  return { dirs: [...STANDARD_DIRS], files: [...STANDARD_FILES] }
}

export function resolveKnowledgeIndexMemoryRoot(): string {
  const configured = readConfiguredKnowledgeIndexDir()
  return path.resolve(configured ?? path.join(homedir(), ".galeharness", "vector-index", "knowledge-repo"))
}

function root(project: string, knowledgeHome: string, memoryDir: string, source: MemoryRootSource): PublicMemoryRoot {
  return {
    project,
    knowledgeHome,
    memoryDir: path.resolve(memoryDir),
    source,
    diagnostics: {
      project,
      knowledge_home: knowledgeHome,
      memory_dir: path.resolve(memoryDir),
      source,
    },
  }
}

function readConfiguredMemoryDir(): string | null {
  const config = readGaleConfig()
  const memory = config?.memory
  if (memory && typeof memory === "object" && typeof (memory as Record<string, unknown>).hkt_memory_dir === "string") {
    return (memory as Record<string, unknown>).hkt_memory_dir as string
  }
  return null
}

function readConfiguredKnowledgeIndexDir(): string | null {
  const config = readGaleConfig()
  const knowledge = config?.knowledge
  if (
    knowledge &&
    typeof knowledge === "object" &&
    typeof (knowledge as Record<string, unknown>).index_memory_dir === "string"
  ) {
    return (knowledge as Record<string, unknown>).index_memory_dir as string
  }
  return null
}

function readGaleConfig(): Record<string, unknown> | null {
  if (existsSync(CONFIG_JSON)) {
    try {
      return JSON.parse(readFileSync(CONFIG_JSON, "utf8")) as Record<string, unknown>
    } catch {
      return null
    }
  }
  if (existsSync(CONFIG_YAML)) {
    try {
      const parsed = yaml.load(readFileSync(CONFIG_YAML, "utf8"))
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}
