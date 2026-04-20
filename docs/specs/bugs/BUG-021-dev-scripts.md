# BUG-021: 开发脚本验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-021 |
| **标题** | 开发脚本验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `scripts/dev-link.sh`, `dev-unlink.sh`, `dev-sync-skills.sh` |
| **指派** | Agent-修复组-E |
| **关联用例** | TC-E-011~018, TC-E-034 |

---

## 测试验证项

### 验证 21.1: dev-link.sh 包含 gale-knowledge
- **预期**: 循环变量含 `gale-knowledge`，wrapper 生成成功
- **用例**: TC-E-011

### 验证 21.2: dev-link.sh 入口映射正确
- **预期**: `gale-knowledge` 使用 `cmd/gale-knowledge/index.ts`
- **用例**: TC-E-012

### 验证 21.3: dev-unlink.sh 恢复 gale-knowledge
- **预期**: 恢复 release symlink，备份文件清理
- **用例**: TC-E-013~014

### 验证 21.4: dev-sync-skills.sh rsync `-a --delete`
- **预期**: 目标文件同步删除
- **用例**: TC-E-015

### 验证 21.5: dev-sync-skills.sh agent 扁平化
- **预期**: `agents/` 下无子目录，仅扁平 `.md` 文件
- **用例**: TC-E-016

### 验证 21.6: dev-sync-skills.sh 旧 agent 清理签名检查
- **预期**: 仅删除含 `galeharness-cli` 签名的文件，其他插件保留
- **用例**: TC-E-017

### 验证 21.7: dev-sync-skills.sh 无环境时退出
- **预期**: `ERROR: No installed environments found`，exit 非 0
- **用例**: TC-E-018

### 验证 21.8: dev-link.sh 重复运行幂等
- **预期**: 备份始终指向原始 release target，不被覆盖
- **用例**: TC-E-034

---

## 验收标准

- [ ] 3 个脚本均支持 gale-knowledge
- [ ] 文件同步和清理逻辑正确

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: dev-link/unlink/sync-skills 脚本已更新支持 gale-knowledge
- **验证方式**: bun test 全量通过 (962 tests)
