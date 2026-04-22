#!/usr/bin/env python3
"""
层间触发器

L2 写入完成后，自动触发 L1/L0 生成。
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

from .l1_extractor import L1Extractor, L1Summary
from .l0_extractor import L0Extractor, L0Abstract


class LayerTrigger:
    """
    分层存储触发器
    
    核心功能：
    1. L2 写入后自动触发 L1 提取
    2. L1 生成后自动触发 L0 提取
    3. 维护层间关联关系
    """
    
    def __init__(self, memory_dir: str, llm_provider: str = None):
        """
        初始化触发器
        
        Args:
            memory_dir: 记忆根目录
            llm_provider: LLM 提供商 (zhipu/openai/minimax)
        """
        self.memory_dir = Path(memory_dir)
        self.l1_extractor = L1Extractor(provider=llm_provider)
        self.l0_extractor = L0Extractor()
        
        # 确保目录结构
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        (self.memory_dir / "L0-Abstract" / "topics").mkdir(parents=True, exist_ok=True)
        (self.memory_dir / "L1-Overview" / "topics").mkdir(parents=True, exist_ok=True)
        (self.memory_dir / "L2-Full" / "daily").mkdir(parents=True, exist_ok=True)
        (self.memory_dir / "L2-Full" / "evergreen").mkdir(parents=True, exist_ok=True)
        (self.memory_dir / "L2-Full" / "episodes").mkdir(parents=True, exist_ok=True)

    def clear_aggregates(self) -> Dict[str, int]:
        removed = {"L0_topics": 0, "L1_topics": 0, "indexes": 0, "relationships": 0}
        for topic_file in (self.memory_dir / "L0-Abstract" / "topics").glob("*.md"):
            topic_file.unlink()
            removed["L0_topics"] += 1
        for topic_file in (self.memory_dir / "L1-Overview" / "topics").glob("*.md"):
            topic_file.unlink()
            removed["L1_topics"] += 1
        for index_file in [
            self.memory_dir / "L0-Abstract" / "index.md",
            self.memory_dir / "L1-Overview" / "index.md",
        ]:
            if index_file.exists():
                index_file.unlink()
                removed["indexes"] += 1
        relationships_file = self.memory_dir / "layer_relationships.json"
        if relationships_file.exists():
            relationships_file.unlink()
            removed["relationships"] += 1
        return removed

    def rebuild_from_entries(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        ordered_entries = sorted(entries, key=lambda item: item.get("timestamp", ""))
        cleared = self.clear_aggregates()
        rebuilt = 0
        for entry in ordered_entries:
            l2_id = entry.get("id")
            if not l2_id:
                continue
            self.on_l2_stored(
                l2_id=l2_id,
                content=entry.get("content", ""),
                title=entry.get("title", l2_id),
                topic=entry.get("topic", "general"),
                layer_type=entry.get("type", "daily"),
                enable_l1=True,
                enable_l0=True,
            )
            rebuilt += 1
        return {"success": True, "cleared": cleared, "rebuilt": rebuilt}
    
    def on_l2_stored(self, 
                     l2_id: str, 
                     content: str, 
                     title: str,
                     topic: str,
                     layer_type: str = "daily",
                     enable_l1: bool = True,
                     enable_l0: bool = True) -> Dict[str, str]:
        """
        L2 存储完成后的回调
        
        自动触发 L1 和 L0 的生成
        
        Args:
            l2_id: L2 记忆 ID
            content: L2 完整内容
            title: 标题
            topic: 主题
            layer_type: L2 类型 (daily/evergreen/episode)
            enable_l1: 是否生成 L1
            enable_l0: 是否生成 L0
            
        Returns:
            { "L2": l2_id, "L1": l1_id, "L0": l0_id }
        """
        topic = self._normalize_topic(topic)
        timestamp = datetime.now().isoformat()
        result = {"L2": l2_id}
        l1_summary = None
        
        print(f"\n[SYNC] LayerTrigger: L2 存储完成，触发分层提取...")
        print(f"   L2 ID: {l2_id}")
        print(f"   Topic: {topic}")
        print(f"   Title: {title}")
        
        # Step 1: 生成 L1
        if enable_l1:
            print(f"\n[LIST] Step 1/2: 提取 L1 摘要...")
            try:
                l1_summary = self._generate_l1(content, title, topic, l2_id, timestamp)
                result["L1"] = l1_summary.get("_id", "unknown")
                result["_triples"] = l1_summary.get("triples", [])
                result["_valid_until"] = l1_summary.get("valid_until")
                print(f"   [OK] L1 生成完成: {result['L1']}")
            except Exception as e:
                print(f"   [FAIL] L1 生成失败: {e}")
                import traceback
                traceback.print_exc()
        
        # Step 2: 生成 L0
        if enable_l0:
            print(f"\n[FLAG] Step 2/2: 提取 L0 索引...")
            try:
                # 如果有 L1，从 L1 提取；否则从内容直接提取
                if l1_summary:
                    l0_id = self._generate_l0_from_l1(l1_summary, topic, timestamp, l2_id)
                else:
                    l0_id = self._generate_l0_from_content(content, title, topic, timestamp, l2_id)
                result["L0"] = l0_id
                print(f"   [OK] L0 生成完成: {l0_id}")
            except Exception as e:
                print(f"   [FAIL] L0 生成失败: {e}")
                import traceback
                traceback.print_exc()
        
        # Step 3: 更新关系映射
        self._update_relationships(result)
        
        print(f"\n[SKILL] 分层提取完成: L2={result.get('L2', 'N/A')}, L1={result.get('L1', 'N/A')}, L0={result.get('L0', 'N/A')}")
        return result
    
    def _generate_l1(self, content: str, title: str, topic: str,
                     l2_id: str, timestamp: str) -> Dict:
        """生成 L1 摘要"""
        # 使用提取器
        summary = self.l1_extractor.extract(content, title)

        # 构建 L1 数据结构
        l1_data = summary.to_dict()
        l1_data.update({
            "_id": f"l1-{timestamp[:10]}-{hash(title) % 10000:04d}",
            "_timestamp": timestamp,
            "_topic": topic,
            "_source_l2": l2_id,
            "_layer": "L1"
        })

        # 存储到文件
        self._store_l1_file(l1_data, topic)

        return l1_data
    
    def _store_l1_file(self, l1_data: Dict, topic: str):
        """存储 L1 到文件"""
        # 存储到 topics/<topic>.md
        topic_file = self.memory_dir / "L1-Overview" / "topics" / f"{topic}.md"
        
        # 构建 Markdown 内容
        lines = [
            f"### {l1_data['title']}",
            "",
            f"- **时间**: {l1_data['_timestamp'][:10]}",
            f"- **摘要**: {l1_data['summary']}",
            f"- **重要性**: {l1_data['importance']}",
            f"- **来源**: [{l1_data['_source_l2']}](../L2-Full/daily/)",
            "",
        ]
        
        if l1_data.get('key_points'):
            lines.extend(["**关键要点**:", ""])
            for point in l1_data['key_points']:
                lines.append(f"- {point}")
            lines.append("")
        
        if l1_data.get('decisions'):
            lines.extend(["**决策记录**:", ""])
            for decision in l1_data['decisions']:
                lines.append(f"- {decision}")
            lines.append("")
        
        if l1_data.get('action_items'):
            lines.extend(["**行动项**:", ""])
            for item in l1_data['action_items']:
                task = item.get('task', '')
                owner = item.get('owner', '未分配')
                due = item.get('due', '未设定')
                lines.append(f"- [ ] {task} (@{owner}, {due})")
            lines.append("")
        
        if l1_data.get('people'):
            lines.append(f"**涉及人员**: {', '.join(l1_data['people'])}")
            lines.append("")

        if l1_data.get('topics'):
            lines.append(f"**标签**: {', '.join(l1_data['topics'])}")
            lines.append("")

        if l1_data.get('triples'):
            lines.append("**实体关系**: ")
            for triple in l1_data['triples']:
                if len(triple) >= 3:
                    lines.append(f"- {triple[0]} —[{triple[1]}]→ {triple[2]}")
            lines.append("")

        if l1_data.get('valid_until'):
            lines.append(f"**有效期至**: {l1_data['valid_until']}")
            lines.append("")

        lines.append("---")
        lines.append("")
        
        content = '\n'.join(lines)
        
        # 追加到文件（如果文件不存在则创建头部）
        if not topic_file.exists():
            header = f"# Topic: {topic}\n\n> 自动生成的 L1 摘要\n\n"
            topic_file.parent.mkdir(parents=True, exist_ok=True)
            topic_file.write_text(header + content, encoding='utf-8')
        else:
            with open(topic_file, 'a', encoding='utf-8') as f:
                f.write(content)
        
        # 更新索引
        self._update_l1_index(l1_data, topic)
    
    def _update_l1_index(self, l1_data: Dict, topic: str):
        """更新 L1 索引"""
        index_file = self.memory_dir / "L1-Overview" / "index.md"
        
        if not index_file.exists():
            content = """# L1 Overview Index

