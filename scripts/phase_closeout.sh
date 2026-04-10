#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-.}"

cd "$REPO_ROOT"

echo "[phase-closeout] repo: $(pwd)"

echo "[1/5] auto-fix and validation"
bash scripts/0-auto_fix_and_validate.sh .

if [ -f package.json ]; then
  if npm run | grep -qE '(^|[[:space:]])lint([[:space:]]|$)'; then
    echo "[2/5] npm run lint"
    npm run lint
  else
    echo "[2/5] lint script not found, skipping"
  fi

  if npm run | grep -qE '(^|[[:space:]])typecheck([[:space:]]|$)'; then
    echo "[3/5] npm run typecheck"
    npm run typecheck
  else
    echo "[3/5] typecheck script not found, skipping"
  fi
else
  echo "[2/5] package.json not found, skipping npm checks"
fi

if [ -f prisma/schema.prisma ] && command -v npx >/dev/null 2>&1; then
  if [ -z "${DATABASE_URL:-}" ]; then
    export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
    echo "[info] DATABASE_URL not set; using a dummy URL for Prisma schema/client validation"
  fi
  echo "[4/5] npx prisma validate"
  npx prisma validate
  echo "[5/5] npx prisma generate"
  npx prisma generate
else
  echo "[4/5] prisma/schema.prisma not found, skipping Prisma checks"
  echo "[5/5] prisma generate skipped"
fi

echo "[ok] phase closeout validation completed"
