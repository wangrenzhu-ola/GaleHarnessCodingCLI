"""
Memory safety baseline for transcript storage and prompt injection.
"""

import re
from typing import Any, Dict, List, Optional


class MemorySafetyGate:
    """Provide baseline redaction and injection blocking for memory runtime."""

    SECRET_PATTERNS = [
        ("openai_key", re.compile(r"\bsk-[A-Za-z0-9]{12,}\b")),
        ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{12,}\b")),
        ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
        ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
        (
            "bearer_token",
            re.compile(r"\bBearer\s+[A-Za-z0-9._-]{12,}\b", re.IGNORECASE),
        ),
        (
            "credential_assignment",
            re.compile(
                r"(?<![A-Za-z0-9])(api[_-]?key|access[_-]?token|token|password|passwd|secret)\s*[:=]\s*('[^']*'|\"[^\"]*\"|`[^`]*`|[^\s'\"`;,]+)",
                re.IGNORECASE,
            ),
        ),
    ]
    URL_SECRET_PATTERN = re.compile(
        r"([?&](?:token|api[_-]?key|access[_-]?token|password|secret)=)([^&#\s]+)",
        re.IGNORECASE,
    )
    HIGH_RISK_COMMAND_PATTERNS = [
        ("destructive_delete", re.compile(r"\brm\s+-rf\b", re.IGNORECASE)),
        ("pipe_to_shell", re.compile(r"\bcurl\b[^\n|]*\|\s*(?:bash|sh)\b", re.IGNORECASE)),
        ("remote_exec", re.compile(r"\bwget\b[^\n|]*\|\s*(?:bash|sh)\b", re.IGNORECASE)),
        ("disk_overwrite", re.compile(r"\bdd\s+if=", re.IGNORECASE)),
        ("filesystem_format", re.compile(r"\bmkfs(?:\.[A-Za-z0-9]+)?\b", re.IGNORECASE)),
    ]
    PROMPT_INJECTION_PATTERNS = [
        ("ignore_instructions", re.compile(r"ignore (?:all |any )?(?:previous|prior) instructions", re.IGNORECASE)),
        ("override_system_prompt", re.compile(r"(?:reveal|show|print).{0,40}(?:system prompt|developer message)", re.IGNORECASE)),
        ("follow_only_this", re.compile(r"follow only (?:these|this) instructions", re.IGNORECASE)),
        ("jailbreak_marker", re.compile(r"\b(?:jailbreak|DAN mode|developer mode)\b", re.IGNORECASE)),
    ]
    EXFILTRATION_PATTERNS = [
        ("env_dump", re.compile(r"\b(?:printenv|env|set)\b.{0,40}\b(?:api[_-]?key|token|secret|password)\b", re.IGNORECASE)),
        ("copy_credentials", re.compile(r"\b(?:upload|send|post|curl|wget)\b.{0,80}\b(?:token|secret|credential|cookie)\b", re.IGNORECASE)),
        ("fetch_sensitive_file", re.compile(r"\b(?:cat|sed|grep)\b.{0,80}\b(?:\.env|id_rsa|known_hosts|credentials)\b", re.IGNORECASE)),
    ]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = dict(config or {})
        self.enabled = bool(self.config.get("enabled", True))
        self.redaction_text = str(self.config.get("redaction_text", "[REDACTED]"))
        self.command_redaction_text = str(
            self.config.get("command_redaction_text", "[REDACTED_HIGH_RISK_COMMAND]")
        )

    def sanitize_for_storage(self, content: str) -> Dict[str, Any]:
        """Redact high-risk transcript fragments before writing to storage."""
        return self._analyze_and_redact(content, block_on_prompt_patterns=False)

    def sanitize_for_injection(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Redact or block content before it enters prompt injection."""
        analysis = self._analyze_and_redact(content, block_on_prompt_patterns=True)
        safety = dict((metadata or {}).get("safety", {}) or {})
        if safety.get("allow_injection") is False:
            analysis["allow_injection"] = False
            analysis["blocked_by"] = "stored_safety_policy"
            analysis["block_reason"] = "stored safety metadata disallows prompt injection"
        elif not analysis["allow_injection"]:
            analysis["blocked_by"] = "runtime_safety_scan"
            analysis["block_reason"] = self._build_block_reason(analysis["risks"])
        return analysis

    def summarize_for_metadata(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "allow_store": bool(analysis.get("allow_store", True)),
            "allow_injection": bool(analysis.get("allow_injection", True)),
            "allow_raw_display": bool(analysis.get("allow_raw_display", True)),
            "risks": list(analysis.get("risks", [])),
            "redactions": list(analysis.get("redactions", [])),
        }

    def _analyze_and_redact(self, content: str, block_on_prompt_patterns: bool) -> Dict[str, Any]:
        text = str(content or "")
        if not self.enabled or not text:
            return {
                "content": text,
                "allow_store": True,
                "allow_injection": True,
                "allow_raw_display": True,
                "risks": [],
                "redactions": [],
            }

        redactions: List[Dict[str, Any]] = []
        risks: List[str] = []
        sanitized = text

        for risk_name, pattern in self.SECRET_PATTERNS:
            if risk_name == "credential_assignment":
                sanitized, count = pattern.subn(
                    lambda m: f"{m.group(1)}={self.redaction_text}",
                    sanitized,
                )
            else:
                sanitized, count = pattern.subn(self.redaction_text, sanitized)
            if count:
                risks.append("secret")
                redactions.append({"type": risk_name, "count": count})

        sanitized, url_redactions = self.URL_SECRET_PATTERN.subn(r"\1" + self.redaction_text, sanitized)
        if url_redactions:
            risks.append("sensitive_url")
            redactions.append({"type": "url_query_secret", "count": url_redactions})

        for risk_name, pattern in self.HIGH_RISK_COMMAND_PATTERNS:
            sanitized, count = pattern.subn(self.command_redaction_text, sanitized)
            if count:
                risks.append("high_risk_command")
                redactions.append({"type": risk_name, "count": count})

        prompt_risks = self._collect_pattern_risks(sanitized, self.PROMPT_INJECTION_PATTERNS)
        exfil_risks = self._collect_pattern_risks(sanitized, self.EXFILTRATION_PATTERNS)
        risks.extend(prompt_risks)
        risks.extend(exfil_risks)

        unique_risks = list(dict.fromkeys(risks))
        allow_injection = not any(
            risk in unique_risks
            for risk in ("prompt_injection", "secret_exfiltration")
        )
        if block_on_prompt_patterns and prompt_risks:
            allow_injection = False
        if exfil_risks:
            allow_injection = False

        return {
            "content": sanitized,
            "allow_store": True,
            "allow_injection": allow_injection,
            "allow_raw_display": not bool(redactions) and allow_injection,
            "risks": unique_risks,
            "redactions": redactions,
        }

    def _collect_pattern_risks(
        self,
        content: str,
        patterns: List[Any],
    ) -> List[str]:
        risks: List[str] = []
        for _, pattern in patterns:
            if pattern.search(content):
                if patterns is self.PROMPT_INJECTION_PATTERNS:
                    risks.append("prompt_injection")
                else:
                    risks.append("secret_exfiltration")
        return risks

    def _build_block_reason(self, risks: List[str]) -> str:
        normalized = set(risks or [])
        if "prompt_injection" in normalized:
            return "prompt injection patterns detected"
        if "secret_exfiltration" in normalized:
            return "secret exfiltration patterns detected"
        return "memory safety gate blocked this content"
