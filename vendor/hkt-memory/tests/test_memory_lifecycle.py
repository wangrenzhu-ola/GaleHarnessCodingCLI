import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent.parent))
from lifecycle.weibull_decay import WeibullDecay, MemoryTier
from scripts.hkt_memory_v5 import HKTMv5


def test_soft_delete_restore_and_hard_delete(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    first = memory.store(
        content="部署策略需要保留 staging 验证",
        title="部署策略",
        topic="tools",
        layer="all",
    )
    memory_id = first["L2"]
    l1_topic_file = tmp_path / "memory" / "L1-Overview" / "topics" / "tools.md"
    l0_topic_file = tmp_path / "memory" / "L0-Abstract" / "topics" / "tools.md"

    initial = memory.retrieve(query="staging", layer="L2", limit=10)
    assert any(item["id"] == memory_id for item in initial["L2"])
    assert memory_id in l1_topic_file.read_text(encoding="utf-8")
    assert memory_id in l0_topic_file.read_text(encoding="utf-8")

    soft_deleted = memory.forget(memory_id=memory_id)
    assert soft_deleted["success"] is True
    assert soft_deleted["status"] == "disabled"
    assert soft_deleted["aggregate_rebuild"]["rebuilt"] == 0

    after_soft_delete = memory.retrieve(query="staging", layer="L2", limit=10)
    assert all(item["id"] != memory_id for item in after_soft_delete["L2"])
    assert not l1_topic_file.exists() or memory_id not in l1_topic_file.read_text(encoding="utf-8")
    assert not l0_topic_file.exists() or memory_id not in l0_topic_file.read_text(encoding="utf-8")

    restored = memory.restore(memory_id=memory_id)
    assert restored["success"] is True
    assert restored["status"] == "active"
    assert restored["aggregate_rebuild"]["rebuilt"] == 1

    after_restore = memory.retrieve(query="staging", layer="L2", limit=10)
    assert any(item["id"] == memory_id for item in after_restore["L2"])
    assert memory_id in l1_topic_file.read_text(encoding="utf-8")
    assert memory_id in l0_topic_file.read_text(encoding="utf-8")

    hard_deleted = memory.forget(memory_id=memory_id, force=True)
    assert hard_deleted["success"] is True
    assert hard_deleted["removed_from_l2"] is True
    assert hard_deleted["aggregate_rebuild"]["rebuilt"] == 0

    after_hard_delete = memory.retrieve(query="staging", layer="L2", limit=10)
    assert all(item["id"] != memory_id for item in after_hard_delete["L2"])
    assert not l1_topic_file.exists() or memory_id not in l1_topic_file.read_text(encoding="utf-8")
    assert not l0_topic_file.exists() or memory_id not in l0_topic_file.read_text(encoding="utf-8")


def test_cleanup_and_prune(monkeypatch, tmp_path):
    monkeypatch.setenv("HKT_MEMORY_MAX_ENTRIES_PER_SCOPE", "1")
    monkeypatch.setenv("HKT_MEMORY_PRUNE_MODE", "archive")
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    first = memory.store(
        content="共享上下文 A",
        title="共享上下文 A",
        topic="tools",
        layer="L2",
    )
    second = memory.store(
        content="共享上下文 B",
        title="共享上下文 B",
        topic="tools",
        layer="L2",
    )

    stats = memory.stats()["lifecycle"]
    assert stats["statuses"]["archived"] >= 1
    visible = memory.retrieve(query="共享上下文", layer="L2", limit=10)["L2"]
    assert len([item for item in visible if item["id"] in {first["L2"], second["L2"]}]) == 1

    lifecycle = memory.layers.lifecycle
    old_event = {
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=200)).isoformat(),
        "type": "recall",
        "memory_id": second["L2"],
        "scope": "topic:tools",
        "data": {},
    }
    with open(lifecycle.events_path, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(old_event, ensure_ascii=False) + "\n")

    preview = memory.cleanup(dry_run=True)
    assert preview["deleted_count"] >= 1

    cleaned = memory.cleanup(dry_run=False)
    assert cleaned["deleted_count"] >= 1

    remaining_events = lifecycle.events_path.read_text(encoding="utf-8")
    assert old_event["timestamp"] not in remaining_events


