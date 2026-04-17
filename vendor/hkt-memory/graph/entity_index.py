"""
Entity Index for Knowledge Graph MVP

轻量级 SQLite 实体关系三元组索引
"""

import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class EntityIndex:
    """
    实体关系三元组索引

    表结构: entity_triples(memory_id, subject, relation, object, created_at)
    """

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with closing(sqlite3.connect(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS entity_triples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    memory_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    relation TEXT NOT NULL,
                    object TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_entity_subject ON entity_triples(subject)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_entity_memory ON entity_triples(memory_id)
            """)
            conn.commit()

    def add_triple(self, memory_id: str, subject: str, relation: str, obj: str) -> bool:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO entity_triples (memory_id, subject, relation, object)
                    VALUES (?, ?, ?, ?)
                """, (memory_id, subject, relation, obj))
                conn.commit()
            return True
        except Exception as e:
            print(f"[EntityIndex] add_triple error: {e}")
            return False

    def add_triples(self, memory_id: str, triples: List[List[str]]) -> int:
        count = 0
        for triple in triples:
            if len(triple) >= 3:
                if self.add_triple(memory_id, triple[0], triple[1], triple[2]):
                    count += 1
        return count

    def search_by_entity(self, name: str) -> List[Dict[str, Any]]:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT memory_id, subject, relation, object, created_at
                    FROM entity_triples
                    WHERE subject = ? OR object = ?
                    ORDER BY created_at DESC
                """, (name, name))
                rows = cursor.fetchall()
                return [
                    {
                        "memory_id": row[0],
                        "subject": row[1],
                        "relation": row[2],
                        "object": row[3],
                        "created_at": row[4],
                    }
                    for row in rows
                ]
        except Exception as e:
            print(f"[EntityIndex] search_by_entity error: {e}")
            return []

    def search_memory_ids_by_entity(self, name: str) -> List[str]:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT memory_id
                    FROM entity_triples
                    WHERE subject = ? OR object = ?
                    ORDER BY created_at DESC
                """, (name, name))
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            print(f"[EntityIndex] search_memory_ids_by_entity error: {e}")
            return []

    def delete_by_memory(self, memory_id: str) -> bool:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM entity_triples WHERE memory_id = ?
                """, (memory_id,))
                conn.commit()
            return True
        except Exception as e:
            print(f"[EntityIndex] delete_by_memory error: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        try:
            with closing(sqlite3.connect(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM entity_triples")
                total = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(DISTINCT subject) FROM entity_triples")
                distinct_subjects = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(DISTINCT object) FROM entity_triples")
                distinct_objects = cursor.fetchone()[0]
                return {
                    "total_triples": total,
                    "distinct_subjects": distinct_subjects,
                    "distinct_objects": distinct_objects,
                }
        except Exception as e:
            return {"error": str(e)}
