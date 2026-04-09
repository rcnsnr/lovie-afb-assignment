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

- Node.js
- a package manager such as `npm` or `pnpm`
- Supabase Postgres or another compatible PostgreSQL database
- Playwright browser dependencies after install

### Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
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

Run E2E tests:

```bash
npx playwright test
```

If package scripts are used instead, replace this command with the actual final command.

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
