---
date: 2026-04-25
topic: install-upgrade-ci
title: "安装与升级 CI 闭环：README 一键入口、PR smoke、release binary 验证"
category: brainstorms
---

# 安装与升级 CI 闭环：README 一键入口、PR smoke、release binary 验证

## Problem Frame

GaleHarnessCLI 已经有 release binary 构建、Unix release 安装脚本、source setup 脚本和 `gale-harness update`，但普通用户入口和 CI 验证还没有形成闭环。

当前 README 的安装说明在文档中后段，新同事打开首页时看不到可复制的一键安装命令，容易去找源码安装或 `bun link` 路径。CI 目前主要验证 `bun test`、release metadata 和 Windows `setup.ps1` source-mode，没有在每个 PR 中验证“当前代码能否被打包成 release archive、安装脚本能否从该 archive 安装、安装后的 binary 能否启动”。release asset workflow 也只 build/upload，缺少上传前的 archive 结构和当前平台可执行 smoke。

本次需求的重点不是重新设计发布系统，而是在现有能力前面补最小可靠门禁：README 第一屏给新手安装入口；PR CI 用本地构建产物做安装/升级 smoke，避免依赖真实 GitHub Release 网络；release workflow 在上传前验证每个平台产物；升级路径至少证明现有安装不会被 install/update 相关路径破坏。

## Actors

- A1. 新手使用者：第一次安装 GaleHarnessCLI，希望从 README 第一屏复制一条命令完成安装。
- A2. 已安装用户：本机可能已有 release binary 或旧 source-mode / `bun link` 安装，希望升级或迁移时不被破坏。
- A3. 维护者：修改安装脚本、update 命令、release 构建或 README 后，希望 PR 阶段尽早发现安装损坏。
- A4. CI/CD：在 GitHub Actions 上验证当前代码的安装、升级和 release binary 可用性。

## Goals

- G1. README 首页第一屏提供面向新手的、可复制的一键安装命令，并把源码 setup 明确放到贡献者路径。
- G2. 每个 PR 至少在 Linux 上验证当前代码能构建 release archive、通过安装脚本安装到临时目录，并运行基础 binary smoke。
- G3. release workflow 在上传 asset 前验证每个平台 archive 内容符合平台命名和文件集合要求。
- G4. 安装/升级 smoke 覆盖旧安装存在时不会被破坏：现有 symlink/source-mode 入口应能被 release install 迁移，已有 binary 安装应能被覆盖安装或 update path 安全处理。
- G5. Windows/macOS/Linux 都纳入设计；MVP 若不能全量执行所有 OS 的完整端到端 smoke，要明确阶段边界。

## Non-Goals

- NG1. 不引入 Homebrew、Scoop、Winget、npm registry、代码签名或自动安装包分发。
- NG2. 不让 PR CI 依赖真实 GitHub Release 下载链路；网络发布链路可在 release/post-release 阶段补充。
- NG3. 不重写 `gale-harness update` 的核心下载、备份和 rollback 算法。
- NG4. 不把 HKTMemory API 服务可用性作为安装 smoke 的成功条件；CI 可以验证 CLI 入口和文件模式诊断。
- NG5. 不在本阶段实现完整离线安装。

## Requirements

### README 安装入口

- R1. README 第一屏必须出现“新手一键安装”入口，位置在目录和长篇理念之前。
- R2. macOS/Linux 默认命令使用 release binary 安装脚本。Windows 只有在 release binary PowerShell installer 实现后才能进入第一屏的一键安装；否则第一屏只标注“Windows release binary installer 待补齐，见详细安装章节”，不能把 source-mode `setup.ps1` / `bootstrap.ps1` 当作普通用户一键安装命令。
- R3. README 第一屏安装块必须少废话、可复制，并包含安装后最小自检命令：`gale-harness --version`。`gale-harness update --check` 可以作为升级检查命令出现在详细安装/升级章节，但不能作为 PR 必跑的安装成功判据。
- R4. 现有源码安装 / `setup.sh` / `setup.ps1` 说明保留，但定位为“贡献者开发环境”，不能与普通用户默认安装入口竞争。

### PR CI smoke

- R5. 每个 PR 必须构建当前平台 release archive，使用本地 archive 或 mock release asset 验证安装脚本，不依赖真实 GitHub Release。
- R6. PR smoke 必须使用临时 `INSTALL_DIR`、临时 HOME/PATH，不能写入 runner 的真实用户安装目录。
- R7. PR smoke 必须验证安装后这些 binary 至少存在且可执行：`gale-harness`、`compound-plugin`、`gale-knowledge`、`gale-memory`。
- R8. PR smoke 必须运行基础命令：`gale-harness --help` 或 `--version`、`compound-plugin --help` 或 `--version`、`gale-knowledge --help`、`gale-memory --help`。
- R9. PR smoke 必须覆盖旧安装迁移场景：安装目录中已有 symlink/source-mode 风格入口时，release installer 能替换为普通 binary，且不会留下坏链接。
- R10. PR smoke 必须覆盖“已有安装升级/覆盖”场景：安装目录中已有旧版本 binary 和 `VERSION` 时，安装当前 archive 后 `VERSION` 和可执行文件状态正确。

### Release binary verification

