# Security Audit

## Executive Summary

This audit covers the current repository, the public Vercel deployment, and the reachable parts of the Vercel project configuration.

Current status after hardening in this change set:

- no tracked secret files in git
- production Vercel environment reduced to the minimum required runtime secrets
- preview env sync made opt-in rather than automatic
- baseline HTTP security headers added at the app edge
- public app login path verified live
- one known dependency advisory remains in `next@14.2.35` and should be treated as the main residual code-level security risk

## Scope

- repository code and config
- Vercel project linkage and production env inventory
- Supabase connection model as represented in code and env docs
- local package/deploy scripts

## Findings

### SA-01 — production Vercel secret scope was broader than necessary

- severity: medium
- status: fixed
- evidence: Vercel env inventory now contains only `DATABASE_URL` and `SESSION_SECRET` for production. `DIRECT_URL` was removed from Vercel because the current build/runtime path does not require it.
- impact: reduces blast radius if Vercel runtime/build secrets are exposed.

### SA-02 — baseline response hardening headers were missing

- severity: medium
- status: fixed
- file: `next.config.js:1-21`
- impact: without baseline headers, clickjacking, MIME sniffing, and some browser-side abuse protections were weaker than necessary.
- fix: added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and disabled `x-powered-by`.

### SA-03 — local-to-Vercel sync script pushed `DIRECT_URL` by default

- severity: medium
- status: fixed
- file: `scripts/set-vercel-env.sh:1-74`
- impact: a local-only migration secret could be copied into Vercel unintentionally.
- fix: script now syncs only `DATABASE_URL` and `SESSION_SECRET` by default. `DIRECT_URL` requires explicit `--include-direct-url`.

### SA-04 — preview secret sync should not be automatic

- severity: medium
- status: fixed
- file: `scripts/set-vercel-env.sh:1-74`
- impact: auto-copying the same runtime secret into Preview makes branch deploy exposure an implicit decision instead of an explicit one.
- fix: preview sync is now opt-in with `--include-preview`.

### SA-05 — public repo does not currently track secret files

- severity: info
- status: verified
- evidence: `.env` and `.env.local` are ignored and not tracked; `.env.example` contains placeholders only.

### SA-06 — session cookie configuration is acceptable for this assignment

- severity: info
- status: verified
- file: `lib/auth.ts:9-15`
- evidence: `httpOnly: true`, `sameSite: "lax"`, `secure` only in production.

### SA-07 — no Supabase client-side keys are used

- severity: info
- status: verified
- impact: the app avoids exposing Supabase `anon` or `service_role` keys in the browser because Prisma talks to Postgres server-side only.

### SA-08 — residual dependency advisories in Next.js

- severity: high
- status: open
- evidence: `npm audit --omit=dev --audit-level=high` reports one high vulnerability in `next@14.2.35`.
- impact: known upstream DoS / request handling advisories remain until the framework version is upgraded to a patched line.
- recommendation: upgrade Next.js to a patched supported release in a separate controlled task and re-run full validation + E2E.

### SA-09 — Vercel platform-only controls were not fully machine-verifiable from available access

- severity: info
- status: not fully verified
- items: preview protection, firewall / WAF state, bot management, protected source maps, team 2FA policy.
- recommendation: confirm these once in the Vercel dashboard and capture screenshots or notes in `docs/BUILD_NOTES.md` if needed.

### SA-10 — Supabase platform-only controls were not fully machine-verifiable from available access

- severity: info
- status: not fully verified
- items: database password history, team MFA, project access membership, backup retention, network restrictions.
- recommendation: confirm manually in the Supabase dashboard. Keep direct connection strings local-only.

## Live Checks Performed

- anonymous GitHub repo access returns 200
- public demo `/login` returns 200
- public `/login` response checked for deployed headers after hardening redeploy
- login API succeeds with seeded demo credentials
- Vercel production env list shows only `DATABASE_URL` and `SESSION_SECRET`
- Vercel production runtime logs show no warning/error entries in the inspected window
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` passes
- `npm audit --omit=dev --audit-level=high` reports 1 high vulnerability in Next.js

## Recommended Manual Platform Checks

### Vercel

- confirm preview protection policy matches your intent
- confirm source maps are protected if enabled on your plan
- confirm no extra env vars exist in Preview / Development
- confirm only intended collaborators have project access
- if you enable Preview envs later, prefer an isolated preview database instead of the production-backed runtime URL

### Supabase

- confirm project members are minimal
- confirm database password is known only to current operators
- confirm direct connection string is not stored in Vercel
- confirm backups / restore points are enabled for the chosen plan

## Current Verdict

- repo security posture: good for an assignment-grade public demo
- platform secret scope: improved and acceptable
- biggest remaining security risk: outdated Next.js dependency line
