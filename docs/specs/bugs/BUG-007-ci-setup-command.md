# BUG-007: ci-setup 子命令 Workflow 生成

| 字段 | 内容 |
|------|------|
| **编号** | BUG-007 |
| **标题** | ci-setup 子命令 Workflow 生成 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/ci-setup.ts` |
| **指派** | Agent-修复组-B |
| **关联用例** | TC-B-027~036 |

---

## 问题描述

`gale-knowledge setup-ci` 生成 GitHub Actions workflow。如果模板内容缺失关键步骤，CI 将无法正确索引知识文档。

---

## 测试验证项

### 验证 7.1: 首次生成 workflow 文件
- **预期**: 文件创建成功，末尾提醒配置 secret
- **用例**: TC-B-027

### 验证 7.2: 幂等覆盖已有文件
- **预期**: 第二次执行输出 `Updated workflow`
- **用例**: TC-B-028

### 验证 7.3: `.github/workflows` 目录自动创建
- **预期**: 递归创建目录，文件写入成功
- **用例**: TC-B-029

### 验证 7.4: workflow 包含关键步骤清单
- [ ] `actions/checkout@v4`
- [ ] `fetch-depth: 0`
- [ ] `github.event.before`
- [ ] `astral-sh/setup-uv@v3`
- [ ] `HKT_MEMORY_API_KEY` 环境变量引用
- [ ] `hkt_memory_v5.py ingest-artifact`
- [ ] `.last-rebuild-commit` 写入
- **用例**: TC-B-030~036

---

## 验收标准

- [ ] workflow 模板包含全部 7 项关键步骤
- [ ] 幂等覆盖无残留旧内容
- [ ] 目录不存在时自动创建

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: CI workflow 模板含7项关键步骤，幂等生成
- **验证方式**: bun test 全量通过 (962 tests)
