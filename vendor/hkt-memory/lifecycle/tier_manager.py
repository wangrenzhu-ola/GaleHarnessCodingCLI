"""
Tier Manager - Manages memory promotion/demotion
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from .weibull_decay import WeibullDecay, MemoryTier


class TierManager:
    """
    层级管理器
    
    管理记忆在Core/Working/Peripheral三层之间的升降级
    """
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.state_file = self.base_path / "tier_state.json"
        self.decay = WeibullDecay()
        self._load_state()
    
    def _load_state(self):
        """加载层级状态"""
        if self.state_file.exists():
            try:
                self.state = json.loads(self.state_file.read_text(encoding='utf-8'))
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Failed to load tier state: {e}")
                self.state = {}
        else:
            self.state = {}
    
    def _save_state(self):
        """保存层级状态"""
        self.state_file.write_text(
            json.dumps(self.state, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
    
    def register_memory(self,
                       memory_id: str,
                       tier: MemoryTier = MemoryTier.PERIPHERAL,
                       importance: float = 0.5):
        """
        注册新记忆
        
        Args:
            memory_id: 记忆ID
            tier: 初始层级
            importance: 内在重要性
        """
        now = datetime.utcnow().isoformat()
        
        self.state[memory_id] = {
            "tier": tier.value,
            "created_at": now,
            "last_accessed": now,
            "access_count": 0,
            "intrinsic_importance": importance,
            "promotion_history": []
        }
        
        self._save_state()
    
    def record_access(self, memory_id: str):
        """
        记录记忆访问
        
        Args:
            memory_id: 记忆ID
        """
        if memory_id not in self.state:
            return
        
        self.state[memory_id]["access_count"] += 1
        self.state[memory_id]["last_accessed"] = datetime.utcnow().isoformat()
        
        self._save_state()
    
    def evaluate_and_promote(self, memory_id: str) -> Optional[MemoryTier]:
        """
        评估并可能升级记忆
        
        Args:
            memory_id: 记忆ID
            
        Returns:
            新的层级或None（未变化）
        """
        if memory_id not in self.state:
            return None
        
        mem_state = self.state[memory_id]
        current_tier = MemoryTier(mem_state["tier"])
        
        # 计算当前衰减分数
        created_at = datetime.fromisoformat(mem_state["created_at"])
        decay_score = self.decay.calculate_decay(
            current_tier,
            created_at,
            access_count=mem_state["access_count"]
        )
        
        # 计算综合分数
        last_accessed = datetime.fromisoformat(mem_state["last_accessed"])
        recency_days = (datetime.utcnow() - last_accessed).total_seconds() / (24 * 3600)
        
        composite_score = self.decay.calculate_composite_score(
            decay_score,
            recency_days,
            mem_state["access_count"],
            mem_state["intrinsic_importance"]
        )
        
        # 判断是否升级
        if self.decay.should_promote(
            current_tier,
            mem_state["access_count"],
            composite_score
        ):
            new_tier = self.decay.get_next_tier(current_tier, promote=True)
            if new_tier:
                self._promote_memory(memory_id, new_tier)
                return new_tier
        
        return None
    
    def evaluate_and_demote(self, memory_id: str) -> Optional[MemoryTier]:
        """
        评估并可能降级记忆
        
        Args:
            memory_id: 记忆ID
            
        Returns:
            新的层级或None（未变化）
        """
        if memory_id not in self.state:
            return None
        
        mem_state = self.state[memory_id]
        current_tier = MemoryTier(mem_state["tier"])
        
        # Core层不降級
        if current_tier == MemoryTier.CORE:
            return None
        
        # 计算衰减
        created_at = datetime.fromisoformat(mem_state["created_at"])
        decay_score = self.decay.calculate_decay(
            current_tier,
            created_at,
            access_count=mem_state["access_count"]
        )
        
        last_accessed = datetime.fromisoformat(mem_state["last_accessed"])
        days_since_access = (datetime.utcnow() - last_accessed).total_seconds() / (24 * 3600)
        
        # 判断是否降级
        if self.decay.should_demote(current_tier, days_since_access, decay_score):
            new_tier = self.decay.get_next_tier(current_tier, promote=False)
            if new_tier:
                self._demote_memory(memory_id, new_tier)
                return new_tier
        
        return None
    
    def _promote_memory(self, memory_id: str, new_tier: MemoryTier):
        """升级记忆"""
        old_tier = self.state[memory_id]["tier"]
        self.state[memory_id]["tier"] = new_tier.value
        self.state[memory_id]["promotion_history"].append({
            "action": "promote",
            "from": old_tier,
            "to": new_tier.value,
            "timestamp": datetime.utcnow().isoformat()
        })
        self._save_state()
        print(f"Promoted memory {memory_id}: {old_tier} -> {new_tier.value}")
    
    def _demote_memory(self, memory_id: str, new_tier: MemoryTier):
        """降级记忆"""
        old_tier = self.state[memory_id]["tier"]
        self.state[memory_id]["tier"] = new_tier.value
        self.state[memory_id]["promotion_history"].append({
            "action": "demote",
            "from": old_tier,
            "to": new_tier.value,
            "timestamp": datetime.utcnow().isoformat()
        })
        self._save_state()
        print(f"Demoted memory {memory_id}: {old_tier} -> {new_tier.value}")
    
    def get_memory_tier(self, memory_id: str) -> Optional[MemoryTier]:
        """获取记忆的当前层级"""
        if memory_id not in self.state:
            return None
        return MemoryTier(self.state[memory_id]["tier"])
    
    def get_memory_stats(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """获取记忆统计信息"""
        if memory_id not in self.state:
            return None
        
        mem_state = self.state[memory_id]
        current_tier = MemoryTier(mem_state["tier"])
        
        # 计算当前衰减分数
        created_at = datetime.fromisoformat(mem_state["created_at"])
        decay_score = self.decay.calculate_decay(
            current_tier,
            created_at,
            access_count=mem_state["access_count"]
        )
        
        last_accessed = datetime.fromisoformat(mem_state["last_accessed"])
        recency_days = (datetime.utcnow() - last_accessed).total_seconds() / (24 * 3600)
        
        return {
            "memory_id": memory_id,
            "tier": mem_state["tier"],
            "created_at": mem_state["created_at"],
            "last_accessed": mem_state["last_accessed"],
            "access_count": mem_state["access_count"],
            "recency_days": recency_days,
            "decay_score": decay_score,
            "intrinsic_importance": mem_state["intrinsic_importance"],
            "promotion_history": mem_state["promotion_history"]
        }
    
    def run_maintenance(self) -> Dict[str, List[str]]:
        """
        运行维护任务
        
        评估所有记忆，执行必要的升降级
        
        Returns:
            维护结果
        """
        results = {
            "promoted": [],
            "demoted": [],
            "unchanged": []
        }
        
        for memory_id in self.state:
            old_tier = self.state[memory_id]["tier"]
            
            # 先尝试升级
            new_tier = self.evaluate_and_promote(memory_id)
            if new_tier:
                results["promoted"].append(f"{memory_id}: {old_tier} -> {new_tier.value}")
                continue
            
            # 再尝试降级
            new_tier = self.evaluate_and_demote(memory_id)
            if new_tier:
                results["demoted"].append(f"{memory_id}: {old_tier} -> {new_tier.value}")
                continue
            
            results["unchanged"].append(memory_id)
        
        return results
    
    def get_tier_distribution(self) -> Dict[str, int]:
        """获取层级分布统计"""
        distribution = {"core": 0, "working": 0, "peripheral": 0}
        
        for mem_state in self.state.values():
            tier = mem_state.get("tier", "peripheral")
            distribution[tier] = distribution.get(tier, 0) + 1
        
        return distribution
