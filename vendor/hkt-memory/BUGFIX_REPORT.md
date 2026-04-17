# HKT-Memory Bug 修复报告

> 问题: `--layer all` 不会自动创建 L0 和 L1

---

## 问题总结

| 层级 | 当前行为 | 期望行为 | 状态 |
|------|----------|----------|------|
| **L2** | ✅ 正常存储到 daily | 正常存储 | ✅ |
| **L1** | ❌ 只有提供 `session_id`/`project_id` 才存储 | 自动提取摘要存储 | 🔧 已修复 |
| **L0** | ⚠️ 存储但只是简单截断 | 智能摘要 + 关键词 | 🔧 已修复 |

---

## Bug 1: L1 存储逻辑过于苛刻

### 问题代码

```python
# layers/manager.py 第71-90行
if layer in ("L1", "all") and metadata:  # ❌ 必须有 metadata
    if 'session_id' in metadata:         # ❌ 必须有 session_id
        l1_id = self.l1.store_session(...)
    elif 'project_id' in metadata:       # ❌ 必须有 project_id
        l1_id = self.l1.store_project(...)
```

### 后果

```bash
# 正常使用场景
$ hkt_memory store --content "长文本..." --layer all
# 结果: 只存了 L2，L1 为空
```

### 修复方案

```python
# 新的自动提取逻辑
if layer in ("L1", "all"):
    l1_summary = self._generate_l1_summary(content, title)  # 🔧 自动提取
    l1_id = self._store_l1_from_summary(...)                # 🔧 存储到 topics
```

**L1 摘要格式**:
```markdown
# Topic Overview: general

| 时间 | 标题 | 摘要 | 来源 |
|------|------|------|------|
| 2026-04-08 | MiniMax语音转纪要 | 基于 MiniMax CodePlan API 的语音转文字... | [L2](...) |

### MiniMax语音转纪要
- **摘要**: 基于 MiniMax CodePlan API 的语音转文字工具...
- **要点**:
  - 支持多种音频格式
  - 一键生成会议纪要
- **决策**:
  - 采用 MiniMax API 而非飞书
```

---

## Bug 2: L0 只是简单截断

### 问题代码

```python
def _generate_abstract(content: str, max_length: int = 150) -> str:
    content = content.replace('\n', ' ').strip()
    if len(content) <= max_length:
        return content
    return content[:max_length] + "..."  # ❌ 只是截断
```

### 修复方案

```python
def _generate_smart_abstract(content: str, title: str, topic: str) -> str:
    # 提取关键词
    keywords = extract_keywords(content)  # 🔧 从 **加粗**、`代码` 中提取
    
    # 一句话摘要
    first_sentence = extract_first_sentence(content)
    
    # 结构化格式
    return f"【{topic}】| {title} | 关键词: {keywords} | 摘要: {first_sentence}..."
```

**L0 摘要示例**:
```
【tools】| MiniMax语音转纪要 | 关键词: MiniMax, ASR, 会议纪要, 语音转文字 | 
摘要: 基于 MiniMax CodePlan API 的语音转文字工具，支持一键将录音文件转为结构化会议纪要...
```

---

## 修复文件

| 文件 | 说明 |
|------|------|
| `layers/manager.py` | 原文件（有bug） |
| `layers/manager_fixed.py` | 修复版本 |

---

## 测试修复版

```bash
# 1. 备份原文件
cd .claude/skills/hkt-memory
mv layers/manager.py layers/manager_original.py
mv layers/manager_fixed.py layers/manager.py

# 2. 测试存储
python3 scripts/hkt_memory_v4.py store \
  --content "# 测试标题\n\n这是一个测试内容。\n\n## 要点\n- 要点1\n- 要点2\n\n## 决策\n- 确定采用方案A" \
  --title "测试记忆" \
  --topic "test" \
  --layer all

# 3. 验证三层是否都创建了
cat memory/L0-Abstract/topics/test.md   # ✅ 应该有内容
cat memory/L1-Overview/topics/test.md   # ✅ 应该有内容  
cat memory/L2-Full/daily/2026-04-08.md  # ✅ 应该有内容
```

---

## 使用方式对比

### 修复前（无法自动分层）

```bash
# 只存 L2（L1/L0 为空）
hkt_memory store --content "长内容..." --layer all

# 存 L1（必须手动指定 metadata）
hkt_memory store --content "内容..." --layer L1 \
  --metadata '{"session_id": "abc123"}'
```

### 修复后（自动分层）

```bash
# ✅ 自动创建 L2 + L1 + L0
hkt_memory store --content "长内容..." --layer all

# ✅ 从 L2 自动提取并创建 L1
hkt_memory store --content "内容..." --layer L1
```

---

## 建议后续改进

1. **AI 摘要提取**: 当前使用规则提取，可接入 LLM 生成更好的摘要
2. **关键词提取**: 使用 TF-IDF 或 embedding 提取真正重要的关键词
3. **自动 topic 分类**: 根据内容自动推断 topic，而非手动指定

---

*修复时间: 2026-04-08*
