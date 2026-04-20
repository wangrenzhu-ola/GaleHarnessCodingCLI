# BUG-019: 技能回退机制验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-019 |
| **标题** | 技能回退机制验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | 4 个迁移技能的 SKILL.md |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-005~008 |

---

## 问题描述

当 `gale-knowledge` 命令不可用时，技能需回退到项目 `docs/<type>/`，且 commit 步骤被跳过不阻塞流程。

---

## 测试验证项

### 验证 19.1: gh-brainstorm 回退
- **步骤**: 移除 `gale-knowledge` 命令，运行技能
- **预期**: 写入 `docs/brainstorms/`，commit 跳过，流程不中断
- **用例**: TC-E-005

### 验证 19.2: gh-plan 回退
- **预期**: 写入 `docs/plans/`，commit 跳过
- **用例**: TC-E-006

### 验证 19.3: gh-compound 回退
- **预期**: 写入 `docs/solutions/`，commit 跳过
- **用例**: TC-E-007

### 验证 19.4: gh-compound-refresh 回退
- **预期**: `$SOLUTIONS_DIR = docs/solutions/`，扫描基于此路径
- **用例**: TC-E-008

---

## 验收标准

- [ ] 无 gale-knowledge 时所有技能正常回退
- [ ] 文档内容完整，格式正确
- [ ] 恢复 gale-knowledge 后全局仓库写入正常

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 技能回退机制已实现，gale-knowledge 不可用时回退到项目 docs/
- **验证方式**: bun test 全量通过 (962 tests)
