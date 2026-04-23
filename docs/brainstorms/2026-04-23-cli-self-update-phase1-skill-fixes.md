---
date: 2026-04-23
topic: cli-self-update
---

# CLI 自更新 — Phase 1: Skill 修复（可立即发布）

## Problem Frame

`gh:update` skill 存在三处指向错误，导致用户无法通过该 skill 检查 GaleHarnessCLI 插件更新，且 skill 未告知用户 CLI 本身也有更新能力。

具体问题：
- **仓库指向错误**：skill 查询 `EveryInc/compound-engineering-plugin`，而非 `wangrenzhu-ola/GaleHarnessCLI`
- **Tag 过滤不匹配**：上游使用 `compound-engineering-v*`，当前仓库使用 `galeharness-cli-v*`
- **缓存路径使用旧名称**：路径仍为 `compound-engineering-plugin/compound-engineering/`
- **未提示 CLI 自更新**：skill 仅处理插件缓存，未告知用户可通过 `gale-harness update` 更新 CLI 本身

## Requirements

- **R1.** 修改 `plugins/galeharness-cli/skills/gh-update/SKILL.md`：
  - 将 `--repo EveryInc/compound-engineering-plugin` 改为 `--repo wangrenzhu-ola/GaleHarnessCLI`
  - 将 tag 过滤条件从 `startswith("compound-engineering-v")` 改为 `startswith("galeharness-cli-v")`
  - 将 tag 版本提取从 `sub("compound-engineering-v";"")` 改为 `sub("galeharness-cli-v";"")`
  - 将缓存路径从 `compound-engineering-plugin/compound-engineering/` 改为 `galeharness-cli/galeharness-cli/`（与 marketplace manifest 中的插件名称一致）
- **R2.** `gh:update` skill 在清理完插件缓存后，增加条件提示：仅当 `gale-harness update` 命令在 PATH 中可解析时，才追加提示 "CLI 本身也可通过 `gale-harness update` 更新。"

## Success Criteria

- SC1. `gh:update` skill 能正确查询 `wangrenzhu-ola/GaleHarnessCLI` 的 release 并比对缓存版本
- SC2. 缓存清理路径指向 `galeharness-cli/galeharness-cli/`
- SC3. 在 `gale-harness update` 命令不存在的环境中，skill 不输出无法执行的命令提示

## Dependencies

- R1-R2 可与 Phase 2（二进制发布基础设施）并行开发，但 R2 的条件提示逻辑必须在 Phase 2 交付后自动生效，无需再次修改 skill

## Key Files

- `plugins/galeharness-cli/skills/gh-update/SKILL.md`
