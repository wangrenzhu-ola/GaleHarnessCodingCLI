#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "openai>=1.0.0",
# ]
# ///
"""
L1 摘要提取器

使用 LLM 从 L2 完整内容提取结构化摘要。
支持多种 Provider：OpenAI、智谱 AI、MiniMax
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class L1Summary:
    """L1 摘要数据结构"""
    title: str
    summary: str  # 一句话摘要
    key_points: List[str]  # 关键要点
    decisions: List[str]  # 决策记录
    action_items: List[Dict[str, str]]  # 行动项
    people: List[str]  # 涉及人员
    topics: List[str]  # 主题标签
    importance: str  # high/medium/low
    triples: List[List[str]]  # 实体关系三元组 [[subject, relation, object], ...]
    valid_until: Optional[str]  # 时效截止日期 YYYY-MM-DD

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "summary": self.summary,
            "key_points": self.key_points,
            "decisions": self.decisions,
            "action_items": self.action_items,
            "people": self.people,
            "topics": self.topics,
            "importance": self.importance,
            "triples": self.triples,
            "valid_until": self.valid_until,
        }


class L1Extractor:
    """L1 层摘要提取器"""
    
    # 提取 Prompt 模板
    EXTRACTION_PROMPT = """请从以下文档中提取结构化摘要。

文档内容:
```
{content}
```

请提取以下信息并以 JSON 格式返回:
{{
    "title": "文档标题（简洁，20字以内）",
    "summary": "一句话摘要（50字以内）",
    "key_points": ["要点1", "要点2", "要点3"],
    "decisions": ["决策1", "决策2"],
    "action_items": [
        {{"task": "具体任务", "owner": "负责人", "due": "截止时间"}}
    ],
    "people": ["人员1", "人员2"],
    "topics": ["主题标签1", "主题标签2"],
    "importance": "high/medium/low",
    "triples": [
        ["主体", "关系", "客体"]
    ],
    "valid_until": "YYYY-MM-DD 或 null"
}}

要求:
1. title: 直接取原文标题或生成简洁标题
2. summary: 概括核心内容，不超过50字
3. key_points: 最多5个关键要点，每个不超过100字
4. decisions: 提取明确的决策/结论
5. action_items: 提取行动项（如有）
6. people: 提取涉及的人员名称
7. topics: 3-5个主题标签，用于分类
8. importance: 根据内容重要性判断
9. triples: 提取文档中的实体关系三元组（如 ["张三", "is", "工程师"]），如无不填
10. valid_until: 如果文档包含时效性声明（如"截止到2025-06-01"），提取为 YYYY-MM-DD 格式；否则填 null

