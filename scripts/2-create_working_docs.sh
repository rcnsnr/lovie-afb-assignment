#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

mkdir -p docs artifacts/videos artifacts/traces artifacts/walkthrough project

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    echo "Created $dst"
  else
    echo "Skipped $dst (already exists)"
  fi
}

copy_if_missing docs/ASSUMPTIONS_TEMPLATE.md docs/ASSUMPTIONS.md
copy_if_missing docs/AI_PROCESS_TEMPLATE.md docs/AI_PROCESS.md
copy_if_missing docs/BUILD_NOTES_TEMPLATE.md docs/BUILD_NOTES.md

if [ ! -f README.md ] && [ -f project/README.md ]; then
  cp project/README.md README.md
  echo "Created README.md from project/README.md"
else
  echo "Skipped README.md copy"
fi

echo "Working docs are ready."
