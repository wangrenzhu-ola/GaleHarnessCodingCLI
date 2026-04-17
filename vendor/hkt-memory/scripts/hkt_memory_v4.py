#!/usr/bin/env python3

from scripts.hkt_memory_v5 import HKTMv5, main


class HKTMv4(HKTMv5):
    """v4 compatibility shim backed by the v5 implementation."""

    def retrieve(
        self,
        query: str,
        limit: int = 10,
        retrieval_mode: str = "vector",
        adaptive: bool = True,
        apply_mmr: bool = True,
        rerank: bool = False,
        scopes=None,
        min_score: float = 0.35,
        **_,
    ):
        scopes = scopes or ["global"]

        if adaptive and hasattr(self, "adaptive_retriever"):
            should_retrieve, _, _ = self.adaptive_retriever.should_retrieve(query)
            if not should_retrieve:
                return []

        if retrieval_mode == "hybrid":
            vector_results = self.layers.vector_store.search(
                query=query,
                top_k=limit,
                scopes=scopes,
            )
            bm25_results = self.bm25_index.search(
                query=query,
                top_k=limit,
                scopes=scopes,
            )
            results = self.hybrid_fusion.fuse(vector_results, bm25_results, query=query)
        else:
            results = self.layers.vector_store.search(
                query=query,
                top_k=limit,
                scopes=scopes,
            )

        results = self.scope_manager.filter_by_scope(results, scopes)
        results = [item for item in results if item.get("score", 0) >= min_score]
        results = [
            {
                **item,
                "scope": item.get("scope") or (item.get("metadata") or {}).get("scope") or "global",
            }
            for item in results
        ]

        if apply_mmr and hasattr(self, "mmr_diversifier"):
            results = self.mmr_diversifier.simple_diversify(results, threshold=0.85)

        if hasattr(self, "_apply_lifecycle_boost"):
            results = self._apply_lifecycle_boost(results)

        return results[:limit]


if __name__ == "__main__":
    main()
