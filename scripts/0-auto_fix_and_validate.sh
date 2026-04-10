#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-.}"
shift || true

cd "$REPO_ROOT"

collect_files() {
  local -n out_ref=$1
  shift
  if [ "$#" -gt 0 ]; then
    out_ref=("$@")
  else
    mapfile -d '' -t out_ref < <(find . \
      -type f \
      \( -name '*.md' -o -name '*.mdx' -o -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.css' -o -name '*.scss' -o -name '*.yml' -o -name '*.yaml' \) \
      -not -path '*/node_modules/*' \
      -not -path '*/.next/*' \
      -not -path '*/dist/*' \
      -not -path '*/build/*' \
      -not -path '*/coverage/*' \
      -not -path '*/.git/*' \
      -not -path '*/.claude/skills/speckit-*' \
      -print0)
  fi
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

filter_existing() {
  local -n in_ref=$1
  local -n out_ref=$2
  out_ref=()
  local item
  for item in "${in_ref[@]}"; do
    if [ -e "$item" ]; then
      out_ref+=("$item")
    fi
  done
}

FILES=()
collect_files FILES "$@"
EXISTING_FILES=()
filter_existing FILES EXISTING_FILES

if [ "${#EXISTING_FILES[@]}" -eq 0 ]; then
  echo "[info] no files selected for auto-fix"
  exit 0
fi

MD_FILES=()
FORMAT_FILES=()
for file in "${EXISTING_FILES[@]}"; do
  case "$file" in
    *.md|*.mdx)
      MD_FILES+=("$file")
      ;;
  esac
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.scss|*.yml|*.yaml|*.md|*.mdx)
      FORMAT_FILES+=("$file")
      ;;
  esac
done

if [ "${#MD_FILES[@]}" -gt 0 ] && has_cmd npx; then
  echo "[fix] markdownlint --fix"
  npx --yes markdownlint-cli2@0.17.2 --fix "${MD_FILES[@]}"
  echo "[check] markdownlint"
  npx --yes markdownlint-cli2@0.17.2 "${MD_FILES[@]}"
fi

if [ "${#FORMAT_FILES[@]}" -gt 0 ] && has_cmd npx && npx --no-install prettier --version >/dev/null 2>&1; then
  echo "[fix] prettier --write"
  npx --no-install prettier --write "${FORMAT_FILES[@]}"
  echo "[check] prettier --check"
  npx --no-install prettier --check "${FORMAT_FILES[@]}"
else
  echo "[info] prettier not available locally, skipping"
fi

if has_cmd npx && [ -f package.json ]; then
  if { ls eslint.config.* >/dev/null 2>&1 || ls .eslintrc* >/dev/null 2>&1; } && npx --no-install eslint --version >/dev/null 2>&1; then
    echo "[fix] eslint --fix"
    npx --no-install eslint . --fix
    echo "[check] eslint"
    npx --no-install eslint .
  else
    echo "[info] eslint config or local eslint binary not found, skipping"
  fi
fi

echo "[ok] auto-fix and validation pass completed"
