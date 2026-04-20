# BUG-008: rebuild-index 子命令增量/全量重建

| 字段 | 内容 |
|------|------|
| **编号** | BUG-008 |
| **标题** | rebuild-index 子命令增量/全量重建 |
| **状态** | 🔍 待验证 |
| **优先级** | P0 |
| **模块** | `cmd/gale-knowledge/rebuild-index.ts` |
| **指派** | Agent-修复组-B |
| **关联用例** | TC-B-037~056, TC-D-007, TC-D-013~015, TC-D-020, TC-D-024 |

---

## 问题描述

`rebuild-index` 负责重建 HKTMemory 向量索引，需支持增量/全量模式、正确处理 `.last-rebuild-commit`、跳过 symlink、错误时保护 commit 指针。

---

## 测试验证项

### 验证 8.1: 增量模式仅处理变更文件
- **预期**: 输出 `(incremental mode)`，仅新增/修改文件被处理
- **用例**: TC-B-037

### 验证 8.2: `--full` 全量模式
- **预期**: 输出 `(full mode)`，所有 `.md` 被处理
- **用例**: TC-B-038

### 验证 8.3: 无 `.last-rebuild-commit` 时自动回退 full
- **预期**: 进入 full mode
- **用例**: TC-B-039

### 验证 8.4: 无效/不可达 hash 回退 full
- **预期**: stderr 提示 `Last rebuild commit unreachable, falling back to full mode.`
- **用例**: TC-B-040, TC-D-014

### 验证 8.5: commit hash 格式验证
- **拒绝**: 6位、41位、非 hex 字符（如 `HEAD`, `zzzzzzz`）
- **用例**: TC-B-041~043, TC-D-008~010

### 验证 8.6: symlink 跳过
- **预期**: `isSymbolicLink()` 的文件/目录不被收集
- **用例**: TC-B-044, TC-D-007

### 验证 8.7: `.git` 和 `node_modules` 排除
- **预期**: 这些目录下的 `.md` 不被处理
- **用例**: TC-B-045~046

### 验证 8.8: 删除文件跳过
- **预期**: `existsSync` 为 false 时 continue，不报错
- **用例**: TC-B-047

### 验证 8.9: 错误时不回写 `.last-rebuild-commit`
- **预期**: `errors > 0` 时跳过保存
- **用例**: TC-B-048

### 验证 8.10: uv 缺失时 graceful 处理
- **预期**: Warning 输出，exit 0，不崩溃
- **用例**: TC-B-049~050

### 验证 8.11: 超时保护
- **git 操作**: 15s
- **store 操作**: 30s
- **用例**: TC-B-051~052, TC-D-012a

### 验证 8.12: store 失败时 stdin 重试
- **预期**: 第一次失败后重试 stdin 方式
- **用例**: TC-B-053

### 验证 8.13: 并发 rebuild-index 不崩溃
- **预期**: 两进程均可完成，无临时文件泄漏
- **用例**: TC-D-020

### 验证 8.14: 临时文件清理
- **预期**: 正常完成时 `finally` 块删除 `/tmp/hkt-store-*.txt`
- **用例**: TC-D-024

---

## 验收标准

- [ ] 增量/全量模式切换正确
- [ ] 无效 hash 自动回退 full，不阻塞
- [ ] symlink 和敏感目录被排除
- [ ] 错误时 commit 指针不回写
- [ ] uv 缺失时 graceful 不崩溃

---

## 修复记录

- **修复日期**: 2026-04-20
- **修复分支**: feat/global-knowledge-repo
- **状态**: ✅ 已修复
- **修复摘要**: rebuild-index 增量/全量模式，commit hash 验证，symlink 跳过
- **验证方式**: bun test 全量通过 (962 tests)
