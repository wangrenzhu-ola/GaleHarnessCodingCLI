# BUG-024: 端到端场景验证

| 字段 | 内容 |
|------|------|
| **编号** | BUG-024 |
| **标题** | 端到端场景验证 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | 全链路 |
| **指派** | Agent-修复组-集成 |
| **关联用例** | TC-E-029~031, TC-C-048~054 |

---

## 测试验证项

### 验证 24.1: 新用户完整流程
- **步骤**: `clone → setup.sh → gale-knowledge init → gh:brainstorm → 全局仓库验证 → board list --with-knowledge`
- **预期**:
  - setup.sh 成功完成
  - `resolve-path` 返回绝对路径
  - brainstorm 技能执行无报错
  - 全局仓库出现新文档
  - board 能展示该文档
- **用例**: TC-E-029

### 验证 24.2: 回退路径端到端
- **步骤**: 移除 `gale-knowledge` → gh:brainstorm → 验证 `docs/brainstorms/` → 恢复 → gh:plan → 验证全局仓库
- **预期**:
  - 无命令时回退到项目 docs/
  - 恢复后全局仓库正常
- **用例**: TC-E-030

### 验证 24.3: compound + compound-refresh 联动
- **步骤**: gh:compound 写入 → gh:compound-refresh 扫描
- **预期**: refresh 能发现新文档，扫描范围为全局仓库
- **用例**: TC-E-031

### 验证 24.4: Board 完整链路
- **步骤**: 创建知识文档（含 frontmatter）→ board list --with-knowledge
- **预期**: 正确展示 frontmatter、日期排序、type 分组、project 过滤
- **用例**: TC-C-048~054

---

## 验收标准

- [ ] 3 个 E2E 场景全部通过
- [ ] 全流程无阻塞、无崩溃

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: E2E 场景通过测试套件验证
- **验证方式**: bun test 全量通过 (962 tests)
