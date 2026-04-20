---
title: "feat: 全局知识仓库 — 跨项目知识沉淀与自动向量索引"
date: "2026-04-20"
type: feat
status: active
origin: docs/brainstorms/2026-04-20-global-knowledge-repo-requirements.md
depth: standard
requirements_trace: R1-R17
---

# feat: 全局知识仓库 — 跨项目知识沉淀与自动向量索引

## 问题框架

GaleHarnessCLI 全局安装后，`gh:brainstorm`、`gh:plan`、`gh:compound` 等技能产出的知识文档仍写入当前项目仓库的 `docs/` 目录。这导致：

1. **项目污染**：AI 工作流文档混入业务代码仓库，提交历史被噪声淹没
2. **跨项目不可见**：各项目知识分散存储，缺乏统一的检索和浏览入口
3. **团队不可共享**：知识无法跨机器迁移和复用

此外，现有 TaskBoard 只读取 SQLite 任务事件，无法关联知识文档，看板只能显示"做了什么"，看不到"为什么做、怎么决策的"。

## 作用域

### 包含

- 全局知识仓库基础设施（路径解析、初始化、目录结构）
- 知识文档写入路径迁移（技能框架层适配）
- Git 自动提交（技能执行结束时批量 commit）
- CI/CD 引导配置（GitHub Actions 自动触发向量索引更新）
- 本地向量索引增量重建（离线后备）
- TaskBoard 知识文档读取和关联

### 不包含

- 不改变任务事件存储方式（仍用 SQLite）
- 不改变 HKTMemory 核心检索逻辑（`hkt_memory_v5.py` 不修改）
- 不实现远程向量数据库部署（CI/CD 调用现有 `hkt_memory_v5.py store`）
- 不实现多用户权限控制
- 不修改项目仓库内已有 `docs/` 文档（存量不迁移）
- 不实现 git submodule 机制（见 origin: R5，MVP 后续）

## 规划决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Git commit 时机 | 技能执行结束时批量提交 | 原子性好，历史干净，一次技能调用 = 一条 commit |
| Git push 策略 | 默认手动，可配置 auto-push | 不假设网络可用性，用户控制同步节奏 |
| 向量索引更新 | CI/CD 为主，本地命令为辅 | push → GitHub Actions → `hkt_memory_v5.py store`；离线用 `gale-knowledge rebuild-index` |
| 项目名来源 | git remote repo name（复用 `extractRepoName`） | 自动获取，同 repo 多 fork 共享知识 |
| Commit message 格式 | `docs(<project>/<type>): <title>` | Conventional commit 兼容，CI 可解析 |
| 知识仓库降级 | 写入失败时降级到项目仓库 `docs/`，输出警告 | 保证不丢失知识 |
| 向量索引存储 | `~/.galeharness/vector-index/`（本地缓存，不入 git） | 文档是 source of truth，索引是派生缓存 |

## 架构概览

*以下图示为方向性设计指导，实现时应视为上下文参考而非必须复制的规范。*

```
+-------------------------------------------------------------+
|  gh:brainstorm / gh:plan / gh:compound (SKILL.md)           |
|                                                             |
|  1. gale-knowledge resolve-path --type brainstorm           |
|     -> ~/.galeharness/knowledge/<project>/brainstorms/      |
|  2. Write document to resolved path                         |
|  3. gale-knowledge commit --message "..."                   |
+----------------------+--------------------------------------+
                       |
          +------------v------------+
          |  Knowledge Repository   |
          |  ~/.galeharness/        |
          |    knowledge/           |  <-- git repo
          |      <project-a>/      |
          |        brainstorms/    |
          |        plans/          |
          |        solutions/      |
          |      <project-b>/      |
          |        ...             |
          +------------+------------+
                       | git push (manual or auto)
          +------------v------------+
          |  GitHub Actions CI/CD   |
          |  on: push               |
          |  -> parse new/changed   |
          |     docs from commits   |
          |  -> hkt_memory_v5.py    |
          |     store (incremental) |
          +-------------------------+

          +-------------------------+
          |  TaskBoard              |
          |  board list/show/serve  |
          |  reads:                 |
          |   - tasks.db (events)   |
          |   - knowledge/ (docs)   |
          |  associates by project  |
          +-------------------------+
```

