---
title: "feat: 安装与升级 CI 闭环实施计划"
type: feat
status: active
date: 2026-04-25
origin: docs/brainstorms/2026-04-25-install-upgrade-ci-requirements.md
---

# feat: 安装与升级 CI 闭环实施计划

## Overview

本计划为 GaleHarnessCLI 补齐安装/升级检测闭环：README 第一屏给新手一键安装入口；PR CI 使用当前代码构建出的本地 release archive 做安装 smoke，避免依赖真实 GitHub Release；release asset workflow 在上传前验证 archive 内容，运行时 smoke 按平台能力分阶段接入；`update` 的 source-mode 提示与 release binary 安装承诺对齐。

MVP 控制在可落地范围：P0a 先覆盖 README 第一屏 macOS/Linux release 安装入口、release archive verifier、Linux PR smoke 和 Unix installer 本地 archive 安装；P0b/P1 再做 `update` source-mode 迁移文案；P1a 把 verifier 接入 release asset workflow 上传前结构验证；P1b 补 release workflow trust gating 和 post-release 可见性门禁定义；P2a 才做 Windows release installer；P2b 做对应 OS/arch runtime smoke。Windows/macOS 运行 smoke 若超出本 PR，必须明确延期，且 README 不能虚假承诺。

## Problem Frame

需求文档 `docs/brainstorms/2026-04-25-install-upgrade-ci-requirements.md` 指出：仓库已有 `.github/workflows/release-assets.yml`、`scripts/install-release.sh`、`scripts/setup.sh`、`scripts/setup.ps1`、`src/utils/update.ts` 和相关测试，但这些能力没有形成“新手入口 -> PR 安装验证 -> release asset 验证 -> 升级边界”的闭环。

当前 `.github/workflows/ci.yml` 在 Ubuntu 跑 `bun test` 和 release metadata，在 Windows 跑 `setup.ps1` CI mode 和部分测试；没有验证当前 PR 能否构建 release archive 并通过 release installer 安装。`.github/workflows/release-assets.yml` 只 build/upload 多平台 tar.gz；没有上传前结构校验和可执行 smoke。README 已有安装章节，但在文档中段之后，不满足“第一屏可复制”的 DevEx 目标。

## Requirements Trace

- R1-R4: README 第一屏安装入口和贡献者路径后置。
- R5-R10: PR CI 本地 archive 安装 smoke、临时目录、四个 binary、旧 symlink 迁移、已有安装覆盖。
- R11-R14b: release workflow 上传前 archive verifier、Windows `.exe` 命名、runtime smoke 阶段边界、复用 `src/utils/release-platforms.ts`、release trust gating、published-before-assets 404 风险记录。
- R15-R17: update source-mode 文案与 README 一致，PR 不依赖真实 GitHub Release 网络。
- R18-R20: MVP 至少覆盖 Linux；Windows/macOS 阶段边界必须显式。

## Existing Context Checked

- `.github/workflows/ci.yml`: Ubuntu job 跑 `bun install`、`bun run release:validate`、`bun test`；Windows job 跑 `setup.ps1` CI mode 和裁剪后的 tests。没有 release installer smoke。
- `.github/workflows/release-assets.yml`: release/workflow_dispatch/workflow_run 触发，matrix 构建 `darwin-*`、`linux-*`、`windows-*`，执行 `bun run build:release --version ... --platform ...` 后直接上传。
- `scripts/release/build.ts`: 已生成四个 binary 和 `VERSION`，archive 命名为 `galeharness-cli-{version}-{platform}.tar.gz`。
- `src/utils/release-platforms.ts`: 已集中定义 `RELEASE_PLATFORMS`、`RELEASE_BINARY_BASENAMES`、`.exe` 规则和 Bun target，是 verifier 和 CI 的权威映射。
- `scripts/install-release.sh`: 已支持 `INSTALL_DIR`，可下载 GitHub Release asset，安装四个 binary 和 `VERSION`，会移除目标 symlink；但还不支持本地 archive override，PR CI 不能用当前构建产物验证。
- `scripts/setup.sh` / `scripts/setup.ps1`: `setup.ps1` 已有 `GHALE_CI=1`；`setup.sh` 是贡献者/source setup，仍可能有交互和真实 HOME/PATH 写入，不应成为普通用户第一屏入口。
- `src/utils/update.ts` 和 `src/commands/update.ts`: 已区分 compiled binary 与 dev mode；`performUpdate()` dev-mode 提示偏“Build a compiled binary first”，需要改成普通用户迁移指引。
- `tests/update-command.test.ts`、`tests/skills/gh-update.test.ts`: 已覆盖 update 逻辑和 gh-update skill 部分行为，可扩展文案/边界断言。
- 主 checkout 脏分支只读参考到一个方向：`verify-archive.ts`、installer 本地 archive override、安装脚本测试和 Windows installer 草案是可行思路，但实现阶段必须重新审查后小步落地，不能直接复制未审查改动。

