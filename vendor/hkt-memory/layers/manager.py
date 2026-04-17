"""
Layer Manager - Unified interface for L0/L1/L2 layers
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
    """
    分层存储管理器
    
    提供统一的接口来操作L0/L1/L2三层存储
    自动维护层间关系和一致性
    集成向量存储实现语义检索
    """
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        
        # 初始化各层
        self.l0 = L0AbstractLayer(self.base_path / "L0-Abstract")
        self.l1 = L1OverviewLayer(self.base_path / "L1-Overview")
        self.l2 = L2FullLayer(self.base_path / "L2-Full")
        
        # 初始化向量存储
        self.vector_store = VectorStore(str(self.base_path / "vector_store.db"))

    @staticmethod
    def _resolve_title(title: Optional[str], content: str, topic: str) -> str:
        explicit_title = (title or "").strip()
        if explicit_title:
            return explicit_title

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("# "):
                return line[2:].strip() or topic or "Untitled"
            if line.startswith("## "):
                return line[3:].strip() or topic or "Untitled"
            break

        topic_title = (topic or "").strip()
        if topic_title:
            return topic_title

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if line:
                return line[:80]

        return "Untitled"
    
    def store(self,
              content: str,
              title: str = "",
              layer: str = "L2",
              topic: str = "general",
              metadata: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        分层存储记忆
        
        Args:
            content: 主要内容
            title: 标题
            layer: 目标层 (L0/L1/L2/all)
            topic: 主题
            metadata: 元数据
            
        Returns:
            各层生成的ID映射
        """
        ids = {}
        effective_title = self._resolve_title(title, content, topic)
        
        # 始终存储到L2 (Source of Truth)
        if layer in ("L2", "all"):
            content_lines = content.split('\n')
            l2_id = self.l2.store_daily(
                title=effective_title,
                content_lines=content_lines,
                metadata=metadata
            )
            ids['L2'] = l2_id
        
        # 存储到L1 (如果是项目或会话)
        if layer in ("L1", "all") and metadata:
            if 'session_id' in metadata:
                l1_id = self.l1.store_session(
                    session_id=metadata['session_id'],
                    summary=effective_title or content[:100] + "...",
                    key_points=content.split('\n')[:5],
                    decisions=metadata.get('decisions', []),
                    metadata=metadata
                )
                ids['L1'] = l1_id
            elif 'project_id' in metadata:
                l1_id = self.l1.store_project(
                    project_id=metadata['project_id'],
                    name=effective_title or metadata.get('project_name', 'Unnamed'),
                    description=content[:200],
                    milestones=metadata.get('milestones', []),
                    status=metadata.get('status', 'active'),
                    metadata=metadata
                )
                ids['L1'] = l1_id
        
        # 存储到L0 (摘要)
        if layer in ("L0", "all"):
            # 生成简洁摘要
            abstract = self._generate_abstract(content)
            l0_id = self.l0.store(
                content=abstract,
                topic=topic,
                source=ids.get('L2', ''),
                metadata=metadata
            )
            ids['L0'] = l0_id
        
        return ids
    
    def retrieve(self,
                 query: str = "",
                 layer: str = "L0",
                 topic: Optional[str] = None,
                 limit: int = 10) -> List[Dict[str, Any]]:
        """
        分层检索
        
        Args:
            query: 查询关键词
            layer: 目标层 (L0/L1/L2)
            topic: 主题过滤
            limit: 数量限制
            
        Returns:
            检索结果列表
        """
        if layer == "L0":
            return self.l0.retrieve(query=query, topic=topic, limit=limit)
        elif layer == "L1":
            # L1检索需要特殊处理
            results = []
            for session_id in self.l1.list_sessions():
                session = self.l1.get_session(session_id)
                if session and (not query or query.lower() in session.get('content', '').lower()):
                    results.append(session)
            return results[:limit]
        elif layer == "L2":
            return self.l2.search(query=query)
        else:
            raise ValueError(f"Unknown layer: {layer}")
    
    def progressive_retrieve(self,
                            query: str,
                            limit_per_layer: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """
        渐进式检索 - 先L0，再L1，最后L2
        
        Args:
            query: 查询关键词
            limit_per_layer: 每层返回数量
            
        Returns:
            分层检索结果
        """
        return {
            'L0': self.l0.retrieve(query=query, limit=limit_per_layer),
            'L1': self.retrieve(query=query, layer='L1', limit=limit_per_layer),
            'L2': self.l2.search(query=query)[:limit_per_layer]
        }
    
    def store_episode(self,
                     episode_type: str,
                     content: str,
                     source: str = "",
                     extract_to_l0: bool = True) -> Dict[str, str]:
        """
        存储episode并可选提取到L0
        
        Args:
            episode_type: episode类型
            content: 内容
            source: 来源
            extract_to_l0: 是否提取到L0层
            
        Returns:
            生成的ID
        """
        # 存储到L2 episodes
        episode_id = self.l2.store_episode(
            episode_type=episode_type,
            content=content,
            source=source
        )
        
        result = {'L2_episode': episode_id}
        
        # 可选：提取摘要到L0
        if extract_to_l0:
            abstract = self._generate_abstract(content)
            l0_id = self.l0.store(
                content=abstract,
                topic=f"episode_{episode_type}",
                source=episode_id
            )
            result['L0'] = l0_id
        
        return result
    
    def store_evergreen(self,
                       title: str,
                       content_lines: List[str],
                       category: str = "general",
                       importance: str = "medium",
                       extract_to_l0: bool = True) -> Dict[str, str]:
        """
        存储永久记忆
        
        Args:
            title: 标题
            content_lines: 内容行
            category: 分类
            importance: 重要性
            extract_to_l0: 是否提取到L0
            
        Returns:
            生成的ID
        """
        # 存储到L2 evergreen
        l2_id = self.l2.store_evergreen(
            title=title,
            content_lines=content_lines,
            category=category,
            importance=importance
        )
        
        result = {'L2': l2_id}
        
        # 可选：提取到L0
        if extract_to_l0:
            abstract = self._generate_abstract('\n'.join(content_lines))
            l0_id = self.l0.store(
                content=abstract,
                topic=f"evergreen_{category}",
                source=l2_id
            )
            result['L0'] = l0_id
        
        return result
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取各层统计信息"""
        return {
            'L0': self.l0.get_stats(),
            'L1': self.l1.get_stats(),
            'L2': self.l2.get_stats()
        }
    
    def _generate_abstract(self, content: str, max_length: int = 150) -> str:
        """生成内容摘要"""
        # 简单的摘要生成：取前max_length个字符
        content = content.replace('\n', ' ').strip()
        if len(content) <= max_length:
            return content
        
        # 尝试在句子边界截断
        truncated = content[:max_length]
        last_period = truncated.rfind('.')
        last_cn_period = truncated.rfind('。')
        last_space = truncated.rfind(' ')
        
        cut_point = max(last_period, last_cn_period, last_space)
        if cut_point > max_length * 0.5:
            return truncated[:cut_point+1]
        
        return truncated + "..."
    
    def sync_layers(self):
        """
        同步各层数据
        
        确保L0和L1层与L2层保持一致
        """
        # TODO: 实现层间同步逻辑
        pass
