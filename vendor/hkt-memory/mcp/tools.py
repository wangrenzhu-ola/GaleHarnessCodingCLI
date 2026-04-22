"""
MCP Tools for HKT-Memory v5
"""

import json
from typing import Dict, List, Optional, Any
from pathlib import Path


class MemoryTools:
    """
    9 MCP Tools for memory management
    """
    
    def __init__(self, memory_dir: Path):
        self.memory_dir = Path(memory_dir)
        self._init_hkt_memory()
    
    def _init_hkt_memory(self):
        """初始化HKT-Memory核心"""
        import sys
        sys.path.insert(0, str(self.memory_dir.parent))
        from config.loader import ConfigLoader
        from governance.errors import ErrorTracker
        from governance.learnings import LearningTracker
        from layers.manager_v5 import LayerManagerV5
        from runtime.orchestrator import RecallOrchestrator, RecallRequest
        from runtime.provider import LocalMemoryProvider

        config = ConfigLoader(self.memory_dir.parent).load()
        self.layers = LayerManagerV5(self.memory_dir, config=config)
        automation_config = config.get("automation", {})
        orchestrator_config = {
            **automation_config.get("orchestrator", {}),
            "safety": automation_config.get("safety", {}),
        }
        self.provider = LocalMemoryProvider(
            self.layers,
            cache_ttl_seconds=orchestrator_config.get("prefetch_ttl_seconds", 300),
            cache_max_entries=orchestrator_config.get("prefetch_cache_entries", 32),
        )
        self.orchestrator = RecallOrchestrator(self.provider, config=orchestrator_config)
        self._recall_request_cls = RecallRequest
        self.learnings = LearningTracker(self.memory_dir / "governance")
        self.errors = ErrorTracker(self.memory_dir / "governance")
    
    def memory_recall(self, query: str, layer: str = "all", limit: int = 5, entity: str = None) -> Dict[str, Any]:
        """
        召回相关记忆
        
        Args:
            query: 查询关键词
            layer: 目标层 (L0/L1/L2/all)
            limit: 返回数量限制
        """
        try:
            kwargs = {}
            if entity:
                kwargs["entity"] = entity
            if layer == "all":
                results = self.layers.progressive_retrieve(query, limit_per_layer=limit, **kwargs)
                # 扁平化结果
                flat_results = []
                for layer_name, items in results.items():
                    if layer_name == "debug":
                        continue
                    for item in items:
                        item['layer'] = layer_name
                        flat_results.append(item)
                return {
                    "success": True,
                    "count": len(flat_results),
                    "results": flat_results[:limit]
                }
            else:
                results = self.layers.retrieve(query, layer, limit=limit, **kwargs)
                return {
                    "success": True,
                    "count": len(results),
                    "results": results
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def memory_session_search(
        self,
        query: str = "",
        limit: int = 5,
        session_id: str = None,
        task_id: str = None,
        project: str = None,
        branch: str = None,
        pr: str = None,
        pr_id: str = None,
    ) -> Dict[str, Any]:
        try:
            return self.layers.session_search(
                query=query,
                limit=limit,
                session_id=session_id,
                task_id=task_id,
                project=project,
                branch=branch,
                pr=pr,
                pr_id=pr_id,
            )
        except Exception as e:
            return {"success": False, "error": str(e)}

    def memory_orchestrate_recall(
        self,
        query: str = "",
        mode: str = "implement",
        topic: str = None,
        limit: int = 5,
        entity: str = None,
        session_id: str = None,
        task_id: str = None,
        project: str = None,
        branch: str = None,
        pr: str = None,
        pr_id: str = None,
        include_recent: bool = None,
        include_session: bool = None,
        include_long_term: bool = None,
        token_budget: int = None,
    ) -> Dict[str, Any]:
        try:
            request = self._recall_request_cls(
                query=query,
                mode=mode,
                topic=topic,
                limit=limit,
                entity=entity,
                session_id=session_id,
                task_id=task_id,
                project=project,
                branch=branch,
                pr=pr,
                pr_id=pr_id,
                include_recent=include_recent,
                include_session=include_session,
                include_long_term=include_long_term,
                token_budget=token_budget,
            )
            return self.orchestrator.orchestrate(request)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def memory_store(self, content: str, title: str = "", 
                     layer: str = "all", topic: str = "general",
                     importance: str = "medium", pinned: bool = False) -> Dict[str, Any]:
        """
        存储新记忆
        
        Args:
            content: 记忆内容
            title: 标题
            layer: 目标层
            topic: 主题
            importance: 重要性 (high/medium/low)
        """
        try:
            ids = self.layers.store(
                content=content,
                title=title,
                layer=layer,
                topic=topic,
                metadata={"importance": importance, "pinned": pinned}
            )
            return {
                "success": True,
                "memory_ids": ids
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def memory_forget(self, memory_id: str, layer: str = "L2", force: bool = False) -> Dict[str, Any]:
        """
        删除记忆
        
        Args:
            memory_id: 记忆ID
            layer: 所在层
        """
        try:
            result = self.layers.forget(memory_id=memory_id, force=force)
            return result
        except Exception as e:
            return {"success": False, "error": str(e), "memory_id": memory_id}
    
    def memory_update(self, memory_id: str, content: str = None,
                      layer: str = "L2") -> Dict[str, Any]:
        """
        更新记忆
        
        Args:
            memory_id: 记忆ID
            content: 新内容
            layer: 所在层
        """
        return {
            "success": False,
            "error": "Update operation not yet implemented in v5.0",
            "memory_id": memory_id
        }

    def memory_pin(self, memory_id: str, pinned: bool = True) -> Dict[str, Any]:
        try:
            return self.layers.set_pinned(memory_id=memory_id, pinned=pinned)
        except Exception as e:
            return {"success": False, "error": str(e), "memory_id": memory_id}

    def memory_importance(self, memory_id: str, importance: str) -> Dict[str, Any]:
        try:
            return self.layers.set_importance(memory_id=memory_id, importance=importance)
        except Exception as e:
            return {"success": False, "error": str(e), "memory_id": memory_id}

    def memory_feedback(
        self,
        label: str,
        memory_id: Optional[str] = None,
        topic: Optional[str] = None,
        query: Optional[str] = None,
        note: str = "",
    ) -> Dict[str, Any]:
        try:
            return self.layers.feedback(
                label=label,
                memory_id=memory_id,
                topic=topic,
                query=query,
                note=note,
            )
        except Exception as e:
            return {"success": False, "error": str(e), "memory_id": memory_id, "label": label}

    def memory_restore(self, memory_id: str) -> Dict[str, Any]:
        """
        恢复软删除的记忆（disabled → active）

        Args:
            memory_id: 记忆ID
        """
        try:
            result = self.layers.restore(memory_id=memory_id)
            return result
        except Exception as e:
            return {"success": False, "error": str(e), "memory_id": memory_id}

    def memory_cleanup(self, dry_run: bool = True, scope: Optional[str] = None) -> Dict[str, Any]:
        """
        清理过期事件日志

        Args:
            dry_run: 仅预览，不实际删除（默认 True）
            scope: 可选 scope 过滤
        """
        try:
            return self.layers.cleanup(dry_run=dry_run, scope=scope)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def memory_rebuild(self, include_archived: bool = False) -> Dict[str, Any]:
        try:
            return self.layers.rebuild_aggregates(include_archived=include_archived)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def memory_stats(self) -> Dict[str, Any]:
        """获取记忆统计信息"""
        try:
            stats = self.layers.get_stats()
            learnings_stats = self.learnings.get_stats()
            errors_stats = self.errors.get_stats()
            
            return {
                "success": True,
                "layers": stats,
                "learnings": learnings_stats,
                "errors": errors_stats
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def memory_list(self, layer: str = "L2", topic: str = None,
                   limit: int = 20) -> Dict[str, Any]:
        """
        列出记忆
        
        Args:
            layer: 目标层
            topic: 主题过滤
            limit: 数量限制
        """
        try:
            if layer == "L0":
                topics = self.layers.l0.get_topics()
                results = []
                for t in topics[:limit]:
                    results.extend(self.layers.l0.retrieve(topic=t, limit=5))
            elif layer == "L1":
                sessions = self.layers.l1.list_sessions()
                projects = self.layers.l1.list_projects()
                results = {
                    "sessions": sessions[:limit],
                    "projects": projects[:limit]
                }
            else:  # L2
                dailies = self.layers.l2.list_dailies()
                results = [{"date": d} for d in dailies[:limit]]
            
            return {
                "success": True,
                "layer": layer,
                "count": len(results) if isinstance(results, list) else "N/A",
                "results": results
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def self_improvement_log(self, log_type: str, content: str,
                            category: str = None) -> Dict[str, Any]:
        """
        记录自我改进日志
        
        Args:
            log_type: 日志类型 (learning/error)
            content: 内容
            category: 分类
        """
        try:
            if log_type == "learning":
                log_id = self.learnings.record(
                    content=content,
                    category=category or "insight"
                )
            elif log_type == "error":
                log_id = self.errors.record(
                    error_description=content,
                    severity=category or "medium"
                )
            else:
                return {"success": False, "error": f"Unknown log_type: {log_type}"}
            
            return {
                "success": True,
                "log_id": log_id,
                "type": log_type
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def self_improvement_extract_skill(self, learning_id: str) -> Dict[str, Any]:
        """
        从学习记录中提取技能
        
        Args:
            learning_id: 学习记录ID
        """
        try:
            skill = self.learnings.extract_skill(learning_id)
            return {
                "success": True,
                "learning_id": learning_id,
                "skill": skill
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def self_improvement_review(self) -> Dict[str, Any]:
        """
        审查改进状态
        """
        try:
            learnings_stats = self.learnings.get_stats()
            errors_stats = self.errors.get_stats()
            
            return {
                "success": True,
                "summary": {
                    "total_learnings": learnings_stats.get("total_learnings", 0),
                    "learnings_by_status": learnings_stats.get("by_status", {}),
                    "total_errors": errors_stats.get("total_errors", 0),
                    "errors_by_status": errors_stats.get("by_status", {})
                },
                "recommendations": [
                    "Review pending learnings and validate them",
                    "Address open errors with high severity",
                    "Extract skills from validated learnings"
                ]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
