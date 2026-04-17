"""
Memory Classifier - LLM-powered 6-category classification
"""

import os
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class MemoryCategory(Enum):
    FACT = "fact"
    PREFERENCE = "preference"
    ENTITY = "entity"
    DECISION = "decision"
    PATTERN = "pattern"
    CONSTRAINT = "constraint"


@dataclass
class ClassifiedMemory:
    """分类后的记忆"""
    content: str
    category: MemoryCategory
    confidence: float
    entities: List[str]
    keywords: List[str]
    timestamp: str
    source: str = ""


class MemoryClassifier:
    """
    智能记忆分类器
    
    使用LLM将记忆分类为6个类别：
    - fact: 客观事实
    - preference: 用户偏好
    - entity: 实体信息
    - decision: 决策记录
    - pattern: 模式/规律
    - constraint: 约束/限制
    """
    
    CATEGORIES = {
        "fact": "客观事实、数据、状态描述",
        "preference": "用户偏好、喜好、习惯",
        "entity": "实体定义、属性、关系",
        "decision": "决策、方案、结论",
        "pattern": "模式、规律、重复行为",
        "constraint": "约束、限制、规则、红线"
    }
    
    def __init__(self, model: str = "glm-4-flash"):
        self.model = model
        self.api_key = os.environ.get("HKT_MEMORY_API_KEY") or os.environ.get("OPENAI_API_KEY")
        self.base_url = os.environ.get("HKT_MEMORY_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/")
        self.max_content_chars = max(200, int(os.environ.get("HKT_MEMORY_CLASSIFIER_MAX_CONTENT_CHARS", "2000")))
        self.max_context_chars = max(0, int(os.environ.get("HKT_MEMORY_CLASSIFIER_MAX_CONTEXT_CHARS", "600")))
        self._init_client()
    
    def _init_client(self):
        """初始化LLM客户端"""
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=30.0
            )
        except ImportError:
            self.client = None
            print("Warning: openai not installed. Classifier will use rule-based fallback.")
    
    def classify(self, content: str, context: str = "") -> ClassifiedMemory:
        """
        分类单条记忆
        
        Args:
            content: 记忆内容
            context: 上下文信息
            
        Returns:
            分类结果
        """
        if self.client:
            return self._llm_classify(content, context)
        else:
            return self._rule_classify(content)
    
    def _llm_classify(self, content: str, context: str) -> ClassifiedMemory:
        """使用LLM分类"""
        from datetime import datetime

        content_excerpt = content[:self.max_content_chars].strip()
        context_excerpt = context[:self.max_context_chars].strip()
        
        prompt = f"""请分析以下记忆内容，将其分类为以下6个类别之一：

类别定义：
1. fact: 客观事实、数据、状态描述
2. preference: 用户偏好、喜好、习惯
3. entity: 实体定义、属性、关系（人、项目、技术等）
4. decision: 决策、方案、结论、行动计划
5. pattern: 模式、规律、重复行为、趋势
6. constraint: 约束、限制、规则、红线、必须遵守的事项

记忆内容：
{content_excerpt}

上下文：
{context_excerpt}

请按以下JSON格式输出：
{{
    "category": "类别名称",
    "confidence": 0.95,
    "entities": ["实体1", "实体2"],
    "keywords": ["关键词1", "关键词2"],
    "summary": "一句话摘要"
}}

只输出JSON，不要有其他内容。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的记忆分类助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return ClassifiedMemory(
                content=content,
                category=MemoryCategory(result.get('category', 'fact')),
                confidence=result.get('confidence', 0.5),
                entities=result.get('entities', []),
                keywords=result.get('keywords', []),
                timestamp=datetime.now().isoformat(),
                source=context_excerpt
            )
        except Exception as e:
            print(f"LLM classification failed: {e}")
            return self._rule_classify(content)
    
    def _rule_classify(self, content: str) -> ClassifiedMemory:
        """基于规则的分类（LLM不可用时使用）"""
        from datetime import datetime
        
        content_lower = content.lower()
        
        # 关键词映射
        keywords_map = {
            "decision": ["决策", "决定", "结论", "方案", "选择", "采用", "使用", "决定", "decision"],
            "preference": ["偏好", "喜欢", "倾向于", "习惯", "希望", "想", "prefer", "like"],
            "constraint": ["约束", "限制", "必须", "禁止", "只能", "红线", "constraint", "must"],
            "pattern": ["模式", "规律", "通常", "经常", "总是", "pattern", "usually"],
            "entity": ["项目", "系统", "工具", "技术", "平台", "project", "system"]
        }
        
        # 计算各类别得分
        scores = {cat: 0 for cat in self.CATEGORIES.keys()}
        
        for cat, keywords in keywords_map.items():
            for kw in keywords:
                if kw in content_lower:
                    scores[cat] += 1
        
        # 选择得分最高的类别
        if max(scores.values()) > 0:
            category = max(scores, key=scores.get)
        else:
            category = "fact"
        
        # 提取简单实体（大写词）
        entities = re.findall(r'\b[A-Z][a-zA-Z]{2,}\b', content)
        
        # 提取关键词（简单分词）
        words = re.findall(r'[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}', content_lower)
        keywords = list(set(words))[:5]
        
        return ClassifiedMemory(
            content=content,
            category=MemoryCategory(category),
            confidence=0.5 + min(max(scores.values()), 3) * 0.1,
            entities=list(set(entities))[:5],
            keywords=keywords,
            timestamp=datetime.now().isoformat()
        )
    
    def batch_classify(self, contents: List[str], context: str = "") -> List[ClassifiedMemory]:
        """
        批量分类
        
        Args:
            contents: 记忆内容列表
            context: 上下文
            
        Returns:
            分类结果列表
        """
        return [self.classify(c, context) for c in contents]
    
    def extract_from_conversation(self, 
                                   messages: List[Dict[str, str]],
                                   min_confidence: float = 0.7) -> List[ClassifiedMemory]:
        """
        从对话中提取记忆
        
        Args:
            messages: 对话消息列表
            min_confidence: 最小置信度阈值
            
        Returns:
            提取的记忆列表
        """
        # 合并对话内容
        conversation = "\n".join([
            f"{m.get('role', 'user')}: {m.get('content', '')}"
            for m in messages
        ])
        
        if not self.client:
            # 规则提取
            return self._rule_extract(conversation, min_confidence)
        
        prompt = f"""请从以下对话中提取有价值的记忆，按类别分类：