## Recommended MVP

### P0a. First PR slice

1. 新增 release archive verifier，复用 `src/utils/release-platforms.ts`，验证 archive 的四个 binary、`VERSION`、平台文件名和安全解压规则。P0a 至少要能验证 `linux-x64` PR smoke 产物；Windows `.exe` 命名规则也应通过 fixture 测试覆盖，避免 P1 接入 release matrix 时才发现映射错误。
2. README 第一屏加入“新手一键安装”块：
   - macOS/Linux:
     ```bash
     curl -fsSL https://raw.githubusercontent.com/wangrenzhu-ola/GaleHarnessCodingCLI/main/scripts/install-release.sh | bash
     gale-harness --version
     ```
   - Windows 若无 `install-release.ps1`：第一屏只写“Windows release binary installer 待补齐，见详细安装章节”，不放 `bootstrap.ps1` / `setup.ps1` source-mode 命令。若本 PR 实现 PowerShell release installer，才放 `irm .../scripts/install-release.ps1 | iex`。
3. 扩展 `scripts/install-release.sh` 支持 CI-gated 本地 archive override，用于 PR CI。该模式必须跳过 GitHub API/tag 解析/download，只安装指定本地 archive。
4. 在 `.github/workflows/ci.yml` Ubuntu job 增加 release install smoke：
   - `bun run build:release --version 0.0.0-ci --platform linux-x64`
   - verifier 检查 archive
   - 临时 `INSTALL_DIR` 和临时 `HOME` 执行 installer 安装本地 archive，并把临时安装目录 prepend 到 `PATH`
   - 运行四个 binary 的 `--help` / `--version`
   - 构造 symlink/旧 VERSION 再安装，验证迁移/覆盖。

### P0b / P1. Update migration copy slice

5. 更新 `src/utils/update.ts` dev/source-mode 文案和 `tests/update-command.test.ts` 断言，让用户知道需要迁移到 release binary。该项重要但不应阻塞 P0a 的安装 CI 闭环；如果实现时改动很小，可以并入同一 PR，否则作为紧随其后的 P0b/P1。

### P1a. Release archive workflow slice

6. 在 `.github/workflows/release-assets.yml` 上传前对 matrix archive 执行 P0a verifier。此切片只做 archive 质量门禁，不同时扩大到发布权限模型。

### P1b. Release trust and public-visibility slice

7. 收紧 release workflow trust gating：发布权限、`workflow_run`、`workflow_dispatch`、tag/ref 绑定和 upload job 条件作为独立门禁处理。
8. 增加 README 安装入口防漂移测试或 lint：第一屏必须包含 release install 和 `gale-harness --version`，详细安装章节必须包含 tag-pinned/raw trust 说明，第一屏不能出现 `setup.sh`、`setup.ps1`、`bootstrap.ps1` source-mode 命令。
9. 增加 post-release public installer smoke 的后续门禁定义：release assets 上传完成后用短 retry/backoff 验证 latest asset 可下载且 public installer 不遇到 asset 404。若本 PR 不实现，必须保留为明确 P1/P2 follow-up，而不是只写风险。

### P2a. Windows installer slice

10. 新增 Windows release installer 后，README 第一屏才能加入 Windows PowerShell 一键命令；Windows CI 安装本地 `windows-x64` archive 并运行 `.exe` smoke。

