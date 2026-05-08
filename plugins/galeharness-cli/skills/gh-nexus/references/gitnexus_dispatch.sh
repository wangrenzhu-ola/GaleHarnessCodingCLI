#!/usr/bin/env bash
# GitNexus command dispatcher with auto-install detection.
#
# Usage:
#   bash gitnexus_dispatch.sh <subcommand> [args...]
#
# Subcommands:
#   analyze <repo-path>   Run gitnexus analyze on target repo
#   status                Check local GitNexus registry status
#   query <query>         Best-effort natural language query (experimental)
#   cypher <cypher>       Run Cypher query against indexed repo
#   context <symbol>      Get context for a symbol
#   impact <symbol>       Get impact analysis for a symbol
#
# Auto-installs gitnexus@1.6.3 if missing (global npm or npx fallback).

set -euo pipefail

GITNEXUS_VERSION="1.6.3"

detect_gitnexus() {
    if command -v gitnexus >/dev/null 2>&1; then
        command -v gitnexus
        return 0
    fi
    # Check common npx cache locations
    local home="$HOME"
    local cached="$home/.npm/_npx/aaba82a3e1e089f1/node_modules/.bin/gitnexus"
    if [ -x "$cached" ]; then
        echo "$cached"
        return 0
    fi
    return 1
}

verify_gitnexus() {
    local path="$1"
    local out
    out="$("$path" --version 2>/dev/null)" || return 1
    echo "$out" | grep -q "$GITNEXUS_VERSION"
}

install_global() {
    echo "[gh-nexus] gitnexus not found. Attempting global install (gitnexus@${GITNEXUS_VERSION})..."
    if npm install -g "gitnexus@${GITNEXUS_VERSION}" 2>/dev/null; then
        detect_gitnexus
    else
        echo "[gh-nexus] Global install failed." >&2
        return 1
    fi
}

run_with_npx() {
    local subcommand="$1"
    shift
    echo "[gh-nexus] Using npx fallback (gitnexus@${GITNEXUS_VERSION})..."
    npx --yes "gitnexus@${GITNEXUS_VERSION}" "$subcommand" "$@"
}

dispatch() {
    local path="$1"
    local subcommand="$2"
    shift 2
    if [ -n "$path" ]; then
        "$path" "$subcommand" "$@"
    else
        run_with_npx "$subcommand" "$@"
    fi
}

# ---- main ----

if [ $# -lt 1 ]; then
    echo "Usage: $(basename "$0") <subcommand> [args...]"
    echo "Subcommands: analyze, status, query, cypher, context, impact"
    exit 1
fi

SUBCOMMAND="$1"
shift

VALID="analyze status query cypher context impact"
if ! echo "$VALID" | grep -qw "$SUBCOMMAND"; then
    echo "[gh-nexus] Unknown subcommand: $SUBCOMMAND"
    echo "Valid: $VALID"
    exit 1
fi

# Require arg for analyze, query, cypher, context, impact
ARG_REQUIRED="analyze query cypher context impact"
if echo "$ARG_REQUIRED" | grep -qw "$SUBCOMMAND" && [ $# -eq 0 ]; then
    echo "[gh-nexus] Error: '$SUBCOMMAND' requires an argument."
    exit 1
fi

# Phase 0: Detect or install
GITNEXUS_PATH=""
if path="$(detect_gitnexus)"; then
    if verify_gitnexus "$path"; then
        GITNEXUS_PATH="$path"
        echo "[gh-nexus] Using gitnexus at $GITNEXUS_PATH"
    fi
fi

if [ -z "$GITNEXUS_PATH" ]; then
    if path="$(install_global)"; then
        if verify_gitnexus "$path"; then
            GITNEXUS_PATH="$path"
            echo "[gh-nexus] Installed gitnexus at $GITNEXUS_PATH"
        fi
    fi
fi

if [ -z "$GITNEXUS_PATH" ]; then
    # Try npx fallback
    echo "[gh-nexus] Global install unavailable. Trying npx fallback..."
    if npx --yes "gitnexus@${GITNEXUS_VERSION}" --version >/dev/null 2>&1; then
        GITNEXUS_PATH=""
    else
        echo "[gh-nexus] GitNexus is not available and could not be installed."
        echo "[gh-nexus] Please install manually: npm install -g gitnexus@${GITNEXUS_VERSION}"
        exit 1
    fi
fi

# Phase 1: Dispatch
dispatch "$GITNEXUS_PATH" "$SUBCOMMAND" "$@"
