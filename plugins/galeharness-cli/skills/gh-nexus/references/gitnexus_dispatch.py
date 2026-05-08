#!/usr/bin/env python3
"""
GitNexus command dispatcher with auto-install detection.

Usage:
    python3 gitnexus_dispatch.py <subcommand> [args...]

Subcommands:
    analyze <repo-path>   Run gitnexus analyze on target repo
    status                Check local GitNexus registry status
    query <query>         Best-effort natural language query (experimental)
    cypher <cypher>       Run Cypher query against indexed repo
    context <symbol>      Get context for a symbol
    impact <symbol>       Get impact analysis for a symbol

Auto-installs gitnexus@1.6.3 if missing (global npm or npx fallback).
"""

import shutil
import subprocess
import sys
import os

GITNEXUS_VERSION = "1.6.3"


def _run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a subprocess command and return the result."""
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


def detect_gitnexus() -> str | None:
    """Detect gitnexus binary path. Returns path or None."""
    path = shutil.which("gitnexus")
    if path:
        return path
    # Also check common npx cache locations
    home = os.path.expanduser("~")
    npx_paths = [
        os.path.join(home, ".npm", "_npx", "aaba82a3e1e089f1", "node_modules", ".bin", "gitnexus"),
        os.path.join(home, ".npm", "_npx", "*", "node_modules", ".bin", "gitnexus"),
    ]
    for p in npx_paths:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None


def verify_gitnexus(path: str) -> bool:
    """Verify the gitnexus binary works."""
    result = _run([path, "--version"])
    return result.returncode == 0 and GITNEXUS_VERSION in result.stdout


def install_global() -> str | None:
    """Attempt global npm install of gitnexus. Returns path or None."""
    print(f"[gh-nexus] gitnexus not found. Attempting global install (gitnexus@{GITNEXUS_VERSION})...")
    result = _run(["npm", "install", "-g", f"gitnexus@{GITNEXUS_VERSION}"])
    if result.returncode != 0:
        print(f"[gh-nexus] Global install failed: {result.stderr.strip()}")
        return None
    # Re-detect after install
    return detect_gitnexus()


def run_with_npx(subcommand: str, args: list[str]) -> int:
    """Run gitnexus via npx fallback. Returns exit code."""
    print(f"[gh-nexus] Using npx fallback (gitnexus@{GITNEXUS_VERSION})...")
    cmd = ["npx", "--yes", f"gitnexus@{GITNEXUS_VERSION}", subcommand] + args
    result = _run(cmd)
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return result.returncode


def dispatch(gitnexus_path: str | None, subcommand: str, args: list[str]) -> int:
    """Dispatch to gitnexus or npx fallback. Returns exit code."""
    if gitnexus_path:
        cmd = [gitnexus_path, subcommand] + args
        result = _run(cmd)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        return result.returncode
    else:
        return run_with_npx(subcommand, args)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    subcommand = sys.argv[1]
    args = sys.argv[2:]

    valid_commands = {"analyze", "status", "query", "cypher", "context", "impact"}
    if subcommand not in valid_commands:
        print(f"[gh-nexus] Unknown subcommand: {subcommand}")
        print(f"Valid: {', '.join(sorted(valid_commands))}")
        return 1

    # Require arg for analyze, query, cypher, context, impact
    arg_required = {"analyze", "query", "cypher", "context", "impact"}
    if subcommand in arg_required and not args:
        print(f"[gh-nexus] Error: '{subcommand}' requires an argument.")
        return 1

    # Phase 0: Detect or install
    gitnexus_path = detect_gitnexus()

    if gitnexus_path and verify_gitnexus(gitnexus_path):
        print(f"[gh-nexus] Using gitnexus at {gitnexus_path}")
    else:
        gitnexus_path = install_global()
        if gitnexus_path and verify_gitnexus(gitnexus_path):
            print(f"[gh-nexus] Installed gitnexus at {gitnexus_path}")
        else:
            # Try npx fallback
            print(f"[gh-nexus] Global install unavailable. Trying npx fallback...")
            # Verify npx can resolve the package by running --version
            test = _run(["npx", "--yes", f"gitnexus@{GITNEXUS_VERSION}", "--version"])
            if test.returncode != 0:
                print(f"[gh-nexus] GitNexus is not available and could not be installed.")
                print(f"[gh-nexus] Please install manually: npm install -g gitnexus@{GITNEXUS_VERSION}")
                return 1
            gitnexus_path = None  # Will use npx

    # Phase 1: Dispatch
    return dispatch(gitnexus_path, subcommand, args)


if __name__ == "__main__":
    sys.exit(main())
