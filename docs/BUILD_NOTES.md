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
- Build command: `npm run build` → expands to `prisma generate && next build`
- Vercel auto-detects Next.js; `vercel.json` makes the build command explicit.
- Prisma `directUrl` added to `prisma/schema.prisma` (Supabase pooler pattern):
  - `DATABASE_URL` = Transaction pooler URL (port 6543, `?pgbouncer=true&connect_timeout=10`)
    — used at runtime by the Next.js API routes.
  - `DIRECT_URL` = Session/direct URL (port 5432, no pgbouncer params)
    — used by trusted-shell migration / seed flows.
- Required Vercel environment variables:
  - `DATABASE_URL` — Supabase Transaction pooler URL with pgbouncer params
  - `SESSION_SECRET` — minimum 32 characters; generate with `openssl rand -hex 32`
- `DIRECT_URL` is kept local-only. `npm run build` was verified locally with `DIRECT_URL` unset.
- Seed is NOT run automatically on deploy. Run manually once against the production DB from a trusted shell:
  `DATABASE_URL=<direct_url> npx prisma db seed`
- Impact: keeping `DIRECT_URL` out of Vercel avoids exposing a stronger database secret to the hosted runtime when it is not needed.
- Helper script: `scripts/set-vercel-env.sh` now syncs Production only by default.
  Preview sync is opt-in with `--include-preview`; `DIRECT_URL` is opt-in with `--include-direct-url`.

## Pay Simulation Delay (T043)

- Date: 2026-04-13
- Decision: `POST /api/requests/[id]/pay` inserts `await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))` — a 2–3s random delay — between the 403 authorization check and the conditional `updateMany` write.
- Reason: Spec AC24 requires visible payment processing latency to demonstrate UI feedback (spinner). The delay simulates a real payment rail without needing an external service.
- Important placement: delay is AFTER auth check (403/404 paths remain immediate) and BEFORE the write (so the write still executes after the delay). Decline and Cancel routes are NOT modified — they remain instant per spec.
- Impact: Pay action takes 2–3s end-to-end. No business logic or state transitions changed.

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

## Security and Release Hardening

- Date: 2026-04-13
- Decision: Removed `DIRECT_URL` from Vercel production and changed the sync script so it is local-only by default.
- Reason: The current build/runtime path only needs `DATABASE_URL` and `SESSION_SECRET`; keeping `DIRECT_URL` in Vercel widened secret exposure with no runtime value.
- Impact: Lower secret blast radius in Vercel. Local migrations/seeding still use `DIRECT_URL` from a trusted shell only.

- Date: 2026-04-13
- Decision: Stopped syncing Preview env vars by default from the helper script.
- Reason: Sharing the same runtime DB secret with Preview is a security/review tradeoff and should be explicit, not automatic.
- Impact: Production remains the only default target. Preview sync now requires `--include-preview`.

- Date: 2026-04-13
- Decision: Added baseline HTTP security headers in `next.config.js`.
- Reason: The app had no response hardening headers at all.
- Impact: Better browser-side protection against clickjacking, MIME sniffing, and overly broad referrer leakage.
