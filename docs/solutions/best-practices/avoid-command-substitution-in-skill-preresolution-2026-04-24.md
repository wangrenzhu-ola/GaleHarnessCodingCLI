---
title: Avoid command substitution in skill pre-resolution commands
date: 2026-04-24
category: best-practices
module: galeharness-cli-skills
problem_type: best_practice
component: tooling
severity: high
applies_when:
  - Reviewing or authoring SKILL.md files that use !`...` pre-resolution commands
  - Adapting upstream skill changes into GaleHarnessCLI
  - Writing platform-portable Claude Code marketplace skills
tags: [skills, pre-resolution, claude-code, portability, review]
---

# Avoid command substitution in skill pre-resolution commands

## Context

PR #56 的最终复核里，`gh:update` 的行为方向是对的：它从 `main` 上的 `plugin.json` 比较 marketplace 当前加载版本，避免用 release tag 造成误报。但实现把几个路径和版本解析写进了 `!` 预解析命令，并在这些命令里使用了 `$(...)`。

这类问题很容易被普通测试漏掉。Bun 测试可以在本机 shell 里成功执行同一段命令，但 skill 的 `!` 预解析发生在平台加载 skill 的阶段，权限检查和解析规则更严格。仓库自己的 `plugins/galeharness-cli/AGENTS.md` 已经明确规定：`!` 预解析命令可以用简单链式和错误抑制，但不能使用 command substitution 或嵌套反引号。

## Guidance

在 `SKILL.md` 的 `!` 预解析块里，只放简单、可直接执行的探测命令。不要用 `$(...)`、嵌套反引号，或复杂的路径计算。

有两种更稳的写法：

1. 直接让命令输出最终值，失败时输出 sentinel。
2. 把复杂推导移到运行期自然语言步骤，让 agent 用读文件、路径判断或普通 shell 命令完成。

例如，避免这种写法：

```markdown
!`version=$(gh api repos/wangrenzhu-ola/GaleHarnessCLI/contents/plugins/galeharness-cli/.claude-plugin/plugin.json --jq '.content | @base64d | fromjson | .version' 2>/dev/null) && [ -n "$version" ] && echo "$version" || echo '__CE_UPDATE_VERSION_FAILED__'`
```

改成直接输出：

```markdown
!`gh api repos/wangrenzhu-ola/GaleHarnessCLI/contents/plugins/galeharness-cli/.claude-plugin/plugin.json --jq '.content | @base64d | fromjson | .version' 2>/dev/null || echo '__CE_UPDATE_VERSION_FAILED__'`
```

路径剥离也不要写成：

```markdown
!`basename "$(dirname "$(dirname "${CLAUDE_SKILL_DIR}")")"`
```

优先改成运行期说明：

```markdown
Read the resolved skill directory value. For marketplace cache paths shaped like
`~/.claude/plugins/cache/<marketplace>/galeharness-cli/<version>/skills/gh-update`,
derive `<version>` as the path segment two levels above `skills/gh-update`.
```

如果必须预解析，可以用 shell 参数展开这类简单形式，但要保持可读，并确认没有 `$(...)`：

```markdown
!`p="${CLAUDE_SKILL_DIR%/skills/gh-update}"; case "$p" in */plugins/cache/*/galeharness-cli/*) echo "${p##*/}" ;; *) echo '__CE_UPDATE_NOT_MARKETPLACE__' ;; esac`
```

## Why This Matters

`!` 预解析命令不是普通运行期 shell 脚本。它们在 skill load 阶段执行，一旦被平台权限检查拒绝，用户看到的不是业务逻辑里的可恢复错误，而是 skill 加载或上下文注入失败。对于 `gh:update` 这种专门帮助用户修复 stale plugin 的 skill，加载期失败会直接让修复入口不可用。

这也是 review 时需要额外看的一类问题：测试证明的是命令语义，不一定证明 skill 平台能接受这段预解析语法。

## When to Apply

- 审查 `SKILL.md` 里新增或修改的 `!` 预解析块。
- 把上游 skill 内容适配到 GaleHarnessCLI 时。
- 看到 `${CLAUDE_SKILL_DIR}`、`${CLAUDE_PLUGIN_ROOT}`、`gh api`、`basename`、`dirname`、`jq` 等出现在预解析命令附近时。
- 修复 marketplace cache、插件版本检查、平台探测这类加载期逻辑时。

## Examples

Review checklist:

```bash
rg -n '!`.*\\$\\(|!`.*`' plugins/galeharness-cli/skills plugins/galeharness-cli/agents
```

如果命中，逐条判断：

- 是否真的需要预解析？
- 是否可以改成直接命令输出？
- 是否可以把复杂逻辑移到运行期说明？
- 是否有 sentinel 输出让后续决策逻辑可恢复？

PR #56 里的阻塞例子：

- `plugins/galeharness-cli/skills/gh-update/SKILL.md:45`：版本获取先赋值再 echo，应该改成直接 `gh api ... --jq ... || sentinel`。
- `plugins/galeharness-cli/skills/gh-update/SKILL.md:48`：当前版本通过嵌套 `dirname`/`basename` 推导，应该改成运行期路径段推导或不含 command substitution 的参数展开。
- `plugins/galeharness-cli/skills/gh-update/SKILL.md:51`：marketplace 名称同样有嵌套 command substitution。

## Related

- `plugins/galeharness-cli/AGENTS.md` 的 “Pre-resolution exception” 规则是主约束。
- `docs/solutions/best-practices/prefer-python-over-bash-for-pipeline-scripts-2026-04-09.md` 记录了 pipeline 脚本中避免复杂 shell 的相邻经验；本条更窄，专门约束 skill load 阶段的 `!` 预解析命令。
