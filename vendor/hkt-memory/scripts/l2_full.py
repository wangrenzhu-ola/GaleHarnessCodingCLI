"""
L2 Full Layer - Complete content storage
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Iterator
import re


class L2FullLayer:
    """
    L2层：完整内容层
    - 存储完整记忆内容
    - 支持每日日志、永久记忆、原始episode
    - 作为Source of Truth
    """
    
    MAX_CHUNK_TOKENS = 4000
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.daily_path = self.base_path / "daily"
        self.evergreen_path = self.base_path / "evergreen"
        self.episodes_path = self.base_path / "episodes"
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.daily_path.mkdir(exist_ok=True)
        self.evergreen_path.mkdir(exist_ok=True)
        self.episodes_path.mkdir(exist_ok=True)
        
        # 确保MEMORY.md存在
        memory_md = self.evergreen_path / "MEMORY.md"
        if not memory_md.exists():
            memory_md.write_text(
                "# Evergreen Memory\n\n永久记忆存储。\n",
                encoding='utf-8'
            )
    
    def store_daily(self, 
                    title: str,
                    content_lines: List[str],
                    date: Optional[str] = None,
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储每日日志
        
        Args:
            title: 标题
            content_lines: 内容行列表
            date: 日期 (YYYY-MM-DD)，默认今天
            metadata: 元数据
            
        Returns:
            条目ID
        """
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        timestamp = datetime.now().strftime('%H:%M:%S')
        entry_id = f"{date}-{timestamp.replace(':', '')}"
        
        daily_file = self.daily_path / f"{date}.md"
        
        # 构建条目
        entry_content = f"\n### {title} ({timestamp})\n"
        for line in content_lines:
            entry_content += f"- {line}\n"
        
        if metadata:
            entry_content += f"\n> Metadata: {json.dumps(metadata, ensure_ascii=False)}\n"
        
        # 写入文件
        if daily_file.exists():
            with open(daily_file, 'a', encoding='utf-8') as f:
                f.write(entry_content)
        else:
            header = f"# Daily Memory: {date}\n\n"
            daily_file.write_text(header + entry_content, encoding='utf-8')
        
        return entry_id
    
    def store_evergreen(self,
                        title: str,
                        content_lines: List[str],
                        category: str = "general",
                        importance: str = "medium",
                        metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储永久记忆
        
        Args:
            title: 标题
            content_lines: 内容行列表
            category: 分类
            importance: 重要性 (high/medium/low)
            metadata: 元数据
            
        Returns:
            条目ID
        """
        timestamp = datetime.now().isoformat()
        entry_id = hashlib.sha256(f"{title}{timestamp}".encode()).hexdigest()[:12]
        
        memory_md = self.evergreen_path / "MEMORY.md"
        
        # 构建条目
        importance_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(importance, "⚪")
        entry_content = f"\n### {importance_icon} {title} [{category}]\n"
        entry_content += f"*ID: {entry_id} | Created: {timestamp[:19]}*\n\n"
        
        for line in content_lines:
            entry_content += f"- {line}\n"
        
        if metadata:
            entry_content += f"\n> **Metadata**: {json.dumps(metadata, ensure_ascii=False)}\n"
        
        # 追加到文件
        with open(memory_md, 'a', encoding='utf-8') as f:
            f.write(entry_content)
        
        return entry_id
    
    def store_episode(self,
                      episode_type: str,
                      content: str,
                      source: str = "",
                      parent_id: Optional[str] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储原始episode
        
        Args:
            episode_type: episode类型 (conversation/action/observation)
            content: 原始内容
            source: 来源
            parent_id: 父episode ID
            metadata: 元数据
            
        Returns:
            episode ID
        """
        timestamp = datetime.now().isoformat()
        episode_id = f"ep-{hashlib.sha256(f'{content}{timestamp}'.encode()).hexdigest()[:10]}"
        
        episode_file = self.episodes_path / f"{episode_id}.json"
        
        episode_data = {
            "id": episode_id,
            "type": episode_type,
            "timestamp": timestamp,
            "content": content,
            "source": source,
            "parent_id": parent_id,
            "metadata": metadata or {}
        }
        
        episode_file.write_text(
            json.dumps(episode_data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        
        return episode_id
    
    def get_daily(self, date: str) -> Optional[str]:
        """获取特定日期的日志"""
        daily_file = self.daily_path / f"{date}.md"
        if daily_file.exists():
            return daily_file.read_text(encoding='utf-8')
        return None
    
    def get_evergreen(self) -> str:
        """获取永久记忆"""
        memory_md = self.evergreen_path / "MEMORY.md"
        if memory_md.exists():
            return memory_md.read_text(encoding='utf-8')
        return ""
    
    def get_episode(self, episode_id: str) -> Optional[Dict[str, Any]]:
        """获取episode"""
        episode_file = self.episodes_path / f"{episode_id}.json"
        if episode_file.exists():
            return json.loads(episode_file.read_text(encoding='utf-8'))
        return None
    
    def list_dailies(self, start_date: Optional[str] = None, 
                     end_date: Optional[str] = None) -> List[str]:
        """列出日期范围内的日志"""
        dates = []
        for f in self.daily_path.glob("*.md"):
            date = f.stem
            if start_date and date < start_date:
                continue
            if end_date and date > end_date:
                continue
            dates.append(date)
        return sorted(dates, reverse=True)
    
    def list_episodes(self, episode_type: Optional[str] = None) -> List[Dict[str, str]]:
        """列出episodes"""
        episodes = []
        for f in self.episodes_path.glob("*.json"):
            data = json.loads(f.read_text(encoding='utf-8'))
            if episode_type is None or data.get('type') == episode_type:
                episodes.append({
                    'id': data.get('id'),
                    'type': data.get('type'),
                    'timestamp': data.get('timestamp'),
                    'source': data.get('source', '')
                })
        return sorted(episodes, key=lambda x: x['timestamp'], reverse=True)
    
    def search(self, query: str, scope: str = "all") -> List[Dict[str, Any]]:
        """
        简单关键词搜索
        
        Args:
            query: 查询关键词
            scope: 搜索范围 (all/daily/evergreen/episodes)
            
        Returns:
            匹配结果列表
        """
        results = []
        query_lower = query.lower()
        
        if scope in ("all", "daily"):
            for daily_file in self.daily_path.glob("*.md"):
                content = daily_file.read_text(encoding='utf-8')
                if query_lower in content.lower():
                    results.append({
                        'type': 'daily',
                        'date': daily_file.stem,
                        'preview': self._extract_preview(content, query)
                    })
        
        if scope in ("all", "evergreen"):
            evergreen_content = self.get_evergreen()
            if query_lower in evergreen_content.lower():
                results.append({
                    'type': 'evergreen',
                    'file': 'MEMORY.md',
                    'preview': self._extract_preview(evergreen_content, query)
                })
        
        if scope in ("all", "episodes"):
            for episode in self.list_episodes():
                episode_data = self.get_episode(episode['id'])
                if episode_data and query_lower in episode_data.get('content', '').lower():
                    results.append({
                        'type': 'episode',
                        'id': episode['id'],
                        'preview': self._extract_preview(episode_data.get('content', ''), query)
                    })
        
        return results
    
    def _extract_preview(self, content: str, query: str, context: int = 50) -> str:
        """提取关键词周围的预览文本"""
        query_lower = query.lower()
        content_lower = content.lower()
        
        idx = content_lower.find(query_lower)
        if idx == -1:
            return content[:200] + "..." if len(content) > 200 else content
        
        start = max(0, idx - context)
        end = min(len(content), idx + len(query) + context)
        
        preview = content[start:end]
        if start > 0:
            preview = "..." + preview
        if end < len(content):
            preview = preview + "..."
        
        return preview
    
    def get_stats(self) -> Dict[str, Any]:
        """获取L2层统计信息"""
        daily_count = len(list(self.daily_path.glob("*.md")))
        episode_count = len(list(self.episodes_path.glob("*.json")))
        
        # 计算evergreen条目数
        evergreen_content = self.get_evergreen()
        evergreen_entries = evergreen_content.count("### ")
        
        # 计算总token数（估算）
        total_tokens = 0
        for daily_file in self.daily_path.glob("*.md"):
            content = daily_file.read_text(encoding='utf-8')
            total_tokens += len(content) // 4
        
        total_tokens += len(evergreen_content) // 4
        
        return {
            'total_daily_files': daily_count,
            'total_evergreen_entries': evergreen_entries,
            'total_episodes': episode_count,
            'estimated_total_tokens': total_tokens
        }
