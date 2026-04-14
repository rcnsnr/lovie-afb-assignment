# P2P Payment Request

A small consumer fintech web feature that allows one user to request money from another user.

This repository is intended to deliver a reviewer-friendly implementation of the assignment with a visible Spec-Kit workflow, explicit assumptions, and reproducible E2E evidence.

## Project Overview

The feature supports:

- creating payment requests using email **or phone** as recipient contact, an integer-minor-units amount, and an optional note
- generating a unique request identifier and shareable link
- viewing outgoing and incoming request dashboards with status filter pills (ALL / PENDING / PAID / DECLINED / CANCELLED / EXPIRED) and debounced name/email/phone search
- an inline **contact summary card** that appears on either dashboard when the search resolves to exactly one counterparty, showing identity + relationship metrics (sent / received counts and pending / paid / declined totals)
- handling request statuses: pending, paid, declined, cancelled, expired
- paying, declining, or cancelling where allowed, with an explicit 2–3s payment simulation (spinner + success banner) so the network state is visible
- server-side enforcement of 7-day expiration
- responsive web usage on desktop and mobile (card stacks vertically at 375px)
- public demo deployment on Vercel + Supabase Postgres

## Delivery Philosophy

This repository should not become a framework showcase or a blind prompt-to-code dump.
It should show a controlled build process:

1. constitution
2. specification
3. clarification
4. checklist validation
5. technical plan
6. task breakdown
7. analysis before implementation
8. thin-slice implementation
9. automated E2E evidence
10. final submission audit

## Live Demo

- Demo URL: `https://lovie-afb-assignment.vercel.app`
- Demo credentials: `alice@example.com` / `demo1234` · `bob@example.com` / `demo1234` · `carol@example.com` / `demo1234`

## Evidence

