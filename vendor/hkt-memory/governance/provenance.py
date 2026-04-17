import os
import subprocess
from pathlib import Path
from typing import Dict, Optional


PR_ENV_KEYS = (
    "HKT_MEMORY_PR_ID",
    "PR_ID",
    "GITHUB_PR_NUMBER",
    "GITHUB_REF_NAME",
    "CI_MERGE_REQUEST_IID",
)


def collect_provenance(repo_path: Path) -> Dict[str, Optional[str]]:
    commit_hash: Optional[str] = None
    diagnostic: Optional[str] = None
    try:
        result = subprocess.run(
            ["git", "-C", str(repo_path), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        value = result.stdout.strip()
        if value:
            commit_hash = value
    except FileNotFoundError:
        diagnostic = "git_unavailable"
    except subprocess.CalledProcessError:
        diagnostic = "not_git_repo_or_rev_parse_failed"

    pr_id: Optional[str] = None
    for key in PR_ENV_KEYS:
        value = os.environ.get(key, "").strip()
        if value:
            pr_id = value
            break

    return {
        "commit_hash": commit_hash,
        "pr_id": pr_id,
        "provenance_diagnostic": diagnostic,
    }
