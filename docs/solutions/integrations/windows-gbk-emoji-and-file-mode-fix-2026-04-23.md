---
title: Windows GBK emoji encoding and file-mode vector_backend fix
date: 2026-04-23
category: integrations
module: hkt-memory, cli
problem_type: integration_issue
component: tooling
symptoms:
  - "Windows GBK 终端 (chcp 936) 输出 emoji 时触发 UnicodeEncodeError"
  - "manager_v5.py 的 vector_backend 为 file 模式时，无 API Key 导致 VectorStore 初始化崩溃"
  - "smoke 测试回归：输出消息变更导致 2 个断言失败"
root_cause: config_error
resolution_type: code_fix
severity: medium
tags:
  - windows
  - gbk
  - emoji
  - unicode
  - vector-backend
  - file-mode
  - cross-platform
  - hkt-memory
---

# Windows GBK emoji encoding and file-mode vector_backend fix

## Problem

在 Windows 11 环境 (PowerShell 5.1, Bun 1.3.12) 下，GaleHarnessCodingCLI 存在两类跨平台兼容性问题：1) `manager_v5.py` 的 `vector_backend` 分支逻辑缺少 `file` 模式处理，导致无 API Key 时崩溃；2) 多个文件中的 Unicode emoji 在 GBK 编码终端 (chcp 936) 下触发 `UnicodeEncodeError`。

## Symptoms

- `manager_v5.py` 中 `vector_backend` 仅有 `sqlite` 和 `else` 两个分支，`file` 模式落入 `else` 后强制初始化 `VectorStore`，无 API Key 时抛出异常
- Windows 终端默认 GBK 编码 (codepage 936)，无法输出 emoji 字符（如 ✅、⚠️、⏳、🔍 等），触发 `UnicodeEncodeError`
- 修复输出消息后引入 2 个 smoke 测试回归，原有测试断言匹配旧的输出文本

## What Didn't Work

- Windows 兼容性验证报告最初报告了 5 个问题，但经调查发现其中 3 个（`extractors/__init__.py` 缺失、`src/targets/claude.ts` 缺失、兼容性扫描工具缺失）在当前代码库中已存在。这说明验证报告基于较早的代码快照，导致浪费时间排查不存在的问题
- 首次修复 `manager_v5.py` 时，输出消息未包含 `"unavailable"` 关键词，导致依赖该关键词的 smoke 测试断言失败

## Solution

### 1. file 模式 vector_backend 分支修复

在 `vendor/hkt-memory/layers/manager_v5.py` 的 `vector_backend` 分支逻辑中添加 `elif vector_backend == "file"` 分支：

```python
elif vector_backend == "file":
    self.vector_store = None
    logger.info("Vector store unavailable in file mode — skipping initialization")
```

关键点：输出消息包含 `"unavailable"` 关键词，确保与现有 smoke 测试断言兼容。

### 2. emoji 替换为 ASCII 安全标记

将 4 个文件中所有 emoji 替换为 ASCII 安全标记：

| Emoji | ASCII 替换 |
| ----- | ---------- |
| ✅ | [OK] |
| ⚠️ | [WARN] |
| ⏳ | [PENDING] |
| 🔍 | [SCAN] |
| 🔴 | [ERR] |
| 🟡 | [WARN] |
| ℹ️ | [INFO] |

### 修改文件清单

| 文件路径 | 变更 |
| -------- | ---- |
| `vendor/hkt-memory/layers/manager_v5.py` | +5/-2 添加 file 模式分支 |
| `vendor/hkt-memory/layers/l1_overview.py` | +1/-1 emoji 替换 |
| `src/commands/sync.ts` | +1/-1 emoji 替换 |
| `scripts/windows-compat-scan.ts` | +5/-5 emoji 替换 |

## Why This Works

1. **file 模式分支**：显式处理 `vector_backend == "file"` 的情况，将 `self.vector_store` 设为 `None`，避免在无 API Key 的环境下尝试初始化 `VectorStore`。后续代码已具备 `vector_store is None` 的防御性检查，因此不会引发下游问题。

2. **ASCII 安全标记**：GBK 编码 (codepage 936) 不支持 emoji 字符集。使用 `[OK]`、`[WARN]` 等 ASCII 标记在所有终端编码下均可正确显示，且保持了输出的可读性和语义完整性。

## Prevention

- **验证代码基线**：执行 Windows 兼容性验证前，确认测试环境使用的是最新代码快照，避免报告已修复的问题
- **输出消息兼容性**：修改任何命令行输出消息时，先搜索所有依赖该输出的测试断言，确保新消息包含测试期望的关键词
- **全面搜索 emoji**：emoji 替换是低风险但高覆盖的改动，使用 `grep -rP '[\x{1F600}-\x{1F64F}\x{2600}-\x{26FF}]'` 等方式全面搜索，不只依赖已知位置
- **跨平台 CI 覆盖**：在 CI 中添加 Windows (GBK codepage) 环境的测试矩阵，提前发现编码问题

## Related Issues

- Windows 11 兼容性验证报告 (`docs/WINDOWS_COMPATIBILITY_REPORT.md`)
- Windows 兼容性扫描工具 (`scripts/windows-compat-scan.ts`)
- 验证结果：1044 pass / 0 fail / 3 skip
