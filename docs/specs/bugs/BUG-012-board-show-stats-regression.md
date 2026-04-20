# BUG-012: board-show/stats 回归验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-012 |
| **标题** | board-show/stats 回归验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/commands/board-show.ts`, `board-stats.ts` |
| **指派** | Agent-修复组-C |
| **关联用例** | TC-C-041~044, TC-C-055~057 |

---

## 问题描述

`board show` 和 `board stats` 在本次 PR 中无知识文档集成。需验证其原有功能不受影响，知识文档存在时不混入展示。

---

## 测试验证项

### 验证 12.1: board-show 无知识文档集成
- **预期**: 仅显示任务字段，无知识区块
- **用例**: TC-C-041

### 验证 12.2: board-show 不受知识文档存在影响
- **预期**: 正常返回，不延迟，不混入
- **用例**: TC-C-042

### 验证 12.3: board-stats 仅统计任务
- **预期**: 无 Knowledge Documents 统计行
- **用例**: TC-C-043

### 验证 12.4: 原任务列表功能不受知识功能影响
- **预期**: 不使用 knowledge 参数时输出完全一致
- **用例**: TC-C-055

### 验证 12.5: board-show 参数校验不变
- **预期**: 无 taskId 时提示 `Task ID is required`
- **用例**: TC-C-056

### 验证 12.6: board-stats 空任务场景不变
- **预期**: 输出 `No tasks found.`
- **用例**: TC-C-057

---

## 验收标准

- [ ] 原有 board-show/stats/list 功能与 PR 前完全一致
- [ ] 知识文档存在时不影响任务展示

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: board-show/stats 回归验证通过，无知识文档集成
- **验证方式**: bun test 全量通过 (962 tests)
