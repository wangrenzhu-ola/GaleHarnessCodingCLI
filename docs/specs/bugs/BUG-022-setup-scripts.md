# BUG-022: Setup 脚本验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-022 |
| **标题** | Setup 脚本验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `scripts/setup.sh`, `scripts/setup.ps1` |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-019~026, TC-E-035 |

---

## 测试验证项

### 验证 22.1: setup.sh 全局知识仓库初始化
- **预期**: Step 7 执行 `gale-knowledge init`，`~/.galeharness/knowledge/.git` 存在
- **用例**: TC-E-019

### 验证 22.2: setup.sh ok/warn 反馈
- **预期**: 成功 `✓`，警告 `⚠`，错误 `✗`
- **用例**: TC-E-020

### 验证 22.3: setup.sh 自检清单含 resolve-path
- **预期**: 清单包含 `gale-knowledge resolve-path --type solutions`
- **用例**: TC-E-021

### 验证 22.4: setup.sh 无 PATH 警告
- **预期**: `gale-knowledge` 不在 PATH 时 `⚠` 提示，脚本继续
- **用例**: TC-E-022

### 验证 22.5: setup.ps1 全局知识仓库初始化
- **预期**: 显示 `[OK] 全局知识仓库已初始化`
- **用例**: TC-E-023

### 验证 22.6: setup.ps1 $LASTEXITCODE 检查
- **预期**: 使用 `$LASTEXITCODE -eq 0` 判断 init 结果
- **用例**: TC-E-024

### 验证 22.7: setup.ps1 无 PATH 警告
- **预期**: `[WARN] gale-knowledge 不在 PATH 中`
- **用例**: TC-E-025

### 验证 22.8: setup.ps1 编码无乱码
- **预期**: PowerShell 5.1 下中文字符正常显示
- **用例**: TC-E-026

### 验证 22.9: setup.sh Python 版本检查
- **预期**: Python < 3.9 时 `✗` 并 exit 1
- **用例**: TC-E-035

---

## 验收标准

- [ ] macOS/Linux setup.sh 完整执行
- [ ] Windows setup.ps1 功能对等
- [ ] 缺失依赖时给出清晰提示

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: setup.sh 和 setup.ps1 已新增全局知识仓库初始化步骤
- **验证方式**: bun test 全量通过 (962 tests)
