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
- Helper script: `scripts/set-vercel-env.sh` now syncs production first and treats
  preview sync as best-effort from `.env.local` because Vercel may require branch-scoped
  preview vars in the dashboard.

## Deployment Recovery: Supabase Pooler Shard + Credentials

- Date: 2026-04-12
- Problem: Sign-in returned 500 on production. Three sequential root causes:
  1. Password contained a literal `@` character making the connection URL ambiguous for parsers.
     Fixed with `%40` percent-encoding.
  2. Password itself was wrong — reconstructed by inference across sessions rather than reading
     from the Supabase dashboard. Retrieving the real password from the dashboard resolved this.
  3. Pooler host was `aws-0-us-east-2.pooler.supabase.com` but this project routes to the
     `aws-1` shard. Supavisor returned `FATAL: Tenant or user not found` until the correct
     shard was used.
- Additional finding: Vercel serverless functions are IPv4-only. Supabase free tier direct
  connections (`db.*.supabase.co:5432`) are IPv6-only and cannot be reached from Vercel.
  The Transaction pooler (Supavisor) at port 6543 is IPv4-reachable and must be used for
  all runtime DB connections. `DIRECT_URL` (port 5432) is still correct for migrations
  because those run from the developer's machine, not from Vercel.
- Lesson: Always copy the connection string directly from the Supabase dashboard connection
  string UI. Never reconstruct it from memory or partial context.
- Result: Production sign-in fully restored; 15/15 E2E tests green on
  `https://lovie-afb-assignment.vercel.app`.

## E2E Locator Fixes (Post-Evidence Run)

- Date: 2026-04-12
- Problem: 6 of 15 E2E tests failed after first evidence run:
  1. `getByText('PAID')` matched status badge AND "Paid at [timestamp]" span (Playwright
     default is case-insensitive substring match). Same issue with DECLINED, CANCELLED, EXPIRED.
  2. Dashboard locators (`$15.00`, `$30.00`, note text) matched multiple entries because
     tests accumulate real records across runs on a shared live DB.
  3. AC13: `maxLength={200}` on the textarea silently capped Playwright's `fill()` at 200
     chars; the `note.length > 200` client-side check never triggered.
- Fixes: `{ exact: true }` on all status badge assertions; `.first()` on dashboard amount/note
  locators; removed `maxLength` attribute from textarea (JS validation is the enforced limit).
- Result: 15/15 clean pass on production after redeploy.

## Spec / Implementation Drift Notes

None.

## Workflow Enhancements

- Date: 2026-04-10
- Decision: Added `scripts/phase_closeout.sh` and the `/phase-closeout` skill.
- Reason: Phase-end validation and reviewer-facing log sync were being done manually and
  were easy to forget. The new workflow standardizes closeout into one repeatable path.
- Impact: Phase boundaries now have a default validation + logging flow before commit/push.