def test_pin_importance_feedback_and_rebuild(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    first = memory.store(
        content="部署窗口需要灰度验证和回滚开关",
        title="灰度验证",
        topic="tools",
        layer="all",
    )
    second = memory.store(
        content="部署窗口需要预先准备回滚预案",
        title="回滚预案",
        topic="tools",
        layer="all",
    )

    pin_result = memory.pin(memory_id=first["L2"], pinned=True)
    importance_result = memory.set_importance(memory_id=first["L2"], importance="high")
    useful_result = memory.feedback(
        label="useful",
        memory_id=first["L2"],
        topic="tools",
        query="部署窗口",
        note="命中正确",
    )
    wrong_result = memory.feedback(
        label="wrong",
        memory_id=second["L2"],
        topic="tools",
        query="部署窗口",
        note="内容已经过时",
    )
    missing_result = memory.feedback(
        label="missing",
        topic="tools",
        query="部署窗口",
        note="还缺审批流细节",
    )
    rebuild_result = memory.rebuild()

    assert pin_result["success"] is True
    assert importance_result["importance"] == "high"
    assert useful_result["scope"] == "topic:tools"
    assert wrong_result["scope"] == "topic:tools"
    assert missing_result["scope"] == "topic:tools"
    assert rebuild_result["rebuilt"] == 2

    ranked = memory.retrieve(query="部署窗口", layer="L2", limit=10)["L2"]
    assert ranked[0]["id"] == first["L2"]

    lifecycle_stats = memory.stats()["lifecycle"]
    assert lifecycle_stats["feedback"]["by_label"]["useful"] >= 1
    assert lifecycle_stats["feedback"]["by_label"]["wrong"] >= 1
    assert lifecycle_stats["feedback"]["by_label"]["missing"] >= 1
    assert lifecycle_stats["feedback"]["scope_feedback"]["topic:tools"]["missing"] >= 1

    manifest = memory.layers.lifecycle.get_memory(first["L2"])
    assert manifest["pinned"] is True
    assert manifest["importance"] == "high"
    assert manifest["feedback_stats"]["useful"] >= 1

    learnings = (tmp_path / "memory" / "governance" / "LEARNINGS.md").read_text(encoding="utf-8")
    errors = (tmp_path / "memory" / "governance" / "ERRORS.md").read_text(encoding="utf-8")
    assert "记忆反馈 useful" in learnings
    assert "记忆反馈 wrong" in errors
    assert "记忆反馈 missing" in errors


def test_retrieve_long_query_matches_token_overlap(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    memory.store(
        content="\n".join(
            [
                "技术方案评审记录",
                "HTML PPT 页面方案使用 mermaid 做结构表达。",
                "前端设计需要兼容 VMware 环境。",
                "另外要对接 Dify workflow 和 Harness 发布链路。",
            ]
        ),
        title="技术方案评审",
        topic="tools",
        layer="all",
    )

    query = "技术方案评审 HTML PPT 页面 mermaid 前端设计 VMware Dify Harness"
    results = memory.retrieve(query=query, layer="all", limit=5)

    assert len(results["L2"]) >= 1
    assert len(results["L1"]) >= 1
    assert len(results["L0"]) >= 1
    assert results["L2"][0]["title"] == "技术方案评审"


def test_hybrid_retrieve_uses_vector_results_for_all_layers(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="\n".join(
            [
                "会议录音自动整理成纪要。",
                "支持音频转写和结构化摘要。",
                "适合团队复盘。",
            ]
        ),
        title="录音纪要工具",
        topic="tools",
        layer="all",
    )
    memory_id = stored["L2"]

    def fake_vector_search(query: str, top_k: int = 5, layer: str = None):
        return [
            {
                "id": memory_id,
                "content": "会议录音自动整理成纪要。",
                "score": 0.92,
                "metadata": {"topic": "tools"},
                "source": memory_id,
                "layer": "L2",
                "access_count": 0,
            }
        ]

    if memory.layers.vector_store is None:
        memory.layers.vector_store = SimpleNamespace(search=fake_vector_search)
    else:
        memory.layers.vector_store.search = fake_vector_search

    results = memory.retrieve(query="语音转文字 工具", layer="all", limit=5)

    assert len(results["L2"]) >= 1
    assert len(results["L1"]) >= 1
    assert len(results["L0"]) >= 1
    assert results["L2"][0]["id"] == memory_id
    assert results["L1"][0]["source_l2"] == memory_id
    assert results["L0"][0]["source_l2"] == memory_id
    assert results["L2"][0]["_vector_score"] == 0.92


def test_retrieve_similarity_threshold_filters_low_vector_hits(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="这是一个偏语义命中的记忆条目，文本里没有检索词。",
        title="语义召回测试",
        topic="tools",
        layer="all",
    )
    memory_id = stored["L2"]

    def fake_vector_search(query: str, top_k: int = 5, layer: str = None):
        return [
            {
                "id": memory_id,
                "content": "这是一个偏语义命中的记忆条目，文本里没有检索词。",
                "score": 0.41,
                "metadata": {"topic": "tools"},
                "source": memory_id,
                "layer": "L2",
                "access_count": 0,
            }
        ]

    if memory.layers.vector_store is None:
        memory.layers.vector_store = SimpleNamespace(search=fake_vector_search)
    else:
        memory.layers.vector_store.search = fake_vector_search

    permissive = memory.retrieve(query="完全不同的表达", layer="L2", limit=5, min_similarity=0.4)
    strict = memory.retrieve(query="完全不同的表达", layer="L2", limit=5, min_similarity=0.5)

    assert permissive["L2"][0]["id"] == memory_id
    assert strict["L2"] == []


def test_retrieve_debug_and_weighting_are_exposed(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    vector_first = memory.store(
        content="录音转纪要、会议总结、音频整理。",
        title="会议纪要助手",
        topic="tools",
        layer="all",
    )
    lexical_first = memory.store(
        content="这是专门描述语音转文字工具的文档，语音转文字工具支持批量文件。",
        title="语音转文字工具",
        topic="tools",
        layer="all",
    )

    def fake_vector_search(query: str, top_k: int = 5, layer: str = None):
        return [
            {
                "id": vector_first["L2"],
                "content": "录音转纪要、会议总结、音频整理。",
                "score": 0.95,
                "metadata": {"topic": "tools"},
                "source": vector_first["L2"],
                "layer": "L2",
                "access_count": 0,
            },
            {
                "id": lexical_first["L2"],
                "content": "这是专门描述语音转文字工具的文档。",
                "score": 0.35,
                "metadata": {"topic": "tools"},
                "source": lexical_first["L2"],
                "layer": "L2",
                "access_count": 0,
            },
        ]

    if memory.layers.vector_store is None:
        memory.layers.vector_store = SimpleNamespace(search=fake_vector_search)
    else:
        memory.layers.vector_store.search = fake_vector_search

    vector_heavy = memory.retrieve(
        query="语音转文字 工具",
        layer="L2",
        limit=5,
        vector_weight=0.9,
        bm25_weight=0.1,
        debug=True,
    )
    bm25_heavy = memory.retrieve(
        query="语音转文字 工具",
        layer="L2",
        limit=5,
        vector_weight=0.1,
        bm25_weight=0.9,
        debug=True,
    )

    assert vector_heavy["L2"][0]["id"] == vector_first["L2"]
    assert bm25_heavy["L2"][0]["id"] == lexical_first["L2"]
    assert "debug" in vector_heavy
    assert vector_heavy["debug"]["config"]["vector_weight"] == 0.9
    assert vector_heavy["debug"]["config"]["bm25_weight"] == 0.1
    assert vector_heavy["debug"]["layers"]["L2"]["candidate_count"] >= 2
    assert vector_heavy["L2"][0]["_debug_explain"]["reasons"]


def test_retrieve_gracefully_reports_vector_store_unavailable(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    stored = memory.store(
        content="语音转文字工具支持批量识别和摘要。",
        title="语音转文字工具",
        topic="tools",
        layer="L2",
    )

    memory.layers.vector_store = None
    memory.layers._vector_store_error = "forced unavailable in test"

    results = memory.retrieve(query="语音转文字 工具", layer="L2", limit=5, debug=True)

    assert results["L2"][0]["id"] == stored["L2"]
    assert results["debug"]["vector"]["enabled"] is False
    assert results["debug"]["vector"]["reason"] == "forced unavailable in test"


def test_merge_results_averages_duplicate_scores(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    merged = memory.layers._merge_results(
        primary=[
            {
                "id": "shared",
                "title": "主结果",
                "_match_score": 0.9,
                "_vector_score": 0.6,
                "_bm25_score": 0.8,
                "_debug_match": {"matched_terms": ["语音"], "coverage": 1.0},
            }
        ],
        secondary=[
            {
                "id": "shared",
                "content": "补充结果",
                "_match_score": 0.3,
                "_vector_score": 0.2,
                "_bm25_score": 0.4,
            }
        ],
        key_field="id",
    )

    assert len(merged) == 1
    assert abs(merged[0]["_match_score"] - 0.6) < 1e-9
    assert abs(merged[0]["_vector_score"] - 0.4) < 1e-9
    assert abs(merged[0]["_bm25_score"] - 0.6) < 1e-9
    assert merged[0]["title"] == "主结果"
    assert merged[0]["content"] == "补充结果"


def test_store_retries_when_vector_add_returns_false(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    calls = []

    def fake_add(**kwargs):
        calls.append(kwargs["doc_id"])
        return len(calls) > 1

    memory.layers.vector_store = SimpleNamespace(add=fake_add)

    stored = memory.store(
        content="向量写入失败后应自动重试。",
        title="向量写入重试",
        topic="tools",
        layer="L2",
    )

    assert stored["L2"]
    assert len(calls) == 2
    assert memory.layers._vector_store_add_failures == 1
    assert memory.layers._vector_store_last_add_failure["id"] == stored["L2"]
    assert memory.layers._vector_store_last_add_failure["retry_attempted"] is True
    assert memory.layers._vector_store_last_add_failure["recovered"] is True


def test_manager_v5_uses_direct_submodule_imports():
    manager_source = (Path(__file__).parent.parent / "layers" / "manager_v5.py").read_text(encoding="utf-8")

    assert "from governance import ErrorTracker, LearningTracker" not in manager_source
    assert "from governance.errors import ErrorTracker" in manager_source
    assert "from governance.learnings import LearningTracker" in manager_source


def test_hkt_memory_v5_stats_entrypoint_runs(tmp_path):
    repo_root = Path(__file__).parent.parent
    result = subprocess.run(
        [
            sys.executable,
            str(repo_root / "scripts" / "hkt_memory_v5.py"),
            "--memory-dir",
            str(tmp_path / "memory"),
            "stats",
        ],
        cwd=repo_root,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "vector_store" in result.stdout


def test_auto_capture_persists_filter_count_across_processes(tmp_path):
    repo_root = Path(__file__).parent.parent
    memory_dir = tmp_path / "memory"
    env = os.environ.copy()
    env["HKT_MEMORY_DIR"] = str(memory_dir)
    env["HKT_SESSION_ID"] = "acceptance1"
    env["HKT_TOPIC"] = "hooks"
    env["HKT_CONTENT"] = "你好"

    hook_result = subprocess.run(
        [sys.executable, str(repo_root / "hooks" / "auto_capture.py")],
        cwd=repo_root,
        env=env,
        capture_output=True,
        text=True,
    )

    assert hook_result.returncode == 0
    assert "filtered" in hook_result.stderr

    memory = HKTMv5(memory_dir=str(memory_dir), llm_provider="zhipu")
    lifecycle_stats = memory.stats()["lifecycle"]
    assert lifecycle_stats["filter_count"] >= 1


def test_hkt_memory_v5_retrieve_entrypoint_survives_read_only_lifecycle(tmp_path):
    repo_root = Path(__file__).parent.parent
    memory_dir = tmp_path / "memory"
    lifecycle_dir = memory_dir / "_lifecycle"
    lifecycle_dir.mkdir(parents=True, exist_ok=True)
    events_path = lifecycle_dir / "events.jsonl"
    events_path.write_text(
        json.dumps(
            {
                "timestamp": "2026-01-01T00:00:00+00:00",
                "type": "capture",
                "memory_id": "x",
                "scope": "topic:test",
                "data": {},
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    os.chmod(lifecycle_dir, 0o555)
    os.chmod(events_path, 0o444)
    try:
        result = subprocess.run(
            [
                sys.executable,
                str(repo_root / "scripts" / "hkt_memory_v5.py"),
                "--memory-dir",
                str(memory_dir),
                "retrieve",
                "--query",
                "test",
                "--layer",
                "all",
                "--limit",
                "1",
            ],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
    finally:
        os.chmod(events_path, 0o644)
        os.chmod(lifecycle_dir, 0o755)

    assert result.returncode == 0, result.stderr
    assert "PermissionError" not in result.stderr
    assert "Lifecycle IO degraded" in result.stdout


def test_store_l2_survives_read_only_lifecycle_directory(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    lifecycle = memory.layers.lifecycle
    lifecycle.manifest_path.write_text("{}", encoding="utf-8")
    lifecycle.state_path.write_text("{}", encoding="utf-8")
    lifecycle.events_path.write_text("", encoding="utf-8")
    os.chmod(lifecycle.lifecycle_dir, 0o555)
    os.chmod(lifecycle.manifest_path, 0o444)
    os.chmod(lifecycle.state_path, 0o444)
    os.chmod(lifecycle.events_path, 0o444)
    try:
        stored = memory.store(
            content="生命周期目录只读时，L2 写入仍应继续。",
            title="只读生命周期目录",
            topic="tools",
            layer="L2",
        )
    finally:
        os.chmod(lifecycle.events_path, 0o644)
        os.chmod(lifecycle.state_path, 0o644)
        os.chmod(lifecycle.manifest_path, 0o644)
        os.chmod(lifecycle.lifecycle_dir, 0o755)

    assert stored["L2"]
    assert stored["lifecycle_persisted"] is False
    assert stored["lifecycle_error"]["operation"] == "write"
    assert memory.layers.lifecycle.get_memory(stored["L2"]) is None
    assert memory.layers.lifecycle.get_stats()["io_degraded"] is True


def test_feedback_reports_state_persistence_failure(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    lifecycle = memory.layers.lifecycle
    lifecycle.state_path.write_text("{}", encoding="utf-8")
    os.chmod(lifecycle.lifecycle_dir, 0o555)
    os.chmod(lifecycle.state_path, 0o444)
    try:
        result = memory.feedback(
            label="missing",
            topic="tools",
            query="生命周期状态写回",
            note="state 文件只读",
        )
    finally:
        os.chmod(lifecycle.state_path, 0o644)
        os.chmod(lifecycle.lifecycle_dir, 0o755)

    assert result["success"] is False
    assert result["persisted"] is False
    assert result["last_io_error"]["path"].endswith("state.json")


def test_weibull_decay_decreases_and_access_boosts():
    decay = WeibullDecay()
    created_at = datetime.utcnow() - timedelta(days=40)
    low_access = decay.calculate_decay(
        tier=MemoryTier.WORKING,
        created_at=created_at,
        access_count=0,
    )
    high_access = decay.calculate_decay(
        tier=MemoryTier.WORKING,
        created_at=created_at,
        access_count=20,
    )
    newer = decay.calculate_decay(
        tier=MemoryTier.WORKING,
        created_at=datetime.utcnow() - timedelta(days=5),
        access_count=0,
    )
    assert newer >= low_access
    assert high_access >= low_access


def test_store_writes_commit_hash_when_memory_dir_is_in_git_repo():
    repo_root = Path(__file__).parent.parent
    with tempfile.TemporaryDirectory(dir=repo_root) as temp_dir:
        memory = HKTMv5(memory_dir=temp_dir, llm_provider="zhipu")
        memory.layers.vector_store = SimpleNamespace(add=lambda **kwargs: True)
        stored = memory.store(
            content="git repo provenance check",
            title="repo provenance",
            topic="tests",
            layer="L2",
        )
        manifest = memory.layers.lifecycle.get_memory(stored["L2"])
        commit_hash = manifest["metadata"].get("commit_hash")
        assert isinstance(commit_hash, str)
        assert re.match(r"^[0-9a-f]{40}$", commit_hash)


def test_store_non_git_repo_does_not_fail_and_commit_hash_is_null(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    memory.layers.vector_store = SimpleNamespace(add=lambda **kwargs: True)
    stored = memory.store(
        content="non git provenance check",
        title="non git provenance",
        topic="tests",
        layer="L2",
    )
    manifest = memory.layers.lifecycle.get_memory(stored["L2"])
    assert manifest["metadata"].get("commit_hash") is None
    assert manifest["metadata"].get("provenance_diagnostic")


def test_ingest_artifact_is_idempotent_and_source_distinguishable(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    memory.layers.vector_store = SimpleNamespace(add=lambda **kwargs: True)

    spec_path = tmp_path / "spec.md"
    spec_path.write_text("# OpenSpec Spec\nREST API required.\n", encoding="utf-8")
    governed = memory.ingest_artifact(
        content=spec_path.read_text(encoding="utf-8"),
        source_mode="governed",
        artifact_type="spec",
        title="OpenSpec spec",
        source_uri=str(spec_path),
        artifact_id="openspec-spec-1",
    )
    governed_duplicate = memory.ingest_artifact(
        content=spec_path.read_text(encoding="utf-8"),
        source_mode="governed",
        artifact_type="spec",
        title="OpenSpec spec",
        source_uri=str(spec_path),
        artifact_id="openspec-spec-1",
    )
    compound = memory.ingest_artifact(
        content="Implementation summary: GraphQL gateway selected.",
        source_mode="compound",
        artifact_type="implementation",
        title="Compound closeout",
        source_uri="https://example.com/pr/1",
        artifact_id="compound-closeout-1",
    )

    assert governed["deduplicated"] is False
    assert governed_duplicate["deduplicated"] is True
    assert compound["deduplicated"] is False

    source_modes = {
        item.get("metadata", {}).get("source_mode")
        for item in memory.layers.lifecycle._manifest.values()
        if item.get("metadata", {}).get("source_mode")
    }
    assert "governed" in source_modes
    assert "compound" in source_modes


def test_conflict_scan_generates_stable_report_with_provenance_fields(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    memory.layers.vector_store = SimpleNamespace(add=lambda **kwargs: True)

    memory.ingest_artifact(
        content="建议采用 REST API 提供对外服务。",
        source_mode="governed",
        artifact_type="decision",
        title="API 决策 A",
        artifact_id="decision-a",
    )
    memory.ingest_artifact(
        content="建议采用 GraphQL 统一网关。",
        source_mode="compound",
        artifact_type="decision",
        title="API 决策 B",
        artifact_id="decision-b",
    )

    first = memory.conflict_scan()
    second = memory.conflict_scan()
    report_path = Path(first["report_path"])
    text = report_path.read_text(encoding="utf-8")

    assert first["success"] is True
    assert second["success"] is True
    assert first["conflict_count"] >= 1
    assert first["conflicts"] == second["conflicts"]
    assert "commit_hash=" in text
    assert "pr_id=" in text
