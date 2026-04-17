import json
import math
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class MemoryLifecycleManager:
    def __init__(self, base_path: Path, config: Optional[Dict[str, Any]] = None):
        self.base_path = Path(base_path)
        self.config = config or {}
        self.lifecycle_dir = self.base_path / "_lifecycle"
        self._io_degraded = False
        self._last_io_error: Optional[Dict[str, str]] = None
        try:
            self.lifecycle_dir.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            self._handle_io_error("mkdir", self.lifecycle_dir, error)
        self.manifest_path = self.lifecycle_dir / "manifest.json"
        self.events_path = self.lifecycle_dir / "events.jsonl"
        self.state_path = self.lifecycle_dir / "state.json"
        self._manifest = self._load_json(self.manifest_path, {})
        self._migrate_manifest_schema()
        self._state = self._load_json(
            self.state_path,
            {"last_cleanup_at": None, "last_rebuild_at": None, "scope_feedback": {}, "filter_count": 0},
        )
        try:
            self._filter_count = int(self._state.get("filter_count", 0))
        except (TypeError, ValueError):
            self._filter_count = 0
            self._state["filter_count"] = 0

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("enabled", False))

    def register_memory(
        self,
        memory_id: str,
        title: str,
        topic: str,
        layer_type: str,
        source_path: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        now = self._now()
        metadata = metadata or {}
        current = self._manifest.get(memory_id, {})
        scope = metadata.get("scope") or f"topic:{topic}"
        feedback_stats = self._normalize_feedback_stats(
            current.get("feedback_stats"),
            helpful_count=current.get("helpful_count", 0),
        )
        entry = {
            "memory_id": memory_id,
            "title": title,
            "topic": topic,
            "scope": scope,
            "layer_type": layer_type,
            "source_path": source_path,
            "status": current.get("status", "active"),
            "created_at": current.get("created_at", now),
            "updated_at": now,
            "last_accessed": current.get("last_accessed", now),
            "access_count": current.get("access_count", 0),
            "helpful_count": feedback_stats["useful"],
            "feedback_stats": feedback_stats,
            "importance": metadata.get("importance", current.get("importance", "medium")),
            "pinned": bool(metadata.get("pinned", current.get("pinned", False))),
            "metadata": {**current.get("metadata", {}), **metadata},
        }
        previous_manifest = deepcopy(self._manifest)
        self._manifest[memory_id] = entry
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {
                    **entry,
                    "success": False,
                    "error": "lifecycle manifest persistence failed",
                },
                persisted=False,
            )
        self.record_event("capture", memory_id=memory_id, scope=scope, data={"status": entry["status"]})
        return self._with_persistence_status({**entry, "success": True}, persisted=True)

    def ensure_registered(
        self,
        memory_id: str,
        title: str,
        topic: str,
        layer_type: str,
        source_path: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if memory_id in self._manifest:
            return self._with_persistence_status(dict(self._manifest[memory_id]), persisted=True)
        return self.register_memory(
            memory_id=memory_id,
            title=title,
            topic=topic,
            layer_type=layer_type,
            source_path=source_path,
            metadata=metadata,
        )

    def bootstrap(self, entries: List[Dict[str, Any]]) -> int:
        created = 0
        for entry in entries:
            memory_id = entry.get("id")
            if not memory_id or memory_id in self._manifest:
                continue
            result = self.register_memory(
                memory_id=memory_id,
                title=entry.get("title", memory_id),
                topic=entry.get("topic", "general"),
                layer_type=entry.get("type", "daily"),
                source_path=entry.get("source_path", ""),
                metadata=entry.get("metadata", {}),
            )
            if result.get("persisted", False):
                created += 1
        return created

    def touch(self, memory_ids: List[str], event_type: str = "recall") -> None:
        now = self._now()
        previous_manifest = deepcopy(self._manifest)
        touched: List[Tuple[str, Optional[str]]] = []
        for memory_id in memory_ids:
            entry = self._manifest.get(memory_id)
            if not entry:
                continue
            entry["last_accessed"] = now
            entry["updated_at"] = now
            entry["access_count"] = entry.get("access_count", 0) + 1
            touched.append((memory_id, entry.get("scope")))
        if touched and not self._save_manifest():
            self._manifest = previous_manifest
            return
        for memory_id, scope in touched:
            self.record_event(event_type, memory_id=memory_id, scope=scope, data={})

    def filter_active_ids(self, memory_ids: List[str], include_archived: bool = False) -> List[str]:
        allowed: List[str] = []
        for memory_id in memory_ids:
            status = self.get_status(memory_id)
            if status == "active":
                allowed.append(memory_id)
            elif include_archived and status == "archived":
                allowed.append(memory_id)
        return allowed

    def is_visible(self, memory_id: Optional[str], include_archived: bool = False) -> bool:
        if not memory_id:
            return True
        status = self.get_status(memory_id)
        if status == "active":
            return True
        if include_archived and status == "archived":
            return True
        return False

    def get_status(self, memory_id: str) -> str:
        entry = self._manifest.get(memory_id)
        if not entry:
            return "active"
        return entry.get("status", "active")

    def forget(self, memory_id: str, force: bool = False) -> Dict[str, Any]:
        entry = self._manifest.get(memory_id)
        if not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}
        previous_manifest = deepcopy(self._manifest)
        if force:
            entry["status"] = "deleted"
            entry["updated_at"] = self._now()
            if not self._save_manifest():
                self._manifest = previous_manifest
                return self._with_persistence_status(
                    {"success": False, "memory_id": memory_id, "mode": "hard", "error": "lifecycle manifest persistence failed"},
                    persisted=False,
                )
            self.record_event("forget", memory_id=memory_id, scope=entry.get("scope"), data={"mode": "hard"})
            return self._with_persistence_status(
                {"success": True, "memory_id": memory_id, "mode": "hard", "status": "deleted"},
                persisted=True,
            )
        entry["status"] = "disabled"
        entry["updated_at"] = self._now()
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {"success": False, "memory_id": memory_id, "mode": "soft", "error": "lifecycle manifest persistence failed"},
                persisted=False,
            )
        self.record_event("forget", memory_id=memory_id, scope=entry.get("scope"), data={"mode": "soft"})
        return self._with_persistence_status(
            {"success": True, "memory_id": memory_id, "mode": "soft", "status": "disabled"},
            persisted=True,
        )

    def archive(self, memory_id: str, reason: str = "prune") -> Dict[str, Any]:
        entry = self._manifest.get(memory_id)
        if not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}
        previous_manifest = deepcopy(self._manifest)
        entry["status"] = "archived"
        entry["updated_at"] = self._now()
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {"success": False, "memory_id": memory_id, "error": "lifecycle manifest persistence failed"},
                persisted=False,
            )
        self.record_event("archive", memory_id=memory_id, scope=entry.get("scope"), data={"reason": reason})
        return self._with_persistence_status({"success": True, "memory_id": memory_id, "status": "archived"}, persisted=True)

    def restore(self, memory_id: str) -> Dict[str, Any]:
        entry = self._manifest.get(memory_id)
        if not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}
        previous_manifest = deepcopy(self._manifest)
        entry["status"] = "active"
        entry["updated_at"] = self._now()
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {"success": False, "memory_id": memory_id, "error": "lifecycle manifest persistence failed"},
                persisted=False,
            )
        self.record_event("restore", memory_id=memory_id, scope=entry.get("scope"), data={})
        return self._with_persistence_status({"success": True, "memory_id": memory_id, "status": "active"}, persisted=True)

    def delete_manifest_entry(self, memory_id: str) -> None:
        if memory_id in self._manifest:
            previous_manifest = deepcopy(self._manifest)
            del self._manifest[memory_id]
            if not self._save_manifest():
                self._manifest = previous_manifest

    def set_pinned(self, memory_id: str, pinned: bool) -> Dict[str, Any]:
        entry = self._manifest.get(memory_id)
        if not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}
        previous_manifest = deepcopy(self._manifest)
        entry["pinned"] = bool(pinned)
        entry["updated_at"] = self._now()
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {"success": False, "memory_id": memory_id, "error": "lifecycle manifest persistence failed"},
                persisted=False,
            )
        self.record_event("pin", memory_id=memory_id, scope=entry.get("scope"), data={"pinned": bool(pinned)})
        return self._with_persistence_status({"success": True, "memory_id": memory_id, "pinned": bool(pinned)}, persisted=True)

    def set_importance(self, memory_id: str, importance: str) -> Dict[str, Any]:
        if importance not in {"high", "medium", "low"}:
            return {"success": False, "error": f"Unsupported importance: {importance}"}
        entry = self._manifest.get(memory_id)
        if not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}
        previous_manifest = deepcopy(self._manifest)
        entry["importance"] = importance
        entry["updated_at"] = self._now()
        if not self._save_manifest():
            self._manifest = previous_manifest
            return self._with_persistence_status(
                {"success": False, "memory_id": memory_id, "error": "lifecycle manifest persistence failed"},
                persisted=False,
            )
        self.record_event(
            "importance",
            memory_id=memory_id,
            scope=entry.get("scope"),
            data={"importance": importance},
        )
        return self._with_persistence_status({"success": True, "memory_id": memory_id, "importance": importance}, persisted=True)

    def record_feedback(
        self,
        label: str,
        memory_id: Optional[str] = None,
        scope: Optional[str] = None,
        note: str = "",
        query: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> Dict[str, Any]:
        if label not in {"useful", "wrong", "missing"}:
            return {"success": False, "error": f"Unsupported feedback label: {label}"}
        entry = self._manifest.get(memory_id) if memory_id else None
        resolved_scope = scope or (entry.get("scope") if entry else None) or (f"topic:{topic}" if topic else None) or "unknown"
        if memory_id and not entry:
            return {"success": False, "error": f"Unknown memory: {memory_id}"}

        feedback_stats = None
        previous_manifest = deepcopy(self._manifest)
        if entry:
            feedback_stats = self._normalize_feedback_stats(
                entry.get("feedback_stats"),
                helpful_count=entry.get("helpful_count", 0),
            )
            feedback_stats[label] += 1
            entry["feedback_stats"] = feedback_stats
            entry["helpful_count"] = feedback_stats["useful"]
            entry["updated_at"] = self._now()
            if not self._save_manifest():
                self._manifest = previous_manifest
                return self._with_persistence_status(
                    {"success": False, "label": label, "memory_id": memory_id, "scope": resolved_scope, "error": "lifecycle manifest persistence failed"},
                    persisted=False,
                )

        previous_state = deepcopy(self._state)
        scope_feedback, state_saved = self._increment_scope_feedback(resolved_scope, label)
        if not state_saved:
            self._state = previous_state
            return self._with_persistence_status(
                {
                    "success": False,
                    "label": label,
                    "memory_id": memory_id,
                    "scope": resolved_scope,
                    "feedback_stats": feedback_stats,
                    "scope_feedback": scope_feedback,
                    "error": "lifecycle state persistence failed",
                },
                persisted=False,
            )
        self.record_event(
            "feedback",
            memory_id=memory_id,
            scope=resolved_scope,
            data={"label": label, "note": note, "query": query, "topic": topic},
        )
        return self._with_persistence_status(
            {
                "success": True,
                "label": label,
                "memory_id": memory_id,
                "scope": resolved_scope,
                "feedback_stats": feedback_stats,
                "scope_feedback": scope_feedback,
            },
            persisted=True,
        )

    def mark_rebuild(self) -> bool:
        previous_state = deepcopy(self._state)
        self._state["last_rebuild_at"] = self._now()
        if not self._save_state():
            self._state = previous_state
            return False
        return True

    def cleanup_events(self, dry_run: bool = False, scope: Optional[str] = None) -> Dict[str, Any]:
        retention_days = int(self.config.get("effectivenessEventsDays", 90))
        if retention_days <= 0:
            return {
                "success": True,
                "dry_run": dry_run,
                "retention_days": retention_days,
                "deleted_count": 0,
                "scope_breakdown": {},
                "sample": [],
            }
        events = self._load_events()
        threshold = datetime.now(timezone.utc) - timedelta(days=retention_days)
        expired: List[Dict[str, Any]] = []
        kept: List[Dict[str, Any]] = []
        for event in events:
            event_scope = event.get("scope")
            event_time = self._parse_time(event.get("timestamp"))
            if event_time and event_time < threshold and (scope is None or event_scope == scope):
                expired.append(event)
            else:
                kept.append(event)
        scope_breakdown: Dict[str, int] = {}
        for event in expired:
            key = event.get("scope") or "unknown"
            scope_breakdown[key] = scope_breakdown.get(key, 0) + 1
        persisted = True
        if not dry_run and expired:
            persisted = self._write_events(kept)
            if persisted:
                previous_state = deepcopy(self._state)
                self._state["last_cleanup_at"] = self._now()
                if not self._save_state():
                    self._state = previous_state
                    persisted = False
        self.record_event(
            "cleanup",
            scope=scope,
            data={"dry_run": dry_run, "deleted_count": len(expired), "retention_days": retention_days},
        )
        result = {
            "success": persisted,
            "dry_run": dry_run,
            "retention_days": retention_days,
            "deleted_count": len(expired),
            "scope_breakdown": scope_breakdown,
            "sample": expired[:5],
        }
        if not persisted:
            result["error"] = "lifecycle cleanup persistence failed"
        return self._with_persistence_status(result, persisted=persisted)

    def cleanup_expired_events_on_startup(self) -> Dict[str, Any]:
        if not self.enabled:
            return self._with_persistence_status({"success": True, "deleted_count": 0, "dry_run": False}, persisted=True)
        return self.cleanup_events(dry_run=False)

    def prune_scope(self, scope: str) -> Dict[str, Any]:
        max_entries = int(self.config.get("maxEntriesPerScope", 3000))
        active_entries = [
            entry for entry in self._manifest.values()
            if entry.get("scope") == scope and entry.get("status", "active") == "active"
        ]
        if len(active_entries) <= max_entries:
            return self._with_persistence_status({"scope": scope, "triggered": False, "pruned": []}, persisted=True)
        excess = len(active_entries) - max_entries
        ordered = sorted(active_entries, key=self._prune_score)
        pruned: List[str] = []
        mode = self.config.get("pruneMode", "archive")
        previous_manifest = deepcopy(self._manifest)
        for entry in ordered:
            if len(pruned) >= excess:
                break
            if self._is_exempt(entry):
                continue
            if mode == "disable":
                entry["status"] = "disabled"
            else:
                entry["status"] = "archived"
            entry["updated_at"] = self._now()
            pruned.append(entry["memory_id"])
            self.record_event("prune", memory_id=entry["memory_id"], scope=scope, data={"mode": mode})
        persisted = True
        if pruned:
            if not self._save_manifest():
                self._manifest = previous_manifest
                persisted = False
                pruned = []
        result = {"scope": scope, "triggered": bool(pruned), "pruned": pruned, "mode": mode}
        if not persisted:
            result["error"] = "lifecycle manifest persistence failed"
        return self._with_persistence_status(result, persisted=persisted)

    def list_scope_counts(self) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for entry in self._manifest.values():
            if entry.get("status", "active") != "active":
                continue
            scope = entry.get("scope") or "unknown"
            counts[scope] = counts.get(scope, 0) + 1
        return counts

    def get_stats(self) -> Dict[str, Any]:
        status_counts = {"active": 0, "disabled": 0, "archived": 0, "deleted": 0}
        for entry in self._manifest.values():
            status = entry.get("status", "active")
            status_counts[status] = status_counts.get(status, 0) + 1
        feedback_by_label = {"useful": 0, "wrong": 0, "missing": 0}
        for scope_feedback in self._state.get("scope_feedback", {}).values():
            normalized = self._normalize_scope_feedback(scope_feedback)
            for label in feedback_by_label:
                feedback_by_label[label] += normalized.get(label, 0)
        expired_preview = self.cleanup_events(dry_run=True)
        return {
            "enabled": self.enabled,
            "statuses": status_counts,
            "total_memories": len(self._manifest),
            "filter_count": int(self._state.get("filter_count", self._filter_count)),
            "scopes": self.list_scope_counts(),
            "event_ttl": {
                "enabled": int(self.config.get("effectivenessEventsDays", 90)) > 0,
                "retention_days": int(self.config.get("effectivenessEventsDays", 90)),
                "expired_count": expired_preview.get("deleted_count", 0),
                "scope_breakdown": expired_preview.get("scope_breakdown", {}),
            },
            "last_cleanup_at": self._state.get("last_cleanup_at"),
            "last_rebuild_at": self._state.get("last_rebuild_at"),
            "max_entries_per_scope": int(self.config.get("maxEntriesPerScope", 3000)),
            "prune_mode": self.config.get("pruneMode", "archive"),
            "default_forget_mode": self.config.get("defaultForgetMode", "soft"),
            "feedback": {
                "by_label": feedback_by_label,
                "scope_feedback": self._state.get("scope_feedback", {}),
            },
            "io_degraded": self._io_degraded,
            "last_io_error": dict(self._last_io_error) if self._last_io_error else None,
        }

    def increment_filter_count(self) -> None:
        previous_state = deepcopy(self._state)
        self._filter_count += 1
        self._state["filter_count"] = self._filter_count
        if not self._save_state():
            self._state = previous_state
            self._filter_count = int(self._state.get("filter_count", 0))

    def rank_bonus(self, memory_id: Optional[str], scope: Optional[str] = None) -> float:
        entry = self._manifest.get(memory_id) if memory_id else None
        resolved_scope = scope or (entry.get("scope") if entry else None)
        scope_missing = float(self._scope_feedback_count(resolved_scope, "missing"))
        if not entry:
            return min(scope_missing, 10.0) * 0.3
        access_count = float(entry.get("access_count", 0))
        feedback_stats = self._normalize_feedback_stats(
            entry.get("feedback_stats"),
            helpful_count=entry.get("helpful_count", 0),
        )
        useful_count = float(feedback_stats.get("useful", 0))
        wrong_count = float(feedback_stats.get("wrong", 0))
        missing_count = float(feedback_stats.get("missing", 0))
        last_accessed = self._parse_time(entry.get("last_accessed"))
        hours = 0.0
        if last_accessed:
            hours = max(0.0, (datetime.now(timezone.utc) - last_accessed).total_seconds() / 3600)
        half_life = max(float(self.config.get("recencyHalfLifeHours", 72)), 1.0)
        recency = math.pow(2, -hours / half_life)
        pinned_bonus = 8.0 if entry.get("pinned") else 0.0
        importance_bonus = {"high": 2.5, "medium": 0.8, "low": 0.0}.get(entry.get("importance", "medium"), 0.8)
        return (
            pinned_bonus
            + importance_bonus
            + useful_count * 3.0
            - wrong_count * 2.5
            + missing_count * 0.5
            + min(scope_missing, 10.0) * 0.3
            + access_count * 0.5
            + recency
        )

    def get_all_active_memories(self) -> Dict[str, Dict[str, Any]]:
        active: Dict[str, Dict[str, Any]] = {}
        for memory_id, entry in self._manifest.items():
            if entry.get("status", "active") != "active":
                continue
            active[memory_id] = dict(entry)
        return active

    def get_memory(self, memory_id: str) -> Optional[Dict[str, Any]]:
        return self._manifest.get(memory_id)

    def record_event(
        self,
        event_type: str,
        memory_id: Optional[str] = None,
        scope: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        event = {
            "timestamp": self._now(),
            "type": event_type,
            "memory_id": memory_id,
            "scope": scope,
            "data": data or {},
        }
        return self._append_text(self.events_path, json.dumps(event, ensure_ascii=False) + "\n")

    def _load_json(self, path: Path, default: Any) -> Any:
        if not path.exists():
            return default
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return default
        except OSError as error:
            self._handle_io_error("read", path, error)
            return default

    def _migrate_manifest_schema(self) -> None:
        if not isinstance(self._manifest, dict):
            self._manifest = {}
            return
        changed = False
        now = self._now()
        for memory_id, entry in list(self._manifest.items()):
            if not isinstance(entry, dict):
                self._manifest[memory_id] = {}
                entry = self._manifest[memory_id]
                changed = True
            if not entry.get("created_at"):
                entry["created_at"] = now
                changed = True
            if not entry.get("last_accessed"):
                entry["last_accessed"] = entry.get("created_at", now)
                changed = True
            if "access_count" not in entry:
                entry["access_count"] = 0
                changed = True
        if changed:
            self._save_manifest()

    def _save_manifest(self) -> bool:
        return self._write_text(
            self.manifest_path,
            json.dumps(self._manifest, ensure_ascii=False, indent=2),
        )

    def _save_state(self) -> bool:
        return self._write_text(
            self.state_path,
            json.dumps(self._state, ensure_ascii=False, indent=2),
        )

    def _load_events(self) -> List[Dict[str, Any]]:
        if not self.events_path.exists():
            return []
        events: List[Dict[str, Any]] = []
        try:
            raw_content = self.events_path.read_text(encoding="utf-8")
        except OSError as error:
            self._handle_io_error("read", self.events_path, error)
            return []
        for line in raw_content.splitlines():
            if not line.strip():
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return events

    def _write_events(self, events: List[Dict[str, Any]]) -> bool:
        payload = "\n".join(json.dumps(item, ensure_ascii=False) for item in events)
        if payload:
            payload += "\n"
        return self._write_text(self.events_path, payload)

    def _write_text(self, path: Path, payload: str) -> bool:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            self._handle_io_error("mkdir", path.parent, error)
            return False
        try:
            path.write_text(payload, encoding="utf-8")
            return True
        except OSError as error:
            self._handle_io_error("write", path, error)
            return False

    def _append_text(self, path: Path, payload: str) -> bool:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            self._handle_io_error("mkdir", path.parent, error)
            return False
        try:
            with open(path, "a", encoding="utf-8") as handle:
                handle.write(payload)
            return True
        except OSError as error:
            self._handle_io_error("append", path, error)
            return False

    def _handle_io_error(self, operation: str, path: Path, error: OSError) -> None:
        self._io_degraded = True
        self._last_io_error = {
            "operation": operation,
            "path": str(path),
            "error": str(error),
        }
        print(f"⚠️ Lifecycle IO degraded during {operation}: {path} ({error})")

    def _with_persistence_status(self, result: Dict[str, Any], persisted: bool) -> Dict[str, Any]:
        enriched = dict(result)
        enriched["persisted"] = persisted
        enriched["io_degraded"] = self._io_degraded
        enriched["last_io_error"] = dict(self._last_io_error) if self._last_io_error else None
        return enriched

    def _parse_time(self, value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        normalized = value.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    def _prune_score(self, entry: Dict[str, Any]) -> Tuple[float, float, float, str]:
        feedback_stats = self._normalize_feedback_stats(
            entry.get("feedback_stats"),
            helpful_count=entry.get("helpful_count", 0),
        )
        useful = float(feedback_stats.get("useful", 0))
        wrong = float(feedback_stats.get("wrong", 0))
        access = float(entry.get("access_count", 0))
        importance = {"high": 2.0, "medium": 1.0, "low": 0.0}.get(entry.get("importance", "medium"), 1.0)
        last_accessed = self._parse_time(entry.get("last_accessed")) or self._parse_time(entry.get("created_at"))
        age_hours = 10_000.0
        if last_accessed:
            age_hours = (datetime.now(timezone.utc) - last_accessed).total_seconds() / 3600
        return useful * 2.0 - wrong * 1.5 + access + importance, -age_hours, float(entry.get("pinned", False)), entry["memory_id"]

    def _is_exempt(self, entry: Dict[str, Any]) -> bool:
        if self.config.get("respectPinned", True) and entry.get("pinned"):
            return True
        if self.config.get("respectImportance", True) and entry.get("importance") == "high":
            return True
        return False

    def _normalize_feedback_stats(
        self,
        value: Optional[Dict[str, Any]],
        helpful_count: int = 0,
    ) -> Dict[str, int]:
        normalized = {"useful": int(helpful_count or 0), "wrong": 0, "missing": 0}
        if isinstance(value, dict):
            for label in normalized:
                raw = value.get(label, normalized[label])
                try:
                    normalized[label] = int(raw)
                except (TypeError, ValueError):
                    continue
        return normalized

    def _normalize_scope_feedback(self, value: Optional[Dict[str, Any]]) -> Dict[str, int]:
        normalized = {"useful": 0, "wrong": 0, "missing": 0}
        if isinstance(value, dict):
            for label in normalized:
                raw = value.get(label, 0)
                try:
                    normalized[label] = int(raw)
                except (TypeError, ValueError):
                    continue
        return normalized

    def _increment_scope_feedback(self, scope: str, label: str) -> Tuple[Dict[str, int], bool]:
        scope_feedback = self._state.setdefault("scope_feedback", {})
        normalized = self._normalize_scope_feedback(scope_feedback.get(scope))
        normalized[label] += 1
        scope_feedback[scope] = normalized
        return normalized, self._save_state()

    def _scope_feedback_count(self, scope: Optional[str], label: str) -> int:
        if not scope:
            return 0
        scope_feedback = self._state.get("scope_feedback", {})
        normalized = self._normalize_scope_feedback(scope_feedback.get(scope))
        return int(normalized.get(label, 0))

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
