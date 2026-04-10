# P2P Payment Request

A small consumer fintech web feature that allows one user to request money from another user.

This repository is intended to deliver a reviewer-friendly implementation of the assignment with a visible Spec-Kit workflow, explicit assumptions, and reproducible E2E evidence.

## Project Overview

The feature is expected to support:

- creating payment requests using recipient contact, amount, and an optional note
- generating a unique request identifier and shareable link
- viewing outgoing and incoming request dashboards
- handling request statuses such as pending, paid, declined, cancelled, and expired
- paying, declining, or cancelling where allowed
- enforcing 7-day expiration
- responsive web usage on desktop and mobile
- public demo deployment

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

- Demo URL: `<ADD_DEMO_URL>`
- Optional demo credentials or demo-user notes: `<ADD_IF_NEEDED>`

## Evidence

- E2E videos: `<ADD_VIDEO_LINK_OR_PATH>`
- Playwright trace: `<ADD_TRACE_LINK_OR_PATH>`
- Walkthrough video: `<ADD_WALKTHROUGH_LINK_OR_PATH>`

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

- Claude Code

Workflow backbone:

- GitHub Spec-Kit

Local support layers:

- concise local skills for spec review, edge-case audit, implementation discipline, ship checks, and git flow hygiene
- condensed local standards for lifecycle, change impact, and implementation defaults

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

## Local Development

### Prerequisites

- Node.js 20+ (LTS recommended; tested on 24)
- npm 10+
- A PostgreSQL database — Supabase free tier works out of the box
- `DATABASE_URL` and `SESSION_SECRET` environment variables (see `.env.example`)

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
# Edit .env.local — fill in DATABASE_URL and SESSION_SECRET
```

`SESSION_SECRET` must be at least 32 characters. Generate one with:

```bash
openssl rand -hex 32
```

### Install Dependencies

```bash
npm install
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

## Assumptions and Tradeoffs

See:

- `docs/ASSUMPTIONS.md`
- `docs/BUILD_NOTES.md`

## AI Process Notes

See:

- `docs/AI_PROCESS.md`
