---
date: 2026-04-23
topic: cli-self-update
---

# CLI 自更新 — Phase 2: 二进制发布与更新命令

## Problem Frame

GaleHarnessCLI 不具备自更新能力。用户获取新版本的唯一方式是手动 `git pull` 或重新运行 `setup.sh`，无法通过 CLI 命令行直接更新。

当前状态确认：
- **CLI 无 update 子命令**：`gale-harness` 现有子命令为 `convert`、`install`、`list`、`plugin-path`、`sync`、`board`
- **`--version` 标志**：`src/index.ts` 通过 citty `meta.version` 已暴露 `--version`，输出格式当前为 `compound-plugin/2.0.0`（因 `meta.name` 硬编码）
- **GitHub Release 无构建产物**：有 release tag 但 assets 为空，无可下载的二进制文件
- **当前安装方式为 bun link**：`setup.sh` 执行 `bun link`，在 `~/.bun/bin/` 创建指向源码的符号链接
- **package.json 标记 private**：已移除 npm publish，无 registry 分发

> **Do-nothing 基线**：用户可通过 `git pull && bun link` 恢复。本方案引入 CI 编译、GitHub Release 资产管理和更新逻辑的边际收益需与运营负担权衡。详见下方「Open Decisions」。

## Requirements

### Release 产物构建

- R1. CI 在 release PR 合入 main 时自动编译三个二进制入口为独立可执行文件：
  - `gale-harness`（src/index.ts）
  - `compound-plugin`（src/index.ts，同入口不同名称）
  - `gale-knowledge`（cmd/gale-knowledge/index.ts）
- R2. 使用 `bun build --compile` 编译，目标平台为 macOS arm64
- R3. 编译产物以 `tar.gz` 形式上传到对应 GitHub Release 的 assets：
  - 命名格式：`galeharness-cli-{version}-darwin-arm64.tar.gz`
  - 同时上传同名的 `galeharness-cli-{version}-darwin-arm64.tar.gz.sha256` 校验文件
- R4. tar.gz 内部包含三个二进制文件 + 一个 `VERSION` 文本文件（内容为版本号）

### CLI update 子命令

- R5. 新增 `gale-harness update` 子命令，执行以下流程：
  1. 查询 GitHub Release API 获取最新版本号（`wangrenzhu-ola/GaleHarnessCLI` 仓库）。API 请求优先使用 `GITHUB_TOKEN` 环境变量进行认证；未认证时需显式说明可能受限于每小时 60 次 rate limit
  2. 对比当前 CLI 版本：从 `gale-harness --version` 的输出解析语义化版本（唯一来源）。编译时须将版本号嵌入二进制
  3. 若已是最新，输出 "Already up to date" 并退出
  4. 若有新版本，使用 `mktemp -d` 创建仅当前用户可访问的临时目录（权限 `0700`），下载对应平台的 tar.gz 与 `.sha256` 文件到该目录
  5. 校验下载完整性：使用 SHA256 校验和验证 tar.gz，校验失败直接报错退出
  6. 解压 tar.gz 到临时目录，验证内部包含三个二进制文件
  7. 将当前 `~/.bun/bin/` 下的三个二进制（或符号链接指向的实际文件）复制到同一临时目录的子目录作为单次备份；若备份源为符号链接，update 命令须识别并处理（见 Open Decisions）
  8. 用临时目录中的新二进制逐个替换 `~/.bun/bin/` 下的旧文件
  9. 替换成功后输出更新结果（旧版本 -> 新版本），并删除临时目录
  10. **替换失败时**：从步骤 7 的备份复制回 `~/.bun/bin/`，恢复后报错退出并提示用户 "更新失败，已恢复原有版本。如仍有问题，可重新运行 setup.sh 或 git pull && bun link"

- R6. `gale-harness update --check` 仅检查是否有新版本，不执行下载或替换
- R7. ~~`gale-harness update --rollback`~~（已删除：持久化备份目录增加无必要维护负担，等效恢复路径 `git pull` / `setup.sh` 已存在）
- R8. ~~更新失败时自动回滚~~（已精简：仅 R5 step 10 的替换失败恢复；下载或解压失败直接报错退出，不触发恢复，因为现有二进制未被触碰）
- R9. 支持 `COMPOUND_PLUGIN_GITHUB_SOURCE` 环境变量覆盖仓库地址（与 install 命令一致），用于内网镜像或测试。**安全提示**：当前实现无白名单或签名验证，环境变量被篡改可将更新源重定向至任意仓库

### CLI 标志要求

- R10. CLI 必须暴露 `--version` 标志，输出格式为 `{name}/{version}`（如 `gale-harness/2.1.0`），供 update 命令解析当前版本

## Scope Boundaries

**包含在本次需求内：**
- Release CI 产物构建和上传
- CLI update 子命令（含 check）
- macOS arm64 平台支持

**延后到后续迭代：**
- Linux x64 和 Windows x64 平台的编译产物和更新支持
- 自动检查更新提醒（如启动时提示有新版本）
- 增量更新（仅下载变更部分）
- 版本锁定/版本范围约束

**不在本项目范围内：**
- npm registry 发布
- Homebrew tap 维护
- 非开发者用户的一键安装体验

## Success Criteria

- SC1. `gale-harness update --check` 能正确查询 GitHub Release 并报告当前/最新版本
- SC2. `gale-harness update` 能从 GitHub Release 下载编译产物、通过 SHA256 校验、替换本地二进制，更新成功后 `gale-harness --version` 显示新版本
- SC3. 替换失败时从临时备份恢复，恢复后 `gale-harness --version` 显示旧版本
- SC4. ~~`gale-harness update --rollback` 能回滚到上一版本~~（已删除）
- SC5. GitHub Release 包含可下载的 tar.gz 产物及对应的 `.sha256` 文件

