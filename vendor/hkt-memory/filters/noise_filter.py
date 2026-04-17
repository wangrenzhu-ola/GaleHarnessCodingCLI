"""
Noise Filter for HKT-Memory v5

在自动捕获写入记忆前过滤低信息内容，减少噪声积累。
"""

import re
from typing import Dict, Any


class NoiseFilter:
    """
    噪声预过滤器

    规则层（廉价，优先执行）：
    - 长度过滤
    - 纯 emoji 检测
    - 问候语/确认词列表
    - 重复字符检测
    """

    GREETINGS = {
        "你好", "在吗", "在嘛", "在么", "您好", "哈喽", "嗨", "hi", "hello",
        "OK", "ok", "Okay", "okay",
        "好的", "好", "嗯", "哦", "噢", "啊", "哈", "哈哈", "哈哈哈",
        "谢谢", "多谢", "感谢", "收到了", "明白", "知道了", "了解",
        "是的", "没错", "对", "对的", "行", "可以", "没问题",
        "早安", "晚安", "早上好", "晚上好",
    }

    def __init__(self):
        self._filter_count = 0
        # 纯 emoji 范围：仅包含明确 emoji 区块，避免误命中 CJK 汉字
        self._emoji_pattern = re.compile(
            r"^[\s\u2000-\u206F"
            r"\u2600-\u27BF\u2B50\u2B55"
            r"\U0001F300-\U0001F9FF"
            r"\U0001FA00-\U0001FAFF"
            r"\U0001F1E0-\U0001F1FF]+$",
            re.UNICODE,
        )
        self._repeat_pattern = re.compile(r"^(.)\1{5,}$")

    def is_noise(self, text: str) -> bool:
        """
        判断文本是否为低信息噪声

        Returns:
            True 表示应被过滤
        """
        if not isinstance(text, str):
            return True

        stripped = text.strip()
        if not stripped:
            return True

        # 1. 长度过滤（中文信息密度高，阈值适当放宽）
        if len(stripped) < 5:
            self._filter_count += 1
            return True

        # 2. 短内容（5-9 字符）仅当是常见问候/确认词时才过滤
        if len(stripped) < 10:
            cleaned_short = stripped.strip("。，！？.!?~…")
            if cleaned_short in self.GREETINGS:
                self._filter_count += 1
                return True

        # 3. 纯 emoji 检测
        if self._emoji_pattern.match(stripped):
            self._filter_count += 1
            return True

        # 3. 问候语/确认词列表
        # 先去除常见标点再匹配
        cleaned = stripped.strip("。，！？.!?~…")
        if cleaned in self.GREETINGS:
            self._filter_count += 1
            return True

        # 4. 重复字符（如 "哈哈哈哈哈哈"）
        if self._repeat_pattern.match(stripped):
            self._filter_count += 1
            return True

        return False

    def get_stats(self) -> Dict[str, Any]:
        return {
            "filter_count": self._filter_count,
        }
