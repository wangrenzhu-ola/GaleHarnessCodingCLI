# HKT-Memory v4 → v5 迁移指南

## 核心变化

| 特性 | v4 | v5 |
|------|-----|-----|
| **分层存储** | ❌ `--layer all` 不触发 L1/L0 | ✅ `--layer all` 自动触发 |
| **摘要提取** | 规则提取（简单截断） | LLM 智能提取 |
| **L1 触发条件** | 需 `session_id`/`project_id` | 自动从内容提取 |
| **文件格式** | 分散存储 | 统一 topics/ 目录 |
| **层间关联** | 无 | 自动维护关系映射 |

---

## 快速迁移

### 1. 备份现有数据

```bash
cd /Users/wangrenzhu/work/MyBoss/.claude/skills/hkt-memory
cp -r memory memory.backup.$(date +%Y%m%d)
```

### 2. 安装依赖

```bash
# v5 需要 openai 库（用于智谱 AI）
pip install openai
```

### 3. 设置环境变量

```bash
# 必须：智谱 AI API Key（用于 L1 摘要提取）
export ZHIPU_API_KEY="your-zhipu-api-key"

# 可选：选择提供商
export L1_EXTRACTOR_PROVIDER="zhipu"  # 或 openai/minimax

# 可选：记忆目录
export HKT_MEMORY_DIR="./memory"
```

### 4. 全量同步（重新生成所有 L1/L0）

```bash
# 运行 v5 全量同步
uv run scripts/hkt_memory_v5.py sync --full
```

这会：
- 扫描所有现有的 L2 文件
- 使用 LLM 重新提取 L1 摘要
- 生成 L0 关键词索引
- 重建所有索引文件

---

## 使用对比

### 存储记忆

**v4（旧）**:
```bash
# ❌ 只存了 L2，L1/L0 为空
python3 scripts/hkt_memory_v4.py store \
  --content "长内容..." \
  --layer all
```

**v5（新）**:
```bash
# ✅ 自动创建 L2 + L1 + L0
uv run scripts/hkt_memory_v5.py store \
  --content "长内容..." \
  --layer all

# 输出:
# 📝 存储记忆...
#    Layer: all
#    
# 🔄 LayerTrigger: L2 存储完成，触发分层提取...
# 📋 Step 1/2: 提取 L1 摘要...
#    ✅ L1 生成完成: l1-2026-04-08-1234
# 🔖 Step 2/2: 提取 L0 索引...
#    ✅ L0 生成完成: l0-2026-04-08-5678
# 
# ✅ 存储完成!
#    L2: 2026-04-08-xxx
#    L1: l1-2026-04-08-1234
#    L0: l0-2026-04-08-5678
```

### 检索记忆

**v4（旧）**:
```bash
python3 scripts/hkt_memory_v4.py retrieve --query "关键词"
# 结果可能不完整（L1/L0 为空）
```

**v5（新）**:
```bash
uv run scripts/hkt_memory_v5.py retrieve \
  --query "MiniMax" \
  --layer all

# 输出:
# 🔍 检索: MiniMax
#    Layer: all
# 
# ============================================================
# 📂 L0 层 (3 条结果)
# ============================================================
# 1. MiniMax语音转纪要
#    【tools】| MiniMax, ASR, 会议纪要, 语音转文字 | 基于 MiniMax CodePlan API 的语音转文字工具...
# 
# ============================================================
# 📂 L1 层 (2 条结果)
# ============================================================
# 1. MiniMax语音转纪要
#    基于 MiniMax CodePlan API 的语音转文字工具，支持一键将录音文件转为结构化会议纪要...
#
# ============================================================
# 📂 L2 层 (1 条结果)
# ============================================================
# 1. 2026-04-08-minimax-transcribe
#    # MiniMax 语音转纪要工具...
```

---

## 新文件结构

