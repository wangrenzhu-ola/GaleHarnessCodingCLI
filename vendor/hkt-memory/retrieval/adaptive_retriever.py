"""
Adaptive Retrieval

自适应检索判断器 - 智能决定是否需要检索记忆
"""

import re
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class AdaptiveConfig:
    """自适应检索配置"""
    # 短查询阈值（中文字符）
    short_query_cn: int = 6
    # 短查询阈值（英文单词）
    short_query_en: int = 3
    # 强制检索关键词
    force_patterns: list = None
    # 跳过检索的正则
    skip_patterns: Dict[str, Any] = None


class AdaptiveRetriever:
    """
    自适应检索判断器
    
    智能判断查询是否需要检索长期记忆，避免：
    - 对问候语进行检索
    - 对短确认词进行检索
    - 对纯emoji进行检索
    
    但会强制检索包含记忆关键词的查询
    """
    
    # 默认强制检索关键词
    DEFAULT_FORCE_PATTERNS = [
        r"记得", r"之前", r"上次", r"以前", r"说过",
        r"previously", r"last\s+time", r"remember", 
        r"mentioned", r"discussed", r"earlier",
        r"我们", r"咱们", r"you\s+said"
    ]
    
    # 默认跳过模式
    DEFAULT_SKIP_PATTERNS = {
        # 问候语
        "greeting": [
            r"^你好", r"^您好", r"^Hi\b", r"^Hello", 
            r"^Hey", r"^在吗", r"^在？", r"^在么",
            r"^在不在", r"^有人吗", r"^早上好", 
            r"^下午好", r"^晚上好"
        ],
        # 确认词
        "confirmation": [
            r"^是的?$", r"^好的?$", r"^OK$", r"^Okay$",
            r"^行$", r"^可以$", r"^没问题$", r"^对的?$",
            r"^嗯$", r"^哦$", r"^好$", r"^是$",
            r"^Yes$", r"^No$", r"^Yep$", r"^Nope$",
            r"^thanks?$", r"^谢谢", r"^多谢"
        ],
        # 纯emoji
        "emoji_only": r"^[\s\u2600-\u27BF\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]+$",
        # 元问题
        "meta_question": [
            r"^你能做什么", r"^你可以", r"^你是谁",
            r"^what\s+can\s+you\s+do", r"^who\s+are\s+you"
        ]
    }
    
    def __init__(self, config: Optional[AdaptiveConfig] = None):
        self.config = config or AdaptiveConfig()
        
        # 使用默认配置或自定义配置
        self.force_patterns = self.config.force_patterns or self.DEFAULT_FORCE_PATTERNS
        self.skip_patterns = self.config.skip_patterns or self.DEFAULT_SKIP_PATTERNS
        
        # 编译正则表达式
        self._compile_patterns()
    
    def _compile_patterns(self):
        """编译正则表达式"""
        self.compiled_force = [re.compile(p, re.IGNORECASE) for p in self.force_patterns]
        
        self.compiled_skip = {}
        for key, value in self.skip_patterns.items():
            if isinstance(value, list):
                self.compiled_skip[key] = [re.compile(p, re.IGNORECASE) for p in value]
            else:
                self.compiled_skip[key] = re.compile(value)
    
    def should_retrieve(self, query: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        判断是否需要检索长期记忆
        
        Args:
            query: 用户查询
            
        Returns:
            (should_retrieve, reason, metadata)
            - should_retrieve: 是否需要检索
            - reason: 判断理由
            - metadata: 附加信息
        """
        query = query.strip()
        metadata = {
            'query_length': len(query),
            'force_triggered': False,
            'skip_triggered': None
        }
        
        # 1. 检查强制检索关键词
        for pattern in self.compiled_force:
            if pattern.search(query):
                metadata['force_triggered'] = True
                metadata['matched_pattern'] = pattern.pattern
                return True, f"Force retrieval triggered by pattern: {pattern.pattern}", metadata
        
        # 2. 检查短查询
        cn_chars = len([c for c in query if '\u4e00' <= c <= '\u9fff'])
        en_words = len(query.split())
        
        if cn_chars > 0 and cn_chars < self.config.short_query_cn:
            metadata['skip_triggered'] = 'short_query_cn'
            return False, f"Short Chinese query ({cn_chars} chars < {self.config.short_query_cn})", metadata
        
        if cn_chars == 0 and en_words < self.config.short_query_en:
            metadata['skip_triggered'] = 'short_query_en'
            return False, f"Short English query ({en_words} words < {self.config.short_query_en})", metadata
        
        # 3. 检查跳过模式
        for category, patterns in self.compiled_skip.items():
            if isinstance(patterns, list):
                for pattern in patterns:
                    if pattern.search(query):
                        metadata['skip_triggered'] = category
                        metadata['matched_pattern'] = pattern.pattern
                        return False, f"Skip retrieval: {category} pattern matched", metadata
            else:
                if patterns.match(query):
                    metadata['skip_triggered'] = category
                    return False, f"Skip retrieval: {category}", metadata
        
        # 4. 默认需要检索
        return True, "Adaptive retrieval enabled - query requires memory lookup", metadata
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        分析查询特征
        
        用于调试和优化
        """
        query = query.strip()
        
        # 计算特征
        cn_chars = len([c for c in query if '\u4e00' <= c <= '\u9fff'])
        en_chars = len([c for c in query if c.isascii() and c.isalpha()])
        digits = len([c for c in query if c.isdigit()])
        emojis = len([c for c in query if '\U0001F600' <= c <= '\U0001F64F'])
        
        should_retrieve, reason, metadata = self.should_retrieve(query)
        
        return {
            'query': query,
            'length': len(query),
            'chinese_chars': cn_chars,
            'english_chars': en_chars,
            'digits': digits,
            'emojis': emojis,
            'should_retrieve': should_retrieve,
            'reason': reason,
            'metadata': metadata
        }
