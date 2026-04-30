"""
Append-only task ledger for task-scoped R&D memory events.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from runtime.safety import MemorySafetyGate


class TaskLedger:
    """Store and summarize task-scoped memory events without durable promotion."""

    def __init__(self, memory_dir: Path, safety_gate: Optional[MemorySafetyGate] = None):
        self.memory_dir = Path(memory_dir)
        self.base_dir = self.memory_dir / "_task_memory"
        self.events_path = self.base_dir / "events.jsonl"
        self.traces_path = self.base_dir / "traces.jsonl"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.safety_gate = safety_gate or MemorySafetyGate()
        self._last_diagnostics: Dict[str, Any] = {"redactions": [], "blocked": []}

    def append_event(self, event: Dict[str, Any], trace_id: str) -> str:
        event_id = event.get("event_id") or f"capture-{uuid.uuid4().hex[:12]}"
        sanitized, diagnostics = self._sanitize_event(event)
        record = {
            "event_id": event_id,
            "trace_id": trace_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "schema_version": sanitized.get("schema_version", "gale-task-memory.v1"),
            "event_type": sanitized.get("event_type"),
            "project": sanitized.get("project"),
            "repo_root": sanitized.get("repo_root"),
            "branch": sanitized.get("branch"),
            "task_id": sanitized.get("task_id"),
            "skill": sanitized.get("skill"),
            "phase": sanitized.get("phase"),
            "artifact_type": sanitized.get("artifact_type"),
            "input_summary": sanitized.get("input_summary"),
            "files": sanitized.get("files", []),
            "verification": sanitized.get("verification", {}),
            "confidence": sanitized.get("confidence", "unknown"),
            "summary": sanitized.get("summary", ""),
            "payload": sanitized.get("payload", {}),
            "extensions": sanitized.get("extensions", {}),
            "safety": sanitized.get("safety", {}),
        }
        self._append_jsonl(self.events_path, record)
        self._last_diagnostics = diagnostics
        return event_id

    def last_diagnostics(self) -> Dict[str, Any]:
        return dict(self._last_diagnostics)

    def recall_items(self, envelope: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        project = str(envelope.get("project") or "")
        task_id = str(envelope.get("task_id") or "")
        branch = str(envelope.get("branch") or "")
        event_types = {"failed_attempt", "root_cause", "verification_result", "handoff_state", "next_action"}
        matches: List[Dict[str, Any]] = []
        for event in reversed(list(self._iter_events())):
            if not self._matches_scope(event, project=project, task_id=task_id, branch=branch):
                continue
            if event.get("event_type") not in event_types:
                continue
            summary = str(event.get("summary") or event.get("input_summary") or "").strip()
            if not summary:
                continue
            matches.append(
                {
                    "id": event.get("event_id"),
                    "summary": summary,
                    "reason": self._recall_reason(event, task_id=task_id, branch=branch),
                    "metadata": {
                        "event_type": event.get("event_type"),
                        "project": event.get("project"),
                        "task_id": event.get("task_id"),
                        "branch": event.get("branch"),
                        "trace_id": event.get("trace_id"),
                        "safety": event.get("safety", {}),
                    },
                }
            )
            if len(matches) >= limit:
                break
        return matches

    def summary(
        self,
        project: str,
        task_id: str,
        branch: Optional[str] = None,
        raw: bool = False,
    ) -> Dict[str, Any]:
        events = [
            event
            for event in self._iter_events()
            if self._matches_scope(event, project=project, task_id=task_id, branch=branch or "")
        ]
        key_files: List[str] = []
        for event in events:
            for file_path in event.get("files", []) or []:
                if file_path and file_path not in key_files:
                    key_files.append(file_path)

        by_type = self._group_summaries(events)
        summary = {
            "current_goal": self._last_nonempty(events, "input_summary") or self._last_nonempty(events, "summary"),
            "attempted_paths": by_type.get("failed_attempt", []),
            "failure_reasons": by_type.get("root_cause", []),
            "key_files": key_files[:20],
            "pending_hypotheses": by_type.get("handoff_state", []),
            "verified_results": by_type.get("verification_result", []),
            "unresolved_risks": self._payload_values(events, "risk"),
            "next_actions": by_type.get("next_action", []),
            "feedback": by_type.get("feedback", []),
            "event_count": len(events),
            "last_updated": events[-1].get("timestamp") if events else None,
        }
        if raw:
            summary["events"] = events
        return summary

    def append_trace(
        self,
        trace_id: str,
        trace_type: str,
        project: str,
        task_id: str,
        summary: Dict[str, Any],
    ) -> None:
        self._append_jsonl(
            self.traces_path,
            {
                "trace_id": trace_id,
                "trace_type": trace_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "project": project,
                "task_id": task_id,
                "summary": summary,
            },
        )

    def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        for trace in self._iter_jsonl(self.traces_path):
            if trace.get("trace_id") == trace_id:
                return trace
        return None

    def _sanitize_event(self, event: Dict[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any]]:
        redactions: List[Dict[str, Any]] = []
        blocked: List[Dict[str, Any]] = []
        sanitized = dict(event)

        for field in ("summary", "input_summary"):
            analysis = self.safety_gate.sanitize_for_storage(str(sanitized.get(field) or ""))
            sanitized[field] = analysis.get("content", "")
            redactions.extend(analysis.get("redactions", []))
            if not analysis.get("allow_injection", True):
                blocked.append({"field": field, "reason": analysis.get("block_reason") or "not injectable"})

        payload_text = json.dumps(sanitized.get("payload", {}) or {}, ensure_ascii=False, sort_keys=True)
        payload_analysis = self.safety_gate.sanitize_for_storage(payload_text)
        redactions.extend(payload_analysis.get("redactions", []))
        try:
            sanitized["payload"] = json.loads(payload_analysis.get("content", "{}"))
        except json.JSONDecodeError:
            sanitized["payload"] = {"summary": payload_analysis.get("content", "")}
        if not payload_analysis.get("allow_injection", True):
            blocked.append({"field": "payload", "reason": payload_analysis.get("block_reason") or "not injectable"})

        safety = self.safety_gate.summarize_for_metadata(
            {
                "allow_store": True,
                "allow_injection": not blocked,
                "allow_raw_display": not redactions and not blocked,
                "risks": [],
                "redactions": redactions,
            }
        )
        sanitized["safety"] = safety
        return sanitized, {"redactions": redactions, "blocked": blocked}

    def _matches_scope(
        self,
        event: Dict[str, Any],
        project: str,
        task_id: str,
        branch: str = "",
    ) -> bool:
        if project and str(event.get("project") or "") != project:
            return False
        event_task_id = str(event.get("task_id") or "")
        if task_id and event_task_id == task_id:
            return True
        if not task_id and branch and str(event.get("branch") or "") == branch:
            return True
        return False

    def _recall_reason(self, event: Dict[str, Any], task_id: str, branch: str) -> str:
        if task_id and event.get("task_id") == task_id:
            return "same task lineage"
        if branch and event.get("branch") == branch:
            return "same branch lineage"
        return "task ledger match"

    def _group_summaries(self, events: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        grouped: Dict[str, List[str]] = {}
        for event in events:
            event_type = str(event.get("event_type") or "")
            summary = str(event.get("summary") or "").strip()
            if summary:
                grouped.setdefault(event_type, []).append(summary)
        return grouped

    def _payload_values(self, events: List[Dict[str, Any]], key: str) -> List[str]:
        values: List[str] = []
        for event in events:
            payload = event.get("payload", {}) or {}
            value = payload.get(key) or payload.get(f"{key}s")
            if isinstance(value, list):
                values.extend(str(item) for item in value if item)
            elif value:
                values.append(str(value))
        return values

    def _last_nonempty(self, events: List[Dict[str, Any]], key: str) -> str:
        for event in reversed(events):
            value = str(event.get(key) or "").strip()
            if value:
                return value
        return ""

    def _iter_events(self) -> Iterable[Dict[str, Any]]:
        return self._iter_jsonl(self.events_path)

    def _iter_jsonl(self, path: Path) -> Iterable[Dict[str, Any]]:
        if not path.exists():
            return []
        records: List[Dict[str, Any]] = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(payload, dict):
                    records.append(payload)
        return records

    def _append_jsonl(self, path: Path, payload: Dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload, ensure_ascii=False, sort_keys=True) + "\n")