### 数据流

| 操作 | 数据源 | 写入目标 | 触发方式 |
|------|--------|----------|----------|
| 知识文档写入 | 技能执行输出 | `~/.galeharness/knowledge/<project>/<type>/` | 技能写入阶段 |
| Git commit | 知识仓库变更文件 | 知识仓库 `.git/` | 技能结束时 `gale-knowledge commit` |
| 向量索引更新（远程） | 知识仓库 push | HKTMemory 向量库 | GitHub Actions |
| 向量索引重建（本地） | 知识仓库全量/增量 | `~/.galeharness/vector-index/` | `gale-knowledge rebuild-index` |
| TaskBoard 关联 | 知识仓库目录 + tasks.db | board serve UI | 用户访问时实时读取 |

## 输出结构

```
cmd/
  gale-knowledge/
    index.ts                  # CLI 入口和子命令定义
    resolve.ts                # 路径解析逻辑
    git-ops.ts                # Git 操作封装
    ci-setup.ts               # CI/CD 引导配置
    rebuild-index.ts          # 本地向量索引重建

src/
  knowledge/
    types.ts                  # 知识仓库类型定义
    home.ts                   # 知识仓库 home 路径解析
    writer.ts                 # 知识文档写入（含降级逻辑）
  board/
    knowledge-reader.ts       # 知识文档读取（TaskBoard 用）
    reader.ts                 # (修改) 集成知识关联

tests/
  knowledge-home.test.ts
  knowledge-writer.test.ts
  knowledge-git.test.ts
  knowledge-ci-setup.test.ts
  knowledge-reader.test.ts

templates/
  ci/
    github-actions-knowledge-index.yml  # GitHub Actions 工作流模板
```

## 实现单元

### Unit 1：知识仓库路径解析模块

**目标**：实现知识仓库 home 路径解析和项目子目录路径计算

**需求**：R1, R2, R3

**依赖**：无

**文件**：
- 创建 `src/knowledge/types.ts`
- 创建 `src/knowledge/home.ts`
- 创建 `cmd/gale-knowledge/resolve.ts`
- 创建 `tests/knowledge-home.test.ts`

**方案**：
- 路径解析优先级：`GALE_KNOWLEDGE_HOME` 环境变量 → `~/.galeharness/config.yaml` 中 `knowledge.home` 字段 → 默认 `~/.galeharness/knowledge/`
- 项目名提取复用 `cmd/gale-task/index.ts` 中 `extractRepoName()` 模式（支持 `git@` 和 `https://` 格式，后备用目录名）
- 项目完整路径：`<knowledge-home>/<project-name>/<doc-type>/`
- `doc-type` 枚举：`brainstorms | plans | solutions`

**模式参考**：
- `cmd/gale-task/index.ts` 中 `extractRepoName()` 的 git remote 解析
- `src/board/reader.ts` 中路径解析和环境变量处理模式

**测试场景**：
- 设置 `GALE_KNOWLEDGE_HOME` 时返回环境变量指定路径
- 未设置环境变量但存在 config.yaml 时返回配置文件路径
- 两者均未设置时返回默认路径 `~/.galeharness/knowledge/`
- 各种 git remote URL 格式（SSH、HTTPS、带 .git 后缀、不带后缀）正确提取项目名
- 无 git remote 时降级使用目录名
- doc-type 参数验证（仅接受枚举值）
- 路径拼接在 macOS 和 Linux 上均正确（使用 path.join）

**验证**：路径解析函数对各种输入组合返回正确路径，测试全部通过

---

### Unit 2：知识仓库初始化与 CLI 入口

**目标**：实现知识仓库首次使用时的 git 仓库自动初始化和 `gale-knowledge` CLI 入口

**需求**：R6, R1

**依赖**：Unit 1

**文件**：
- 创建 `cmd/gale-knowledge/index.ts`
- 创建 `cmd/gale-knowledge/git-ops.ts`
- 修改 `package.json`（添加 `gale-knowledge` bin 入口）
- 创建 `tests/knowledge-git.test.ts`

