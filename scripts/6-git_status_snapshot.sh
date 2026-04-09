#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${1:-.}"
cd "$REPO_ROOT"

echo "== branch =="
git branch --show-current

echo

echo "== status =="
git status --short

echo

echo "== diff stat =="
git diff --stat

echo

echo "== recent commits =="
git log --oneline -n 12
