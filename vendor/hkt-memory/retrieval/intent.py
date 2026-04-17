import re


def detect_intent(query: str) -> str:
    q = (query or "").strip().lower()
    if not q:
        return "general"

    entity_patterns = [
        r"\bwho\b",
        r"\bwho is\b",
        r"\bwhat is\b",
        r"\bwhat\b",
        r"谁",
        r"什么是",
        r"是什么",
        r"啥是",
        r"啥",
    ]
    temporal_patterns = [
        r"\bwhen\b",
        r"\blast time\b",
        r"\bprevious\b",
        r"什么时候",
        r"何时",
        r"上次",
        r"之前",
        r"当时",
        r"当初",
        r"历史",
        r"时间线",
    ]
    event_patterns = [
        r"\blatest\b",
        r"\brecent\b",
        r"\bnewest\b",
        r"最新",
        r"最近",
        r"近期",
        r"刚刚",
        r"刚才",
    ]

    if any(re.search(p, q) for p in entity_patterns):
        return "entity"
    if any(re.search(p, q) for p in temporal_patterns):
        return "temporal"
    if any(re.search(p, q) for p in event_patterns):
        return "event"
    return "general"
