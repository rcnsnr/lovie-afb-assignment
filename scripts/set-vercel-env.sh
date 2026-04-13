#!/usr/bin/env bash
# Sets required Vercel env vars from local .env.local.
# Default: sync DATABASE_URL + SESSION_SECRET to Production only.
# Preview sync is opt-in because sharing the same DB secret with Preview can be a review/security tradeoff.
# DIRECT_URL is local-only by default and is excluded from Vercel unless --include-direct-url is passed.
# Usage:
#   npm exec -- vercel login        (one-time)
#   npm exec -- vercel link         (link to existing project if not linked)
#   bash scripts/set-vercel-env.sh [--include-preview] [--include-direct-url] [--deploy]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/.env.local"
DEPLOY_AFTER_SYNC=false
INCLUDE_PREVIEW=false
INCLUDE_DIRECT_URL=false

for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY_AFTER_SYNC=true ;;
    --include-preview) INCLUDE_PREVIEW=true ;;
    --include-direct-url) INCLUDE_DIRECT_URL=true ;;
    *) echo "ERROR: unknown argument: $arg"; exit 1 ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

get_env() {
  grep -E "^$1=" "$ENV_FILE" | grep -v '^#' | head -1 | cut -d= -f2- | tr -d '"'
}

sync_scope() {
  local key="$1"
  local value="$2"
  local scope="$3"

  echo "→ Syncing $key to Vercel ($scope)..."
  if ! npm exec -- vercel env add "$key" "$scope" --value "$value" --force --yes; then
    if [ "$scope" = "preview" ]; then
      echo "WARN: preview sync failed for $key; production sync succeeded."
      return 0
    fi
    echo "ERROR: $scope sync failed for $key"
    exit 1
  fi
}

sync_env() {
  local key="$1"
  local value="$2"

  sync_scope "$key" "$value" production
  if [ "$INCLUDE_PREVIEW" = true ]; then
    sync_scope "$key" "$value" preview
  else
    echo "→ Skipping preview sync for $key by default (avoid sharing runtime secrets with preview unless explicitly intended)."
  fi
}

DATABASE_URL=$(get_env DATABASE_URL)
DIRECT_URL=$(get_env DIRECT_URL)
SESSION_SECRET=$(get_env SESSION_SECRET)

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

sync_env DATABASE_URL "$DATABASE_URL"

if [ "$INCLUDE_DIRECT_URL" = true ] && [ -n "${DIRECT_URL:-}" ]; then
  sync_env DIRECT_URL "$DIRECT_URL"
else
  echo "→ Skipping DIRECT_URL for Vercel by default (local-only secret; not required by current build/runtime)."
fi

if [ -n "${SESSION_SECRET:-}" ]; then
  sync_env SESSION_SECRET "$SESSION_SECRET"
else
  echo "→ SESSION_SECRET not found — generating one..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sync_env SESSION_SECRET "$SECRET"
fi

if [ "$DEPLOY_AFTER_SYNC" = true ]; then
  echo ""
  echo "✓ Env vars set. Triggering redeploy..."
  npm exec -- vercel --prod --yes
else
  echo ""
  echo "✓ Env vars set. Skipping redeploy (pass --deploy to trigger it)."
fi
