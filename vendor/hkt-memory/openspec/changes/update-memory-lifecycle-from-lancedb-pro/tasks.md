# 改造任务拆解

## 1. 生命周期数据模型

- [ ] 1.1 设计统一的 memory manifest 或 lifecycle state 文件，覆盖 `active`、`disabled`、`archived`、`deleted`
- [ ] 1.2 设计效果事件存储结构，区分 capture、recall、feedback、forget、cleanup
- [ ] 1.3 明确 scope 标识规则，统一 project、topic、global 的映射方式
- [ ] 1.4 定义 pinned、importance、last_accessed、access_count 等裁剪输入字段

## 2. 配置与初始化

- [ ] 2.1 整理 `config/default.json` 的 lifecycle 字段，补齐真正生效的配置项
- [ ] 2.2 在 v5 初始化链路中加载 lifecycle 配置，而不是只保留静态声明
- [ ] 2.3 增加默认关闭与渐进启用策略，确保历史部署兼容

## 3. 写入与事件采集

- [ ] 3.1 在 `store` 主流程中登记生命周期状态
- [ ] 3.2 在 recall、feedback、forget、cleanup 流程中写入效果事件
- [ ] 3.3 写入后接入容量检查与 opportunistic prune 触发点

## 4. Forget、Archive、Delete

- [ ] 4.1 为 CLI 增加 forget 命令，默认 soft-delete
- [ ] 4.2 为 MCP 增加可用的 forget/delete 接口，替换当前未实现占位
- [ ] 4.3 增加 archive 与 restore 语义，优先作为自动裁剪的落点
- [ ] 4.4 为 hard-delete 增加显式 force 开关与影响范围校验

## 5. 检索排序与容量治理

- [ ] 5.1 默认检索过滤 `disabled` 与 `archived` 状态
- [ ] 5.2 将 recency、access_count、feedback usefulness 接入排序权重
- [ ] 5.3 实现 per-scope count-based prune
- [ ] 5.4 让 prune 优先处理重复、低重要度、长时间未访问对象

## 6. 事件 TTL 与清理工具

- [ ] 6.1 实现 effectiveness events TTL 清理器
- [ ] 6.2 增加 cleanup 命令，支持 dry-run、scope 过滤、摘要输出
- [ ] 6.3 在系统启动或管理器初始化时执行安全的自动事件清理

## 7. 可观测性与文档

- [ ] 7.1 扩展 stats 输出，展示生命周期状态、TTL 配置、过期数量、scope 分布
- [ ] 7.2 更新 `README_v5.md` 与 `API.md`，解释 forget、cleanup、archive 行为
- [ ] 7.3 补充迁移文档，说明历史记忆如何补登记生命周期状态

## 8. 验证与回归

- [ ] 8.1 为 soft-delete、restore、hard-delete、cleanup、prune 增加单元或集成测试
- [ ] 8.2 验证关闭 lifecycle 时不改变当前默认行为
- [ ] 8.3 验证老数据初始化不会破坏现有 L0/L1/L2 内容
