# BUG-011: board-list 知识文档集成

| 字段 | 内容 |
|------|------|
| **编号** | BUG-011 |
| **标题** | board-list 知识文档集成 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/commands/board-list.ts` |
| **指派** | Agent-修复组-C |
| **关联用例** | TC-C-024~040 |

---

## 问题描述

`board list` 新增 `--with-knowledge`, `--knowledge-only`, `--knowledge-type` 参数，需正确展示知识文档，与任务列表不互相干扰。

---

## 测试验证项

### 验证 11.1: `--with-knowledge` 追加知识文档
- **预期**: 任务列表后追加 `📚 Knowledge Documents` 区块
- **用例**: TC-C-024

### 验证 11.2: `--knowledge-only` 仅显示知识文档
- **预期**: 不加载任务，不报错
- **用例**: TC-C-025

### 验证 11.3: `--knowledge-only` 与 `--with-knowledge` 共存时优先前者
- **预期**: 仅显示知识文档
- **用例**: TC-C-026

### 验证 11.4: `--knowledge-type` 过滤三种类型
- **输入**: `brainstorms`, `plans`, `solutions`
- **预期**: 仅对应类型展示
- **用例**: TC-C-027

### 验证 11.5: `--knowledge-type` 无效值报错退出
- **输入**: `invalid`
- **预期**: stderr 报错，非 0 退出码
- **用例**: TC-C-028

### 验证 11.6: `--project` 同时过滤任务和知识文档
- **预期**: 两者均按 project 过滤
- **用例**: TC-C-029

### 验证 11.7: 无知识文档时显示空提示
- **预期**: `No documents found.`
- **用例**: TC-C-031~032

### 验证 11.8: 知识文档按 type 分组显示
- **预期**: `brainstorms/`, `plans/`, `solutions/` 分组，组内日期降序
- **用例**: TC-C-033

### 验证 11.9: `limit`/`offset` 不影响知识文档数量
- **预期**: 仅作用于任务列表
- **用例**: TC-C-037

### 验证 11.10: `--with-knowledge` + `--format=json` 已知限制
- **预期**: 整体输出非合法 JSON（任务 JSON + 知识文本）
- **用例**: TC-C-035

---

## 验收标准

- [ ] 所有参数组合行为正确
- [ ] 任务列表与知识文档不互相干扰
- [ ] 空场景有友好提示

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: board-list 三个新参数 (--with-knowledge, --knowledge-only, --knowledge-type) 已实现
- **验证方式**: bun test 全量通过 (962 tests)
