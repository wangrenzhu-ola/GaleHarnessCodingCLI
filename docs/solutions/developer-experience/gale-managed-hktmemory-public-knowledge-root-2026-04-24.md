---
title: "Gale-managed HKTMemory 公共知识库 root 迁移"
date: 2026-04-24
category: developer-experience
module: "gale-memory / hkt-memory public knowledge root"
problem_type: developer_experience
component: development_workflow
severity: high
applies_when:
  - Gale-managed HKTMemory 需要默认写入公共知识库，而不是项目本地 memory/
  - 既有项目本地 HKTMemory 记忆需要安全迁移到 per-project 全局 root
  - 公共知识库同时承载 Markdown 文档和 HKTMemory 分层记忆
tags: [hktmemory, gale-memory, knowledge-root, migration, public-knowledge, rebuild-index]
related_components: [gale-knowledge, hkt-client, setup-scripts, gh-skills]
---

# Gale-managed HKTMemory 公共知识库 root 迁移

## Context

GaleHarness 已经用 `gale-knowledge` 把 brainstorm、plan、solution 文档集中到 `~/.galeharness/knowledge/<project>/...`，但 Gale-managed HKTMemory 仍默认使用项目本地 `memory/`。这会让同一个工作流产生两套知识来源：durable Markdown 文档可以跟随公共知识库迁移，HKTMemory 的 L0/L1/L2 记忆、task ledger 和 lifecycle 相关内容却绑定在单个 checkout 上。

PR #68 的解决目标是把通过 GaleHarness 入口使用的 HKTMemory 默认收敛到：

```text
~/.galeharness/knowledge/<project>/hkt-memory
```

关键边界是：不改变裸 `hkt-memory` 的上游默认语义。裸命令仍可按 HKTMemory 自己的规则使用当前目录 `memory/`；需要公共 root 时，通过 `gale-memory` 或显式 `HKT_MEMORY_DIR` 进入。

相关已有文档 `global-knowledge-repository-infrastructure-2026-04-20.md` 解决的是公共知识文档仓库本身的 path resolution、commit 和 indexing 基础设施。本次沉淀的是 HKTMemory runtime 如何并入这套公共知识体系，属于同一基础设施的后续演进，不是重复问题。

## Guidance

### 1. 把 Gale-managed root 解析集中在 runtime 边界

不要让每个 `gh:*` 技能各自拼 `HKT_MEMORY_DIR`。公共 root 的解析应集中在 `gale-memory` / task runtime / `HktClient` 这一层：

- `--memory-dir` 显式参数优先级最高，适合临时诊断和测试。
- 已有 `HKT_MEMORY_DIR` 次之，保留 HKTMemory 用户的既有 env 语义。
- `~/.galeharness/config.{json,yaml}` 中的 `memory.hkt_memory_dir` 作为持久配置入口。
- 默认值派生自 `gale-knowledge` 的 home/project 规则：`<knowledgeHome>/<project>/hkt-memory`。

PR #68 用 `src/memory/public-root.ts` 承载这条规则，并复用 `src/knowledge/home.ts` 的 `resolveKnowledgeHome`、`extractProjectName` 和 `sanitizePathComponent`。这样 Gale-managed HKTMemory 与公共知识文档使用同一套 project 名和 home 解析，不会产生第二套目录语义。

### 2. 迁移必须 copy-first，不能删除或静默覆盖

已有项目可能已经有 `memory/L0-Abstract`、`memory/L1-Overview` 或 `memory/L2-Full`。迁移策略应把本地 `memory/` 视为 legacy source，而不是待移动目录：

- 只复制 Markdown 分层记忆和必要轻量 manifest。
- 跳过 `*.db`、vector store、BM25/entity/session transcript index、`_lifecycle/events.jsonl`、cache/tmp 等可重建派生文件。
- target 缺失时复制；target 已存在且内容相同则跳过；target scaffold 为空时允许用 source 覆盖；target 已有不同内容时不覆盖，记录冲突。
- 在 target root 写 `.gale-migration-manifest.json`，冲突时写 `MIGRATION_CONFLICTS.md`。
- 本地 `memory/` 永远不删除、不改名，继续作为 legacy backup 和裸命令兼容路径。

这条规则避免了安装或首次运行时破坏用户数据，也避免把本地数据库缓存错误提交到公共知识库。

### 3. `gale-memory status/migrate/resolve-root` 是用户可理解的诊断面

公共 root 迁移不是只靠内部 env 注入完成。用户需要一个稳定命令回答三个问题：当前项目用哪个 root、root 来源是什么、是否有 legacy migration 状态。

PR #68 在 `cmd/gale-memory/index.ts` 增加：

- `gale-memory resolve-root`：输出当前 Gale-managed HKTMemory root，脚本和技能可用于注入。
- `gale-memory status --json`：输出 `global`、`legacy-local`、`migration-needed`、`migrated`、`migration-conflict` 等状态，以及 root/source/project。
- `gale-memory migrate --cwd <repo>`：显式触发同一 copy-first migration engine。

现有 `start`、`capture`、`feedback` 继续通过 task runtime 使用统一 resolver，并由 `HktClient` 给 child process 注入 `HKT_MEMORY_DIR`。这样技能层可以从 raw `hkt-memory retrieve/store` 收敛为先调用 `gale-memory resolve-root`，再显式注入公共 root。

### 4. 公共知识库 git 只跟踪 source-of-truth，index root 必须独立

公共知识库现在同时包含：

- `brainstorms/`、`plans/`、`solutions/` 等 durable 文档。
- `<project>/hkt-memory/` 下的 HKTMemory Markdown 分层记忆和 migration manifest。

