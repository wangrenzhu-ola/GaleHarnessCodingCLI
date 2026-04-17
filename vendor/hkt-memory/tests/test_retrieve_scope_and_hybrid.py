#!/usr/bin/env python3

import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent.parent))

from scopes import ScopeManager
from retrieval import HybridFusion
from scripts.hkt_memory_v4 import HKTMv4


def test_scope_filter_reads_scope_from_metadata():
    manager = ScopeManager()
    results = [
        {"id": "a", "metadata": {"scope": "project:MetaClaw"}, "score": 0.9},
        {"id": "b", "metadata": {"scope": "agent:zhubiao"}, "score": 0.8},
        {"id": "c", "scope": "global", "score": 0.7},
    ]
    filtered = manager.filter_by_scope(results, ["project:MetaClaw"])
    assert [item["id"] for item in filtered] == ["a"]


def test_hybrid_retrieve_hits_scope_and_merges_vector_bm25():
    memory = HKTMv4.__new__(HKTMv4)
    vector_results = [
        {
            "id": "doc_shared",
            "content": "MetaClaw 项目 memory search 根因分析",
            "score": 0.91,
            "metadata": {"scope": "project:MetaClaw"},
            "layer": "L2",
            "access_count": 0,
        },
        {
            "id": "doc_other",
            "content": "其他项目文档",
            "score": 0.88,
            "metadata": {"scope": "project:Other"},
            "layer": "L2",
            "access_count": 0,
        },
    ]
    bm25_results = [
        {
            "id": "doc_shared",
            "content": "MetaClaw memory search scope",
            "score": 0.95,
            "metadata": {"scope": "project:MetaClaw"},
            "scope": "project:MetaClaw",
            "layer": "L2",
        }
    ]

    memory.layers = SimpleNamespace(
        vector_store=SimpleNamespace(search=lambda **kwargs: vector_results),
        progressive_retrieve=lambda query, limit: {"L0": [], "L1": [], "L2": []},
        retrieve=lambda query, layer, limit, use_vector=False: [],
    )
    memory.bm25_index = SimpleNamespace(search=lambda **kwargs: bm25_results)
    memory.hybrid_fusion = HybridFusion()
    memory.adaptive_retriever = SimpleNamespace(
        should_retrieve=lambda query: (True, "query requires memory lookup", {})
    )
    memory.scope_manager = ScopeManager()
    memory.mmr_diversifier = SimpleNamespace(simple_diversify=lambda results, threshold: results)
    memory.reranker = None
    memory.tier_manager = SimpleNamespace(record_access=lambda mem_id: None)
    memory._apply_lifecycle_boost = lambda results: results

    results = memory.retrieve(
        query="memory search 根因",
        limit=5,
        retrieval_mode="hybrid",
        adaptive=False,
        apply_mmr=False,
        rerank=False,
        scopes=["project:MetaClaw"],
        min_score=0.0,
    )

    assert len(results) == 1
    assert results[0]["id"] == "doc_shared"
    assert results[0]["vector_score"] > 0
    assert results[0]["bm25_score"] > 0
    assert results[0]["scope"] == "project:MetaClaw"
