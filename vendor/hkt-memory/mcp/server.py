"""
MCP Server for HKT-Memory v5

Supports Model Context Protocol for integration with Claude, Cursor, etc.
"""

import json
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path

from .tools import MemoryTools


class MemoryMCPServer:
    """
    HKT-Memory MCP Server
    
    Provides 9 MCP tools for memory management.
    """
    
    def __init__(self, memory_dir: str = "memory"):
        self.memory_dir = Path(memory_dir)
        self.tools = MemoryTools(self.memory_dir)
        self._running = False
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle MCP request

        Supports both flat format {"tool": ..., "params": ...}
        and JSON-RPC 2.0 format {"jsonrpc": "2.0", "method": "tools/call", ...}.
        """
        # Detect JSON-RPC 2.0 wrapper
        is_jsonrpc = request.get("jsonrpc") == "2.0"
        rpc_id = request.get("id") if is_jsonrpc else None

        if is_jsonrpc and request.get("method") == "tools/call":
            call_params = request.get("params", {})
            tool_name = call_params.get("name")
            params = call_params.get("arguments", {})
        else:
            tool_name = request.get("tool")
            params = request.get("params", {})

        # Tool routing
        tool_map = {
            "memory_recall": self.tools.memory_recall,
            "memory_store": self.tools.memory_store,
            "memory_forget": self.tools.memory_forget,
            "memory_restore": self.tools.memory_restore,
            "memory_update": self.tools.memory_update,
            "memory_pin": self.tools.memory_pin,
            "memory_importance": self.tools.memory_importance,
            "memory_feedback": self.tools.memory_feedback,
            "memory_cleanup": self.tools.memory_cleanup,
            "memory_rebuild": self.tools.memory_rebuild,
            "memory_stats": self.tools.memory_stats,
            "memory_list": self.tools.memory_list,
            "self_improvement_log": self.tools.self_improvement_log,
            "self_improvement_extract_skill": self.tools.self_improvement_extract_skill,
            "self_improvement_review": self.tools.self_improvement_review,
        }

        if tool_name not in tool_map:
            error_resp = {
                "success": False,
                "error": f"Unknown tool: {tool_name}",
                "available_tools": list(tool_map.keys())
            }
            return self._wrap_jsonrpc(error_resp, rpc_id) if is_jsonrpc else error_resp

        try:
            result = tool_map[tool_name](**params)
            success_resp = {
                "success": True,
                "tool": tool_name,
                "result": result
            }
            return self._wrap_jsonrpc(success_resp, rpc_id) if is_jsonrpc else success_resp
        except Exception as e:
            error_resp = {
                "success": False,
                "tool": tool_name,
                "error": str(e)
            }
            return self._wrap_jsonrpc(error_resp, rpc_id) if is_jsonrpc else error_resp

    @staticmethod
    def _wrap_jsonrpc(result: Dict[str, Any], rpc_id: Any) -> Dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": result,
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """Get server capabilities"""
        return {
            "name": "HKT-Memory v5",
            "version": "5.1.0",
            "tools": [
                {
                    "name": "memory_recall",
                    "description": "Recall relevant memories based on query",
                    "parameters": {
                        "query": {"type": "string", "required": True},
                        "layer": {"type": "string", "default": "all"},
                        "limit": {"type": "integer", "default": 5}
                    }
                },
                {
                    "name": "memory_store",
                    "description": "Store new memory",
                    "parameters": {
                        "content": {"type": "string", "required": True},
                        "title": {"type": "string", "default": ""},
                        "layer": {"type": "string", "default": "all"},
                        "topic": {"type": "string", "default": "general"},
                        "importance": {"type": "string", "default": "medium"},
                        "pinned": {"type": "boolean", "default": False}
                    }
                },
                {
                    "name": "memory_forget",
                    "description": "Soft-delete a memory (use force=true for hard delete)",
                    "parameters": {
                        "memory_id": {"type": "string", "required": True},
                        "layer": {"type": "string", "default": "L2"},
                        "force": {"type": "boolean", "default": False}
                    }
                },
                {
                    "name": "memory_restore",
                    "description": "Restore a soft-deleted (disabled) memory back to active",
                    "parameters": {
                        "memory_id": {"type": "string", "required": True}
                    }
                },
                {
                    "name": "memory_update",
                    "description": "Update existing memory (not yet implemented)",
                    "parameters": {
                        "memory_id": {"type": "string", "required": True},
                        "content": {"type": "string"},
                        "layer": {"type": "string", "default": "L2"}
                    }
                },
                {
                    "name": "memory_pin",
                    "description": "Set pinned state for a memory",
                    "parameters": {
                        "memory_id": {"type": "string", "required": True},
                        "pinned": {"type": "boolean", "default": True}
                    }
                },
                {
                    "name": "memory_importance",
                    "description": "Set importance for a memory",
                    "parameters": {
                        "memory_id": {"type": "string", "required": True},
                        "importance": {"type": "string", "required": True}
                    }
                },
                {
                    "name": "memory_feedback",
                    "description": "Record useful/wrong/missing feedback",
                    "parameters": {
                        "label": {"type": "string", "required": True},
                        "memory_id": {"type": "string"},
                        "topic": {"type": "string"},
                        "query": {"type": "string"},
                        "note": {"type": "string", "default": ""}
                    }
                },
                {
                    "name": "memory_cleanup",
                    "description": "Clean up expired lifecycle events",
                    "parameters": {
                        "dry_run": {"type": "boolean", "default": True},
                        "scope": {"type": "string"}
                    }
                },
                {
                    "name": "memory_rebuild",
                    "description": "Rebuild and compact L0/L1 aggregate files",
                    "parameters": {
                        "include_archived": {"type": "boolean", "default": False}
                    }
                },
                {
                    "name": "memory_stats",
                    "description": "Get memory statistics including lifecycle status distribution",
                    "parameters": {}
                },
                {
                    "name": "memory_list",
                    "description": "List memories",
                    "parameters": {
                        "layer": {"type": "string", "default": "L2"},
                        "topic": {"type": "string"},
                        "limit": {"type": "integer", "default": 20}
                    }
                },
                {
                    "name": "self_improvement_log",
                    "description": "Log learning or error",
                    "parameters": {
                        "log_type": {"type": "string", "required": True},
                        "content": {"type": "string", "required": True},
                        "category": {"type": "string"}
                    }
                },
                {
                    "name": "self_improvement_extract_skill",
                    "description": "Extract skill from learning",
                    "parameters": {
                        "learning_id": {"type": "string", "required": True}
                    }
                },
                {
                    "name": "self_improvement_review",
                    "description": "Review improvement status",
                    "parameters": {}
                }
            ]
        }

    def start_stdio(self):
        """Start server in stdio mode (for MCP)"""
        import sys

        self._running = True

        while self._running:
            try:
                line = sys.stdin.readline()
                if not line:
                    break

                request = json.loads(line)
                response = self.handle_request(request)

                print(json.dumps(response, ensure_ascii=False), flush=True)

            except json.JSONDecodeError as e:
                print(json.dumps({
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": f"Invalid JSON: {e}"}
                }), flush=True)
            except Exception as e:
                print(json.dumps({
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32603, "message": str(e)}
                }), flush=True)

    def start_http(self, host: str = "127.0.0.1", port: int = 8000):
        """Start HTTP server"""
        try:
            from flask import Flask, request, jsonify

            app = Flask(__name__)

            @app.route('/')
            def index():
                caps = self.get_capabilities()
                caps["endpoints"] = {
                    "POST /store": "memory_store",
                    "POST /recall": "memory_recall",
                    "POST /forget": "memory_forget",
                    "GET /stats": "memory_stats",
                    "POST /tools/<tool_name>": "Direct tool invocation",
                    "POST /mcp": "MCP JSON-RPC endpoint",
                }
                return jsonify(caps)

            @app.route('/store', methods=['POST'])
            def store_endpoint():
                params = request.get_json() or {}
                response = self.handle_request({"tool": "memory_store", "params": params})
                return jsonify(response)

            @app.route('/recall', methods=['POST'])
            def recall_endpoint():
                params = request.get_json() or {}
                response = self.handle_request({"tool": "memory_recall", "params": params})
                return jsonify(response)

            @app.route('/forget', methods=['POST'])
            def forget_endpoint():
                params = request.get_json() or {}
                response = self.handle_request({"tool": "memory_forget", "params": params})
                return jsonify(response)

            @app.route('/stats', methods=['GET'])
            def stats_endpoint():
                response = self.handle_request({"tool": "memory_stats", "params": {}})
                return jsonify(response)

            @app.route('/tools/<tool_name>', methods=['POST'])
            def call_tool(tool_name):
                params = request.get_json() or {}
                response = self.handle_request({
                    "tool": tool_name,
                    "params": params
                })
                return jsonify(response)

            @app.route('/mcp', methods=['POST'])
            def mcp_endpoint():
                req = request.get_json()
                response = self.handle_request(req)
                return jsonify(response)

            print(f"Starting HKT-Memory MCP server on {host}:{port}")
            app.run(host=host, port=port, debug=False)

        except ImportError:
            print("Flask not installed. Install with: pip install flask")
            raise


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="HKT-Memory MCP Server")
    parser.add_argument("--memory-dir", default="memory", help="Memory directory")
    parser.add_argument("--mode", choices=["stdio", "http"], default="stdio", help="Server mode")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP host")
    parser.add_argument("--port", type=int, default=8000, help="HTTP port")
    
    args = parser.parse_args()
    
    server = MemoryMCPServer(args.memory_dir)
    
    if args.mode == "stdio":
        server.start_stdio()
    else:
        server.start_http(args.host, args.port)


if __name__ == "__main__":
    main()