**方案**：
- `gale-knowledge init`：检测知识仓库是否已初始化（检查 `.git/` 目录），未初始化则执行 `git init`
- 自动创建 `.gitignore`（排除 `*.db`、`vector-index/`、`.DS_Store`）
- 子命令结构（使用 citty）：
  - `resolve-home`：输出知识仓库根路径
  - `resolve-path --type <type> [--project <name>]`：输出具体写入路径
  - `init`：初始化知识仓库
  - `commit --message <msg>`：批量 git add + commit
  - `rebuild-index`：本地向量索引增量重建
  - `setup-ci`：引导配置 CI/CD
- CLI 遵循 `agent-friendly-cli-principles`：非交互式优先、结构化输出、快速失败

**模式参考**：
- `cmd/gale-task/index.ts` 的 citty CLI 结构
- `package.json` 中 `"gale-task"` bin 入口的声明方式

**测试场景**：
- `init` 在空目录创建 `.git/` 和 `.gitignore`
- `init` 在已初始化目录无副作用（幂等）
- `resolve-home` 输出正确的知识仓库根路径
- `resolve-path --type brainstorm` 输出正确路径并自动创建目录结构
- `resolve-path` 对未知 type 报错退出（非零退出码 + 可操作的错误信息）
- 当 git 不在 PATH 时报明确错误

**验证**：在临时目录执行 `gale-knowledge init` 后目录包含 `.git/`、`.gitignore`；`resolve-path` 输出可直接作为文件写入路径

---

### Unit 3：知识文档写入器与降级逻辑

**目标**：实现知识文档写入（含 YAML frontmatter 增强）和降级策略

**需求**：R7, R8, R9

**依赖**：Unit 1, Unit 2

**文件**：
- 创建 `src/knowledge/writer.ts`
- 创建 `tests/knowledge-writer.test.ts`

**方案**：
- 写入流程：
  1. 调用 `resolveKnowledgePath(type, project?)` 获取目标路径
  2. 验证知识仓库可写（目录存在、有写权限）
  3. 若不可写，降级到项目仓库 `docs/<type>/`，输出警告到 stderr
  4. 确保 YAML frontmatter 包含 `project` 字段（自动注入或验证）
  5. 写入文件

- 降级判断逻辑：
  - 知识仓库目录不存在 → 尝试 init → 仍失败则降级
  - 知识仓库目录只读 → 降级
  - git 不可用 → 降级（文档仍写入，但不 commit）

- Frontmatter `project` 字段：使用 `extractRepoName()` 自动填充，确保与 `tasks.db` 中 `project` 字段对齐

**模式参考**：
- `src/board/reader.ts` 中的错误处理和降级模式
- 技能 SKILL.md 中现有的文档写入模式

**测试场景**：
- 正常写入：文档写入知识仓库正确路径，frontmatter 包含 project 字段
- frontmatter 已有 project：保留原值不覆盖
- frontmatter 无 project：自动注入
- 降级写入：知识仓库不可写时降级到项目 `docs/`，stderr 有警告
- 降级写入：git 不可用时文档仍写入但 commit 跳过
- 知识仓库未初始化时自动 init 后写入
- 文件路径包含中文项目名时正确处理

**验证**：写入函数在正常和降级场景下均能成功写入文档，frontmatter 始终包含 project 字段

---

### Unit 4：Git 自动提交

**目标**：技能执行结束时自动执行 git add + commit，commit message 包含结构化元数据

**需求**：R4, R12

**依赖**：Unit 2

**文件**：
- 扩展 `cmd/gale-knowledge/git-ops.ts`
- 扩展 `tests/knowledge-git.test.ts`

**方案**：
- `gale-knowledge commit` 命令：
  1. `git -C <knowledge-home> add -A`
  2. 检测是否有变更（`git diff --cached --quiet`），无变更则静默退出
  3. `git -C <knowledge-home> commit -m "<structured-message>"`

- Commit message 格式：`docs(<project>/<type>): <title>`
  - 示例：`docs(gale-harness-cli/brainstorm): user-authentication-requirements`
  - 示例：`docs(myapp/plan): database-migration-strategy`
  - CI/CD 可通过正则 `^docs\(([^/]+)/([^)]+)\): (.+)$` 解析 project、type、title

- 参数接口：`gale-knowledge commit --project <name> --type <type> --title <title>`