```
memory/
├── L0-Abstract/
│   ├── index.md              # 更新：表格索引 + 详细列表
│   └── topics/
│       ├── general.md        # 新增：按主题存储
│       ├── tools.md          # 新增
│       └── meetings.md       # 新增
├── L1-Overview/
│   ├── index.md              # 更新：主题列表
│   ├── topics/               # 新增：统一存储
│   │   ├── general.md
│   │   ├── tools.md          # 包含结构化摘要
│   │   └── meetings.md
│   ├── sessions/             # 保留（向后兼容）
│   └── projects/             # 保留（向后兼容）
├── L2-Full/
│   ├── daily/                # 每日记录
│   ├── evergreen/            # 永久知识
│   └── episodes/             # 片段记录
└── layer_relationships.json  # 新增：层间关系映射
```

### L1 新格式示例

```markdown
# Topic: tools

> 自动生成的 L1 摘要

### MiniMax语音转纪要

- **时间**: 2026-04-08
- **摘要**: 基于 MiniMax CodePlan API 的语音转文字工具...
- **重要性**: high
- **来源**: [L2](../L2-Full/daily/)

**关键要点**:

- 支持多种音频格式
- 自动触发 L1/L0 分层存储
- 使用 LLM 智能提取摘要

**决策记录**:

- 采用 MiniMax API 而非飞书妙记（成本考虑）
- 使用智谱 AI 进行摘要提取

**行动项**:

- [ ] 测试 API 连接 (@开发团队, 今天)
- [ ] 编写使用文档 (@PM, 明天)

**涉及人员**: 开发团队, PM

**标签**: tools, MiniMax, ASR

---
```

### L0 新格式示例

```markdown
# L0 Abstract Index

> 极简摘要层索引 - 用于快速初步检索

## 活跃主题

| 主题 | 关键词 | 最新条目 |
|------|--------|----------|
| **tools** | MiniMax, ASR, 会议纪要 | 2026-04-08 |
| **meetings** | 决策, 行动项 | 2026-04-08 |

## 最新条目

- [2026-04-08] **MiniMax语音转纪要** (tools): 基于 MiniMax CodePlan API 的语音转文字工具...
- [2026-04-08] **项目周会** (meetings): 讨论 Q2 路线图和资源配置...

### MiniMax语音转纪要
- **时间**: 2026-04-08
- **关键词**: MiniMax, ASR, 会议纪要, 语音转文字
- **核心**: 基于 MiniMax CodePlan API 的语音转文字工具...
- **来源**: 2026-04-08-minimax-transcribe
```

---

## 回滚方案

如果 v5 出现问题，可以回滚到 v4：

```bash
# 1. 恢复备份
cd /Users/wangrenzhu/work/MyBoss/.claude/skills/hkt-memory
rm -rf memory
mv memory.backup.20260408 memory

# 2. 继续使用 v4 脚本
python3 scripts/hkt_memory_v4.py ...
```

---

## 故障排除

### 问题 1: L1 提取失败

**现象**:
```
⚠️ L1 生成失败: API error
```

**解决**:
1. 检查 API Key: `echo $ZHIPU_API_KEY`
2. 切换到规则提取（无需 API）:
   ```bash
   # 临时禁用 LLM
   export L1_EXTRACTOR_PROVIDER=""
   uv run scripts/hkt_memory_v5.py store ...
   ```

### 问题 2: 同步后 L1/L0 为空

**现象**:
同步完成后，topics/ 目录为空。

**排查**:
```bash
# 检查 L2 文件是否存在
ls -la memory/L2-Full/daily/
ls -la memory/L2-Full/evergreen/

# 手动运行测试
uv run scripts/hkt_memory_v5.py test
```

### 问题 3: 检索结果不完整

**可能原因**:
- L1/L0 尚未生成（存储时 `--no-extract`）
- 索引文件损坏

**解决**:
```bash
# 重新同步
uv run scripts/hkt_memory_v5.py sync --full
```

---

## 性能对比

| 指标 | v4 | v5 |
|------|-----|-----|
| 存储耗时 (layer=all) | ~100ms | ~2-5s（含 LLM 调用）|
| 检索速度 | 快 | 快 |
| 摘要质量 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 存储完整性 | 20% | 100% |

---

## 下一步计划

- [ ] 支持增量更新（只更新变化的 L2）
- [ ] 支持多语言摘要提取
- [ ] 添加可视化仪表板
- [ ] 支持自定义提取 Prompt

---

*迁移指南版本: v5.0*  
*最后更新: 2026-04-08*
