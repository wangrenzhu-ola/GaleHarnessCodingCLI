"""
MMR (Maximal Marginal Relevance) Diversification

MMR多样性优化 - 增加检索结果的多样性
"""

import numpy as np
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass


@dataclass
class MMRConfig:
    """MMR配置"""
    # 相似度阈值，超过此值认为重复
    similarity_threshold: float = 0.85
    # 多样性权重 (0=只重相关度, 1=只重多样性)
    lambda_param: float = 0.5
    # 候选池大小
    candidate_pool_size: int = 20


class MMRDiversifier:
    """
    MMR多样性优化器
    
    MMR公式: 
    MMR = argmax[λ * Sim1(q, di) - (1-λ) * max(Sim2(di, dj))]
    
    其中:
    - Sim1: 查询与文档的相关度
    - Sim2: 文档间的相似度
    - λ: 平衡参数
    
    简单实现:
    - 如果两个结果余弦相似度 > threshold，降低后者的分数
    """
    
    def __init__(self, config: Optional[MMRConfig] = None):
        self.config = config or MMRConfig()
    
    def diversify(self,
                  results: List[Dict[str, Any]],
                  similarity_fn: Optional[Callable] = None) -> List[Dict[str, Any]]:
        """
        应用MMR多样性优化
        
        Args:
            results: 检索结果列表，每项需包含score和embedding或content
            similarity_fn: 自定义相似度函数(可选)
            
        Returns:
            优化后的结果列表
        """
        if len(results) <= 1:
            return results
        
        # 使用配置的相似度函数或默认函数
        sim_fn = similarity_fn or self._default_similarity
        
        # 按原始分数排序
        sorted_results = sorted(results, key=lambda x: x.get('score', 0), reverse=True)
        
        # MMR选择
        selected = [sorted_results[0]]  # 先选分数最高的
        candidates = sorted_results[1:]
        
        while candidates and len(selected) < self.config.candidate_pool_size:
            max_mmr_score = -float('inf')
            max_mmr_candidate = None
            
            for candidate in candidates:
                # 计算与已选结果的最大相似度
                max_sim_to_selected = max(
                    sim_fn(candidate, s) for s in selected
                )
                
                # 计算MMR分数
                relevance = candidate.get('score', 0)
                mmr_score = (
                    self.config.lambda_param * relevance -
                    (1 - self.config.lambda_param) * max_sim_to_selected
                )
                
                if mmr_score > max_mmr_score:
                    max_mmr_score = mmr_score
                    max_mmr_candidate = candidate
            
            if max_mmr_candidate:
                selected.append(max_mmr_candidate)
                candidates.remove(max_mmr_candidate)
            else:
                break
        
        # 更新分数并返回
        final_results = []
        for i, result in enumerate(selected):
            new_result = dict(result)
            new_result['mmr_rank'] = i
            final_results.append(new_result)
        
        return final_results
    
    def simple_diversify(self,
                         results: List[Dict[str, Any]],
                         similarity_threshold: float = None) -> List[Dict[str, Any]]:
        """
        简化版多样性优化
        
        如果两个结果相似度 > threshold，降低后者的分数
        
        Args:
            results: 检索结果
            similarity_threshold: 相似度阈值(默认使用配置值)
            
        Returns:
            优化后的结果
        """
        threshold = similarity_threshold or self.config.similarity_threshold
        
        if len(results) <= 1:
            return results
        
        # 按原始分数排序
        sorted_results = sorted(results, key=lambda x: x.get('score', 0), reverse=True)
        
        diversified = [sorted_results[0]]
        
        for candidate in sorted_results[1:]:
            # 检查与已选结果的相似度
            is_duplicate = False
            
            for selected in diversified:
                sim = self._content_similarity(
                    candidate.get('content', ''),
                    selected.get('content', '')
                )
                
                if sim > threshold:
                    # 降低重复内容的分数
                    candidate = dict(candidate)
                    candidate['score'] = candidate.get('score', 0) * 0.5
                    candidate['deduplicated'] = True
                    is_duplicate = True
                    break
            
            diversified.append(candidate)
        
        # 重新排序
        diversified.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        return diversified[:self.config.candidate_pool_size]
    
    def _default_similarity(self, a: Dict, b: Dict) -> float:
        """
        默认相似度计算
        
        优先使用embedding，否则使用文本相似度
        """
        # 尝试使用embedding
        emb_a = a.get('embedding')
        emb_b = b.get('embedding')
        
        if emb_a is not None and emb_b is not None:
            return self._cosine_similarity(emb_a, emb_b)
        
        # 回退到文本相似度
        content_a = a.get('content', '')
        content_b = b.get('content', '')
        
        return self._content_similarity(content_a, content_b)
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """计算余弦相似度"""
        a = np.array(a)
        b = np.array(b)
        
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return float(np.dot(a, b) / (norm_a * norm_b))
    
    def _content_similarity(self, a: str, b: str) -> float:
        """
        基于词袋的简单文本相似度
        
        使用Jaccard相似度
        """
        # 分词（简单按字符）
        set_a = set(a.lower())
        set_b = set(b.lower())
        
        if not set_a or not set_b:
            return 0.0
        
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        
        return intersection / union if union > 0 else 0.0
