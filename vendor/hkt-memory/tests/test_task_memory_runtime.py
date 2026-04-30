import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent.parent))

from runtime.task_memory import TaskEnvelope, metadata_audit
from scripts.hkt_memory_v5 import HKTMv5


def _make_memory(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")
    memory.layers.vector_store = SimpleNamespace(
        add=lambda **kwargs: True,
        delete=lambda *args, **kwargs: True,
        get_stats=lambda: {"enabled": False},
    )
    return memory


def _envelope(**overrides):
    payload = {
        "schema_version": "gale-task-memory.v1",
        "project": "HKTMemory",
        "repo_root": "/repo/path",
        "branch": "feature/task-memory",
        "task_id": "task-123",
        "skill": "gh:debug",
        "phase": "start",
        "mode": "debug",
        "pr_id": None,
        "issue_id": None,
        "input_summary": "Resume debugging a repeated failure",
        "artifact_type": "debug_session",
        "files": ["runtime/orchestrator.py"],
        "verification": {"status": "unknown"},
        "confidence": "unknown",
        "extensions": {
            "gale": {
                "capture_policy": ["failed_attempt", "root_cause", "verification_result"],
                "lineage_hints": {"source": "branch"},
            }
        },
    }
    payload.update(overrides)
    return payload


def test_task_envelope_normalization_preserves_core_fields():
    envelope = TaskEnvelope.from_dict(_envelope())

    assert envelope.task_id == "task-123"
    assert envelope.skill == "gh:debug"
    assert envelope.phase == "start"
    assert envelope.project == "HKTMemory"
    assert envelope.branch == "feature/task-memory"
    assert envelope.input_summary == "Resume debugging a repeated failure"
    assert envelope.artifact_type == "debug_session"
    assert envelope.files == ["runtime/orchestrator.py"]
    assert envelope.mode == "debug"


def test_metadata_audit_without_coverage_forces_advisory_trust(tmp_path):
    memory = _make_memory(tmp_path)

    audit = metadata_audit(memory.layers)

    assert audit["trust_mode"] == "advisory"
    assert audit["reason"].startswith("insufficient metadata coverage")


def test_task_recall_returns_untrusted_evidence_and_diagnostics(tmp_path):
    memory = _make_memory(tmp_path)
    capture = memory.task_capture(
        {
            **_envelope(phase="investigate"),
            "event_type": "failed_attempt",
            "summary": "Tried replaying the failing test; it still fails after cache clear.",
            "payload": {"risk": "cache invalidation hypothesis unverified"},
        }
    )

    result = memory.task_recall(_envelope(), limit=5)

    assert capture["success"] is True
    assert result["success"] is True
    assert result["trace_id"].startswith("recall-")
    assert "<untrusted-memory-evidence" in result["injectable_markdown"]
    assert result["items"][0]["source"] == "ledger"
    assert result["items"][0]["trust"] == "needs_verification"
    assert result["diagnostics"]["trust_mode"] == "advisory"


def test_task_recall_cli_stdout_is_json_only(tmp_path):
    script = Path(__file__).parent.parent / "scripts" / "hkt_memory_v5.py"
    envelope = json.dumps(_envelope(), ensure_ascii=False)

    completed = subprocess.run(
        [
            sys.executable,
            str(script),
            "--memory-dir",
            str(tmp_path / "memory"),
            "task-recall",
            "--json",
            "--envelope",
            envelope,
        ],
        text=True,
        capture_output=True,
        check=False,
    )

    assert completed.returncode == 0
    parsed = json.loads(completed.stdout)
    assert parsed["success"] is True
    assert "trace_id" in parsed


def test_task_recall_cli_malformed_envelope_returns_skipped_json(tmp_path):
    script = Path(__file__).parent.parent / "scripts" / "hkt_memory_v5.py"

    completed = subprocess.run(
        [
            sys.executable,
            str(script),
            "--memory-dir",
            str(tmp_path / "memory"),
            "task-recall",
            "--json",
            "--envelope",
            "{not-json",
        ],
        text=True,
        capture_output=True,
        check=False,
    )

    assert completed.returncode == 0
    parsed = json.loads(completed.stdout)
    assert parsed["success"] is False
    assert parsed["skipped"] is True
    assert "valid JSON" in parsed["reason"]
