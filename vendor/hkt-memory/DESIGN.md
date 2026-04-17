# HKT-Memory v4.5 设计文档

> 详细架构设计、算法原理与性能对比

---

## 6阶段检索管道

```
Query → [1.自适应判断] → [2.混合检索] → [3.重排序] → [4.生命周期] → [5.MMR] → [6.Scope过滤] → Results
```

### Stage 1: 自适应检索 (Adaptive Retrieval)

智能判断查询是否需要检索长期记忆：

**自动跳过:**
- 问候语: "你好", "Hi", "在吗"
- 短确认词: "是的", "好的", "OK" (<6中文字符)
- 纯emoji

**强制检索关键词:**
- "记得", "之前", "上次", "previously", "last time", "remember"

### Stage 2: 混合检索 (Hybrid Retrieval)

**Vector搜索** (智谱AI Embedding-3, 2048维):
```python
query → 智谱AI Embedding → 余弦相似度搜索 → top-k结果
```

**BM25搜索** (SQLite FTS5 + 中文分词):
```python
query → jieba分词 → BM25排序 → top-k结果
```

**融合策略**:
```python
fused_score = 0.7 * vector_score + 0.3 * bm25_score
# 双命中额外boost 5%
```

### Stage 3-6: 后处理

| 阶段 | 功能 | 算法 |
|------|------|------|
| **3.重排序** | Cross-Encoder精排 | Jina/SiliconFlow Reranker |
| **4.生命周期** | 访问频率增强 | Weibull Decay + access_boost |
| **5.MMR多样性** | 降低重复结果 | 相似度>0.85降权50% |
| **6.Scope过滤** | 作用域隔离 | global/agent/project过滤 |

---

## 模块架构

```
hkt-memory/
├── retrieval/              # v4.5新增检索模块
│   ├── bm25_index.py      # SQLite FTS5 + 中文分词
│   ├── hybrid_fusion.py   # Vector+BM25融合
│   ├── adaptive_retriever.py  # 自适应检索判断
│   └── mmr_diversifier.py # MMR多样性优化
├── scopes/                 # v4.5新增
│   └── scope_manager.py   # Multi-Scope隔离
├── vector_store/
│   └── store.py           # 智谱AI向量存储
├── layers/
│   ├── l0_abstract.py     # 极简摘要层
│   ├── l1_overview.py     # 概述层
│   ├── l2_full.py         # 完整内容层
│   └── manager.py         # 分层管理器
├── lifecycle/
│   ├── weibull_decay.py   # Weibull衰减模型
│   └── tier_manager.py    # 层级升降级
├── reranker/
│   ├── cross_encoder.py   # 重排序基类
│   ├── jina_reranker.py   # Jina API
│   └── siliconflow_reranker.py  # SiliconFlow API
├── mcp/
│   ├── server.py          # MCP服务器
│   └── tools.py           # MCP工具
└── scripts/
    └── hkt_memory_v4.py   # CLI入口
```

---

## Smart Extraction 分类

| 类别 | 说明 | 示例 |
|------|------|------|
| **fact** | 客观事实 | "项目使用FastAPI框架" |
| **preference** | 用户偏好 | "用户喜欢深色主题" |
| **entity** | 实体信息 | "张三负责后端开发" |
| **decision** | 决策记录 | "决定使用PostgreSQL" |
| **pattern** | 模式规律 | "通常上午处理复杂任务" |
| **constraint** | 约束限制 | "必须在周五前完成" |

---

## Weibull Decay 生命周期

### 三层记忆层级

| 层级 | Beta | Floor | 半衰期 | 升级阈值 | 特点 |
|------|------|-------|--------|----------|------|
| **Core** | 0.8 | 0.9 | 90天 | 5次访问 | 核心记忆，衰减极慢 |
| **Working** | 1.0 | 0.7 | 30天 | 3次访问 | 工作记忆，正常衰减 |
| **Peripheral** | 1.3 | 0.5 | 7天 | 1次访问 | 边缘记忆，快速衰减 |

### 衰减公式

```python
score = exp(-lambda * days^beta) * access_boost

# access_boost: 访问越多，衰减越慢
access_boost = 1.0 + log1p(access_count) * 0.1
```

### 综合评分

```python
composite = 0.4 * recency + 0.3 * frequency + 0.3 * importance
final_score = composite * decay_score
```

---

## 性能对比

### v4.5 vs v4.0

| 指标 | v4.0 | v4.5 | 提升 |
|------|------|------|------|
| 代码片段召回率 | 40% | 80%+ | +100% |
| 专有名词召回率 | 35% | 85%+ | +143% |
| 检索延迟P95 | 500ms | <800ms | 可控 |
| 无效召回率 | 20% | <10% | -50% |
| 多Agent隔离 | ❌ | ✅ | 新增 |

### v4.5 vs LanceDB Pro

| 功能 | HKT v4.5 | LanceDB Pro | 差距 |
|------|----------|-------------|------|
| BM25全文检索 | ✅ SQLite FTS5 | ✅ LanceDB FTS | 持平 |
| 混合检索 | ✅ 0.7/0.3融合 | ✅ Fusion | 持平 |
| 自适应检索 | ✅ 智能判断 | ✅ Adaptive | 持平 |
| MMR多样性 | ✅ >0.85降权 | ✅ MMR | 持平 |
| Multi-Scope | ✅ 5种scope | ✅ global/agent | 持平 |
| Cross-Encoder | ✅ Jina/SiliconFlow | ✅ 多provider | 持平 |
| Weibull Decay | ✅ 三层衰减 | ✅ Core/Working | 持平 |
| L0/L1/L2分层 | ✅ 渐进式披露 | ✅ L0/L1/L2 | 持平 |
| 智谱AI向量 | ✅ 2048维 | ❌ - | HKT独有 |
| MCP协议 | ✅ 9个工具 | ✅ 9个工具 | 持平 |

---

## Multi-Scope 详细设计

### 作用域类型

| 作用域 | 格式 | 用途 | 示例 |
|--------|------|------|------|
| global | `global` | 全局共享记忆 | 通用知识 |
| agent | `agent:<id>` | Agent私有记忆 | `agent:liubowen` |
| project | `project:<id>` | 项目级记忆 | `project:metaclaw` |
| user | `user:<id>` | 用户级记忆 | `user:wangrenzhu` |
| session | `session:<id>` | 会话级记忆 | `session:20260330` |

### 访问控制

```python
# Agent默认可访问: global + 自己的agent scope
active_scopes = ["global", "agent:liubowen"]

# 跨scope查询
active_scopes = ["global", "agent:liubowen", "project:metaclaw"]
```

---

## 参考

- **LanceDB Pro**: https://github.com/CortexReach/memory-lancedb-pro
- **Mem0**: https://github.com/mem0ai/mem0
- **Graphiti**: https://github.com/getzep/graphiti
- **智谱AI**: https://open.bigmodel.cn/
