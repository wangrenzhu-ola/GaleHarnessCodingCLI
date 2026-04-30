import os
from pathlib import Path
from typing import Any, Dict, Optional


ENV_ROOT = "HKT_MEMORY_ROOT"
ENV_LEGACY_DIR = "HKT_MEMORY_DIR"
ENV_PUBLIC_ROOT = "HKT_MEMORY_PUBLIC_ROOT"


def resolve_memory_root(
    explicit_root: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    cwd: Optional[Path] = None,
) -> Dict[str, Any]:
    """Resolve the public memory root with a stable, inspectable priority."""
    base_dir = _config_base_dir(config)
    candidates = [
        ("explicit", explicit_root),
        (ENV_ROOT, os.getenv(ENV_ROOT)),
        (ENV_LEGACY_DIR, os.getenv(ENV_LEGACY_DIR)),
        (ENV_PUBLIC_ROOT, os.getenv(ENV_PUBLIC_ROOT)),
        ("config.storage.base_dir", base_dir),
        ("default", "memory"),
    ]
    base = Path(cwd or Path.cwd())
    for source, value in candidates:
        if value:
            raw = Path(value).expanduser()
            resolved = raw if raw.is_absolute() else base / raw
            return {
                "path": resolved,
                "display": str(resolved),
                "source": source,
                "is_absolute": resolved.is_absolute(),
            }
    raise RuntimeError("memory root resolution has no candidates")


def memory_root_status(
    memory_root: Path,
    source: str,
    provider: str,
    config: Optional[Dict[str, Any]] = None,
    layers: Any = None,
) -> Dict[str, Any]:
    root = Path(memory_root)
    root.mkdir(parents=True, exist_ok=True)
    layer_paths = {
        "L0": root / "L0-Abstract",
        "L1": root / "L1-Overview",
        "L2": root / "L2-Full",
    }
    indexes = {
        "l0_index": root / "L0-Abstract" / "index.md",
        "l1_index": root / "L1-Overview" / "index.md",
        "vector_db": root / "memory.db",
        "lifecycle_manifest": root / "_lifecycle" / "manifest.json",
        "session_transcript_index": root / "_session_transcripts" / "index.json",
    }
    vector_backend = (
        (config or {})
        .get("storage", {})
        .get("vector_backend", "unknown")
    )
    return {
        "success": True,
        "root": str(root),
        "root_source": source,
        "provider": provider,
        "writable": os.access(root, os.W_OK),
        "layers": {
            name: {
                "path": str(path),
                "exists": path.exists(),
            }
            for name, path in layer_paths.items()
        },
        "indexes": {
            name: {
                "path": str(path),
                "exists": path.exists(),
            }
            for name, path in indexes.items()
        },
        "vector_store": {
            "backend": vector_backend,
            "available": bool(getattr(layers, "vector_store", None)) if layers is not None else None,
            "error": getattr(layers, "_vector_store_error", None) if layers is not None else None,
        },
    }


def _config_base_dir(config: Optional[Dict[str, Any]]) -> Optional[str]:
    if not config:
        return None
    storage = config.get("storage") or {}
    value = storage.get("public_root") or storage.get("base_dir")
    return str(value) if value else None
