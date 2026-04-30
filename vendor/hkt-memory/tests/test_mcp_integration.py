"""
MCP 工具集成测试 — TASK-02

直接实例化 MemoryTools，无需启动真实 HTTP/stdio 服务器。
覆盖 9 个核心工具的正常路径和错误路径。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from mcp.tools import MemoryTools


def _make_tools(tmp_path: Path) -> MemoryTools:
    return MemoryTools(tmp_path / "memory")


# ---------------------------------------------------------------------------
# memory_store
# ---------------------------------------------------------------------------

def test_memory_store_success(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_store(
        content="集成测试：存储一条记忆",
        title="测试记忆",
        topic="test",
        importance="medium",
    )
    assert result["success"] is True
    assert "memory_ids" in result
    assert result["memory_ids"].get("L2") is not None


def test_memory_store_defaults_to_all_layers(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_store(
        content="张三是工程师，负责平台架构设计。该事实有效期至 2024-01-01。",
        title="张三职业信息",
        topic="people",
    )

    assert result["success"] is True
    assert result["memory_ids"].get("L2") is not None
    assert result["memory_ids"].get("L1") is not None
    assert result["memory_ids"].get("L0") is not None


def test_memory_store_empty_content(tmp_path):
    tools = _make_tools(tmp_path)
    # 空内容不应崩溃，返回 success 或结构化错误
    result = tools.memory_store(content="")
    assert "success" in result


# ---------------------------------------------------------------------------
# memory_recall
# ---------------------------------------------------------------------------

def test_memory_recall_returns_structure(tmp_path):
    tools = _make_tools(tmp_path)
    tools.memory_store(content="向量检索测试内容", title="检索测试", topic="test")

    result = tools.memory_recall(query="向量检索", layer="all", limit=5)
    assert result["success"] is True
    assert "results" in result
    assert isinstance(result["results"], list)


def test_mcp_server_store_then_recall_returns_new_memory(tmp_path):
    from mcp.server import MemoryMCPServer

    server = MemoryMCPServer(str(tmp_path / "memory"))
    store = server.handle_request({
        "tool": "memory_store",
        "params": {
            "content": "张三是工程师。该事实有效期至 2024-01-01。",
            "title": "张三职业信息",
            "topic": "people",
        },
    })
    recall = server.handle_request({
        "tool": "memory_recall",
        "params": {
            "query": "张三 工程师",
            "layer": "all",
            "limit": 5,
        },
    })

    assert store["success"] is True
    assert recall["success"] is True
    assert recall["result"]["count"] >= 1
    assert any("张三" in item.get("content", "") for item in recall["result"]["results"])


def test_mcp_server_entity_recall_uses_rule_based_triples(tmp_path):
    from mcp.server import MemoryMCPServer

    server = MemoryMCPServer(str(tmp_path / "memory"))
    store = server.handle_request({
        "tool": "memory_store",
        "params": {
            "content": "张三是工程师，负责平台架构设计。该事实有效期至 2024-01-01。",
            "title": "张三实体测试",
            "topic": "people",
        },
    })
    recall = server.handle_request({
        "tool": "memory_recall",
        "params": {
            "query": "张三",
            "entity": "张三",
            "layer": "all",
            "limit": 5,
        },
    })

    assert store["success"] is True
    assert recall["success"] is True
    assert recall["result"]["count"] >= 1
    assert server.tools.layers.entity_index.get_stats()["total_triples"] >= 1


def test_memory_recall_empty_query(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_recall(query="")
    assert "success" in result


def test_memory_session_search_recent_mode_groups_by_session(tmp_path):
    tools = _make_tools(tmp_path)
    tools.layers.store_session_transcript(
        content="先排查 memory_session_search 的 recent mode 行为",
        session_id="session-a",
        task_id="task-1",
        project="hktmemory",
        branch="feat/a",
        pr_id="101",
    )
    tools.layers.store_session_transcript(
        content="继续补 recent mode 的 MCP 返回结构",
        session_id="session-a",
        task_id="task-1",
        project="hktmemory",
        branch="feat/a",
        pr_id="101",
    )
    tools.layers.store_session_transcript(
        content="另一个会话在处理 recall orchestrator",
        session_id="session-b",
        task_id="task-2",
        project="hktmemory",
        branch="feat/b",
        pr_id="102",
    )

    result = tools.memory_session_search(query="", project="hktmemory", limit=10)
    assert result["success"] is True
    assert result["mode"] == "recent"
    assert result["count"] == 2
    session_ids = {item["session_id"] for item in result["results"]}
    assert session_ids == {"session-a", "session-b"}
    session_a = next(item for item in result["results"] if item["session_id"] == "session-a")
    assert session_a["entry_count"] == 2
    assert session_a["task_id"] == "task-1"


def test_memory_session_search_keyword_search_supports_filters(tmp_path):
    tools = _make_tools(tmp_path)
    tools.layers.store_session_transcript(
        content="修复 vector store add false 导致 recall 查不到新记忆的问题",
        session_id="session-fix",
        task_id="task-fix",
        project="hktmemory",
        branch="fix/vector-store",
        pr_id="103",
    )
    tools.layers.store_session_transcript(
        content="整理 Hermes session memory 的背景文档",
        session_id="session-docs",
        task_id="task-docs",
        project="docs",
        branch="docs/hermes",
        pr_id="104",
    )

    result = tools.memory_session_search(
        query="vector store recall",
        project="hktmemory",
        limit=10,
    )
    assert result["success"] is True
    assert result["mode"] == "search"
    assert result["count"] >= 1
    assert result["results"][0]["session_id"] == "session-fix"
    assert "vector store" in result["results"][0]["content"]


def test_memory_store_session_transcript_tool_writes_recent_searchable_entry(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_store_session_transcript(
        content="gh:work completed store-session-transcript integration with smoke tests",
        session_id="session-gale",
        task_id="task-gale",
        project="HKTMemory",
        repo_root="/repo/HKTMemory",
        branch="gcw/issue-8",
        pr_id="8",
        source="galeharness",
        source_mode="phase_completed",
        importance="high",
        metadata={"phase": "gh:work"},
    )

    assert result["success"] is True
    assert result["L2"]
    assert result["metadata"]["source"] == "galeharness"
    assert result["metadata"]["repo_root"] == "/repo/HKTMemory"
    assert result["metadata"]["importance"] == "high"
    assert result["metadata"]["compression"]["stored_chars"] <= result["metadata"]["compression"]["original_chars"]

    recent = tools.memory_session_search(query="", project="HKTMemory", limit=5)
    assert recent["success"] is True
    assert recent["count"] == 1
    assert recent["results"][0]["session_id"] == "session-gale"

    search = tools.memory_session_search(query="smoke tests", project="HKTMemory", limit=5)
    assert search["success"] is True
    assert search["count"] == 1
    assert search["results"][0]["task_id"] == "task-gale"


def test_memory_store_session_transcript_tool_deduplicates_and_compresses(tmp_path):
    tools = _make_tools(tmp_path)
    content = "important start\n" + ("noise\n" * 200) + "important end"
    first = tools.memory_store_session_transcript(
        content=content,
        session_id="session-dedupe",
        task_id="task-dedupe",
        project="HKTMemory",
        max_chars=120,
    )
    second = tools.memory_store_session_transcript(
        content=content,
        session_id="session-dedupe",
        task_id="task-dedupe",
        project="HKTMemory",
        max_chars=120,
    )

    assert first["success"] is True
    assert first["metadata"]["compression"]["truncated"] is True
    assert second["deduplicated"] is True
    assert second["existing_memory_id"] == first["L2"]


# ---------------------------------------------------------------------------
# memory_forget (soft delete semantics)
# ---------------------------------------------------------------------------

def test_memory_forget_soft_delete(tmp_path):
    tools = _make_tools(tmp_path)
    stored = tools.memory_store(content="将要被软删除的记忆", topic="test")
    memory_id = stored["memory_ids"]["L2"]

    result = tools.memory_forget(memory_id=memory_id, force=False)
    assert result["success"] is True
    assert result.get("status") == "disabled" or result.get("mode") == "soft"


def test_memory_forget_hard_delete(tmp_path):
    tools = _make_tools(tmp_path)
    stored = tools.memory_store(content="将要被硬删除的记忆", topic="test")
    memory_id = stored["memory_ids"]["L2"]

    result = tools.memory_forget(memory_id=memory_id, force=True)
    assert result["success"] is True
    assert result.get("status") == "deleted" or result.get("mode") == "hard"


def test_memory_forget_unknown_id(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_forget(memory_id="nonexistent-id-12345")
    assert result["success"] is False
    assert "error" in result


# ---------------------------------------------------------------------------
# memory_restore
# ---------------------------------------------------------------------------

def test_memory_restore(tmp_path):
    tools = _make_tools(tmp_path)
    stored = tools.memory_store(content="将被恢复的记忆", topic="test")
    memory_id = stored["memory_ids"]["L2"]

    tools.memory_forget(memory_id=memory_id, force=False)
    result = tools.memory_restore(memory_id=memory_id)
    assert result["success"] is True
    assert result.get("status") == "active"


def test_memory_restore_unknown_id(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_restore(memory_id="nonexistent-id-99999")
    assert result["success"] is False
    assert "error" in result


# ---------------------------------------------------------------------------
# memory_update (not yet implemented — must return structured error)
# ---------------------------------------------------------------------------

def test_memory_update_returns_structured_error(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_update(memory_id="any-id", content="new content")
    assert result["success"] is False
    assert "error" in result
    assert isinstance(result["error"], str)


# ---------------------------------------------------------------------------
# memory_stats (must include lifecycle status distribution)
# ---------------------------------------------------------------------------

def test_memory_stats_includes_lifecycle(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_stats()
    assert result["success"] is True
    layers = result.get("layers", {})
    lifecycle = layers.get("lifecycle", {})
    assert "statuses" in lifecycle, "lifecycle stats must include statuses"
    statuses = lifecycle["statuses"]
    for key in ("active", "disabled", "archived", "deleted"):
        assert key in statuses, f"lifecycle statuses must contain '{key}'"


# ---------------------------------------------------------------------------
# memory_cleanup
# ---------------------------------------------------------------------------

def test_memory_cleanup_dry_run(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_cleanup(dry_run=True)
    assert result["success"] is True
    assert result.get("dry_run") is True
    assert "deleted_count" in result


def test_memory_cleanup_default_is_dry_run(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.memory_cleanup()
    assert result["success"] is True
    assert result.get("dry_run") is True


# ---------------------------------------------------------------------------
# memory_list
# ---------------------------------------------------------------------------

def test_memory_list_returns_structure(tmp_path):
    tools = _make_tools(tmp_path)
    tools.memory_store(content="列表测试记忆", topic="test")
    result = tools.memory_list(layer="L2", limit=10)
    assert result["success"] is True
    assert "results" in result


# ---------------------------------------------------------------------------
# self_improvement_log
# ---------------------------------------------------------------------------

def test_self_improvement_log_learning(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.self_improvement_log(
        log_type="learning",
        content="发现了一个有用的优化策略",
        category="insight"
    )
    assert result["success"] is True
    assert "log_id" in result
    assert result["type"] == "learning"


def test_self_improvement_log_error(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.self_improvement_log(
        log_type="error",
        content="存储操作失败的错误描述",
        category="medium"
    )
    assert result["success"] is True
    assert "log_id" in result
    assert result["type"] == "error"


def test_self_improvement_log_invalid_type(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.self_improvement_log(log_type="invalid", content="test")
    assert result["success"] is False
    assert "error" in result


# ---------------------------------------------------------------------------
# self_improvement_extract_skill
# ---------------------------------------------------------------------------

def test_self_improvement_extract_skill_not_found(tmp_path):
    tools = _make_tools(tmp_path)
    result = tools.self_improvement_extract_skill(learning_id="nonexistent-learning-id")
    # 可能 success=False（未找到），也可能 success=True（返回空），关键是不抛出未捕获异常
    assert "success" in result


# ---------------------------------------------------------------------------
# MCP server capabilities version check
# ---------------------------------------------------------------------------

def test_server_capabilities_version():
    from mcp.server import MemoryMCPServer
    import tempfile, os
    with tempfile.TemporaryDirectory() as tmp:
        server = MemoryMCPServer(tmp)
        caps = server.get_capabilities()
        assert caps["name"] == "HKT-Memory v5"
        assert caps["version"] == "5.1.0"
        tool_names = {t["name"] for t in caps["tools"]}
        assert "memory_cleanup" in tool_names
        required = {
            "memory_store", "memory_recall", "memory_orchestrate_recall", "memory_session_search", "memory_forget",
            "memory_restore", "memory_stats", "memory_list",
            "self_improvement_log", "self_improvement_extract_skill",
        }
        assert required <= tool_names


def test_mcp_server_memory_session_search_tool(tmp_path):
    from mcp.server import MemoryMCPServer

    server = MemoryMCPServer(str(tmp_path / "memory"))
    server.tools.layers.store_session_transcript(
        content="之前这个问题怎么修过：先补 session transcript metadata",
        session_id="session-history",
        task_id="task-history",
        project="hktmemory",
        branch="feat/session-search",
        pr_id="105",
    )

    response = server.handle_request(
        {
            "tool": "memory_session_search",
            "params": {"query": "怎么修过", "project": "hktmemory", "limit": 5},
        }
    )

    assert response["success"] is True
    assert response["tool"] == "memory_session_search"
    assert response["result"]["success"] is True
    assert response["result"]["count"] >= 1


def test_mcp_server_memory_orchestrate_recall_tool(tmp_path):
    from mcp.server import MemoryMCPServer

    server = MemoryMCPServer(str(tmp_path / "memory"))
    server.tools.layers.store_session_transcript(
        content="上次排查这个问题时，debug 模式优先回放 transcript，再看构建日志。",
        session_id="session-orchestrator",
        task_id="task-orchestrator",
        project="hktmemory",
        branch="feat/orchestrator",
        pr_id="106",
    )

    response = server.handle_request(
        {
            "tool": "memory_orchestrate_recall",
            "params": {
                "query": "上次排查这个问题怎么做",
                "mode": "debug",
                "project": "hktmemory",
                "limit": 5,
            },
        }
    )

    assert response["success"] is True
    assert response["tool"] == "memory_orchestrate_recall"
    assert response["result"]["success"] is True
    assert response["result"]["sources"][0]["source"] == "session"
