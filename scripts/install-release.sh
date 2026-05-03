#!/usr/bin/env bash
# Install GaleHarnessCLI from compiled GitHub Release assets.
# Usage:
#   bash scripts/install-release.sh [galeharness-cli-vX.Y.Z]
#
# Environment:
#   INSTALL_DIR=/path/to/bin   Override install directory
#   GALE_RELEASE_ARCHIVE=/path/to/archive.tar.gz
#                             Install from a local archive, only when CI=1 or
#                             GALE_INSTALL_ALLOW_LOCAL_ARCHIVE=1

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
    MINGW*:x86_64 | MSYS*:x86_64 | CYGWIN*:x86_64) echo "windows-x64" ;;
    MINGW*:aarch64 | MINGW*:arm64 | MSYS*:aarch64 | MSYS*:arm64 | CYGWIN*:aarch64 | CYGWIN*:arm64) echo "windows-arm64" ;;
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

need tar

platform="$(detect_platform)"
exe=""
if [[ "$platform" == windows-* ]]; then
  exe=".exe"
fi
tmpdir="$(mktemp -d -t galeharness-install-XXXXXX)"
install_dir="$(resolve_install_dir)"

cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

expected_files() {
  printf '%s\n' \
    "gale-harness$exe" \
    "compound-plugin$exe" \
    "gale-knowledge$exe" \
    "gale-memory$exe" \
    "gale-task$exe" \
    "VERSION"
}

is_expected_file() {
  local entry="$1"
  case "$entry" in
    "gale-harness$exe" | "compound-plugin$exe" | "gale-knowledge$exe" | "gale-memory$exe" | "gale-task$exe" | "VERSION")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

validate_archive_listing() {
  local archive="$1"
  local list_file="$tmpdir/archive-files.txt"
  local detail_file="$tmpdir/archive-details.txt"

  if [ ! -f "$archive" ] || [ -L "$archive" ]; then
    err "release archive must be a regular file: $archive"
    exit 1
  fi

  tar -tzf "$archive" > "$list_file"
  tar -tvzf "$archive" > "$detail_file"

  while IFS= read -r entry; do
    [ "$entry" != "" ] || continue
    case "$entry" in
      /* | *"/../"* | "../"* | *"/.." | *"/"* | *"\\.."* | "\\"*)
        err "unsafe archive path: $entry"
        exit 1
        ;;
    esac
    if ! is_expected_file "$entry"; then
      err "unexpected archive file: $entry"
      exit 1
    fi
  done < "$list_file"

  while IFS= read -r expected; do
    if ! grep -Fx "$expected" "$list_file" >/dev/null; then
      err "archive missing expected file: $expected"
      exit 1
    fi
  done < <(expected_files)

  if [ "$(sort "$list_file" | uniq -d | wc -l | tr -d ' ')" != "0" ]; then
    err "archive contains duplicate entries"
    exit 1
  fi

  if grep -v '^-' "$detail_file" >/dev/null; then
    err "archive contains non-regular files"
    exit 1
  fi
}

if [ "${GALE_RELEASE_ARCHIVE:-}" != "" ]; then
  if [ "${CI:-}" != "1" ] && [ "${GALE_INSTALL_ALLOW_LOCAL_ARCHIVE:-}" != "1" ]; then
    err "GALE_RELEASE_ARCHIVE is only allowed when CI=1 or GALE_INSTALL_ALLOW_LOCAL_ARCHIVE=1"
    exit 1
  fi
  archive_path="$GALE_RELEASE_ARCHIVE"
  printf 'Installing GaleHarnessCLI from local archive (%s)\n' "$platform"
  printf 'Archive: %s\n' "$archive_path"
else
  need curl
  tag="$(resolve_tag "${1:-}")"
  if [[ "$tag" != "$TAG_PREFIX"* ]]; then
    err "release tag must start with $TAG_PREFIX: $tag"
    exit 1
  fi

  version="${tag#$TAG_PREFIX}"
  asset="galeharness-cli-$version-$platform.tar.gz"
  url="https://github.com/$REPO/releases/download/$tag/$asset"
  archive_path="$tmpdir/$asset"

  printf 'Installing GaleHarnessCLI %s (%s)\n' "$version" "$platform"
  printf 'Download: %s\n' "$url"
  curl -fL "$url" -o "$archive_path"
fi

validate_archive_listing "$archive_path"
tar -xzf "$archive_path" -C "$tmpdir"

for bin in gale-harness compound-plugin gale-knowledge gale-memory gale-task; do
  src="$tmpdir/$bin$exe"
  if [ ! -f "$src" ] || [ -L "$src" ]; then
    err "archive entry is not a regular file: $bin$exe"
    exit 1
  fi
done

if [ ! -f "$tmpdir/VERSION" ] || [ -L "$tmpdir/VERSION" ]; then
  err "archive entry is not a regular file: VERSION"
  exit 1
fi

mkdir -p "$install_dir"
for bin in gale-harness compound-plugin gale-knowledge gale-memory gale-task; do
  src="$tmpdir/$bin$exe"
  dest="$install_dir/$bin$exe"
  if [ -L "$dest" ]; then
    rm "$dest"
  fi
  install -m 0755 "$src" "$dest"
done

install -m 0644 "$tmpdir/VERSION" "$install_dir/VERSION"

cat <<EOF

Installed to $install_dir

This script overwrites existing GaleHarnessCLI binaries in that directory. If a
previous install used bun link, old symlinks were removed before installing the
compiled binaries.

Then verify:

  gale-harness --version
  gale-harness update --check
  gale-memory status
  gale-task validate --file <workflow-bundle.json>

Gale-managed HKTMemory uses ~/.galeharness/knowledge/<project>/hkt-memory by default.
If hkt-memory is not on PATH, gale-memory status/start will report a diagnostic instead
of failing the binary install.
EOF
