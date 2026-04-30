#!/usr/bin/env python3
"""
Layer Manager v5.0 - 自动分层存储

核心特性：
- L2 写入后自动触发 L1/L0 生成
- 使用 LLM 智能提取摘要
- 维护层间关联关系
"""

import sys
import json
import re
import hashlib
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from .l0_abstract import L0AbstractLayer
from .l1_overview import L1OverviewLayer
from .l2_full import L2FullLayer
from .query_matcher import match_query_corpus
from config.loader import ConfigLoader
from governance.errors import ErrorTracker
from governance.learnings import LearningTracker
from governance.provenance import collect_provenance
from governance.conflict_detector import ConflictDetector
from lifecycle.memory_lifecycle import MemoryLifecycleManager
from vector_store.store import VectorStore
from filters.noise_filter import NoiseFilter
from graph.entity_index import EntityIndex
from retrieval.intent import detect_intent
from retrieval.expansion import expand_query
from retrieval.bm25_index import BM25Index
from retrieval.dedup import dedup_results, compiled_truth_guarantee
from runtime.safety import MemorySafetyGate


class LayerManagerV5:
    """
    分层存储管理器 v5.0
    
    主要改进：
    1. L2 写入后自动触发 L1/L0 提取
    2. 支持 LLM 智能摘要
    3. 统一的三层文件格式
    """
    
    def __init__(self, base_path: Path, llm_provider: str = None, config: Optional[Dict[str, Any]] = None):
        """
        初始化管理器
        
        Args:
            base_path: 记忆根目录
            llm_provider: LLM 提供商 (zhipu/openai/minimax)
        """
        self.base_path = Path(base_path)
        self.config = config or ConfigLoader(self.base_path.parent).load()
        
        # 初始化各层
        self.l0 = L0AbstractLayer(self.base_path / "L0-Abstract")
        self.l1 = L1OverviewLayer(self.base_path / "L1-Overview")
        self.l2 = L2FullLayer(self.base_path / "L2-Full")
        
        # 向量存储
        self.vector_store = None
        self._vector_store_error: Optional[str] = None
        self._vector_store_add_failures = 0
        self._vector_store_last_add_failure: Optional[Dict[str, Any]] = None
        vector_backend = self.config.get("storage", {}).get("vector_backend", "file")
        try:
            if vector_backend == "sqlite":
                from vector_store.sqlite_backend import SQLiteVectorBackend
                self.vector_store = SQLiteVectorBackend(str(self.base_path / "vector_store.db"))
                print(f"✅ Using SQLiteVectorBackend")
            else:
                self.vector_store = VectorStore(str(self.base_path / "vector_store.db"))
        except Exception as e:
            self._vector_store_error = str(e)
            print(f"⚠️ Vector store unavailable: {e}")
        self.lifecycle = MemoryLifecycleManager(self.base_path, self.config.get("lifecycle", {}))
        self.learnings = LearningTracker(self.base_path / "governance")
        self.errors = ErrorTracker(self.base_path / "governance")
        self.noise_filter = NoiseFilter()
        self.safety_gate = MemorySafetyGate(
            self.config.get("automation", {}).get("safety", {})
        )
        self.entity_index = EntityIndex(self.base_path / "entity_index.db")
        self.session_transcript_index = None
        self._session_transcript_index_error: Optional[str] = None
        try:
            self.session_transcript_index = BM25Index(str(self.base_path / "session_transcript_index.db"))
        except Exception as e:
            self._session_transcript_index_error = str(e)
            print(f"⚠️ Session transcript index unavailable: {e}")
        
        # 触发器（延迟加载，避免循环导入）
        self._trigger = None
        self._llm_provider = llm_provider
        self.lifecycle.bootstrap(self.l2.iter_entries())
        self.lifecycle.cleanup_expired_events_on_startup()
    
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

    def _resolve_title(self, title: Optional[str], content: str, topic: str) -> str:
        explicit_title = (title or "").strip()
        if explicit_title:
            return explicit_title

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            heading_match = re.match(r"^#{1,6}\s+(.+?)\s*$", line)
            if heading_match:
                heading = heading_match.group(1).strip()
                if heading:
                    return heading
            break

        topic_title = (topic or "").strip()
        if topic_title:
            return topic_title

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if line:
                return line[:80]

        return "Untitled"

    def ingest_artifact(
        self,
        content: str,
        source_mode: str,
        artifact_type: str,
        title: str = "",
        topic: str = "closeout",
        artifact_id: Optional[str] = None,
        source_uri: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        layer: str = "L2",
        auto_extract: bool = False,
    ) -> Dict[str, Any]:
        normalized_source_mode = (source_mode or "").strip().lower()
        if normalized_source_mode not in {"governed", "compound"}:
            raise ValueError("source_mode must be governed or compound")
        normalized_artifact_type = (artifact_type or "").strip().lower()
        if not normalized_artifact_type:
            raise ValueError("artifact_type is required")

        metadata = dict(metadata or {})
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        resolved_artifact_id = (artifact_id or metadata.get("artifact_id") or content_hash).strip()
        dedupe_key = f"{resolved_artifact_id}|{normalized_source_mode}|{normalized_artifact_type}"
        existing = self._find_existing_artifact(dedupe_key)
        if existing:
            return {
                "success": True,
                "deduplicated": True,
                "existing_memory_id": existing,
                "dedupe_key": dedupe_key,
            }

        captured_at = metadata.get("captured_at") or datetime.utcnow().isoformat()
        forced_metadata = {
            **metadata,
            "source_mode": normalized_source_mode,
            "artifact_type": normalized_artifact_type,
            "source_uri": source_uri,
            "captured_at": captured_at,
            "artifact_id": resolved_artifact_id,
            "artifact_hash": content_hash,
            "artifact_ingest_key": dedupe_key,
        }
        stored = self.store(
            content=content,
            title=title or f"{normalized_source_mode}:{normalized_artifact_type}",
            layer=layer,
            topic=topic,
            metadata=forced_metadata,
            auto_extract=auto_extract,
        )
        return {
            "success": True,
            "deduplicated": False,
            "dedupe_key": dedupe_key,
            "memory_ids": stored,
        }

    def _find_existing_artifact(self, dedupe_key: str) -> Optional[str]:
        for memory_id, entry in self.lifecycle._manifest.items():
            metadata = entry.get("metadata", {})
            if metadata.get("artifact_ingest_key") == dedupe_key:
                return memory_id
        return None

    def _session_transcript_index_available(self) -> bool:
        return self.session_transcript_index is not None

    def _build_session_transcript_index_content(self, entry: Dict[str, Any]) -> str:
        metadata = entry.get("metadata", {}) or {}
        searchable_metadata = {
            "session_id": self._extract_session_field(entry, "session_id"),
            "task_id": self._extract_session_field(entry, "task_id"),
            "project": self._extract_session_field(entry, "project"),
            "branch": self._extract_session_field(entry, "branch"),
            "pr_id": self._extract_session_field(entry, "pr_id"),
            "scope": entry.get("scope") or metadata.get("scope"),
            "source": metadata.get("source"),
            "source_mode": metadata.get("source_mode"),
        }
        return "\n".join(
            [
                str(entry.get("title", "")),
                str(entry.get("content", "")),
                json.dumps(searchable_metadata, ensure_ascii=False),
            ]
        )

    def _sync_session_transcript_index_entry(self, entry: Optional[Dict[str, Any]]) -> bool:
        if not self._session_transcript_index_available() or not entry or not self._is_session_transcript_entry(entry):
            return False
        metadata = entry.get("metadata", {}) or {}
        return bool(
            self.session_transcript_index.add_document(
                doc_id=str(entry.get("id")),
                content=self._build_session_transcript_index_content(entry),
                metadata={
                    "session_id": self._extract_session_field(entry, "session_id"),
                    "task_id": self._extract_session_field(entry, "task_id"),
                    "project": self._extract_session_field(entry, "project"),
                    "branch": self._extract_session_field(entry, "branch"),
                    "pr_id": self._extract_session_field(entry, "pr_id"),
                    "scope": entry.get("scope") or metadata.get("scope"),
                    "title": entry.get("title"),
                    "timestamp": entry.get("timestamp"),
                },
                scope=str(entry.get("scope") or metadata.get("scope") or "global"),
                agent_id=self._extract_session_field(entry, "session_id"),
                project_id=self._extract_session_field(entry, "project"),
            )
        )

    def _remove_session_transcript_index_entry(self, memory_id: Optional[str]) -> bool:
        if not self._session_transcript_index_available() or not memory_id:
            return False
        return bool(self.session_transcript_index.delete_document(str(memory_id)))

    def _sync_session_transcript_index_memory(self, memory_id: Optional[str], include_archived: bool = False) -> bool:
        if not self._session_transcript_index_available() or not memory_id:
            return False
        entry = self.l2.get_entry(str(memory_id))
        if not entry or not self._is_session_transcript_entry(entry):
            return self._remove_session_transcript_index_entry(memory_id)
        if not self.lifecycle.is_visible(str(memory_id), include_archived=include_archived):
            return self._remove_session_transcript_index_entry(memory_id)
        return self._sync_session_transcript_index_entry(entry)

    def _rebuild_session_transcript_index(self, include_archived: bool = False) -> Dict[str, Any]:
        if not self._session_transcript_index_available():
            return {
                "enabled": False,
                "success": False,
                "error": self._session_transcript_index_error or "session transcript index unavailable",
            }
        if not self.session_transcript_index.reset():
            return {
                "enabled": True,
                "success": False,
                "error": "failed to reset session transcript index",
            }
        entries = [
            entry
            for entry in self.l2.iter_entries(scope="all")
            if self._is_session_transcript_entry(entry)
            and self.lifecycle.is_visible(entry.get("id"), include_archived=include_archived)
        ]
        indexed = 0
        failed: List[str] = []
        for entry in entries:
            if self._sync_session_transcript_index_entry(entry):
                indexed += 1
            else:
                failed.append(str(entry.get("id")))
        return {
            "enabled": True,
            "success": not failed,
            "source_entries": len(entries),
            "indexed": indexed,
            "failed": failed,
            "include_archived": include_archived,
            "stats": self.session_transcript_index.get_stats(),
        }

    def store_session_transcript(
        self,
        content: str,
        session_id: str,
        title: str = "",
        topic: str = "session",
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        repo_root: Optional[str] = None,
        branch: Optional[str] = None,
        pr_id: Optional[str] = None,
        source: str = "auto_capture",
        source_mode: str = "direct",
        importance: str = "medium",
        max_chars: int = 12000,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not (content or "").strip():
            return {"success": False, "skipped": True, "reason": "empty transcript content", "memory_ids": {}}
        resolved_session_id = (session_id or "").strip() or f"session-{uuid.uuid4().hex[:12]}"
        normalized_importance = str(importance or "medium").lower()
        if normalized_importance not in {"high", "medium", "low"}:
            normalized_importance = "medium"
        safety_analysis = self.safety_gate.sanitize_for_storage(content)
        stored_content = self._compress_session_transcript(safety_analysis["content"], max_chars=max_chars)
        content_hash = hashlib.sha256(stored_content.encode("utf-8")).hexdigest()
        transcript_metadata = dict(metadata or {})
        dedupe_key = transcript_metadata.get("dedupe_key") or "|".join(
            [str(project or ""), str(task_id or ""), resolved_session_id, content_hash]
        )
        existing = self._find_existing_session_transcript(str(dedupe_key))
        if existing:
            return {
                "success": True,
                "deduplicated": True,
                "existing_memory_id": existing,
                "memory_ids": {"L2": existing},
                "dedupe_key": dedupe_key,
            }
        captured_at = transcript_metadata.get("captured_at") or datetime.utcnow().isoformat()
        transcript_metadata.update(
            {
                "scope": transcript_metadata.get("scope") or f"session:{resolved_session_id}",
                "artifact_type": "session_transcript",
                "session_id": resolved_session_id,
                "task_id": task_id,
                "project": project,
                "repo_root": repo_root,
                "branch": branch,
                "pr_id": pr_id,
                "source": source,
                "source_mode": source_mode,
                "captured_at": captured_at,
                "content_hash": content_hash,
                "dedupe_key": dedupe_key,
                "importance": normalized_importance,
                "compression": {
                    "original_chars": len(safety_analysis["content"]),
                    "stored_chars": len(stored_content),
                    "max_chars": max_chars,
                    "truncated": len(stored_content) < len(safety_analysis["content"]),
                },
                "safety": self.safety_gate.summarize_for_metadata(safety_analysis),
            }
        )
        result = self.store(
            content=stored_content,
            title=title or f"Session transcript: {resolved_session_id}",
            layer="L2",
            topic=topic,
            metadata=transcript_metadata,
            auto_extract=False,
        )
        memory_id = result.get("L2")
        if memory_id:
            self._sync_session_transcript_index_memory(memory_id)
        result["success"] = True
        result["deduplicated"] = False
        result["dedupe_key"] = dedupe_key
        result["safety"] = transcript_metadata["safety"]
        result["redacted_before_store"] = bool(safety_analysis.get("redactions"))
        result["metadata"] = transcript_metadata
        return result

    def _compress_session_transcript(self, content: str, max_chars: int = 12000) -> str:
        normalized = re.sub(r"\n{3,}", "\n\n", (content or "").strip())
        if max_chars <= 0 or len(normalized) <= max_chars:
            return normalized
        head_budget = max(int(max_chars * 0.7), 1)
        tail_budget = max(max_chars - head_budget - 80, 1)
        return (
            normalized[:head_budget].rstrip()
            + "\n\n[... transcript compressed for storage ...]\n\n"
            + normalized[-tail_budget:].lstrip()
        )

    def _find_existing_session_transcript(self, dedupe_key: str) -> Optional[str]:
        for memory_id, entry in self.lifecycle._manifest.items():
            metadata = entry.get("metadata", {})
            if metadata.get("artifact_type") == "session_transcript" and metadata.get("dedupe_key") == dedupe_key:
                return memory_id
        return None

    def _is_session_transcript_entry(self, entry: Dict[str, Any]) -> bool:
        metadata = entry.get("metadata", {}) or {}
        scope = str(entry.get("scope") or metadata.get("scope") or "")
        if metadata.get("artifact_type") == "session_transcript":
            return True
        if metadata.get("source") in {"auto_capture", "galeharness"} and scope.startswith("session:"):
            return True
        return False

    def _extract_session_field(self, entry: Dict[str, Any], field: str) -> Optional[str]:
        metadata = entry.get("metadata", {}) or {}
        value = entry.get(field)
        if value in (None, ""):
            value = metadata.get(field)
        if value in (None, "") and field == "session_id":
            scope = str(entry.get("scope") or metadata.get("scope") or "")
            if scope.startswith("session:"):
                value = scope.split(":", 1)[1]
        if value in (None, ""):
            return None
        return str(value)

    def _matches_session_filters(
        self,
        entry: Dict[str, Any],
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> bool:
        filters = {
            "session_id": session_id,
            "task_id": task_id,
            "project": project,
            "branch": branch,
            "pr_id": pr_id,
        }
        for field, expected in filters.items():
            if expected in (None, ""):
                continue
            if self._extract_session_field(entry, field) != str(expected):
                return False
        return True

    def _build_recent_session_results(self, entries: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        grouped: Dict[str, Dict[str, Any]] = {}
        for entry in entries:
            resolved_session_id = self._extract_session_field(entry, "session_id") or entry.get("id")
            timestamp = str(entry.get("timestamp") or "")
            existing = grouped.get(resolved_session_id)
            if existing is None or timestamp > existing["latest_timestamp"]:
                entry_count = (existing or {}).get("entry_count", 0) + 1
                grouped[resolved_session_id] = {
                    "session_id": resolved_session_id,
                    "scope": entry.get("scope") or f"session:{resolved_session_id}",
                    "task_id": self._extract_session_field(entry, "task_id"),
                    "project": self._extract_session_field(entry, "project"),
                    "branch": self._extract_session_field(entry, "branch"),
                    "pr_id": self._extract_session_field(entry, "pr_id"),
                    "latest_timestamp": timestamp,
                    "latest_memory_id": entry.get("id"),
                    "summary": str(entry.get("content", ""))[:240],
                    "title": entry.get("title"),
                    "entry_count": entry_count,
                    "metadata": entry.get("metadata", {}),
                }
            else:
                existing["entry_count"] += 1
        results = sorted(grouped.values(), key=lambda item: item.get("latest_timestamp", ""), reverse=True)
        return results[:limit]

    def session_search(
        self,
        query: str = "",
        limit: int = 5,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        resolved_pr_id = pr_id or pr
        session_entries: List[Dict[str, Any]] = []
        for entry in self.l2.iter_entries(scope="all"):
            memory_id = entry.get("id")
            if memory_id and not self.lifecycle.is_visible(memory_id):
                continue
            if not self._is_session_transcript_entry(entry):
                continue
            if not self._matches_session_filters(
                entry,
                session_id=session_id,
                task_id=task_id,
                project=project,
                branch=branch,
                pr_id=resolved_pr_id,
            ):
                continue
            session_entries.append(entry)
        session_entries_by_id = {
            str(entry.get("id")): entry
            for entry in session_entries
            if entry.get("id")
        }

        normalized_query = (query or "").strip()
        if not normalized_query:
            recent_results = self._build_recent_session_results(session_entries, limit)
            touched_ids = [item["latest_memory_id"] for item in recent_results if item.get("latest_memory_id")]
            if touched_ids:
                self.lifecycle.touch(touched_ids, event_type="recent")
            return {
                "success": True,
                "mode": "recent",
                "count": len(recent_results),
                "results": recent_results,
            }

        if self._session_transcript_index_available():
            indexed_results = self.session_transcript_index.search(
                query=normalized_query,
                top_k=max(limit * 10, 50),
                scopes=[f"session:{session_id}"] if session_id else None,
                agent_id=session_id,
                project_id=project,
            )
            if indexed_results:
                results: List[Dict[str, Any]] = []
                for indexed in indexed_results:
                    entry = session_entries_by_id.get(str(indexed.get("id")))
                    if entry is None:
                        continue
                    combined = self._build_session_transcript_index_content(entry)
                    results.append(
                        {
                            "id": entry.get("id"),
                            "session_id": self._extract_session_field(entry, "session_id"),
                            "task_id": self._extract_session_field(entry, "task_id"),
                            "project": self._extract_session_field(entry, "project"),
                            "branch": self._extract_session_field(entry, "branch"),
                            "pr_id": self._extract_session_field(entry, "pr_id"),
                            "scope": entry.get("scope"),
                            "timestamp": entry.get("timestamp"),
                            "title": entry.get("title"),
                            "content": entry.get("content", ""),
                            "preview": self.l2._extract_preview(combined, normalized_query),
                            "metadata": entry.get("metadata", {}),
                            "_match_score": float(indexed.get("score", 0.0)),
                            "_bm25_score": float(indexed.get("score", 0.0)),
                            "_debug_match": {
                                "matched": True,
                                "backend": "session_transcript_index",
                                "score": float(indexed.get("score", 0.0)),
                            },
                        }
                    )
                results.sort(key=lambda item: (item.get("_match_score", 0.0), item.get("timestamp", "")), reverse=True)
                limited = results[:limit]
                touched_ids = [item["id"] for item in limited if item.get("id")]
                if touched_ids:
                    self.lifecycle.touch(touched_ids, event_type="session_search")
                return {
                    "success": True,
                    "mode": "search",
                    "count": len(limited),
                    "results": limited,
                }

        haystacks = []
        for entry in session_entries:
            metadata = entry.get("metadata", {}) or {}
            haystacks.append(
                "\n".join(
                    [
                        str(entry.get("title", "")),
                        str(entry.get("content", "")),
                        json.dumps(metadata, ensure_ascii=False),
                    ]
                )
            )
        matches = match_query_corpus(normalized_query, haystacks)
        results: List[Dict[str, Any]] = []
        for entry, combined, match in zip(session_entries, haystacks, matches):
            if not match.get("matched"):
                continue
            results.append(
                {
                    "id": entry.get("id"),
                    "session_id": self._extract_session_field(entry, "session_id"),
                    "task_id": self._extract_session_field(entry, "task_id"),
                    "project": self._extract_session_field(entry, "project"),
                    "branch": self._extract_session_field(entry, "branch"),
                    "pr_id": self._extract_session_field(entry, "pr_id"),
                    "scope": entry.get("scope"),
                    "timestamp": entry.get("timestamp"),
                    "title": entry.get("title"),
                    "content": entry.get("content", ""),
                    "preview": self.l2._extract_preview(combined, normalized_query),
                    "metadata": entry.get("metadata", {}),
                    "_match_score": match.get("score", 0.0),
                    "_bm25_score": match.get("bm25_score", 0.0),
                    "_debug_match": match,
                }
            )
        results.sort(key=lambda item: (item.get("_match_score", 0.0), item.get("timestamp", "")), reverse=True)
        limited = results[:limit]
        touched_ids = [item["id"] for item in limited if item.get("id")]
        if touched_ids:
            self.lifecycle.touch(touched_ids, event_type="session_search")
        return {
            "success": True,
            "mode": "search",
            "count": len(limited),
            "results": limited,
        }
    
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
        effective_title = self._resolve_title(title, content, topic)

        # 噪声预过滤
        if content.strip() and self.noise_filter.is_noise(content):
            self.lifecycle.increment_filter_count()
            return {"filtered": True, "reason": "content matches noise filter rules"}

        # 根据 layer 参数决定存储策略
        if layer == "L2":
            result = self._store_l2_only(content, effective_title, topic, metadata)
            if result.get("pruned"):
                result["aggregate_rebuild"] = self.rebuild_aggregates()
            return result
        
        elif layer == "L1":
            # 存储到 L2，然后提取 L1
            l2_result = self._store_l2_only(content, effective_title, topic, metadata)
            l1_result = self.trigger.on_l2_stored(
                l2_id=l2_result['L2'],
                content=content,
                title=effective_title,
                topic=topic,
                enable_l1=True,
                enable_l0=False
            )
            result = {**l2_result, **l1_result}
            if l2_result.get("pruned"):
                result["aggregate_rebuild"] = self.rebuild_aggregates()
            return result
        
        elif layer == "L0":
            # 存储到 L2，然后提取 L0
            l2_result = self._store_l2_only(content, effective_title, topic, metadata)
            l0_result = self.trigger.on_l2_stored(
                l2_id=l2_result['L2'],
                content=content,
                title=effective_title,
                topic=topic,
                enable_l1=False,
                enable_l0=True
            )
            result = {**l2_result, **l0_result}
            if l2_result.get("pruned"):
                result["aggregate_rebuild"] = self.rebuild_aggregates()
            return result
        
        elif layer == "all":
            # ✅ v5.0 核心：存储 L2 并自动触发 L1/L0 提取
            l2_result = self._store_l2_only(content, effective_title, topic, metadata)
            
            if auto_extract:
                all_results = self.trigger.on_l2_stored(
                    l2_id=l2_result['L2'],
                    content=content,
                    title=effective_title,
                    topic=topic,
                    enable_l1=True,
                    enable_l0=True
                )
                result = {**l2_result, **all_results}
                self._process_extraction_metadata(l2_result['L2'], all_results)
                if l2_result.get("pruned"):
                    result["aggregate_rebuild"] = self.rebuild_aggregates()
                return result
            else:
                return l2_result
        
        else:
            raise ValueError(f"Unknown layer: {layer}")
    
    def _store_l2_only(self, content: str, title: str, topic: str, 
                       metadata: Dict) -> Dict[str, str]:
        """仅存储到 L2 层"""
        enriched_metadata = self._with_provenance_metadata(metadata)
        content_lines = content.split('\n')
        l2_id = self.l2.store_daily(
            title=title,
            content_lines=content_lines,
            metadata={**enriched_metadata, "topic": topic}
        )
        
        # 同时存储到向量数据库
        if self._vector_store_can_add():
            add_payload = {
                "doc_id": l2_id,
                "content": content,
                "layer": "L2",
                "source": l2_id,
                "metadata": {
                    "title": title,
                    "topic": topic,
                    **enriched_metadata
                }
            }
            try:
                add_success = self.vector_store.add(**add_payload)
                if not add_success:
                    self._handle_vector_add_failure(
                        l2_id=l2_id,
                        add_payload=add_payload,
                        reason="vector_store.add returned False",
                    )
            except Exception as e:
                self._handle_vector_add_failure(
                    l2_id=l2_id,
                    add_payload=add_payload,
                    reason=str(e),
                )

        entry = self.l2.get_entry(l2_id)
        lifecycle_result: Optional[Dict[str, Any]] = None
        if entry:
            lifecycle_result = self.lifecycle.register_memory(
                memory_id=l2_id,
                title=entry.get("title", title),
                topic=entry.get("topic", topic),
                layer_type=entry.get("type", "daily"),
                source_path=entry.get("source_path", ""),
                metadata={**entry.get("metadata", {}), **enriched_metadata},
            )
            prune_result = self.lifecycle.prune_scope(entry.get("scope", f"topic:{topic}"))
        else:
            prune_result = {"triggered": False, "pruned": []}

        result = {"L2": l2_id}
        self._attach_lifecycle_status(result, lifecycle_result, prune_result)
        if entry and self._is_session_transcript_entry(entry):
            sync_ok = self._sync_session_transcript_index_memory(l2_id)
            if not sync_ok:
                print(f"⚠️ Session transcript index sync failed for {l2_id}")
        for pruned_id in prune_result.get("pruned", []):
            removed_ok = self._remove_session_transcript_index_entry(pruned_id)
            if not removed_ok:
                print(f"⚠️ Session transcript index removal failed for {pruned_id}")
        if prune_result.get("triggered"):
            result["pruned"] = prune_result.get("pruned", [])
        return result
    
    def store_episode(self,
                     episode_type: str,
                     content: str,
                     source: str = "",
                     topic: str = "general",
                     auto_extract: bool = True) -> Dict[str, str]:
        """存储 episode 并触发分层"""
        episode_metadata = self._with_provenance_metadata({"topic": topic})
        # 存储到 L2 episode
        l2_id = self.l2.store_episode(
            episode_type=episode_type,
            content=content,
            source=source,
            metadata=episode_metadata,
        )
        
        if auto_extract:
            result = self.trigger.on_l2_stored(
                l2_id=l2_id,
                content=content,
                title=f"Episode: {episode_type}",
                topic=topic,
                layer_type="episode"
            )
        else:
            result = {"L2": l2_id}

        entry = self.l2.get_entry(l2_id)
        lifecycle_result: Optional[Dict[str, Any]] = None
        if entry:
            lifecycle_result = self.lifecycle.register_memory(
                memory_id=l2_id,
                title=entry.get("title", f"Episode: {episode_type}"),
                topic=entry.get("topic", topic),
                layer_type=entry.get("type", "episode"),
                source_path=entry.get("source_path", ""),
                metadata={**entry.get("metadata", {}), **episode_metadata},
            )
            prune_result = self.lifecycle.prune_scope(entry.get("scope", f"topic:{topic}"))
            self._attach_lifecycle_status(result, lifecycle_result, prune_result)
            if prune_result.get("triggered"):
                result["pruned"] = prune_result.get("pruned", [])
                result["aggregate_rebuild"] = self.rebuild_aggregates()
        return result
    
    def store_evergreen(self,
                       title: str,
                       content_lines: List[str],
                       category: str = "general",
                       topic: str = "general",
                       importance: str = "medium",
                       auto_extract: bool = True) -> Dict[str, str]:
        """存储永久记忆并触发分层"""
        evergreen_metadata = self._with_provenance_metadata({"topic": topic})
        # 存储到 L2 evergreen
        l2_id = self.l2.store_evergreen(
            title=title,
            content_lines=content_lines,
            category=category,
            importance=importance,
            metadata=evergreen_metadata,
        )
        
        content = '\n'.join(content_lines)
        
        if auto_extract:
            result = self.trigger.on_l2_stored(
                l2_id=l2_id,
                content=content,
                title=title,
                topic=topic,
                layer_type="evergreen"
            )
        else:
            result = {"L2": l2_id}

        entry = self.l2.get_entry(l2_id)
        lifecycle_result: Optional[Dict[str, Any]] = None
        if entry:
            lifecycle_result = self.lifecycle.register_memory(
                memory_id=l2_id,
                title=entry.get("title", title),
                topic=entry.get("topic", topic),
                layer_type=entry.get("type", "evergreen"),
                source_path=entry.get("source_path", ""),
                metadata={**entry.get("metadata", {}), **evergreen_metadata, "importance": importance},
            )
            prune_result = self.lifecycle.prune_scope(entry.get("scope", f"topic:{topic}"))
            self._attach_lifecycle_status(result, lifecycle_result, prune_result)
            if prune_result.get("triggered"):
                result["pruned"] = prune_result.get("pruned", [])
                result["aggregate_rebuild"] = self.rebuild_aggregates()
        return result
    
    def retrieve(self,
                 query: str = "",
                 layer: str = "all",
                 topic: Optional[str] = None,
                 limit: int = 10,
                 min_similarity: Optional[float] = None,
                 vector_weight: Optional[float] = None,
                 bm25_weight: Optional[float] = None,
                 debug: bool = False,
                 entity: Optional[str] = None) -> Dict[str, List[Dict]]:
        """
        分层检索

        Args:
            query: 查询关键词
            layer: 目标层 (L0/L1/L2/all)
            topic: 主题过滤
            limit: 数量限制
            entity: 按实体名过滤检索

        Returns:
            按层分组的结果
        """
        entity_memory_ids: Optional[set] = None
        if entity:
            entity_memory_ids = set(self.entity_index.search_memory_ids_by_entity(entity))
            if not entity_memory_ids:
                return {name: [] for name in (["L0", "L1", "L2", "debug"] if debug else ["L0", "L1", "L2"])}

        intent = detect_intent(query)
        detail = {"entity": "low", "temporal": "high", "event": "high"}.get(intent, "medium")
        retrieval_query = (query or "").strip()
        if intent == "entity":
            lowered = retrieval_query.lower()
            lowered = re.sub(r"\bwho is\b", "", lowered, flags=re.IGNORECASE).strip()
            lowered = re.sub(r"\bwhat is\b", "", lowered, flags=re.IGNORECASE).strip()
            lowered = re.sub(r"\bwho\b", "", lowered, flags=re.IGNORECASE).strip()
            lowered = re.sub(r"\bwhat\b", "", lowered, flags=re.IGNORECASE).strip()
            lowered = re.sub(r"\bis\b", "", lowered, flags=re.IGNORECASE).strip()
            lowered = lowered.replace("谁是", "").replace("谁", "").replace("什么是", "").replace("是什么", "").strip()
            retrieval_query = lowered or retrieval_query

        results: Dict[str, List[Dict[str, Any]]] = {}
        hybrid_options = self._get_hybrid_options(
            min_similarity=min_similarity,
            vector_weight=vector_weight,
            bm25_weight=bm25_weight,
        )
        debug_info: Optional[Dict[str, Any]] = None
        if debug:
            debug_info = {
                "query": query,
                "topic": topic,
                "layer": layer,
                "intent": intent,
                "detail": detail,
                "config": hybrid_options,
            }
        inner_limit = limit * 3
        vector_store_available = self._vector_store_can_query()

        queries = [retrieval_query]
        if intent in ("general", "event") and vector_store_available:
            queries = self._expand_query_sync(retrieval_query, debug_info)
        if debug_info is not None:
            debug_info["queries"] = queries
            if not vector_store_available:
                self._vector_retrieve_l2(
                    query=queries[0] if queries else retrieval_query,
                    topic=topic,
                    limit=inner_limit,
                    min_similarity=hybrid_options["min_similarity"],
                    debug_info=debug_info,
                )

        keyword_results = self.l2.search(query=queries[0], scope="all") if queries[0] else []
        if topic:
            keyword_results = [item for item in keyword_results if item.get("topic") == topic]

        vector_lists: List[List[Dict[str, Any]]] = []
        query_embedding = None
        if vector_store_available:
            for index, q in enumerate(queries):
                vector_lists.append(
                    self._vector_retrieve_l2(
                        query=q,
                        topic=topic,
                        limit=inner_limit,
                        min_similarity=hybrid_options["min_similarity"],
                        debug_info=debug_info if index == 0 else None,
                    )
                )
            query_embedding = self._get_query_embedding(queries[0])

        retrieval_config = self.config.get("retrieval", {}) if isinstance(self.config, dict) else {}
        fusion_method = str(retrieval_config.get("fusion_method", "rrf")).strip().lower()
        if vector_weight is not None or bm25_weight is not None:
            fusion_method = "weighted"
        if not vector_store_available:
            fusion_method = "weighted"
        if debug_info is not None:
            debug_info["fusion_method"] = fusion_method

        fused_l2_results: List[Dict[str, Any]] = []
        if fusion_method == "rrf":
            from retrieval.hybrid_fusion import fuse_rrf, cosine_rescore
            fused_l2_results = fuse_rrf(
                vector_results=vector_lists[0] if vector_lists else [],
                bm25_results=keyword_results,
                vector_lists=vector_lists[1:] if len(vector_lists) > 1 else None,
                k=int(retrieval_config.get("rrf_k", 60)),
            )
            if query_embedding is not None:
                self._attach_result_embeddings(fused_l2_results[: max(inner_limit, 50)])
                fused_l2_results = cosine_rescore(fused_l2_results, query_embedding)
            for item in fused_l2_results:
                reasons: List[str] = []
                reasons.append(f"rrf={float(item.get('_rrf_score_norm', 0.0)):.4f}")
                if item.get("_cosine_score") is not None:
                    reasons.append(f"cosine={float(item.get('_cosine_score', 0.0)):.4f}")
                item["_debug_explain"] = {
                    "hybrid_score": round(float(item.get("_hybrid_score", 0.0)), 4),
                    "vector_score": round(float(item.get("_vector_score", 0.0)), 4),
                    "bm25_score": round(float(item.get("_bm25_score", 0.0)), 4),
                    "match_score": round(float(item.get("_match_score", 0.0)), 4),
                    "lifecycle_score": round(float(item.get("_lifecycle_score", 0.0)), 4),
                    "reasons": reasons,
                    "matched_terms": (item.get("_debug_match") or {}).get("matched_terms", []),
                    "coverage": round(float((item.get("_debug_match") or {}).get("coverage", 0.0)), 4),
                    "exact_match": bool((item.get("_debug_match") or {}).get("exact_match", False)),
                }
        else:
            vector_l2_results = vector_lists[0] if vector_lists else []
            vector_l2_ids = {item.get("id") for item in vector_l2_results if item.get("id")}
            vector_scores = {
                item.get("id"): float(item.get("_vector_score", 0.0))
                for item in vector_l2_results
                if item.get("id")
            }
            merged = self._merge_results(keyword_results, vector_l2_results, key_field="id")
            self._apply_hybrid_scores(merged, hybrid_options["vector_weight"], hybrid_options["bm25_weight"])
            if debug_info is not None:
                debug_info["vector_ids"] = len(vector_l2_ids)
            fused_l2_results = merged

        fused_l2_results = [item for item in fused_l2_results if self.lifecycle.is_visible(item.get("id"))]
        fused_l2_results = self._sort_by_lifecycle(fused_l2_results, inner_limit)
        fused_scores = {item.get("id"): float(item.get("_hybrid_score", 0.0)) for item in fused_l2_results if item.get("id")}
        fused_ids = {mem_id for mem_id in fused_scores.keys() if mem_id}

        if layer in ("L0", "all"):
            l0_results = self.l0.retrieve(query=queries[0], topic=topic, limit=inner_limit)
            if fused_ids:
                l0_related = self._retrieve_l0_by_sources(topic=topic, source_ids=fused_ids, vector_scores=fused_scores)
                l0_results = self._merge_results(l0_results, l0_related, key_field="source_l2")
            self._apply_source_scores(l0_results, fused_scores, hybrid_options)
            if debug:
                debug_info.setdefault("layers", {})["L0"] = self._build_layer_debug(l0_results)
            results['L0'] = self._sort_by_lifecycle(
                [item for item in l0_results if self.lifecycle.is_visible(item.get("source_l2"))],
                inner_limit,
            )

        if layer in ("L1", "all"):
            l1_results = self._retrieve_l1(query=queries[0], topic=topic, limit=inner_limit)
            if fused_ids:
                l1_related = self._retrieve_l1_by_sources(topic=topic, source_ids=fused_ids, vector_scores=fused_scores)
                l1_results = self._merge_results(l1_results, l1_related, key_field="source_l2")
            self._apply_source_scores(l1_results, fused_scores, hybrid_options)
            if debug:
                debug_info.setdefault("layers", {})["L1"] = self._build_layer_debug(l1_results)
            results['L1'] = self._sort_by_lifecycle(
                [item for item in l1_results if self.lifecycle.is_visible(item.get("source_l2"))],
                inner_limit,
            )

        if layer in ("L2", "all"):
            if debug_info is not None:
                debug_info.setdefault("layers", {})["L2"] = self._build_layer_debug(fused_l2_results)
            results['L2'] = fused_l2_results

        if "L2" in results:
            results["L2"] = dedup_results(results["L2"])

        if layer == "all":
            baseline: List[Dict[str, Any]] = []
            for name in ("L0", "L1", "L2"):
                for item in results.get(name, []):
                    tagged = dict(item)
                    tagged["layer"] = name
                    baseline.append(tagged)
            enriched = compiled_truth_guarantee(baseline, self)
            appended = enriched[len(baseline) :]
            if appended and "L1" in results:
                for item in appended:
                    if str(item.get("layer") or "").upper() == "L1":
                        results["L1"].append(item)

        resolved_limits = {"L0": limit, "L1": limit, "L2": limit}
        if layer == "all" and detail == "low":
            resolved_limits["L2"] = max(1, limit // 4)
        for layer_name in list(results.keys()):
            results[layer_name] = results[layer_name][: resolved_limits.get(layer_name, limit)]

        # 应用实体过滤和过期标注
        from datetime import date
        today = date.today().isoformat()
        for layer_name, items in results.items():
            if layer_name == "debug":
                continue
            filtered_items = []
            for item in items:
                source_id = item.get("source_l2") or item.get("id")
                # entity 过滤
                if entity_memory_ids is not None and source_id not in entity_memory_ids:
                    continue
                # valid_until 过期标注
                entry = self.lifecycle._manifest.get(source_id) if source_id else None
                valid_until = entry.get("metadata", {}).get("valid_until") if entry else None
                if valid_until and valid_until < today:
                    item["_expired"] = True
                    item["_expired_badge"] = "⚠️ 已过期"
                filtered_items.append(item)
            results[layer_name] = filtered_items[:limit]

        touched_ids: List[str] = []
        for items in results.values():
            for item in items:
                source_id = item.get("source_l2") or item.get("id")
                if source_id:
                    touched_ids.append(source_id)
        self.lifecycle.touch(list(dict.fromkeys(touched_ids)))
        if debug:
            if debug_info is None:
                debug_info = {}
            debug_info["final_counts"] = {
                layer_name: len(items)
                for layer_name, items in results.items()
            }
            debug_info["top_hits"] = {
                layer_name: [self._compact_debug_item(item) for item in items[:min(limit, 5)]]
                for layer_name, items in results.items()
            }
            results["debug"] = debug_info
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
                entries = self._parse_l1_file(content, file.stem)
                if not query:
                    results.extend(entries)
                    continue
                haystacks = [
                    "\n".join(
                        [
                            str(entry.get("title", "")),
                            str(entry.get("summary", "")),
                            str(entry.get("content", "")),
                            str(entry.get("topic", "")),
                            str(entry.get("source_l2", "")),
                        ]
                    )
                    for entry in entries
                ]
                matches = match_query_corpus(query, haystacks)
                for entry, match in zip(entries, matches):
                    if not match["matched"]:
                        continue
                    entry["_match_score"] = match["score"]
                    entry["_bm25_score"] = match["bm25_score"]
                    entry["_debug_match"] = match
                    results.append(entry)
        
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

    def _retrieve_l1_by_sources(self, topic: Optional[str], source_ids: Set[str], vector_scores: Dict[str, float]) -> List[Dict[str, Any]]:
        if not source_ids:
            return []
        entries = self._retrieve_l1(query="", topic=topic, limit=10000)
        return [
            {**entry, "_vector_score": float(vector_scores.get(entry.get("source_l2"), 0.0))}
            for entry in entries
            if entry.get("source_l2") in source_ids
        ]

    def _retrieve_l0_by_sources(self, topic: Optional[str], source_ids: Set[str], vector_scores: Dict[str, float]) -> List[Dict[str, Any]]:
        if not source_ids:
            return []
        entries = self.l0.retrieve(query="", topic=topic, limit=10000)
        return [
            {**entry, "_vector_score": float(vector_scores.get(entry.get("source_l2"), 0.0))}
            for entry in entries
            if entry.get("source_l2") in source_ids
        ]
    
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

            source_l2 = None
            for line in lines:
                if '**来源**:' in line:
                    match = re.search(r'\[([^\]]+)\]', line)
                    if match:
                        source_l2 = match.group(1)
                    else:
                        source_l2 = line.split(':', 1)[1].strip()
                    break
            
            entries.append({
                "type": "topic",
                "topic": topic,
                "title": title,
                "timestamp": timestamp,
                "summary": summary,
                "content": section[:1000],
                "source_l2": source_l2,
            })
        
        return entries
    
    def progressive_retrieve(self,
                            query: str,
                            limit_per_layer: int = 5,
                            **kwargs) -> Dict[str, List[Dict]]:
        """渐进式检索 - 先 L0，再 L1，最后 L2"""
        return self.retrieve(query=query, layer="all", limit=limit_per_layer, **kwargs)

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
        vector_stats = self.vector_store.get_stats() if self._vector_store_can_query() and hasattr(self.vector_store, "get_stats") else {"enabled": False}
        if not vector_stats.get("enabled", False):
            vector_stats["reason"] = self._vector_store_unavailable_reason()
        vector_stats["add_failures"] = self._vector_store_add_failures
        if self._vector_store_last_add_failure is not None:
            vector_stats["last_add_failure"] = dict(self._vector_store_last_add_failure)
        transcript_index_stats = (
            self.session_transcript_index.get_stats()
            if self._session_transcript_index_available()
            else {
                "enabled": False,
                "reason": self._session_transcript_index_error or "session transcript index unavailable",
            }
        )
        if self._session_transcript_index_available():
            transcript_index_stats["enabled"] = True
        
        return {
            'L0': l0_stats,
            'L1': l1_stats,
            'L2': l2_stats,
            'vector_store': vector_stats,
            'session_transcript_index': transcript_index_stats,
            'lifecycle': self.lifecycle.get_stats(),
        }

    def forget(self, memory_id: str, force: bool = False) -> Dict[str, Any]:
        entry = self.l2.get_entry(memory_id)
        is_session_transcript = bool(entry and self._is_session_transcript_entry(entry))
        result = self.lifecycle.forget(memory_id=memory_id, force=force)
        if not result.get("success"):
            return result
        if force:
            removed = self.l2.delete_entry(memory_id)
            vector_removed = self.vector_store.delete(memory_id) if self.vector_store is not None else False
            transcript_removed = self._remove_session_transcript_index_entry(memory_id) if is_session_transcript else False
            self.lifecycle.delete_manifest_entry(memory_id)
            return {
                **result,
                "removed_from_l2": removed,
                "removed_from_vector_store": vector_removed,
                "removed_from_session_transcript_index": transcript_removed,
            }
        transcript_removed = self._remove_session_transcript_index_entry(memory_id) if is_session_transcript else False
        return {
            **result,
            "removed_from_session_transcript_index": transcript_removed,
        }

    def restore(self, memory_id: str) -> Dict[str, Any]:
        result = self.lifecycle.restore(memory_id)
        if not result.get("success"):
            return result
        transcript_reindexed = self._sync_session_transcript_index_memory(memory_id)
        return {
            **result,
            "restored_to_session_transcript_index": transcript_reindexed,
        }

    def cleanup(self, dry_run: bool = False, scope: Optional[str] = None) -> Dict[str, Any]:
        return self.lifecycle.cleanup_events(dry_run=dry_run, scope=scope)

    def set_pinned(self, memory_id: str, pinned: bool) -> Dict[str, Any]:
        return self.lifecycle.set_pinned(memory_id=memory_id, pinned=pinned)

    def set_importance(self, memory_id: str, importance: str) -> Dict[str, Any]:
        return self.lifecycle.set_importance(memory_id=memory_id, importance=importance)

    def feedback(
        self,
        label: str,
        memory_id: Optional[str] = None,
        topic: Optional[str] = None,
        query: Optional[str] = None,
        note: str = "",
    ) -> Dict[str, Any]:
        result = self.lifecycle.record_feedback(
            label=label,
            memory_id=memory_id,
            topic=topic,
            query=query,
            note=note,
        )
        if not result.get("success"):
            return result
        memory = self.lifecycle.get_memory(memory_id) if memory_id else None
        title = memory.get("title") if memory else (query or result.get("scope"))
        context = "\n".join(
            [
                f"memory_id={memory_id or 'N/A'}",
                f"scope={result.get('scope', 'unknown')}",
                f"query={query or ''}",
                f"note={note}",
            ]
        )
        tags = [label, result.get("scope", "unknown").replace(":", "-")]
        if label == "useful":
            governance_log_id = self.learnings.record(
                content=f"记忆反馈 useful: {title}",
                category="insight",
                context=context,
                tags=tags,
            )
        else:
            governance_log_id = self.errors.record(
                error_description=f"记忆反馈 {label}: {title}",
                severity="high" if label == "wrong" else "medium",
                context=context,
                error_message=note or query or "",
                tags=tags,
            )
        return {**result, "governance_log_id": governance_log_id}

    def rebuild_aggregates(self, include_archived: bool = False) -> Dict[str, Any]:
        entries = [
            entry
            for entry in self.l2.iter_entries()
            if self.lifecycle.is_visible(entry.get("id"), include_archived=include_archived)
        ]
        result = self.trigger.rebuild_from_entries(entries)
        lifecycle_persisted = self.lifecycle.mark_rebuild()
        payload = {
            **result,
            "source_entries": len(entries),
            "include_archived": include_archived,
            "session_transcript_index": self._rebuild_session_transcript_index(include_archived=include_archived),
        }
        if not lifecycle_persisted:
            payload["lifecycle_persisted"] = False
            payload["lifecycle_error"] = "lifecycle state persistence failed"
        return payload

    def scan_conflicts(self, output_path: Optional[str] = None) -> Dict[str, Any]:
        detector = ConflictDetector(self.base_path)
        report_path = Path(output_path) if output_path else None
        return detector.write_report(output_path=report_path)

    def _process_extraction_metadata(self, l2_id: str, trigger_results: Dict[str, Any]) -> None:
        """处理 L1 提取后的元数据（triples、valid_until）"""
        triples = trigger_results.get("_triples")
        if triples:
            self.entity_index.add_triples(l2_id, triples)

        valid_until = trigger_results.get("_valid_until")
        if valid_until:
            entry = self.l2.get_entry(l2_id)
            if entry:
                self.lifecycle.register_memory(
                    memory_id=l2_id,
                    title=entry.get("title", ""),
                    topic=entry.get("topic", "general"),
                    layer_type=entry.get("type", "daily"),
                    source_path=entry.get("source_path", ""),
                    metadata={**entry.get("metadata", {}), "valid_until": valid_until},
                )

    def _attach_lifecycle_status(
        self,
        result: Dict[str, Any],
        lifecycle_result: Optional[Dict[str, Any]],
        prune_result: Optional[Dict[str, Any]] = None,
    ) -> None:
        lifecycle_payloads = [payload for payload in (lifecycle_result, prune_result) if payload]
        if not lifecycle_payloads:
            return
        persisted = all(bool(payload.get("persisted", True)) for payload in lifecycle_payloads)
        if persisted:
            return
        result["lifecycle_persisted"] = False
        last_error = next(
            (payload.get("last_io_error") for payload in reversed(lifecycle_payloads) if payload.get("last_io_error")),
            None,
        )
        if last_error is not None:
            result["lifecycle_error"] = last_error

    def _sort_by_lifecycle(self, items: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        retrieval_config = self.config.get("retrieval", {}) if isinstance(self.config, dict) else {}
        lifecycle_weight = float(retrieval_config.get("lifecycle_weight", 0.05))

        def resolve_lifecycle(item: Dict[str, Any]) -> float:
            cached = item.get("_lifecycle_score")
            if cached is not None:
                return float(cached)
            return float(
                self.lifecycle.rank_bonus(
                    item.get("source_l2") or item.get("id"),
                    scope=item.get("scope") or (f"topic:{item.get('topic')}" if item.get("topic") else None),
                )
            )

        def resolve_final(item: Dict[str, Any]) -> float:
            hybrid = float(item.get("_hybrid_score", 0.0))
            lifecycle = resolve_lifecycle(item)
            final_score = hybrid + (lifecycle * lifecycle_weight)
            item["_final_score"] = final_score
            item["_lifecycle_score"] = lifecycle
            return final_score

        ranked = sorted(
            items,
            key=lambda item: (
                resolve_final(item),
                item.get("_hybrid_score", 0.0),
                item.get("_vector_score", 0.0),
                item.get("_bm25_score", 0.0),
                item.get("_match_score", 0.0),
                item.get("timestamp", ""),
            ),
            reverse=True,
        )
        return ranked[:limit]

    def _vector_retrieve_l2(
        self,
        query: str,
        topic: Optional[str],
        limit: int,
        min_similarity: float,
        debug_info: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not query:
            if debug_info is not None:
                debug_info["vector"] = {
                    "enabled": self._vector_store_can_query(),
                    "reason": "empty_query",
                    "requested_limit": limit,
                    "raw_hits": 0,
                    "returned_hits": 0,
                    "min_similarity": min_similarity,
                    "filtered_out": [],
                    "top_hits": [],
                }
            return []
        if not self._vector_store_can_query():
            if debug_info is not None:
                debug_info["vector"] = {
                    "enabled": False,
                    "reason": self._vector_store_unavailable_reason(),
                    "requested_limit": limit,
                    "raw_hits": 0,
                    "returned_hits": 0,
                    "min_similarity": min_similarity,
                    "filtered_out": [],
                    "top_hits": [],
                }
            return []
        try:
            raw_results = self.vector_store.search(query=query, top_k=max(limit, 10), layer="L2")
        except Exception as e:
            print(f"⚠️ Vector search failed: {e}")
            if debug_info is not None:
                debug_info["vector"] = {
                    "enabled": False,
                    "reason": str(e),
                    "requested_limit": limit,
                    "raw_hits": 0,
                    "returned_hits": 0,
                    "min_similarity": min_similarity,
                    "filtered_out": [],
                    "top_hits": [],
                }
            return []
        results: List[Dict[str, Any]] = []
        filtered_out: List[Dict[str, Any]] = []
        for item in raw_results:
            memory_id = item.get("id")
            if not memory_id:
                continue
            entry = self.l2.get_entry(memory_id)
            if not entry:
                continue
            if topic and entry.get("topic") != topic:
                continue
            similarity = float(item.get("score", 0.0))
            if similarity < min_similarity:
                filtered_out.append(
                    {
                        "id": memory_id,
                        "score": similarity,
                        "title": entry.get("title"),
                    }
                )
                continue
            results.append({
                "type": entry.get("type"),
                "id": entry.get("id"),
                "title": entry.get("title"),
                "topic": entry.get("topic"),
                "scope": entry.get("scope"),
                "timestamp": entry.get("timestamp"),
                "content": entry.get("content", ""),
                "preview": entry.get("content", "")[:200],
                "_vector_score": similarity,
            })
        if debug_info is not None:
            debug_info["vector"] = {
                "enabled": True,
                "requested_limit": limit,
                "raw_hits": len(raw_results),
                "returned_hits": len(results),
                "min_similarity": min_similarity,
                "filtered_out": filtered_out[:10],
                "top_hits": [
                    {
                        "id": item.get("id"),
                        "title": item.get("title"),
                        "score": round(float(item.get("_vector_score", 0.0)), 4),
                    }
                    for item in results[:10]
                ],
            }
        return results

    def _merge_results(self, primary: List[Dict[str, Any]], secondary: List[Dict[str, Any]], key_field: str) -> List[Dict[str, Any]]:
        merged: Dict[str, Dict[str, Any]] = {}
        ordered: List[Dict[str, Any]] = []
        for item in primary + secondary:
            key = item.get(key_field)
            if not key:
                ordered.append(item)
                continue
            existing = merged.get(key)
            if existing is None:
                merged[key] = dict(item)
                continue
            existing_match_score = float(existing.get("_match_score", 0.0))
            incoming_match_score = float(item.get("_match_score", 0.0))
            self._merge_score_field(existing, item, "_match_score")
            self._merge_score_field(existing, item, "_vector_score")
            self._merge_score_field(existing, item, "_bm25_score")
            if incoming_match_score > existing_match_score and item.get("_debug_match"):
                existing["_debug_match"] = item.get("_debug_match")
            for field, value in item.items():
                if existing.get(field) in (None, "", []):
                    existing[field] = value
        for item in merged.values():
            item.pop("_score_counts", None)
            ordered.append(item)
        return ordered

    def _vector_store_can_query(self) -> bool:
        return self.vector_store is not None and callable(getattr(self.vector_store, "search", None))

    def _vector_store_can_add(self) -> bool:
        return self.vector_store is not None and callable(getattr(self.vector_store, "add", None))

    def _vector_store_unavailable_reason(self) -> str:
        if self._vector_store_error:
            return self._vector_store_error
        if self.vector_store is None:
            return "vector store unavailable"
        if not callable(getattr(self.vector_store, "search", None)):
            return "vector search interface unavailable"
        return ""

    def _expand_query_sync(self, query: str, debug_info: Optional[Dict[str, Any]] = None) -> List[str]:
        normalized = (query or "").strip()
        if not normalized:
            return [""]
        try:
            import asyncio

            try:
                asyncio.get_running_loop()
                if debug_info is not None:
                    debug_info["query_expansion"] = {"enabled": False, "reason": "event_loop_running"}
                return [normalized]
            except RuntimeError:
                pass

            expanded = asyncio.run(expand_query(normalized))
            expanded = [item for item in expanded if str(item).strip()]
            if not expanded:
                expanded = [normalized]
            if expanded[0] != normalized:
                expanded.insert(0, normalized)
            if debug_info is not None:
                debug_info["query_expansion"] = {"enabled": True, "variants": expanded}
            return expanded
        except Exception as e:
            if debug_info is not None:
                debug_info["query_expansion"] = {"enabled": False, "reason": str(e)}
            return [normalized]

    def _get_query_embedding(self, query: str) -> Optional[List[float]]:
        if not self._vector_store_can_query():
            return None
        normalized = (query or "").strip()
        if not normalized:
            return None
        embedding_client = getattr(self.vector_store, "embedding_client", None)
        if embedding_client is None or not callable(getattr(embedding_client, "get_embedding", None)):
            return None
        try:
            embedding = embedding_client.get_embedding(normalized)
            return list(embedding)
        except Exception:
            return None

    def _attach_result_embeddings(self, results: List[Dict[str, Any]]) -> None:
        if not results:
            return
        db_path = getattr(self.vector_store, "db_path", None) if self.vector_store is not None else None
        if db_path is None:
            return
        ids = [item.get("id") for item in results if item.get("id")]
        if not ids:
            return
        try:
            import sqlite3
            import json
            from contextlib import closing

            with closing(sqlite3.connect(str(db_path))) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, embedding FROM vectors WHERE id IN ({})".format(",".join(["?"] * len(ids))),
                    ids,
                )
                rows = cursor.fetchall()
            embeddings = {
                doc_id: json.loads(blob.decode("utf-8")) if isinstance(blob, (bytes, bytearray)) else json.loads(blob)
                for doc_id, blob in rows
                if doc_id and blob
            }
            for item in results:
                doc_id = item.get("id")
                emb = embeddings.get(doc_id)
                if emb is not None:
                    item["_embedding"] = emb
        except Exception:
            return

    def _apply_source_scores(
        self,
        items: List[Dict[str, Any]],
        source_scores: Dict[str, float],
        hybrid_options: Dict[str, float],
    ) -> None:
        for item in items:
            source_id = item.get("source_l2") or item.get("id")
            base_score = float(source_scores.get(source_id, 0.0)) if source_id else 0.0
            bm25_score = float(item.get("_bm25_score", 0.0))
            hybrid_score = base_score or bm25_score
            if base_score > 0 and bm25_score > 0:
                hybrid_score = 0.8 * base_score + 0.2 * bm25_score
            item["_hybrid_score"] = hybrid_score
            if base_score > 0:
                item["_vector_score"] = max(float(item.get("_vector_score", 0.0)), base_score)
            lifecycle_bonus = self.lifecycle.rank_bonus(
                source_id,
                scope=item.get("scope") or (f"topic:{item.get('topic')}" if item.get("topic") else None),
            )
            item["_lifecycle_score"] = lifecycle_bonus
            reasons: List[str] = []
            if base_score > 0:
                reasons.append(f"source={base_score:.4f}")
            if bm25_score > 0:
                reasons.append(f"bm25={bm25_score:.4f}")
            reasons.append(f"lifecycle={lifecycle_bonus:.4f}")
            match_debug = item.get("_debug_match") or {}
            item["_debug_explain"] = {
                "hybrid_score": round(hybrid_score, 4),
                "vector_score": round(float(item.get("_vector_score", 0.0)), 4),
                "bm25_score": round(bm25_score, 4),
                "match_score": round(float(item.get("_match_score", 0.0)), 4),
                "lifecycle_score": round(lifecycle_bonus, 4),
                "reasons": reasons,
                "matched_terms": match_debug.get("matched_terms", []),
                "coverage": round(float(match_debug.get("coverage", 0.0)), 4),
                "exact_match": bool(match_debug.get("exact_match", False)),
            }

    def _with_provenance_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        merged = dict(metadata or {})
        if merged.get("commit_hash") and "pr_id" in merged:
            return merged
        provenance = collect_provenance(self.base_path)
        merged.setdefault("commit_hash", provenance.get("commit_hash"))
        merged.setdefault("pr_id", provenance.get("pr_id"))
        if provenance.get("provenance_diagnostic"):
            merged.setdefault("provenance_diagnostic", provenance.get("provenance_diagnostic"))
        return merged

    def _handle_vector_add_failure(self, l2_id: str, add_payload: Dict[str, Any], reason: str) -> None:
        self._vector_store_add_failures += 1
        self._vector_store_last_add_failure = {
            "id": l2_id,
            "reason": reason,
            "retry_attempted": False,
            "recovered": False,
        }
        print(f"⚠️ Vector store add failed for {l2_id}: {reason}")
        if not self._vector_store_can_add():
            return
        self._vector_store_last_add_failure["retry_attempted"] = True
        try:
            retry_success = self.vector_store.add(**add_payload)
        except Exception as retry_error:
            self._vector_store_last_add_failure["retry_error"] = str(retry_error)
            print(f"⚠️ Vector store retry failed for {l2_id}: {retry_error}")
            return
        if retry_success:
            self._vector_store_last_add_failure["recovered"] = True
            print(f"⚠️ Vector store add recovered on retry for {l2_id}")
            return
        self._vector_store_last_add_failure["retry_error"] = "vector_store.add returned False"
        print(f"⚠️ Vector store retry returned false for {l2_id}")

    def _merge_score_field(self, existing: Dict[str, Any], item: Dict[str, Any], field: str) -> None:
        score_counts = existing.setdefault("_score_counts", {})
        existing_score = float(existing.get(field, 0.0))
        incoming_score = float(item.get(field, 0.0))
        existing_count = int(score_counts.get(field, 1 if existing_score > 0 else 0))
        incoming_count = 1 if incoming_score > 0 else 0
        if incoming_count == 0:
            return
        total_count = existing_count + incoming_count
        if existing_count == 0:
            existing[field] = incoming_score
        else:
            existing[field] = ((existing_score * existing_count) + incoming_score) / total_count
        score_counts[field] = total_count

    def _get_hybrid_options(
        self,
        min_similarity: Optional[float],
        vector_weight: Optional[float],
        bm25_weight: Optional[float],
    ) -> Dict[str, float]:
        hybrid_config = self.config.get("retrieval", {}).get("hybrid", {})
        resolved_min_similarity = float(
            min_similarity
            if min_similarity is not None
            else hybrid_config.get("min_similarity", 0.35)
        )
        raw_vector_weight = float(
            vector_weight
            if vector_weight is not None
            else hybrid_config.get("vector_weight", 0.7)
        )
        raw_bm25_weight = float(
            bm25_weight
            if bm25_weight is not None
            else hybrid_config.get("bm25_weight", 0.3)
        )
        total_weight = raw_vector_weight + raw_bm25_weight
        if total_weight <= 0:
            raw_vector_weight = 0.7
            raw_bm25_weight = 0.3
            total_weight = 1.0
        return {
            "min_similarity": max(0.0, min(1.0, resolved_min_similarity)),
            "vector_weight": raw_vector_weight / total_weight,
            "bm25_weight": raw_bm25_weight / total_weight,
        }

    def _apply_hybrid_scores(self, items: List[Dict[str, Any]], vector_weight: float, bm25_weight: float) -> None:
        for item in items:
            vector_score = float(item.get("_vector_score", 0.0))
            bm25_score = float(item.get("_bm25_score", 0.0))
            hybrid_score = vector_weight * vector_score + bm25_weight * bm25_score
            item["_hybrid_score"] = hybrid_score
            lifecycle_bonus = self.lifecycle.rank_bonus(
                item.get("source_l2") or item.get("id"),
                scope=item.get("scope") or (f"topic:{item.get('topic')}" if item.get("topic") else None),
            )
            item["_lifecycle_score"] = lifecycle_bonus
            match_debug = item.get("_debug_match") or {}
            reasons: List[str] = []
            if vector_score > 0:
                reasons.append(f"vector={vector_score:.4f}")
            if bm25_score > 0:
                reasons.append(f"bm25={bm25_score:.4f}")
            if match_debug.get("matched_terms"):
                reasons.append(
                    f"terms={len(match_debug.get('matched_terms', []))}/{match_debug.get('total_terms', 0)}"
                )
            reasons.append(f"lifecycle={lifecycle_bonus:.4f}")
            item["_debug_explain"] = {
                "hybrid_score": round(hybrid_score, 4),
                "vector_score": round(vector_score, 4),
                "bm25_score": round(bm25_score, 4),
                "match_score": round(float(item.get("_match_score", 0.0)), 4),
                "lifecycle_score": round(lifecycle_bonus, 4),
                "reasons": reasons,
                "matched_terms": match_debug.get("matched_terms", []),
                "coverage": round(float(match_debug.get("coverage", 0.0)), 4),
                "exact_match": bool(match_debug.get("exact_match", False)),
            }

    def _build_layer_debug(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "candidate_count": len(items),
            "top_candidates": [self._compact_debug_item(item) for item in self._sort_by_lifecycle(items, min(5, len(items) or 1))]
            if items else [],
        }

    def _compact_debug_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        explanation = item.get("_debug_explain", {})
        return {
            "id": item.get("source_l2") or item.get("id"),
            "title": item.get("title"),
            "topic": item.get("topic"),
            "hybrid_score": explanation.get("hybrid_score", round(float(item.get("_hybrid_score", 0.0)), 4)),
            "vector_score": explanation.get("vector_score", round(float(item.get("_vector_score", 0.0)), 4)),
            "bm25_score": explanation.get("bm25_score", round(float(item.get("_bm25_score", 0.0)), 4)),
            "match_score": explanation.get("match_score", round(float(item.get("_match_score", 0.0)), 4)),
            "lifecycle_score": explanation.get("lifecycle_score", round(float(item.get("_lifecycle_score", 0.0)), 4)),
            "matched_terms": explanation.get("matched_terms", []),
            "reasons": explanation.get("reasons", []),
        }
    
    def sync_layers(self, full_sync: bool = False):
        """
        同步各层数据
        
        Args:
            full_sync: 是否全量重新生成
        """
        if full_sync:
            return self.rebuild_aggregates(include_archived=False)
        else:
            print("🔄 增量同步模式...")
            return {"success": False, "message": "增量同步暂未实现"}
