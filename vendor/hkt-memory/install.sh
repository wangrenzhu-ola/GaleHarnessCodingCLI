#!/bin/bash

set -e

echo "======================================"
echo "HKT-Memory v5 Installation"
echo "======================================"
echo

PYTHON_VERSION=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
REQUIRED_VERSION="3.9"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Error: Python 3.9+ required, found $PYTHON_VERSION"
    exit 1
fi
echo "✓ Python version: $PYTHON_VERSION"

if command -v uv >/dev/null 2>&1; then
    echo "✓ uv installed"
else
    echo "⚠ uv not found, fallback to python3 runtime"
fi

echo
echo "Checking runtime dependencies..."
python3 -c "import openai, requests, tqdm" >/dev/null 2>&1 || pip3 install openai requests tqdm
echo "✓ runtime dependencies ready"

echo
echo "Creating memory directory structure..."
mkdir -p memory/L0-Abstract/topics
mkdir -p memory/L1-Overview/topics
mkdir -p memory/L2-Full/daily
mkdir -p memory/L2-Full/evergreen
mkdir -p memory/L2-Full/episodes
touch memory/L0-Abstract/index.md
touch memory/L1-Overview/index.md
touch memory/L2-Full/evergreen/MEMORY.md
echo "✓ directory structure ready"

echo
echo "Checking API key environment..."
if [ -z "$ZHIPU_API_KEY" ] && [ -z "$OPENAI_API_KEY" ] && [ -z "$MINIMAX_API_KEY" ]; then
    echo "⚠ no API key detected, L1 extractor will use fallback rule mode"
else
    echo "✓ API key configured"
fi

echo
echo "======================================"
echo "Installation Complete"
echo "======================================"
echo
echo "Quick start:"
echo "  uv run scripts/hkt_memory_v5.py store --content 'Test memory' --title 'Test' --layer all"
echo "  uv run scripts/hkt_memory_v5.py retrieve --query 'test' --layer all"
echo "  uv run scripts/hkt_memory_v5.py stats"
