import json
import os
import subprocess
import sys
from pathlib import Path

from runtime.root import resolve_memory_root
from scripts.hkt_memory_v5 import HKTMv5


def test_resolve_memory_root_prefers_explicit_over_env(monkeypatch, tmp_path):
    monkeypatch.setenv("HKT_MEMORY_ROOT", str(tmp_path / "env-root"))

    resolved = resolve_memory_root(str(tmp_path / "explicit-root"), cwd=tmp_path)

    assert resolved["path"] == tmp_path / "explicit-root"
    assert resolved["source"] == "explicit"


def test_resolve_memory_root_supports_public_root(monkeypatch, tmp_path):
    monkeypatch.delenv("HKT_MEMORY_ROOT", raising=False)
    monkeypatch.delenv("HKT_MEMORY_DIR", raising=False)
    monkeypatch.setenv("HKT_MEMORY_PUBLIC_ROOT", str(tmp_path / "public-memory"))

    resolved = resolve_memory_root(cwd=tmp_path)

    assert resolved["path"] == tmp_path / "public-memory"
    assert resolved["source"] == "HKT_MEMORY_PUBLIC_ROOT"


def test_hktmv5_status_reports_root_provider_and_indexes(tmp_path):
    memory = HKTMv5(memory_dir=str(tmp_path / "memory"), llm_provider="zhipu")

    status = memory.status()

    assert status["success"] is True
    assert status["root"] == str(tmp_path / "memory")
    assert status["root_source"] == "explicit"
    assert status["provider"] == "zhipu"
    assert status["writable"] is True
    assert "l0_index" in status["indexes"]
    assert "vector_db" in status["indexes"]


def test_cli_status_json_uses_hkt_memory_root(tmp_path):
    repo_root = Path(__file__).parent.parent
    env = os.environ.copy()
    env["HKT_MEMORY_ROOT"] = str(tmp_path / "cli-root")

    result = subprocess.run(
        [
            sys.executable,
            str(repo_root / "scripts" / "hkt_memory_v5.py"),
            "status",
            "--json",
        ],
        cwd=repo_root,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload["root"] == str(tmp_path / "cli-root")
    assert payload["root_source"] == "HKT_MEMORY_ROOT"
    assert payload["provider"] == "zhipu"


def test_mcp_memory_status(tmp_path):
    from mcp.server import MemoryMCPServer

    server = MemoryMCPServer(str(tmp_path / "memory"))
    response = server.handle_request({"tool": "memory_status", "params": {}})

    assert response["success"] is True
    assert response["result"]["success"] is True
    assert response["result"]["root"] == str(tmp_path / "memory")
    assert response["result"]["root_source"] == "explicit"
