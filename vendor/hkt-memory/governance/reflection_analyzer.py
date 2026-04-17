"""
Reflection Analyzer - Structured reflection and self-improvement pipeline

从 feedback 和记忆上下文中提取可复用 skill，写入 governance/SKILLS.md
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class ReflectionAnalyzer:
    """
    结构化反射分析器

    当 feedback useful 且 access_count >= threshold 时触发，
    使用 LLM 提取可复用 pattern/skill。
    """

    DEFAULT_THRESHOLD = 3

    def __init__(self, memory_dir: Path):
        self.memory_dir = Path(memory_dir)
        self.skills_file = self.memory_dir / "governance" / "SKILLS.md"
        self._ensure_structure()

    def _ensure_structure(self):
        self.skills_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.skills_file.exists():
            header = """# Skills

> 从记忆反馈和实践中提取的可复用技能与模式

## Entries

"""
            self.skills_file.write_text(header, encoding="utf-8")

    def should_trigger(self, access_count: int, threshold: int = None) -> bool:
        return access_count >= (threshold or self.DEFAULT_THRESHOLD)

    def analyze(self, memories: List[Dict[str, Any]], feedback_context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        分析记忆和反馈，提取 skill

        Returns:
            {"skill_name": "...", "description": "...", "example": "...", "tags": [...]}
            或 None（分析失败）
        """
        # 简单规则提取：如果 memories 内容足够丰富，直接提取
        # 为保持轻量，MVP 版不使用 LLM，而是基于关键词和模板生成
        if not memories:
            return None

        primary = memories[0]
        content = primary.get("content", "")
        title = primary.get("title", "")

        skill_name = self._derive_skill_name(title, content)
        description = self._derive_description(content)
        example = content[:300] if content else ""
        tags = self._derive_tags(content)

        return {
            "skill_name": skill_name,
            "description": description,
            "example": example,
            "tags": tags,
        }

    def _derive_skill_name(self, title: str, content: str) -> str:
        # 从标题提取
        clean = (title or "").strip()
        if clean and clean != "Untitled":
            return clean[:40]
        # 从内容首句提取
        lines = [l.strip() for l in (content or "").splitlines() if l.strip()]
        if lines:
            return lines[0][:40]
        return "Unnamed Skill"

    def _derive_description(self, content: str) -> str:
        lines = [l.strip() for l in (content or "").splitlines() if l.strip()]
        if not lines:
            return ""
        # 取前两句或前 200 字
        desc = " ".join(lines[:2])[:200]
        return desc

    def _derive_tags(self, content: str) -> List[str]:
        tags = []
        tag_map = {
            "部署": ["deployment"],
            "API": ["api-design"],
            "会议": ["meeting", "communication"],
            "决策": ["decision-making"],
            "故障": ["troubleshooting"],
            "工具": ["tooling", "automation"],
            "预算": ["budgeting"],
            "架构": ["architecture"],
            "策略": ["strategy"],
        }
        for keyword, mapped in tag_map.items():
            if keyword in content:
                tags.extend(mapped)
        return list(dict.fromkeys(tags))[:5]

    def write_skill(self, skill: Dict[str, Any]) -> bool:
        """追加 skill 到 SKILLS.md，去重更新"""
        content = self.skills_file.read_text(encoding="utf-8")
        skill_name = skill.get("skill_name", "Unnamed Skill")

        # 检查是否已存在同名 skill
        pattern = rf"(### {re.escape(skill_name)}\n.*?)(?=\n### |\Z)"
        match = re.search(pattern, content, re.DOTALL)

        entry = self._format_skill(skill)

        if match:
            # 更新现有条目
            new_content = re.sub(pattern, entry.rstrip(), content, flags=re.DOTALL)
            self.skills_file.write_text(new_content, encoding="utf-8")
        else:
            # 追加
            with open(self.skills_file, "a", encoding="utf-8") as f:
                f.write(entry)
        return True

    def _format_skill(self, skill: Dict[str, Any]) -> str:
        lines = [
            f"### {skill.get('skill_name', 'Unnamed Skill')}",
            "",
            f"**Description**: {skill.get('description', '')}",
            f"**Tags**: {', '.join(skill.get('tags', []))}",
            f"**Updated**: {datetime.now().isoformat()[:19]}",
            "",
            "**Example**:",
            "```",
            skill.get("example", ""),
            "```",
            "",
        ]
        return "\n".join(lines)
