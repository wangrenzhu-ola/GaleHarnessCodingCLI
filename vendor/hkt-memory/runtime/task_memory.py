"""
Task-aware memory runtime primitives for GaleHarness workflows.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from runtime.safety import MemorySafetyGate
from session.task_ledger import TaskLedger


SCHEMA_VERSION = "gale-task-memory.v1"
ALLOWED_CAPTURE_EVENT_TYPES = {
    "failed_attempt",
    "root_cause",
    "verification_result",
    "handoff_state",
    "next_action",
    "decision",
    "code_review_finding",
    "follow_up",
    "feedback",
    "skip_capture",
}


def parse_json_payload(raw: str, label: str) -> Dict[str, Any]:
    """Parse a CLI JSON argument and return a structured object."""
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} must be valid JSON: {exc.msg}") from exc
    if not isinstance(payload, dict):
        raise ValueError(f"{label} must be a JSON object")
    return payload


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _string(value: Any, default: str = "") -> str:
    if value in (None, ""):
        return default
    return str(value)


def _list_of_strings(value: Any) -> List[str]:
    if value in (None, ""):
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    return [str(value)]


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


@dataclass
class TaskEnvelope:
    schema_version: str = SCHEMA_VERSION
    project: str = ""
    repo_root: str = ""
    branch: str = ""
    task_id: str = ""
    skill: str = ""
    phase: str = "start"
    mode: str = "implement"
    pr_id: Optional[str] = None
    issue_id: Optional[str] = None
    input_summary: str = ""
    artifact_type: str = ""
    files: List[str] = field(default_factory=list)
    verification: Dict[str, Any] = field(default_factory=dict)
    confidence: str = "unknown"
    extensions: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "TaskEnvelope":
        mode = _string(payload.get("mode") or payload.get("phase_mode"), "implement")
        return cls(
            schema_version=_string(payload.get("schema_version"), SCHEMA_VERSION),
            project=_string(payload.get("project")),
            repo_root=_string(payload.get("repo_root") or payload.get("project_path")),
            branch=_string(payload.get("branch")),
            task_id=_string(payload.get("task_id")),
            skill=_string(payload.get("skill")),
            phase=_string(payload.get("phase"), "start"),
            mode=normalize_mode(mode),
            pr_id=_optional_string(payload.get("pr_id") or payload.get("pr")),
            issue_id=_optional_string(payload.get("issue_id") or payload.get("issue")),
            input_summary=_string(payload.get("input_summary") or payload.get("query")),
            artifact_type=_string(payload.get("artifact_type")),
            files=_list_of_strings(payload.get("files") or payload.get("files_touched")),
            verification=_dict(payload.get("verification")),
            confidence=_string(payload.get("confidence"), "unknown"),
            extensions=_dict(payload.get("extensions")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def recall_query(self) -> str:
        parts = [
            self.input_summary,
            self.artifact_type,
            self.skill,
            " ".join(self.files[:8]),
        ]
        return " ".join(part for part in parts if part).strip()


@dataclass
class CaptureEvent:
    schema_version: str = SCHEMA_VERSION
    event_type: str = ""
    project: str = ""
    repo_root: str = ""
    branch: str = ""
    task_id: str = ""
    skill: str = ""
    phase: str = ""
    artifact_type: str = ""
    input_summary: str = ""
    files: List[str] = field(default_factory=list)
    verification: Dict[str, Any] = field(default_factory=dict)
    confidence: str = "unknown"
    summary: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    extensions: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "CaptureEvent":
        event_type = _string(payload.get("event_type") or payload.get("type"))
        return cls(
            schema_version=_string(payload.get("schema_version"), SCHEMA_VERSION),
            event_type=event_type,
            project=_string(payload.get("project")),
            repo_root=_string(payload.get("repo_root") or payload.get("project_path")),
            branch=_string(payload.get("branch")),
            task_id=_string(payload.get("task_id")),
            skill=_string(payload.get("skill")),
            phase=_string(payload.get("phase")),
            artifact_type=_string(payload.get("artifact_type")),
            input_summary=_string(payload.get("input_summary")),
            files=_list_of_strings(payload.get("files") or payload.get("files_touched")),
            verification=_dict(payload.get("verification")),
            confidence=_string(payload.get("confidence"), "unknown"),
            summary=_string(
                payload.get("summary")
                or payload.get("content")
                or payload.get("message")
                or payload.get("input_summary")
            ),
            payload=_dict(payload.get("payload") or payload.get("data")),
            extensions=_dict(payload.get("extensions")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _optional_string(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None
    return str(value)


def normalize_mode(mode: str) -> str:
    aliases = {
        "start": "task_start",
        "task-start": "task_start",
        "task_start": "task_start",
        "work": "implement",
        "implementation": "implement",
        "implement": "implement",
        "debug": "debug",
        "review": "review",
    }
    return aliases.get(str(mode or "implement").strip().lower(), "implement")


class TaskMemoryRuntime:
    """Facade used by the CLI and future MCP tools."""

    def __init__(self, memory: Any):
        self.memory = memory
        self.memory_dir = Path(memory.memory_dir)
        safety_config = memory.config.get("automation", {}).get("safety", {})
        self.safety_gate = MemorySafetyGate(safety_config)
        self.ledger = TaskLedger(self.memory_dir, safety_gate=self.safety_gate)

    def task_recall(self, envelope_payload: Dict[str, Any], limit: int = 5, token_budget: int = 1600) -> Dict[str, Any]:
        trace_id = self._new_trace_id("recall")
        try:
            envelope = TaskEnvelope.from_dict(envelope_payload)
            audit = metadata_audit(self.memory.layers)
            ledger_items = self._prepare_ledger_items(envelope, limit=limit)
            orchestrated = self.memory.orchestrate_recall(
                query=envelope.recall_query(),
                mode=envelope.mode,
                limit=max(limit, 1),
                project=envelope.project or None,
                branch=envelope.branch or None,
                pr_id=envelope.pr_id,
                task_id=envelope.task_id or None,
                token_budget=token_budget,
            )
            memory_items = self._prepare_orchestrated_items(orchestrated, audit, limit=limit)
            items = (ledger_items + memory_items)[:limit]
            diagnostics = {
                "token_budget": token_budget,
                "omitted_sources": orchestrated.get("omitted_sources", []),
                "blocked": self._blocked_diagnostics(orchestrated),
                "metadata_audit": audit,
                "trust_mode": audit["trust_mode"],
            }
            result = {
                "success": True,
                "trace_id": trace_id,
                "injectable_markdown": self._build_injectable_markdown(trace_id, items),
                "items": items,
                "diagnostics": diagnostics,
            }
            self.ledger.append_trace(
                trace_id=trace_id,
                trace_type="recall",
                project=envelope.project,
                task_id=envelope.task_id,
                summary={
                    "item_count": len(items),
                    "sources": [item.get("source") for item in items],
                    "trust_mode": audit["trust_mode"],
                    "blocked_count": len(diagnostics["blocked"]),
                },
            )
            return result
        except Exception as exc:
            return skipped_result(str(exc), trace_id=trace_id)

    def task_capture(self, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        trace_id = self._new_trace_id("capture")
        try:
            event = CaptureEvent.from_dict(event_payload)
            if event.event_type not in ALLOWED_CAPTURE_EVENT_TYPES:
                return {
                    "success": False,
                    "skipped": False,
                    "reason": f"unknown event_type: {event.event_type or '<missing>'}",
                    "trace_id": trace_id,
                    "event_id": None,
                    "ledger_updated": False,
                    "durable_memory_id": None,
                    "memory_link_required": False,
                    "diagnostics": {
                        "blocked": [],
                        "omitted_sources": [],
                        "redactions": [],
                        "retention": "task-default",
                    },
                }

            event_id = self.ledger.append_event(event.to_dict(), trace_id=trace_id)
            diagnostics = self.ledger.last_diagnostics()
            result = {
                "success": True,
                "event_id": event_id,
                "trace_id": trace_id,
                "ledger_updated": True,
                "durable_memory_id": None,
                "memory_link_required": False,
                "diagnostics": {
                    "redactions": diagnostics.get("redactions", []),
                    "blocked": diagnostics.get("blocked", []),
                    "retention": "task-default",
                },
            }
            self.ledger.append_trace(
                trace_id=trace_id,
                trace_type="capture",
                project=event.project,
                task_id=event.task_id,
                summary={
                    "event_id": event_id,
                    "event_type": event.event_type,
                    "ledger_updated": True,
                    "blocked_count": len(result["diagnostics"]["blocked"]),
                    "redaction_count": len(result["diagnostics"]["redactions"]),
                },
            )
            return result
        except Exception as exc:
            return skipped_result(str(exc), trace_id=trace_id)

    def task_ledger(
        self,
        project: str,
        task_id: str,
        branch: Optional[str] = None,
        raw: bool = False,
    ) -> Dict[str, Any]:
        if not project or not task_id:
            return {
                "success": False,
                "reason": "task-ledger requires project and task_id",
                "summary": {},
                "diagnostics": {"blocked": [], "omitted_sources": []},
            }
        return {
            "success": True,
            "project": project,
            "task_id": task_id,
            "summary": self.ledger.summary(project=project, task_id=task_id, branch=branch, raw=raw),
            "diagnostics": {"view": "raw" if raw else "summary"},
        }

    def task_trace(self, trace_id: str, view: str = "summary") -> Dict[str, Any]:
        if not trace_id:
            return {"success": False, "reason": "task-trace requires trace_id", "trace": None}
        trace = self.ledger.get_trace(trace_id)
        if not trace:
            return {"success": False, "reason": "trace not found", "trace": None}
        if view != "raw":
            trace = {
                "trace_id": trace.get("trace_id"),
                "trace_type": trace.get("trace_type"),
                "timestamp": trace.get("timestamp"),
                "project": trace.get("project"),
                "task_id": trace.get("task_id"),
                "summary": trace.get("summary", {}),
            }
        return {"success": True, "trace": trace}

    def _prepare_ledger_items(self, envelope: TaskEnvelope, limit: int) -> List[Dict[str, Any]]:
        raw_items = self.ledger.recall_items(envelope.to_dict(), limit=limit)
        items: List[Dict[str, Any]] = []
        for raw in raw_items:
            analysis = self.safety_gate.sanitize_for_injection(
                content=str(raw.get("summary") or ""),
                metadata=raw.get("metadata", {}),
            )
            if not analysis.get("allow_injection", True):
                continue
            items.append(
                {
                    "id": raw.get("id"),
                    "source": "ledger",
                    "reason": raw.get("reason") or "same task lineage",
                    "trust": "needs_verification",
                    "allow_injection": True,
                    "summary": analysis.get("content", ""),
                    "metadata": raw.get("metadata", {}),
                }
            )
        return items

    def _prepare_orchestrated_items(
        self,
        orchestrated: Dict[str, Any],
        audit: Dict[str, Any],
        limit: int,
    ) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for result in orchestrated.get("results", [])[:limit]:
            summary = str(result.get("content") or result.get("summary") or "").strip()
            if not summary:
                continue
            items.append(
                {
                    "id": result.get("memory_id") or result.get("id"),
                    "source": result.get("source") or "memory",
                    "reason": result.get("why") or result.get("reason") or "orchestrated recall",
                    "trust": self._trust_label(result, audit),
                    "allow_injection": True,
                    "summary": summary[:1200],
                    "metadata": result.get("metadata", {}),
                }
            )
        return items

    def _trust_label(self, item: Dict[str, Any], audit: Dict[str, Any]) -> str:
        metadata = item.get("metadata", {}) or {}
        if metadata.get("valid_until") or metadata.get("commit") or metadata.get("commit_hash"):
            return "verifiable"
        if audit.get("trust_mode") == "advisory":
            return "needs_verification"
        return "unknown"

    def _build_injectable_markdown(self, trace_id: str, items: List[Dict[str, Any]]) -> str:
        if not items:
            return ""
        lines = [f'<untrusted-memory-evidence trace_id="{trace_id}">']
        for item in items:
            lines.append(
                f"- [{item.get('source')}][{item.get('trust')}] "
                f"{item.get('reason')}: {item.get('summary')}"
            )
        lines.append("</untrusted-memory-evidence>")
        return "\n".join(lines)

    def _blocked_diagnostics(self, orchestrated: Dict[str, Any]) -> List[Dict[str, Any]]:
        safety = orchestrated.get("explanation", {}).get("safety", {})
        blocked_count = int(safety.get("blocked_items") or 0)
        return [
            {"source": "orchestrator", "reason": "safety gate blocked injection"}
            for _ in range(blocked_count)
        ]

    def _new_trace_id(self, prefix: str) -> str:
        return f"{prefix}-{uuid.uuid4().hex[:12]}"


def metadata_audit(layers: Any, sample_limit: int = 50) -> Dict[str, Any]:
    """Estimate whether existing memories have enough metadata for hard trust decisions."""
    counts = {
        "total": 0,
        "commit": 0,
        "branch": 0,
        "files": 0,
        "valid_until": 0,
        "provenance": 0,
    }
    try:
        entries = list(layers.l2.iter_entries(scope="all"))[:sample_limit]
    except Exception:
        entries = []

    for entry in entries:
        metadata = entry.get("metadata", {}) or {}
        counts["total"] += 1
        if metadata.get("commit") or metadata.get("commit_hash") or entry.get("commit_hash"):
            counts["commit"] += 1
        if metadata.get("branch") or entry.get("branch"):
            counts["branch"] += 1
        if metadata.get("files") or metadata.get("file_path") or entry.get("source_path"):
            counts["files"] += 1
        if metadata.get("valid_until"):
            counts["valid_until"] += 1
        if metadata.get("provenance") or metadata.get("source_uri") or metadata.get("source"):
            counts["provenance"] += 1

    total = counts["total"]
    coverage = {
        key: (counts[key] / total if total else 0.0)
        for key in ("commit", "branch", "files", "valid_until", "provenance")
    }
    enforceable = total > 0 and coverage["branch"] >= 0.6 and coverage["provenance"] >= 0.6
    return {
        "sample_size": total,
        "coverage": coverage,
        "trust_mode": "enforceable" if enforceable else "advisory",
        "reason": (
            "metadata coverage supports scoped trust labels"
            if enforceable
            else "insufficient metadata coverage; trust labels are advisory"
        ),
    }


def skipped_result(reason: str, trace_id: Optional[str] = None) -> Dict[str, Any]:
    return {
        "success": False,
        "skipped": True,
        "reason": reason,
        "trace_id": trace_id,
        "injectable_markdown": "",
        "items": [],
        "diagnostics": {"blocked": [], "omitted_sources": []},
    }
