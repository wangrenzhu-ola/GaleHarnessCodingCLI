# hktmemory-openvikings-agent 项目知识上下文

- 检索时间: 2026-04-15T03:57:27.794814+00:00
- 检索语句: `hktmemory-openvikings-agent HKTMemory vs OpenVikings Agent：差距分析与需求清单 项目背景 架构约束 术语 决策 历史经验`

## 检索结果

```text
🔍 检索: hktmemory-openvikings-agent HKTMemory vs OpenVikings Agent：差距分析与需求清单 项目背景 架构约束 术语 决策 历史经验
   Layer: all


============================================================
📂 L0 层 (7 条结果)
============================================================

1. Gale compound knowledge capture
   Gale compound …...

2. HKTMemory 项目知识库
   # HKTMemory 项目…...

3. conventions
   团队约定：1）所有 gale…...

4. directory-structure
   目录职责：gale/（主 P…...

5. design-decisions
   关键设计决策：1）三种交付模…...

============================================================
📂 L1 层 (2 条结果)
============================================================

1. Gale compound knowledge capture
   Gale compound knowledge capture source_path: docs/solutions/hktmemory-openviking......

2. HKTMemory 项目知识库
   # HKTMemory 项目知识库  ## 项目背景与目标 HKTMemory 是一个生产级三层长期记忆系统（v5.0），为 Claude Code / AI ......

============================================================
📂 L2 层 (7 条结果)
============================================================

1. Untitled
   Gale compound knowledge capture
source_path: docs/solutions/hktmemory-openvikings-gap-closure-roadma...

2. Untitled
   # HKTMemory 项目知识库

## 项目背景与目标
HKTMemory 是一个生产级三层长期记忆系统（v5.0），为 Claude Code / AI Agent 提供持久化记忆能力。目标是让...

3. conventions
   团队约定：1）所有 gale 命令通过 gale.cli 模块入口。2）.env 文件支持项目级 HKTMemory 配置（API key、base URL、model）。3）bash 入口脚本自动加...

4. directory-structure
   目录职责：gale/（主 Python 包）、bin/（项目级 gale 入口脚本）、scripts/（build.sh、install_gale_cli.sh、dev-clean-gale-env....

5. design-decisions
   关键设计决策：1）三种交付模式根据 task-size 和 risk 自动选择：small+low→direct，medium→compound，large/high→governed。2）Sessi...
```
