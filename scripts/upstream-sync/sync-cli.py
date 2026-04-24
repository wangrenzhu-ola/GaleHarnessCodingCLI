#!/usr/bin/env python3
"""Upstream Sync CLI — 半自动化逐 commit patch 同步工作流

Usage:
    sync-cli.py init [--base BRANCH] [--force] [--dry-run]
    sync-cli.py status [--json]
    sync-cli.py next [--dry-run]
    sync-cli.py resume [--dry-run]
    sync-cli.py skip [--force-cleanup] [--reason REASON] [--dry-run]
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Exit codes
# ---------------------------------------------------------------------------
EXIT_OK = 0
EXIT_PRECONDITION = 1
EXIT_RUNTIME = 2
EXIT_STATE_CORRUPT = 3

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class CommitEntry:
    sequence: int
    sha: str
    subject: str
    raw_patch: str
    adapted_patch: str
    status: str  # pending | in_progress | awaiting_human_review | merged | failed | skipped
    worktree_path: Optional[str] = None
    branch: Optional[str] = None
    base_branch: Optional[str] = None
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    pr_head_ref: Optional[str] = None
    pr_base_ref: Optional[str] = None
    failed_at: Optional[str] = None
    failure_summary: Optional[str] = None


@dataclass
class OperationEntry:
    timestamp: str
    operation: str
    summary: str


@dataclass
class SyncState:
    schema_version: int
    main_worktree_root: str
    target_repo_root: str
    batch_dir: str
    baseline_sha: str
    target_sha: str
    base_branch: str
    remote_name: str
    github_repo: str
    current_index: int
    workflow_state: str  # uninitialized | idle | in_progress | awaiting_human_review | failed | complete
    commits: List[CommitEntry] = field(default_factory=list)
    operations: List[OperationEntry] = field(default_factory=list)


SCHEMA_VERSION = 1
MAX_OPERATIONS = 50
MAX_OUTPUT_CHARS = 500

REDACT_PATTERNS = ["GH_TOKEN", "GITHUB_TOKEN", "Authorization", "x-access-token"]


# ---------------------------------------------------------------------------
# Utility: safe command runner
# ---------------------------------------------------------------------------

def _configure_stdio() -> None:
    """Force UTF-8 console output on Windows and other non-UTF-8 locales."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


_configure_stdio()


def _redact_text(text: str, extra_patterns: Optional[List[str]] = None) -> str:
    """Remove sensitive tokens from text."""
    result = text
    patterns = list(REDACT_PATTERNS)
    if extra_patterns:
        patterns.extend(extra_patterns)
    for pat in patterns:
        env_val = os.environ.get(pat, "")
        if env_val:
            result = result.replace(env_val, f"<{pat}-REDACTED>")
    # Redact basic-auth in URLs: https://user:pass@host -> https://***:***@host
    result = re.sub(r"(https?://)([^@/]+):([^@/]+)@", r"\1***:***@", result)
    return result


def _truncate(text: str, max_chars: int = MAX_OUTPUT_CHARS) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + f"\n... (truncated, {len(text)} chars total)"


def run_cmd(
    argv: List[str],
    cwd: Path,
    *,
    dry_run: bool = False,
    capture: bool = True,
    redact_patterns: Optional[List[str]] = None,
) -> subprocess.CompletedProcess:
    """Execute an external command safely with argv array, shell=False."""
    resolved_cwd = cwd.resolve()
    if not resolved_cwd.is_dir():
        raise RuntimeError(f"工作目录不存在: {resolved_cwd}")

    if dry_run:
        cmd_str = " ".join(argv)
        print(f"[dry-run] 将执行: {cmd_str}", file=sys.stderr)
        print(f"[dry-run] 工作目录: {resolved_cwd}", file=sys.stderr)
        return subprocess.CompletedProcess(argv, 0, stdout="", stderr="")

    result = subprocess.run(
        argv,
        cwd=str(resolved_cwd),
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=capture,
        check=False,
    )
    return result


def run_cmd_checked(
    argv: List[str],
    cwd: Path,
    *,
    dry_run: bool = False,
    stage: str = "",
    redact_patterns: Optional[List[str]] = None,
) -> subprocess.CompletedProcess:
    """Run command and raise on failure with stage context."""
    result = run_cmd(argv, cwd, dry_run=dry_run, redact_patterns=redact_patterns)
    if result.returncode != 0 and not dry_run:
        stdout_safe = _redact_text(_truncate(result.stdout or ""), redact_patterns)
        stderr_safe = _redact_text(_truncate(result.stderr or ""), redact_patterns)
        msg = f"命令失败 (阶段: {stage}): {' '.join(argv)}\nstdout:\n{stdout_safe}\nstderr:\n{stderr_safe}"
        raise RuntimeError(msg)
    return result


# ---------------------------------------------------------------------------
# Utility: main worktree root resolution
# ---------------------------------------------------------------------------

