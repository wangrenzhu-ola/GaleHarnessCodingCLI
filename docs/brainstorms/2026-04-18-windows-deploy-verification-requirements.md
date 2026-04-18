---
name: windows-deploy-verification
type: requirements
created: 2026-04-18
---

## 问题陈述

Hermes Agent 在 Windows 环境（PowerShell / CMD）部署时存在系统性兼容性问题，导致安装、部署和健康检查流程静默失败或完全不可用。当前 CI 仅覆盖 Linux/macOS，缺乏 Windows 回归测试，bash 依赖脚本在 Windows 上无兼容层，且已修复的 colon 路径问题缺少自动化验证。本需求旨在建立 4 层 Windows 部署验证体系，确保 Windows 用户获得与 Unix 环境等价的第一方支持。

## 需求

### R1: Windows CI 回归测试（Layer 1）
在 GitHub Actions 中新增 `windows-latest` 作业，覆盖核心安装与部署路径。目标消耗控制在 GitHub Free Tier 2000 分钟/月以内，通过矩阵策略仅对关键路径（install、deploy、health-check）执行 smoke test，避免冗余构建。

### R2: 静态扫描器——bash 兼容性问题检测工具（Layer 2）
开发一个静态扫描工具，在 CI 或本地提交前自动检测代码库中的 bash 依赖（如 `install.sh`、`deploy.sh`、`check-health` 等脚本调用，以及 `subprocess` 中硬编码 `bash`/`sh` 的 Python 代码）。扫描器输出结构化报告，标注文件、行号、风险等级，并在 CI 中作为 required check 阻塞合入。

### R3: 模拟测试——path.win32 路径兼容性验证（Layer 3）
针对已修复的 colon 路径问题及其他 Windows 路径语义（如驱动器号、反斜杠、大小写不敏感），编写基于 `path.win32` 的模拟测试套件。测试需覆盖工具链中所有路径拼接、缓存目录解析、配置写入等场景，确保在 Unix CI 上即可模拟验证 Windows 路径行为。

### R4: Reviewer Agent 门禁——bash 依赖触发人工 Review（Layer 4）
当 CI 检测到新增或修改的 bash 脚本 / bash 调用时，自动在 PR 上添加 `windows-compat-review-required` 标签，并触发 Reviewer Agent 进行专项审查。审查关注点包括：是否提供了 PowerShell 等价实现、是否通过抽象层屏蔽 shell 差异、是否在文档中标注 Windows 支持状态。审查通过后移除标签，未通过审查的 PR 需要人工确认（建议延迟合入而非硬阻断）。Reviewer Agent 实现初期，仅标记风险 + 通知，暂不拦截合入。

## 成功标准

1. `windows-latest` CI 作业在 PR 阶段稳定运行，核心路径失败时阻断合入。
2. 静态扫描器在 5 秒内完成全库扫描，误报率低于 5%。
3. `path.win32` 模拟测试在 Linux CI 上通过，且覆盖所有已知 colon/反斜杠路径问题。
4. Reviewer Agent 门禁对 bash 变更的标记率达到 100%，平均 review 响应时间低于 10 分钟。
5. Windows 新用户执行安装流程时，uv 不在 PATH 和 bash 脚本失效的问题不再出现。

## 范围边界

### In Scope
- GitHub Actions `windows-latest` CI 配置与作业优化。
- bash 兼容静态扫描器的开发与集成。
- `path.win32` 模拟测试套件的设计与实现。
- Reviewer Agent 门禁规则、标签策略与审查清单。
- 已知问题（uv PATH、bash 脚本失效、colon 路径）的自动化验证。

### Out of Scope
- 重写所有现有 bash 脚本为 PowerShell（本需求只要求检测与门禁，具体重写由后续任务承接）。
- 非 Windows 平台的 CI 性能优化。
- 通用跨平台抽象库的设计（如引入 `click`/`plumbum` 等框架）。
- 第三方工具（如 uv 本身）在 Windows 上的原生适配问题。

## 已知约束

- CI 预算：GitHub Free Tier 2000 分钟/月，`windows-latest` 计费倍率为 Linux 的 2 倍，需严格控制作业时长与触发频率。
- 扫描器不得引入重量级 NLP 模型，应基于 AST/正则/字符串匹配保持轻量。
- `path.win32` 测试必须在现有 Linux CI 上可运行，不能依赖真实 Windows 环境。
- Reviewer Agent 门禁需与现有分支保护规则兼容，避免与 required status checks 冲突。
- colon 路径修复已在主干落地，但缺少测试覆盖，R3 需回溯补充验证。
