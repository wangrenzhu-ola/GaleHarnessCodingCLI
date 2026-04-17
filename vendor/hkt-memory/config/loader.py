import json
import os
from pathlib import Path
from typing import Any, Dict


class ConfigLoader:
    def __init__(self, root_dir: Path):
        self.root_dir = Path(root_dir)
        self.config_path = self.root_dir / "config" / "default.json"

    def load(self) -> Dict[str, Any]:
        config: Dict[str, Any] = {}
        if self.config_path.exists():
            config = json.loads(self.config_path.read_text(encoding="utf-8"))
        retrieval = config.setdefault("retrieval", {})
        retrieval.setdefault("fusion_method", os.getenv("HKT_MEMORY_FUSION_METHOD", "rrf"))
        hybrid = retrieval.setdefault("hybrid", {})
        hybrid.setdefault("vector_weight", self._env_float("HKT_MEMORY_VECTOR_WEIGHT", 0.7))
        hybrid.setdefault("bm25_weight", self._env_float("HKT_MEMORY_BM25_WEIGHT", 0.3))
        hybrid.setdefault("min_similarity", self._env_float("HKT_MEMORY_MIN_SIMILARITY", 0.35))
        lifecycle = config.setdefault("lifecycle", {})
        lifecycle.setdefault("enabled", self._env_bool("HKT_MEMORY_LIFECYCLE_ENABLED", False))
        lifecycle.setdefault("effectivenessEventsDays", lifecycle.pop("effectiveness_events_days", 90))
        lifecycle.setdefault("maxEntriesPerScope", self._env_int("HKT_MEMORY_MAX_ENTRIES_PER_SCOPE", 3000))
        lifecycle.setdefault("pruneMode", os.getenv("HKT_MEMORY_PRUNE_MODE", "archive"))
        lifecycle.setdefault("defaultForgetMode", os.getenv("HKT_MEMORY_FORGET_MODE", "soft"))
        lifecycle.setdefault("respectImportance", self._env_bool("HKT_MEMORY_RESPECT_IMPORTANCE", True))
        lifecycle.setdefault("respectPinned", self._env_bool("HKT_MEMORY_RESPECT_PINNED", True))
        lifecycle.setdefault("recencyHalfLifeHours", self._env_int("HKT_MEMORY_RECENCY_HALF_LIFE_HOURS", 72))

        if "HKT_MEMORY_EFFECTIVENESS_EVENTS_DAYS" in os.environ:
            lifecycle["effectivenessEventsDays"] = self._env_int("HKT_MEMORY_EFFECTIVENESS_EVENTS_DAYS", 90)
        if "HKT_MEMORY_LIFECYCLE_ENABLED" in os.environ:
            lifecycle["enabled"] = self._env_bool("HKT_MEMORY_LIFECYCLE_ENABLED", False)
        if "HKT_MEMORY_MAX_ENTRIES_PER_SCOPE" in os.environ:
            lifecycle["maxEntriesPerScope"] = self._env_int("HKT_MEMORY_MAX_ENTRIES_PER_SCOPE", 3000)
        if "HKT_MEMORY_PRUNE_MODE" in os.environ:
            lifecycle["pruneMode"] = os.getenv("HKT_MEMORY_PRUNE_MODE", "archive")
        if "HKT_MEMORY_FORGET_MODE" in os.environ:
            lifecycle["defaultForgetMode"] = os.getenv("HKT_MEMORY_FORGET_MODE", "soft")
        if "HKT_MEMORY_RESPECT_IMPORTANCE" in os.environ:
            lifecycle["respectImportance"] = self._env_bool("HKT_MEMORY_RESPECT_IMPORTANCE", True)
        if "HKT_MEMORY_RESPECT_PINNED" in os.environ:
            lifecycle["respectPinned"] = self._env_bool("HKT_MEMORY_RESPECT_PINNED", True)
        if "HKT_MEMORY_RECENCY_HALF_LIFE_HOURS" in os.environ:
            lifecycle["recencyHalfLifeHours"] = self._env_int("HKT_MEMORY_RECENCY_HALF_LIFE_HOURS", 72)
        if "HKT_MEMORY_VECTOR_WEIGHT" in os.environ:
            hybrid["vector_weight"] = self._env_float("HKT_MEMORY_VECTOR_WEIGHT", 0.7)
        if "HKT_MEMORY_BM25_WEIGHT" in os.environ:
            hybrid["bm25_weight"] = self._env_float("HKT_MEMORY_BM25_WEIGHT", 0.3)
        if "HKT_MEMORY_MIN_SIMILARITY" in os.environ:
            hybrid["min_similarity"] = self._env_float("HKT_MEMORY_MIN_SIMILARITY", 0.35)
        return config

    def _env_bool(self, name: str, default: bool) -> bool:
        value = os.getenv(name)
        if value is None:
            return default
        return value.strip().lower() in {"1", "true", "yes", "on"}

    def _env_int(self, name: str, default: int) -> int:
        value = os.getenv(name)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            return default

    def _env_float(self, name: str, default: float) -> float:
        value = os.getenv(name)
        if value is None:
            return default
        try:
            return float(value)
        except ValueError:
            return default