- E2E videos: `artifacts/videos/` — one `.webm` per test, covering all 34 tests (AC1–AC32 plus two AC29 sub-variants and the AC5 server-side check)
- Playwright traces: `artifacts/traces/` — matching `.zip` per test, viewable in [Playwright Trace Viewer](https://trace.playwright.dev)
- Walkthrough video: _(not provided — E2E videos in `artifacts/videos/` serve as evidence)_

> **Evidence status**: 34/34 tests pass against the production deployment at
> `https://lovie-afb-assignment.vercel.app`. Artifacts are tracked in git under
> `artifacts/` for reviewer convenience. Re-collect with:
> `BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .`

## Tech Stack

Planned default stack for this repository:

- Next.js
- TypeScript
- Prisma
- Supabase Postgres
- Tailwind CSS
- Playwright
- Zod
- Vercel as the primary deployment path
- Netlify as a fallback deployment option

If the final implementation differs, update this section to match the real build.

## AI Workflow

Primary working surface:

- Claude Code (CLI, with MCP integrations for Vercel and Supabase)

Models and effort lanes (per `CLAUDE.md`):

- **Planning / architecture**: Opus 4.6 at high effort — spec review, clarifications, architecture trade-offs, hard debugging
- **Implementation**: Sonnet 4.6 at medium effort — thin vertical slices, routine code changes, most doc updates
- **Documentation cleanup**: Sonnet 4.6 at low/medium effort — README, AI process notes, submission polish

Workflow backbone:

- GitHub Spec-Kit: constitution → specify → clarify → checklist → plan → tasks → analyze → implement
- Phase-end validation via `scripts/phase_closeout.sh` (auto-fix + lint + typecheck + Prisma validate)

Local support layers:

- concise local skills for spec review, edge-case audit, implementation discipline, ship checks, and git flow hygiene
- condensed local standards for lifecycle, change impact, and implementation defaults
- a lightweight Playwright bypass setup (`e2e/global-setup.ts`) that uses the Vercel MCP server to fetch protected-Preview auth cookies so E2E can run against any branch deployment

## Reviewer-Facing Files

Key files for review:

- `CLAUDE.md`
- `.claude/skills/`
- `.specify/`
- `docs/standards/`
- `docs/ASSUMPTIONS.md`
- `docs/AI_PROCESS.md`
- `docs/BUILD_NOTES.md`
- `docs/VIDEO_EVIDENCE_GUIDE.md`
- `docs/SECURITY_AUDIT.md`
- `docs/EVIDENCE_INDEX.md`
- `RELEASE_NOTES.md`

## Local Development

### Prerequisites

- Node.js 20+ (LTS recommended; tested on 24)
- npm 10+
- A PostgreSQL database — Supabase free tier works out of the box
- `DATABASE_URL`, `DIRECT_URL`, and `SESSION_SECRET` environment variables (see `.env.example`)

### Key Dependencies

| Package                 | Version | Purpose                           |
| ----------------------- | ------- | --------------------------------- |
| next                    | 14.2.35 | App Router framework              |
| prisma / @prisma/client | 5.22.x  | ORM + migrations                  |
| iron-session            | 8.x     | Signed, encrypted cookie sessions |
| zod                     | 3.x     | API boundary validation           |
| bcryptjs                | 2.x     | Demo password hashing             |
| playwright              | 1.49.x  | E2E tests + video evidence        |

### Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL, DIRECT_URL, and SESSION_SECRET
```

`SESSION_SECRET` must be at least 32 characters. Generate one with:

```bash
openssl rand -hex 32
```

### Install Dependencies

```bash
npm install
```

### Apply Migrations

With `DIRECT_URL` filled in, Prisma uses the direct connection for migration commands:

```bash
npx prisma migrate deploy
```

### Seed the Database

After running migrations, seed demo users (Alice, Bob, Carol — password: `demo1234`) and the AC5
expiry fixture:

```bash
npx prisma db seed
```

### Start the App

```bash
npm run dev
```

or

```bash
pnpm dev
```

### Auto-fix and validation

Run the lightweight hygiene pass:

```bash
bash scripts/0-auto_fix_and_validate.sh .
```

Run the standard phase-end validation pass:

```bash
bash scripts/phase_closeout.sh .
```

After a completed phase in Claude Code, prefer:

1. `/phase-closeout`
2. commit
3. push

If the repository is a git repo, enable the local pre-commit hook path once:

```bash
git config core.hooksPath .githooks
```

## End-to-End Testing

Requires a running app (local or deployed) and a seeded database.

Set `BASE_URL` if testing against a deployed instance (defaults to `http://localhost:3000`):

```bash
# Run all E2E tests (starts local dev server first)
npm run dev &
npx playwright test

# Run against deployed demo
BASE_URL=https://your-demo.vercel.app npx playwright test

# Run smoke test only
npx playwright test e2e/smoke.spec.ts
```

Video artifacts are written to `test-results/` for every test run.
Traces are retained on failure for debugging in Playwright Trace Viewer.

### Collect E2E Evidence

```bash
bash scripts/3-run_e2e_evidence.sh .
```

This is expected to collect:

- Playwright video artifacts
- trace artifacts
- evidence output that can be linked from the README and submission note

## Deployment

### Vercel + Supabase

The build command (`npm run build`) runs `prisma generate && next build`.
Vercel executes this automatically on each push.

**Required environment variables in Vercel dashboard:**

| Variable         | Value                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Supabase Transaction pooler URL (port 6543) with `?pgbouncer=true&connect_timeout=10` |
| `SESSION_SECRET` | Random string ≥ 32 characters (`openssl rand -hex 32`)                                |

`DIRECT_URL` should stay local-only unless you intentionally run migrations from a trusted environment.
The current Vercel build/runtime path does not require `DIRECT_URL`, so it should not be stored in Vercel by default.
Preview envs are optional; if you enable them, prefer an isolated preview DB instead of reusing the same production-backed runtime secret by default.

**First deploy checklist:**

1. Add `DATABASE_URL` and `SESSION_SECRET` in Vercel dashboard (Production; Preview only if you explicitly want preview deploys).
2. Push to trigger build.
3. If you need to run migrations or seed manually, do it from a trusted local shell using `DIRECT_URL`:

   ```bash
   DIRECT_URL=<supabase_direct_url> npx prisma migrate deploy
   DIRECT_URL=<supabase_direct_url> DATABASE_URL=<supabase_direct_url> npx prisma db seed
   ```

4. Confirm `/login` loads and `alice@example.com` / `demo1234` signs in.

## Assumptions and Tradeoffs

See:

- `docs/ASSUMPTIONS.md`
- `docs/BUILD_NOTES.md`

## AI Process Notes

See:

- `docs/AI_PROCESS.md`

## Security and Release Artifacts

See:

- `docs/SECURITY_AUDIT.md`
- `docs/EVIDENCE_INDEX.md`
- `RELEASE_NOTES.md`

To package a final reviewer bundle locally:

```bash
bash scripts/4-package_submission_bundle.sh . submission_bundle_v1.0.0
```
