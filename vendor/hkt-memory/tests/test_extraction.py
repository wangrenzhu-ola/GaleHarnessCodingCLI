#!/usr/bin/env python3
"""Tests for smart extraction"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from extraction import MemoryClassifier, TwoStageDeduplicator


def test_classifier():
    """测试分类器"""
    classifier = MemoryClassifier()
    
    # 测试决策分类
    result = classifier.classify(
        content="决定使用FastAPI作为后端框架",
        context="技术选型讨论"
    )
    
    assert result.category is not None
    assert result.confidence > 0
    print(f"[OK] Classification: {result.category.value} (confidence: {result.confidence:.2f})")
    print(f"  Entities: {result.entities}")
    print(f"  Keywords: {result.keywords}")


def test_deduplicator():
    """测试去重器"""
    dedup = TwoStageDeduplicator()
    
    # 测试完全重复
    new_memory = "这是一个测试记忆"
    existing = [
        {"id": "test1", "content": "这是一个测试记忆"},
        {"id": "test2", "content": "完全不同的内容"}
    ]
    
    result = dedup.check_duplicate(new_memory, existing)
    
    assert result.action is not None
    print(f"[OK] Deduplication: {result.action.value}")
    print(f"  Similarity: {result.similarity:.2f}")
    print(f"  Reason: {result.reason}")


def test_text_similarity():
    """测试文本相似度计算"""
    dedup = TwoStageDeduplicator()
    
    # 相同文本
    sim1 = dedup._text_similarity("Python开发", "Python开发")
    assert sim1 == 1.0
    print(f"[OK] Same text similarity: {sim1}")
    
    # 部分相似
    sim2 = dedup._text_similarity("Python开发", "Python编程")
    assert 0 < sim2 < 1.0
    print(f"[OK] Partial similarity: {sim2:.2f}")
    
    # 不同文本
    sim3 = dedup._text_similarity("Python", "JavaScript")
    assert sim3 < 0.5
    print(f"[OK] Different text similarity: {sim3:.2f}")


if __name__ == "__main__":
    print("Running extraction tests...\n")
    
    test_classifier()
    print()
    
    test_deduplicator()
    print()
    
    test_text_similarity()
    print()
    
    print("All tests passed! [OK]")
