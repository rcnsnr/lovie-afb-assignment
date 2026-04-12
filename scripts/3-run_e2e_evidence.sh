#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

mkdir -p artifacts/videos artifacts/traces

if [ ! -f package.json ]; then
  echo "package.json not found. Run this from the project root after the app exists."
  exit 1
fi

if ! npx playwright --version >/dev/null 2>&1; then
  echo "Playwright is not available via npx. Install project dependencies first."
  exit 1
fi

echo "[1/4] Running Playwright tests with trace retention..."
npx playwright test --trace on || true

echo "[2/4] Collecting videos..."
find test-results -type f \( -name "*.webm" -o -name "*.mp4" \) 2>/dev/null | while IFS= read -r f; do
  dir=$(basename "$(dirname "$f")")
  ext="${f##*.}"
  cp "$f" "artifacts/videos/${dir}.${ext}"
done || true

echo "[3/4] Collecting traces..."
find test-results -type f -name "trace.zip" 2>/dev/null | while IFS= read -r f; do
  dir=$(basename "$(dirname "$f")")
  cp "$f" "artifacts/traces/${dir}.zip"
done || true

echo "[4/4] Done."
echo "Collected artifacts:"
find artifacts -maxdepth 2 -type f | sort || true
