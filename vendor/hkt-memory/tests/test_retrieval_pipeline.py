import asyncio
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

from retrieval.expansion import expand_query
from retrieval.intent import detect_intent
from retrieval.hybrid_fusion import fuse_rrf, cosine_rescore
from scripts.hkt_memory_v5 import HKTMv5


class TestRetrievalPipeline(unittest.TestCase):
    def test_expand_query_generates_variants(self):
        old_provider = os.environ.get("L1_EXTRACTOR_PROVIDER")
        old_key = os.environ.get("ZHIPU_API_KEY")
        os.environ["L1_EXTRACTOR_PROVIDER"] = "zhipu"
        os.environ["ZHIPU_API_KEY"] = "test-key"

        old_openai = sys.modules.get("openai")
        try:
            try:
                import openai  # type: ignore
            except Exception:
                import types

                openai = types.ModuleType("openai")
                sys.modules["openai"] = openai

            class DummyAsyncOpenAI:
                def __init__(self, *args, **kwargs):
                    self.chat = SimpleNamespace(
                        completions=SimpleNamespace(
                            create=self._create,
                        )
                    )

                async def _create(self, *args, **kwargs):
                    return SimpleNamespace(
                        choices=[
                            SimpleNamespace(
                                message=SimpleNamespace(
                                    content='["RESTful 接口评审", "API 决策会议"]'
                                )
                            )
                        ]
                    )

            setattr(openai, "AsyncOpenAI", DummyAsyncOpenAI)
            variants = asyncio.run(expand_query("API 设计", max_variants=2))
            self.assertEqual(variants[0], "API 设计")
            self.assertGreaterEqual(len(variants), 2)
        finally:
            if old_provider is None:
                os.environ.pop("L1_EXTRACTOR_PROVIDER", None)
            else:
                os.environ["L1_EXTRACTOR_PROVIDER"] = old_provider
            if old_key is None:
                os.environ.pop("ZHIPU_API_KEY", None)
            else:
                os.environ["ZHIPU_API_KEY"] = old_key
            if old_openai is None:
                sys.modules.pop("openai", None)
            else:
                sys.modules["openai"] = old_openai

    def test_intent_entity_prefers_abstract_layers(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            memory = HKTMv5(memory_dir=str(Path(tmpdir) / "memory"), llm_provider="zhipu")
            memory.store(
                content="张三 是 平台团队 工程师，负责 API 设计评审。",
                title="张三 简介",
                topic="people",
                layer="all",
            )

            results = memory.retrieve(query="who is 张三", layer="all", limit=5)
            total = sum(len(results.get(k, [])) for k in ("L0", "L1", "L2"))
            abstract = len(results.get("L0", [])) + len(results.get("L1", []))
            self.assertEqual(detect_intent("who is 张三"), "entity")
            self.assertGreater(total, 0)
            self.assertGreater(abstract / total, 0.6)

    def test_temporal_query_recalls_april_9_l2(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            memory = HKTMv5(memory_dir=str(Path(tmpdir) / "memory"), llm_provider="zhipu")
            memory.layers.vector_store = SimpleNamespace(
                add=lambda **kwargs: True,
                search=lambda *args, **kwargs: [],
            )
            entry_id = memory.store(
                content="上次 API 评审说了什么：决定采用 RESTful。",
                title="API 评审",
                topic="meetings",
                layer="L2",
            )["L2"]

            results = memory.retrieve(query="上次 API 评审说了什么", layer="L2", limit=10)
            self.assertTrue(any(item.get("id") == entry_id for item in results.get("L2", [])))

    def test_rrf_double_hit_scores_higher(self):
        vector_results = [{"id": "both"}, {"id": "vector_only"}]
        bm25_results = [{"id": "both"}, {"id": "bm25_only"}]
        fused = fuse_rrf(vector_results=vector_results, bm25_results=bm25_results, vector_lists=None, k=60)
        scores = {item["id"]: item.get("_rrf_score", 0.0) for item in fused}
        self.assertGreater(scores["both"], scores["vector_only"])
        self.assertGreater(scores["both"], scores["bm25_only"])

    def test_cosine_rescore_promotes_semantic_match(self):
        fused = [
            {"id": "a", "_rrf_score_norm": 0.4, "_embedding": [0.0, 1.0]},
            {"id": "b", "_rrf_score_norm": 0.4, "_embedding": [1.0, 0.0]},
        ]
        rescored = cosine_rescore(fused, query_embedding=[1.0, 0.0])
        self.assertEqual(rescored[0]["id"], "b")

    def test_no_api_key_falls_back_to_bm25(self):
        os.environ.pop("HKT_MEMORY_API_KEY", None)
        os.environ.pop("OPENAI_API_KEY", None)
        with tempfile.TemporaryDirectory() as tmpdir:
            memory = HKTMv5(memory_dir=str(Path(tmpdir) / "memory"), llm_provider="zhipu")
            memory.store(
                content="那个 VMware 方案包括 Dify + Harness。",
                title="VMware 方案",
                topic="tools",
                layer="L2",
            )
            results = memory.retrieve(query="VMware 方案", layer="L2", limit=5)
            self.assertIsInstance(results, dict)
            self.assertIn("L2", results)


if __name__ == "__main__":
    unittest.main()