**模式参考**：
- `cmd/gale-task/index.ts` 中 shell 命令执行模式（`Bun.spawn`）

**测试场景**：
- 有变更文件时正确执行 git add + commit
- 无变更时静默退出（退出码 0）
- commit message 格式符合约定（可正则解析）
- 知识仓库非 git 目录时报错
- git 命令执行失败时（如锁文件冲突）返回可操作的错误

**验证**：在知识仓库写入文件后执行 `gale-knowledge commit`，`git log` 可看到结构化 commit

---

### Unit 5：CI/CD 引导配置

**目标**：引导用户为知识仓库配置 GitHub Actions，实现 push 后自动更新向量索引

**需求**：R11, R12

**依赖**：Unit 2, Unit 4

**文件**：
- 创建 `cmd/gale-knowledge/ci-setup.ts`
- 创建 `templates/ci/github-actions-knowledge-index.yml`
- 创建 `tests/knowledge-ci-setup.test.ts`

**方案**：
- `gale-knowledge setup-ci` 命令流程：
  1. 检测知识仓库是否有 remote（`git remote -v`）
  2. 无 remote → 提示用户先创建 GitHub 仓库并添加 remote
  3. 有 remote → 生成 `.github/workflows/knowledge-index.yml` 到知识仓库
  4. 提示用户在 GitHub 仓库设置中添加 `HKT_MEMORY_API_KEY` secret
  5. 输出后续步骤摘要

- GitHub Actions 工作流模板：
  - 触发条件：`on: push` (paths: `*/brainstorms/**`, `*/plans/**`, `*/solutions/**`)
  - 步骤：checkout → 安装 uv + Python → 解析 commit 中变更的文档 → 对每个变更文档执行 `hkt_memory_v5.py store`
  - 使用 `git diff --name-only HEAD~1` 识别变更文档
  - 从文档 frontmatter 提取 title、topic 等元数据

- 模板使用变量替换（`{{HKT_MEMORY_BASE_URL}}`、`{{HKT_MEMORY_MODEL}}`），setup-ci 命令填入当前配置值

**测试场景**：
- 模板生成：生成的 YAML 是合法 GitHub Actions 工作流
- 变量替换：模板中的占位符被正确替换为实际值
- 幂等性：重复运行 setup-ci 覆盖而非追加工作流文件
- 无 remote 时给出明确指引而非报错退出
- 生成的工作流 paths 过滤器覆盖所有 doc-type 子目录

**验证**：执行 `setup-ci` 后知识仓库中生成可用的 GitHub Actions 工作流文件

---

### Unit 6：本地向量索引增量重建

**目标**：提供本地增量重建向量索引的能力，作为 CI/CD 的离线后备

**需求**：R10, R11

**依赖**：Unit 1, Unit 4

**文件**：
- 创建 `cmd/gale-knowledge/rebuild-index.ts`
- 扩展 `tests/knowledge-git.test.ts`

**方案**：
- `gale-knowledge rebuild-index [--full]` 命令：
  1. 默认增量模式：读取 `~/.galeharness/vector-index/.last-rebuild-commit`
  2. 执行 `git diff --name-only <last-commit> HEAD` 获取变更文件列表
  3. 对每个变更的 `.md` 文件：提取 frontmatter + 摘要 → `hkt_memory_v5.py store`
  4. 更新 `.last-rebuild-commit` 为当前 HEAD
  5. `--full` 模式：忽略 last-commit，处理所有文档

- 向量索引存储路径：`~/.galeharness/vector-index/`（不入 git）
- 增量检测：基于 git diff，高效且准确
- API 不可用时：输出警告，保持旧索引，不报错退出

**测试场景**：
- 增量模式：仅处理自上次重建以来变更的文档
- 全量模式（--full）：处理所有文档
- 首次运行（无 last-commit 文件）：等同全量重建
- 无变更时静默退出
- embedding API 不可用时警告但不失败
- 正确更新 `.last-rebuild-commit` 文件

**验证**：在知识仓库添加新文档后执行 `rebuild-index`，HKTMemory retrieve 可找到新文档

---

### Unit 7：技能写入路径集成

**目标**：修改 `gh:brainstorm`、`gh:plan`、`gh:compound` 等技能的文档写入路径，使用知识仓库

