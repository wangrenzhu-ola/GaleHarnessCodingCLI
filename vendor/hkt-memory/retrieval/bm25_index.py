"""
BM25 Full-Text Search Index

使用SQLite FTS5实现BM25全文检索
支持中文分词 (jieba)
"""

import json
import os
import sqlite3
import re
from contextlib import closing
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime


class BM25Index:
    """
    BM25全文检索索引
    
    基于SQLite FTS5实现，支持：
    - BM25排序
    - 中文分词 (jieba)
    - 前缀匹配
    - 布尔查询
    """
    
    def __init__(self, db_path: str = "memory/bm25_index.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._has_jieba = self._check_jieba()
        self._init_db()
    
    def _check_jieba(self) -> bool:
        """检查是否安装了jieba"""
        try:
            import jieba
            return True
        except ImportError:
            return False
    
    def _init_db(self):
        """初始化数据库"""
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT sqlite_compileoption_used('ENABLE_FTS5')")
            has_fts5 = cursor.fetchone()[0]
            self._use_fts5 = bool(has_fts5)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    metadata TEXT DEFAULT '{}',
                    scope TEXT DEFAULT 'global',
                    agent_id TEXT,
                    project_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            if self._use_fts5:
                cursor.execute("""
                    CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
                        content,
                        content='documents',
                        content_rowid='rowid',
                        tokenize='porter'
                    )
                """)
            else:
                cursor.execute("""
                    CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts4(
                        content,
                        content='documents',
                        content_rowid='rowid',
                        tokenize='porter'
                    )
                """)

            cursor.execute("""
                CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
                    INSERT INTO fts_index(rowid, content) VALUES (new.rowid, new.content);
                END
            """)
            cursor.execute("""
                CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
                    INSERT INTO fts_index(fts_index, rowid, content) VALUES ('delete', old.rowid, old.content);
                END
            """)
            cursor.execute("""
                CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
                    INSERT INTO fts_index(fts_index, rowid, content) VALUES ('delete', old.rowid, old.content);
                    INSERT INTO fts_index(rowid, content) VALUES (new.rowid, new.content);
                END
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_scope ON documents(scope)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent ON documents(agent_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_project ON documents(project_id)")
            conn.commit()
    
    def _tokenize_chinese(self, text: str) -> str:
        """
        中文分词处理
        
        将中文文本分词，便于FTS索引
        """
        if not self._has_jieba:
            # 简单策略：在中文字符间加空格
            return self._simple_chinese_tokenize(text)
        
        import jieba
        # 精确模式分词
        words = jieba.lcut(text)
        return " ".join(words)
    
    def _simple_chinese_tokenize(self, text: str) -> str:
        """简单的中文分词（无jieba时使用）"""
        # 在中文字符之间插入空格
        result = []
        for char in text:
            if '\u4e00' <= char <= '\u9fff':  # CJK统一表意文字
                result.append(' ')
                result.append(char)
                result.append(' ')
            else:
                result.append(char)
        return ''.join(result)
    
    def add_document(self, 
                     doc_id: str, 
                     content: str, 
                     metadata: Optional[Dict] = None,
                     scope: str = "global",
                     agent_id: Optional[str] = None,
                     project_id: Optional[str] = None) -> bool:
        """
        添加文档到索引
        
        Args:
            doc_id: 文档唯一ID
            content: 文档内容
            metadata: 元数据字典
            scope: 作用域 (global/agent:<id>/project:<id>)
            agent_id: Agent标识
            project_id: 项目标识
            
        Returns:
            是否成功
        """
        try:
            # 分词处理
            tokenized_content = self._tokenize_chinese(content)
            metadata_json = json.dumps(metadata or {})

            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO documents
                    (id, content, metadata, scope, agent_id, project_id, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    doc_id,
                    tokenized_content,
                    metadata_json,
                    scope,
                    agent_id,
                    project_id,
                    datetime.utcnow().isoformat()
                ))
                conn.commit()
            return True

        except Exception as e:
            print(f"Error adding document to BM25 index: {e}")
            return False
    
    def search(self, 
               query: str, 
               top_k: int = 10,
               scopes: Optional[List[str]] = None,
               agent_id: Optional[str] = None,
               project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        BM25检索
        
        Args:
            query: 查询文本
            top_k: 返回数量
            scopes: 作用域过滤
            agent_id: Agent过滤
            project_id: 项目过滤
            
        Returns:
            [{id, content, score, metadata, scope}]
        """
        try:
            # 分词处理查询
            tokenized_query = self._tokenize_chinese(query)
            
            # 为了防止 FTS5 syntax error，将每个 token 用双引号包裹
            safe_tokens = ['"' + t.replace('"', '""') + '"' for t in tokenized_query.split() if t.strip()]
            safe_query = " ".join(safe_tokens)
            if not safe_query:
                return []

            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()

                # 构建WHERE子句
                where_clauses = []
                params = []

                if scopes:
                    placeholders = ','.join('?' * len(scopes))
                    where_clauses.append(f"d.scope IN ({placeholders})")
                    params.extend(scopes)

                if agent_id:
                    where_clauses.append("d.agent_id = ?")
                    params.append(agent_id)

                if project_id:
                    where_clauses.append("d.project_id = ?")
                    params.append(project_id)

                where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

                # 执行FTS查询
                if self._use_fts5:
                    # FTS5支持bm25()函数
                    cursor.execute(f"""
                        SELECT d.id, d.content, d.metadata, d.scope,
                               d.agent_id, d.project_id, d.created_at,
                               bm25(fts_index) as score
                        FROM fts_index
                        JOIN documents d ON fts_index.rowid = d.rowid
                        WHERE fts_index MATCH ? AND {where_sql}
                        ORDER BY bm25(fts_index) ASC
                        LIMIT ?
                    """, [safe_query] + params + [top_k])
                else:
                    # FTS4使用简单排序
                    cursor.execute(f"""
                        SELECT d.id, d.content, d.metadata, d.scope,
                               d.agent_id, d.project_id, d.created_at,
                               1.0 as score
                        FROM fts_index
                        JOIN documents d ON fts_index.rowid = d.rowid
                        WHERE fts_index MATCH ? AND {where_sql}
                        ORDER BY rank DESC
                        LIMIT ?
                    """, [safe_query] + params + [top_k])

                rows = cursor.fetchall()

            # 在 with 块外处理结果
            results = []
            for row in rows:
                doc_id, content, metadata_json, scope, agent, project, created, score = row

                # 转换FTS5的bm25分数（越小越好）到统一空间（越大越好）
                if self._use_fts5:
                    # bm25返回负数，绝对值越大相关性越高
                    normalized_score = 1.0 / (1.0 + abs(score))
                else:
                    normalized_score = score

                results.append({
                    'id': doc_id,
                    'content': content,
                    'score': normalized_score,
                    'metadata': json.loads(metadata_json),
                    'scope': scope,
                    'agent_id': agent,
                    'project_id': project,
                    'created_at': created
                })

            return results
            
        except Exception as e:
            print(f"Error in BM25 search: {e}")
            return []
    
    def delete_document(self, doc_id: str) -> bool:
        """
        删除文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            是否成功
        """
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
                conn.commit()
            return True

        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def update_document(self, 
                        doc_id: str, 
                        content: Optional[str] = None,
                        metadata: Optional[Dict] = None) -> bool:
        """
        更新文档
        
        Args:
            doc_id: 文档ID
            content: 新内容（可选）
            metadata: 新元数据（可选，会合并）
            
        Returns:
            是否成功
        """
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()

                # 获取现有文档
                cursor.execute("SELECT content, metadata FROM documents WHERE id = ?", (doc_id,))
                row = cursor.fetchone()

                if not row:
                    return False

                old_content, old_metadata_json = row
                old_metadata = json.loads(old_metadata_json)

                # 更新
                new_content = self._tokenize_chinese(content) if content else old_content
                new_metadata = {**old_metadata, **(metadata or {})}

                cursor.execute("""
                    UPDATE documents
                    SET content = ?, metadata = ?, updated_at = ?
                    WHERE id = ?
                """, (new_content, json.dumps(new_metadata), datetime.utcnow().isoformat(), doc_id))

                conn.commit()
            return True

        except Exception as e:
            print(f"Error updating document: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """获取索引统计信息"""
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()

                cursor.execute("SELECT COUNT(*) FROM documents")
                total = cursor.fetchone()[0]

                cursor.execute("SELECT scope, COUNT(*) FROM documents GROUP BY scope")
                by_scope = {row[0]: row[1] for row in cursor.fetchall()}

                return {
                    'total_documents': total,
                    'by_scope': by_scope,
                    'fts_version': 'FTS5' if self._use_fts5 else 'FTS4',
                    'has_jieba': self._has_jieba,
                    'db_path': str(self.db_path)
                }

        except Exception as e:
            return {'error': str(e)}
    
    def optimize(self):
        """优化索引（清理碎片）"""
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                if self._use_fts5:
                    cursor.execute("INSERT INTO fts_index(fts_index) VALUES ('optimize')")
                else:
                    cursor.execute("INSERT INTO fts_index(fts_index) VALUES ('optimize')")
                conn.commit()

        except Exception as e:
            print(f"Error optimizing index: {e}")
