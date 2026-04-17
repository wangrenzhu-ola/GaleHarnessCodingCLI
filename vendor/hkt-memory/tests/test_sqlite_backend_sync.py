import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.hkt_memory_v5 import HKTMv5
from vector_store.store import EmbeddingClient


def test_embedding_client_caches_repeated_queries(monkeypatch):
    calls = []

    class FakeEmbeddingsAPI:
        def create(self, input, model):
            calls.append((input, model))
            return SimpleNamespace(data=[SimpleNamespace(embedding=[0.1, 0.2, 0.3])])

    def fake_init_client(self):
        self.client = SimpleNamespace(embeddings=FakeEmbeddingsAPI())

    monkeypatch.setenv("HKT_MEMORY_API_KEY", "test-key")
    monkeypatch.setattr(EmbeddingClient, "_init_client", fake_init_client)

    client = EmbeddingClient()
    first = client.get_embedding("重复查询")
    second = client.get_embedding("重复查询")

    assert first == second
    assert len(calls) == 1


def test_sync_rebuild_index_reports_success_without_full_sync(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    memory.store(
        content="SQLite rebuild index smoke test",
        title="sqlite sync",
        topic="tools",
        layer="L2",
    )

    class FakeVectorStore:
        def rebuild_from_files(self, entries):
            return {"success": True, "added": len(entries)}

    memory.layers.vector_store = FakeVectorStore()

    result = memory.sync(full=False, rebuild_index=True)

    assert result["success"] is True
    assert result["incremental_sync"]["success"] is False
    assert result["rebuild_index"]["success"] is True
    assert result["rebuild_index"]["added"] >= 1