**需求**：R7, R8, R9

**依赖**：Unit 1, Unit 2, Unit 3, Unit 4

**执行说明**：这是最复杂的单元，涉及多个 SKILL.md 文件修改。应先为一个技能（gh:brainstorm）完成适配并验证，再推广到其他技能。

**文件**：
- 修改 `plugins/galeharness-cli/skills/gh-brainstorm/SKILL.md`
- 修改 `plugins/galeharness-cli/skills/gh-plan/SKILL.md`
- 修改 `plugins/galeharness-cli/skills/gh-compound/SKILL.md`
- 修改相关技能的 `references/` 下文件（如有路径引用）

**方案**：
- 在每个技能的文档写入阶段前添加 HKT-PATCH：
  ```bash
  # 解析知识仓库写入路径
  KNOWLEDGE_PATH=$(gale-knowledge resolve-path --type brainstorm 2>/dev/null)
  if [ -z "$KNOWLEDGE_PATH" ]; then
    # 降级到项目仓库
    KNOWLEDGE_PATH="docs/brainstorms"
    echo "⚠️ 知识仓库不可用，降级写入项目仓库" >&2
  fi
  ```
- 将文档写入路径从硬编码的 `docs/<type>/` 替换为 `$KNOWLEDGE_PATH`
- 在技能结束阶段（Phase 末尾）添加 git commit：
  ```bash
  gale-knowledge commit --project "$(gale-knowledge resolve-project)" \
    --type brainstorm --title "<doc-title>" 2>/dev/null || true
  ```
- `|| true` 确保 commit 失败不阻塞技能执行

**模式参考**：
- 现有 `<!-- HKT-PATCH:gale-task-start -->` 模式
- 技能中 `gale-task log` 调用模式（失败静默）

**测试场景**：
- 修改后的 SKILL.md 中 HKT-PATCH 块格式正确
- `gale-knowledge` 不在 PATH 时降级到项目 `docs/` 路径
- commit 命令位于技能文档写入阶段之后
- 修改不破坏 SKILL.md 的其他内容（无意外删除或重排）
- 验证三个技能（brainstorm、plan、compound）的修改一致性

**验证**：执行修改后的技能，文档写入知识仓库而非项目仓库；`gale-knowledge` 不可用时降级到项目仓库

---

### Unit 8：TaskBoard 知识文档读取

**目标**：扩展 TaskBoard 读取知识仓库目录，展示项目关联的知识文档列表

**需求**：R13, R14, R15, R17

**依赖**：Unit 1, Unit 3

**文件**：
- 创建 `src/board/knowledge-reader.ts`
- 修改 `src/board/reader.ts`（集成知识读取）
- 修改 `src/board/types.ts`（添加知识文档类型）
- 修改 `src/commands/board-list.ts`（支持知识文档列表）
- 修改 `src/commands/board-show.ts`（展示关联知识）
- 创建 `tests/knowledge-reader.test.ts`

**方案**：
- `knowledge-reader.ts`：
  - 扫描 `~/.galeharness/knowledge/<project>/` 下所有 `.md` 文件
  - 解析 YAML frontmatter（提取 title、date、project、topic）
  - 返回 `KnowledgeDocument[]` 类型
  - 按 project 过滤

- `board-list` 扩展：
  - 增加 `--with-knowledge` 标志，列表中附带关联知识文档
  - 增加 `--knowledge-only` 标志，仅展示知识文档列表
  - 增加 `--project <name>` 筛选

- `board-show` 扩展：
  - 任务详情页增加"关联知识"区域
  - 通过 `project` 字段关联：tasks.db 中 project == 知识仓库子目录名

- 类型定义（`types.ts`）：
  ```typescript
  interface KnowledgeDocument {
    path: string;           // 相对于知识仓库根的路径
    absolutePath: string;
    title: string;
    date: string;
    project: string;
    type: 'brainstorm' | 'plan' | 'solution';
    topic?: string;
  }
  ```

**模式参考**：
- `src/board/reader.ts` 中的文件读取和数据结构化模式
- `src/board/types.ts` 中 `TaskEvent` / `DerivedTask` 类型定义模式