### P2b. Cross-platform runtime smoke slice

11. 对 macOS/Linux/Windows 正式 release asset 的 runtime smoke，优先用对应 OS runner 构建并运行；若继续单 runner 交叉构建，则需把 artifact 传递到对应 OS runner 做 smoke。

## Implementation Units

### U1. Release archive verifier

**Goal:** 建立上传前和 PR smoke 共用的 archive 结构验证。

**Files:**
- Create: `scripts/release/verify-archive.ts`
- Modify: `package.json`
- Test: `tests/release-archive.test.ts`

**Approach:**
- 导出 `verifyReleaseArchive({ archivePath, platform })`，CLI 支持 `--archive` 和 `--platform`。
- 复用 `getReleaseBinaryFileNames()` 和 `getReleasePlatformConfig()`。
- 安全解压到 OS temp：解压前或解压过程中枚举 tar entries，拒绝绝对路径、`..`、symlink、hardlink、设备文件、重复条目和未知顶层文件；只接受预期普通文件。
- 检查四个 binary 和 `VERSION`，校验 `VERSION` 非空。
- 不在 verifier 中运行 binary；运行 smoke 由 CI 当前平台负责。

**Test Scenarios:**
- `linux-x64` archive 包含四个无 `.exe` binary 和 `VERSION` 时通过。
- `windows-x64` archive 包含四个 `.exe` 和 `VERSION` 时通过。
- 缺 `gale-memory`、空 `VERSION`、不支持的平台时失败且错误信息可定位。
- 恶意 archive 包含 path traversal、symlink binary、重复 entry 或未知顶层文件时失败。

### U2. Unix installer 本地 archive smoke 能力

**Goal:** 让 `scripts/install-release.sh` 可安装当前 PR 构建出的本地 archive。

**Files:**
- Modify: `scripts/install-release.sh`
- Test: `tests/install-release-sh.test.ts`

**Approach:**
- 保留现有 GitHub Release 下载路径。
- 增加 CI-gated 本地 archive override，例如 `GALE_RELEASE_ARCHIVE=/tmp/archive.tar.gz`，但只有 `CI=1` 或显式 `GALE_INSTALL_ALLOW_LOCAL_ARCHIVE=1` 时启用；日志必须打印 archive source。
- 本地 archive 模式控制流必须先校验文件存在，然后跳过 `resolve_tag`、tag prefix 校验、GitHub API 和 `curl` 下载；version 从解压后的 `VERSION` 读取或仅用于日志。
- 平台默认自动检测。若确需平台 override，仅作为未文档化 CI-only 变量，并校验与当前 OS/arch 或测试 fixture 兼容，不能作为普通用户配置面。
- CI 在调用 installer 前运行 TS verifier；Bash installer 不能依赖用户机器已有 Bun/TypeScript 工具链。
- Installer 自身做 bash-native 最小防护：解压到 temp、只复制预期文件名、拒绝从解压目录复制 symlink 或非 regular file、复制后固定权限、失败时不能输出 “Installed to”。
- 对目标 symlink 先删除再安装普通文件；普通文件覆盖安装。
- 从解压目录复制时再次检查源是 regular file，固定权限写入目标，避免把 symlink 当 binary 安装。

**Test Scenarios:**
- 临时 `INSTALL_DIR` 安装本地 archive 后四个 binary 和 `VERSION` 存在。
- 旧 `gale-harness` symlink 被替换为普通文件。
- 旧 `VERSION` 被新 archive 覆盖。
- archive 缺文件或平台 override 不支持时失败。
- 本地 archive 模式不访问 GitHub API、不生成 release URL、不调用 `curl` 下载。
- `tests/install-release-sh.test.ts` 在 `process.platform === "win32"` 时 skip；Windows release installer 用独立 PowerShell 测试覆盖。

### U3. PR CI release install smoke

**Goal:** 每个 PR 尽早发现当前代码无法打包、安装或启动。

**Files:**
- Modify: `.github/workflows/ci.yml`

