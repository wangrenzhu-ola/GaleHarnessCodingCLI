"""
L2 Full Layer - Complete content storage
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Iterator
import re

from .query_matcher import match_query_corpus


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

        now = datetime.now()
        timestamp = now.strftime('%H:%M:%S')
        ms = now.strftime('%f')[:3]
        entry_id = f"{date}-{timestamp.replace(':', '')}-{ms}"

        daily_file = self.daily_path / f"{date}.md"

        # 将唯一 id 写入 metadata，确保解析时可区分同一秒条目
        metadata = dict(metadata) if metadata else {}
        metadata["id"] = entry_id

        # 构建条目
        entry_content = f"\n### {title} ({timestamp})\n"
        for line in content_lines:
            entry_content += f"- {line}\n"

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

    def iter_entries(self, scope: str = "all") -> List[Dict[str, Any]]:
        entries: List[Dict[str, Any]] = []

        if scope in ("all", "daily"):
            for daily_file in self.daily_path.glob("*.md"):
                entries.extend(self._iter_daily_entries(daily_file))

        if scope in ("all", "evergreen"):
            entries.extend(self._iter_evergreen_entries())

        if scope in ("all", "episodes"):
            for episode_file in self.episodes_path.glob("*.json"):
                data = json.loads(episode_file.read_text(encoding='utf-8'))
                metadata = data.get("metadata", {})
                topic = metadata.get("topic", "general")
                entries.append({
                    "id": data.get("id"),
                    "type": "episode",
                    "title": data.get("type", "episode"),
                    "content": data.get("content", ""),
                    "timestamp": data.get("timestamp", ""),
                    "topic": topic,
                    "scope": metadata.get("scope") or self._build_scope(topic),
                    "metadata": metadata,
                    "source_path": str(episode_file),
                })

        entries.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return entries

    def get_entry(self, memory_id: str) -> Optional[Dict[str, Any]]:
        for entry in self.iter_entries():
            if entry.get("id") == memory_id:
                return entry
        return None

    def delete_entry(self, memory_id: str) -> bool:
        entry = self.get_entry(memory_id)
        if not entry:
            return False

        if entry["type"] == "episode":
            episode_file = Path(entry["source_path"])
            if episode_file.exists():
                episode_file.unlink()
                return True
            return False

        source_path = Path(entry["source_path"])
        if not source_path.exists():
            return False

        content = source_path.read_text(encoding="utf-8")
        if entry["type"] == "daily":
            timestamp = entry.get("timestamp", "")
            time_str = timestamp[11:19] if "T" in timestamp else timestamp[-8:]
            marker = f"### {entry['title']} ({time_str})"
        else:
            marker = entry.get("header", "")

        if not marker:
            return False

        sections = re.split(r'(?=^### )', content, flags=re.MULTILINE)
        kept: List[str] = []
        removed = False
        for section in sections:
            if not section.strip():
                kept.append(section)
                continue
            if marker in section and (entry["type"] != "evergreen" or f"ID: {memory_id}" in section):
                removed = True
                continue
            kept.append(section)

        if not removed:
            return False

        source_path.write_text(''.join(kept).rstrip() + "\n", encoding="utf-8")
        return True
    
    def search(self, query: str, scope: str = "all") -> List[Dict[str, Any]]:
        """
        简单关键词搜索
        
        Args:
            query: 查询关键词
            scope: 搜索范围 (all/daily/evergreen/episodes)
            
        Returns:
            匹配结果列表
        """
        entries = list(self.iter_entries(scope=scope))
        haystacks = [
            "\n".join(
                [
                    str(entry.get("title", "")),
                    str(entry.get("content", "")),
                    str(entry.get("topic", "")),
                    json.dumps(entry.get("metadata", {}), ensure_ascii=False),
                ]
            )
            for entry in entries
        ]
        matches = match_query_corpus(query, haystacks)
        results = []
        for entry, combined, match in zip(entries, haystacks, matches):
            if not match["matched"]:
                continue
            results.append({
                'type': entry.get('type'),
                'id': entry.get('id'),
                'title': entry.get('title'),
                'topic': entry.get('topic'),
                'scope': entry.get('scope'),
                'timestamp': entry.get('timestamp'),
                'content': entry.get('content', ''),
                'preview': self._extract_preview(combined, query),
                '_match_score': match["score"],
                '_bm25_score': match["bm25_score"],
                '_debug_match': match,
            })
        results.sort(key=lambda item: (item.get("_match_score", 0.0), item.get("timestamp", "")), reverse=True)
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
        entries = self.iter_entries()
        total_tokens = sum(len(entry.get("content", "")) // 4 for entry in entries)

        return {
            'total_daily_files': len(list(self.daily_path.glob("*.md"))),
            'total_daily_entries': len([entry for entry in entries if entry.get("type") == "daily"]),
            'total_evergreen_entries': len([entry for entry in entries if entry.get("type") == "evergreen"]),
            'total_episodes': len([entry for entry in entries if entry.get("type") == "episode"]),
            'estimated_total_tokens': total_tokens
        }

    def _iter_daily_entries(self, daily_file: Path) -> List[Dict[str, Any]]:
        content = daily_file.read_text(encoding="utf-8")
        sections = re.split(r'(?=^### )', content, flags=re.MULTILINE)
        entries: List[Dict[str, Any]] = []
        for section in sections:
            lines = [line for line in section.strip().splitlines() if line.strip()]
            if not lines or not lines[0].startswith("### "):
                continue
            header = lines[0][4:].strip()
            match = re.match(r"(.+?) \((\d{2}:\d{2}:\d{2})\)$", header)
            if not match:
                continue
            title, time_str = match.groups()
            metadata = {}
            body_lines: List[str] = []
            for line in lines[1:]:
                if line.startswith("> Metadata:"):
                    raw = line.split(":", 1)[1].strip()
                    try:
                        metadata = json.loads(raw)
                    except json.JSONDecodeError:
                        metadata = {}
                elif line.startswith("- "):
                    body_lines.append(line[2:])
            topic = metadata.get("topic", "general")
            entry_id = metadata.get("id") or f"{daily_file.stem}-{time_str.replace(':', '')}"
            entries.append({
                "id": entry_id,
                "type": "daily",
                "title": title,
                "content": "\n".join(body_lines),
                "timestamp": f"{daily_file.stem}T{time_str}",
                "topic": topic,
                "scope": metadata.get("scope") or self._build_scope(topic),
                "metadata": metadata,
                "source_path": str(daily_file),
            })
        return entries

    def _iter_evergreen_entries(self) -> List[Dict[str, Any]]:
        memory_md = self.evergreen_path / "MEMORY.md"
        if not memory_md.exists():
            return []
        content = memory_md.read_text(encoding="utf-8")
        sections = re.split(r'(?=^### )', content, flags=re.MULTILINE)
        entries: List[Dict[str, Any]] = []
        for section in sections:
            lines = [line for line in section.strip().splitlines() if line.strip()]
            if not lines or not lines[0].startswith("### "):
                continue
            header = lines[0][4:].strip()
            id_line = next((line for line in lines if line.startswith("*ID: ")), "")
            match = re.match(r"\*ID: ([^ ]+) \| Created: ([^*]+)\*", id_line)
            if not match:
                continue
            memory_id, created = match.groups()
            metadata = {}
            body_lines: List[str] = []
            for line in lines[1:]:
                if line.startswith("> **Metadata**:"):
                    raw = line.split(":", 1)[1].strip()
                    try:
                        metadata = json.loads(raw)
                    except json.JSONDecodeError:
                        metadata = {}
                elif line.startswith("- "):
                    body_lines.append(line[2:])
            title = re.sub(r"^[^\w\u4e00-\u9fff]*\s*", "", header)
            category_match = re.match(r"(.+?) \[(.+?)\]$", title)
            category = "general"
            if category_match:
                title, category = category_match.groups()
            topic = metadata.get("topic", category)
            entries.append({
                "id": memory_id,
                "type": "evergreen",
                "title": title,
                "content": "\n".join(body_lines),
                "timestamp": created.strip().replace(" ", "T"),
                "topic": topic,
                "scope": metadata.get("scope") or self._build_scope(topic),
                "metadata": metadata,
                "source_path": str(memory_md),
                "header": f"### {header}",
            })
        return entries

    def _build_scope(self, topic: str) -> str:
        return f"topic:{topic or 'general'}"
