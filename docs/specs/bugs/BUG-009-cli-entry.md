# BUG-009: CLI 入口与子命令路由

| 字段 | 内容 |
|------|------|
| **编号** | BUG-009 |
| **标题** | CLI 入口与子命令路由 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/index.ts` |
| **指派** | Agent-修复组-B |
| **关联用例** | TC-B-057~069 |

---

## 问题描述

`gale-knowledge` CLI 入口需正确路由 7 个子命令，参数验证严格，输出格式符合预期。

---

## 测试验证项

### 验证 9.1: `resolve-home` 输出纯路径
- **预期**: 仅一行绝对路径
- **用例**: TC-B-057

### 验证 9.2: `resolve-path` 默认输出纯路径
- **预期**: 仅 docDir 路径
- **用例**: TC-B-058

### 验证 9.3: `resolve-path --json` 输出完整对象
- **预期**: JSON 含 `home`, `projectDir`, `docDir`, `projectName`
- **用例**: TC-B-059

### 验证 9.4: `--type` 有效值通过
- **输入**: `brainstorms`, `plans`, `solutions`
- **预期**: 均 exit 0
- **用例**: TC-B-060

### 验证 9.5: `--type` 无效值 exit 1
- **输入**: `invalid`
- **预期**: stderr 报错，exit 1
- **用例**: TC-B-061

### 验证 9.6: `--project` 覆盖自动检测
- **输入**: `--project my-custom-project`
- **预期**: 路径含自定义项目名
- **用例**: TC-B-062

### 验证 9.7: 无子命令显示 usage
- **预期**: 列出所有子命令，exit 0
- **用例**: TC-B-064

### 验证 9.8: 7 个子命令路由正确
- **验证**: init, commit, rebuild-index, setup-ci, resolve-home, resolve-path, extract-project
- **用例**: TC-B-065~068

---

## 验收标准

- [ ] 所有子命令正确路由
- [ ] 参数验证严格，无效输入 exit 1
- [ ] 默认/JSON 输出格式符合预期

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 7个子命令路由和参数校验已实现
- **验证方式**: bun test 全量通过 (962 tests)
