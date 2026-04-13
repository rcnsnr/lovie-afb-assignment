# Release Notes — v1.0.0

## What ships

- p2p payment request feature with create, detail, pay, decline, cancel, expiration, and observer flows
- spec-first delivery package with spec, plan, tasks, assumptions, build notes, and AI process log
- Playwright E2E suite covering happy path, actions, authorization, expiration, validation, and smoke
- public Vercel deployment backed by Supabase Postgres

## Final hardening in this release

- made the GitHub repository public
- reduced Vercel production env scope to runtime-only secrets
- added baseline HTTP security headers
- added security audit and evidence index docs
- improved submission bundle packaging to include source, specs, docs, tests, prompts, and artifacts

## Known follow-ups

- add missing status filter + sender/recipient search on dashboards
- support phone as an alternative recipient contact path
- add explicit 2–3 second payment simulation + success confirmation
- upgrade Next.js to a patched release line and re-run full E2E
