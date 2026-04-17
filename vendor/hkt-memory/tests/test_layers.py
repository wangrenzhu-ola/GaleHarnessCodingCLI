#!/usr/bin/env python3
"""Tests for layered storage"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import tempfile
from layers import LayerManager, L0AbstractLayer, L1OverviewLayer, L2FullLayer


def test_l0_layer():
    """测试L0层"""
    with tempfile.TemporaryDirectory() as tmpdir:
        l0 = L0AbstractLayer(Path(tmpdir))
        
        # 存储
        memory_id = l0.store(
            content="测试记忆内容",
            topic="test",
            source="test_session"
        )
        
        assert memory_id is not None
        print(f"✓ L0 store: {memory_id}")
        
        # 检索
        results = l0.retrieve(query="测试")
        assert len(results) > 0
        print(f"✓ L0 retrieve: {len(results)} results")
        
        # 统计
        stats = l0.get_stats()
        assert stats['total_topics'] >= 1
        print(f"✓ L0 stats: {stats}")


def test_l1_layer():
    """测试L1层"""
    with tempfile.TemporaryDirectory() as tmpdir:
        l1 = L1OverviewLayer(Path(tmpdir))
        
        # 存储会话
        session_id = l1.store_session(
            session_id="test_session_001",
            summary="测试会话摘要",
            key_points=["要点1", "要点2"],
            decisions=["决定使用Python"]
        )
        
        assert session_id is not None
        print(f"✓ L1 store_session: {session_id}")
        
        # 存储项目
        project_id = l1.store_project(
            project_id="test_project_001",
            name="测试项目",
            description="这是一个测试项目",
            milestones=[{"name": "M1", "completed": True}]
        )
        
        assert project_id is not None
        print(f"✓ L1 store_project: {project_id}")
        
        # 统计
        stats = l1.get_stats()
        assert stats['total_sessions'] >= 1
        print(f"✓ L1 stats: {stats}")


def test_l2_layer():
    """测试L2层"""
    with tempfile.TemporaryDirectory() as tmpdir:
        l2 = L2FullLayer(Path(tmpdir))
        
        # 存储每日日志
        daily_id = l2.store_daily(
            title="测试条目",
            content_lines=["内容行1", "内容行2"]
        )
        
        assert daily_id is not None
        print(f"✓ L2 store_daily: {daily_id}")
        
        # 存储永久记忆
        evergreen_id = l2.store_evergreen(
            title="重要规则",
            content_lines=["规则1", "规则2"],
            importance="high"
        )
        
        assert evergreen_id is not None
        print(f"✓ L2 store_evergreen: {evergreen_id}")
        
        # 存储episode
        episode_id = l2.store_episode(
            episode_type="conversation",
            content="对话内容",
            source="user_input"
        )
        
        assert episode_id is not None
        print(f"✓ L2 store_episode: {episode_id}")
        
        # 搜索
        results = l2.search(query="测试")
        assert len(results) >= 0
        print(f"✓ L2 search: {len(results)} results")


def test_layer_manager():
    """测试LayerManager"""
    with tempfile.TemporaryDirectory() as tmpdir:
        manager = LayerManager(Path(tmpdir))
        
        # 分层存储
        ids = manager.store(
            content="这是一个测试记忆，包含多个要点。",
            title="测试记忆",
            layer="all",
            topic="test"
        )
        
        assert 'L2' in ids
        print(f"✓ LayerManager store: {ids}")
        
        # 渐进式检索
        results = manager.progressive_retrieve(
            query="测试",
            limit_per_layer=3
        )
        
        assert 'L0' in results
        assert 'L1' in results
        assert 'L2' in results
        print(f"✓ LayerManager progressive_retrieve: OK")
        
        # 统计
        stats = manager.get_stats()
        assert 'L0' in stats
        print(f"✓ LayerManager stats: {stats}")


if __name__ == "__main__":
    print("Running layer tests...\n")
    
    test_l0_layer()
    print()
    
    test_l1_layer()
    print()
    
    test_l2_layer()
    print()
    
    test_layer_manager()
    print()
    
    print("All tests passed! ✓")
