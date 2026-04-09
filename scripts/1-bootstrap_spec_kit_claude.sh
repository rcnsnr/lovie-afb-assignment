#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
SPEC_KIT_REF="${SPEC_KIT_REF:-main}"
AI_AGENT="${AI_AGENT:-claude}"
INIT_MODE="${INIT_MODE:---here}"
FORCE_INIT="${FORCE_INIT:-0}"

cd "$PROJECT_ROOT"

echo "[1/9] Checking basic prerequisites..."
command -v git >/dev/null 2>&1 || { echo "git is required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required"; exit 1; }
command -v uv >/dev/null 2>&1 || { echo "uv is required"; exit 1; }

echo "[2/9] Checking Node.js availability..."
command -v node >/dev/null 2>&1 || { echo "node is required"; exit 1; }

echo "[3/9] Checking Claude Code availability..."
if ! command -v claude >/dev/null 2>&1; then
  echo "WARNING: Claude Code CLI is not available in PATH."
  echo "Install or authenticate Claude Code before continuing."
fi

echo "[4/9] Installing or upgrading specify-cli..."
uv tool install --force specify-cli --from "git+https://github.com/github/spec-kit.git@${SPEC_KIT_REF}"

echo "[5/9] Running specify check..."
specify check || true

echo "[6/9] Initializing Spec-Kit if needed..."
if [ ! -d ".specify" ]; then
  if [ "$FORCE_INIT" = "1" ]; then
    specify init "${INIT_MODE}" --ai "$AI_AGENT" --force
  else
    specify init "${INIT_MODE}" --ai "$AI_AGENT"
  fi
else
  echo ".specify already exists, skipping init."
fi

echo "[7/9] Ensuring local override directories exist..."
mkdir -p .specify/templates/overrides
mkdir -p .claude/skills
mkdir -p docs/standards
mkdir -p scripts
mkdir -p .githooks
mkdir -p artifacts/videos artifacts/traces artifacts/walkthrough project prompts

echo "[8/10] Configuring lightweight git hook automation if possible..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config core.hooksPath .githooks
else
  echo "[warn] not inside a git repository; skipping hooksPath configuration"
fi

echo "[9/10] Fixing script permissions..."
chmod +x scripts/*.sh .githooks/pre-commit 2>/dev/null || true

echo "[10/10] Done."
echo
echo "Next recommended order:"
echo "  1) run bash scripts/0-auto_fix_and_validate.sh . when needed"
echo "  2) start with /speckit-constitution"
echo "  3) continue with /speckit-specify"
echo "  4) close ambiguity with /speckit-clarify"
echo "  5) review with /spec-review"
echo "  6) plan with /speckit-plan"
echo "  7) audit with /edge-case-audit"
echo "  8) create thin tasks with /speckit-tasks"
echo "  9) implement with /implementation-guard"