def resolve_main_worktree_root() -> Path:
    """Resolve the main worktree root via git worktree list --porcelain."""
    result = subprocess.run(
        ["git", "worktree", "list", "--porcelain"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    if result.returncode != 0:
        # Fallback: use git-common-dir
        result2 = subprocess.run(
            ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
        )
        if result2.returncode != 0:
            raise RuntimeError("无法解析 git 仓库信息，请在 git 仓库内运行。")
        common_dir = Path(result2.stdout.strip())
        return common_dir.parent.resolve()

    # Parse porcelain output: first "worktree" line is the main worktree
    for line in result.stdout.splitlines():
        if line.startswith("worktree "):
            return Path(line.split(" ", 1)[1]).resolve()
    raise RuntimeError("无法从 git worktree list 解析 main worktree。")


def resolve_github_repo(remote_name: str, cwd: Path) -> str:
    """Resolve owner/repo from git remote URL."""
    result = run_cmd_checked(
        ["git", "remote", "get-url", remote_name], cwd, stage="resolve_github_repo",
    )
    url = result.stdout.strip()
    # SSH: git@github.com:owner/repo.git
    m = re.match(r"git@github\.com:(.+?)(?:\.git)?$", url)
    if m:
        return m.group(1)
    # HTTPS: https://github.com/owner/repo.git
    m = re.match(r"https?://github\.com/(.+?)(?:\.git)?$", url)
    if m:
        return m.group(1)
    raise RuntimeError(f"无法从 remote URL 解析 GitHub repo: {url}")


def resolve_default_branch(remote_name: str, cwd: Path) -> str:
    """Resolve the default branch of the remote."""
    result = run_cmd(
        ["git", "remote", "show", remote_name], cwd,
    )
    if result.returncode == 0:
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith("HEAD branch:"):
                return line.split(":", 1)[1].strip()
    # Fallback
    for candidate in ["main", "master"]:
        r = run_cmd(["git", "rev-parse", "--verify", f"{remote_name}/{candidate}"], cwd)
        if r.returncode == 0:
            return candidate
    return "main"


# ---------------------------------------------------------------------------
# Utility: state path
# ---------------------------------------------------------------------------

def get_state_path(main_root: Path) -> Path:
    return main_root / ".context" / "galeharness-cli" / "upstream-sync" / "state.json"


# ---------------------------------------------------------------------------
# Utility: state I/O (atomic)
# ---------------------------------------------------------------------------

def load_state(state_path: Path) -> SyncState:
    """Load and validate state.json."""
    if not state_path.is_file():
        raise FileNotFoundError(f"状态文件不存在: {state_path}\n请先执行 init。")
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise RuntimeError(f"状态文件 JSON 解析失败: {e}\n路径: {state_path}") from e

    if data.get("schema_version") != SCHEMA_VERSION:
        raise RuntimeError(
            f"不支持的 schema_version: {data.get('schema_version')} (期望 {SCHEMA_VERSION})\n"
            f"路径: {state_path}"
        )

    commits = [CommitEntry(**c) for c in data.get("commits", [])]
    operations = [OperationEntry(**o) for o in data.get("operations", [])]
    return SyncState(
        schema_version=data["schema_version"],
        main_worktree_root=data["main_worktree_root"],
        target_repo_root=data["target_repo_root"],
        batch_dir=data["batch_dir"],
        baseline_sha=data["baseline_sha"],
        target_sha=data["target_sha"],
        base_branch=data["base_branch"],
        remote_name=data["remote_name"],
        github_repo=data["github_repo"],
        current_index=data["current_index"],
        workflow_state=data["workflow_state"],
        commits=commits,
        operations=operations,
    )


def save_state(state: SyncState, state_path: Path) -> None:
    """Atomic write: write to temp file then rename."""
    state_path.parent.mkdir(parents=True, exist_ok=True)
    data = asdict(state)
    content = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    fd, tmp_path = tempfile.mkstemp(
        dir=str(state_path.parent), suffix=".tmp", prefix="state-",
    )
    try:
        os.write(fd, content.encode("utf-8"))
        os.close(fd)
        fd = -1
        os.replace(tmp_path, str(state_path))
    except Exception:
        if fd >= 0:
            try:
                os.close(fd)
            except OSError:
                pass
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def add_operation(state: SyncState, operation: str, summary: str) -> None:
    """Append an operation entry, keeping the most recent MAX_OPERATIONS."""
    entry = OperationEntry(
        timestamp=datetime.now().astimezone().isoformat(timespec="seconds"),
        operation=operation,
        summary=summary,
    )
    state.operations.append(entry)
    if len(state.operations) > MAX_OPERATIONS:
        state.operations = state.operations[-MAX_OPERATIONS:]


# ---------------------------------------------------------------------------
# Utility: slug generation
# ---------------------------------------------------------------------------

def make_slug(subject: str, max_len: int = 30) -> str:
    lowered = subject.lower()
    ascii_only = lowered.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return slug[:max_len] or "change"


def make_branch_name(batch_date: str, sequence: int, subject: str) -> str:
    slug = make_slug(subject)
    return f"upstream-sync-{batch_date}-{sequence:04d}-{slug}"


# ---------------------------------------------------------------------------
# Subcommand: init
# ---------------------------------------------------------------------------

def cmd_init(args: argparse.Namespace) -> int:
    dry_run = args.dry_run
    main_root = resolve_main_worktree_root()
    state_path = get_state_path(main_root)

    # Read .upstream-ref and .upstream-repo
    upstream_ref_path = main_root / ".upstream-ref"
    upstream_repo_path = main_root / ".upstream-repo"

    if not upstream_ref_path.is_file():
        print(f"错误: 缺少 .upstream-ref 文件: {upstream_ref_path}", file=sys.stderr)
        return EXIT_PRECONDITION
    if not upstream_repo_path.is_file():
        print(f"错误: 缺少 .upstream-repo 文件: {upstream_repo_path}", file=sys.stderr)
        return EXIT_PRECONDITION

    baseline_sha = upstream_ref_path.read_text(encoding="utf-8").strip()
    upstream_repo = Path(upstream_repo_path.read_text(encoding="utf-8").strip()).expanduser().resolve()

    if not baseline_sha:
        print("错误: .upstream-ref 文件为空", file=sys.stderr)
        return EXIT_PRECONDITION

    if not upstream_repo.is_dir():
        print(f"错误: upstream 仓库路径无效: {upstream_repo}", file=sys.stderr)
        return EXIT_PRECONDITION

    # Check existing state
    if state_path.is_file() and not args.force:
        try:
            existing = load_state(state_path)
            if existing.workflow_state != "complete":
                print(
                    f"错误: 已存在未完成的同步状态 (workflow_state={existing.workflow_state})。\n"
                    f"请使用 status 查看进度，或使用 --force 强制重新初始化。",
                    file=sys.stderr,
                )
                return EXIT_PRECONDITION
        except Exception as e:
            print(f"错误: 已存在状态文件但无法读取: {state_path}", file=sys.stderr)
            print(f"原因: {e}", file=sys.stderr)
            print("请先备份并修复状态文件，或确认后使用 --force 重新初始化。", file=sys.stderr)
            return EXIT_STATE_CORRUPT

    # Resolve remote and base branch
    remote_name = "origin"
    base_branch = args.base or resolve_default_branch(remote_name, main_root)
    github_repo = resolve_github_repo(remote_name, main_root)

    if dry_run:
        print("=== init --dry-run ===")
        print(f"main_worktree_root: {main_root}")
        print(f"baseline_sha: {baseline_sha}")
        print(f"upstream_repo: {upstream_repo}")
        print(f"base_branch: {base_branch}")
        print(f"github_repo: {github_repo}")
        print(f"state_path: {state_path}")
        print("将调用 generate-batch.py 生成 patch 批次")
        return EXIT_OK

    # Call generate-batch.py
    generate_script = Path(__file__).with_name("generate-batch.py")
    gen_result = run_cmd(
        [
            sys.executable, str(generate_script),
            "--upstream-repo", str(upstream_repo),
            "--target-repo", str(main_root),
            "--force",
        ],
        cwd=main_root,
    )
    gen_stdout = gen_result.stdout or ""
    if "No new upstream commits" in gen_stdout:
        print("无需同步: upstream 没有新的 commit。")
        return EXIT_OK

    if gen_result.returncode != 0:
        stderr_msg = _truncate(gen_result.stderr or "")
        stdout_msg = _truncate(gen_stdout)
        print(f"错误: generate-batch.py 失败\nstdout:\n{stdout_msg}\nstderr:\n{stderr_msg}", file=sys.stderr)
        return EXIT_RUNTIME

    # Parse generate-batch.py JSON output for batch_dir
    try:
        gen_info = json.loads(gen_stdout.strip())
        batch_dir = Path(gen_info["batch_dir"])
    except (json.JSONDecodeError, KeyError):
        print(f"错误: 无法解析 generate-batch.py 输出:\n{gen_result.stdout}", file=sys.stderr)
        return EXIT_RUNTIME

    # Parse commit-range.txt to build commit queue
    commit_range_path = batch_dir / "commit-range.txt"
    if not commit_range_path.is_file():
        print(f"错误: 缺少 commit-range.txt: {commit_range_path}", file=sys.stderr)
        return EXIT_RUNTIME

    commits = _parse_commit_range(batch_dir, commit_range_path)
    if not commits:
        print("错误: commit-range.txt 中没有找到 commit 条目", file=sys.stderr)
        return EXIT_RUNTIME

    # Validate raw/adapted patch pairs
    for c in commits:
        raw_p = Path(c.raw_patch)
        adapted_p = Path(c.adapted_patch)
        if not raw_p.is_file():
            print(f"错误: 缺少 raw patch: {raw_p}", file=sys.stderr)
            return EXIT_RUNTIME
        if not adapted_p.is_file():
            print(f"错误: 缺少 adapted patch: {adapted_p}", file=sys.stderr)
            return EXIT_RUNTIME

    # Determine target_sha (last commit in batch)
    target_sha = commits[-1].sha

    state = SyncState(
        schema_version=SCHEMA_VERSION,
        main_worktree_root=str(main_root),
        target_repo_root=str(main_root),
        batch_dir=str(batch_dir),
        baseline_sha=baseline_sha,
        target_sha=target_sha,
        base_branch=base_branch,
        remote_name=remote_name,
        github_repo=github_repo,
        current_index=0,
        workflow_state="idle",
        commits=commits,
        operations=[],
    )
    add_operation(state, "init", f"初始化同步批次, {len(commits)} 个 commit, baseline={baseline_sha[:7]}")
    save_state(state, state_path)

    print(f"=== 同步批次已初始化 ===")
    print(f"批次目录: {batch_dir}")
    print(f"Commit 数量: {len(commits)}")
    print(f"Baseline: {baseline_sha[:7]}")
    print(f"Target: {target_sha[:7]}")
    print(f"Base 分支: {base_branch}")
    print(f"GitHub 仓库: {github_repo}")
    print(f"\n请执行 status 查看队列，执行 next 开始处理第一个 commit。")
    return EXIT_OK


def _parse_commit_range(batch_dir: Path, commit_range_path: Path) -> List[CommitEntry]:
    """Parse commit-range.txt and build CommitEntry list."""
    text = commit_range_path.read_text(encoding="utf-8")
    raw_dir = batch_dir / "raw"
    adapted_dir = batch_dir / "adapted"
    commits: List[CommitEntry] = []
    in_commits = False

    for line in text.splitlines():
        if line.strip() == "commits:":
            in_commits = True
            continue
        if in_commits and line.strip().startswith("- "):
            parts = line.strip().lstrip("- ").split(" ", 2)
            if len(parts) >= 3:
                filename, sha, subject = parts[0], parts[1], parts[2]
                seq = len(commits) + 1
                commits.append(CommitEntry(
                    sequence=seq,
                    sha=sha,
                    subject=subject,
                    raw_patch=str(raw_dir / filename),
                    adapted_patch=str(adapted_dir / filename),
                    status="pending",
                ))
    return commits


# ---------------------------------------------------------------------------
# Subcommand: status
# ---------------------------------------------------------------------------

def cmd_status(args: argparse.Namespace) -> int:
    main_root = resolve_main_worktree_root()
    state_path = get_state_path(main_root)

    try:
        state = load_state(state_path)
    except FileNotFoundError:
        print("未初始化: 请先执行 init 开始同步。", file=sys.stderr)
        return EXIT_PRECONDITION
    except RuntimeError as e:
        print(f"状态异常: {e}", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if args.json:
        out = asdict(state)
        if state.current_index < len(state.commits):
            out["next_commit"] = asdict(state.commits[state.current_index])
        else:
            out["next_commit"] = None
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return EXIT_OK

    total = len(state.commits)
    done = sum(1 for c in state.commits if c.status in ("merged", "skipped"))
    pct = (done / total * 100) if total > 0 else 0

    print(f"=== Upstream Sync 状态 ===")
    print(f"Baseline: {state.baseline_sha[:7]} -> Target: {state.target_sha[:7]}")
    print(f"进度: {done}/{total} ({pct:.0f}%)")
    print(f"工作流状态: {state.workflow_state}")
    print(f"Base 分支: {state.base_branch}")
    print(f"GitHub 仓库: {state.github_repo}")
    print()

    # Commit queue table
    print("Commit 队列:")
    print(f"  {'#':>4}  {'SHA':7}  {'状态':<24}  主题")
    print(f"  {'----':>4}  {'-------':7}  {'------------------------':<24}  ----")
    for c in state.commits:
        marker = " -> " if c.sequence - 1 == state.current_index else "    "
        extra = ""
        if c.pr_url:
            extra = f" PR: {c.pr_url}"
        if c.failed_at:
            extra += f" (失败于: {c.failed_at})"
        print(f"{marker}{c.sequence:4d}  {c.sha[:7]}  {c.status:<24}  {c.subject}{extra}")

    # Next step suggestion
    print()
    if state.workflow_state == "idle" and state.current_index < total:
        nc = state.commits[state.current_index]
        print(f"下一步: 执行 next 处理 #{nc.sequence} {nc.sha[:7]} {nc.subject}")
    elif state.workflow_state == "awaiting_human_review":
        nc = state.commits[state.current_index]
        print(f"下一步: 审查 PR 后执行 resume (PR: {nc.pr_url or 'N/A'})")
    elif state.workflow_state == "failed":
        nc = state.commits[state.current_index]
        print(f"下一步: 修复问题后执行 resume，或执行 skip 跳过 (失败于: {nc.failed_at})")
    elif state.workflow_state == "complete":
        print("所有 commit 已处理完成。")

    # Recent operations
    recent = state.operations[-3:]
    if recent:
        print(f"\n最近操作:")
        for op in recent:
            print(f"  [{op.timestamp}] {op.operation}: {op.summary}")

    return EXIT_OK


# ---------------------------------------------------------------------------
# Subcommand: next
# ---------------------------------------------------------------------------

def cmd_next(args: argparse.Namespace) -> int:
    dry_run = args.dry_run
    main_root = resolve_main_worktree_root()
    state_path = get_state_path(main_root)

    try:
        state = load_state(state_path)
    except FileNotFoundError:
        print("错误: 未初始化，请先执行 init。", file=sys.stderr)
        return EXIT_PRECONDITION
    except RuntimeError as e:
        print(f"状态异常: {e}", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if state.workflow_state != "idle":
        print(f"错误: 当前状态为 {state.workflow_state}，next 只能在 idle 状态下执行。", file=sys.stderr)
        if state.workflow_state == "awaiting_human_review":
            print("提示: 请先执行 resume 或 skip。", file=sys.stderr)
        elif state.workflow_state == "failed":
            print("提示: 请先执行 resume 恢复或 skip 跳过。", file=sys.stderr)
        return EXIT_PRECONDITION

    if state.current_index >= len(state.commits):
        state.workflow_state = "complete"
        save_state(state, state_path)
        print("所有 commit 已处理完成。")
        return EXIT_OK

    commit = state.commits[state.current_index]
    if commit.status != "pending":
        print(f"错误: 当前 commit 状态为 {commit.status}，期望 pending。", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    # Extract batch date from batch_dir
    batch_date = Path(state.batch_dir).name
    branch_name = make_branch_name(batch_date, commit.sequence, commit.subject)

    adapted_patch = Path(commit.adapted_patch)
    worktree_path = Path(state.main_worktree_root).parent / f"GaleHarnessCodingCLI-{branch_name}"

    if dry_run:
        print("=== next --dry-run ===")
        print(f"处理 commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
        print(f"分支名: {branch_name}")
        print(f"Worktree 路径: {worktree_path}")
        print(f"Adapted patch: {adapted_patch}")
        print(f"测试命令: bun test")
        print(f"Commit message: sync(upstream): {commit.subject}")
        print(f"PR 标题: sync(upstream): {commit.subject}")
        print(f"PR base: {state.base_branch}")
        return EXIT_OK

    # Mark in_progress
    commit.status = "in_progress"
    state.workflow_state = "in_progress"
    save_state(state, state_path)

    main_root_path = Path(state.main_worktree_root)

    try:
        # --- Stage: worktree_create ---
        branch_name = _resolve_unique_branch(branch_name, state.remote_name, main_root_path)
        worktree_path = Path(state.main_worktree_root).parent / f"GaleHarnessCodingCLI-{branch_name}"
        commit.branch = branch_name
        commit.base_branch = state.base_branch
        commit.worktree_path = str(worktree_path)

        # Fetch remote base
        run_cmd_checked(
            ["git", "fetch", state.remote_name, state.base_branch],
            main_root_path, stage="fetch_base",
        )

        result = run_cmd(
            ["git", "worktree", "add", "-b", branch_name, str(worktree_path),
             f"{state.remote_name}/{state.base_branch}"],
            main_root_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "worktree_create", result, state_path)
            return EXIT_RUNTIME

        add_operation(state, "worktree_create", f"创建 worktree: {worktree_path}")
        save_state(state, state_path)

        wt_path = Path(commit.worktree_path)

        # --- Stage: patch_check ---
        result = run_cmd(
            ["git", "apply", "--check", str(adapted_patch.resolve())],
            wt_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "patch_check", result, state_path)
            print(f"Raw patch: {commit.raw_patch}", file=sys.stderr)
            print(f"Adapted patch: {commit.adapted_patch}", file=sys.stderr)
            return EXIT_RUNTIME

        add_operation(state, "patch_check", "patch 预检通过")
        save_state(state, state_path)

        # --- Stage: patch_apply ---
        result = run_cmd(
            ["git", "apply", str(adapted_patch.resolve())],
            wt_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "patch_apply", result, state_path)
            return EXIT_RUNTIME

        add_operation(state, "patch_apply", "patch 已应用")
        save_state(state, state_path)

        # --- Stage: test ---
        result = run_cmd(["bun", "test"], wt_path)
        if result.returncode != 0:
            _record_failure(state, commit, "test", result, state_path)
            return EXIT_RUNTIME

        add_operation(state, "test", "bun test 通过")
        save_state(state, state_path)

        # --- Stage: commit ---
        run_cmd_checked(["git", "add", "-A"], wt_path, stage="git_add")
        commit_msg = f"sync(upstream): {commit.subject}"
        result = run_cmd(
            ["git", "commit", "-m", commit_msg],
            wt_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "commit", result, state_path)
            return EXIT_RUNTIME

        add_operation(state, "commit", f"已提交: {commit_msg}")
        save_state(state, state_path)

        # --- Stage: push ---
        result = run_cmd(
            ["git", "push", state.remote_name, branch_name],
            wt_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "push", result, state_path)
            return EXIT_RUNTIME

        add_operation(state, "push", f"已推送分支: {branch_name}")
        save_state(state, state_path)

        # --- Stage: pr_create ---
        pr_title = f"sync(upstream): {commit.subject}"
        pr_body = (
            f"## Upstream Sync\n\n"
            f"- Upstream commit: `{commit.sha}`\n"
            f"- Subject: {commit.subject}\n"
            f"- Sequence: {commit.sequence}/{len(state.commits)}\n"
            f"- Batch: {Path(state.batch_dir).name}\n"
            f"- Baseline: `{state.baseline_sha[:7]}`\n"
        )
        result = run_cmd(
            [
                "gh", "pr", "create",
                "--base", state.base_branch,
                "--head", branch_name,
                "--title", pr_title,
                "--body", pr_body,
                "--repo", state.github_repo,
            ],
            wt_path,
        )
        if result.returncode != 0:
            _record_failure(state, commit, "pr_create", result, state_path)
            return EXIT_RUNTIME

        # Parse PR URL from gh output
        pr_url = result.stdout.strip()
        pr_number = _extract_pr_number(pr_url)

        commit.pr_url = pr_url
        commit.pr_number = pr_number
        commit.pr_head_ref = branch_name
        commit.pr_base_ref = state.base_branch
        commit.status = "awaiting_human_review"
        state.workflow_state = "awaiting_human_review"
        add_operation(state, "pr_create", f"PR 已创建: {pr_url}")
        save_state(state, state_path)

        print(f"=== PR 已创建 ===")
        print(f"Commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
        print(f"PR: {pr_url}")
        print(f"\n请审查 PR 后执行 resume 继续。")
        return EXIT_OK

    except RuntimeError as e:
        print(f"错误: {e}", file=sys.stderr)
        return EXIT_RUNTIME


def _resolve_unique_branch(base_name: str, remote: str, cwd: Path) -> str:
    """Check if remote branch exists, if so add suffix."""
    result = run_cmd(["git", "ls-remote", "--heads", remote, base_name], cwd)
    if result.returncode == 0 and base_name in (result.stdout or ""):
        for suffix in range(2, 100):
            candidate = f"{base_name}-{suffix}"
            r = run_cmd(["git", "ls-remote", "--heads", remote, candidate], cwd)
            if r.returncode != 0 or candidate not in (r.stdout or ""):
                return candidate
    return base_name


def _record_failure(
    state: SyncState, commit: CommitEntry, stage: str,
    result: subprocess.CompletedProcess, state_path: Path,
) -> None:
    """Record pipeline failure in state."""
    stdout_safe = _redact_text(_truncate(result.stdout or ""))
    stderr_safe = _redact_text(_truncate(result.stderr or ""))
    summary = f"stdout: {stdout_safe}\nstderr: {stderr_safe}"

    commit.failed_at = stage
    commit.failure_summary = summary
    commit.status = "failed"
    state.workflow_state = "failed"
    add_operation(state, f"failed:{stage}", f"阶段 {stage} 失败")
    save_state(state, state_path)

    print(f"错误: 阶段 {stage} 失败", file=sys.stderr)
    print(f"摘要:\n{summary}", file=sys.stderr)
    if stage == "patch_check":
        print(f"建议: 检查 adapted patch 是否与当前 base 兼容", file=sys.stderr)
    elif stage == "test":
        print(f"建议: 在 worktree 中修复测试后执行 resume", file=sys.stderr)
    elif stage == "push":
        print(f"建议: 检查网络连接和认证后执行 resume", file=sys.stderr)
    elif stage == "pr_create":
        print(f"建议: 检查 gh 认证状态后执行 resume", file=sys.stderr)


def _extract_pr_number(pr_url: str) -> Optional[int]:
    m = re.search(r"/pull/(\d+)", pr_url)
    return int(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Subcommand: resume
# ---------------------------------------------------------------------------

def cmd_resume(args: argparse.Namespace) -> int:
    dry_run = args.dry_run
    main_root = resolve_main_worktree_root()
    state_path = get_state_path(main_root)

    try:
        state = load_state(state_path)
    except FileNotFoundError:
        print("错误: 未初始化，请先执行 init。", file=sys.stderr)
        return EXIT_PRECONDITION
    except RuntimeError as e:
        print(f"状态异常: {e}", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if state.workflow_state == "failed":
        return _resume_from_failed(state, state_path, dry_run)
    elif state.workflow_state == "awaiting_human_review":
        return _resume_from_review(state, state_path, dry_run)
    else:
        print(f"错误: 当前状态为 {state.workflow_state}，resume 只能在 failed 或 awaiting_human_review 状态下执行。", file=sys.stderr)
        return EXIT_PRECONDITION


def _resume_from_failed(state: SyncState, state_path: Path, dry_run: bool) -> int:
    """Resume from a failed stage by retrying from failed_at."""
    commit = state.commits[state.current_index]
    if not commit.failed_at:
        print("错误: 状态标记为 failed 但缺少 failed_at 信息。", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    failed_stage = commit.failed_at
    stages = ["worktree_create", "patch_check", "patch_apply", "test", "commit", "push", "pr_create"]

    if failed_stage not in stages:
        print(f"错误: 未知的失败阶段: {failed_stage}", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    start_idx = stages.index(failed_stage)

    if dry_run:
        print(f"=== resume --dry-run (从 {failed_stage} 恢复) ===")
        print(f"Commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
        print(f"将从阶段 {failed_stage} 重新开始")
        remaining = stages[start_idx:]
        print(f"剩余阶段: {' -> '.join(remaining)}")
        return EXIT_OK

    # Clear failure state
    commit.failed_at = None
    commit.failure_summary = None
    commit.status = "in_progress"
    state.workflow_state = "in_progress"
    add_operation(state, "resume", f"从阶段 {failed_stage} 恢复")
    save_state(state, state_path)

    main_root_path = Path(state.main_worktree_root)

    # Determine batch_date for branch naming
    batch_date = Path(state.batch_dir).name

    try:
        wt_path = Path(commit.worktree_path) if commit.worktree_path else None

        for stage in stages[start_idx:]:
            if stage == "worktree_create":
                if not commit.branch:
                    commit.branch = make_branch_name(batch_date, commit.sequence, commit.subject)
                    commit.branch = _resolve_unique_branch(commit.branch, state.remote_name, main_root_path)
                if not commit.worktree_path:
                    commit.worktree_path = str(
                        main_root_path.parent / f"GaleHarnessCodingCLI-{commit.branch}"
                    )
                wt_path = Path(commit.worktree_path)
                commit.base_branch = state.base_branch

                run_cmd_checked(
                    ["git", "fetch", state.remote_name, state.base_branch],
                    main_root_path, stage="fetch_base",
                )
                result = run_cmd(
                    ["git", "worktree", "add", "-b", commit.branch, str(wt_path),
                     f"{state.remote_name}/{state.base_branch}"],
                    main_root_path,
                )
                if result.returncode != 0:
                    _record_failure(state, commit, "worktree_create", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "worktree_create", f"创建 worktree: {wt_path}")
                save_state(state, state_path)

            elif stage == "patch_check":
                adapted = Path(commit.adapted_patch).resolve()
                result = run_cmd(["git", "apply", "--check", str(adapted)], wt_path)
                if result.returncode != 0:
                    _record_failure(state, commit, "patch_check", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "patch_check", "patch 预检通过")
                save_state(state, state_path)

            elif stage == "patch_apply":
                adapted = Path(commit.adapted_patch).resolve()
                result = run_cmd(["git", "apply", str(adapted)], wt_path)
                if result.returncode != 0:
                    _record_failure(state, commit, "patch_apply", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "patch_apply", "patch 已应用")
                save_state(state, state_path)

            elif stage == "test":
                result = run_cmd(["bun", "test"], wt_path)
                if result.returncode != 0:
                    _record_failure(state, commit, "test", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "test", "bun test 通过")
                save_state(state, state_path)

            elif stage == "commit":
                run_cmd_checked(["git", "add", "-A"], wt_path, stage="git_add")
                commit_msg = f"sync(upstream): {commit.subject}"
                result = run_cmd(["git", "commit", "-m", commit_msg], wt_path)
                if result.returncode != 0:
                    _record_failure(state, commit, "commit", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "commit", f"已提交: {commit_msg}")
                save_state(state, state_path)

            elif stage == "push":
                result = run_cmd(
                    ["git", "push", state.remote_name, commit.branch], wt_path,
                )
                if result.returncode != 0:
                    _record_failure(state, commit, "push", result, state_path)
                    return EXIT_RUNTIME
                add_operation(state, "push", f"已推送: {commit.branch}")
                save_state(state, state_path)

            elif stage == "pr_create":
                if commit.pr_url:
                    # PR already created, skip
                    continue
                pr_title = f"sync(upstream): {commit.subject}"
                pr_body = (
                    f"## Upstream Sync\n\n"
                    f"- Upstream commit: `{commit.sha}`\n"
                    f"- Subject: {commit.subject}\n"
                    f"- Sequence: {commit.sequence}/{len(state.commits)}\n"
                )
                result = run_cmd(
                    [
                        "gh", "pr", "create",
                        "--base", state.base_branch,
                        "--head", commit.branch,
                        "--title", pr_title,
                        "--body", pr_body,
                        "--repo", state.github_repo,
                    ],
                    wt_path,
                )
                if result.returncode != 0:
                    _record_failure(state, commit, "pr_create", result, state_path)
                    return EXIT_RUNTIME

                pr_url = result.stdout.strip()
                commit.pr_url = pr_url
                commit.pr_number = _extract_pr_number(pr_url)
                commit.pr_head_ref = commit.branch
                commit.pr_base_ref = state.base_branch
                commit.status = "awaiting_human_review"
                state.workflow_state = "awaiting_human_review"
                add_operation(state, "pr_create", f"PR 已创建: {pr_url}")
                save_state(state, state_path)

                print(f"=== PR 已创建 ===")
                print(f"Commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
                print(f"PR: {pr_url}")
                print(f"\n请审查 PR 后执行 resume 继续。")
                return EXIT_OK

        # If we got through all stages without creating a PR, something is off
        print("警告: pipeline 完成但未创建 PR", file=sys.stderr)
        return EXIT_RUNTIME

    except RuntimeError as e:
        print(f"错误: {e}", file=sys.stderr)
        return EXIT_RUNTIME


def _resume_from_review(state: SyncState, state_path: Path, dry_run: bool) -> int:
    """Check PR status and handle merged/open/closed."""
    commit = state.commits[state.current_index]
    if not commit.pr_number:
        print("错误: 缺少 PR 信息。", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    main_root_path = Path(state.main_worktree_root)

    if dry_run:
        print(f"=== resume --dry-run (检查 PR #{commit.pr_number}) ===")
        print(f"将查询 PR 状态: gh pr view {commit.pr_number} --repo {state.github_repo}")
        print(f"merged -> 更新 .upstream-ref, 清理 worktree, 推进 index")
        print(f"open -> 保持等待状态")
        print(f"closed -> 提示使用 skip --force-cleanup")
        return EXIT_OK

    # Query PR status
    result = run_cmd(
        [
            "gh", "pr", "view", str(commit.pr_number),
            "--repo", state.github_repo,
            "--json", "state,mergedAt,url,number,headRefName,baseRefName",
        ],
        main_root_path,
    )
    if result.returncode != 0:
        stderr_safe = _redact_text(_truncate(result.stderr or ""))
        print(f"错误: 无法查询 PR 状态\n{stderr_safe}", file=sys.stderr)
        print("建议: 检查 gh 认证状态和网络连接。", file=sys.stderr)
        return EXIT_RUNTIME

    try:
        pr_data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"错误: 无法解析 PR 状态 JSON:\n{result.stdout}", file=sys.stderr)
        return EXIT_RUNTIME

    pr_state = pr_data.get("state", "").upper()
    head_ref = pr_data.get("headRefName", "")
    base_ref = pr_data.get("baseRefName", "")

    # Verify PR matches state
    if head_ref and commit.pr_head_ref and head_ref != commit.pr_head_ref:
        print(f"错误: PR headRefName 不一致 (PR: {head_ref}, state: {commit.pr_head_ref})", file=sys.stderr)
        print("建议: 请人工检查 PR 和状态文件。", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if base_ref and commit.pr_base_ref and base_ref != commit.pr_base_ref:
        print(f"错误: PR baseRefName 不一致 (PR: {base_ref}, state: {commit.pr_base_ref})", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if pr_state == "MERGED":
        return _handle_pr_merged(state, commit, state_path, main_root_path)
    elif pr_state == "OPEN":
        print(f"PR #{commit.pr_number} 仍在审查中。")
        print(f"URL: {commit.pr_url}")
        print(f"请在审查通过并合并后再执行 resume。")
        return EXIT_OK
    elif pr_state == "CLOSED":
        print(f"警告: PR #{commit.pr_number} 已关闭但未合并。", file=sys.stderr)
        print(f"建议: 使用 skip --force-cleanup 清理资源，或重新打开 PR。", file=sys.stderr)
        state.workflow_state = "failed"
        commit.failed_at = "pr_closed"
        commit.failure_summary = "PR closed without merge"
        add_operation(state, "resume", f"PR #{commit.pr_number} 已关闭未合并")
        save_state(state, state_path)
        return EXIT_RUNTIME
    else:
        print(f"警告: 未知的 PR 状态: {pr_state}", file=sys.stderr)
        return EXIT_RUNTIME


def _git_commit_exists(repo: Path, sha: str) -> bool:
    r = run_cmd(["git", "rev-parse", "--verify", f"{sha}^{{commit}}"], repo)
    return r.returncode == 0


def _git_is_ancestor(repo: Path, ancestor: str, descendant: str) -> bool:
    r = run_cmd(["git", "merge-base", "--is-ancestor", ancestor, descendant], repo)
    return r.returncode == 0


def _should_write_upstream_ref(state: SyncState, commit: CommitEntry, main_root_path: Path) -> Optional[bool]:
    """Validate upstream ancestry before mutating .upstream-ref."""
    upstream_ref_path = main_root_path / ".upstream-ref"
    upstream_repo_path = main_root_path / ".upstream-repo"

    if not upstream_ref_path.is_file():
        print(f"错误: 缺少 .upstream-ref 文件: {upstream_ref_path}", file=sys.stderr)
        return None
    if not upstream_repo_path.is_file():
        print(f"错误: 缺少 .upstream-repo 文件: {upstream_repo_path}", file=sys.stderr)
        return None

    current_ref = upstream_ref_path.read_text(encoding="utf-8").strip()
    if not current_ref:
        print("错误: .upstream-ref 文件为空，拒绝推进 baseline。", file=sys.stderr)
        return None

    upstream_repo = Path(upstream_repo_path.read_text(encoding="utf-8").strip()).expanduser().resolve()
    if not upstream_repo.is_dir():
        print(f"错误: upstream 仓库路径无效: {upstream_repo}", file=sys.stderr)
        return None

    missing = [
        label
        for label, sha in [
            ("state.baseline_sha", state.baseline_sha),
            ("commit.sha", commit.sha),
            (".upstream-ref", current_ref),
        ]
        if not _git_commit_exists(upstream_repo, sha)
    ]
    if missing:
        print(f"错误: upstream 对账失败，以下引用不是有效 commit: {', '.join(missing)}", file=sys.stderr)
        return None

    if not _git_is_ancestor(upstream_repo, state.baseline_sha, commit.sha):
        print(
            f"错误: upstream ancestry 对账未通过 (baseline {state.baseline_sha[:7]} -> {commit.sha[:7]})",
            file=sys.stderr,
        )
        print("拒绝更新 .upstream-ref，请人工检查 upstream 历史和 state.json。", file=sys.stderr)
        return None

    if current_ref == commit.sha:
        print(f"提示: .upstream-ref 已经是 {commit.sha[:7]}，只推进本地状态。", file=sys.stderr)
        return False

    if current_ref == state.baseline_sha:
        return True

    if _git_is_ancestor(upstream_repo, commit.sha, current_ref):
        print(
            f"警告: .upstream-ref ({current_ref[:7]}) 已经位于当前 commit ({commit.sha[:7]}) 之后，只推进本地状态。",
            file=sys.stderr,
        )
        return False

    if _git_is_ancestor(upstream_repo, current_ref, commit.sha):
        print(
            f"警告: .upstream-ref ({current_ref[:7]}) 与 state baseline ({state.baseline_sha[:7]}) 不同，但仍是当前 commit 的祖先；将推进到 {commit.sha[:7]}。",
            file=sys.stderr,
        )
        return True

    print(
        f"错误: .upstream-ref ({current_ref[:7]}) 与当前 commit ({commit.sha[:7]}) 分叉，拒绝推进 baseline。",
        file=sys.stderr,
    )
    return None


def _handle_pr_merged(
    state: SyncState, commit: CommitEntry, state_path: Path, main_root_path: Path,
) -> int:
    """Handle PR merged: reconcile .upstream-ref, cleanup, advance."""
    upstream_ref_path = main_root_path / ".upstream-ref"

    should_write_ref = _should_write_upstream_ref(state, commit, main_root_path)
    if should_write_ref is None:
        return EXIT_STATE_CORRUPT
    if should_write_ref:
        upstream_ref_path.write_text(commit.sha + "\n", encoding="utf-8")
        add_operation(state, "upstream_ref_update", f".upstream-ref 更新为 {commit.sha[:7]}")

    # Cleanup worktree
    if commit.worktree_path:
        wt = Path(commit.worktree_path)
        if wt.is_dir():
            r = run_cmd(["git", "worktree", "remove", str(wt), "--force"], main_root_path)
            if r.returncode != 0:
                print(f"警告: 清理 worktree 失败: {wt}", file=sys.stderr)
            else:
                add_operation(state, "worktree_cleanup", f"已删除 worktree: {wt}")
        else:
            print(f"提示: worktree 已不存在: {wt}", file=sys.stderr)

    # Delete local branch
    if commit.branch:
        r = run_cmd(["git", "branch", "-D", commit.branch], main_root_path)
        if r.returncode != 0:
            print(f"警告: 删除本地分支失败: {commit.branch}", file=sys.stderr)

    # Advance state
    commit.status = "merged"
    state.current_index += 1

    if state.current_index >= len(state.commits):
        state.workflow_state = "complete"
        add_operation(state, "complete", "所有 commit 已处理完成")
        save_state(state, state_path)
        print(f"=== 同步完成 ===")
        print(f"所有 {len(state.commits)} 个 commit 已处理完成。")
        print(f".upstream-ref {'已更新为' if should_write_ref else '保持为'} {commit.sha[:7]}")
        return EXIT_OK
    else:
        state.workflow_state = "idle"
        next_commit = state.commits[state.current_index]
        add_operation(state, "merged", f"#{commit.sequence} merged, 推进到 #{next_commit.sequence}")
        save_state(state, state_path)
        print(f"=== PR 已合并 ===")
        print(f"Commit #{commit.sequence} 已标记为 merged。")
        print(f".upstream-ref {'已更新为' if should_write_ref else '保持为'} {commit.sha[:7]}")
        print(f"\n下一个: #{next_commit.sequence} {next_commit.sha[:7]} {next_commit.subject}")
        print(f"请执行 next 继续。")
        return EXIT_OK


# ---------------------------------------------------------------------------
# Subcommand: skip
# ---------------------------------------------------------------------------

def cmd_skip(args: argparse.Namespace) -> int:
    dry_run = args.dry_run
    force_cleanup = args.force_cleanup
    reason = args.reason or "user skipped"
    main_root = resolve_main_worktree_root()
    state_path = get_state_path(main_root)

    try:
        state = load_state(state_path)
    except FileNotFoundError:
        print("错误: 未初始化，请先执行 init。", file=sys.stderr)
        return EXIT_PRECONDITION
    except RuntimeError as e:
        print(f"状态异常: {e}", file=sys.stderr)
        return EXIT_STATE_CORRUPT

    if state.current_index >= len(state.commits):
        print("所有 commit 已处理完成，无需跳过。")
        return EXIT_OK

    commit = state.commits[state.current_index]

    # Validate skip is allowed
    allowed_statuses = {"pending", "failed", "skipped"}
    if commit.status == "awaiting_human_review" and not force_cleanup:
        print(f"错误: 当前 commit 正在等待审查 (PR: {commit.pr_url})。", file=sys.stderr)
        print("使用 --force-cleanup 强制跳过并清理资源。", file=sys.stderr)
        return EXIT_PRECONDITION
    elif commit.status not in allowed_statuses and commit.status != "awaiting_human_review":
        print(f"错误: 当前 commit 状态为 {commit.status}，无法跳过。", file=sys.stderr)
        return EXIT_PRECONDITION

    if dry_run:
        print(f"=== skip --dry-run ===")
        print(f"将跳过 commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
        print(f"原因: {reason}")
        if force_cleanup:
            print(f"将清理资源:")
            if commit.worktree_path:
                print(f"  Worktree: {commit.worktree_path}")
            if commit.branch:
                print(f"  远程分支: {commit.branch}")
        return EXIT_OK

    main_root_path = Path(state.main_worktree_root)

    # Force cleanup if requested
    if force_cleanup:
        _do_force_cleanup(state, commit, main_root_path)

    # Mark skipped and advance
    commit.status = "skipped"
    commit.failure_summary = f"跳过原因: {reason}"
    state.current_index += 1
    add_operation(state, "skip", f"跳过 #{commit.sequence}: {reason}")

    if state.current_index >= len(state.commits):
        state.workflow_state = "complete"
        add_operation(state, "complete", "所有 commit 已处理完成")
    else:
        state.workflow_state = "idle"

    save_state(state, state_path)

    print(f"已跳过 commit #{commit.sequence}: {commit.sha[:7]} {commit.subject}")
    print(f"原因: {reason}")
    if state.workflow_state == "complete":
        print("所有 commit 已处理完成。")
    else:
        next_c = state.commits[state.current_index]
        print(f"如需继续，请执行 next (下一个: #{next_c.sequence} {next_c.sha[:7]})")
    return EXIT_OK


def _head_repository_name(pr_data: Dict[str, Any]) -> str:
    head_repo = pr_data.get("headRepository") or {}
    if not isinstance(head_repo, dict):
        return ""
    name_with_owner = head_repo.get("nameWithOwner")
    if isinstance(name_with_owner, str):
        return name_with_owner
    owner = head_repo.get("owner") or {}
    owner_login = owner.get("login") if isinstance(owner, dict) else ""
    repo_name = head_repo.get("name")
    if owner_login and repo_name:
        return f"{owner_login}/{repo_name}"
    return ""


def _verify_cleanup_pr_target(state: SyncState, commit: CommitEntry, main_root_path: Path) -> bool:
    if not commit.pr_number:
        print("警告: 缺少 PR 编号，无法验真远程分支归属，跳过远程删除。", file=sys.stderr)
        return False

    result = run_cmd(
        [
            "gh", "pr", "view", str(commit.pr_number),
            "--repo", state.github_repo,
            "--json", "state,number,headRefName,baseRefName,headRepository",
        ],
        main_root_path,
    )
    if result.returncode != 0:
        stderr_safe = _redact_text(_truncate(result.stderr or ""))
        print(f"警告: 无法查询 PR #{commit.pr_number}，跳过远程删除。\n{stderr_safe}", file=sys.stderr)
        return False

    try:
        pr_data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"警告: 无法解析 PR #{commit.pr_number} JSON，跳过远程删除:\n{result.stdout}", file=sys.stderr)
        return False

    problems: List[str] = []
    if pr_data.get("number") not in (None, commit.pr_number):
        problems.append(f"number 不一致 (PR: {pr_data.get('number')}, state: {commit.pr_number})")

    pr_state = str(pr_data.get("state") or "").upper()
    if pr_state == "OPEN":
        problems.append("PR 仍为 OPEN")

    expected_head = commit.pr_head_ref or commit.branch
    head_ref = pr_data.get("headRefName") or ""
    if expected_head and head_ref != expected_head:
        problems.append(f"headRefName 不一致 (PR: {head_ref}, state: {expected_head})")

    expected_base = commit.pr_base_ref or state.base_branch
    base_ref = pr_data.get("baseRefName") or ""
    if expected_base and base_ref != expected_base:
        problems.append(f"baseRefName 不一致 (PR: {base_ref}, state: {expected_base})")

    head_repo_name = _head_repository_name(pr_data)
    if head_repo_name and head_repo_name != state.github_repo:
        problems.append(f"headRepository 不一致 (PR: {head_repo_name}, expected: {state.github_repo})")

    if problems:
        print("警告: PR 验真未通过，跳过远程分支删除:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return False

    return True


def _do_force_cleanup(state: SyncState, commit: CommitEntry, main_root_path: Path) -> None:
    """Cleanup worktree and remote branch with validation."""
    # Validate and cleanup worktree
    if commit.worktree_path:
        wt = Path(commit.worktree_path)
        # Verify worktree is in git worktree list
        r = run_cmd(["git", "worktree", "list", "--porcelain"], main_root_path)
        if r.returncode == 0 and str(wt) in r.stdout:
            r2 = run_cmd(["git", "worktree", "remove", str(wt), "--force"], main_root_path)
            if r2.returncode != 0:
                print(f"警告: 清理 worktree 失败: {wt}", file=sys.stderr)
            else:
                add_operation(state, "cleanup_worktree", f"已删除 worktree: {wt}")
        else:
            print(f"提示: worktree 不在列表中或已删除: {wt}", file=sys.stderr)

    # Validate and cleanup remote branch
    if commit.branch:
        branch = commit.branch
        # Verify branch matches upstream-sync-* pattern
        if not branch.startswith("upstream-sync-"):
            print(f"警告: 分支名 {branch} 不匹配 upstream-sync-* 模式，跳过远程删除。", file=sys.stderr)
            return

        # Verify not default branch
        if branch == state.base_branch:
            print(f"警告: 分支 {branch} 是默认分支，跳过删除。", file=sys.stderr)
            return

        # Delete remote branch only after PR metadata proves the branch target.
        if _verify_cleanup_pr_target(state, commit, main_root_path):
            r = run_cmd(
                ["git", "push", state.remote_name, "--delete", branch],
                main_root_path,
            )
            if r.returncode != 0:
                print(f"警告: 删除远程分支失败: {branch}", file=sys.stderr)
                print(f"手动删除: git push {state.remote_name} --delete {branch}", file=sys.stderr)
            else:
                add_operation(state, "cleanup_remote_branch", f"已删除远程分支: {branch}")

        # Delete local branch
        r = run_cmd(["git", "branch", "-D", branch], main_root_path)
        if r.returncode != 0:
            print(f"警告: 删除本地分支失败: {branch}", file=sys.stderr)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sync-cli.py",
        description="Upstream Sync CLI — 半自动化逐 commit patch 同步工作流",
    )
    parser.add_argument("--dry-run", action="store_true", help="单步副作用预览，不执行写入")
    subparsers = parser.add_subparsers(dest="command", help="子命令")

    # init
    p_init = subparsers.add_parser("init", help="初始化同步批次")
    p_init.add_argument("--base", help="指定 base 分支 (默认: remote default branch)")
    p_init.add_argument("--force", action="store_true", help="强制重新初始化")
    p_init.add_argument("--dry-run", action="store_true", dest="cmd_dry_run", help="预览")

    # status
    p_status = subparsers.add_parser("status", help="查看同步状态")
    p_status.add_argument("--json", action="store_true", help="JSON 格式输出")

    # next
    p_next = subparsers.add_parser("next", help="处理下一个 commit")
    p_next.add_argument("--dry-run", action="store_true", dest="cmd_dry_run", help="预览")

    # resume
    p_resume = subparsers.add_parser("resume", help="恢复或确认 PR 状态")
    p_resume.add_argument("--dry-run", action="store_true", dest="cmd_dry_run", help="预览")

    # skip
    p_skip = subparsers.add_parser("skip", help="跳过当前 commit")
    p_skip.add_argument("--force-cleanup", action="store_true", help="强制清理 worktree 和远程分支")
    p_skip.add_argument("--reason", help="跳过原因")
    p_skip.add_argument("--dry-run", action="store_true", dest="cmd_dry_run", help="预览")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return EXIT_PRECONDITION

    # Merge dry_run flags
    if hasattr(args, "cmd_dry_run") and args.cmd_dry_run:
        args.dry_run = True

    handlers = {
        "init": cmd_init,
        "status": cmd_status,
        "next": cmd_next,
        "resume": cmd_resume,
        "skip": cmd_skip,
    }

    handler = handlers.get(args.command)
    if not handler:
        parser.print_help()
        return EXIT_PRECONDITION

    try:
        return handler(args)
    except FileNotFoundError as e:
        print(f"错误: {e}", file=sys.stderr)
        return EXIT_PRECONDITION
    except RuntimeError as e:
        print(f"错误: {e}", file=sys.stderr)
        return EXIT_RUNTIME
    except KeyboardInterrupt:
        print("\n操作已取消。", file=sys.stderr)
        return EXIT_RUNTIME


if __name__ == "__main__":
    raise SystemExit(main())
