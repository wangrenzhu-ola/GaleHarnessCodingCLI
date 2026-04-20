# BUG-002: 项目名称提取与Git Remote解析

| 字段 | 内容 |
|------|------|
| **编号** | BUG-002 |
| **标题** | 项目名称提取与Git Remote解析 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/knowledge/home.ts` (extractProjectName) |
| **指派** | Agent-修复组-A |
| **关联用例** | TC-A-016 ~ TC-A-023 |

---

## 问题描述

`extractProjectName()` 从 git remote URL 提取项目名，失败时回退到目录名。如果解析逻辑有误，会导致知识文档归属到错误项目。

---

## 测试验证项

### 验证 2.1: SSH格式 `git@github.com:org/repo.git`
- **预期**: 返回 `"repo"`
- **用例**: TC-A-016

### 验证 2.2: HTTPS格式 `https://github.com/org/repo.git`
- **预期**: 返回 `"repo"`
- **用例**: TC-A-017

### 验证 2.3: HTTPS无后缀 `https://github.com/org/repo`
- **预期**: 返回 `"repo"`
- **用例**: TC-A-018

### 验证 2.4: SSH协议 `ssh://git@github.com/org/repo.git`
- **预期**: 返回 `"repo"`
- **用例**: TC-A-019

### 验证 2.5: Git remote失败回退目录名
- **步骤**: 在无git目录调用
- **预期**: 返回 `basename(cwd)`
- **用例**: TC-A-020

### 验证 2.6: 深层嵌套URL `gitlab.example.com/group/subgroup/project.git`
- **预期**: 返回 `"project"`
- **用例**: TC-A-023

### 验证 2.7: 默认使用 `process.cwd()`
- **步骤**: 不传入参数调用
- **预期**: 基于当前工作目录解析
- **用例**: TC-A-022

---

## 验收标准

- [ ] 所有 6 种 git URL 格式正确解析
- [ ] 无git时正确回退目录名
- [ ] 空remote URL时回退目录名（不崩溃）

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: Git remote URL 6种格式解析已实现
- **验证方式**: bun test 全量通过 (962 tests)
