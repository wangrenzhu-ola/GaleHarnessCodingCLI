---
date: 2026-04-24
topic: hktmemory-public-knowledge-migration
title: HKTMemory Public Knowledge Migration Requirements
category: brainstorm
project: GaleHarnessCodingCLI
---

# HKTMemory Public Knowledge Migration Requirements

## Problem Frame

GaleHarness 已经有全局公共知识库 `~/.galeharness/knowledge/<project>/...`，`gh:brainstorm`、`gh:plan`、`gh:compound` 等技能产出的 durable 文档会优先写入这里，并由 `gale-knowledge` 管理路径、提交和索引。与此同时，HKTMemory 的分层记忆默认仍落在项目仓库自己的 `memory/` 目录，例如 `memory/L0-Abstract`、`memory/L1-Overview`、`memory/L2-Full`，并混合了 Markdown 记忆、生命周期文件和本地数据库缓存。

这造成两个割裂：用户通过 GaleHarness 安装和使用工作流后，公共知识文档进入全局知识库，但 HKTMemory 记忆仍留在单个项目目录；跨项目、换机器或清理项目仓库时，HKTMemory 的高价值记忆不能自然进入 GaleHarness 的公共知识体系。目标不是重写 HKTMemory，而是让 Gale-managed 使用路径把 HKTMemory 的记忆根目录迁移或同步到公共知识库下，使用户默认获得统一、可迁移、可审计的知识存储。

---

## Actors

- A1. GaleHarness 用户：通过 release binary、source setup 或 GaleHarness 技能使用 HKTMemory，希望无需手工管理多个记忆位置。
- A2. GaleHarness 安装/运行脚本：负责初始化 `gale-knowledge`、`gale-memory`、HKTMemory CLI/env，并在安全时触发迁移。
- A3. Gale memory runtime：通过 `gale-memory`、技能模板或后续 runtime contract 调用 HKTMemory，需要稳定的 per-project memory root。
- A4. HKTMemory CLI/runtime：继续负责 L0/L1/L2、ledger、vector store、session search、安全门禁和 task memory primitives。
- A5. 公共知识库维护者：需要知道哪些内容会进入 `~/.galeharness/knowledge`、哪些是 git source of truth、哪些只是本地派生缓存。

---

## Approach Options

| Option | Description | Pros | Cons | Decision |
| --- | --- | --- | --- | --- |
| A. 全局 re-home 作为 Gale-managed 默认 | GaleHarness 调用 HKTMemory 时默认把 `HKT_MEMORY_DIR` 指向 `~/.galeharness/knowledge/<project>/hkt-memory`，首次发现项目 `memory/` 时复制迁移，后续以全局路径为主。 | 与公共知识库统一；最少同步状态；利用 HKTMemory 已有 `--memory-dir`/`HKT_MEMORY_DIR`；项目仓库更干净。 | 需要处理已有本地 memory、bare `hkt-memory` 调用兼容和 git 忽略规则。 | 推荐采用。 |
| B. 双写/镜像同步 | 保持项目 `memory/` 为主，同时把 Markdown 记忆镜像到公共知识库。 | 对现有裸 HKTMemory 行为影响最小。 | 双源一致性复杂；冲突、删除、重命名难处理；容易重复索引。 | 不作为默认。 |
| C. 只索引不迁移文件 | 不移动 HKTMemory 文件，只把项目 `memory/` 内容 ingest 到公共知识索引。 | 改动小；适合临时兼容。 | source of truth 仍分散；换机器和 git 同步问题没有解决。 | 只作为过渡或 recovery 工具。 |

推荐方案是 **Option A：Gale-managed 全局 re-home + 安全的一次性复制迁移**。它把公共知识库作为 GaleHarness 使用场景下的默认 source of truth，同时保留本地项目 `memory/` 的只读兼容和手动 recovery 路径，避免长期维护双写同步。

---

## Key Flows

