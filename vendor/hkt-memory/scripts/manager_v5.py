#!/usr/bin/env python3
"""
Layer Manager v5.0 - 自动分层存储

核心特性：
- L2 写入后自动触发 L1/L0 生成
- 使用 LLM 智能提取摘要
- 维护层间关联关系
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from .l0_abstract import L0AbstractLayer
from .l1_overview import L1OverviewLayer
from .l2_full import L2FullLayer
from vector_store import VectorStore


class LayerManagerV5:
    """
    分层存储管理器 v5.0
    
    主要改进：
    1. L2 写入后自动触发 L1/L0 提取
    2. 支持 LLM 智能摘要
    3. 统一的三层文件格式
    """
    
    def __init__(self, base_path: Path, llm_provider: str = None):
        """
        初始化管理器
        
        Args:
            base_path: 记忆根目录
            llm_provider: LLM 提供商 (zhipu/openai/minimax)
        """
        self.base_path = Path(base_path)
        
        # 初始化各层
        self.l0 = L0AbstractLayer(self.base_path / "L0-Abstract")
        self.l1 = L1OverviewLayer(self.base_path / "L1-Overview")
        self.l2 = L2FullLayer(self.base_path / "L2-Full")
        
        # 向量存储
        self.vector_store = VectorStore(str(self.base_path / "vector_store.db"))
        
        # 触发器（延迟加载，避免循环导入）
        self._trigger = None
        self._llm_provider = llm_provider
    
    @property
    def trigger(self):
        """延迟初始化触发器"""
        if self._trigger is None:
            from extractors import LayerTrigger
            self._trigger = LayerTrigger(
                memory_dir=str(self.base_path),
                llm_provider=self._llm_provider
            )
        return self._trigger
    
    def store(self,
              content: str,
              title: str = "",
              layer: str = "L2",
              topic: str = "general",
              metadata: Optional[Dict[str, Any]] = None,
              auto_extract: bool = True) -> Dict[str, str]:
        """
        分层存储记忆 - v5.0 版本
        
        Args:
            content: 主要内容
            title: 标题
            layer: 目标层 (L0/L1/L2/all)
            topic: 主题
            metadata: 元数据
            auto_extract: 是否自动提取 L1/L0（当 layer=all 时）
            
        Returns:
            各层生成的ID映射
        """
        metadata = metadata or {}
        
        # 根据 layer 参数决定存储策略
        if layer == "L2":
            # 仅存储 L2
            return self._store_l2_only(content, title, topic, metadata)
        
        elif layer == "L1":
            # 存储到 L2，然后提取 L1
            l2_result = self._store_l2_only(content, title, topic, metadata)
            l1_result = self.trigger.on_l2_stored(
                l2_id=l2_result['L2'],
                content=content,
                title=title,
                topic=topic,
                enable_l1=True,
                enable_l0=False
            )
            return {**l2_result, **l1_result}
        
        elif layer == "L0":
            # 存储到 L2，然后提取 L0
            l2_result = self._store_l2_only(content, title, topic, metadata)
            l0_result = self.trigger.on_l2_stored(
                l2_id=l2_result['L2'],
                content=content,
                title=title,
                topic=topic,
                enable_l1=False,
                enable_l0=True
            )
            return {**l2_result, **l0_result}
        
        elif layer == "all":
            # ✅ v5.0 核心：存储 L2 并自动触发 L1/L0 提取
            l2_result = self._store_l2_only(content, title, topic, metadata)
            
            if auto_extract:
                all_results = self.trigger.on_l2_stored(
                    l2_id=l2_result['L2'],
                    content=content,
                    title=title,
                    topic=topic,
                    enable_l1=True,
                    enable_l0=True
                )
                return all_results
            else:
                return l2_result
        
        else:
            raise ValueError(f"Unknown layer: {layer}")
    
    def _store_l2_only(self, content: str, title: str, topic: str, 
                       metadata: Dict) -> Dict[str, str]:
        """仅存储到 L2 层"""
        content_lines = content.split('\n')
        l2_id = self.l2.store_daily(
            title=title or "Untitled",
            content_lines=content_lines,
            metadata={**metadata, "topic": topic}
        )
        
        # 同时存储到向量数据库
        try:
            self.vector_store.add(
                doc_id=l2_id,
                content=content,
                layer="L2",
                source=l2_id,
                metadata={
                    "title": title,
                    "topic": topic,
                    **metadata
                }
            )
        except Exception as e:
            print(f"⚠️ Vector store failed: {e}")
        
        return {"L2": l2_id}
    
    def store_episode(self,
                     episode_type: str,
                     content: str,
                     source: str = "",
                     topic: str = "general",
                     auto_extract: bool = True) -> Dict[str, str]:
        """存储 episode 并触发分层"""
        # 存储到 L2 episode
        l2_id = self.l2.store_episode(
            episode_type=episode_type,
            content=content,
            source=source
        )
        
        if auto_extract:
            return self.trigger.on_l2_stored(
                l2_id=l2_id,
                content=content,
                title=f"Episode: {episode_type}",
                topic=topic,
                layer_type="episode"
            )
        
        return {"L2": l2_id}
    
    def store_evergreen(self,
                       title: str,
                       content_lines: List[str],
                       category: str = "general",
                       topic: str = "general",
                       importance: str = "medium",
                       auto_extract: bool = True) -> Dict[str, str]:
        """存储永久记忆并触发分层"""
        # 存储到 L2 evergreen
        l2_id = self.l2.store_evergreen(
            title=title,
            content_lines=content_lines,
            category=category,
            importance=importance
        )
        
        content = '\n'.join(content_lines)
        
        if auto_extract:
            return self.trigger.on_l2_stored(
                l2_id=l2_id,
                content=content,
                title=title,
                topic=topic,
                layer_type="evergreen"
            )
        
        return {"L2": l2_id}
    
    def retrieve(self,
                 query: str = "",
                 layer: str = "all",
                 topic: Optional[str] = None,
                 limit: int = 10) -> Dict[str, List[Dict]]:
        """
        分层检索
        
        Args:
            query: 查询关键词
            layer: 目标层 (L0/L1/L2/all)
            topic: 主题过滤
            limit: 数量限制
            
        Returns:
            按层分组的结果
        """
        results = {}
        
        if layer in ("L0", "all"):
            results['L0'] = self.l0.retrieve(query=query, topic=topic, limit=limit)
        
        if layer in ("L1", "all"):
            results['L1'] = self._retrieve_l1(query=query, topic=topic, limit=limit)
        
        if layer in ("L2", "all"):
            results['L2'] = self.l2.search(query=query)[:limit]
        
        return results
    
    def _retrieve_l1(self, query: str, topic: Optional[str], limit: int) -> List[Dict]:
        """检索 L1 层"""
        results = []
        
        # 从 topics 目录检索
        topics_dir = self.base_path / "L1-Overview" / "topics"
        if topics_dir.exists():
            if topic:
                files = [topics_dir / f"{topic}.md"]
            else:
                files = list(topics_dir.glob("*.md"))
            
            for file in files:
                if not file.exists():
                    continue
                
                content = file.read_text(encoding='utf-8')
                
                if not query or query.lower() in content.lower():
                    # 解析文件中的条目
                    entries = self._parse_l1_file(content, file.stem)
                    results.extend(entries)
        
        # 从 sessions 目录检索（向后兼容）
        sessions_dir = self.base_path / "L1-Overview" / "sessions"
        if sessions_dir.exists():
            for file in sessions_dir.glob("*.md"):
                content = file.read_text(encoding='utf-8')
                if not query or query.lower() in content.lower():
                    results.append({
                        "type": "session",
                        "id": file.stem,
                        "content": content[:500]
                    })
        
        # 按时间排序并限制数量
        results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return results[:limit]
    
    def _parse_l1_file(self, content: str, topic: str) -> List[Dict]:
        """解析 L1 topic 文件"""
        entries = []
        
        # 按 ### 分割条目
        sections = content.split('###')[1:]  # 跳过标题
        
        for section in sections:
            lines = section.strip().split('\n')
            if not lines:
                continue
            
            title = lines[0].strip()
            
            # 提取时间
            timestamp = ""
            for line in lines:
                if '**时间**:' in line:
                    timestamp = line.split(':', 1)[1].strip()
                    break
            
            # 提取摘要
            summary = ""
            for line in lines:
                if '**摘要**:' in line:
                    summary = line.split(':', 1)[1].strip()
                    break
            
            entries.append({
                "type": "topic",
                "topic": topic,
                "title": title,
                "timestamp": timestamp,
                "summary": summary,
                "content": section[:1000]
            })
        
        return entries
    
    def progressive_retrieve(self,
                            query: str,
                            limit_per_layer: int = 5) -> Dict[str, List[Dict]]:
        """渐进式检索 - 先 L0，再 L1，最后 L2"""
        return self.retrieve(query=query, layer="all", limit=limit_per_layer)
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取各层统计"""
        # L0 统计
        l0_stats = self.l0.get_stats()
        
        # L1 统计（包含新的 topics）
        l1_stats = self.l1.get_stats()
        topics_dir = self.base_path / "L1-Overview" / "topics"
        if topics_dir.exists():
            l1_stats['topics_files'] = len(list(topics_dir.glob("*.md")))
            l1_stats['total_topic_entries'] = sum(
                len(self._parse_l1_file(f.read_text(encoding='utf-8'), f.stem))
                for f in topics_dir.glob("*.md")
            )
        
        # L2 统计
        l2_stats = self.l2.get_stats()
        
        return {
            'L0': l0_stats,
            'L1': l1_stats,
            'L2': l2_stats
        }
    
    def sync_layers(self, full_sync: bool = False):
        """
        同步各层数据
        
        Args:
            full_sync: 是否全量重新生成
        """
        if full_sync:
            self.trigger.sync_all()
        else:
            # 增量同步：只处理没有 L1/L0 的 L2
            print("🔄 增量同步模式...")
            # TODO: 实现增量检测逻辑
