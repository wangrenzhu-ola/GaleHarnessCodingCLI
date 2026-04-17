"""
SQLite Vector Backend with optional faiss acceleration

Supports vector_backend: "sqlite" configuration for fast approximate search.
"""

import json
import sqlite3
import numpy as np
from contextlib import closing
from pathlib import Path
from typing import Dict, List, Optional, Any

from .store import EmbeddingClient


class SQLiteVectorBackend:
    """
    SQLite-based vector backend with optional faiss in-memory index.
    Vectors are persisted as BLOBs in SQLite; faiss is used for fast search.
    """

    def __init__(self, db_path: str = "memory/vector_store.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.embedding_client = EmbeddingClient()
        self._faiss_available = False
        self._index = None
        self._id_map: List[str] = []
        self._init_faiss()
        self._init_db()
        self._rebuild_index_from_db()

    def _init_faiss(self):
        try:
            import faiss
            self._faiss = faiss
            self._faiss_available = True
        except ImportError:
            self._faiss = None
            self._faiss_available = False

    def _init_db(self):
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS vectors (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding BLOB,
                    metadata TEXT,
                    source TEXT,
                    layer TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_accessed TIMESTAMP,
                    access_count INTEGER DEFAULT 0
                )
            """)
            self._ensure_schema(cursor)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_layer ON vectors(layer)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_source ON vectors(source)")
            conn.commit()

    def _ensure_schema(self, cursor: sqlite3.Cursor) -> None:
        cursor.execute("PRAGMA table_info(vectors)")
        columns = {row[1] for row in cursor.fetchall()}
        if "last_accessed" not in columns:
            cursor.execute("ALTER TABLE vectors ADD COLUMN last_accessed TIMESTAMP")

    def _rebuild_index_from_db(self):
        if not self._faiss_available:
            return
        dim = self.embedding_client.DIMENSIONS
        self._index = self._faiss.IndexFlatIP(dim)  # inner product = cosine for normalized vectors
        self._id_map = []
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, embedding FROM vectors")
            rows = cursor.fetchall()
            if rows:
                vectors = []
                for doc_id, emb_bytes in rows:
                    vec = np.array(json.loads(emb_bytes.decode("utf-8")), dtype="float32")
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    vectors.append(vec)
                    self._id_map.append(doc_id)
                self._index.add(np.stack(vectors))

    def add(self,
            doc_id: str,
            content: str,
            layer: str = "L2",
            source: str = "",
            metadata: Optional[Dict] = None) -> bool:
        try:
            embedding = self.embedding_client.get_embedding(content)
            embedding_bytes = json.dumps(embedding).encode("utf-8")

            with closing(sqlite3.connect(self.db_path)) as conn:
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
                    layer,
                ))
                conn.commit()

            if self._faiss_available and self._index is not None:
                vec = np.array(embedding, dtype="float32")
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                self._index.add(vec.reshape(1, -1))
                self._id_map.append(doc_id)

            return True
        except Exception as e:
            print(f"[SQLiteVectorBackend] add error: {e}")
            return False

    def search(self,
               query: str,
               top_k: int = 5,
               layer: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query_vec = self.embedding_client.get_embedding(query)
            query_vec = np.array(query_vec, dtype="float32")
            norm = np.linalg.norm(query_vec)
            if norm > 0:
                query_vec = query_vec / norm

            if self._faiss_available and self._index is not None and self._index.ntotal > 0:
                scores, indices = self._index.search(query_vec.reshape(1, -1), min(top_k, self._index.ntotal))
                matched_ids = []
                matched_scores = {}
                for idx, score in zip(indices[0], scores[0]):
                    if idx < 0 or idx >= len(self._id_map):
                        continue
                    doc_id = self._id_map[idx]
                    matched_ids.append(doc_id)
                    matched_scores[doc_id] = float(score)
                if not matched_ids:
                    return []
            else:
                # fallback to brute-force
                return self._brute_force_search(query_vec, top_k, layer)

            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                if layer:
                    cursor.execute("""
                        SELECT id, content, metadata, source, layer, access_count, last_accessed
                        FROM vectors
                        WHERE id IN ({}) AND layer = ?
                    """.format(",".join(["?"] * len(matched_ids))), (*matched_ids, layer))
                else:
                    cursor.execute("""
                        SELECT id, content, metadata, source, layer, access_count, last_accessed
                        FROM vectors
                        WHERE id IN ({})
                    """.format(",".join(["?"] * len(matched_ids))), matched_ids)

                rows = cursor.fetchall()
                results = []
                for row in rows:
                    doc_id, content, meta_json, source, doc_layer, access_count, last_accessed = row
                    results.append({
                        "id": doc_id,
                        "content": content,
                        "score": matched_scores.get(doc_id, 0.0),
                        "metadata": json.loads(meta_json),
                        "source": source,
                        "layer": doc_layer,
                        "access_count": access_count,
                        "last_accessed": last_accessed,
                    })
                results.sort(key=lambda x: x["score"], reverse=True)
                self._update_access_count([r["id"] for r in results[:top_k]])
                return results[:top_k]

        except Exception as e:
            print(f"[SQLiteVectorBackend] search error: {e}")
            return []

    def _brute_force_search(self, query_vec: np.ndarray, top_k: int, layer: Optional[str]) -> List[Dict[str, Any]]:
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()
            if layer:
                cursor.execute("""
                    SELECT id, content, embedding, metadata, source, layer, access_count, last_accessed
                    FROM vectors WHERE layer = ?
                """, (layer,))
            else:
                cursor.execute("""
                    SELECT id, content, embedding, metadata, source, layer, access_count, last_accessed
                    FROM vectors
                """)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                doc_id, content, emb_bytes, meta_json, source, doc_layer, access_count, last_accessed = row
                doc_vec = np.array(json.loads(emb_bytes.decode("utf-8")), dtype="float32")
                norm1 = np.linalg.norm(query_vec)
                norm2 = np.linalg.norm(doc_vec)
                similarity = 0.0
                if norm1 > 0 and norm2 > 0:
                    similarity = float(np.dot(query_vec, doc_vec) / (norm1 * norm2))
                results.append({
                    "id": doc_id,
                    "content": content,
                    "score": similarity,
                    "metadata": json.loads(meta_json),
                    "source": source,
                    "layer": doc_layer,
                    "access_count": access_count,
                    "last_accessed": last_accessed,
                })
            results.sort(key=lambda x: x["score"], reverse=True)
            self._update_access_count([r["id"] for r in results[:top_k]])
            return results[:top_k]

    def _update_access_count(self, doc_ids: List[str]):
        if not doc_ids:
            return
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
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
            print(f"[SQLiteVectorBackend] update_access_count error: {e}")

    def delete(self, doc_id: str) -> bool:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM vectors WHERE id = ?", (doc_id,))
                conn.commit()
            # full rebuild on delete to keep faiss in sync
            self._rebuild_index_from_db()
            return True
        except Exception as e:
            print(f"[SQLiteVectorBackend] delete error: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM vectors")
                total = cursor.fetchone()[0]
                cursor.execute("SELECT layer, COUNT(*) FROM vectors GROUP BY layer")
                by_layer = {row[0]: row[1] for row in cursor.fetchall()}
                return {
                    "total_vectors": total,
                    "by_layer": by_layer,
                    "embedding_dimensions": self.embedding_client.DIMENSIONS,
                    "embedding_model": self.embedding_client.model,
                    "faiss_enabled": self._faiss_available,
                }
        except Exception as e:
            return {"error": str(e)}

    def rebuild_from_files(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Rebuild index from filesystem entries (used by sync --rebuild-index)."""
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM vectors")
            conn.commit()

        if self._faiss_available:
            self._rebuild_index_from_db()

        added = 0
        for entry in entries:
            doc_id = entry.get("id")
            content = entry.get("content", "")
            layer = entry.get("layer", "L2")
            if doc_id and content:
                if self.add(doc_id=doc_id, content=content, layer=layer, source=doc_id):
                    added += 1
        return {"success": True, "added": added}
