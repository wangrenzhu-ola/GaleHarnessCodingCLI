"""
L1 Overview Layer - Medium granularity summaries
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import re


class L1OverviewLayer:
    """
    L1层：中等粒度层
    - 存储中等详细程度的记忆 (200-500 tokens)
    - 用于会话概览和项目概览
    - 支持结构化查询
    """
    
    MAX_TOKENS = 500
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.sessions_path = self.base_path / "sessions"
        self.projects_path = self.base_path / "projects"
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录结构存在"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.sessions_path.mkdir(exist_ok=True)
        self.projects_path.mkdir(exist_ok=True)
    
    def _estimate_tokens(self, text: str) -> int:
        """估算token数"""
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        other_chars = len(text) - chinese_chars
        return int(chinese_chars * 1.5 + other_chars * 0.25)
    
    def _generate_id(self, content: str, timestamp: str) -> str:
        """生成唯一ID"""
        data = f"{content}{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:12]
    
    def store_session(self,
                      session_id: str,
                      summary: str,
                      key_points: List[str],
                      decisions: List[str] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储会话概览
        
        Args:
            session_id: 会话标识
            summary: 会话摘要
            key_points: 关键要点
            decisions: 决策记录
            metadata: 元数据
            
        Returns:
            记忆ID
        """
        timestamp = datetime.now().isoformat()
        memory_id = self._generate_id(session_id, timestamp)
        
        entry = {
            "id": memory_id,
            "session_id": session_id,
            "timestamp": timestamp,
            "summary": summary,
            "key_points": key_points,
            "decisions": decisions or [],
            "metadata": metadata or {}
        }
        
        # 存储到会话文件
        session_file = self.sessions_path / f"{session_id}.md"
        self._write_session(session_file, entry)
        
        return memory_id
    
    def store_project(self,
                      project_id: str,
                      name: str,
                      description: str,
                      milestones: List[Dict],
                      status: str = "active",
                      metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        存储项目概览
        
        Args:
            project_id: 项目标识
            name: 项目名称
            description: 项目描述
            milestones: 里程碑列表
            status: 项目状态
            metadata: 元数据
            
        Returns:
            记忆ID
        """
        timestamp = datetime.now().isoformat()
        memory_id = self._generate_id(project_id, timestamp)
        
        entry = {
            "id": memory_id,
            "project_id": project_id,
            "timestamp": timestamp,
            "name": name,
            "description": description,
            "milestones": milestones,
            "status": status,
            "metadata": metadata or {}
        }
        
        # 存储到项目文件
        project_file = self.projects_path / f"{project_id}.md"
        self._write_project(project_file, entry)
        
        return memory_id
    
    def _write_session(self, session_file: Path, entry: Dict):
        """写入会话文件"""
        content = f"""# Session: {entry['session_id']}

## Overview
**ID**: {entry['id']}  
**Timestamp**: {entry['timestamp']}  
**Summary**: {entry['summary']}

## Key Points
"""
        for point in entry['key_points']:
            content += f"- {point}\n"
        
        if entry['decisions']:
            content += "\n## Decisions\n"
            for decision in entry['decisions']:
                content += f"- {decision}\n"
        
        if entry['metadata']:
            content += f"\n## Metadata\n```json\n{json.dumps(entry['metadata'], ensure_ascii=False, indent=2)}\n```\n"
        
        # 追加模式
        if session_file.exists():
            with open(session_file, 'a', encoding='utf-8') as f:
                f.write(f"\n---\n\n{content}")
        else:
            session_file.write_text(content, encoding='utf-8')
    
    def _write_project(self, project_file: Path, entry: Dict):
        """写入项目文件"""
        content = f"""# Project: {entry['name']}

## Overview
**ID**: {entry['id']}  
**Project ID**: {entry['project_id']}  
**Status**: {entry['status']}  
**Last Updated**: {entry['timestamp']}

## Description
{entry['description']}

## Milestones
"""
        for milestone in entry['milestones']:
            status_icon = "✅" if milestone.get('completed') else "⏳"
            content += f"- {status_icon} {milestone.get('name', 'Unnamed')}: {milestone.get('description', '')}\n"
        
        if entry['metadata']:
            content += f"\n## Metadata\n```json\n{json.dumps(entry['metadata'], ensure_ascii=False, indent=2)}\n```\n"
        
        project_file.write_text(content, encoding='utf-8')
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话概览"""
        session_file = self.sessions_path / f"{session_id}.md"
        if not session_file.exists():
            return None
        return self._parse_session_file(session_file)
    
    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """获取项目概览"""
        project_file = self.projects_path / f"{project_id}.md"
        if not project_file.exists():
            return None
        return self._parse_project_file(project_file)
    
    def list_sessions(self) -> List[str]:
        """列出所有会话"""
        return [f.stem for f in self.sessions_path.glob("*.md")]
    
    def list_projects(self, status: Optional[str] = None) -> List[Dict[str, str]]:
        """列出所有项目"""
        projects = []
        for project_file in self.projects_path.glob("*.md"):
            project = self._parse_project_file(project_file)
            if project:
                if status is None or project.get('status') == status:
                    projects.append({
                        'id': project.get('project_id', ''),
                        'name': project.get('name', ''),
                        'status': project.get('status', '')
                    })
        return projects
    
    def _parse_session_file(self, session_file: Path) -> Dict[str, Any]:
        """解析会话文件"""
        content = session_file.read_text(encoding='utf-8')
        # 简化解析：提取关键信息
        return {
            'session_id': session_file.stem,
            'content': content,
            'raw': content
        }
    
    def _parse_project_file(self, project_file: Path) -> Dict[str, Any]:
        """解析项目文件"""
        content = project_file.read_text(encoding='utf-8')
        
        # 提取项目名称
        name_match = re.search(r'^# Project: (.+)$', content, re.MULTILINE)
        name = name_match.group(1) if name_match else project_file.stem
        
        # 提取状态
        status_match = re.search(r'\*\*Status\*\*: (.+)$', content, re.MULTILINE)
        status = status_match.group(1) if status_match else 'unknown'
        
        return {
            'project_id': project_file.stem,
            'name': name,
            'status': status,
            'content': content
        }
    
    def update_project_status(self, project_id: str, status: str) -> bool:
        """更新项目状态"""
        project_file = self.projects_path / f"{project_id}.md"
        if not project_file.exists():
            return False
        
        content = project_file.read_text(encoding='utf-8')
        content = re.sub(
            r'(\*\*Status\*\*: )(.+)$',
            rf'\g<1>{status}',
            content,
            flags=re.MULTILINE
        )
        project_file.write_text(content, encoding='utf-8')
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """获取L1层统计信息"""
        return {
            'total_sessions': len(list(self.sessions_path.glob("*.md"))),
            'total_projects': len(list(self.projects_path.glob("*.md"))),
            'active_projects': len([p for p in self.list_projects() if p.get('status') == 'active'])
        }