**Approach:**
- 在 Ubuntu `test` job 现有 `bun test` 之后或之前增加一个独立步骤，构建 `linux-x64` CI archive。
- 执行 `bun run scripts/release/verify-archive.ts --archive ... --platform linux-x64`。
- 用 `mktemp -d` 创建安装目录和临时 HOME，设置 `CI=1`、`GALE_RELEASE_ARCHIVE`、`INSTALL_DIR`、`HOME` 运行 `scripts/install-release.sh`；除非测试必须，不设置平台 override。
- 将临时安装目录 prepend 到 PATH，使用同一个临时 `HOME` 运行：
  - `gale-harness --version` 或 `gale-harness --help`
  - `compound-plugin --help`
  - `gale-knowledge --help`
  - `gale-memory --help`
- 同一 job 增加小型迁移 smoke：先创建旧 symlink/旧 `VERSION`，再安装同一 archive，验证不再是 symlink 且 `VERSION` 更新。
- 明确断言 smoke 没有使用 `$HOME/.local/bin` 或 runner 真实用户安装目录。

**Test Scenarios:**
- GitHub Release 不可用时 PR smoke 仍能通过，因为只使用本地 archive。
- install script 改坏目标文件名、权限、symlink 替换或 VERSION 时 CI 失败。

### U4. Release asset workflow 上传前验证与 trust gating

**Goal:** release 包上传前确认每个平台 asset 结构正确，并收紧 release asset 上传的信任边界。

**Files:**
- Modify: `.github/workflows/release-assets.yml`

**Approach:**
- `Build release binaries` 后立即运行 verifier。
- 对 matrix 平台都做 archive 结构验证。
- MVP 不把 macOS runtime smoke 作为必做；所有平台先做结构验证。
- runtime smoke 必须在对应 OS/arch runner 上执行，或作为 U8 后续：Linux asset 用 `ubuntu-latest` 构建/运行，macOS asset 用 `macos-latest`，Windows asset 用 `windows-latest`，或将单 runner 交叉构建产物传递到对应 OS runner 再运行。
- 收紧触发和权限：workflow 顶层默认 `permissions: contents: read`；build job 只用读权限；upload job 单独使用 `contents: write` 并依赖 trust gate 输出；`workflow_run` 路径必须校验指定 workflow 名称、`conclusion == success`、`head_repository.full_name == github.repository`、head sha 匹配目标 release commit/tag；`workflow_dispatch` 必须校验 tag prefix，且 release target 属于当前仓库默认分支或受保护 ref；release/tag 来源必须和要上传 asset 的版本/tag 可验证绑定；非 trusted 分支/tag 的 `workflow_run` 必须跳过 upload job，而不是只在脚本中失败。PR workflow 不授予发布凭据。
- 记录发布可见窗口风险：当前 release 已 published 后再上传 assets，用户可能短暂遇到 404。MVP 不重构 release-please 时序；后续应评估 draft release 上传完成后 publish，或增加 post-release installer 验证。

**Test Scenarios:**
- matrix 中任一平台 archive 缺文件时该 matrix job 失败，不上传坏 asset。
- Windows archive 使用非 `.exe` 文件名时 verifier 失败。
- 非 trusted `workflow_run` 不会获得上传权限或执行 upload。
- `workflow_run` 来自 fork、错误 workflow 名称、失败 conclusion、非目标 sha/tag 时，upload job 被 GitHub Actions 条件跳过。

### U5. update source-mode 迁移提示

**Goal:** 让 update 边界对新手可执行，而不是只给开发者编译提示。

**Files:**
- Modify: `src/utils/update.ts`
- Test: `tests/update-command.test.ts`

**Approach:**
- 保持 `isCompiledBinary()` 的硬边界。
- 修改 `performUpdate()` 非 compiled binary 分支文案：
  - 说明当前是 source/development install。
  - 说明 `gale-harness update` 只支持 release binary。
  - 给出 macOS/Linux release install 命令。
  - 如果 U7 实现 Windows installer，则给出 PowerShell 命令；否则指向 README Windows 安装边界。
- `gale-harness update --check` 不作为 README 第一屏安装成功的必需自检。若要把它纳入 CI，先给 release metadata 源增加 mock/local fixture 注入点，再跑 release-binary 路径测试；真实 GitHub API 不进 PR 必跑门禁。
- 更新 CLI integration test 对文案的断言，避免只匹配 “development mode”。

