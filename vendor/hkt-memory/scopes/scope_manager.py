"""
Multi-Scope Memory Isolation

多作用域记忆隔离管理器

支持的作用域:
- global: 全局共享记忆
- agent:<id>: Agent私有记忆
- project:<id>: 项目级记忆
- user:<id>: 用户级记忆
- session:<id>: 会话级记忆
"""

import re
from enum import Enum
from typing import List, Dict, Optional, Any, Set
from dataclasses import dataclass, field


class ScopeType(Enum):
    """作用域类型"""
    GLOBAL = "global"
    AGENT = "agent"
    PROJECT = "project"
    USER = "user"
    SESSION = "session"
    CUSTOM = "custom"


@dataclass
class Scope:
    """作用域定义"""
    type: ScopeType
    id: str
    description: str = ""
    parent: Optional[str] = None
    
    @property
    def full_name(self) -> str:
        """获取完整作用域名"""
        if self.type == ScopeType.GLOBAL:
            return "global"
        return f"{self.type.value}:{self.id}"
    
    @classmethod
    def from_string(cls, scope_str: str) -> "Scope":
        """从字符串解析作用域"""
        if scope_str == "global":
            return cls(type=ScopeType.GLOBAL, id="global")
        
        parts = scope_str.split(":", 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid scope format: {scope_str}")
        
        scope_type = ScopeType(parts[0])
        return cls(type=scope_type, id=parts[1])


@dataclass
class ScopeAccessPolicy:
    """作用域访问策略"""
    # Agent可以访问的作用域
    agent_access: Dict[str, List[str]] = field(default_factory=dict)
    # 默认作用域
    default_scopes: List[str] = field(default_factory=lambda: ["global"])
    # 是否允许跨作用域查询
    allow_cross_scope: bool = False


class ScopeManager:
    """
    多作用域管理器
    
    管理记忆的多作用域隔离和访问控制
    """
    
    def __init__(self, 
                 default_scopes: Optional[List[str]] = None,
                 policy: Optional[ScopeAccessPolicy] = None):
        """
        初始化
        
        Args:
            default_scopes: 默认激活的作用域
            policy: 访问策略配置
        """
        self.active_scopes: Set[str] = set(default_scopes or ["global"])
        self.policy = policy or ScopeAccessPolicy()
        self._scopes: Dict[str, Scope] = {}
    
    def add_scope(self, scope: Scope):
        """注册作用域"""
        self._scopes[scope.full_name] = scope
    
    def activate_scope(self, scope_str: str):
        """激活作用域到当前上下文"""
        self.active_scopes.add(scope_str)
    
    def deactivate_scope(self, scope_str: str):
        """从当前上下文移除作用域"""
        self.active_scopes.discard(scope_str)
    
    def set_scopes(self, scopes: List[str]):
        """设置当前作用域（覆盖）"""
        self.active_scopes = set(scopes)
    
    def get_active_scopes(self) -> List[str]:
        """获取当前激活的作用域"""
        return list(self.active_scopes)
    
    def can_access(self, agent_id: str, scope_str: str) -> bool:
        """
        检查Agent是否可以访问指定作用域
        
        Args:
            agent_id: Agent标识
            scope_str: 目标作用域
            
        Returns:
            是否允许访问
        """
        # 总是可以访问global
        if scope_str == "global":
            return True
        
        # 检查自己的私有作用域
        if scope_str == f"agent:{agent_id}":
            return True
        
        # 检查策略授权
        allowed = self.policy.agent_access.get(agent_id, [])
        if scope_str in allowed:
            return True
        
        # 检查是否为active scopes
        if scope_str in self.active_scopes:
            return True
        
        return False
    
    def filter_by_scope(self, 
                        results: List[Dict[str, Any]], 
                        available_scopes: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        按作用域过滤结果
        
        Args:
            results: 检索结果列表，每项需包含'scope'字段
            available_scopes: 可访问的作用域列表（默认使用active_scopes）
            
        Returns:
            过滤后的结果
        """
        scopes = available_scopes or list(self.active_scopes)
        
        filtered = []
        for result in results:
            metadata = result.get('metadata') or {}
            result_scope = result.get('scope') or metadata.get('scope') or 'global'
            
            # 检查是否在允许的作用域中
            if result_scope in scopes:
                filtered.append(result)
            # 或者是否匹配通配符
            elif self._scope_match(result_scope, scopes):
                filtered.append(result)
        
        return filtered
    
    def _scope_match(self, scope: str, allowed_scopes: List[str]) -> bool:
        """检查作用域是否匹配允许列表（支持通配符）"""
        for allowed in allowed_scopes:
            # 精确匹配
            if scope == allowed:
                return True
            # 通配符匹配 (agent:*)
            if allowed.endswith(":*"):
                prefix = allowed[:-1]
                if scope.startswith(prefix):
                    return True
        return False
    
    def create_agent_scope(self, agent_id: str, description: str = "") -> Scope:
        """创建Agent私有作用域"""
        scope = Scope(
            type=ScopeType.AGENT,
            id=agent_id,
            description=description or f"Agent {agent_id} private memory"
        )
        self.add_scope(scope)
        return scope
    
    def create_project_scope(self, project_id: str, 
                             description: str = "",
                             parent: Optional[str] = None) -> Scope:
        """创建项目作用域"""
        scope = Scope(
            type=ScopeType.PROJECT,
            id=project_id,
            description=description or f"Project {project_id} memory",
            parent=parent
        )
        self.add_scope(scope)
        return scope
    
    def get_scope_hierarchy(self, scope_str: str) -> List[str]:
        """
        获取作用域层级链
        
        例如: project:abc → [project:abc, global]
        """
        hierarchy = [scope_str]
        
        scope = self._scopes.get(scope_str)
        if scope and scope.parent:
            hierarchy.extend(self.get_scope_hierarchy(scope.parent))
        elif scope_str != "global":
            hierarchy.append("global")
        
        return hierarchy
    
    def parse_scope_from_context(self, 
                                 agent_id: Optional[str] = None,
                                 project_id: Optional[str] = None,
                                 user_id: Optional[str] = None,
                                 session_id: Optional[str] = None) -> List[str]:
        """
        从上下文解析作用域
        
        根据提供的ID自动构建作用域列表
        """
        scopes = ["global"]  # 默认包含global
        
        if agent_id:
            scopes.append(f"agent:{agent_id}")
        
        if project_id:
            scopes.append(f"project:{project_id}")
        
        if user_id:
            scopes.append(f"user:{user_id}")
        
        if session_id:
            scopes.append(f"session:{session_id}")
        
        return scopes
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            'active_scopes': list(self.active_scopes),
            'total_registered_scopes': len(self._scopes),
            'registered_scopes': [
                {
                    'name': s.full_name,
                    'type': s.type.value,
                    'description': s.description
                }
                for s in self._scopes.values()
            ]
        }


# 便捷函数
def parse_scope(scope_str: str) -> Scope:
    """解析作用域字符串"""
    return Scope.from_string(scope_str)


def is_valid_scope(scope_str: str) -> bool:
    """检查作用域格式是否有效"""
    try:
        parse_scope(scope_str)
        return True
    except (ValueError, KeyError):
        return False
