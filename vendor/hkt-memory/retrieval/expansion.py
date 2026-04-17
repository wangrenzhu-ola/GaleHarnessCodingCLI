import json
import os
from typing import Dict, List, Optional, Tuple


_CACHE_MAXSIZE = 128
_EXPANSION_CACHE: Dict[Tuple[str, str], List[str]] = {}


def _preferred_provider(provider: Optional[str]) -> str:
    resolved = (provider or "").strip().lower()
    if resolved:
        return resolved
    return os.getenv("L1_EXTRACTOR_PROVIDER", "zhipu").strip().lower() or "zhipu"


def _has_llm_key(provider: str) -> bool:
    if provider == "openai":
        return bool(os.getenv("OPENAI_API_KEY", "").strip())
    if provider == "zhipu":
        return bool(os.getenv("ZHIPU_API_KEY", "").strip())
    if provider == "minimax":
        return bool(os.getenv("MINIMAX_API_KEY", "").strip())
    return False


def _prompt(query: str, max_variants: int) -> str:
    variants = max(1, min(int(max_variants), 5))
    return (
        "给定用户查询，生成 {n} 个同义或不同角度的查询变体，用于向量检索。\n"
        "要求：保持原意，使用不同关键词，直接返回 JSON 数组，不要解释。\n"
        "查询：{query}"
    ).format(n=variants, query=query)


def _parse_json_array(payload: str) -> List[str]:
    raw = (payload or "").strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1] if raw.count("```") >= 2 else raw.strip("`")
    raw = raw.strip()
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(item).strip() for item in data if str(item).strip()]
    except Exception:
        pass
    start = raw.find("[")
    end = raw.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(raw[start : end + 1])
            if isinstance(data, list):
                return [str(item).strip() for item in data if str(item).strip()]
        except Exception:
            return []
    return []


async def expand_query(query: str, max_variants: int = 2) -> List[str]:
    base = (query or "").strip()
    if not base:
        return [""]
    if len(base) < 5:
        return [base]

    provider = _preferred_provider(None)
    if not _has_llm_key(provider):
        return [base]

    cache_key = (base, provider)
    cached = _EXPANSION_CACHE.get(cache_key)
    if cached:
        return list(cached)[: 1 + max(0, int(max_variants))]

    try:
        from openai import AsyncOpenAI

        if provider == "zhipu":
            client = AsyncOpenAI(
                api_key=os.getenv("ZHIPU_API_KEY"),
                base_url="https://open.bigmodel.cn/api/paas/v4",
                timeout=30.0,
            )
            model = os.getenv("HKT_MEMORY_EXPANSION_MODEL", "glm-4-flash")
        elif provider == "openai":
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=30.0)
            model = os.getenv("HKT_MEMORY_EXPANSION_MODEL", "gpt-4o-mini")
        elif provider == "minimax":
            client = AsyncOpenAI(
                api_key=os.getenv("MINIMAX_API_KEY"),
                base_url=os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.chat/v1"),
                timeout=30.0,
            )
            model = os.getenv("HKT_MEMORY_EXPANSION_MODEL", "MiniMax-Text-01")
        else:
            return [base]

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是一个查询改写助手。"},
                {"role": "user", "content": _prompt(base, max_variants)},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        content = response.choices[0].message.content if response.choices else ""
        variants = _parse_json_array(content)
        merged: List[str] = [base]
        for item in variants:
            if item and item not in merged:
                merged.append(item)
            if len(merged) >= 1 + max(0, int(max_variants)):
                break
        _EXPANSION_CACHE[cache_key] = merged
        if len(_EXPANSION_CACHE) > _CACHE_MAXSIZE:
            first_key = next(iter(_EXPANSION_CACHE.keys()))
            _EXPANSION_CACHE.pop(first_key, None)
        return merged
    except Exception:
        return [base]
