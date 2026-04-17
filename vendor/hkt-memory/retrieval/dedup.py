import re
from typing import Any, Dict, List, Optional


def _tokens(text: str) -> set:
    raw = (text or "").lower()
    parts = re.findall(r"[a-z0-9_]+|[\u4e00-\u9fff]", raw, flags=re.IGNORECASE)
    return {p for p in parts if p}


def _jaccard(a: str, b: str) -> float:
    ta = _tokens(a)
    tb = _tokens(b)
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return inter / union if union else 0.0


def dedup_results(
    results: List[Dict[str, Any]],
    max_per_page: int = 2,
    jaccard_threshold: float = 0.85,
) -> List[Dict[str, Any]]:
    kept: List[Dict[str, Any]] = []
    per_topic: Dict[str, int] = {}
    for item in results or []:
        topic = str(item.get("topic") or item.get("source") or "").strip()
        if topic:
            if per_topic.get(topic, 0) >= int(max_per_page):
                continue

        text = str(item.get("content") or item.get("summary") or item.get("preview") or "")
        duplicate_index: Optional[int] = None
        for idx, existing in enumerate(kept):
            existing_text = str(existing.get("content") or existing.get("summary") or existing.get("preview") or "")
            if _jaccard(text, existing_text) >= float(jaccard_threshold):
                duplicate_index = idx
                break
        if duplicate_index is not None:
            current_score = float(item.get("_hybrid_score") or item.get("score") or 0.0)
            existing_score = float(kept[duplicate_index].get("_hybrid_score") or kept[duplicate_index].get("score") or 0.0)
            if current_score > existing_score:
                kept[duplicate_index] = item
            continue

        kept.append(item)
        if topic:
            per_topic[topic] = per_topic.get(topic, 0) + 1
    return kept


def compiled_truth_guarantee(results: List[Dict[str, Any]], layer_manager: Any) -> List[Dict[str, Any]]:
    if not results or layer_manager is None:
        return results

    topics = {str(item.get("topic") or "").strip() for item in results if item.get("topic")}
    if not topics:
        return results

    existing_topics = {
        str(item.get("topic") or "").strip()
        for item in results
        if str(item.get("layer") or "").upper() in {"L0", "L1"}
    }

    missing = [topic for topic in topics if topic and topic not in existing_topics]
    if not missing:
        return results

    appended: List[Dict[str, Any]] = []
    for topic in missing:
        entry = _fetch_topic_l1(layer_manager, topic)
        if entry:
            entry = dict(entry)
            entry["guaranteed"] = True
            entry["layer"] = "L1"
            appended.append(entry)

    return list(results) + appended


def _fetch_topic_l1(layer_manager: Any, topic: str) -> Optional[Dict[str, Any]]:
    try:
        topics_dir = layer_manager.base_path / "L1-Overview" / "topics"
        topic_file = topics_dir / f"{topic}.md"
        if not topic_file.exists():
            return None
        content = topic_file.read_text(encoding="utf-8")
        entries = layer_manager._parse_l1_file(content, topic)
        if not entries:
            return None
        best = entries[0]
        if best.get("timestamp"):
            entries.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            best = entries[0]
        return best
    except Exception:
        return None