**Test Scenarios:**
- `bun run src/index.ts update` 非 0 退出，输出包含 release binary、install-release 和迁移建议。
- `update --check --rollback` 冲突行为保持不变。

### U6. README 第一屏安装入口

**Goal:** 新同事打开 README 即可复制安装命令。

**Files:**
- Modify: `README.md`

**Approach:**
- 在标题和一句产品说明后、目录前新增“快速安装”短块。
- 块内只放普通用户安装和自检；避免把工作流理念、架构和贡献者 setup 放在前面。
- 现有“安装方式”章节保留，但调整为详细说明：release binary 是普通用户推荐；source setup 是贡献者路径。
- Windows 文案必须与实现一致：没有 release installer 就在第一屏写清楚边界并链接详细章节，不能放 `bootstrap.ps1` / `setup.ps1` source-mode 命令；实现了 U7 才放 PowerShell release installer 为默认。
- 一键命令使用 `raw.githubusercontent.com/main` 属于信任 GitHub raw 的便利入口。README 详细安装章节应说明团队/生产安装可改用 tag 固定脚本或 release asset 校验；checksum/signature 是后续 release hardening，不阻塞本 MVP。
- 增加 README 文本测试或 lint 防漂移：第一屏必须包含 release installer 命令和 `gale-harness --version`；第一屏不得包含 `setup.sh`、`setup.ps1`、`bootstrap.ps1`；详细安装章节必须保留 GitHub raw 信任边界和 tag-pinned 备选说明。

**Acceptance:**
- README 第一屏能看到安装命令，不需要滚动到目录后。
- 复制的 macOS/Linux 命令与 `scripts/install-release.sh` 实际入口一致。
- README 防漂移测试能阻止 source-mode 命令重新进入普通用户第一屏。

### U7. Windows release installer（MVP+，可延期但需标注）

**Goal:** 让 Windows 普通用户也有 release binary 一键安装，而不只依赖 source-mode `setup.ps1`。

