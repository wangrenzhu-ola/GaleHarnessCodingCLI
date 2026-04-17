#!/usr/bin/env python3
"""
L0 摘要提取器

从 L1 摘要生成 L0 极简索引。
关键词提取 + 核心信息压缩。
"""

import re
from typing import List, Dict, Set
from dataclasses import dataclass
from collections import Counter


@dataclass
class L0Abstract:
    """L0 极简摘要数据结构"""
    topic: str
    title: str
    keywords: List[str]  # 核心关键词
    core_idea: str  # 核心观点（15字以内）
    timestamp: str
    source_l2: str  # 来源 L2 ID
    
    def format_line(self) -> str:
        """格式化为单行索引"""
        keywords_str = ", ".join(self.keywords[:4])
        return f"| {self.timestamp} | {self.topic} | {self.title[:20]} | {keywords_str} | {self.core_idea} |"
    
    def format_entry(self) -> str:
        """格式化为详细条目"""
        return f"""### {self.title}
- **时间**: {self.timestamp}
- **主题**: {self.topic}
- **关键词**: {", ".join(self.keywords)}
- **核心**: {self.core_idea}
- **来源**: {self.source_l2}
"""


class L0Extractor:
    """L0 层极简摘要提取器"""
    
    # 停用词
    STOP_WORDS = {
        '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '这些', '那些', '这个', '那个', '之', '与', '及', '等', '或', '但', '而', '因', '于', '被', '把', '给', '让', '向', '往', '从', '自', '由', '当', '以', '为', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'with', 'for', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although', 'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom', 'whose', 'what', 'whatever', 'whoever', 'whomever', 'whichever'
    }
    
    # 技术关键词权重
    TECH_KEYWORDS = {
        'api', '架构', '设计', '实现', '优化', '性能', '安全', '测试',
        '部署', '运维', '监控', '日志', '配置', '数据库', '缓存',
        '微服务', '容器', '云原生', 'devops', 'ci/cd', '敏捷',
        'python', 'javascript', 'typescript', 'golang', 'rust', 'java',
        'react', 'vue', 'angular', 'node', 'django', 'flask', 'fastapi',
        'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp',
        'ai', 'ml', 'llm', 'agent', 'rag', 'embedding', 'vector',
        'meeting', '会议纪要', '决策', '行动项', '待办'
    }
    
    def extract(self, l1_summary: Dict, topic: str, timestamp: str, source_l2: str) -> L0Abstract:
        """
        从 L1 摘要提取 L0 极简索引
        
        Args:
            l1_summary: L1 摘要字典
            topic: 主题
            timestamp: 时间戳
            source_l2: 来源 L2 ID
            
        Returns:
            L0Abstract 极简摘要
        """
        content = self._get_full_text(l1_summary)
        
        # 提取关键词
        keywords = self._extract_keywords(content, l1_summary)
        
        # 提取核心观点
        core_idea = self._extract_core_idea(l1_summary)
        
        return L0Abstract(
            topic=topic,
            title=l1_summary.get('title', 'Untitled'),
            keywords=keywords,
            core_idea=core_idea,
            timestamp=timestamp[:10],  # 只保留日期
            source_l2=source_l2
        )
    
    def _get_full_text(self, l1_summary: Dict) -> str:
        """获取 L1 的完整文本用于分析"""
        parts = [
            l1_summary.get('title', ''),
            l1_summary.get('summary', ''),
        ]
        parts.extend(l1_summary.get('key_points', []))
        parts.extend(l1_summary.get('decisions', []))
        return ' '.join(parts)
    
    def _extract_keywords(self, text: str, l1_summary: Dict) -> List[str]:
        """提取关键词"""
        keywords = set()
        
        # 1. 从 L1 的 topics 获取
        for topic in l1_summary.get('topics', []):
            if topic and topic not in self.STOP_WORDS:
                keywords.add(topic)
        
        # 2. 从加粗文本提取
        bold_pattern = r'\*\*(.+?)\*\*'
        bold_matches = re.findall(bold_pattern, text)
        for match in bold_matches:
            if len(match) > 1 and match not in self.STOP_WORDS:
                keywords.add(match.strip())
        
        # 3. 从代码块提取
        code_pattern = r'`(.+?)`'
        code_matches = re.findall(code_pattern, text)
        for match in code_matches:
            if len(match) > 1:
                keywords.add(match.strip())
        
        # 4. 基于 TF-IDF 的思想提取高频词
        words = self._tokenize(text)
        word_freq = Counter(w for w in words if w not in self.STOP_WORDS and len(w) > 1)
        
        # 优先技术关键词
        for word, count in word_freq.most_common(20):
            if word.lower() in self.TECH_KEYWORDS or count >= 2:
                keywords.add(word)
            if len(keywords) >= 8:
                break
        
        # 返回前5个关键词
        return list(keywords)[:5]
    
    def _tokenize(self, text: str) -> List[str]:
        """简单分词"""
        # 中文按字符，英文按单词
        words = []
        
        # 提取英文单词
        english_words = re.findall(r'[a-zA-Z]+', text.lower())
        words.extend(english_words)
        
        # 提取中文字符串（2-8个字的词）
        chinese_chars = re.findall(r'[\u4e00-\u9fff]+', text)
        for chars in chinese_chars:
            # 简单滑动窗口提取词语
            for i in range(len(chars)):
                for j in range(i+2, min(i+9, len(chars)+1)):
                    words.append(chars[i:j])
        
        return words
    
    def _extract_core_idea(self, l1_summary: Dict) -> str:
        """提取核心观点（15字以内）"""
        # 优先从 summary 提取
        summary = l1_summary.get('summary', '')
        if summary:
            # 取前15个字
            core = summary[:15]
            if len(summary) > 15:
                core = summary[:14] + "…"
            return core
        
        # 从 key_points 取第一个
        key_points = l1_summary.get('key_points', [])
        if key_points:
            core = key_points[0][:15]
            if len(key_points[0]) > 15:
                core = key_points[0][:14] + "…"
            return core
        
        # 从 title 提取
        title = l1_summary.get('title', '')
        if title:
            core = title[:15]
            if len(title) > 15:
                core = title[:14] + "…"
            return core
        
        return "详见文档"
    
    def update_index(self, abstracts: List[L0Abstract], index_path: str) -> str:
        """
        更新 L0 索引文件
        
        Args:
            abstracts: L0 摘要列表
            index_path: 索引文件路径
            
        Returns:
            更新后的索引内容
        """
        from pathlib import Path
        
        path = Path(index_path)
        
        # 构建索引内容
        lines = [
            "# L0 Abstract Index",
            "",
            "> 极简摘要层索引 - 用于快速初步检索",
            "",
            "## 快速概览",
            "",
            "| 日期 | 主题 | 标题 | 关键词 | 核心 |",
            "|------|------|------|--------|------|",
        ]
        
        # 按时间倒序排列
        sorted_abstracts = sorted(abstracts, key=lambda x: x.timestamp, reverse=True)
        
        for abstract in sorted_abstracts[:50]:  # 最多显示50条
            lines.append(abstract.format_line())
        
        lines.extend([
            "",
            "## 详细条目",
            "",
        ])
        
        for abstract in sorted_abstracts:
            lines.append(abstract.format_entry())
            lines.append("")
        
        content = '\n'.join(lines)
        
        # 写入文件
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
        
        return content
