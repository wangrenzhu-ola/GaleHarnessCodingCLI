# 评审清单

## 产品与策略

- [ ] 是否接受“默认 soft-delete，非默认 hard-delete”的遗忘策略
- [ ] 是否接受“事件 TTL”与“正文保留”分离治理，而不是统一过期
- [ ] 是否接受自动裁剪默认优先 archive/disable，而不是直接删正文
- [ ] 是否需要 pinned 或高重要度记忆永久豁免自动裁剪

## 研发与架构

- [ ] 是否确认继续沿用当前 `memory/` 文件结构，而不是切换到底层新引擎
- [ ] 是否确认复用现有 `lifecycle/` 模块，并按需补齐缺失逻辑
- [ ] 是否确认 CLI 与 MCP 共享同一套 forget/cleanup 语义
- [ ] 是否确认 stats 成为生命周期治理的主要运维入口

## 运营与风险

- [ ] 是否需要 dry-run 作为 cleanup 默认模式
- [ ] 是否需要 archive export 以便治理前备份
- [ ] 是否需要记录 cleanup 审计日志，便于追查误删或误归档
- [ ] 是否需要分 scope 展示 TTL 与 prune 影响范围

## 首版范围

- [ ] 首版是否只做事件 TTL、soft-delete、count-based prune、stats 扩展
- [ ] 首版是否暂缓热度衰减公式与复杂 rerank，只接入基础 recency/usefulness
- [ ] 首版是否暂缓真正 hard-delete 自动化，仅保留手动 force 删除
- [ ] 首版是否要求补齐 README/API/迁移文档后再进入实现

## 通过标准

- [ ] 需求范围已经稳定，没有要求额外改造存储引擎
- [ ] 兼容策略已经确认，不会破坏当前已写入记忆
- [ ] 自动治理策略已经可解释，可通过 stats 与 cleanup 输出复盘
- [ ] 可以按此 spec 进入实现阶段