> L1 层索引 - 主题概览

## 主题列表

"""
            index_file.write_text(content, encoding='utf-8')
        
        index_content = index_file.read_text(encoding='utf-8')
        
        # 检查主题是否已索引
        topic_entry = f"- [{topic}]"
        if topic_entry not in index_content:
            with open(index_file, 'a', encoding='utf-8') as f:
                f.write(f"{topic_entry}(topics/{topic}.md) - 最后更新: {l1_data['_timestamp'][:10]}\n")
    
    def _generate_l0_from_l1(self, l1_data: Dict, topic: str, 
                             timestamp: str, l2_id: str) -> str:
        """从 L1 生成 L0"""
        abstract = self.l0_extractor.extract(l1_data, topic, timestamp, l2_id)
        return self._store_l0(abstract, topic)
    
    def _generate_l0_from_content(self, content: str, title: str, topic: str,
                                  timestamp: str, l2_id: str) -> str:
        """直接从内容生成 L0（L1 失败时的 fallback）"""
        # 构建一个临时的 L1 结构
        temp_l1 = {
            "title": title,
            "summary": content[:80] + "..." if len(content) > 80 else content,
            "key_points": [],
            "decisions": [],
            "people": [],
            "topics": [topic]
        }
        return self._generate_l0_from_l1(temp_l1, topic, timestamp, l2_id)
    
    def _store_l0(self, abstract: L0Abstract, topic: str) -> str:
        """存储 L0"""
        # 存储到 topics/<topic>.md
        topic_file = self.memory_dir / "L0-Abstract" / "topics" / f"{topic}.md"
        
        # 构建条目
        entry = f"""### {abstract.title}
