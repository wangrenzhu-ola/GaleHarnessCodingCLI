"""
Auto-Capture and Auto-Recall Implementation

Inspired by Mem0's auto-capture and auto-recall features
"""

import os
import re
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime


class AutoCaptureRecall:
    """
    自动捕获和回忆管理器
    
    功能:
    - Auto-Capture: 对话后自动提取重要信息
    - Auto-Recall: 对话前自动检索相关记忆
    """
    
    def __init__(self, memory_dir: Path):
        self.memory_dir = Path(memory_dir)
        self.enabled = os.environ.get("HKT_AUTO_CAPTURE", "true").lower() == "true"
        self.recall_enabled = os.environ.get("HKT_AUTO_RECALL", "true").lower() == "true"
        self.min_messages = int(os.environ.get("HKT_EXTRACT_MIN_MESSAGES", "3"))
        self.max_chars = int(os.environ.get("HKT_EXTRACT_MAX_CHARS", "2000"))
        self.search_threshold = float(os.environ.get("HKT_RECALL_THRESHOLD", "0.3"))
        
        self._init_hkt_memory()
    
    def _init_hkt_memory(self):
        """初始化HKT-Memory"""
        import sys
        sys.path.insert(0, str(self.memory_dir.parent))
        from layers import LayerManager
        from extraction import MemoryClassifier
        
        self.layers = LayerManager(self.memory_dir)
        self.classifier = MemoryClassifier()
    
    def should_capture(self, conversation: List[Dict[str, str]]) -> bool:
        """
        判断是否应该捕获记忆
        
        条件:
        - 消息数 >= min_messages
        - 包含关键信息 (决策/偏好/实体等)
        """
        if not self.enabled:
            return False
        
        if len(conversation) < self.min_messages:
            return False
        
        # 检查是否有关键信息
        key_patterns = [
            r'决定|决策|decision',
            r'偏好|prefer|喜欢',
            r'必须|一定|should|must',
            r'方案|方案|plan',
            r'重要|important|critical',
            r'规则|规则|rule',
        ]
        
        text = " ".join([m.get("content", "") for m in conversation])
        
        for pattern in key_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    def auto_capture(self, conversation: List[Dict[str, str]], 
                     session_id: str = None) -> Optional[Dict[str, Any]]:
        """
        自动捕获记忆
        
        Args:
            conversation: 对话历史
            session_id: 会话ID
            
        Returns:
            捕获结果
        """
        if not self.should_capture(conversation):
            return None
        
        try:
            # 使用Smart Extraction提取记忆
            classified_memories = self.classifier.extract_from_conversation(
                conversation,
                min_confidence=0.7
            )
            
            if not classified_memories:
                return None
            
            # 存储到L2层
            stored_ids = []
            for mem in classified_memories:
                ids = self.layers.store(
                    content=mem.content,
                    title=f"Auto-captured: {mem.category.value}",
                    layer="L2",
                    topic=mem.category.value,
                    metadata={
                        "auto_captured": True,
                        "category": mem.category.value,
                        "confidence": mem.confidence,
                        "entities": mem.entities,
                        "session_id": session_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                stored_ids.append(ids)
            
            return {
                "captured": True,
                "count": len(classified_memories),
                "memories": [{"category": m.category.value, "content": m.content[:100]} 
                            for m in classified_memories],
                "ids": stored_ids
            }
            
        except Exception as e:
            return {
                "captured": False,
                "error": str(e)
            }
    
    def auto_recall(self, query: str, context: str = "", 
                   top_k: int = 5) -> Dict[str, Any]:
        """
        自动回忆相关记忆
        
        Args:
            query: 查询关键词
            context: 上下文
            top_k: 返回数量
            
        Returns:
            回忆结果
        """
        if not self.recall_enabled:
            return {"recalled": False, "reason": "Auto-recall disabled"}
        
        try:
            # 组合查询和上下文
            full_query = f"{query} {context}".strip()
            
            # 先检索L0层（快速过滤）
            l0_results = self.layers.l0.retrieve(query=full_query, limit=top_k)
            
            # 如果L0结果足够好，直接返回
            if l0_results and len(l0_results) >= 3:
                return {
                    "recalled": True,
                    "layer": "L0",
                    "count": len(l0_results),
                    "memories": l0_results
                }
            
            # 否则检索所有层
            results = self.layers.progressive_retrieve(
                query=full_query,
                limit_per_layer=top_k
            )
            
            # 合并结果
            all_memories = []
            for layer, items in results.items():
                for item in items:
                    item['layer'] = layer
                    all_memories.append(item)
            
            # 按相关性排序（简单按score）
            all_memories.sort(key=lambda x: x.get('score', 0), reverse=True)
            
            # 过滤低于阈值的
            filtered = [m for m in all_memories if m.get('score', 0) >= self.search_threshold]
            
            return {
                "recalled": True,
                "count": len(filtered),
                "memories": filtered[:top_k]
            }
            
        except Exception as e:
            return {
                "recalled": False,
                "error": str(e)
            }
    
    def pre_conversation_hook(self, user_input: str, 
                              session_context: Dict = None) -> Dict[str, Any]:
        """
        对话前钩子 - 自动回忆
        
        使用方式:
        ```python
        # 在每次对话开始前调用
        context = auto_manager.pre_conversation_hook(user_input, session_context)
        if context['recalled']:
            # 将回忆的记忆注入到系统提示中
            memories = context.get('memories', [])
        ```
        """
        return self.auto_recall(user_input, context=str(session_context) if session_context else "")
    
    def post_conversation_hook(self, conversation: List[Dict[str, str]],
                               session_id: str = None) -> Optional[Dict[str, Any]]:
        """
        对话后钩子 - 自动捕获
        
        使用方式:
        ```python
        # 在每次对话结束后调用
        result = auto_manager.post_conversation_hook(messages, session_id)
        if result and result.get('captured'):
            print(f"Captured {result['count']} memories")
        ```
        """
        return self.auto_capture(conversation, session_id)
