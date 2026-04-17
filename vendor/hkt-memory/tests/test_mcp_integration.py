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
            "memory_store", "memory_recall", "memory_forget",
            "memory_restore", "memory_stats", "memory_list",
            "self_improvement_log", "self_improvement_extract_skill",
        }
        assert required <= tool_names
