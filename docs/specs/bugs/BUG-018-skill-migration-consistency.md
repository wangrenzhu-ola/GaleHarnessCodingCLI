# BUG-018: 技能迁移一致性验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-018 |
| **标题** | 技能迁移一致性验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `plugins/galeharness-cli/skills/gh-{brainstorm,plan,compound,compound-refresh}/SKILL.md` |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-001~004 |

---

## 问题描述

4 个技能需一致迁移到全局知识仓库。任何迁移遗漏或命令格式不一致都会导致知识文档散落或无法提交。

---

## 测试验证项

### 验证 18.1: gh-brainstorm 写入路径
- **预期**: `gale-knowledge resolve-path --type brainstorms` → 写入 → `gale-knowledge commit --type brainstorm`
- **用例**: TC-E-001

### 验证 18.2: gh-plan 写入路径
- **预期**: `resolve-path --type plans` → 写入 → `commit --type plan`
- **用例**: TC-E-002

### 验证 18.3: gh-compound 写入路径
- **预期**: `resolve-path --type solutions` → 写入 → `commit --type solution`
- **用例**: TC-E-003

### 验证 18.4: gh-compound-refresh 无 commit
- **预期**: 仅 `resolve-path --type solutions` 读取扫描，无 `commit` 步骤
- **用例**: TC-E-004

---

## 验收标准

- [ ] 4 个技能均使用 gale-knowledge 命令
- [ ] commit 类型参数与文档类型匹配
- [ ] compound-refresh 不执行 knowledge commit

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 4个技能一致迁移到全局知识仓库
- **验证方式**: bun test 全量通过 (962 tests)
