"""
Two-Stage Deduplicator

Phase 1: Vector similarity pre-filtering (threshold >= 0.85)
Phase 2: LLM decision (CREATE/MERGE/SKIP/SUPPORT/CONTEXTUALIZE/CONTRADICT)
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class DedupAction(Enum):
    CREATE = "create"           # 创建新记忆
    MERGE = "merge"             # 合并到现有记忆
    SKIP = "skip"               # 跳过（重复）
    SUPPORT = "support"         # 作为支持证据
    CONTEXTUALIZE = "contextualize"  # 添加上下文
    CONTRADICT = "contradict"   # 记录矛盾


@dataclass
class DedupResult:
    """去重结果"""
    action: DedupAction
    existing_id: Optional[str]
    similarity: float
    reason: str


class TwoStageDeduplicator:
    """
    两阶段去重器
    
    第一阶段：向量相似度预过滤
    第二阶段：LLM决策
    """
    
    VECTOR_THRESHOLD = 0.85
    
    def __init__(self, 
                 vector_threshold: float = 0.85,
                 model: str = "glm-4-flash"):
        self.vector_threshold = vector_threshold
        self.model = model
        self.api_key = os.environ.get("HKT_MEMORY_API_KEY") or os.environ.get("OPENAI_API_KEY")
        self.base_url = os.environ.get("HKT_MEMORY_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/")
        self._init_client()
    
    def _init_client(self):
        """初始化LLM客户端"""
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=30.0
            )
        except ImportError:
            self.client = None
    
    def check_duplicate(self, 
                       new_memory: str,
                       existing_memories: List[Dict[str, any]],
                       vector_store=None) -> DedupResult:
        """
        检查是否重复
        
        Args:
            new_memory: 新记忆内容
            existing_memories: 现有记忆列表
            vector_store: 向量存储（用于Phase 1）
            
        Returns:
            去重决策结果
        """
        if not existing_memories:
            return DedupResult(
                action=DedupAction.CREATE,
                existing_id=None,
                similarity=0.0,
                reason="No existing memories"
            )
        
        # Phase 1: Vector similarity filtering
        candidates = self._phase1_vector_filter(
            new_memory, existing_memories, vector_store
        )
        
        if not candidates:
            # 没有高相似度候选，直接创建
            return DedupResult(
                action=DedupAction.CREATE,
                existing_id=None,
                similarity=0.0,
                reason="No high-similarity candidates found"
            )
        
        # Phase 2: LLM decision
        best_candidate = max(candidates, key=lambda x: x['similarity'])
        return self._phase2_llm_decide(
            new_memory, 
            best_candidate['memory'],
            best_candidate['similarity']
        )
    
    def _phase1_vector_filter(self,
                             new_memory: str,
                             existing_memories: List[Dict],
                             vector_store=None) -> List[Dict]:
        """
        第一阶段：向量相似度过滤
        
        Returns:
            高相似度候选列表
        """
        candidates = []
        
        if vector_store:
            # 使用向量存储进行相似度搜索
            try:
                results = vector_store.search_similar(new_memory, limit=5)
                for result in results:
                    similarity = result.get('score', 0)
                    if similarity >= self.vector_threshold:
                        candidates.append({
                            'memory': result,
                            'similarity': similarity
                        })
            except Exception as e:
                print(f"Vector search failed: {e}")
        
        # 备用：简单的文本相似度
        if not candidates:
            for mem in existing_memories:
                similarity = self._text_similarity(new_memory, mem.get('content', ''))
                if similarity >= self.vector_threshold:
                    candidates.append({
                        'memory': mem,
                        'similarity': similarity
                    })
        
        return candidates
    
    def _phase2_llm_decide(self,
                          new_memory: str,
                          existing_memory: Dict,
                          similarity: float) -> DedupResult:
        """
        第二阶段：LLM决策
        
        Returns:
            去重决策
        """
        if not self.client:
            # LLM不可用时使用简单规则
            return self._rule_decide(new_memory, existing_memory, similarity)
        
        existing_content = existing_memory.get('content', '')
        existing_id = existing_memory.get('id', 'unknown')
        
        prompt = f"""请判断新记忆与现有记忆的关系，并选择合适的处理方式：

现有记忆：
{existing_content}

新记忆：
{new_memory}

向量相似度：{similarity:.2f}

可选操作：
1. CREATE - 创建新记忆（内容显著不同）
2. MERGE - 合并到现有记忆（内容互补或扩展）
3. SKIP - 跳过（完全重复）
4. SUPPORT - 作为支持证据（相同观点的不同表述）
5. CONTEXTUALIZE - 添加上下文（需要更多背景信息）
6. CONTRADICT - 记录矛盾（与现有记忆冲突）

请输出JSON格式：
{{
    "action": "操作名称",
    "reason": "决策理由"
}}

只输出JSON，不要有其他内容。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个记忆去重专家。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            action_str = result.get('action', 'CREATE').lower()
            
            # 映射到枚举
            action_map = {
                'create': DedupAction.CREATE,
                'merge': DedupAction.MERGE,
                'skip': DedupAction.SKIP,
                'support': DedupAction.SUPPORT,
                'contextualize': DedupAction.CONTEXTUALIZE,
                'contradict': DedupAction.CONTRADICT
            }
            
            return DedupResult(
                action=action_map.get(action_str, DedupAction.CREATE),
                existing_id=existing_id,
                similarity=similarity,
                reason=result.get('reason', 'LLM decision')
            )
        except Exception as e:
            print(f"LLM decision failed: {e}")
            return self._rule_decide(new_memory, existing_memory, similarity)
    
    def _rule_decide(self,
                    new_memory: str,
                    existing_memory: Dict,
                    similarity: float) -> DedupResult:
        """基于规则的决策"""
        existing_id = existing_memory.get('id', 'unknown')
        
        if similarity >= 0.95:
            return DedupResult(
                action=DedupAction.SKIP,
                existing_id=existing_id,
                similarity=similarity,
                reason="Very high similarity (>0.95)"
            )
        elif similarity >= 0.90:
            return DedupResult(
                action=DedupAction.MERGE,
                existing_id=existing_id,
                similarity=similarity,
                reason="High similarity (0.90-0.95)"
            )
        else:
            return DedupResult(
                action=DedupAction.CREATE,
                existing_id=None,
                similarity=similarity,
                reason="Similarity below threshold"
            )
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        计算文本相似度（Jaccard相似度）
        
        Returns:
            0-1之间的相似度分数
        """
        import re
        
        # 分词
        def tokenize(text):
            # 中文按字，英文按词
            tokens = set()
            # 中文字符
            chinese = re.findall(r'[\u4e00-\u9fff]', text)
            tokens.update(chinese)
            # 英文单词
            english = re.findall(r'[a-zA-Z]{3,}', text.lower())
            tokens.update(english)
            return tokens
        
        tokens1 = tokenize(text1)
        tokens2 = tokenize(text2)
        
        if not tokens1 or not tokens2:
            return 0.0
        
        intersection = tokens1 & tokens2
        union = tokens1 | tokens2
        
        return len(intersection) / len(union)
    
    def batch_dedup(self,
                   new_memories: List[str],
                   existing_memories: List[Dict],
                   vector_store=None) -> List[Tuple[str, DedupResult]]:
        """
        批量去重
        
        Returns:
            (新记忆, 去重结果) 列表
        """
        results = []
        for memory in new_memories:
            result = self.check_duplicate(memory, existing_memories, vector_store)
            results.append((memory, result))
        return results
