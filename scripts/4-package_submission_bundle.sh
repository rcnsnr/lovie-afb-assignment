#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
OUT_NAME="${2:-submission_bundle_v1.0.0}"
cd "$PROJECT_ROOT"

rm -rf "$OUT_NAME" "${OUT_NAME}.tar.gz"
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
copy_if_exists RELEASE_NOTES.md "$OUT_NAME/RELEASE_NOTES.md"
copy_if_exists CLAUDE.md "$OUT_NAME/CLAUDE.md"
copy_if_exists docs "$OUT_NAME/docs"
copy_if_exists prompts "$OUT_NAME/prompts"
copy_if_exists specs "$OUT_NAME/specs"
copy_if_exists app "$OUT_NAME/app"
copy_if_exists components "$OUT_NAME/components"
copy_if_exists lib "$OUT_NAME/lib"
copy_if_exists prisma "$OUT_NAME/prisma"
copy_if_exists e2e "$OUT_NAME/e2e"
copy_if_exists scripts "$OUT_NAME/scripts"
copy_if_exists artifacts "$OUT_NAME/artifacts"
copy_if_exists .specify "$OUT_NAME/.specify"
copy_if_exists .claude "$OUT_NAME/.claude"
copy_if_exists package.json "$OUT_NAME/package.json"
copy_if_exists package-lock.json "$OUT_NAME/package-lock.json"
copy_if_exists tsconfig.json "$OUT_NAME/tsconfig.json"
copy_if_exists tsconfig.seed.json "$OUT_NAME/tsconfig.seed.json"
copy_if_exists next.config.js "$OUT_NAME/next.config.js"
copy_if_exists tailwind.config.ts "$OUT_NAME/tailwind.config.ts"
copy_if_exists postcss.config.js "$OUT_NAME/postcss.config.js"
copy_if_exists playwright.config.ts "$OUT_NAME/playwright.config.ts"
copy_if_exists .eslintrc.json "$OUT_NAME/.eslintrc.json"
copy_if_exists .prettierrc.json "$OUT_NAME/.prettierrc.json"
copy_if_exists .prettierignore "$OUT_NAME/.prettierignore"
copy_if_exists .markdownlint.jsonc "$OUT_NAME/.markdownlint.jsonc"
copy_if_exists .markdownlintignore "$OUT_NAME/.markdownlintignore"
copy_if_exists .env.example "$OUT_NAME/.env.example"
copy_if_exists .gitignore "$OUT_NAME/.gitignore"

cat > "$OUT_NAME/BUNDLE_MANIFEST.txt" <<MANIFEST
Bundle: $OUT_NAME
CreatedAtUTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
GitBranch: $(git branch --show-current 2>/dev/null || echo unknown)
GitCommit: $(git rev-parse HEAD 2>/dev/null || echo unknown)
Contents: source, specs, docs, prompts, scripts, e2e, artifacts, release notes
MANIFEST

tar -czf "${OUT_NAME}.tar.gz" "$OUT_NAME"
echo "Created ${OUT_NAME}.tar.gz"
