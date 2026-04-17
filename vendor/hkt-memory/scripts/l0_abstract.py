"""
L0 Abstract Layer - Minimal summaries for fast retrieval
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import re


class L0AbstractLayer:
    """
    L0层：极简摘要层
    - 存储高度压缩的记忆摘要 (50-100 tokens)
    - 用于快速初步检索
    - 维护全局索引和主题映射
    """
    
    MAX_TOKENS = 100
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.index_path = self.base_path / "index.md"
        self.topics_path = self.base_path / "topics"
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.topics_path.mkdir(exist_ok=True)
        if not self.index_path.exists():
            self._init_index()
    
    def _init_index(self):
        """初始化索引文件"""
        content = """# L0 Abstract Index

> 极简摘要层索引 - 用于快速初步检索

## 结构

- 每个主题一个摘要文件
- 自动维护关键词映射
- 支持跨主题关联

## 主题列表

"""
        self.index_path.write_text(content, encoding='utf-8')
    
    def _estimate_tokens(self, text: str) -> int:
        """估算token数（中文字符按1.5倍计算）"""
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        other_chars = len(text) - chinese_chars
        return int(chinese_chars * 1.5 + other_chars * 0.25)
    
    def _generate_id(self, content: str, timestamp: str) -> str:
        """生成唯一ID"""
        data = f"{content}{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:12]
    
    def store(self, 
              content: str, 
              topic: str = "general",
              source: str = "",
              metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储L0层摘要
        
        Args:
            content: 摘要内容
            topic: 主题分类
            source: 来源标识
            metadata: 附加元数据
            
        Returns:
            生成的记忆ID
        """
        timestamp = datetime.now().isoformat()
        memory_id = self._generate_id(content, timestamp)
        
        # 检查token限制
        tokens = self._estimate_tokens(content)
        if tokens > self.MAX_TOKENS:
            content = self._truncate_content(content)
        
        # 构建摘要条目
        entry = {
            "id": memory_id,
            "timestamp": timestamp,
            "topic": topic,
            "source": source,
            "content": content,
            "tokens": min(tokens, self.MAX_TOKENS),
            "metadata": metadata or {}
        }
        
        # 存储到主题文件
        topic_file = self.topics_path / f"{topic}.md"
        self._append_to_topic(topic_file, entry)
        
        # 更新索引
        self._update_index(entry)
        
        return memory_id
    
    def _truncate_content(self, content: str) -> str:
        """截断内容到最大token数"""
        # 简单策略：按字符截断，保留前MAX_TOKENS*2个字符
        max_chars = self.MAX_TOKENS * 2
        if len(content) <= max_chars:
            return content
        return content[:max_chars-3] + "..."
    
    def _append_to_topic(self, topic_file: Path, entry: Dict):
        """追加到主题文件"""
        if not topic_file.exists():
            header = f"# Topic: {entry['topic']}\n\n"
            topic_file.write_text(header, encoding='utf-8')
        
        content = f"""\n### {entry['id']} [{entry['timestamp'][:19]}]
- **Content**: {entry['content']}
- **Source**: {entry['source']}
- **Tokens**: {entry['tokens']}
"""
        if entry['metadata']:
            content += f"- **Metadata**: {json.dumps(entry['metadata'], ensure_ascii=False)}\n"
        
        with open(topic_file, 'a', encoding='utf-8') as f:
            f.write(content)
    
    def _update_index(self, entry: Dict):
        """更新主索引"""
        # 读取现有索引
        index_content = self.index_path.read_text(encoding='utf-8')
        
        # 检查主题是否已存在
        topic_line = f"- [{entry['topic']}]"
        if topic_line not in index_content:
            # 添加新主题到索引
            with open(self.index_path, 'a', encoding='utf-8') as f:
                f.write(f"\n{topic_line} - {entry['timestamp'][:10]}\n")
    
    def retrieve(self, 
                 query: str = "",
                 topic: Optional[str] = None,
                 limit: int = 10) -> List[Dict[str, Any]]:
        """
        检索L0层摘要
        
        Args:
            query: 查询关键词（可选）
            topic: 主题过滤（可选）
            limit: 返回数量限制
            
        Returns:
            摘要条目列表
        """
        results = []
        
        if topic:
            # 从特定主题检索
            topic_file = self.topics_path / f"{topic}.md"
            if topic_file.exists():
                results = self._parse_topic_file(topic_file)
        else:
            # 从所有主题检索
            for topic_file in self.topics_path.glob("*.md"):
                results.extend(self._parse_topic_file(topic_file))
        
        # 简单关键词过滤
        if query:
            query_lower = query.lower()
            results = [
                r for r in results 
                if query_lower in r.get('content', '').lower()
            ]
        
        # 按时间排序，返回最新
        results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return results[:limit]
    
    def _parse_topic_file(self, topic_file: Path) -> List[Dict[str, Any]]:
        """解析主题文件"""
        results = []
        content = topic_file.read_text(encoding='utf-8')
        
        # 简单解析：按###分割
        sections = content.split('###')[1:]  # 跳过标题
        
        for section in sections:
            lines = section.strip().split('\n')
            if not lines:
                continue
            
            # 解析ID和时间戳
            header = lines[0].strip()
            memory_id = header.split()[0] if ' ' in header else header
            timestamp = header[header.find('[')+1:header.find(']')] if '[' in header else ''
            
            # 解析内容
            content_line = next((l for l in lines if '**Content**' in l), '')
            content = content_line.split(':', 1)[1].strip() if ':' in content_line else ''
            
            # 解析来源
            source_line = next((l for l in lines if '**Source**' in l), '')
            source = source_line.split(':', 1)[1].strip() if ':' in source_line else ''
            
            results.append({
                'id': memory_id,
                'timestamp': timestamp,
                'topic': topic_file.stem,
                'content': content,
                'source': source
            })
        
        return results
    
    def get_topics(self) -> List[str]:
        """获取所有主题列表"""
        return [f.stem for f in self.topics_path.glob("*.md")]
    
    def get_stats(self) -> Dict[str, Any]:
        """获取L0层统计信息"""
        stats = {
            'total_topics': len(list(self.topics_path.glob("*.md"))),
            'total_entries': 0,
            'topics': {}
        }
        
        for topic_file in self.topics_path.glob("*.md"):
            content = topic_file.read_text(encoding='utf-8')
            # 计算条目数（按###分割）
            count = content.count('###')
            stats['total_entries'] += count
            stats['topics'][topic_file.stem] = count
        
        return stats