**测试场景**：
- 正确扫描知识仓库目录下所有 .md 文件
- 正确解析 YAML frontmatter 各字段
- 按 project 筛选返回正确结果
- 知识仓库不存在时返回空数组（不报错）
- frontmatter 缺失字段时使用合理默认值（如从文件路径推断 type 和 project）
- 文件编码错误或非 Markdown 文件时跳过
- `--with-knowledge` 正确关联任务和知识文档
- `--knowledge-only --project myapp` 仅返回指定项目的知识

**验证**：知识仓库中有文档时，`board list --with-knowledge` 展示关联文档；`board list --knowledge-only` 展示完整知识列表

---

## 实现顺序与依赖图

```
Unit 1 (路径解析)
  |--> Unit 2 (初始化 + CLI)
  |       |--> Unit 4 (Git 自动提交)
  |       |       +--> Unit 5 (CI/CD 引导)
  |       +--> Unit 6 (向量索引重建)
  +--> Unit 3 (写入器 + 降级)
          |--> Unit 7 (技能路径集成) [依赖 Unit 1,2,3,4]
          +--> Unit 8 (TaskBoard 知识读取) [依赖 Unit 1,3]
```

**建议分批交付**：
- **P1 (核心写入路径)**：Unit 1 → 2 → 3 → 4 → 7（技能可写入知识仓库并自动 commit）
- **P2 (CI/CD 自动化)**：Unit 5 → 6（push 后向量索引自动更新 + 本地后备）
- **P3 (TaskBoard 集成)**：Unit 8（看板展示知识文档）

## 系统级影响

### 跨模块影响

| 影响面 | 变更类型 | 影响范围 |
|--------|----------|----------|
| `package.json` | 添加 `gale-knowledge` bin 入口 | CLI 分发 |
| 技能 SKILL.md | 写入路径 + commit 调用 | gh:brainstorm, gh:plan, gh:compound |
| TaskBoard | 新增知识文档读取能力 | board list/show/serve |
| 环境变量 | 新增 `GALE_KNOWLEDGE_HOME` | 全局配置 |

### 向后兼容性

- 现有项目仓库中 `docs/` 文档不受影响（不迁移存量）
- `gale-knowledge` 不在 PATH 时，技能降级到原有行为
- TaskBoard 现有功能不受影响（知识展示为附加能力）
- 知识仓库是 opt-in：不配置则行为与现有完全一致

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| git 未安装或不在 PATH | 知识仓库无法初始化 | 检测 git 可用性，给出安装指引；降级到项目 `docs/` |
| embedding API 不可用 | 向量索引无法更新 | 本地索引保持旧状态，文档仍可写入和 git 管理 |
| 项目名冲突（同名不同 repo） | 知识混在同一目录 | 使用 `<org>/<repo>` 格式代替纯 repo name |
| 知识仓库体积增长 | git clone 缓慢 | 后续可考虑 shallow clone、LFS、或定期归档 |
| CI/CD secret 泄露 | API key 暴露 | GitHub Actions 使用 encrypted secrets，模板中不硬编码 key |
| Windows 路径兼容性 | 路径分隔符问题 | 使用 `path.join()`，不硬编码 `/` |

## 延迟到实现阶段的未知项

- `hkt_memory_v5.py store` 的具体参数在 CI/CD 上下文中是否需要调整（可能需要设置工作目录）
- 知识仓库体积达到什么量级需要引入归档策略
- 多个技能并发写入同一知识仓库时的 git lock 处理（Bun 是否会并发执行？）
- `gale-knowledge` 编译为独立二进制的分发策略（同 `gale-task` 模式）

## 验证策略

### 单元测试

每个 Unit 的测试场景已在各 Unit 定义中列出。使用 `bun test` 运行。

### 集成测试

- 完整流程：`gale-knowledge init` → 写入文档 → `commit` → `rebuild-index` → HKTMemory `retrieve` 找到文档
- 多项目隔离：项目 A 和项目 B 的知识文档互不干扰
- 降级场景：知识仓库不可用时完整技能流程仍正常

### 端到端验证

- 在新机器上 `git clone` 知识仓库 → `rebuild-index` → 知识可检索
- TaskBoard `board list --with-knowledge` 展示正确关联
