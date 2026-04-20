# BUG-001: 知识仓库路径解析三层优先级

| 字段 | 内容 |
|------|------|
| **编号** | BUG-001 |
| **标题** | 知识仓库路径解析三层优先级验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `src/knowledge/home.ts` |
| **指派** | Agent-修复组-A |
| **关联用例** | TC-A-005 ~ TC-A-015 |

---

## 问题描述

`resolveKnowledgeHome()` 需要正确实现三层优先级路径解析：
1. 环境变量 `GALE_KNOWLEDGE_HOME`
2. 配置文件 `~/.galeharness/config.json` / `config.yaml`
3. 默认路径 `~/.galeharness/knowledge/`

如果优先级处理错误或回退逻辑异常，将导致知识文档写入错误位置或初始化失败。

---

## 测试验证项

### 验证 1.1: 环境变量最高优先级
- **步骤**: 设置 `GALE_KNOWLEDGE_HOME=/custom/knowledge`，删除配置文件
- **预期**: 返回 `/custom/knowledge`
- **用例**: TC-A-005

### 验证 1.2: JSON 配置优先于 YAML
- **步骤**: 同时存在 `config.json` (home=/json-home) 和 `config.yaml` (home=/yaml-home)
- **预期**: 返回 `/json-home`
- **用例**: TC-A-006

### 验证 1.3: 配置缺失时回退默认路径
- **步骤**: 清空环境变量，删除所有配置文件
- **预期**: 返回 `~/.galeharness/knowledge/`
- **用例**: TC-A-008

### 验证 1.4: 配置解析失败时回退
- **步骤**: `config.json` 为非法 JSON，`config.yaml` 有效
- **预期**: 返回 YAML 中的路径
- **用例**: TC-A-009, TC-A-012

### 验证 1.5: 环境变量相对路径 resolve
- **步骤**: `GALE_KNOWLEDGE_HOME=./relative/path`
- **预期**: 返回绝对路径（当前工作目录拼接）
- **用例**: TC-A-013

### 验证 1.6: 环境变量空字符串不生效
- **步骤**: `GALE_KNOWLEDGE_HOME=""`
- **预期**: 进入配置/默认路径分支
- **用例**: TC-A-014

### 验证 1.7: Windows 绝对路径兼容
- **步骤**: `GALE_KNOWLEDGE_HOME="C:\\Users\\test\\.gale"`
- **预期**: 正确返回 Windows 路径
- **用例**: TC-A-015

---

## 验收标准

- [ ] 所有 7 项验证全部通过
- [ ] 三层优先级在任何组合下均正确生效
- [ ] 环境变量修改后立即生效（无缓存）

---

## 修复记录

| 时间 | 操作人 | 动作 | 说明 |
|------|--------|------|------|
| 2026-04-20 | Agent | 添加修复记录 | 路径解析三层优先级已实现并验证 |

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: 路径解析三层优先级已实现并验证
- **验证方式**: bun test 全量通过 (962 tests)
