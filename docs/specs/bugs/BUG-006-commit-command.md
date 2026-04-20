# BUG-006: commit 子命令批量提交与安全加固

| 字段 | 内容 |
|------|------|
| **编号** | BUG-006 |
| **标题** | commit 子命令批量提交与安全加固 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/git-ops.ts` |
| **指派** | Agent-修复组-安全 |
| **关联用例** | TC-B-010~026, TC-D-004~006, TC-D-016, TC-D-018 |

---

## 问题描述

`gale-knowledge commit` 批量提交知识文档变更，需正确处理参数、防止 Shell 注入、处理无变更场景。

---

## 测试验证项

### 验证 6.1: 正常提交生成正确 commit message
- **输入**: `--project my-app --type brainstorm --title "auth-design"`
- **预期**: message 为 `docs(my-app/brainstorm): auth-design`
- **用例**: TC-B-010

### 验证 6.2: 无变更时 exit 0
- **预期**: 输出 `No changes to commit`，不产生 commit
- **用例**: TC-B-011

### 验证 6.3: --type 无效值 exit 1
- **输入**: `--type invalid`
- **预期**: stderr 报错，exit 1
- **用例**: TC-B-014

### 验证 6.4: title sanitize — 双引号 `"` → 单引号
- **输入**: `--title 'say "hello"'`
- **预期**: message 中 `'` 替代 `"`
- **用例**: TC-B-016

### 验证 6.5: title sanitize — 反引号 `` ` `` → 单引号
- **输入**: `` --title 'use \`fetch\` api' ``
- **预期**: `` ` `` 替换为 `'`
- **用例**: TC-B-017

### 验证 6.6: title sanitize — `$` 移除
- **输入**: `--title 'cost $100'`
- **预期**: message 为 `cost 100`
- **用例**: TC-B-018, TC-D-005

### 验证 6.7: title sanitize — `\` 移除
- **输入**: `--title 'path\\to\\file'`
- **预期**: message 为 `pathtofile`
- **用例**: TC-B-019

### 验证 6.8: spawnSync 数组参数防注入
- **输入**: `--title 'evil"; touch /tmp/pwned; "'`
- **预期**: `/tmp/pwned` 不会被创建
- **用例**: TC-B-023, TC-D-004

### 验证 6.9: 批量提交多文件
- **预期**: 一次 commit 包含所有变更文件
- **用例**: TC-B-022

### 验证 6.10: 15秒超时保护
- **预期**: git 挂起时 15s 内返回错误
- **用例**: TC-B-024, TC-D-012

---

## 验收标准

- [ ] 所有 sanitize 规则正确生效
- [ ] Shell 注入攻击无法执行任意命令
- [ ] 无变更时优雅退出（exit 0）
- [ ] 批量提交生成单个 commit

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: commit message sanitize 和 spawnSync 数组参数已实现
- **验证方式**: bun test 全量通过 (962 tests)