因此 `gale-knowledge init` 的 `.gitignore` 必须排除 HKTMemory 派生缓存，例如 `*.db`、`vector_store/`、`vector-index/`、`bm25_index.db`、`entity_index.db`、`session_transcript_index.db`、`.last-rebuild-commit` 和 `_lifecycle/events.jsonl`。Markdown 和必要 manifest 才是可审计、可迁移的事实。

`gale-knowledge rebuild-index` 也不能把公共知识库内容索引回任一 `<project>/hkt-memory` subtree，否则会出现自引用和递归污染。PR #68 让 rebuild-index 使用独立的可重建 index root，例如 `~/.galeharness/vector-index/knowledge-repo`，允许扫描 `hkt-memory/**/*.md`，但索引产物不会写回被扫描的 HKTMemory source tree。

### 5. 安装脚本和文档要明确裸命令边界

setup/install 文案不应继续默认创建项目本地 `memory/`，否则会和公共 root 的默认行为冲突。PR #68 把安装后的验证引导改为 `gale-memory status`，并在 README / 插件 README 中明确：

- Gale-managed 调用默认进入 `~/.galeharness/knowledge/<project>/hkt-memory`。
- 覆盖优先级是 `--memory-dir` -> `HKT_MEMORY_DIR` -> `memory.hkt_memory_dir` -> derived public root。
- 裸 `hkt-memory` 保留 upstream 默认语义；如果要使用公共 root，需要显式 env/flag 或通过 `gale-memory`。

## Why This Matters

HKTMemory 的价值在于长期可复用的上下文。如果 Gale-managed 记忆默认留在单个 checkout 的 `memory/`，用户清理仓库、换机器或从 release binary 迁移到源码环境时，很容易丢失高价值经验。把默认 root 收敛到公共知识库后，Markdown 记忆、解决方案文档和索引能力可以共享同一套 Git 化、可审计、可迁移的知识体系。

同时，保留裸 `hkt-memory` 默认语义是必要的兼容边界。GaleHarness 只管理自己入口下的 runtime 行为，不冒然改变 vendored 上游工具在独立使用场景中的默认路径。这个边界让迁移可以安全落地，也降低了未来同步 upstream HKTMemory 的维护成本。

copy-first 迁移和冲突报告是这类工具迁移的最低安全线：旧数据不能被安装脚本删除，已有全局记忆不能被本地旧内容静默覆盖，派生缓存不能进入公共知识 Git source-of-truth。

## When to Apply

- 为 workflow runtime 增加 per-project 全局数据目录，但仍需要兼容上游裸 CLI 的默认行为。
- 把项目本地历史数据迁移到全局知识库，且不能自动删除或改名用户原始目录。
- 公共知识仓库既要跟踪 Markdown source-of-truth，又要排除可重建数据库、向量索引和 transcript cache。
- 技能、安装脚本、runtime client 都需要同一个诊断入口说明实际路径和覆盖来源。

## Examples

### 解析 Gale-managed root

```bash
gale-memory resolve-root
# ~/.galeharness/knowledge/GaleHarnessCodingCLI/hkt-memory

gale-memory status --json
```

`status` 输出应包含实际 `memory_dir`、`source`、`project`、`knowledge_home` 和 migration status。测试中需要覆盖新项目不会创建 repo-local `memory/`。

### 显式迁移 legacy memory

```bash
gale-memory migrate --cwd /path/to/project
```

迁移完成后，全局 target 中应包含 legacy Markdown，例如：

```text
~/.galeharness/knowledge/<project>/hkt-memory/L2-Full/daily/legacy.md
```

但不应包含：

```text
bm25_index.db
entity_index.db
session_transcript_index.db
vector_store.db
_lifecycle/events.jsonl
```

本地 `/path/to/project/memory/` 应保持存在，作为 legacy backup 和裸 `hkt-memory` 兼容来源。

### 技能中注入公共 root

```bash
MEMORY_DIR=$(gale-memory resolve-root 2>/dev/null)
if [ -n "$MEMORY_DIR" ]; then
  HKT_MEMORY_DIR="$MEMORY_DIR" hkt-memory retrieve \
    --query "<query>" \
    --layer all \
    --limit 10
fi
```

长期看，优先把更多 raw HKTMemory 工作流收敛成结构化 `gale-memory` 子命令，减少技能层 shell 拼接。

### 防止 rebuild-index 递归污染

```bash
gale-knowledge rebuild-index --full
```

该命令可以扫描公共知识库中的 Markdown，包括 `<project>/hkt-memory/**/*.md`，但写入的 HKTMemory index root 应是独立的可重建目录，例如：

```text
~/.galeharness/vector-index/knowledge-repo
```

不要把索引结果写回当前正在扫描的 `<project>/hkt-memory`。

## Related

- PR #68: https://github.com/wangrenzhu-ola/GaleHarnessCodingCLI/pull/68
- `docs/brainstorms/2026-04-24-hktmemory-public-knowledge-migration-requirements.md`
- `docs/plans/2026-04-24-004-feat-hktmemory-public-knowledge-migration-plan.md`
- `docs/solutions/developer-experience/global-knowledge-repository-infrastructure-2026-04-20.md`
- `docs/solutions/integration-issues/hkt-memory-install-to-path-2026-04-23.md`
- `src/memory/public-root.ts`
- `src/memory/migration.ts`
- `src/memory/hkt-client.ts`
- `cmd/gale-memory/index.ts`
- `cmd/gale-knowledge/rebuild-index.ts`
- `tests/hktmemory-public-knowledge-migration.test.ts`
