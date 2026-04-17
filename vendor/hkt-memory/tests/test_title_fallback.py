import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from layers.manager import LayerManager as LegacyLayerManager
from layers.manager_fixed import LayerManager as FixedLayerManager
from scripts.hkt_memory_v5 import HKTMv5


def test_manager_v5_uses_markdown_heading_as_title(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="# 我的测试标题\n这是内容",
        topic="test-topic",
        layer="L2",
    )

    entry = memory.layers.l2.get_entry(stored["L2"])
    results = memory.retrieve(query="我的测试标题", layer="L2", limit=5)["L2"]

    assert entry is not None
    assert entry["title"] == "我的测试标题"
    assert any(item["id"] == stored["L2"] and item["title"] == "我的测试标题" for item in results)


def test_manager_v5_falls_back_to_topic_without_markdown_title(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="普通首行\n这是内容",
        topic="test-topic",
        layer="L2",
    )

    entry = memory.layers.l2.get_entry(stored["L2"])

    assert entry is not None
    assert entry["title"] == "test-topic"


def test_manager_v5_accepts_empty_content_and_uses_topic_title(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="",
        topic="topic-only",
        layer="L2",
    )

    entry = memory.layers.l2.get_entry(stored["L2"])

    assert entry is not None
    assert entry["title"] == "topic-only"


def test_legacy_managers_share_title_fallback_behavior(tmp_path):
    fixed_manager = FixedLayerManager(tmp_path / "fixed")
    fixed_ids = fixed_manager.store(
        content="# 固定版标题\n内容",
        topic="fixed-topic",
        layer="L2",
    )
    fixed_entry = fixed_manager.l2.get_entry(fixed_ids["L2"])

    legacy_manager = LegacyLayerManager(tmp_path / "legacy")
    legacy_ids = legacy_manager.store(
        content="普通内容首行",
        topic="legacy-topic",
        layer="L2",
    )
    legacy_entry = legacy_manager.l2.get_entry(legacy_ids["L2"])

    assert fixed_entry is not None
    assert fixed_entry["title"] == "固定版标题"
    assert legacy_entry is not None
    assert legacy_entry["title"] == "legacy-topic"
