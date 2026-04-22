"""
Minimal memory provider contract and default local implementation.
"""

import copy
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Protocol


class MemoryProvider(Protocol):
    """最小 memory provider contract，供 orchestrator / prefetch 复用。"""

    def retrieve(
        self,
        query: str,
        layer: str = "all",
        topic: Optional[str] = None,
        limit: int = 5,
        entity: Optional[str] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        ...

    def list_recent(
        self,
        limit: int = 5,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        ...

    def search_session(
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
        ...

    def prefetch(
        self,
        query: str = "",
        mode: str = "implement",
        topic: Optional[str] = None,
        limit: int = 5,
        entity: Optional[str] = None,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        ...


class LocalMemoryProvider:
    """基于现有 LayerManagerV5 的默认 provider。"""

    def __init__(self, layers: Any, cache_ttl_seconds: int = 300, cache_max_entries: int = 32):
        self.layers = layers
        self.cache_ttl_seconds = max(1, int(cache_ttl_seconds))
        self.cache_max_entries = max(1, int(cache_max_entries))
        self._prefetch_cache: Dict[str, Dict[str, Any]] = {}

    def retrieve(
        self,
        query: str,
        layer: str = "all",
        topic: Optional[str] = None,
        limit: int = 5,
        entity: Optional[str] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        return self.layers.retrieve(
            query=query,
            layer=layer,
            topic=topic,
            limit=limit,
            entity=entity,
        )

    def list_recent(
        self,
        limit: int = 5,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.layers.session_search(
            query="",
            limit=limit,
            session_id=session_id,
            task_id=task_id,
            project=project,
            branch=branch,
            pr=pr,
            pr_id=pr_id,
        )

    def search_session(
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
        return self.layers.session_search(
            query=query,
            limit=limit,
            session_id=session_id,
            task_id=task_id,
            project=project,
            branch=branch,
            pr=pr,
            pr_id=pr_id,
        )

    def prefetch(
        self,
        query: str = "",
        mode: str = "implement",
        topic: Optional[str] = None,
        limit: int = 5,
        entity: Optional[str] = None,
        session_id: Optional[str] = None,
        task_id: Optional[str] = None,
        project: Optional[str] = None,
        branch: Optional[str] = None,
        pr: Optional[str] = None,
        pr_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        key = self._build_prefetch_key(
            query=query,
            mode=mode,
            topic=topic,
            limit=limit,
            entity=entity,
            session_id=session_id,
            task_id=task_id,
            project=project,
            branch=branch,
            pr=pr,
            pr_id=pr_id,
        )
        cached = self._get_cached_prefetch(key)
        if cached is not None:
            cached["cached"] = True
            return cached

        recent = self.list_recent(
            limit=limit,
            session_id=session_id,
            task_id=task_id,
            project=project,
            branch=branch,
            pr=pr,
            pr_id=pr_id,
        )
        session_results = (
            self.search_session(
                query=query,
                limit=limit,
                session_id=session_id,
                task_id=task_id,
                project=project,
                branch=branch,
                pr=pr,
                pr_id=pr_id,
            )
            if (query or "").strip()
            else {"success": True, "mode": "search", "count": 0, "results": []}
        )
        long_term = (
            self.retrieve(query=query, layer="all", topic=topic, limit=limit, entity=entity)
            if (query or "").strip()
            else {"L0": [], "L1": [], "L2": []}
        )

        payload = {
            "success": True,
            "cached": False,
            "cache_key": key,
            "mode": mode,
            "query": query,
            "recent": recent,
            "session": session_results,
            "long_term": long_term,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        self._store_prefetch(key, payload)
        return copy.deepcopy(payload)

    def _build_prefetch_key(self, **kwargs: Any) -> str:
        normalized = {key: value for key, value in kwargs.items() if value not in (None, "", [])}
        return json.dumps(normalized, sort_keys=True, ensure_ascii=False)

    def _get_cached_prefetch(self, key: str) -> Optional[Dict[str, Any]]:
        self._evict_expired_prefetch()
        entry = self._prefetch_cache.get(key)
        if not entry:
            return None
        expires_at = entry.get("expires_at")
        if expires_at and expires_at <= datetime.now(timezone.utc):
            self._prefetch_cache.pop(key, None)
            return None
        return copy.deepcopy(entry.get("payload"))

    def _store_prefetch(self, key: str, payload: Dict[str, Any]) -> None:
        self._evict_expired_prefetch()
        if len(self._prefetch_cache) >= self.cache_max_entries:
            oldest = min(
                self._prefetch_cache.items(),
                key=lambda item: item[1].get("created_at", datetime.now(timezone.utc)),
            )[0]
            self._prefetch_cache.pop(oldest, None)
        now = datetime.now(timezone.utc)
        self._prefetch_cache[key] = {
            "payload": copy.deepcopy(payload),
            "created_at": now,
            "expires_at": now + timedelta(seconds=self.cache_ttl_seconds),
        }

    def _evict_expired_prefetch(self) -> None:
        now = datetime.now(timezone.utc)
        expired_keys = [
            key
            for key, entry in self._prefetch_cache.items()
            if entry.get("expires_at") and entry["expires_at"] <= now
        ]
        for key in expired_keys:
            self._prefetch_cache.pop(key, None)
