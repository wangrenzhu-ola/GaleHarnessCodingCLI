---
date: 2026-04-20
topic: global-knowledge-repo
---

# Global Knowledge Repository

## Problem Frame

GaleHarnessCLI 全局安装后，brainstorm/plan/solutions 等知识文档仍然写入当前项目仓库的 `docs/` 目录。这导致三个问题：

1. **项目污染**：知识文档混入业务代码仓库，提交历史被 AI 工作流噪声淹没
2. **跨项目不可见**：不同项目的知识积累分散在各自仓库中，没有统一的浏览和检索入口
3. **团队不可共享**：换机器或多人协作时，知识文档无法迁移和复用

同时，现有的 taskboard 只读 `~/.galeharness/tasks.db`（任务执行事件），无法关联到知识文档，导致看板只能看到"做了什么任务"，看不到"为什么做、怎么决策的"。

## Requirements

**Knowledge Repository**

- R1. 用户可通过环境变量 `GALE_KNOWLEDGE_HOME` 或全局配置文件指定知识仓库目录；未指定时默认为 `~/.galeharness/knowledge/`
- R2. 知识仓库是一个 git 管理的目录，按项目名（git remote repo name）分子目录组织
- R3. 每个项目子目录下包含 `brainstorms/`、`plans/`、`solutions/` 子目录，结构与现有项目仓库内 `docs/` 下的组织方式一致
- R4. 每次写入知识文档时，自动在知识仓库内执行 `git add` + `git commit`（commit message 包含项目名、文档类型、文档标题）
- R5. 支持可选的 git submodule 机制：项目子目录可以是一个 submodule，指向独立的远程仓库（详见 Outstanding Questions，MVP 不实现）
- R6. 首次使用时（知识仓库目录不存在），自动初始化 git 仓库和目录结构

**Knowledge Write Path**

- R7. 所有 `gh:` 技能（brainstorm、plan、compound 等）写入知识文档时，写入全局知识仓库而非当前项目仓库的 `docs/` 目录
- R8. 写入的文档包含 YAML frontmatter，其中至少包含 `project` 字段（项目名），用于向量检索和目录分类
- R9. 现有的项目仓库内 `docs/` 写入路径作为后备：当知识仓库不可写（权限、磁盘满等）时，降级到项目仓库内写入，并输出警告；降级期间写入的文档在知识仓库恢复后不自动迁移，但输出提示让用户手动处理

**Vector Index**

- R10. 本地向量索引存储在知识仓库外（`~/.galeharness/vector-index/`），不纳入 git 管理
- R11. 当知识仓库通过 git pull 获得新文档时，本地自动增量重建向量索引（仅处理新增/变更文档的 embedding）
- R12. git commit message 采用结构化格式（包含项目名、文档类型、文档标题等机器可解析字段），使未来 CI/CD 可从 commit 自动提取元数据更新远程向量数据库（CI/CD pipeline 本身不在本次范围内）

**Taskboard Integration**

- R13. taskboard 在现有 SQLite 数据源基础上，增加读取知识仓库目录的能力，展示每个项目下的知识文档列表
- R14. taskboard 任务卡片中增加"关联知识"区域，通过 `project` 字段关联同一项目下的 brainstorm/plan/solutions 文档
- R15. taskboard 支持按项目筛选知识文档（与现有任务筛选一致）

**Task Events**

- R16. 任务执行事件继续使用 SQLite 存储（`~/.galeharness/tasks.db`），不纳入 git 管理
- R17. SQLite 中现有 `project` 字段与知识仓库的目录名对齐，确保 taskboard 可通过项目名关联两类数据

## Success Criteria

1. 全局安装 GaleHarnessCLI 后，运行 `gh:brainstorm` 产生的需求文档写入 `~/.galeharness/knowledge/<project>/brainstorms/`，而非项目仓库
2. 在知识仓库内执行 `git log` 可看到每次知识写入的 commit 记录
3. taskboard 中可按项目查看关联的知识文档列表
4. 在机器 A 上 `git push` 知识仓库后，在机器 B 上 `git pull` + 自动增量重建索引后，可通过向量检索找到机器 A 上沉淀的知识
5. 现有的 `gh:compound`、`gh:plan` 等技能无需修改技能内容即可适配新的写入路径（路径解析逻辑在框架层处理）

## Scope Boundaries

- 不改变任务事件的存储方式（继续用 SQLite，不 git 化）
- 不改变 HKTMemory 的核心检索逻辑（仍然通过 `hkt_memory_v5.py` 调用）
- 不实现远程向量数据库的部署方案（CI/CD 集成是后续工作）
- 不实现多用户权限控制（知识仓库的访问控制交给 git 平台）
- 不修改项目仓库内已有的 `docs/` 文档结构（向后兼容）

## Key Decisions

- **方案 A 渐进式**：知识文档独立为 git 仓库，任务事件保留 SQLite。最小改动，风险最低
- **项目名用 git remote repo name**：自动获取，无需配置；同一 repo 的多个 fork 视为同一项目，知识共享
- **LLM 存入动作即 commit**：每次写入知识文档时自动 commit，使 CI/CD 可从 commit 解析并更新远程向量索引
- **向量索引是本地缓存**：git 管理的是文档（source of truth），向量索引是从文档派生的缓存，可随时重建
- **默认路径 `~/.galeharness/knowledge/`**：与现有 `~/.galeharness/` 体系统一
- **降级策略**：知识仓库不可写时降级到项目仓库写入，保证不丢失

## Dependencies / Assumptions

- 知识仓库的 git 操作（init、add、commit）假定 git 已安装在 PATH 上
- 增量重建向量索引需要 embedding API 可用；API 不可用时本地向量索引保持旧状态，不阻塞工作流
- CI/CD 集成假定团队使用 GitHub 或类似平台，可通过 push event 触发 pipeline

## Outstanding Questions

### Resolve Before Planning

（无阻塞问题）

### Deferred to Planning

- [Affects R4][Technical] git commit 的触发时机：是每次写入单文件就 commit，还是一次技能执行结束后统一 commit？影响 commit 粒度和 git 历史可读性
- [Affects R11][Needs research] 增量重建的变更检测机制：如何高效判断哪些文档是新增/变更的？可能需要维护一个 manifest 文件记录已索引文档的 hash
- [Affects R12][Needs research] CI/CD 解析 commit 内容的格式约定：commit message 中需要包含哪些结构化字段才能让 CI/CD 自动提取文档和元数据
- [Affects R13][Technical] taskboard 读取知识仓库目录的方式：是直接文件系统遍历，还是需要一个轻量 API 层
- [Affects R5][Needs research] submodule 机制的初始化和更新流程：用户如何将一个项目子目录转为 submodule
- [Affects R11][Technical] 增量重建的触发机制：git pull 后由什么触发索引重建（git hook / 下次技能运行时 / 手动命令）？
- [Affects R4][Technical] git push 的时机：commit 后是否自动 push？手动 push？还是提供配置选项？

## Next Steps

-> `/gh:plan` for structured implementation planning
