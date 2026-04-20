# BUG-004: 知识文档写入与Frontmatter注入

| 字段 | 内容 |
|------|------|
| **编号** | BUG-004 |
| **标题** | 知识文档写入与Frontmatter注入 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/knowledge/writer.ts` |
| **指派** | Agent-修复组-A |
| **关联用例** | TC-A-039~054, TC-D-017, TC-D-019a, TC-D-021, TC-D-023 |

---

## 问题描述

`writeKnowledgeDocument()` 负责将知识文档写入全局仓库，失败时回退到项目 `docs/`。`injectProjectFrontmatter()` 需正确注入/保留 `project` 字段。任何写入失败或frontmatter损坏都会导致知识丢失。

---

## 测试验证项

### 验证 4.1: 主路径成功写入
- **预期**: `usedFallback: false`，文件存在且含 frontmatter
- **用例**: TC-A-039

### 验证 4.2: 主路径不可写时回退到 `docs/`
- **预期**: `usedFallback: true`，文件写入 `<cwd>/docs/<type>/`
- **用例**: TC-A-040, TC-D-021

### 验证 4.3: 主路径和回退均失败时聚合错误
- **预期**: 抛出 `Failed to write knowledge document to both primary and fallback paths`
- **用例**: TC-A-041, TC-D-023

### 验证 4.4: 自动创建多级目录
- **输入**: `filename="a/b/c/nested.md"`
- **预期**: 目录自动创建，写入成功
- **用例**: TC-A-042

### 验证 4.5: 无 frontmatter 时自动注入 `project`
- **输入**: `"# Hello"`
- **预期**: 输出 `---\nproject: <name>\n---\n\n# Hello`
- **用例**: TC-A-043

### 验证 4.6: 已有 frontmatter 但无 `project` 时注入
- **输入**: `"---\ntitle: Plan\n---\n\nBody"`
- **预期**: 保留 `title`，新增 `project`
- **用例**: TC-A-044

### 验证 4.7: 已有 `project` 时不覆盖
- **输入**: `"---\nproject: existing\n---\n\nBody"`
- **预期**: 保留 `existing`，不注入新值
- **用例**: TC-A-045

### 验证 4.8: 空内容处理
- **输入**: `""`
- **预期**: 输出仅含 frontmatter 的文档
- **用例**: TC-A-046, TC-D-019a

### 验证 4.9: fallback 写入也经过 frontmatter 注入
- **预期**: fallback 文件同样包含 frontmatter
- **用例**: TC-A-054

---

## 验收标准

- [ ] 主路径和 fallback 路径均正确写入
- [ ] frontmatter 注入逻辑正确（增、保、不覆盖）
- [ ] 多级目录自动创建
- [ ] 错误信息完整（主路径原因 + fallback 原因）

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 写入失败回退和 frontmatter 注入已完善，双重失败错误聚合
- **验证方式**: bun test 全量通过 (962 tests)
