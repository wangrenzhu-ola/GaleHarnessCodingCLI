# Changelog

## 5.1.0

### Highlights

- Upgraded retrieval pipeline with intent-aware routing, optional query expansion, RRF fusion, cosine re-score, and deduplication/guarantee steps.
- Reduced runtime fragility by removing hard numpy dependency from the retrieval fusion path and improving SQLite connection hygiene.

### Changes

- Added `retrieval.fusion_method` config (default: `rrf`) with automatic fallback to weighted fusion when vector search is unavailable.
- Added intent detection to bias results toward L0/L1 for entity-style queries.
- Added query expansion (LLM-backed, auto-disable when no key) for improved recall.
- Added RRF fusion and optional cosine-based re-scoring for L2 candidates.
- Added result de-duplication and compiled-truth guarantee (ensure L1 exists for topics hit in L2).
- Converted retrieval pipeline tests to standard-library `unittest` so they run without pytest.

### Housekeeping

- Ignore editor/agent artifacts: `.trae/`, `.claude/`.
