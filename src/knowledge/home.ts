/**
 * 全局知识仓库路径解析模块
 *
 * 解析知识仓库的 Home 目录位置和项目文档路径。
 * 优先级: GALE_KNOWLEDGE_HOME env -> config file -> 默认路径
 */

import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join, resolve } from "node:path"
import yaml from "js-yaml"

import type {
  KnowledgeConfig,
  KnowledgePathResult,
  ResolveKnowledgePathOptions,
} from "./types.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_HOME_DIR = join(homedir(), ".galeharness", "knowledge")
const CONFIG_DIR = join(homedir(), ".galeharness")
const CONFIG_JSON = join(CONFIG_DIR, "config.json")
const CONFIG_YAML = join(CONFIG_DIR, "config.yaml")

// ---------------------------------------------------------------------------
// Config file reading
// ---------------------------------------------------------------------------

/**
 * 从配置文件读取知识仓库配置
 * 支持 JSON 和 YAML 格式，JSON 优先
 */
function readConfigFile(): KnowledgeConfig | null {
  // 尝试 JSON
  if (existsSync(CONFIG_JSON)) {
    try {
      const raw = readFileSync(CONFIG_JSON, "utf8")
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (parsed.knowledge && typeof (parsed.knowledge as Record<string, unknown>).home === "string") {
        return { home: (parsed.knowledge as Record<string, unknown>).home as string }
      }
    } catch {
      // JSON 解析失败，继续尝试 YAML
    }
  }

  // 尝试 YAML
  if (existsSync(CONFIG_YAML)) {
    try {
      const raw = readFileSync(CONFIG_YAML, "utf8")
      const parsed = yaml.load(raw) as Record<string, unknown> | null
      if (parsed?.knowledge && typeof (parsed.knowledge as Record<string, unknown>).home === "string") {
        return { home: (parsed.knowledge as Record<string, unknown>).home as string }
      }
    } catch {
      // YAML 解析失败，忽略
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 解析知识仓库根目录路径
 *
 * 优先级:
 * 1. `GALE_KNOWLEDGE_HOME` 环境变量
 * 2. 配置文件 (`~/.galeharness/config.json` 或 `config.yaml`)
 * 3. 默认路径 `~/.galeharness/knowledge/`
 *
 * @returns 知识仓库根目录的绝对路径
 */
export function resolveKnowledgeHome(): string {
  // 1. 环境变量
  const envHome = process.env.GALE_KNOWLEDGE_HOME
  if (envHome) {
    return resolve(envHome)
  }

  // 2. 配置文件
  const config = readConfigFile()
  if (config?.home) {
    return resolve(config.home)
  }

  // 3. 默认路径
  return DEFAULT_HOME_DIR
}

/**
 * 从 git remote URL 提取项目名称
 *
 * 支持格式:
 * - `git@github.com:org/repo.git`
 * - `https://github.com/org/repo.git`
 * - `https://github.com/org/repo`
 * - `ssh://git@github.com/org/repo.git`
 *
 * 失败时返回当前目录名作为 fallback
 *
 * @param cwd - 工作目录，默认 `process.cwd()`
 * @returns 项目名称
 */
export function extractProjectName(cwd?: string): string {
  const workDir = cwd ?? process.cwd()
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      cwd: workDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    if (remoteUrl) {
      const cleaned = remoteUrl.replace(/\.git$/, "")
      const parts = cleaned.split(/[/:]/g)
      const last = parts[parts.length - 1]
      if (last) return last
    }
  } catch {
    // git 命令失败，使用 fallback
  }

  return basename(workDir)
}

/**
 * 解析知识仓库完整路径
 *
 * 根据文档类型和项目名组装完整的知识文档目录路径。
 * 如果未提供 projectName，将从当前目录的 git remote 自动提取。
 *
 * @param options - 解析选项
 * @param options.type - 文档类型 (brainstorms | plans | solutions)
 * @param options.projectName - 项目名（可选）
 * @returns 路径解析结果
 */
export function resolveKnowledgePath(options: ResolveKnowledgePathOptions): KnowledgePathResult {
  const home = resolveKnowledgeHome()
  const projectName = options.projectName || extractProjectName()
  const projectDir = join(home, projectName)
  const docDir = join(projectDir, options.type)

  return {
    home,
    projectDir,
    projectName,
    docDir,
  }
}