- R11. release asset workflow 必须在上传前验证每个平台 archive 包含四个 CLI binary 和 `VERSION`。
- R12. Windows archive 必须验证 `.exe` 文件名；Unix archive 必须验证无 `.exe` 文件名。
- R13. release workflow 的 MVP 必须对所有 matrix archive 做结构验证；运行时 smoke 应在对应 OS/arch runner 上执行，或作为后续增强明确延期。不能用 macOS runner 上的交叉构建产物替代 Linux/Windows 正式 asset 的运行验证。
- R14. 如果 build matrix 生成跨平台 asset，平台列表和文件名规则必须复用 `src/utils/release-platforms.ts`，避免 workflow、脚本、测试各自复制映射。
- R14a. release workflow 必须显式处理发布信任边界：PR workflow 不得拥有发布凭据；release asset 上传只允许 trusted release/tag/protected branch 触发；`workflow_run` 路径必须校验成功结论、同仓库来源和目标 commit/tag。
- R14b. 发布后 latest release asset 的可见窗口必须被识别：MVP 至少在风险中记录 “release published 但 assets 尚未上传” 的用户 404 风险；后续可改为 draft release 上传完成后再 publish，或增加 post-release 安装验证。

### Upgrade / update path

- R15. `gale-harness update` 的 source-mode/dev-mode 提示必须与 README 一致：说明 update 只支持 release binary，并给出迁移安装命令。
- R16. CI 中的升级 smoke 优先用本地 archive 验证安装脚本的覆盖/迁移行为；真实 GitHub API `update --check` 不应作为 PR 必跑门禁。
- R17. 如果要测试 `update` 下载/替换路径，应通过 mock/local asset 或可注入源完成，不能让 PR 因 GitHub Release 网络波动失败。

### Cross-platform boundary

- R18. MVP 必须覆盖 Linux PR smoke，因为现有 CI 主 job 在 Ubuntu。
- R19. Windows MVP 至少保留并标注 `setup.ps1` source-mode CI；若本阶段新增 PowerShell release installer，则 Windows PR smoke 应安装本地 Windows archive 并运行 `.exe` 基础命令。
- R20. macOS smoke 可作为 release binary 运行性增强项接入 `macos-latest`；若成本过高，MVP 可先用 Linux PR smoke + release workflow archive 验证，并把 macOS 运行 smoke列为后续。

## Acceptance Examples

- AE1. Given 新同事打开 README，when 第一屏加载完成，then 他无需滚动到长目录后面即可看到已支持平台的一键 release 安装命令和 `gale-harness --version` 自检；如果 Windows release installer 尚未实现，第一屏只显示边界说明，不显示 source-mode 命令。
- AE2. Given PR 修改 `scripts/install-release.sh`，when CI 运行，then CI 构建当前平台 archive，设置临时 `INSTALL_DIR`，运行安装脚本，并验证四个 binary 能启动。
- AE3. Given PR 修改 `scripts/release/build.ts` 或 `src/utils/release-platforms.ts`，when CI 运行，then release archive verifier 验证 Linux 和 Windows 文件名集合，缺失 `gale-memory` 或 `.exe` 命名错误会失败。
- AE4. Given 临时安装目录中已有旧 `gale-harness` symlink，when release installer 安装本地 archive，then `gale-harness` 不再是 symlink，`gale-harness --version` 或 `--help` 可运行。
- AE5. Given release workflow 构建 `windows-x64` asset，when 上传前验证运行，then archive 中必须包含 `gale-harness.exe`、`compound-plugin.exe`、`gale-knowledge.exe`、`gale-memory.exe` 和 `VERSION`。

## Success Criteria

- README 第一屏能回答“我该怎么安装”，源码安装不再误导新手。
- PR CI 能在不访问真实 GitHub Release 的情况下发现安装脚本、release archive、binary 启动和旧安装迁移的常见破坏。
- release workflow 上传前能拦截缺文件、平台命名错误和空 `VERSION`。
- `gale-harness update` 的边界和 README 安装承诺一致，source-mode 用户获得可执行迁移路径。
- MVP 保持小而落地：优先 Linux PR smoke + release archive verifier + README 第一屏；Windows/macOS 运行 smoke 按现有脚本成熟度分阶段接入。

## Key Decisions

- PR CI 使用本地 archive/mock asset，不依赖 GitHub Release 网络。这直接降低 flaky 风险，也能验证当前 PR 代码。
- release workflow 做上传前验证，不等用户下载后才发现 asset 不可用。
- README 第一屏以普通用户为先，贡献者路径后置。
- 安装 smoke 验证“能运行”和“不会破坏旧安装”，不把完整 HKTMemory 服务或真实 update 网络链路纳入 MVP。

## Dependencies / Assumptions

- `scripts/release/build.ts` 已能构建 release archive。
- `src/utils/release-platforms.ts` 是平台和 binary 文件名的权威来源。
- `scripts/install-release.sh` 当前支持 `INSTALL_DIR`，可扩展为支持本地 archive override。
- Windows 若需要普通用户 release binary 一键安装，可能需要新增 PowerShell installer；现有 `setup.ps1` 是 source-mode/贡献者路径。

## Deferred to Planning

- PR CI smoke 是直接写在 `.github/workflows/ci.yml`，还是抽成 `scripts/release/smoke-install.ts` / shell 脚本后由 workflow 调用。
- Windows release installer 是否进入 MVP，还是先把 Windows 边界写清并在后续实现。
- `update` 下载路径是否需要新增可测试注入点，还是本阶段只验证 dev/source-mode 文案和 install 覆盖升级。
