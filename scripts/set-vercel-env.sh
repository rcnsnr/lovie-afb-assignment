#!/usr/bin/env bash
# Sets required Vercel env vars from local .env.local
# Usage:
#   npx vercel login        (one-time)
#   npx vercel link         (link to existing project if not linked)
#   bash scripts/set-vercel-env.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

get_env() {
  grep -E "^$1=" "$ENV_FILE" | grep -v '^#' | head -1 | cut -d= -f2- | tr -d '"'
}

DATABASE_URL=$(get_env DATABASE_URL)
DIRECT_URL=$(get_env DIRECT_URL)
SESSION_SECRET=$(get_env SESSION_SECRET)

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

echo "→ Adding DATABASE_URL (pooler)..."
printf '%s' "$DATABASE_URL" | npx vercel env add DATABASE_URL production --yes 2>/dev/null \
  || printf '%s\n' "$DATABASE_URL" | npx vercel env add DATABASE_URL production

echo "→ Adding DIRECT_URL (direct)..."
printf '%s' "$DIRECT_URL" | npx vercel env add DIRECT_URL production --yes 2>/dev/null \
  || printf '%s\n' "$DIRECT_URL" | npx vercel env add DIRECT_URL production

if [ -n "$SESSION_SECRET" ]; then
  echo "→ Adding SESSION_SECRET..."
  printf '%s' "$SESSION_SECRET" | npx vercel env add SESSION_SECRET production --yes 2>/dev/null \
    || printf '%s\n' "$SESSION_SECRET" | npx vercel env add SESSION_SECRET production
else
  echo "→ SESSION_SECRET not found — generating one..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  printf '%s' "$SECRET" | npx vercel env add SESSION_SECRET production
fi

echo ""
echo "✓ Env vars set. Triggering redeploy..."
npx vercel --prod --yes
