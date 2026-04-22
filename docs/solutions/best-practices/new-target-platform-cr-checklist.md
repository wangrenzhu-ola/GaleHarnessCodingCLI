---
title: 新增目标平台时的代码审查常见问题清单
date: 2026-04-22
category: best-practices
module: cli/targets
problem_type: best_practice
component: tooling
severity: medium
applies_when:
  - 在 GaleHarnessCLI 中新增 CLI 转换/安装/sync 目标平台
  - 为目标平台编写 converter、writer、sync 集成代码
  - 为目标平台添加完整测试覆盖
tags:
  - target-platform
  - converter
  - writer
  - sync
  - code-review
  - kilo
---

# 新增目标平台时的代码审查常见问题清单

## Context

在 PR #44 中为 GaleHarnessCLI 添加 Kilo Code 目标平台支持后，代码审查发现了 4 类常见问题。这些问题在新增其他目标平台时也容易重复出现。本文档将这些问题整理为检查清单，供后续添加新目标时参考。

## Guidance

### 1. 在 `src/targets/index.ts` 中注册目标时添加 `defaultScope`

所有已实现的目标都应在 `targets` 注册表中声明 `defaultScope`，即使该目标当前不主动使用 `--scope` 参数。`src/commands/convert.ts` 和 `src/commands/install.ts` 中的 `--also` 分支会调用 `handler.write(extraRoot, extraBundle, handler.defaultScope)`，如果 `defaultScope` 为 `undefined`，会导致不一致的行为。

**检查点：**
- [ ] 新目标在 `targets` 对象中是否包含 `defaultScope`？
- [ ] 取值是否为 `"global"` 或 `"workspace"`？

```typescript
// 正确示例
kilo: {
  name: "kilo",
  implemented: true,
  defaultScope: "workspace",
  convert: convertClaudeToKilo as TargetHandler["convert"],
  write: writeKiloBundle as TargetHandler["write"],
},
```

### 2. 避免 `convertMcp` 逻辑在 converter 和 sync 之间重复

`src/converters/claude-to-{target}.ts` 和 `src/sync/{target}.ts` 经常需要相同的 MCP 服务器转换逻辑。应将转换函数在 converter 中导出，供 sync 侧复用，而不是各自维护一份副本。

**检查点：**
- [ ] `src/sync/{target}.ts` 中是否存在与 converter 侧功能重复的 MCP 转换代码？
- [ ] 如果存在，是否已提取为共享函数并从 converter 导出？

```typescript
// src/converters/claude-to-kilo.ts
export function convertMcp(
  servers: Record<string, ClaudeMcpServer>,
): Record<string, KiloMcpServer> {
  // ...
}

// src/sync/kilo.ts
import { convertMcp } from "../converters/claude-to-kilo"
// 直接复用，无需本地重复实现
```

### 3. 测试名称必须与实际测试内容一致

测试名称中的文件名、功能描述应与断言对象严格对应。错误的测试名称会降低测试可读性，并在测试失败时误导调试方向。

**检查点：**
- [ ] 所有新增测试的 `test("...")` 描述是否准确反映了被测对象？
- [ ] 测试中提到的文件名（如 `kilo.json`、`mcp.json`）是否与实际操作的目标文件一致？

```typescript
// 错误
// test("mcp.json fresh write when no existing file", async () => { ... kilo.json ... })

// 正确
test("kilo.json fresh write when no existing file", async () => { ... kilo.json ... })
```

### 4. 路径改写正则的边界处理要足够宽松

在 `transformContentForKilo` 等函数中，将 `.claude/` 路径改写为目标平台路径时，正则的 lookbehind 必须覆盖常见的标点边界（括号、方括号、冒号等），同时避免误匹配域名或包名中的假阳性（如 `my.claude/page`）。

**检查点：**
- [ ] 路径改写正则是否能处理括号 `(...)`、方括号 `[...]` 等标点前的路径？
- [ ] 是否能避免误匹配 `something.claude/...` 这类假阳性？
- [ ] 是否已为边界 case 编写了测试？

```typescript
// 过于严格的 lookbehind — 遗漏括号等边界
result = result.replace(/(?<=^|\s|["'`])\.claude\//gm, ".kilo/")

// 更健壮的负向 lookbehind — 匹配"前面不是单词字符或点号"的位置
result = result.replace(/(?<!\w|\.)(\.claude\/)/gm, ".kilo/")
```

## Why This Matters

这些问题看似细小，但会在以下方面产生累积影响：

1. **`defaultScope` 缺失**：当 `--also` 功能扩展或 `write` 签名变更时，`undefined` 可能引发静默失败，排查成本高。
2. **代码重复**：MCP 字段支持演进时（如新增 `env` 处理逻辑），需要改多处，容易遗漏。
3. **测试名称错误**：降低测试套件的可维护性，增加团队协作中的认知负担。
4. **正则边界遗漏**：导致转换后的内容中仍有未改写的 `.claude/` 引用，用户在目标平台上使用时会遇到路径错误。

## When to Apply

- 向 `src/targets/index.ts` 新增目标注册时
- 创建新的 `src/converters/claude-to-{target}.ts` 和 `src/sync/{target}.ts` 时
- 编写路径/内容改写逻辑（`transformContentForXxx`）时
- 为目标平台编写 writer 测试时

## Examples

### 完整修复 diff（Kilo Code 案例）

```diff
// src/targets/index.ts
   kilo: {
     name: "kilo",
     implemented: true,
+    defaultScope: "workspace",
     convert: convertClaudeToKilo as TargetHandler["convert"],
     write: writeKiloBundle as TargetHandler["write"],
   },

// src/converters/claude-to-kilo.ts
-function convertMcp(...)
+export function convertMcp(...)

// src/sync/kilo.ts
-function convertMcpForKilo(...) { /* 25 行重复代码 */ }
+import { convertMcp } from "../converters/claude-to-kilo"

// src/converters/claude-to-kilo.ts
-result = result.replace(/(?<=^|\s|["'`])~\/\.claude\//gm, "~/.config/kilo/")
-result = result.replace(/(?<=^|\s|["'`])\.claude\//gm, ".kilo/")
+result = result.replace(/(?<!\w|\.)(~\/\.claude\/)/gm, "~/.config/kilo/")
+result = result.replace(/(?<!\w|\.)(\.claude\/)/gm, ".kilo/")

// tests/kilo-writer.test.ts
-test("mcp.json fresh write when no existing file", async () => {
+test("kilo.json fresh write when no existing file", async () => {
```

## Related

- [Adding New Converter Target Providers](../adding-converter-target-providers.md) — 完整的 6 阶段目标提供者实施指南
