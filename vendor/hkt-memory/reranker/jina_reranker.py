"""
Jina AI Reranker
"""

import os
import requests
from typing import Dict, List, Any

from .cross_encoder import CrossEncoderReranker


class JinaReranker(CrossEncoderReranker):
    """
    Jina AI 重排序器
    
    API: https://api.jina.ai/v1/rerank
    Model: jina-reranker-v3
    """
    
    API_URL = "https://api.jina.ai/v1/rerank"
    DEFAULT_MODEL = "jina-reranker-v3"
    
    def __init__(self,
                 api_key: str = None,
                 model: str = "jina-reranker-v3",
                 blend_ratio: float = 0.6,
                 top_k: int = 10):
        super().__init__(model=model, blend_ratio=blend_ratio, top_k=top_k)
        self.api_key = api_key or os.environ.get("JINA_API_KEY")
        if not self.api_key:
            print("Warning: JINA_API_KEY not set. Jina reranker will not work.")
    
    def rerank(self,
               query: str,
               documents: List[str],
               return_raw: bool = False) -> List[Dict[str, Any]]:
        """
        使用Jina API重排序
        
        Args:
            query: 查询
            documents: 文档列表
            return_raw: 是否返回原始响应
            
        Returns:
            重排序结果
        """
        if not self.api_key:
            raise ValueError("JINA_API_KEY not set")
        
        if not documents:
            return []
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "query": query,
            "documents": documents,
            "top_n": len(documents)
        }
        
        try:
            response = requests.post(
                self.API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            if return_raw:
                return data
            
            # 解析结果
            results = data.get('results', [])
            rerank_scores = [0.0] * len(documents)
            
            for r in results:
                idx = r.get('index', 0)
                score = r.get('relevance_score', 0)
                if 0 <= idx < len(rerank_scores):
                    rerank_scores[idx] = score
            
            # 构建原始结果格式
            original_results = [
                {'content': doc, 'score': 0.5, 'index': i}
                for i, doc in enumerate(documents)
            ]
            
            return self.blend_scores(original_results, rerank_scores)
        
        except Exception as e:
            print(f"Jina rerank failed: {e}")
            # 失败时返回原始顺序
            return [
                {'content': doc, 'score': 0.5, 'index': i}
                for i, doc in enumerate(documents)
            ]
    
    def rerank_with_original(self,
                            query: str,
                            original_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        重排序并混合原始分数
        
        Args:
            query: 查询
            original_results: 原始检索结果（包含content和score）
            
        Returns:
            重排序后的结果
        """
        if not original_results:
            return []
        
        documents = [r.get('content', '') for r in original_results]
        
        if not self.api_key:
            print("Warning: JINA_API_KEY not set, skipping rerank")
            return original_results[:self.top_k]
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "query": query,
            "documents": documents,
            "top_n": len(documents)
        }
        
        try:
            response = requests.post(
                self.API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            results = data.get('results', [])
            
            # 构建重排序分数数组
            rerank_scores = [0.0] * len(documents)
            for r in results:
                idx = r.get('index', 0)
                score = r.get('relevance_score', 0)
                if 0 <= idx < len(rerank_scores):
                    rerank_scores[idx] = score
            
            return self.blend_scores(original_results, rerank_scores)
        
        except Exception as e:
            print(f"Jina rerank failed: {e}")
            return original_results[:self.top_k]
