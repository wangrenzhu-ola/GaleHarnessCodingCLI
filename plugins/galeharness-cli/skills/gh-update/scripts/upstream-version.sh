#!/usr/bin/env bash
set -o pipefail
version=$(gh api repos/wangrenzhu-ola/GaleHarnessCodingCLI/contents/plugins/galeharness-cli/.claude-plugin/plugin.json --jq '.content | @base64d | fromjson | .version' 2>/dev/null)
if [ -n "$version" ]; then
  echo "$version"
else
  echo '__GH_UPDATE_VERSION_FAILED__'
fi
