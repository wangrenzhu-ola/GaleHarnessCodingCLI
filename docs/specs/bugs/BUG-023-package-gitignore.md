# BUG-023: package.json 与 .gitignore 验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-023 |
| **标题** | package.json 与 .gitignore 验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `package.json`, `.gitignore` |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-027~028 |

---

## 测试验证项

### 验证 23.1: package.json bin 字段含 gale-knowledge
- **预期**: `"gale-knowledge": "cmd/gale-knowledge/index.ts"`
- **用例**: TC-E-027

### 验证 23.2: .gitignore 含 `.qoder/`
- **预期**: 存在 `.qoder/` 行
- **用例**: TC-E-028

---

## 验收标准

- [ ] bin 入口正确
- [ ] `.qoder/` 被 git 忽略

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: package.json bin 字段和 .gitignore 已更新
- **验证方式**: bun test 全量通过 (962 tests)
