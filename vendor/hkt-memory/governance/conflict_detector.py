from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from layers.l2_full import L2FullLayer
from lifecycle.memory_lifecycle import MemoryLifecycleManager


class ConflictDetector:
    DEFAULT_RULES = [
        {
            "id": "api-style-rest-vs-graphql",
            "left_label": "REST",
            "left_keywords": ["rest api", "restful", "rest"],
            "right_label": "GraphQL",
            "right_keywords": ["graphql"],
            "description": "接口方案建议出现 REST 与 GraphQL 互斥倾向",
        },
        {
            "id": "frontend-framework-react-vs-vue",
            "left_label": "React",
            "left_keywords": ["react", "next.js", "nextjs"],
            "right_label": "Vue",
            "right_keywords": ["vue", "nuxt"],
            "description": "前端框架建议出现 React 与 Vue 互斥倾向",
        },
    ]

    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.lifecycle = MemoryLifecycleManager(self.base_path, {})
        self.l2 = L2FullLayer(self.base_path / "L2-Full")

    def scan(self) -> List[Dict[str, Any]]:
        memory_rows = self._collect_memory_rows()
        conflicts: List[Dict[str, Any]] = []
        for idx in range(len(memory_rows)):
            left = memory_rows[idx]
            for jdx in range(idx + 1, len(memory_rows)):
                right = memory_rows[jdx]
                pair_conflicts = self._detect_pair_conflicts(left, right)
                conflicts.extend(pair_conflicts)
        conflicts.sort(
            key=lambda item: (
                item["rule_id"],
                item["memory_a"]["memory_id"],
                item["memory_b"]["memory_id"],
            )
        )
        return conflicts

    def write_report(self, output_path: Optional[Path] = None) -> Dict[str, Any]:
        report_path = output_path or (self.base_path / "MEMORY_CONFLICT.md")
        conflicts = self.scan()
        content_lines: List[str] = [
            "# MEMORY_CONFLICT",
            "",
            f"Total conflicts: {len(conflicts)}",
            "",
        ]
        if not conflicts:
            content_lines.append("No semantic conflicts detected.")
            content_lines.append("")
        else:
            for index, conflict in enumerate(conflicts, start=1):
                content_lines.extend(
                    [
                        f"## Conflict {index}: {conflict['rule_id']}",
                        "",
                        f"- Description: {conflict['description']}",
                        f"- Side A: {conflict['memory_a']['memory_id']} ({conflict['memory_a']['matched_label']})",
                        f"- Side A Provenance: commit_hash={conflict['memory_a']['commit_hash']} pr_id={conflict['memory_a']['pr_id']}",
                        f"- Side B: {conflict['memory_b']['memory_id']} ({conflict['memory_b']['matched_label']})",
                        f"- Side B Provenance: commit_hash={conflict['memory_b']['commit_hash']} pr_id={conflict['memory_b']['pr_id']}",
                        "",
                    ]
                )
        report_path.write_text("\n".join(content_lines), encoding="utf-8")
        return {
            "success": True,
            "report_path": str(report_path),
            "conflict_count": len(conflicts),
            "conflicts": conflicts,
        }

    def _collect_memory_rows(self) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        active_memories = self.lifecycle.get_all_active_memories()
        for memory_id, manifest in sorted(active_memories.items(), key=lambda item: item[0]):
            l2_entry = self.l2.get_entry(memory_id)
            if not l2_entry:
                continue
            metadata = manifest.get("metadata", {})
            text = "\n".join(
                [
                    str(l2_entry.get("title", "")),
                    str(l2_entry.get("content", "")),
                    str(metadata),
                ]
            ).lower()
            rows.append(
                {
                    "memory_id": memory_id,
                    "text": text,
                    "commit_hash": metadata.get("commit_hash"),
                    "pr_id": metadata.get("pr_id"),
                }
            )
        return rows

    def _detect_pair_conflicts(self, left: Dict[str, Any], right: Dict[str, Any]) -> List[Dict[str, Any]]:
        found: List[Dict[str, Any]] = []
        for rule in self.DEFAULT_RULES:
            left_match = self._match_rule_side(left["text"], rule["left_keywords"])
            right_match = self._match_rule_side(right["text"], rule["right_keywords"])
            if left_match and right_match:
                found.append(self._build_conflict(rule, left, right, rule["left_label"], rule["right_label"]))
                continue
            left_match = self._match_rule_side(left["text"], rule["right_keywords"])
            right_match = self._match_rule_side(right["text"], rule["left_keywords"])
            if left_match and right_match:
                found.append(self._build_conflict(rule, left, right, rule["right_label"], rule["left_label"]))
        return found

    def _build_conflict(
        self,
        rule: Dict[str, Any],
        left: Dict[str, Any],
        right: Dict[str, Any],
        left_label: str,
        right_label: str,
    ) -> Dict[str, Any]:
        ordered: List[Tuple[Dict[str, Any], str]] = sorted(
            [(left, left_label), (right, right_label)],
            key=lambda item: item[0]["memory_id"],
        )
        first = ordered[0]
        second = ordered[1]
        return {
            "rule_id": rule["id"],
            "description": rule["description"],
            "memory_a": {
                "memory_id": first[0]["memory_id"],
                "matched_label": first[1],
                "commit_hash": first[0].get("commit_hash"),
                "pr_id": first[0].get("pr_id"),
            },
            "memory_b": {
                "memory_id": second[0]["memory_id"],
                "matched_label": second[1],
                "commit_hash": second[0].get("commit_hash"),
                "pr_id": second[0].get("pr_id"),
            },
        }

    def _match_rule_side(self, text: str, keywords: List[str]) -> bool:
        return any(keyword in text for keyword in keywords)
