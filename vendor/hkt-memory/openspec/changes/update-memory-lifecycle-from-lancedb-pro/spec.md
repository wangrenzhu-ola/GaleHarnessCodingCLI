# 学习 LanceDB Pro 的记忆生命周期改造

## 背景

当前 HKTMemory v5 的长期记忆默认持续保留，主流程缺少可用的过期、遗忘、容量裁剪与可观测能力。虽然仓库内已有 lifecycle 配置与 tier manager 原型，但尚未接入 `scripts/hkt_memory_v5.py`、`layers/manager_v5.py` 与 MCP 工具主链路。

LanceDB Pro 的可借鉴点不在“直接按时间删除所有记忆”，而在“把记忆正文、效果事件、删除语义、容量治理拆开管理”：

- 效果事件独立存储，并支持 TTL 清理
- `forget` 默认软删除，必要时才硬删除
- 每个 scope 有容量上限，超限后做裁剪
- stats 与 cleanup 工具能解释治理行为

本改造以这些治理边界为核心，补齐 HKTMemory 的最小生命周期闭环。

## 目标

- 为长期记忆增加安全的生命周期治理能力，而不是默认永久堆积
- 引入默认安全、可恢复、可观测的遗忘机制
- 让 CLI 与 MCP 对“记住、检索、遗忘、清理、统计”形成统一行为
- 保持现有 `memory/` 三层结构兼容，不强制替换为新存储引擎

## 非目标

- 本轮不引入新的外部向量数据库
- 本轮不默认启用硬删除型 TTL
- 本轮不重做 L0/L1/L2 的分层抽象
- 本轮不实现复杂的多租户权限系统

## 设计原则

- 默认安全：默认 soft-delete，不直接破坏原始记忆
- 正文与事件分治：记忆正文和效果事件使用不同保留策略
- 优先降权，再归档，最后删除
- 运维先可见，再自动化
- 配置关闭时保持当前行为兼容

## ADDED Requirements

### Requirement: 记忆状态治理

系统必须为每条长期记忆维护明确生命周期状态，至少包含 `active`、`disabled`、`archived`、`deleted` 四种状态。

#### Scenario: 新记忆默认激活
- **WHEN** 用户通过 v5 CLI 或 MCP 写入一条新记忆
- **THEN** 该记忆状态为 `active`
- **AND** 默认参与正常检索与统计

#### Scenario: 软删除后默认不召回
- **WHEN** 用户执行 forget 且未指定强制删除
- **THEN** 系统将目标记忆标记为 `disabled`
- **AND** 默认检索结果不再返回该记忆
- **AND** 原始内容仍可用于审计或恢复

#### Scenario: 归档记忆被移出活跃集合
- **WHEN** 系统将低活跃、低价值记忆归档
- **THEN** 该记忆状态变为 `archived`
- **AND** 活跃检索默认跳过归档记忆
- **AND** 系统保留恢复入口

### Requirement: 效果事件独立保留期

系统必须把 capture、recall、feedback、forget、cleanup 等运行时效果事件与记忆正文分开存储，并支持独立 TTL 清理。

#### Scenario: 启动时清理过期事件
- **WHEN** 生命周期配置开启 `effectiveness_events_days`
- **AND** 系统启动或初始化管理器
- **THEN** 超过保留期的事件会被识别并清理
- **AND** 正文记忆不会因事件过期而被删除

#### Scenario: 手动 dry-run 查看待清理事件
- **WHEN** 用户执行事件清理命令并启用 dry-run
- **THEN** 系统仅返回预计清理数量、scope 分布与示例记录
- **AND** 不实际删除任何数据

### Requirement: Scope 容量裁剪

系统必须支持按 scope 的容量治理，在超过阈值时自动裁剪活跃集合中的低价值旧记忆。

#### Scenario: 超过容量上限触发裁剪
- **WHEN** 某个 scope 的活跃记忆数超过 `max_entries_per_scope`
- **THEN** 系统在写入后触发裁剪流程
- **AND** 优先处理重复、低重要度、低活跃、长时间未访问的记忆
- **AND** 被 pin 或高重要度的记忆不会被优先裁掉

#### Scenario: 裁剪仅影响活跃集合
- **WHEN** 自动裁剪执行
- **THEN** 系统优先将目标记忆转为 `archived` 或 `disabled`
- **AND** 默认不直接硬删除原始正文

### Requirement: 统一 forget/delete 语义

系统必须在 CLI 与 MCP 中提供一致的 forget/delete 语义。

#### Scenario: 默认 forget 走软删除
- **WHEN** 用户执行 forget 操作
- **AND** 未显式指定 `force=true`
- **THEN** 系统执行软删除
- **AND** 返回状态变更结果、影响层级与可恢复信息

#### Scenario: force delete 执行硬删除
- **WHEN** 用户显式指定 `force=true`
- **THEN** 系统删除关联的正文文件引用、索引引用与生命周期状态
- **AND** 返回受影响对象数量

### Requirement: 检索排序感知生命周期

系统必须让检索过程感知生命周期状态与近期活跃度。

#### Scenario: disabled 记忆不参与默认排序
- **WHEN** 用户执行默认检索
- **THEN** `disabled` 与 `archived` 记忆不会进入默认结果

#### Scenario: 活跃度影响召回优先级
- **WHEN** 两条记忆都匹配查询
- **AND** 其中一条最近被多次访问或反馈为有用
- **THEN** 该记忆在排序上获得更高优先级

### Requirement: 生命周期可观测性

系统必须暴露生命周期统计与治理诊断信息。

#### Scenario: stats 显示生命周期概况
- **WHEN** 用户执行 stats
- **THEN** 返回 active、disabled、archived、deleted 数量
- **AND** 返回事件 TTL 配置、已过期事件数、最近一次 cleanup 时间
- **AND** 返回每个 scope 的活跃容量与裁剪结果摘要

#### Scenario: cleanup 返回操作摘要
- **WHEN** 用户执行 cleanup
- **THEN** 返回 dry-run 或真实执行模式
- **AND** 返回处理数量、跳过原因、scope 分布与失败项

### Requirement: 平滑迁移与兼容

系统必须兼容现有 v5 文件结构与历史记忆数据。

#### Scenario: 未开启生命周期时维持现状
- **WHEN** 生命周期功能默认关闭或未配置
- **THEN** 系统行为保持当前追加存储与检索逻辑
- **AND** 不强制修改既有历史文件

#### Scenario: 老记忆初始化生命周期状态
- **WHEN** 系统首次启用生命周期治理
- **THEN** 现有历史记忆会被补登记为 `active`
- **AND** 不改变原始正文内容

## 配置草案

```json
{
  "lifecycle": {
    "enabled": true,
    "effectivenessEventsDays": 90,
    "maxEntriesPerScope": 3000,
    "pruneMode": "archive",
    "defaultForgetMode": "soft",
    "respectImportance": true,
    "respectPinned": true,
    "recencyHalfLifeHours": 72
  }
}
```

## 影响范围

- CLI: `scripts/hkt_memory_v5.py`
- 管理器: `layers/manager_v5.py`
- L2 存储与检索: `layers/l2_full.py`
- 生命周期模块复用与接线: `lifecycle/*.py`
- MCP 工具: `mcp/tools.py`, `mcp/server.py`
- 统计与报告: `API.md`, `README_v5.md`

## 验收标准

- 默认 forget 可用且为 soft-delete
- 事件 TTL 可配置、可 dry-run、可手动 cleanup
- 写入后可触发 count-based prune
- stats 能解释生命周期状态与清理结果
- 关闭生命周期配置时，当前 v5 行为不回归
