# BUG-015: 符号链接穿越防护

| 字段 | 内容 |
|------|------|
| **编号** | BUG-015 |
| **标题** | 符号链接穿越防护 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/rebuild-index.ts` |
| **指派** | Agent-修复组-安全 |
| **关联用例** | TC-D-007, TC-D-007a |

---

## 问题描述

`collectMarkdownFiles` 在递归扫描时需跳过符号链接，防止 symlink 指向系统敏感目录导致信息泄露。

---

## 渗透测试项

### 验证 15.1: symlink 指向 `/etc`
- **步骤**: `ln -s /etc etc-link`，运行 `rebuild-index --full`
- **预期**: `etc-link` 下文件不被收集，不读取 `/etc/passwd`
- **用例**: TC-D-007

### 验证 15.2: symlink 指向 `~/.ssh`
- **步骤**: `ln -s ~/.ssh ssh-link`
- **预期**: `.ssh` 下文件不被索引
- **用例**: TC-D-007a

---

## 验收标准

- [ ] 所有符号链接被跳过
- [ ] 系统敏感文件不会被读入索引

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: symlink 穿越防护通过 isSymbolicLink() 检查实现
- **验证方式**: bun test 全量通过 (962 tests)