- F1. 新用户通过 GaleHarness 安装后首次使用 HKTMemory
  - **Trigger:** 用户安装 release binary 或运行 source setup 后，首次执行 `gh:*` 技能、`gale-memory start/capture` 或 Gale-managed HKTMemory 命令。
  - **Actors:** A1, A2, A3, A4
  - **Steps:** 安装或运行入口初始化 `~/.galeharness/knowledge`；解析当前项目名；为 HKTMemory 解析全局 memory root；调用 HKTMemory 时注入 `HKT_MEMORY_DIR` 或等价 `--memory-dir`；目标目录不存在时创建标准 L0/L1/L2 结构。
  - **Outcome:** 新记忆默认写入 `~/.galeharness/knowledge/<project>/hkt-memory/...`，项目仓库不再因为 Gale-managed 使用产生新的 `memory/` 目录。
  - **Covered by:** R1, R2, R3, R5, R6, R11

- F2. 现有项目有本地 `memory/` 时迁移
  - **Trigger:** Gale-managed 入口发现当前项目存在 HKTMemory 形态的 `memory/`，且全局目标缺失或未完成迁移。
  - **Actors:** A1, A2, A3, A4
  - **Steps:** 系统生成迁移状态；默认复制 Markdown 分层记忆和必要轻量元数据到全局目标；跳过或重建本地派生数据库；记录迁移 manifest；不删除项目本地 `memory/`；后续调用使用全局目标。
  - **Outcome:** 旧记忆进入公共知识体系，用户数据不被破坏，本地目录可作为备份或旧工具兼容。
  - **Covered by:** R4, R7, R8, R9, R10, R12

- F3. 公共知识库 git 化与索引
  - **Trigger:** HKTMemory 全局目录新增或更新 Markdown 记忆后，用户或技能触发 `gale-knowledge commit` / `rebuild-index`，或后续自动化在安全时触发。
  - **Actors:** A2, A4, A5
  - **Steps:** Git 只跟踪 Markdown 记忆和必要的轻量 manifest；`*.db`、向量缓存、session transcript DB 等派生文件被忽略；公共知识索引可以读取 HKTMemory Markdown，但不得把同一内容无限回写到自身。
  - **Outcome:** 高价值 HKTMemory 记忆可随公共知识库迁移和检索，派生缓存不污染 git。
  - **Covered by:** R13, R14, R15, R16

- F4. 用户继续使用裸 `hkt-memory`
  - **Trigger:** 用户直接在项目目录运行 `hkt-memory`，未经过 `gale-memory` 或 GaleHarness 技能入口。
  - **Actors:** A1, A4
  - **Steps:** 系统不强行改变上游 HKTMemory 的全局默认；文档和诊断说明裸命令可能仍使用当前工作目录的 `memory/`，并提供显式 env/flag 或 Gale wrapper 路径。
  - **Outcome:** Gale-managed 行为统一，同时不破坏上游 HKTMemory 的独立使用方式。
  - **Covered by:** R17, R18

---

## Requirements

**Global memory root**
- R1. Gale-managed HKTMemory 调用必须解析 per-project 全局 memory root，默认形态为 `~/.galeharness/knowledge/<project>/hkt-memory`，除非用户显式配置其他位置。
- R2. 项目名解析应与 `gale-knowledge extract-project` 保持一致；无 git remote 时使用当前目录名 fallback，并进行路径组件安全校验。
- R3. Gale-managed 调用必须通过 `HKT_MEMORY_DIR` 或 HKTMemory 已支持的 `--memory-dir` 指向全局 memory root，不要求改变 HKTMemory 上游裸命令的默认行为。
- R4. 全局 memory root 必须保留 HKTMemory 已有分层结构，包括 `L0-Abstract`、`L1-Overview`、`L2-Full`、governance 和 lifecycle 相关文件；规划阶段可决定是否把 task ledger 放在同一 root 下。

**Migration behavior**
- R5. 新安装或首次使用时，如果当前项目没有本地 HKTMemory `memory/`，系统应直接创建全局 memory root，不在项目仓库创建新的 `memory/`。
- R6. 如果当前项目存在 HKTMemory 形态的 `memory/`，系统必须提供一次性迁移路径，把已有记忆复制到全局 memory root，并记录迁移状态。
- R7. 默认迁移策略必须是 copy-first，不删除、不移动用户的项目本地 `memory/`；删除或清理只能作为显式后续操作。
- R8. 迁移必须跳过或重新生成派生缓存文件，至少包括 `*.db`、vector store、session transcript index 和其他可重建索引；这些文件不得成为公共知识库的 git source of truth。
- R9. 迁移必须处理目标目录已存在的情况：不能静默覆盖较新的全局记忆；冲突文件应保留双方内容或生成冲突报告，交由后续规划定义具体合并规则。
- R10. 迁移完成后，Gale-managed 调用应优先使用全局 memory root；本地 `memory/` 只作为 legacy backup 或裸 HKTMemory 兼容来源。

