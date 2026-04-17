"""
Cross-Encoder Reranker Base Class
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class RerankResult:
    """重排序结果"""
    index: int
    score: float
    original_score: float
    blended_score: float


class CrossEncoderReranker(ABC):
    """
    跨编码器重排序器基类
    
    对初步检索结果进行重排序，提升准确性
    """
    
    def __init__(self, 
                 model: str = "",
                 blend_ratio: float = 0.6,
                 top_k: int = 10):
        """
        初始化
        
        Args:
            model: 模型名称
            blend_ratio: 重排序分数混合比例 (0-1)
            top_k: 返回结果数量
        """
        self.model = model
        self.blend_ratio = blend_ratio
        self.top_k = top_k
    
    @abstractmethod
    def rerank(self, 
               query: str, 
               documents: List[str],
               return_raw: bool = False) -> List[Dict[str, Any]]:
        """
        重排序文档
        
        Args:
            query: 查询
            documents: 待排序文档列表
            return_raw: 是否返回原始响应
            
        Returns:
            重排序结果
        """
        pass
    
    def blend_scores(self, 
                     original_results: List[Dict[str, Any]],
                     rerank_scores: List[float]) -> List[Dict[str, Any]]:
        """
        混合原始分数和重排序分数
        
        Args:
            original_results: 原始结果（包含score字段）
            rerank_scores: 重排序分数
            
        Returns:
            混合后的结果
        """
        if len(original_results) != len(rerank_scores):
            raise ValueError("Results and scores must have same length")
        
        blended = []
        for i, (result, rerank_score) in enumerate(zip(original_results, rerank_scores)):
            original_score = result.get('score', 0.5)
            
            # 混合分数
            blended_score = (
                self.blend_ratio * rerank_score + 
                (1 - self.blend_ratio) * original_score
            )
            
            new_result = dict(result)
            new_result['score'] = blended_score
            new_result['original_score'] = original_score
            new_result['rerank_score'] = rerank_score
            
            blended.append(new_result)
        
        # 按混合分数排序
        blended.sort(key=lambda x: x['score'], reverse=True)
        
        return blended[:self.top_k]
