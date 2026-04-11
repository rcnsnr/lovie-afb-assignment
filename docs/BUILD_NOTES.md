# Build Notes

Use this file as a compact log of meaningful execution decisions.

## Important Manual Decisions

- Date: 2026-04-10
- Decision: Scaffolded Next.js manually instead of using `create-next-app`
- Reason: `create-next-app@14` rejects non-empty directories; the repo root already
  contained planning artifacts. Manual scaffold gives identical output with precise
  control over file contents.
- Impact: None — all generated files match `create-next-app` defaults exactly.
  `next@14.2.35`, `react@18`, `typescript@5`, `tailwindcss@3`, `eslint@8`.

## Patches Applied Because AI Output Was Weak

- Date: 2026-04-10
- Problem: `next.config.ts` is not supported in Next.js 14 (TypeScript config is a
  Next.js 15 feature). Dev server threw on startup.
- Correction: Renamed to `next.config.js` with JSDoc type annotation.
- Why it mattered: Dev server would not start without this fix.

- Date: 2026-04-10
- Problem: `prisma init` fails on Node 24 with `(0 , CSe.isError) is not a function`
  (bundled CLI incompatibility). Isolated to the `init` subcommand only.
- Correction: Wrote `prisma/schema.prisma` manually. `prisma generate`, `migrate`, and
  `db seed` all work correctly — only `prisma init` is affected.
- Why it mattered: Build pipeline (`prisma generate && prisma migrate deploy`) is
  unaffected; this is a developer ergonomics issue only.

## Deployment: Vercel + Supabase

- Date: 2026-04-11
- Build command: `npm run build` → expands to `prisma generate && prisma migrate deploy && next build`
- Vercel auto-detects Next.js; `vercel.json` makes the build command explicit.
- Prisma `directUrl` added to `prisma/schema.prisma` (Supabase pooler pattern):
  - `DATABASE_URL` = Transaction pooler URL (port 6543, `?pgbouncer=true&connect_timeout=10`)
    — used at runtime by the Next.js API routes.
  - `DIRECT_URL` = Session/direct URL (port 5432, no pgbouncer params)
    — used by `prisma migrate deploy` and `prisma generate` only.
- Required Vercel environment variables:
  - `DATABASE_URL` — Supabase Transaction pooler URL with pgbouncer params
  - `DIRECT_URL` — Supabase direct URL without pgbouncer params
  - `SESSION_SECRET` — minimum 32 characters; generate with `openssl rand -hex 32`
- Seed is NOT run automatically on deploy. Run manually once against the production DB:
  `DATABASE_URL=<direct_url> npx prisma db seed`
- Impact: Without `directUrl`, `prisma migrate deploy` may fail when `DATABASE_URL`
  routes through pgbouncer (extended query protocol incompatibility).

## Spec / Implementation Drift Notes

None yet.

## Workflow Enhancements

- Date: 2026-04-10
- Decision: Added `scripts/phase_closeout.sh` and the `/phase-closeout` skill.
- Reason: Phase-end validation and reviewer-facing log sync were being done manually and
  were easy to forget. The new workflow standardizes closeout into one repeatable path.
- Impact: Phase boundaries now have a default validation + logging flow before commit/push.