**Installation and runtime integration**
- R11. Release binary 安装脚本、source setup 脚本和自检说明必须对齐：普通用户和贡献者都能初始化 `gale-knowledge`、验证 `gale-memory`，并看到 HKTMemory memory root 是否指向公共知识库。
- R12. `gale-memory` helper 应成为技能和脚本的优先入口；它负责构造 task envelope，同时继承或设置全局 HKTMemory memory root，避免每个技能各自拼接 memory-dir 逻辑。
- R13. `gale-knowledge init` 或相关 setup 应确保公共知识库 `.gitignore` 忽略 HKTMemory 派生缓存，并允许跟踪 Markdown 分层记忆和必要 manifest。
- R14. `gale-knowledge rebuild-index` 需要明确处理 `hkt-memory` 目录：可以索引 Markdown 记忆，但必须防止把公共知识库内容重新写回同一 HKTMemory root 造成重复、递归或噪声污染。

**User control and compatibility**
- R15. 用户必须能通过环境变量或配置覆盖 Gale-managed HKTMemory memory root；覆盖后诊断应显示实际使用路径。
- R16. 系统必须提供诊断或状态输出，说明当前项目的 HKTMemory 来源：global、legacy-local、migrated、migration-needed、migration-conflict 或 unavailable。
- R17. 裸 `hkt-memory` 命令的独立使用方式不作为本需求的强制改变范围；如果用户绕过 Gale-managed 入口，系统只需通过文档和诊断说明如何显式设置全局路径。
- R18. 当 `hkt-memory`、`gale-knowledge`、git 或权限不可用时，技能必须 graceful degradation：不阻塞核心工作流，并清楚说明记忆迁移或公共知识写入被跳过。

---

## Acceptance Examples

- AE1. **Covers R1, R3, R5, R11.** Given 新用户通过 release binary 安装并运行 `gale-memory start`，when 当前项目没有 `memory/`，then HKTMemory 记忆目录应解析到 `~/.galeharness/knowledge/<project>/hkt-memory`，并创建 L0/L1/L2 结构。
- AE2. **Covers R6, R7, R8, R10.** Given 现有项目包含 `memory/L0-Abstract`、`memory/L1-Overview`、`memory/L2-Full` 和多个 `.db` 文件，when Gale-managed 入口执行迁移，then Markdown 记忆被复制到全局目标，`.db` 文件不进入 git source of truth，本地 `memory/` 保留不删除，后续 Gale-managed 调用使用全局目标。
- AE3. **Covers R9, R16.** Given 全局目标和本地 `memory/` 都有同名但内容不同的 Markdown 文件，when 迁移运行，then 系统不得静默覆盖；状态应显示 `migration-conflict` 或输出冲突报告。
- AE4. **Covers R13, R14.** Given `gale-knowledge rebuild-index` 在包含 `<project>/hkt-memory` 的公共知识库中运行，when 它索引 Markdown 文件，then 派生数据库仍被 `.gitignore` 排除，且不会把索引结果递归追加成重复 HKTMemory 记忆。
- AE5. **Covers R15, R17, R18.** Given 用户显式设置自定义 `HKT_MEMORY_DIR` 或裸跑 `hkt-memory`，when 诊断运行，then 系统能说明实际路径、Gale-managed 默认是否被覆盖，以及迁移未执行是否影响公共知识能力。

---

## Success Criteria

