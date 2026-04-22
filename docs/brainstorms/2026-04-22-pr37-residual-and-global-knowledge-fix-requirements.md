---
title: PR #37 遗留问题与全局知识库修复需求
date: 2026-04-22
category: developer-experience
priority: P1
status: ready
source: PR #37 代码审查 + 全局知识库调查
---

## 问题框架

PR #37（HKTMemory PR #2 集成）代码审查中发现了 P0/P1/P2 问题并已修复，但仍有 P3 建议性问题和一个独立发现的架构性缺陷待处理：**全局知识库功能虽然基础设施已完整，但在最关键的知识检索环节被绕过**。

## 需求清单

### R1: learnings-researcher Agent 接入全局知识库（P1）

**问题：** `plugins/galeharness-cli/agents/research/learnings-researcher.md` 硬编码搜索 `docs/solutions/`，未使用 `gale-knowledge resolve-path --type solutions` 动态解析路径。这导致全局知识库在知识检索的核心入口完全失效。

**验收标准：**
- learnings-researcher 在搜索前调用 `gale-knowledge resolve-path --type solutions` 获取路径
- 如果 `gale-knowledge` 不可用，fallback 到 `docs/solutions/`
- 所有 `docs/solutions/` 硬编码引用替换为动态路径变量
- agent 描述更新，移除硬编码路径描述

**影响范围：** 1 个文件
- `plugins/galeharness-cli/agents/research/learnings-researcher.md`

### R2: 全局知识库存储设计重构——符号链接改为独立存储（P2）

**问题：** `gale-knowledge init` 创建符号链接指向本地项目 `docs/`，全局知识库中实际没有独立数据。这导致：
- 跨项目知识不可见
- 跨机器迁移失效
- 本质上只是一个指向本地的"幽灵目录"

**验收标准：**
- `gale-knowledge init` 创建独立目录结构（无符号链接）
- Skills 写入文档时复制到全局知识库
- 全局知识库中能独立存储和检索文档
- 现有 fallback 路径（本地 `docs/`）保持可用

**影响范围：**
- `cmd/gale-knowledge/init.ts`
- `src/knowledge/writer.ts`
- `tests/knowledge-init.test.ts`
- `tests/knowledge-writer.test.ts`

**注意：** 此需求范围较大，建议单独 PR 处理。

### R3: TodoWrite 旧版工具引用清理（P3）

**问题：** `plugins/galeharness-cli/skills/gh-work/SKILL.md` 第 187 行引用了旧版 `TodoWrite` 工具名。根据插件 `AGENTS.md` 规范，应使用 `TaskCreate/TaskUpdate/TaskList`。

**验收标准：**
- `e.g., TodoWrite, task lists` 改为 `e.g., TaskCreate/TaskUpdate/TaskList`
- 运行 `bun test` 无回归

**影响范围：** 1 个文件
- `plugins/galeharness-cli/skills/gh-work/SKILL.md`

### R4: docs/solutions/ 文档库维护（P3）

**问题：** 文档库中存在以下需要维护的项目：

1. **Windows Trae 文档重叠：**
   - `integrations/windows-trae-setup-2026-04-17.md`
   - `integration-issues/windows-trae-ide-compatibility-2026-04-17.md`
   - 两个文档覆盖相同问题域（uv PATH + Bash 兼容性），需要合并或明确区分

2. **Codex 文档新鲜度检查：**
   - `codex-skill-prompt-entrypoints.md`（2026-03-15）
   - `best-practices/codex-delegation-best-practices-2026-04-01.md`
   - 需确认是否仍然准确

**验收标准：**
- Windows Trae 文档合并为一个，或添加明确的区分说明
- Codex 文档验证后标记为 Keep 或 Update
- 运行 `/gh:compound-refresh` 完成扫描

## 非目标

- 不修改 HKTMemory vendor 代码（上游维护）
- 不重构 Skills 中已有的 `resolve-path` 集成（已正常工作）
- 不处理 PR #37 已修复的 P0/P1/P2 问题（已完成）

## 优先级建议

| 需求 | 优先级 | 建议时机 |
|------|--------|---------|
| R1 | P1 | 下一个 PR，与 R3 合并提交 |
| R2 | P2 | 独立 PR，需设计评审 |
| R3 | P3 | 与 R1 合并提交 |
| R4 | P3 | 下次 `/gh:compound-refresh` 时处理 |