**Files:**
- Create: `scripts/install-release.ps1`
- Test: `tests/install-release-ps1.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

**Approach:**
- PowerShell 原生下载/解压 `windows-x64` 或 `windows-arm64` archive，安装四个 `.exe` 和 `VERSION`。
- 支持本地 archive override 和临时安装目录，供 Windows CI 使用。
- 复用 `setup.ps1` 的 CI mode、PATH 和 PowerShell 5.1 兼容经验。
- 不依赖 Git Bash/WSL；优先使用 Windows 自带 `tar.exe`，缺失时清晰失败。

**Phase Boundary:**
- 若本 PR 不实现 U7，README 第一屏不能声称 Windows release binary 一键安装已可用，也不能放 source-mode 命令；只给边界说明和详细章节链接，把 U7 作为后续。

### U8. 对应 OS/arch runtime smoke（后续增强）

**Goal:** 证明正式 release workflow 产出的各平台 binary 不只是结构正确，而是在对应 OS 上可启动。

**Files:**
- Modify: `.github/workflows/release-assets.yml`

**Approach:**
- Linux asset 在 `ubuntu-latest` 构建并运行 smoke，Windows asset 在 `windows-latest` 运行 `.exe --help`，macOS asset 在 `macos-latest` 运行 smoke。
- 如果保留单 runner 交叉构建，则把 archive 上传为 workflow artifact，再由对应 OS runner 下载运行 smoke，通过后才 release upload。
- 该单元不属于 P0；如果 release workflow 当前成本敏感，可以先结构验证并记录 residual risk。

## CI Strategy

**Every PR should run:**
- Existing `bun run release:validate` and `bun test`.
- New Linux release install smoke in `.github/workflows/ci.yml`:
  - build local `linux-x64` archive;
  - verify archive;
  - install into temp `INSTALL_DIR` with temp `HOME` and temp PATH prepend;
  - run four CLI binaries with the same temp `HOME`;
  - verify symlink migration and existing install overwrite behavior.
- Existing Windows `setup.ps1` CI remains contributor/source-mode coverage.
- If U7 lands, Windows CI also installs local `windows-x64` archive with `install-release.ps1` and runs `.exe` help/version smoke.

**Release workflow should run:**
- For every matrix platform in `.github/workflows/release-assets.yml`: build archive, run verifier, only then upload.
- Trust gating before upload: trusted release/tag/protected branch only, same-repo successful workflow_run only, minimal permissions.
- Runtime smoke on corresponding OS/arch is P2 unless implemented with low workflow complexity in the same PR.
- Do not require downloading from the just-published GitHub Release in PR CI. Post-release public installer verification is a follow-up release hardening item.

**Local developer verification before PR:**
- `bun test`
- `bun run release:validate`
- `bun run build:release --version 0.0.0-ci --platform $(current platform)`
- `bun run scripts/release/verify-archive.ts --archive <archive> --platform <platform>`
- temp `INSTALL_DIR` install smoke via `scripts/install-release.sh`

## Risks

- **Bun compile cross-platform mismatch:** archive structure can be verified everywhere, but binary runtime can only be smoke-tested on compatible OS/arch. MVP mitigates PR risk with Linux smoke; release asset runtime smoke across OS/arch remains P2 unless implemented.
- **Installer test flakiness from network:** PR smoke uses local archive, not GitHub Release.
- **Windows gap:** existing Windows CI validates `setup.ps1` source-mode, not release binary install. If U7 is deferred, README must be honest and the risk remains visible.
- **README drift:** install commands must stay aligned with script names and update source-mode guidance; tests should assert key text where practical, but review discipline remains important.
- **Partial install on script failure:** installer should validate archive before copying and fail before success messaging; tests must cover missing files.
- **Installer trust boundary:** `curl | bash` / `irm | iex` is a convenience path that trusts GitHub raw. MVP should document this plainly; checksum/signature verification can be follow-up hardening.
- **Release published before assets uploaded:** existing release event timing can expose a short 404 window. MVP records the risk; later work should move toward draft-before-publish or post-release public installer verification.

## Document Review Decisions / Risks

- **Decision: promote verifier into P0a.** P0a PR smoke and local-archive installer safety both depend on archive validation, so the verifier cannot wait for P1. P1a now means "wire the P0a verifier into release-assets workflow," not "create verifier for the first time"; P1b separately handles release trust gating.
- **Decision: keep Windows release installer in P2 for this PR.** README first screen must remain honest: macOS/Linux get the release installer command; Windows gets an explicit release-installer gap until `install-release.ps1` exists and is covered by Windows CI.
- **Decision: do not put real `gale-harness update --check` in PR CI.** Current PR coverage should use local archive install/overwrite smoke. Mockable release metadata or post-release public installer verification can be added later without making PRs depend on GitHub Release network timing.
- **Decision: make README guidance testable.** README changes should include a lightweight text test/lint so the first screen remains a release-binary path and source-mode commands stay in the contributor path.
- **Risk: PR smoke must isolate HOME as well as INSTALL_DIR/PATH.** The implementation should use temp `HOME`, temp `INSTALL_DIR`, and temp PATH prepend so installer/update paths cannot mutate the runner user's real config or installation state.
- **Risk: release asset runtime smoke is not a P0/P1 promise.** P1 validates structure and upload trust boundaries for every matrix archive. Actual binary startup on macOS/Windows/Linux release assets remains P2 unless the implementation adds corresponding OS runners in the same change.
- **Risk: latest asset 404 remains until public installer smoke exists.** P1 should define or implement a post-release public installer check with short retry/backoff after assets upload; P0 may ship with this as a tracked follow-up.

## Open Questions

- Should P1 include a fixture for the latest public release archive to test installer backward compatibility, or should that remain a post-release/network verification job?
- Should `gale-harness update --check` get a mockable release metadata source in this PR, or stay as unit-tested logic plus release/post-release verification?

## Document Review Gate

Before `/gh:work`, run `document-review` on this plan and apply high-confidence fixes or record remaining items in `Open Questions`. Implementation should not start until the remaining issues are explicitly accepted.
