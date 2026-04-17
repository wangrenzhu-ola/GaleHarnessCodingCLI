"""
Layer Manager - 修复版本
修复了 L1/L0 自动分层提取的问题
"""

from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

from .l0_abstract import L0AbstractLayer
from .l1_overview import L1OverviewLayer
from .l2_full import L2FullLayer

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from vector_store import VectorStore


class LayerManager:
    """分层存储管理器 - 修复版"""
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        
        # 初始化各层
        self.l0 = L0AbstractLayer(self.base_path / "L0-Abstract")
        self.l1 = L1OverviewLayer(self.base_path / "L1-Overview")
        self.l2 = L2FullLayer(self.base_path / "L2-Full")
        
        # 初始化向量存储
        self.vector_store = VectorStore(str(self.base_path / "vector_store.db"))
    
    def store(self,
              content: str,
              title: str = "",
              layer: str = "L2",
              topic: str = "general",
              metadata: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        分层存储记忆 - 修复版
        
        当 layer="all" 时，自动从 L2 内容提取生成 L1 和 L0
        """
        ids = {}
        metadata = metadata or {}
        
        # Step 1: 始终存储到 L2 (Source of Truth)
        content_lines = content.split('\n')
        l2_id = self.l2.store_daily(
            title=title or "Untitled",
            content_lines=content_lines,
            metadata=metadata
        )
        ids['L2'] = l2_id
        
        # Step 2: 如果是 all 模式，自动提取 L1
        if layer in ("L1", "all"):
            # 🔧 修复：自动生成 L1 摘要，不依赖 session_id/project_id
            l1_summary = self._generate_l1_summary(content, title)
            l1_id = self._store_l1_from_summary(
                topic=topic,
                summary=l1_summary,
                source_l2_id=l2_id,
                metadata=metadata
            )
            ids['L1'] = l1_id
        
        # Step 3: 如果是 all 模式，自动提取 L0
        if layer in ("L0", "all"):
            # 🔧 修复：生成真正的摘要，不只是截断
            abstract = self._generate_smart_abstract(content, title, topic)
            l0_id = self.l0.store(
                content=abstract,
                topic=topic,
                source=l2_id,
                metadata={**metadata, "l1_id": ids.get('L1', '')}
            )
            ids['L0'] = l0_id
        
        return ids
    
    def _generate_l1_summary(self, content: str, title: str) -> Dict[str, Any]:
        """
        从 L2 内容生成 L1 结构化摘要
        
        Returns:
            {
                "title": "标题",
                "summary": "一句话摘要",
                "key_points": ["要点1", "要点2", ...],
                "decisions": ["决策1", ...],
                "metadata": {...}
            }
        """
        lines = [l.strip() for l in content.split('\n') if l.strip()]
        
        # 提取标题
        extracted_title = title
        if not extracted_title and lines:
            # 第一行非空内容作为标题
            first_line = lines[0]
            if first_line.startswith('# '):
                extracted_title = first_line[2:].strip()
            elif first_line.startswith('## '):
                extracted_title = first_line[3:].strip()
            else:
                extracted_title = first_line[:50]
        
        # 生成一句话摘要（取前100字符）
        summary = content.replace('\n', ' ')[:100]
        if len(content) > 100:
            summary += "..."
        
        # 提取关键要点（Markdown 列表项）
        key_points = []
        for line in lines[:10]:  # 最多10条
            if line.startswith(('- ', '* ', '+ ')):
                key_points.append(line[2:].strip()[:100])
            elif line.startswith(('1. ', '2. ', '3. ')):
                key_points.append(line[3:].strip()[:100])
        
        # 如果没找到列表项，取前3个非标题行
        if not key_points:
            key_points = [
                l[:100] for l in lines[1:4] 
                if l and not l.startswith('#')
            ]
        
        # 提取决策（包含关键词的行）
        decisions = []
        decision_keywords = ['决策', '决定', '确定', '采用', '选择', '确认', 'decision', 'decided']
        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in decision_keywords):
                decisions.append(line[:150])
        
        return {
            "title": extracted_title or "Untitled",
            "summary": summary,
            "key_points": key_points[:5],  # 最多5个要点
            "decisions": decisions[:3],     # 最多3个决策
            "metadata": {
                "source": "auto_extract",
                "extract_time": datetime.now().isoformat(),
                "original_length": len(content)
            }
        }
    
    def _store_l1_from_summary(self, topic: str, summary: Dict[str, Any], 
                               source_l2_id: str, metadata: Dict) -> str:
        """将 L1 摘要存储到统一的 topics 概览文件"""
        timestamp = datetime.now().isoformat()
        
        # 构建表格行格式的 L1 记录
        entry = {
            "id": f"l1-{timestamp[:10]}-{hash(summary['title']) % 10000:04d}",
            "timestamp": timestamp,
            "topic": topic,
            "title": summary["title"],
            "summary": summary["summary"],
            "key_points": summary["key_points"],
            "decisions": summary["decisions"],
            "source_l2": source_l2_id,
            "metadata": {**metadata, **summary.get("metadata", {})}
        }
        
        # 存储到 topics/<topic>.md
        topic_file = self.l1.base_path / "topics" / f"{topic}.md"
        topic_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 追加到文件
        self._append_l1_entry(topic_file, entry)
        
        # 更新 L1 索引
        self._update_l1_index(entry)
        
        return entry["id"]
    
    def _append_l1_entry(self, topic_file: Path, entry: Dict):
        """追加 L1 条目到主题文件"""
        if not topic_file.exists():
            header = f"# Topic Overview: {entry['topic']}\n\n"
            header += "| 时间 | 标题 | 摘要 | 来源 |\n"
            header += "|------|------|------|------|\n"
            topic_file.write_text(header, encoding='utf-8')
        
        # 追加表格行
        row = f"| {entry['timestamp'][:10]} | {entry['title'][:30]} | {entry['summary'][:50]}... | [L2]({entry['source_l2']}) |\n"
        
        # 在文件末尾添加详细内容
        with open(topic_file, 'a', encoding='utf-8') as f:
            f.write(row)
            f.write(f"\n### {entry['title']}\n")
            f.write(f"- **摘要**: {entry['summary']}\n")
            if entry['key_points']:
                f.write("- **要点**:\n")
                for pt in entry['key_points']:
                    f.write(f"  - {pt}\n")
            if entry['decisions']:
                f.write("- **决策**:\n")
                for d in entry['decisions']:
                    f.write(f"  - {d}\n")
            f.write("\n")
    
    def _update_l1_index(self, entry: Dict):
        """更新 L1 的索引文件"""
        index_file = self.l1.base_path / "index.md"
        
        if not index_file.exists():
            index_content = """# L1 Overview Index

> 中等粒度层索引 - 会话和项目概览

## 主题列表

"""
            index_file.write_text(index_content, encoding='utf-8')
        else:
            index_content = index_file.read_text(encoding='utf-8')
        
        # 检查主题是否已在索引中
        topic_link = f"- [{entry['topic']}]"
        if topic_link not in index_content:
            with open(index_file, 'a', encoding='utf-8') as f:
                f.write(f"{topic_link}({entry['topic']}) - 最后更新: {entry['timestamp'][:10]}\n")
    
    def _generate_smart_abstract(self, content: str, title: str, topic: str) -> str:
        """
        生成智能摘要（L0 层）
        
        提取：主题 + 核心关键词 + 一句话摘要
        """
        # 提取关键词（简单启发式）
        keywords = []
        keyword_indicators = ['**', '`', '「', '『']
        for indicator in keyword_indicators:
            parts = content.split(indicator)
            for i, part in enumerate(parts[1::2]):  # 取标记之间的内容
                word = part.split(indicator)[0] if indicator in part else part
                if 2 < len(word) < 20 and word not in keywords:
                    keywords.append(word)
                if len(keywords) >= 5:
                    break
        
        # 一句话摘要
        first_sentence = content.replace('\n', ' ').split('.')[0].split('。')[0][:80]
        
        # 构建 L0 格式
        abstract_parts = [f"【{topic}】"]
        if title:
            abstract_parts.append(f"{title[:30]}")
        if keywords:
            abstract_parts.append(f"关键词: {', '.join(keywords[:4])}")
        abstract_parts.append(f"摘要: {first_sentence}...")
        
        return " | ".join(abstract_parts)
    
    def retrieve(self,
                 query: str = "",
                 layer: str = "L0",
                 topic: Optional[str] = None,
                 limit: int = 10) -> List[Dict[str, Any]]:
        """分层检索"""
        if layer == "L0":
            return self.l0.retrieve(query=query, topic=topic, limit=limit)
        elif layer == "L1":
            # 🔧 修复：支持从 topics 文件检索
            return self._retrieve_l1(query=query, topic=topic, limit=limit)
        elif layer == "L2":
            return self.l2.search(query=query)
        else:
            raise ValueError(f"Unknown layer: {layer}")
    
    def _retrieve_l1(self, query: str, topic: Optional[str], limit: int) -> List[Dict[str, Any]]:
        """从 L1 topics 文件检索"""
        results = []
        
        if topic:
            topic_files = [self.l1.base_path / "topics" / f"{topic}.md"]
        else:
            topic_files = list((self.l1.base_path / "topics").glob("*.md"))
        
        for topic_file in topic_files:
            if not topic_file.exists():
                continue
            
            content = topic_file.read_text(encoding='utf-8')
            
            # 简单关键词匹配
            if not query or query.lower() in content.lower():
                # 解析表格行
                for line in content.split('\n'):
                    if line.startswith('| ') and '时间' not in line and '---' not in line:
                        parts = [p.strip() for p in line.split('|')[1:-1]]
                        if len(parts) >= 4:
                            results.append({
                                'timestamp': parts[0],
                                'title': parts[1],
                                'summary': parts[2],
                                'source': parts[3],
                                'topic': topic_file.stem
                            })
        
        return results[:limit]
    
    def progressive_retrieve(self,
                            query: str,
                            limit_per_layer: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """渐进式检索"""
        return {
            'L0': self.l0.retrieve(query=query, limit=limit_per_layer),
            'L1': self._retrieve_l1(query=query, topic=None, limit=limit_per_layer),
            'L2': self.l2.search(query=query)[:limit_per_layer]
        }
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取各层统计信息"""
        # 🔧 修复：包含新的 topics 目录统计
        l1_stats = self.l1.get_stats()
        
        # 添加 topics 统计
        topics_dir = self.l1.base_path / "topics"
        if topics_dir.exists():
            l1_stats['topics_files'] = len(list(topics_dir.glob("*.md")))
        
        return {
            'L0': self.l0.get_stats(),
            'L1': l1_stats,
            'L2': self.l2.get_stats()
        }
