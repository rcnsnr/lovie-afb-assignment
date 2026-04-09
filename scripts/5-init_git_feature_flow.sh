#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${1:-.}"
FEATURE_BRANCH="${2:-feat/p2p-payment-request}"
cd "$REPO_ROOT"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "ERROR: not inside a git repository"; exit 1; }

CURRENT_BRANCH="$(git branch --show-current)"

echo "[info] current branch: ${CURRENT_BRANCH}"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "[warn] expected to create feature flow from main; switching to main may be required"
fi

echo "[info] creating or reusing feature branch: ${FEATURE_BRANCH}"
if git show-ref --verify --quiet "refs/heads/${FEATURE_BRANCH}"; then
  git checkout "$FEATURE_BRANCH"
else
  git checkout -b "$FEATURE_BRANCH"
fi

echo "[ok] feature branch ready: $(git branch --show-current)"
