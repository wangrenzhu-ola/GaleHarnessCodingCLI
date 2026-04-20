# BUG-005: init 子命令幂等初始化

| 字段 | 内容 |
|------|------|
| **编号** | BUG-005 |
| **标题** | init 子命令幂等初始化 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/init.ts` |
| **指派** | Agent-修复组-B |
| **关联用例** | TC-B-001~009, TC-D-012 |

---

## 问题描述

`gale-knowledge init` 需幂等创建全局知识仓库，含 git 初始化、.gitignore、初始空提交。任何步骤失败都应清晰报错。

---

## 测试验证项

### 验证 5.1: 首次初始化成功
- **预期**: `.git/` 存在，`log` 显示 `init knowledge repo`
- **用例**: TC-B-001

### 验证 5.2: 幂等性 — 第二次调用返回 false
- **预期**: 输出已存在提示，exit 0，不重复创建 commit
- **用例**: TC-B-002

### 验证 5.3: .gitignore 内容完整性
- **预期**: 包含 `*.db`, `vector-index/`, `.last-rebuild-commit`
- **用例**: TC-B-004

### 验证 5.4: 初始空提交 `--allow-empty`
- **预期**: commit message 为 `chore: init knowledge repo`
- **用例**: TC-B-005

### 验证 5.5: 15秒超时保护
- **预期**: git 命令挂起时 15s 内退出，exit 1
- **用例**: TC-B-003, TC-D-012

### 验证 5.6: git init/config/add/commit 失败处理
- **预期**: 各步骤失败时抛出描述性错误，exit 1
- **用例**: TC-B-006~009

---

## 验收标准

- [ ] 首次创建成功，结构完整
- [ ] 第二次调用幂等不报错
- [ ] 所有 git 操作含 15s 超时
- [ ] 各步骤失败有清晰错误信息

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: init 幂等初始化已实现，含15秒超时
- **验证方式**: bun test 全量通过 (962 tests)
