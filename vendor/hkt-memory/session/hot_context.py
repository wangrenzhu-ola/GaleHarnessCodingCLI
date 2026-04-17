"""
Hot Context Management - Fast session context loading
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class SessionStateManager:
    """
    会话状态管理器
    
    管理:
    - CURRENT.md: 当前会话热上下文
    - RECENT.md: 最近N轮摘要
    """
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.session_dir = self.base_path / "session-state"
        self.current_file = self.session_dir / "CURRENT.md"
        self.recent_file = self.session_dir / "RECENT.md"
        
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        self.session_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.current_file.exists():
            self._init_current()
        
        if not self.recent_file.exists():
            self._init_recent()
    
    def _init_current(self):
        """初始化CURRENT.md"""
        header = """# Current Session Context

> 当前会话热上下文 - 快速加载

## Session Info

- **Started**: {timestamp}
- **Last Updated**: {timestamp}
- **Message Count**: 0

## Active Topics

<!-- 当前讨论中的主题 -->

## Key Decisions

<!-- 本次会话中的关键决策 -->

## Context Summary

<!-- 会话摘要 -->

---
*This file is auto-updated during the session*
"""
        timestamp = datetime.now().isoformat()
        self.current_file.write_text(
            header.format(timestamp=timestamp),
            encoding='utf-8'
        )
    
    def _init_recent(self):
        """初始化RECENT.md"""
        header = """# Recent Highlights

> 最近N轮会话摘要

## Recent Sessions

"""
        self.recent_file.write_text(header, encoding='utf-8')
    
    def update_current(self, 
                       topics: List[str] = None,
                       decisions: List[str] = None,
                       summary: str = None,
                       message_count: int = None):
        """
        更新当前会话上下文
        
        Args:
            topics: 当前主题列表
            decisions: 关键决策列表
            summary: 会话摘要
            message_count: 消息数量
        """
        content = self.current_file.read_text(encoding='utf-8')
        timestamp = datetime.now().isoformat()
        
        # 更新最后更新时间
        content = self._update_field(content, "Last Updated", timestamp)
        
        # 更新消息数量
        if message_count is not None:
            content = self._update_field(content, "Message Count", str(message_count))
        
        # 更新主题
        if topics:
            content = self._update_section(content, "Active Topics", 
                                          "\n".join([f"- {t}" for t in topics]))
        
        # 更新决策
        if decisions:
            content = self._update_section(content, "Key Decisions",
                                          "\n".join([f"- {d}" for d in decisions]))
        
        # 更新摘要
        if summary:
            content = self._update_section(content, "Context Summary", summary)
        
        self.current_file.write_text(content, encoding='utf-8')
    
    def _update_field(self, content: str, field: str, value: str) -> str:
        """更新字段值"""
        import re
        pattern = rf"(\*\*{field}\*\*: ).*$"
        replacement = rf"\g<1>{value}"
        return re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    def _update_section(self, content: str, section: str, new_content: str) -> str:
        """更新章节内容"""
        import re
        
        pattern = rf"(## {section}\n\n)(.*?)(?=\n## |\Z)"
        
        def replacer(match):
            return f"## {section}\n\n{new_content}\n\n"
        
        new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
        
        # 如果没有匹配到，添加新章节
        if new_content == content:
            content += f"\n## {section}\n\n{new_content}\n\n"
        
        return new_content
    
    def add_recent_highlight(self, session_id: str, summary: str, 
                            key_points: List[str]):
        """
        添加最近会话摘要
        
        Args:
            session_id: 会话ID
            summary: 摘要
            key_points: 关键要点
        """
        timestamp = datetime.now().isoformat()
        
        entry = f"""### {session_id} [{timestamp[:19]}]

**Summary**: {summary}

**Key Points**:
"""
        for point in key_points:
            entry += f"- {point}\n"
        
        entry += "\n---\n\n"
        
        # 追加到文件
        with open(self.recent_file, 'a', encoding='utf-8') as f:
            f.write(entry)
        
        # 清理旧条目（保留最近20个）
        self._cleanup_recent(20)
    
    def _cleanup_recent(self, keep: int = 20):
        """清理旧条目"""
        content = self.recent_file.read_text(encoding='utf-8')
        
        # 按###分割条目
        import re
        entries = re.split(r'\n### ', content)
        
        if len(entries) <= keep + 1:  # +1 for header
            return
        
        # 保留header和最近的keep个条目
        header = entries[0]
        recent_entries = entries[-keep:]
        
        # 重新组合
        new_content = header + "\n### " + "\n### ".join(recent_entries)
        
        self.recent_file.write_text(new_content, encoding='utf-8')
    
    def get_current_context(self) -> Dict[str, Any]:
        """获取当前会话上下文"""
        content = self.current_file.read_text(encoding='utf-8')
        
        return {
            "current": content,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_recent_highlights(self, limit: int = 5) -> List[Dict[str, str]]:
        """获取最近会话摘要"""
        content = self.recent_file.read_text(encoding='utf-8')
        
        # 简单解析
        import re
        entries = re.findall(r'### (.+?)\n', content)
        
        return [{"session_id": e.split()[0], "timestamp": e[e.find('[')+1:e.find(']')]}
                for e in entries[-limit:]]
    
    def end_session(self, final_summary: str = ""):
        """
        结束当前会话
        
        将CURRENT内容归档到RECENT，并清空CURRENT
        """
        # 读取当前内容
        current_content = self.current_file.read_text(encoding='utf-8')
        
        # 提取关键信息
        import re
        
        # 尝试提取主题和决策
        topics_match = re.search(r'## Active Topics\n\n(.*?)(?=\n##)', current_content, re.DOTALL)
        topics = [t.strip('- ') for t in topics_match.group(1).strip().split('\n') if t.strip()] if topics_match else []
        
        decisions_match = re.search(r'## Key Decisions\n\n(.*?)(?=\n##)', current_content, re.DOTALL)
        decisions = [d.strip('- ') for d in decisions_match.group(1).strip().split('\n') if d.strip()] if decisions_match else []
        
        summary_match = re.search(r'## Context Summary\n\n(.*?)(?=\n##|\Z)', current_content, re.DOTALL)
        summary = summary_match.group(1).strip() if summary_match else final_summary
        
        # 添加到RECENT
        session_id = f"session-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.add_recent_highlight(
            session_id=session_id,
            summary=summary,
            key_points=topics + decisions
        )
        
        # 重置CURRENT
        self._init_current()
        
        return session_id