- 通过 GaleHarness 脚本安装或使用的用户，新产生的 HKTMemory 分层记忆默认进入 `~/.galeharness/knowledge/<project>/hkt-memory`，而不是项目仓库 `memory/`。
- 现有项目本地 HKTMemory 记忆可以安全复制进入公共知识库，且不会删除用户原始数据或提交派生数据库。
- `gale-memory`、`gale-knowledge`、setup/release 安装脚本和 README 对 memory root 的说明一致，用户能用一个诊断入口看懂当前状态。
- 公共知识库可以同时承载 `brainstorms/plans/solutions` 文档和 HKTMemory 分层记忆，但两者职责清晰，不发生重复索引或无限回写。
- 后续 `gh:plan` 可以直接基于本文档规划实现，不需要重新决定默认路径、迁移策略、source of truth 或裸 HKTMemory 兼容边界。

---

## Scope Boundaries

- 不重写 HKTMemory 的 L0/L1/L2 算法、向量后端、reranker、MCP server 或 task memory schema。
- 不把项目本地 `memory/` 自动删除、移动或从用户仓库中清理；本需求只要求安全复制迁移和后续默认路径切换。
- 不要求第一版实现实时双向同步；长期双写会制造一致性问题，不作为推荐方向。
- 不要求公共知识库 git 跟踪 `.db`、embedding cache、transcript index 或其他可重建派生文件。
- 不强制改变裸 `hkt-memory` 在非 GaleHarness 场景下的默认行为。
- 不在 requirements 阶段规定具体文件合并算法、CLI flag 名称或测试实现细节；这些留给 `gh:plan`。

---

## Key Decisions

- 采用 **全局 re-home 作为 Gale-managed 默认**，而不是长期双写同步：单一 source of truth 更容易解释、测试和恢复。
- 迁移采用 **copy-first**：公共知识库获得旧记忆，本地 `memory/` 保留为备份，避免安装脚本意外破坏用户数据。
- 公共知识库只把 Markdown 记忆和必要 manifest 作为可迁移事实；数据库和向量索引是可重建缓存。
- `gale-memory` 是优先 runtime 入口：技能应逐步从直接 `hkt-memory` 命令收敛到统一 helper，减少路径逻辑分散。
- 裸 HKTMemory 兼容作为边界条件处理：GaleHarness 负责自己管理的安装/使用路径，不冒然改变上游工具的独立语义。

---

## Dependencies / Assumptions

- HKTMemory 当前已支持 `HKT_MEMORY_DIR` 和 `--memory-dir`，因此无需为路径迁移先改写上游存储层。
- `gale-knowledge` 当前有效文档类型只有 `brainstorms`、`plans`、`solutions`；HKTMemory 分层记忆应作为项目目录下的独立 subtree，而不是伪装成这些文档类型。
- 公共知识库 `.gitignore` 已包含 `*.db`，但 planning 仍需确认是否还要忽略更多 HKTMemory 派生文件。
- Release binary 安装当前主要安装 GaleHarnessCLI 二进制并验证 `gale-memory`，source setup 当前会安装 HKTMemory CLI 并创建项目 `memory/`；两类安装路径需要在后续实现中统一语义。
- 当前 worktree 已有未提交的 `memory/` 修改，因此任何实现阶段都必须继续遵守不覆盖用户数据的原则。

---

## Outstanding Questions

### Resolve Before Planning

- 无。

### Deferred to Planning

- [Affects R1, R15][Technical] 全局 memory root 的最终配置优先级应如何排序：显式 `HKT_MEMORY_DIR`、Gale config、`GALE_KNOWLEDGE_HOME` 派生路径、默认路径。
- [Affects R6, R9][Technical] 迁移 manifest 和冲突报告的文件名、位置、幂等判断规则如何设计。
- [Affects R8, R13][Technical] 除 `*.db` 外还需要忽略哪些 HKTMemory 派生文件或临时文件。
- [Affects R11, R12][Technical] release binary 环境如何获得可用的 `hkt-memory` CLI：继续依赖用户已有安装、随 release 打包、还是由 `gale-memory` 提供更完整的 wrapper。
- [Affects R14][Technical] `gale-knowledge rebuild-index` 索引公共知识库时，应写入哪个 memory root，如何避免把 HKTMemory subtree 重复 ingest 回自身。
- [Affects R16][Technical] 状态诊断应挂在 `gale-memory status`、`gale-knowledge doctor`，还是安装脚本自检中。

---

## Next Steps

-> `gh:plan` for structured implementation planning