## Dependencies

- R1-R4（Release 产物构建）必须先于 R5-R10（update 子命令）完成
- R10（`--version` 标志）是 R5 step 2 的前置依赖

## Key Files

- `src/commands/update.ts` — 新增 update 子命令
- `src/index.ts` — 注册 update 子命令；须解决 `meta.name` 硬编码问题（见 Open Decisions）
- `.github/workflows/release-pr.yml` — 添加编译和上传步骤
- `.github/workflows/release-published.yml` — 可能新增：监听 release 创建事件并触发编译上传
- `scripts/release/` — 可能新增编译脚本

## Open Decisions

以下问题在文档审查中被识别为 **Decisions**（需明确决策后方可实施），按严重度排序：

### [P0] CI Runner 平台
**问题**：`.github/workflows/release-pr.yml` 使用 `ubuntu-latest`，而 `bun build --compile` 只能生成宿主平台二进制，无法在 Linux x64 上产出 macOS arm64 产物。合并后用户将下载到不可执行的 Linux 二进制。
**候选方案**：
1. 新增 macOS runner job 专门负责编译（推荐：最简单可靠）
2. 调研 bun 交叉编译能力（当前文档明确不支持）
3. 放弃二进制分发，改为 source-based 更新（见 P0 安装路径决策）

### [P0] 安装路径与 bun link 冲突
**问题**：`setup.sh` 通过 `bun link` 安装，在 `~/.bun/bin/` 创建指向源码的软链。update 命令替换软链为编译二进制会破坏 `bun link` 关系，且对通过 `bun install -g` 安装的用户会损坏全局包状态。
**候选方案**：
1. 重写 `setup.sh` 为编译二进制安装路径（推荐与 Phase 2 同步修改，确保安装与更新路径一致）
2. update 命令同时支持软链和编译二进制两种安装模式（检测逻辑更复杂）

### [P0] 硬编码 `meta.name` 破坏双二进制身份
**问题**：`src/index.ts` 硬编码 `meta.name: "compound-plugin"`，导致 `gale-harness` 和 `compound-plugin` 两个二进制都输出 `compound-plugin/2.0.0`，破坏版本解析和身份识别。
**候选方案**：
1. 构建时通过 `bun build --define` 注入名称（推荐）
2. 维护两个入口文件（`src/index.ts` + `src/index-compound.ts`）
3. 废弃 `compound-plugin` 别名，仅保留 `gale-harness`

### [P1] Release-please 多 release 与 tag 前缀对齐
**问题**：release-please 配置同时管理 `cli` 和 `galeharness-cli` 两个组件，产生 `cli-v*` 和 `galeharness-cli-v*` 两个 release tag。R5 查询 `galeharness-cli-v` 前缀，但编译产物从根源码（`.` 包）构建。若资产上传至 `cli-v*` release 而客户端查询 `galeharness-cli-v*`，将永久报告无更新。
**候选方案**：
1. 将编译产物资产统一上传至 `cli-v*` release，客户端查询 `cli-v*`（需修改 R10 skill 及本需求中的 tag 前缀）
2. 将编译产物资产上传至 `galeharness-cli-v*` release（与客户端查询一致，但产物从根源码构建）
3. 修改根包 `package-name` 为 `galeharness-cli`，使 tag 统一为 `galeharness-cli-v*`（推荐：品牌一致性最好，但需确认是否影响其他 release-please 行为）

### [P1] `COMPOUND_PLUGIN_GITHUB_SOURCE` 安全风险
**问题**：攻击者若控制进程环境变量，可将更新源指向任意恶意仓库。当前设计无白名单、域名限制或来源验证。
**候选方案**：
1. 保留当前设计，在文档中明确标注风险（推荐 for MVP）
2. 增加受信任仓库白名单（如仅限 `wangrenzhu-ola/*` 或 `github.com/wangrenzhu-ola/GaleHarnessCLI`）
3. 引入签名配置文件或 checksum 来源验证

### [P1] 二进制分发 vs git-based 更新的价值评估
**问题**：目标用户是开发者，当前安装路径本身就需要 `git clone`。为规避 `git pull` 而引入 CI 编译、GitHub Release 资产管理和回滚逻辑，边际收益可能无法证明其运营负担。
**候选方案**：
1. 继续二进制分发方案（本需求当前方向）
2. 将 `gale-harness update` 实现为 `git pull && bun install && bun link` 的包装命令（极简单，但依赖用户保留源码仓库）
3. 同时支持两种模式：优先尝试 git-based，回退到二进制（最复杂）

### [P2] Release CI 触发逻辑
**问题**：当前 `release-pr.yml` 仅运行 release-please 创建/维护 release PR，无编译或 artifact-upload 步骤。release-please 在 PR 合入后才异步创建 release，需要单独的触发工作流。
**候选方案**：
1. 新增 `release-published.yml` 工作流，监听 `release: published` 事件并执行编译上传（推荐）
2. 在现有 `release-pr.yml` 中增加条件 job，检测 release-please 合入后自动编译上传（时序复杂）

## Residual Concerns

以下风险已被识别但无单一明确修复方案：
- macOS Gatekeeper 可能对下载的编译二进制施加隔离标志（quarantine），需要用户手动批准或运行 `xattr -d com.apple.quarantine`
- `bun build --compile` 对动态导入或运行时文件解析的处理可能与当前 `bun link` 开发环境行为不一致，需充分测试
