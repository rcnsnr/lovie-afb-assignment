#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
OUT_NAME="${2:-submission_bundle}"
cd "$PROJECT_ROOT"

mkdir -p "$OUT_NAME"

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp -R "$src" "$dst"
  fi
}

copy_if_exists README.md "$OUT_NAME/README.md"
copy_if_exists CLAUDE.md "$OUT_NAME/CLAUDE.md"
copy_if_exists docs "$OUT_NAME/docs"
copy_if_exists artifacts "$OUT_NAME/artifacts"
copy_if_exists .specify "$OUT_NAME/.specify"
copy_if_exists .claude "$OUT_NAME/.claude"

tar -czf "${OUT_NAME}.tar.gz" "$OUT_NAME"
echo "Created ${OUT_NAME}.tar.gz"
