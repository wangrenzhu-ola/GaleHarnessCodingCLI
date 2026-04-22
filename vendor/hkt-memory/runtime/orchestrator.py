"""
Runtime recall orchestrator for agent-facing memory injection.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from retrieval.adaptive_retriever import AdaptiveRetriever
from runtime.provider import MemoryProvider
from runtime.safety import MemorySafetyGate


@dataclass
class RecallRequest:
    query: str = ""
    mode: str = "implement"
    topic: Optional[str] = None
    limit: int = 5
    entity: Optional[str] = None
    session_id: Optional[str] = None
    task_id: Optional[str] = None
    project: Optional[str] = None
    branch: Optional[str] = None
    pr: Optional[str] = None
    pr_id: Optional[str] = None
    include_recent: Optional[bool] = None
    include_session: Optional[bool] = None
    include_long_term: Optional[bool] = None
    token_budget: Optional[int] = None


class RecallOrchestrator:
    """按场景编排 recent/session/long-term 三类记忆。"""

    MODE_SOURCE_ORDER = {
        "task_start": ["recent", "long_term"],
        "implement": ["recent", "session", "long_term"],
        "debug": ["session", "long_term", "recent"],
        "review": ["long_term", "recent", "session"],
    }

    LONG_TERM_LAYER_ORDER = {
        "task_start": {"L1": 0, "L0": 1, "L2": 2},
        "implement": {"L1": 0, "L2": 1, "L0": 2},
        "debug": {"L2": 0, "L1": 1, "L0": 2},
        "review": {"L1": 0, "L0": 1, "L2": 2},
    }

    def __init__(self, provider: MemoryProvider, config: Optional[Dict[str, Any]] = None):
        self.provider = provider
        self.config = dict(config or {})
        self.adaptive = AdaptiveRetriever()
        self.safety_gate = MemorySafetyGate(self.config.get("safety", {}))

    def orchestrate(self, request: RecallRequest) -> Dict[str, Any]:
        normalized_mode = self._normalize_mode(request.mode)
        normalized_query = (request.query or "").strip()
        token_budget = max(64, int(request.token_budget or self.config.get("max_tokens", 512)))
        budget_chars = token_budget * 3

        should_lookup = bool(normalized_query)
        adaptive_reason = "empty query"
        adaptive_meta: Dict[str, Any] = {"query_length": 0}
        if normalized_query:
            should_lookup, adaptive_reason, adaptive_meta = self.adaptive.should_retrieve(normalized_query)

        prefetched = self.provider.prefetch(
            query=normalized_query,
            mode=normalized_mode,
            topic=request.topic,
            limit=max(request.limit, self.config.get("source_limit", request.limit)),
            entity=request.entity,
            session_id=request.session_id,
            task_id=request.task_id,
            project=request.project,
            branch=request.branch,
            pr=request.pr,
            pr_id=request.pr_id,
        )

        include_recent = self._resolve_include_recent(request, normalized_mode, normalized_query)
        include_session = self._resolve_include_session(request, normalized_mode, normalized_query)
        include_long_term = self._resolve_include_long_term(request, normalized_mode, should_lookup, normalized_query)

        source_payloads = {
            "recent": prefetched.get("recent", {"success": True, "count": 0, "results": []}),
            "session": prefetched.get("session", {"success": True, "count": 0, "results": []}),
            "long_term": prefetched.get("long_term", {"L0": [], "L1": [], "L2": []}),
        }
        source_enabled = {
            "recent": include_recent,
            "session": include_session,
            "long_term": include_long_term,
        }
        source_reasons = self._build_source_reasons(normalized_mode, adaptive_reason, normalized_query)

        results: List[Dict[str, Any]] = []
        sources: List[Dict[str, Any]] = []
        omitted_sources: List[Dict[str, Any]] = []
        total_chars = 0
        blocked_items = 0
        redacted_items = 0

        for source_name in self.MODE_SOURCE_ORDER[normalized_mode]:
            if not source_enabled[source_name]:
                omitted_sources.append(
                    {
                        "source": source_name,
                        "reason": self._omitted_reason(source_name, normalized_mode, should_lookup, normalized_query),
                    }
                )
                continue

            items = self._build_source_items(
                source_name=source_name,
                payload=source_payloads[source_name],
                mode=normalized_mode,
                limit=request.limit,
            )
            kept: List[Dict[str, Any]] = []
            for item in items:
                injection_item = self._prepare_item_for_injection(item)
                if injection_item is None:
                    blocked_items += 1
                    continue
                if injection_item.get("safety", {}).get("redacted"):
                    redacted_items += 1
                item = injection_item
                snippet = self._context_snippet(item)
                if total_chars + len(snippet) > budget_chars:
                    break
                total_chars += len(snippet)
                enriched = {
                    **item,
                    "why": source_reasons[source_name],
                }
                kept.append(enriched)
                results.append(enriched)
                if len(results) >= request.limit:
                    break
            if kept:
                sources.append(
                    {
                        "source": source_name,
                        "reason": source_reasons[source_name],
                        "count": len(kept),
                    }
                )
            elif items:
                omitted_sources.append(
                    {
                        "source": source_name,
                        "reason": f"token budget exhausted before adding more {source_name} context",
                    }
                )
            if len(results) >= request.limit:
                break

        return {
            "success": True,
            "mode": normalized_mode,
            "query": normalized_query,
            "count": len(results),
            "results": results,
            "sources": sources,
            "omitted_sources": omitted_sources,
            "explanation": {
                "adaptive_retrieval": {
                    "should_lookup": should_lookup,
                    "reason": adaptive_reason,
                    "metadata": adaptive_meta,
                },
                "prefetch": {
                    "enabled": True,
                    "cached": bool(prefetched.get("cached", False)),
                    "cache_key": prefetched.get("cache_key"),
                },
                "token_budget": token_budget,
                "safety": {
                    "blocked_items": blocked_items,
                    "redacted_items": redacted_items,
                },
            },
        }

    def _normalize_mode(self, mode: Optional[str]) -> str:
        lowered = str(mode or "implement").strip().lower()
        aliases = {
            "start": "task_start",
            "task-start": "task_start",
            "task_start": "task_start",
            "implement": "implement",
            "implementation": "implement",
            "debug": "debug",
            "review": "review",
        }
        return aliases.get(lowered, "implement")

    def _resolve_include_recent(self, request: RecallRequest, mode: str, query: str) -> bool:
        if request.include_recent is not None:
            return bool(request.include_recent)
        return mode in ("task_start", "implement", "review") or self._is_history_query(query)

    def _resolve_include_session(self, request: RecallRequest, mode: str, query: str) -> bool:
        if request.include_session is not None:
            return bool(request.include_session)
        if request.session_id or request.task_id or request.project or request.branch or request.pr or request.pr_id:
            return True
        return bool(query) and (mode in ("debug", "implement") or self._is_history_query(query))

    def _resolve_include_long_term(self, request: RecallRequest, mode: str, should_lookup: bool, query: str) -> bool:
        if request.include_long_term is not None:
            return bool(request.include_long_term)
        if mode == "review":
            return bool(query)
        return should_lookup and bool(query)

    def _build_source_reasons(self, mode: str, adaptive_reason: str, query: str) -> Dict[str, str]:
        history_hint = " query 带有历史上下文信号。" if self._is_history_query(query) else ""
        return {
            "recent": {
                "task_start": "新任务先恢复最近任务摘要，帮助快速找回上下文。",
                "implement": "实现阶段先看最近任务摘要，避免重复排查。" + history_hint,
                "debug": "debug 模式仍保留最近摘要，帮助对齐当前故障链路。",
                "review": "review 模式保留最近任务摘要，用于理解本次变更边界。",
            }[mode],
            "session": {
                "task_start": "当前模式不优先注入 session transcript。",
                "implement": "实现阶段保留研发过程记忆，帮助找回之前试过的路径。" + history_hint,
                "debug": "debug 模式优先看 session transcript，因为失败路径和临时结论通常只存在这里。",
                "review": "review 模式只在需要时补充 transcript，避免过程噪声压过结论。",
            }[mode],
            "long_term": {
                "task_start": "新任务需要先看稳定知识与约束。",
                "implement": f"长期知识提供稳定决策和复用模式。{adaptive_reason}",
                "debug": "debug 模式补充长期知识，帮助确认已知约束和历史修复模式。",
                "review": "review 模式优先看长期知识和抽象层，方便聚焦约束、风险和结论。",
            }[mode],
        }

    def _build_source_items(
        self,
        source_name: str,
        payload: Dict[str, Any],
        mode: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        if source_name == "recent":
            items = payload.get("results", []) if isinstance(payload, dict) else []
            return [
                {
                    "source": "recent",
                    "title": item.get("title") or item.get("session_id") or "recent session",
                    "content": item.get("summary", ""),
                    "session_id": item.get("session_id"),
                    "task_id": item.get("task_id"),
                    "project": item.get("project"),
                    "branch": item.get("branch"),
                    "pr_id": item.get("pr_id"),
                    "scope": item.get("scope"),
                    "timestamp": item.get("latest_timestamp") or item.get("timestamp"),
                    "memory_id": item.get("latest_memory_id"),
                    "metadata": item.get("metadata", {}),
                }
                for item in items[:limit]
            ]
        if source_name == "session":
            items = payload.get("results", []) if isinstance(payload, dict) else []
            return [
                {
                    "source": "session",
                    "title": item.get("title") or item.get("session_id") or "session transcript",
                    "content": item.get("preview") or item.get("content", ""),
                    "session_id": item.get("session_id"),
                    "task_id": item.get("task_id"),
                    "project": item.get("project"),
                    "branch": item.get("branch"),
                    "pr_id": item.get("pr_id"),
                    "scope": item.get("scope"),
                    "timestamp": item.get("timestamp"),
                    "memory_id": item.get("id"),
                    "score": item.get("_match_score"),
                    "metadata": item.get("metadata", {}),
                }
                for item in items[:limit]
            ]
        flat_items = self._flatten_long_term(payload, mode)
        return flat_items[:limit]

    def _flatten_long_term(self, payload: Dict[str, Any], mode: str) -> List[Dict[str, Any]]:
        layer_order = self.LONG_TERM_LAYER_ORDER.get(mode, self.LONG_TERM_LAYER_ORDER["implement"])
        flat: List[Dict[str, Any]] = []
        for layer_name, items in payload.items():
            if layer_name == "debug":
                continue
            if not isinstance(items, list):
                continue
            for item in items:
                if self._is_session_transcript_like(item):
                    continue
                flat.append(
                    {
                        "source": "long_term",
                        "layer": layer_name,
                        "title": item.get("title") or item.get("id") or layer_name,
                        "content": item.get("summary") or item.get("content", ""),
                        "topic": item.get("topic"),
                        "timestamp": item.get("timestamp"),
                        "memory_id": item.get("source_l2") or item.get("id"),
                        "score": item.get("_match_score") or item.get("_hybrid_score"),
                        "metadata": item.get("metadata", {}),
                    }
                )
        flat.sort(
            key=lambda item: (
                layer_order.get(str(item.get("layer")), 99),
                -float(item.get("score") or 0.0),
                str(item.get("timestamp") or ""),
            )
        )
        return flat

    def _is_session_transcript_like(self, item: Dict[str, Any]) -> bool:
        metadata = item.get("metadata", {}) or {}
        scope = str(item.get("scope") or metadata.get("scope") or "")
        if metadata.get("artifact_type") == "session_transcript":
            return True
        if metadata.get("source") == "auto_capture" and scope.startswith("session:"):
            return True
        return False

    def _omitted_reason(self, source_name: str, mode: str, should_lookup: bool, query: str) -> str:
        if source_name == "long_term" and not should_lookup:
            return "adaptive retrieval 判定当前 query 不需要长期记忆检索"
        if source_name == "session" and not query:
            return "没有 query 时跳过 transcript 搜索"
        if source_name == "recent":
            return f"{mode} 模式当前不需要 recent 摘要"
        if source_name == "session":
            return f"{mode} 模式当前不需要 transcript 过程记忆"
        return f"{mode} 模式当前不需要 {source_name} source"

    def _is_history_query(self, query: str) -> bool:
        lowered = (query or "").lower()
        hints = [
            "上次",
            "之前",
            "以前",
            "怎么修",
            "做到哪",
            "recent",
            "previous",
            "last time",
            "history",
        ]
        return any(hint in lowered for hint in hints)

    def _context_snippet(self, item: Dict[str, Any]) -> str:
        title = str(item.get("title") or "")
        content = str(item.get("content") or "")
        return f"{title}\n{content}"

    def _prepare_item_for_injection(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        metadata = dict(item.get("metadata", {}) or {})
        analysis = self.safety_gate.sanitize_for_injection(
            content=str(item.get("content") or ""),
            metadata=metadata,
        )
        if not analysis.get("allow_injection", True):
            return None
        prepared = dict(item)
        prepared["content"] = analysis.get("content", prepared.get("content", ""))
        prepared["safety"] = {
            "redacted": bool(analysis.get("redactions")),
            "risks": list(analysis.get("risks", [])),
        }
        return prepared