对话内容：
{conversation}

请提取以下类型的记忆：
1. 用户明确表达的偏好或习惯
2. 重要的决策或结论
3. 关键的事实信息
4. 明确的约束或规则
5. 发现的模式或规律
6. 重要的实体（项目、技术、人等）

输出格式（JSON数组）：
[
    {{
        "content": "记忆内容",
        "category": "类别",
        "confidence": 0.9,
        "entities": ["相关实体"]
    }}
]

只输出JSON数组，不要有其他内容。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的记忆提取助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            memories = result if isinstance(result, list) else result.get('memories', [])
            
            classified = []
            for m in memories:
                if m.get('confidence', 0) >= min_confidence:
                    classified.append(ClassifiedMemory(
                        content=m.get('content', ''),
                        category=MemoryCategory(m.get('category', 'fact')),
                        confidence=m.get('confidence', 0.5),
                        entities=m.get('entities', []),
                        keywords=m.get('keywords', []),
                        timestamp=datetime.now().isoformat()
                    ))
            
            return classified
        except Exception as e:
            print(f"LLM extraction failed: {e}")
            return self._rule_extract(conversation, min_confidence)
    
    def _rule_extract(self, conversation: str, min_confidence: float) -> List[ClassifiedMemory]:
        """基于规则的记忆提取"""
        from datetime import datetime
        
        memories = []
        lines = conversation.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) < 10:
                continue
            
            classified = self._rule_classify(line)
            if classified.confidence >= min_confidence:
                memories.append(classified)
        
        return memories
