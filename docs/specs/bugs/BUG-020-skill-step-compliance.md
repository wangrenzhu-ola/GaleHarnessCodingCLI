# BUG-020: 技能步骤规范与 gh-pr-description 未迁移确认

| 字段 | 内容 |
|------|------|
| **编号** | BUG-020 |
| **标题** | 技能步骤规范与 gh-pr-description 未迁移确认 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | 5 个技能的 SKILL.md |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-009~010 |

---

## 问题描述

知识仓库操作必须拆分为顺序步骤（符合 AGENTS.md 规范），不使用 action chaining 或 error suppression。

---

## 测试验证项

### 验证 20.1: 步骤拆分规范
- **检查**: `resolve-path`、文档写入、`commit` 为三个独立步骤
- **拒绝**: `cmd1 && cmd2 && cmd3` 或 `cmd1; cmd2`
- **拒绝**: `2>/dev/null` 隐藏错误
- **用例**: TC-E-009

### 验证 20.2: gh-pr-description 未迁移
- **检查**: 全文搜索 `gale-knowledge`, `resolve-path`, `knowledge`
- **预期**: gh-pr-description SKILL.md 中**不存在**任何知识仓库相关命令
- **用例**: TC-E-010

---

## 验收标准

- [ ] 迁移技能步骤独立，无 chaining
- [ ] gh-pr-description 完全未引入 knowledge 逻辑

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 步骤规范已确认，无 chaining，gh-pr-description 未迁移
- **验证方式**: bun test 全量通过 (962 tests)
