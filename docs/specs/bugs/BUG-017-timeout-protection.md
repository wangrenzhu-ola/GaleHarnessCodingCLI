# BUG-017: 进程超时保护验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-017 |
| **标题** | 进程超时保护验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | 多文件 |
| **指派** | Agent-修复组-安全 |
| **关联用例** | TC-D-011~012b |

---

## 问题描述

所有 `execSync`/`spawnSync` 调用需声明 `timeout`，防止 git 命令或 uv 命令挂起导致进程永久阻塞。

---

## 测试验证项

### 验证 17.1: `git remote get-url` 挂起 15s 超时
- **模块**: `src/knowledge/home.ts`
- **预期**: 约 15s 后抛出 timeout 异常
- **用例**: TC-D-011

### 验证 17.2: `git init` / `git commit` 挂起 15s 超时
- **模块**: `cmd/gale-knowledge/init.ts`, `git-ops.ts`
- **预期**: 15s 内返回错误
- **用例**: TC-D-012

### 验证 17.3: `uv run store` 挂起 30s 超时
- **模块**: `cmd/gale-knowledge/rebuild-index.ts`
- **预期**: 30s 超时，stdin fallback 同样 30s 超时
- **用例**: TC-D-012a

### 验证 17.4: 全局 timeout 审计
- **检查点**:
  - `home.ts:115` — `timeout: 15000` ✓
  - `init.ts` — 所有 spawnSync 含 `timeout: 15000` ✓
  - `git-ops.ts` — 所有 spawnSync 含 `timeout: 15000` ✓
  - `rebuild-index.ts` — git 15s, uv 30s ✓
- **用例**: TC-D-012b

---

## 验收标准

- [ ] 所有同步子进程调用均有 timeout 声明
- [ ] git 操作 15s，store 操作 30s

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 进程超时保护全覆盖 (git 15s, store 30s)
- **验证方式**: bun test 全量通过 (962 tests)
