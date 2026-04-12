#!/usr/bin/env bash
# Sets required Vercel env vars from local .env.local; syncs production first and best-effort preview next.
# Usage:
#   npx vercel login        (one-time)
#   npx vercel link         (link to existing project if not linked)
#   bash scripts/set-vercel-env.sh [--deploy]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/.env.local"
DEPLOY_AFTER_SYNC=false

if [ "${1:-}" = "--deploy" ]; then
  DEPLOY_AFTER_SYNC=true
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

get_env() {
  grep -E "^$1=" "$ENV_FILE" | grep -v '^#' | head -1 | cut -d= -f2- | tr -d '"'
}

sync_env() {
  local key="$1"
  local value="$2"

  echo "→ Syncing $key to Vercel (production)..."
  if ! npx vercel env add "$key" production --value "$value" --force --yes; then
    echo "ERROR: production sync failed for $key"
    exit 1
  fi

  echo "→ Syncing $key to Vercel (preview)..."
  if ! npx vercel env add "$key" preview --value "$value" --force --yes; then
    echo "WARN: preview sync failed for $key; production sync succeeded."
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

if [ -n "${DIRECT_URL:-}" ]; then
  sync_env DIRECT_URL "$DIRECT_URL"
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
  npx vercel --prod --yes
else
  echo ""
  echo "✓ Env vars set. Skipping redeploy (pass --deploy to trigger it)."
fi
