#!/usr/bin/env python3

import argparse
import json
import re
import sys
from pathlib import Path

PATH_METADATA_PREFIXES = (
    "diff --git ",
    "--- a/",
    "--- b/",
    "+++ a/",
    "+++ b/",
    "rename from ",
    "rename to ",
    "copy from ",
    "copy to ",
)


def load_rules(rules_path: Path) -> dict:
    try:
        return json.loads(rules_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"Rules file not found: {rules_path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Rules file is not valid JSON: {rules_path}: {exc}") from exc


def apply_replacements(text: str, replacements: list[dict]) -> tuple[str, int]:
    total = 0
    result = text
    # Sort non-regex replacements by length descending
    sorted_replacements = sorted(
        [r for r in replacements if not r.get("regex")], 
        key=lambda item: len(item["from"]), 
        reverse=True
    ) + [r for r in replacements if r.get("regex")]

    for rule in sorted_replacements:
        if rule.get("regex"):
            pattern = re.compile(rule["from"])
            matches = len(pattern.findall(result))
            if matches:
                result = pattern.sub(rule["to"], result)
                total += matches
        else:
            count = result.count(rule["from"])
            if count:
                result = result.replace(rule["from"], rule["to"])
                total += count
    return result, total


def split_patch_sections(text: str) -> tuple[list[str], list[str]]:
    """
    Splits the patch into preamble (commit message + diffstat) and body (the diff itself).
    Using `diff --git ` as the reliable delimiter for the start of the diff.
    """
    lines = text.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if line.startswith("diff --git "):
            return lines[:index], lines[index:]
    
    # Fallback if no diff --git is found (e.g. empty commit or weird patch)
    return [], lines


def adapt_patch_text(text: str, rules: dict) -> tuple[str, list[str]]:
    preamble, body = split_patch_sections(text)
    warnings: list[str] = []
    path_replacements = rules.get("path_prefix_replacements", [])
    text_replacements = rules.get("text_replacements", [])

    if "GIT binary patch" in text or "Binary files " in text:
        warnings.append(
            "Detected binary patch content; leaving binary hunks untouched and only adapting text paths."
        )

    adapted_preamble: list[str] = []
    for line in preamble:
        updated = line
        # Diffstat path replacements
        if "|" in updated and "file changed" not in updated:
            updated, _ = apply_replacements(updated, path_replacements)
        
        # General text replacements in commit message and diffstat
        updated, _ = apply_replacements(updated, text_replacements)
        adapted_preamble.append(updated)

    adapted_body: list[str] = []
    path_hits = 0
    text_hits = 0

    for line in body:
        updated = line

        if updated.startswith(PATH_METADATA_PREFIXES):
            updated, count = apply_replacements(updated, path_replacements)
            path_hits += count

        # Avoid replacing inside binary patch payloads or index lines
        if "GIT binary patch" not in updated and not updated.startswith("index "):
            updated, count = apply_replacements(updated, text_replacements)
            text_hits += count

        adapted_body.append(updated)

    if path_hits == 0:
        warnings.append("No path prefix replacements were applied.")
    if text_hits == 0:
        warnings.append("No namespace/text replacements were applied.")

    adapted_text = "".join(adapted_preamble + adapted_body)
    for token in rules.get("warn_on_tokens", []):
        if token and token in adapted_text:
            warnings.append(f"Leftover token detected after adaptation: {token}")

    return adapted_text, warnings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mechanically adapt upstream format-patch output for GaleHarnessCLI."
    )
    parser.add_argument("--input", required=True, help="Input raw patch path")
    parser.add_argument("--output", required=True, help="Output adapted patch path")
    parser.add_argument(
        "--rules",
        default=str(Path(__file__).with_name("rename-rules.json")),
        help="Path to rename rules JSON",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    rules_path = Path(args.rules)

    if not input_path.is_file():
        raise SystemExit(f"Input patch not found: {input_path}")

    raw_text = input_path.read_text(encoding="utf-8")
    rules = load_rules(rules_path)
    adapted_text, warnings = adapt_patch_text(raw_text, rules)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(adapted_text, encoding="utf-8")

    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())