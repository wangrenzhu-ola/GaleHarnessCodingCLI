#!/usr/bin/env python3

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class CommitMetadata:
    sha: str
    short_sha: str
    subject: str
    sequence: int
    filename: str


def run_command(cmd: list[str], cwd: Path) -> str:
    result = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        command = " ".join(cmd)
        raise RuntimeError(
            f"Command failed in {cwd}: {command}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result.stdout


def git(repo: Path, *args: str) -> str:
    return run_command(["git", *args], repo)


def sanitize_subject(subject: str) -> str:
    lowered = subject.lower()
    ascii_only = lowered.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return slug[:64] or "change"


def resolve_target_repo(value: str | None) -> Path:
    if value:
        return Path(value).resolve()
    current = Path.cwd()
    repo_root = run_command(["git", "rev-parse", "--show-toplevel"], current).strip()
    return Path(repo_root)


def resolve_upstream_repo(target_repo: Path, explicit: str | None) -> Path:
    if explicit:
        upstream_path = Path(explicit).expanduser().resolve()
    else:
        config_path = target_repo / ".upstream-repo"
        if not config_path.is_file():
            raise RuntimeError(
                "Upstream repo is not configured. Pass --upstream-repo or create .upstream-repo in the target repo root."
            )
        upstream_path = Path(config_path.read_text(encoding="utf-8").strip()).expanduser().resolve()

    if not upstream_path.is_dir() or not (upstream_path / ".git").exists():
        raise RuntimeError(
            f"Upstream repo path is invalid: {upstream_path}. Pass a valid git checkout via --upstream-repo or .upstream-repo."
        )

    return upstream_path


def load_baseline_sha(target_repo: Path) -> str:
    baseline_path = target_repo / ".upstream-ref"
    if not baseline_path.is_file():
        raise RuntimeError(f"Missing baseline file: {baseline_path}")
    sha = baseline_path.read_text(encoding="utf-8").strip()
    if not sha:
        raise RuntimeError(f"Baseline file is empty: {baseline_path}")
    return sha


def ensure_commit_exists(repo: Path, sha: str) -> None:
    git(repo, "rev-parse", "--verify", f"{sha}^{{commit}}")


def discover_commits(upstream_repo: Path, baseline_sha: str) -> list[str]:
    output = git(upstream_repo, "rev-list", "--reverse", f"{baseline_sha}..HEAD")
    commits = [line.strip() for line in output.splitlines() if line.strip()]
    return commits


def read_commit_subject(repo: Path, sha: str) -> str:
    return git(repo, "show", "-s", "--format=%s", sha).strip()


def format_patch(repo: Path, sha: str) -> str:
    return git(repo, "format-patch", "--stdout", "-1", sha)


def write_commit_range(
    batch_dir: Path,
    generated_at: str,
    upstream_repo: Path,
    baseline_sha: str,
    commits: list[CommitMetadata],
) -> None:
    start_commit = commits[0]
    end_commit = commits[-1]
    lines = [
        f"patch_dir: {batch_dir.name}",
        f"baseline_before_batch: {baseline_sha}",
        f"start_commit: {start_commit.sha}",
        f"start_subject: {start_commit.subject}",
        f"end_commit: {end_commit.sha}",
        f"end_subject: {end_commit.subject}",
        f"next_baseline_candidate: {end_commit.sha}",
        f"generated_at: {generated_at}",
        f"patch_count: {len(commits)}",
        f"upstream_repo: {upstream_repo}",
        "commits:",
    ]
    for commit in commits:
        lines.append(f"  - {commit.filename} {commit.sha} {commit.subject}")
    (batch_dir / "commit-range.txt").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def suggested_worktree_name(batch_dir: Path, commit: CommitMetadata) -> str:
    stem = commit.filename.removesuffix(".patch")
    return f"sync-{batch_dir.name}-{stem}"


def write_readme(
    batch_dir: Path,
    generated_at: str,
    baseline_sha: str,
    commits: list[CommitMetadata],
    status: str,
    failure_reason: str | None = None,
) -> None:
    end_commit = commits[-1].sha if commits else "n/a"
    lines = [
        f"# Upstream Sync Batch {batch_dir.name}",
        "",
        f"- Status: {status}",
        f"- Generated at: {generated_at}",
        f"- Patch count: {len(commits)}",
        f"- Baseline before batch: `{baseline_sha}`",
        f"- Batch end commit: `{end_commit}`",
        f"- Next baseline candidate: `{end_commit}`",
        "",
    ]

    if failure_reason:
        lines.extend(
            [
                "## Failure Summary",
                "",
                failure_reason,
                "",
            ]
        )

    lines.extend(
        [
            "## Patch Table",
            "",
            "| Seq | Upstream Commit | Subject | Raw Patch | Adapted Patch | Suggested Worktree | Status | Notes |",
            "|-----|-----------------|---------|-----------|---------------|--------------------|--------|-------|",
        ]
    )

    for commit in commits:
        lines.append(
            "| "
            f"{commit.sequence:04d} | `{commit.short_sha}` | {commit.subject} | "
            f"`raw/{commit.filename}` | `adapted/{commit.filename}` | "
            f"`{suggested_worktree_name(batch_dir, commit)}` | todo | "
            "|"
        )

    lines.extend(
        [
            "",
            "## Workflow",
            "",
            "1. Review the raw patch for upstream intent.",
            "2. Review the adapted patch for GaleHarnessCLI-specific renames.",
            "3. Create an isolated worktree from the repo root:",
            "",
            "```bash",
            "bash plugins/galeharness-cli/skills/git-worktree/scripts/worktree-manager.sh create <worktree-name>",
            "```",
            "",
            "4. Move into the worktree and apply one adapted patch at a time:",
            "",
            "```bash",
            "bash scripts/upstream-sync/apply-patch-to-worktree.sh .context/galeharness-cli/upstream-sync/"
            f"{batch_dir.name}/adapted/<patch-file>",
            "```",
            "",
            "5. Run focused tests, commit the change, and repeat for the next patch.",
            "6. After the whole batch is validated, update `.upstream-ref` manually to the `Next baseline candidate` shown above.",
            "",
            "## Notes",
            "",
            "- `raw/` preserves the exact upstream commit patch for traceability.",
            "- `adapted/` contains only mechanical GaleHarnessCLI renames; business-specific follow-up still happens manually.",
            "- Do not apply patches from the main worktree unless explicitly forced.",
            "- `next_baseline_candidate` is the commit to write into `.upstream-ref` after every patch in this batch has landed.",
            "",
        ]
    )

    (batch_dir / "README.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")


def run_adaptation(raw_patch: Path, adapted_patch: Path, rules_path: Path) -> None:
    # Use standard python3 rather than sys.executable to avoid virtualenv mismatch if run from bash
    result = subprocess.run(
        [sys.executable, str(Path(__file__).with_name("adapt-patch.py")), "--input", str(raw_patch), "--output", str(adapted_patch), "--rules", str(rules_path)],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Adaptation failed for {raw_patch.name}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate per-commit upstream sync batches under .context/galeharness-cli/upstream-sync."
    )
    parser.add_argument("--upstream-repo", help="Path to the upstream git checkout")
    parser.add_argument("--target-repo", help="Path to the target GaleHarnessCLI checkout")
    parser.add_argument("--batch-date", help="Override batch date (YYYY-MM-DD) for deterministic tests")
    parser.add_argument("--generated-at", help="Override generated_at timestamp for deterministic tests")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing batch directory for the selected date")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    target_repo = resolve_target_repo(args.target_repo)
    upstream_repo = resolve_upstream_repo(target_repo, args.upstream_repo)
    baseline_sha = load_baseline_sha(target_repo)

    ensure_commit_exists(upstream_repo, baseline_sha)
    commits = discover_commits(upstream_repo, baseline_sha)
    if not commits:
        print(f"No new upstream commits after {baseline_sha}.")
        return 0

    batch_date = args.batch_date or datetime.now().date().isoformat()
    generated_at = args.generated_at or datetime.now().astimezone().isoformat(timespec="seconds")

    batch_dir = target_repo / ".context" / "galeharness-cli" / "upstream-sync" / batch_date
    raw_dir = batch_dir / "raw"
    adapted_dir = batch_dir / "adapted"
    rules_path = Path(__file__).with_name("rename-rules.json")

    if batch_dir.exists():
        if not args.force:
            raise RuntimeError(
                f"Batch directory already exists: {batch_dir}. Re-run with --force to overwrite it."
            )
        shutil.rmtree(batch_dir)

    raw_dir.mkdir(parents=True, exist_ok=True)
    adapted_dir.mkdir(parents=True, exist_ok=True)

    exported_commits: list[CommitMetadata] = []

    try:
        for index, sha in enumerate(commits, start=1):
            subject = read_commit_subject(upstream_repo, sha)
            filename = f"{index:04d}-{sanitize_subject(subject)}.patch"
            raw_patch_path = raw_dir / filename
            adapted_patch_path = adapted_dir / filename

            raw_patch_path.write_text(format_patch(upstream_repo, sha), encoding="utf-8", newline="\n")
            run_adaptation(raw_patch_path, adapted_patch_path, rules_path)

            exported_commits.append(
                CommitMetadata(
                    sha=sha,
                    short_sha=sha[:7],
                    subject=subject,
                    sequence=index,
                    filename=filename,
                )
            )

        write_commit_range(batch_dir, generated_at, upstream_repo, baseline_sha, exported_commits)
        write_readme(batch_dir, generated_at, baseline_sha, exported_commits, status="ready")
    except Exception as exc:
        if not exported_commits:
            # If no commits were processed yet, we can't write a useful readme, just fail
            raise
        write_readme(batch_dir, generated_at, baseline_sha, exported_commits, status="incomplete", failure_reason=str(exc))
        raise

    summary = {
        "batch_dir": str(batch_dir),
        "patch_count": len(exported_commits),
        "start_commit": exported_commits[0].sha,
        "end_commit": exported_commits[-1].sha,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())