- **时间**: {abstract.timestamp}
- **关键词**: {', '.join(abstract.keywords)}
- **核心**: {abstract.core_idea}
- **来源**: {abstract.source_l2}

"""
        
        # 追加到文件
        if not topic_file.exists():
            header = f"# Topic: {topic}\n\n"
            topic_file.parent.mkdir(parents=True, exist_ok=True)
            topic_file.write_text(header + entry, encoding='utf-8')
        else:
            with open(topic_file, 'a', encoding='utf-8') as f:
                f.write(entry)
        
        # 更新主索引
        self._update_l0_index(abstract)
        
        return f"l0-{abstract.timestamp}-{hash(abstract.title) % 10000:04d}"
    
    def _update_l0_index(self, abstract: L0Abstract):
        """更新 L0 主索引"""
        index_file = self.memory_dir / "L0-Abstract" / "index.md"
        
        # 读取现有索引
        if index_file.exists():
            content = index_file.read_text(encoding='utf-8')
        else:
            content = """# L0 Abstract Index

> 极简摘要层索引 - 用于快速初步检索

## 活跃主题

| 主题 | 关键词 | 最新条目 |
|------|--------|----------|

## 最新条目

"""
        
        # 检查是否需要添加主题到表格
        topic_line = f"| **{abstract.topic}** |"
        if topic_line not in content:
            # 在表格中添加主题行
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('|------'):
                    # 在分隔行后插入
                    lines.insert(i+1, f"{topic_line} {', '.join(abstract.keywords[:3])} | {abstract.timestamp} |")
                    break
            content = '\n'.join(lines)
        
        # 添加新条目到列表顶部
        entry_line = f"- [{abstract.timestamp}] **{abstract.title}** ({abstract.topic}): {abstract.core_idea}"
        
        if "## 最新条目" in content:
            parts = content.split("## 最新条目")
            header = parts[0] + "## 最新条目\n\n"
            rest = parts[1] if len(parts) > 1 else ""
            content = header + entry_line + "\n" + rest
        
        index_file.write_text(content, encoding='utf-8')
    
    def _update_relationships(self, result: Dict):
        """更新层间关系映射"""
        # 存储关系映射到文件
        rel_file = self.memory_dir / "layer_relationships.json"
        
        relationships = {}
        if rel_file.exists():
            relationships = json.loads(rel_file.read_text(encoding='utf-8'))
        
        l2_id = result.get('L2')
        if l2_id:
            relationships[l2_id] = {
                "L1": result.get('L1'),
                "L0": result.get('L0'),
                "timestamp": datetime.now().isoformat()
            }
        
        rel_file.write_text(json.dumps(relationships, indent=2, ensure_ascii=False), encoding='utf-8')
    
    def sync_all(self):
        """
        全量同步：从所有 L2 重新生成 L1 和 L0
        
        用途：
        - 首次迁移
        - 重新提取（更改提取策略后）
        - 修复损坏的索引
        """
        print("[SYNC] 开始全量同步...")
        cleared = self.clear_aggregates()
        print(f"   已清空聚合层: {cleared}")
        
        # 扫描所有 L2 文件
        l2_files = []
        for layer_type in ["daily", "evergreen", "episodes"]:
            layer_dir = self.memory_dir / "L2-Full" / layer_type
            if layer_dir.exists():
                l2_files.extend(layer_dir.glob("*.md"))
        
        print(f"   发现 {len(l2_files)} 个 L2 文件")
        
        # 逐个处理
        for i, l2_file in enumerate(l2_files, 1):
            print(f"\n   [{i}/{len(l2_files)}] 处理: {l2_file.name}")
            
            # 解析文件
            content = l2_file.read_text(encoding='utf-8')
            
            # 提取标题和主题（从文件名或内容）
            title = l2_file.stem
            topic = self._infer_topic(content)
            
            # 触发分层提取
            self.on_l2_stored(
                l2_id=l2_file.stem,
                content=content,
                title=title,
                topic=topic,
                layer_type="evergreen" if "evergreen" in str(l2_file) else "daily"
            )
        
        print(f"\n[OK] 全量同步完成，处理了 {len(l2_files)} 个文件")
    
    def _infer_topic(self, content: str) -> str:
        content_lower = content.lower()
        scores = {
            "boss-report": 0,
            "strategy": 0,
            "tools": 0,
            "risks": 0,
        }
        mapping = {
            "boss-report": ["boss", "ceo", "汇报", "口径", "老板", "替代表述"],
            "strategy": ["战略", "策略", "架构", "治理", "路线图", "优先级", "agent", "skill"],
            "tools": ["工具", "脚本", "自动化", "workflow", "修复", "依赖", "numpy", "目录映射"],
            "risks": ["风险", "问题", "报错", "故障", "阻塞", "告警"],
        }
        for topic, keywords in mapping.items():
            for kw in keywords:
                if kw in content_lower:
                    scores[topic] += 1
        metadata_topic_aliases = {
            "boss-report": ["boss-report", "meeting"],
            "strategy": ["strategy", "agent", "tech", "project"],
            "tools": ["tools", "tool", "general"],
            "risks": ["risks"],
        }
        for topic, aliases in metadata_topic_aliases.items():
            count = sum(content_lower.count(f'"topic": "{alias}"') for alias in aliases)
            if count > 0:
                scores[topic] += count * 3
        best_topic = max(scores.items(), key=lambda x: x[1])[0]
        if scores[best_topic] == 0:
            return "tools"
        return best_topic

    def _normalize_topic(self, topic: str) -> str:
        t = (topic or "").strip().lower()
        alias = {
            "agent": "strategy",
            "meeting": "boss-report",
            "tool": "tools",
            "tech": "strategy",
            "project": "strategy",
            "general": "tools",
        }
        return alias.get(t, t if t in {"boss-report", "strategy", "tools", "risks"} else "tools")
