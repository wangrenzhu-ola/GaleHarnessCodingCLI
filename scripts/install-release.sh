#!/usr/bin/env bash
# Install GaleHarnessCLI from compiled GitHub Release assets.
# Usage:
#   bash scripts/install-release.sh [galeharness-cli-vX.Y.Z]
#
# Environment:
#   INSTALL_DIR=/path/to/bin   Override install directory

set -euo pipefail

REPO="wangrenzhu-ola/GaleHarnessCodingCLI"
TAG_PREFIX="galeharness-cli-v"

err() {
  printf 'error: %s\n' "$*" >&2
}

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "missing required command: $1"
    exit 1
  fi
}

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os:$arch" in
    Darwin:arm64) echo "darwin-arm64" ;;
    Darwin:x86_64) echo "darwin-x64" ;;
    Linux:x86_64) echo "linux-x64" ;;
    Linux:aarch64 | Linux:arm64) echo "linux-arm64" ;;
    *)
      err "unsupported platform: $os $arch"
      exit 1
      ;;
  esac
}

resolve_tag() {
  if [ "${1:-}" != "" ]; then
    printf '%s\n' "$1"
    return
  fi

  need python3
  curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=20" | python3 -c '
import json
import sys

for release in json.load(sys.stdin):
    tag = release.get("tag_name", "")
    if not release.get("draft") and tag.startswith("galeharness-cli-v"):
        print(tag)
        break
else:
    sys.exit("no galeharness-cli release found")
'
}

resolve_install_dir() {
  if [ "${INSTALL_DIR:-}" != "" ]; then
    printf '%s\n' "$INSTALL_DIR"
    return
  fi

  if command -v gale-harness >/dev/null 2>&1; then
    dirname "$(command -v gale-harness)"
    return
  fi

  printf '%s\n' "$HOME/.local/bin"
}

need curl
need tar

tag="$(resolve_tag "${1:-}")"
if [[ "$tag" != "$TAG_PREFIX"* ]]; then
  err "release tag must start with $TAG_PREFIX: $tag"
  exit 1
fi

version="${tag#$TAG_PREFIX}"
platform="$(detect_platform)"
asset="galeharness-cli-$version-$platform.tar.gz"
url="https://github.com/$REPO/releases/download/$tag/$asset"
tmpdir="$(mktemp -d -t galeharness-install-XXXXXX)"
install_dir="$(resolve_install_dir)"

cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

printf 'Installing GaleHarnessCLI %s (%s)\n' "$version" "$platform"
printf 'Download: %s\n' "$url"

curl -fL "$url" -o "$tmpdir/$asset"
tar -xzf "$tmpdir/$asset" -C "$tmpdir"

mkdir -p "$install_dir"
for bin in gale-harness compound-plugin gale-knowledge; do
  dest="$install_dir/$bin"
  if [ -L "$dest" ]; then
    rm "$dest"
  fi
  install -m 0755 "$tmpdir/$bin" "$dest"
done

if [ -f "$tmpdir/gale-memory" ]; then
  dest="$install_dir/gale-memory"
  if [ -L "$dest" ]; then
    rm "$dest"
  fi
  install -m 0755 "$tmpdir/gale-memory" "$dest"
fi

install -m 0644 "$tmpdir/VERSION" "$install_dir/VERSION"

cat <<EOF

Installed to $install_dir

This script overwrites existing GaleHarnessCLI binaries in that directory. If a
previous install used bun link, old symlinks were removed before installing the
compiled binaries.

Then verify:

  gale-harness --version
  gale-harness update --check
EOF
