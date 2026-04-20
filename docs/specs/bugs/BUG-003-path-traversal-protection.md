# BUG-003: 路径穿越与路径组件净化防护

| 字段 | 内容 |
|------|------|
| **编号** | BUG-003 |
| **标题** | 路径穿越与路径组件净化防护 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/knowledge/home.ts`, `src/knowledge/writer.ts` |
| **指派** | Agent-修复组-安全 |
| **关联用例** | TC-A-024~038, TC-D-001~003, TC-D-025 |

---

## 问题描述

知识仓库写入前需验证目标路径在安全基目录内。如果路径穿越防护失效，攻击者可能通过 `../` 或绝对路径将文件写入系统任意位置。

---

## 测试验证项

### 验证 3.1: `sanitizePathComponent` 拒绝 `/`
- **输入**: `"foo/bar"`
- **预期**: 抛出 `Error: Invalid path component`
- **用例**: TC-A-024

### 验证 3.2: `sanitizePathComponent` 拒绝 `\`
- **输入**: `"foo\\bar"`
- **预期**: 抛出 Error
- **用例**: TC-A-025, TC-D-025

### 验证 3.3: `sanitizePathComponent` 拒绝 `..`
- **输入**: `".."`, `"foo..bar"`, `"foo/../bar"`
- **预期**: 均抛出 Error
- **用例**: TC-A-026

### 验证 3.4: writer `filename="../../../etc/passwd"` 拦截
- **预期**: 抛出 `Error: Invalid filename: path traversal detected`
- **用例**: TC-A-033, TC-D-001

### 验证 3.5: writer `filename="../../.ssh/id_rsa"` 拦截
- **预期**: 抛出 Error，系统 `~/.ssh/` 无新增文件
- **用例**: TC-D-002

### 验证 3.6: writer 绝对路径 `/etc/passwd` 拦截
- **预期**: 抛出 Error
- **用例**: TC-A-034, TC-D-003a

### 验证 3.7: `projectName="../other-project"` 拦截
- **预期**: `sanitizePathComponent` 抛出 Error
- **用例**: TC-D-003

### 验证 3.8: 正常子目录 `filename="sub/deep/doc.md"` 允许
- **预期**: 正常写入，路径在 docDir 内
- **用例**: TC-A-035

---

## 🚨 已知风险（建议修复）

| 风险 | 说明 |
|------|------|
| Windows 反斜杠穿越 | POSIX 下 `\\` 不被 `resolve()` 视为分隔符，但 Windows 上可能绕过检测 |

**建议**: 在 `writer.ts` 中对 `filename` 也调用 `sanitizePathComponent`，或对 `\\` 显式拒绝。

---

## 验收标准

- [ ] 所有路径穿越攻击向量均被拦截
- [ ] 合法子目录路径正常写入
- [ ] 无系统敏感文件被覆盖风险

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 路径穿越防护 sanitizePathComponent 已加固，writer.ts 对 filename 也调用 sanitize
- **验证方式**: bun test 全量通过 (962 tests)
