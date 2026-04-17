"""
Vector Store with Zhipu AI Embeddings
"""

import os
import json
import sqlite3
import math
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime


class EmbeddingClient:
    """
    智谱AI Embedding客户端
    
    使用用户提供的API Key生成embedding向量
    """
    
    DEFAULT_API_KEY = ""
    DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4/"
    DEFAULT_MODEL = "embedding-3"
    DIMENSIONS = 2048  # embedding-3 模型维度
    DEFAULT_MAX_INPUT_CHARS = 2000
    
    def __init__(self):
        self.api_key = os.environ.get("HKT_MEMORY_API_KEY") or \
                       os.environ.get("OPENAI_API_KEY") or \
                       self.DEFAULT_API_KEY
        self.base_url = os.environ.get("HKT_MEMORY_BASE_URL") or \
                        os.environ.get("OPENAI_BASE_URL") or \
                        self.DEFAULT_BASE_URL
        self.model = os.environ.get("HKT_MEMORY_MODEL", self.DEFAULT_MODEL)
        self.max_input_chars = max(
            256,
            int(os.environ.get("HKT_MEMORY_EMBEDDING_MAX_INPUT_CHARS", str(self.DEFAULT_MAX_INPUT_CHARS)))
        )
        self.cache_enabled = os.environ.get("HKT_MEMORY_EMBEDDING_CACHE", "true").lower() != "false"
        self._cache: Dict[str, List[float]] = {}
        self._init_client()
    
    def _init_client(self):
        """初始化OpenAI兼容客户端"""
        if not self.api_key:
            raise RuntimeError("HKT_MEMORY_API_KEY or OPENAI_API_KEY is required for embedding")
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=30.0
            )
        except ImportError:
            self.client = None
            raise RuntimeError("openai package not installed. Run: pip install openai")
    
    def get_embedding(self, text: str) -> List[float]:
        """
        获取文本的embedding向量
        
        Args:
            text: 输入文本
            
        Returns:
            2048维向量
        """
        if not self.client:
            raise RuntimeError("Embedding client not initialized")
        
        if not text or not text.strip():
            # 返回零向量
            return [0.0] * self.DIMENSIONS

        normalized_text = text[:self.max_input_chars]
        if self.cache_enabled and normalized_text in self._cache:
            return list(self._cache[normalized_text])
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.embeddings.create(
                    input=normalized_text,
                    model=self.model
                )
                embedding = response.data[0].embedding
                if self.cache_enabled:
                    self._cache[normalized_text] = list(embedding)
                return embedding
            except Exception as e:
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1 * (attempt + 1))
                else:
                    raise RuntimeError(f"Failed to get embedding: {e}")
        
        return [0.0] * self.DIMENSIONS
    
    def get_embeddings_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        批量获取embedding
        
        Args:
            texts: 文本列表
            batch_size: 批处理大小
            
        Returns:
            embedding列表
        """
        results = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            for text in batch:
                results.append(self.get_embedding(text))
        return results


class VectorStore:
    """
    向量存储
    
    使用SQLite + 智谱AI Embedding实现向量存储和相似度搜索
    """
    
    def __init__(self, db_path: str = "memory/vector_store.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.embedding_client = EmbeddingClient()
        self._init_db()
    
    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建向量表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vectors (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding BLOB,  -- 存储为JSON bytes
                metadata TEXT,   -- JSON格式
                source TEXT,     -- 来源文件
                layer TEXT,      -- L0/L1/L2
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP,
                access_count INTEGER DEFAULT 0
            )
        """)
        self._ensure_schema(cursor)
        
        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_layer ON vectors(layer)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_source ON vectors(source)
        """)
        
        conn.commit()
        conn.close()

    def _ensure_schema(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute("PRAGMA table_info(vectors)")
        columns = {row[1] for row in cursor.fetchall()}
        if "last_accessed" not in columns:
            cursor.execute("ALTER TABLE vectors ADD COLUMN last_accessed TIMESTAMP")
    
    def add(self, 
            doc_id: str, 
            content: str, 
            layer: str = "L2",
            source: str = "",
            metadata: Optional[Dict] = None) -> bool:
        """
        添加文档到向量存储
        
        Args:
            doc_id: 文档ID
            content: 文档内容
            layer: 所属层
            source: 来源
            metadata: 元数据
            
        Returns:
            是否成功
        """
        try:
            # 生成embedding
            embedding = self.embedding_client.get_embedding(content)
            embedding_bytes = json.dumps(embedding).encode('utf-8')
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO vectors 
                (id, content, embedding, metadata, source, layer)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                content,
                embedding_bytes,
                json.dumps(metadata or {}),
                source,
                layer
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error adding to vector store: {e}")
            return False
    
    def search(self, 
               query: str, 
               top_k: int = 5,
               layer: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        向量相似度搜索
        
        Args:
            query: 查询文本
            top_k: 返回数量
            layer: 层过滤
            
        Returns:
            相似文档列表
        """
        try:
            # 生成查询向量
            query_vec = self.embedding_client.get_embedding(query)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 构建查询
            if layer:
                cursor.execute("""
                    SELECT id, content, embedding, metadata, source, layer, access_count, last_accessed
                    FROM vectors
                    WHERE layer = ?
                """, (layer,))
            else:
                cursor.execute("""
                    SELECT id, content, embedding, metadata, source, layer, access_count, last_accessed
                    FROM vectors
                """)
            
            rows = cursor.fetchall()
            conn.close()
            
            if not rows:
                return []
            
            # 计算相似度
            results = []
            for row in rows:
                doc_id, content, embedding_bytes, metadata_json, source, doc_layer, access_count, last_accessed = row
                
                # 解析embedding
                doc_vec = json.loads(embedding_bytes.decode('utf-8'))
                
                # 计算余弦相似度
                similarity = self._cosine_similarity(query_vec, doc_vec)
                
                results.append({
                    'id': doc_id,
                    'content': content,
                    'score': float(similarity),
                    'metadata': json.loads(metadata_json),
                    'source': source,
                    'layer': doc_layer,
                    'access_count': access_count,
                    'last_accessed': last_accessed,
                })
            
            # 按相似度排序
            results.sort(key=lambda x: x['score'], reverse=True)
            
            # 更新访问计数
            self._update_access_count([r['id'] for r in results[:top_k]])
            
            return results[:top_k]
            
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        norm1 = 0.0
        norm2 = 0.0
        dot = 0.0
        n = min(len(vec1), len(vec2))
        if n <= 0:
            return 0.0
        for idx in range(n):
            a = float(vec1[idx])
            b = float(vec2[idx])
            dot += a * b
            norm1 += a * a
            norm2 += b * b
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        return float(dot / (math.sqrt(norm1) * math.sqrt(norm2)))
    
    def _update_access_count(self, doc_ids: List[str]):
        """更新访问计数"""
        if not doc_ids:
            return

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                for doc_id in doc_ids:
                    cursor.execute("""
                        UPDATE vectors
                        SET access_count = access_count + 1,
                            last_accessed = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (doc_id,))
                conn.commit()
        except Exception as e:
            print(f"Error updating access count: {e}")
    
    def delete(self, doc_id: str) -> bool:
        """删除文档"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM vectors WHERE id = ?", (doc_id,))
                conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting vector: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM vectors")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT layer, COUNT(*) FROM vectors GROUP BY layer")
            by_layer = {row[0]: row[1] for row in cursor.fetchall()}
            
            conn.close()
            
            return {
                'total_vectors': total,
                'by_layer': by_layer,
                'embedding_dimensions': self.embedding_client.DIMENSIONS,
                'embedding_model': self.embedding_client.model
            }
        except Exception as e:
            return {'error': str(e)}
