"""
Weibull Decay Implementation

Three-tier memory lifecycle management
"""

import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any


class MemoryTier(Enum):
    CORE = "core"           # 核心记忆
    WORKING = "working"     # 工作记忆
    PERIPHERAL = "peripheral"  # 边缘记忆


@dataclass
class TierConfig:
    """层级配置"""
    beta: float          # Weibull形状参数
    floor: float         # 最小衰减值
    half_life_days: float  # 半衰期（天）
    promotion_threshold: int  # 升级阈值（访问次数）


class WeibullDecay:
    """
    Weibull衰减模型
    
    公式: score = exp(-lambda * days^beta) * access_boost
    
    其中:
    - lambda = ln(2) / half_life
    - beta: 形状参数（Core<1, Working=1, Peripheral>1）
    """
    
    TIER_CONFIGS = {
        MemoryTier.CORE: TierConfig(
            beta=0.8,
            floor=0.9,
            half_life_days=90,
            promotion_threshold=5
        ),
        MemoryTier.WORKING: TierConfig(
            beta=1.0,
            floor=0.7,
            half_life_days=30,
            promotion_threshold=3
        ),
        MemoryTier.PERIPHERAL: TierConfig(
            beta=1.3,
            floor=0.5,
            half_life_days=7,
            promotion_threshold=1
        )
    }
    
    COMPOSITE_WEIGHTS = {
        "recency": 0.4,
        "frequency": 0.3,
        "intrinsic": 0.3
    }
    
    def __init__(self):
        self.tiers = self.TIER_CONFIGS
    
    def calculate_decay(self,
                       tier: MemoryTier,
                       created_at: datetime,
                       accessed_at: Optional[datetime] = None,
                       access_count: int = 0) -> float:
        """
        计算衰减后的分数
        
        Args:
            tier: 记忆层级
            created_at: 创建时间
            accessed_at: 最后访问时间
            access_count: 访问次数
            
        Returns:
            衰减分数 (0-1)
        """
        config = self.tiers[tier]
        now = datetime.utcnow()
        
        # 计算年龄（基于创建时间或文件名日期）
        age_days = (now - created_at).total_seconds() / (24 * 3600)
        
        # 计算lambda
        lambda_val = math.log(2) / config.half_life_days
        
        # Weibull衰减
        decay = math.exp(-lambda_val * (age_days ** config.beta))
        
        # 访问增强（访问越多，衰减越慢）
        access_boost = self._access_boost(access_count)
        
        # 应用floor和boost
        score = max(config.floor, decay * access_boost)
        
        return min(1.0, score)
    
    def _access_boost(self, access_count: int) -> float:
        """
        访问增强因子
        
        访问越多，记忆越不容易衰减
        """
        if access_count == 0:
            return 1.0
        # 对数增长
        return 1.0 + math.log1p(access_count) * 0.1
    
    def calculate_composite_score(self,
                                  decay_score: float,
                                  recency_days: float,
                                  access_count: int,
                                  intrinsic_importance: float = 0.5) -> float:
        """
        计算综合分数
        
        公式: 
        score = 0.4 * recency_score + 
                0.3 * frequency_score + 
                0.3 * intrinsic_score
        
        Args:
            decay_score: 衰减分数
            recency_days: 距离现在多少天
            access_count: 访问次数
            intrinsic_importance: 内在重要性 (0-1)
            
        Returns:
            综合分数
        """
        # 新鲜度分数（越新越高）
        recency_score = math.exp(-recency_days / 30)  # 30天衰减到1/e
        
        # 频率分数（访问越多越高）
        frequency_score = min(1.0, access_count / 10)  # 10次访问达到满分
        
        # 计算综合分数
        composite = (
            self.COMPOSITE_WEIGHTS["recency"] * recency_score +
            self.COMPOSITE_WEIGHTS["frequency"] * frequency_score +
            self.COMPOSITE_WEIGHTS["intrinsic"] * intrinsic_importance
        )
        
        # 结合衰减分数
        final_score = composite * decay_score
        
        return final_score
    
    def should_promote(self,
                      current_tier: MemoryTier,
                      access_count: int,
                      composite_score: float) -> bool:
        """
        判断是否应升级层级
        
        Args:
            current_tier: 当前层级
            access_count: 访问次数
            composite_score: 综合分数
            
        Returns:
            是否应该升级
        """
        config = self.tiers[current_tier]
        
        # 访问次数达到阈值且分数高
        if access_count >= config.promotion_threshold and composite_score > 0.7:
            return True
        
        return False
    
    def should_demote(self,
                     current_tier: MemoryTier,
                     days_since_access: float,
                     decay_score: float) -> bool:
        """
        判断是否应降级层级
        
        Args:
            current_tier: 当前层级
            days_since_access: 距离上次访问天数
            decay_score: 当前衰减分数
            
        Returns:
            是否应该降级
        """
        config = self.tiers[current_tier]
        
        # 长时间未访问且衰减到接近floor
        if days_since_access > config.half_life_days * 2 and decay_score <= config.floor * 1.1:
            return True
        
        return False
    
    def get_next_tier(self, current_tier: MemoryTier, promote: bool = True) -> Optional[MemoryTier]:
        """
        获取下一层级
        
        Args:
            current_tier: 当前层级
            promote: True=升级, False=降级
            
        Returns:
            下一层级或None
        """
        tiers_order = [MemoryTier.PERIPHERAL, MemoryTier.WORKING, MemoryTier.CORE]
        
        try:
            current_idx = tiers_order.index(current_tier)
            if promote:
                if current_idx < len(tiers_order) - 1:
                    return tiers_order[current_idx + 1]
            else:
                if current_idx > 0:
                    return tiers_order[current_idx - 1]
        except ValueError:
            pass
        
        return None
    
    def format_age(self, days: float) -> str:
        """格式化年龄显示"""
        if days < 1:
            hours = days * 24
            return f"{hours:.1f}h"
        elif days < 30:
            return f"{days:.1f}d"
        elif days < 365:
            months = days / 30
            return f"{months:.1f}mo"
        else:
            years = days / 365
            return f"{years:.1f}y"