只返回 JSON，不要其他文字。"""
    
    def __init__(self, provider: str = None, api_key: str = None):
        """
        初始化提取器
        
        Args:
            provider: 模型提供商 (openai/zhipu/minimax)
            api_key: API Key（可选，默认从环境变量读取）
        """
        self.provider = provider or os.getenv("L1_EXTRACTOR_PROVIDER", "zhipu")
        self.api_key = api_key or self._get_api_key()
        
    def _get_api_key(self) -> str:
        """从环境变量获取 API Key"""
        if self.provider == "openai":
            return os.getenv("OPENAI_API_KEY", "")
        elif self.provider == "zhipu":
            return os.getenv("ZHIPU_API_KEY", "")
        elif self.provider == "minimax":
            return os.getenv("MINIMAX_API_KEY", "")
        return ""
    
    def extract(self, content: str, title_hint: str = "") -> L1Summary:
        """
        从 L2 内容提取 L1 摘要
        
        Args:
            content: L2 完整内容
            title_hint: 标题提示（可选）
            
        Returns:
            L1Summary 结构化摘要
        """
        if not self.api_key:
            # 无 API Key 时使用规则提取
            return self._rule_based_extract(content, title_hint)
        
        try:
            # 使用 LLM 提取
            result = self._llm_extract(content)
            return self._parse_l1_result(result, title_hint)
        except Exception as e:
            print(f"[WARN] LLM 提取失败，使用规则提取: {e}")
            return self._rule_based_extract(content, title_hint)
    
    def _llm_extract(self, content: str) -> str:
        """调用 LLM 提取"""
        prompt = self.EXTRACTION_PROMPT.format(content=content[:8000])  # 限制长度
        
        if self.provider == "zhipu":
            return self._call_zhipu(prompt)
        elif self.provider == "openai":
            return self._call_openai(prompt)
        elif self.provider == "minimax":
            return self._call_minimax(prompt)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")
    
    def _call_zhipu(self, prompt: str) -> str:
        """调用智谱 AI"""
        from openai import OpenAI
        
        client = OpenAI(
            api_key=self.api_key,
            base_url="https://open.bigmodel.cn/api/paas/v4"
        )
        
        response = client.chat.completions.create(
            model="glm-4-flash",  # 使用快速模型降低成本
            messages=[
                {"role": "system", "content": "你是一个文档摘要提取助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    
    def _call_openai(self, prompt: str) -> str:
        """调用 OpenAI"""
        from openai import OpenAI
        
        client = OpenAI(api_key=self.api_key)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个文档摘要提取助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    
    def _call_minimax(self, prompt: str) -> str:
        """调用 MiniMax"""
        import requests
        
        url = "https://api.minimaxi.chat/v1/text/chatcompletion_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "MiniMax-Text-01",
            "messages": [
                {"role": "system", "content": "你是一个文档摘要提取助手。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1500
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        result = response.json()
        
        return result["choices"][0]["message"]["content"]
    
    def _parse_l1_result(self, result: str, title_hint: str) -> L1Summary:
        """解析 LLM 返回的 JSON"""
        # 清理可能的 markdown 代码块
        result = result.strip()
        if result.startswith("```json"):
            result = result[7:]
        if result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()
        
        try:
            data = json.loads(result)
        except json.JSONDecodeError:
            # 尝试提取 JSON 部分
            start = result.find("{")
            end = result.rfind("}")
            if start != -1 and end != -1:
                data = json.loads(result[start:end+1])
            else:
                raise
        
        return L1Summary(
            title=data.get("title", title_hint) or "Untitled",
            summary=data.get("summary", ""),
            key_points=data.get("key_points", []),
            decisions=data.get("decisions", []),
            action_items=data.get("action_items", []),
            people=data.get("people", []),
            topics=data.get("topics", []),
            importance=data.get("importance", "medium"),
            triples=data.get("triples", []) or [],
            valid_until=data.get("valid_until") or None,
        )
    
    def _rule_based_extract(self, content: str, title_hint: str) -> L1Summary:
        """基于规则的提取（LLM 失败时的 fallback）"""
        lines = [l.strip() for l in content.split('\n') if l.strip()]
        
        # 提取标题
        title = title_hint
        if not title and lines:
            first = lines[0]
            if first.startswith('# '):
                title = first[2:].strip()
            elif first.startswith('## '):
                title = first[3:].strip()
            else:
                title = first[:40]
        
        # 一句话摘要
        summary = content.replace('\n', ' ')[:80]
        if len(content) > 80:
            summary += "..."
        
        # 关键要点（从列表项提取）
        key_points = []
        for line in lines[:15]:
            if line.startswith(('- ', '* ', '+ ')):
                key_points.append(line[2:].strip()[:80])
            elif len(line) > 10 and not line.startswith('#'):
                key_points.append(line[:80])
            if len(key_points) >= 5:
                break
        
        # 决策（关键词匹配）
        decisions = []
        decision_keywords = ['决策', '决定', '确定', '采用', '选择', '确认']
        for line in lines:
            if any(kw in line for kw in decision_keywords):
                decisions.append(line[:100])
        
        # 人员（简单规则）
        people = []
        # 匹配 "张三说:" 或 "@李四" 或 "负责人: 王五"
        patterns = [
            r'([\u4e00-\u9fa5]{2,4})(?:说|提到|指出|建议)',
            r'@([\u4e00-\u9fa5\w]+)',
            r'(?:负责人|Owner|执行人)[:：]\s*([\u4e00-\u9fa5\w]+)'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content)
            people.extend(matches)
        triples = self._extract_rule_based_triples(content)
        for subject, _, obj in triples:
            if self._looks_like_person_name(subject):
                people.append(subject)
            if self._looks_like_person_name(obj):
                people.append(obj)
        people = list(dict.fromkeys(people))[:5]
        
        # 主题标签（从内容提取关键词）
        topics = []
        topic_keywords = {
            "会议纪要": ["会议", "讨论", "决策"],
            "技术方案": ["API", "架构", "设计", "实现"],
            "项目进度": ["进度", "里程碑", "交付", "计划"],
            "问题排查": ["问题", "Bug", "故障", "修复"],
            "工具使用": ["工具", "脚本", "自动化", "Skill"]
        }
        for topic, keywords in topic_keywords.items():
            if any(kw in content for kw in keywords):
                topics.append(topic)
        if not topics:
            topics = ["通用"]
        
        valid_until = self._extract_rule_based_valid_until(content)

        return L1Summary(
            title=title or "Untitled",
            summary=summary,
            key_points=key_points,
            decisions=decisions[:3],
            action_items=[],
            people=people,
            topics=topics[:3],
            importance="medium",
            triples=triples,
            valid_until=valid_until,
        )

    def _extract_rule_based_triples(self, content: str) -> List[List[str]]:
        triples: List[List[str]] = []
        seen = set()

        patterns = [
            (r'([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9_-]{1,15})是([\u4e00-\u9fa5A-Za-z][^，。；\n]{0,20})', "is"),
            (r'([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9_-]{1,15})负责([^，。；\n]{1,30})', "负责"),
        ]

        for pattern, relation in patterns:
            for subject, obj in re.findall(pattern, content):
                triple = [subject.strip(), relation, obj.strip()]
                key = tuple(triple)
                if key in seen or not triple[0] or not triple[2]:
                    continue
                seen.add(key)
                triples.append(triple)

        return triples[:5]

    def _extract_rule_based_valid_until(self, content: str) -> Optional[str]:
        match = re.search(
            r'(?:有效期至|有效至|截止到|截至|截止日期|到期时间)\s*[:：]?\s*(\d{4}-\d{2}-\d{2})',
            content,
        )
        if match:
            return match.group(1)
        return None

    def _looks_like_person_name(self, value: str) -> bool:
        candidate = (value or "").strip()
        return bool(re.fullmatch(r'[\u4e00-\u9fa5]{2,4}', candidate))
