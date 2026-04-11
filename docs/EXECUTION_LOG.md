<!-- markdownlint-disable MD024 -->

# Execution Log

## Purpose

Use this file to keep a concise running record of what was done, why it was done, and what changed.

This file is not a full diary.
It is the reviewer-facing execution trail for the assignment.

Use it to capture:

- major workflow steps
- important decisions
- meaningful tradeoffs
- corrections to AI output
- validation checkpoints

---

## How to update this file

Add or extend an entry when one of these happens:

- a new Spec-Kit phase is completed
- a meaningful architecture or stack decision is made
- a bug fix changes behavior
- an assumption changes
- a major validation milestone is reached
- a deployment or evidence milestone is completed

Keep entries short and factual.

---

## Entry Template

### YYYY-MM-DD HH:MM — Phase or milestone

#### What was done

- ...

#### Why it was done

- ...

#### Artifacts changed

- ...

#### Validation

- ...

#### Notes

- ...

---

### 2026-04-09 12:00 — Checklist, technical plan, and edge-case hardening

#### What was done

- Generated spec readiness checklist (`specs/001-p2p-payment-request/checklists/spec-readiness.md`,
  52 items CHK001–CHK052) covering all requirement quality dimensions with elevated E2E
  evidence coverage (10 dedicated items).
- Wrote technical implementation plan (`specs/001-p2p-payment-request/plan.md`) covering
  stack justification, application structure, data model summary, route/API shape, auth
  approach, money handling, lifecycle integrity decisions, execution lanes, E2E strategy,
  deployment strategy, risks, and non-goals preserved.
- Produced supporting artifacts: `research.md` (decisions + rationale), `data-model.md`
  (Prisma schema, entity tables, seed users), `contracts/api.md` (full route contracts +
  PaymentRequestDTO shape).
- Ran edge-case audit; identified 2 critical risks and 6 important gaps.
- Applied all 6 audit corrections to spec and plan (no code written):
  - CR1+CR2: conditional `WHERE status='PENDING' AND expiresAt > NOW()` on all state-change
    writes — eliminates concurrent-submit and read-write expiration race.
  - IG1: self-request check uses `recipient.id !== session.userId` (UUID), not email string.
  - IG2: single Zod chain enforces zero-rejection without a two-step validation.
  - IG3: Observer post-login path via shareable link added to spec Edge Cases.
  - IG4: dashboard list endpoints must apply `getEffectiveStatus()` to every item; EXPIRED
    items included, not filtered — added to spec and plan.
  - IG6: AC5 seed fixture must be written as `status=PENDING` + past `expiresAt` (not
    `status=EXPIRED`) to exercise `getEffectiveStatus()` in E2E.

#### Why it was done

- Checklist validates requirement quality before planning, as required by Spec-Kit workflow.
- Plan locks stack, data model, and lifecycle enforcement decisions before task breakdown.
- Edge-case audit is required by CLAUDE.md after `/speckit-plan`.
- Corrections applied to artifacts (not code) so implementation starts from a hardened spec
  and plan rather than discovering these gaps mid-build.

#### Artifacts changed

- `specs/001-p2p-payment-request/checklists/spec-readiness.md` — created (52 items)
- `specs/001-p2p-payment-request/plan.md` — created + 5 audit corrections applied
- `specs/001-p2p-payment-request/research.md` — created
- `specs/001-p2p-payment-request/data-model.md` — created
- `specs/001-p2p-payment-request/contracts/api.md` — created
- `specs/001-p2p-payment-request/spec.md` — 2 audit corrections applied (Edge Cases)

#### Validation

- `bash scripts/0-auto_fix_and_validate.sh . <files>`: markdownlint + prettier clean on all
  new and modified artifacts
- Edge-case audit regression watchlist: RW1–RW7 anchored in plan and spec

#### Notes

- No implementation code written. All changes are spec and plan artifacts.
- Key high-risk item for implementation: conditional DB write (CR1+CR2) in all three
  action route handlers (pay, decline, cancel).
- Next step: `/speckit-tasks` to break the plan into thin implementation slices.

---

### 2026-04-11 — Phase 8 complete: Full E2E test suite (T025–T029)

#### What was done

- T025: `e2e/happy-path.spec.ts` — AC1+AC2; Alice creates $15 request, Bob pays, both verify PAID.
- T026: `e2e/actions.spec.ts` — AC3 (Bob declines), AC4 (Alice cancels), wrong-actor guard (Decline not visible for requester).
- T027: `e2e/expiration.spec.ts` — AC5 UI (EXPIRED badge, no buttons on seed fixture) + AC5 server (pay POST → 409 via `page.evaluate`).
- T028: `e2e/authorization.spec.ts` — AC6 (Carol observer sees details, no buttons), AC7 (Alice pay POST on own request → 403).
- T029: `e2e/validation.spec.ts` — AC8 (outgoing dashboard reverse-chrono via `innerText.indexOf`), AC9 (incoming shows received), AC10 (amount 0 → inline error), AC11 (self-request → 422 inline error), AC12 (nonexistent UUID → not-found state), AC13 (`page.fill()` bypasses `maxLength` → client catches 201-char note).

#### Why it was done

- All 13 ACs now have explicit Playwright coverage.
- `context.clearCookies()` used for clean session switching between Alice/Bob/Carol within tests.
- Seed fixture (`00000000-0000-0000-0000-000000000001`) provides stable past-expiry record for AC5 without time manipulation.
- AC13 uses `page.fill()` to bypass HTML `maxLength=200`; client-side JS catches `note.length > 200` and shows inline error.

#### Artifacts changed

- `e2e/happy-path.spec.ts` (new)
- `e2e/actions.spec.ts` (new)
- `e2e/expiration.spec.ts` (new)
- `e2e/authorization.spec.ts` (new)
- `e2e/validation.spec.ts` (new)
- `specs/001-p2p-payment-request/tasks.md` — T025–T029 marked ✓

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass (markdownlint, prettier, eslint, typecheck, prisma validate+generate).
- No runtime E2E execution yet — requires live Supabase + seeded DB for full green run.

#### Notes

- T030 (Vercel deployment) and T031 (evidence collection) are the remaining tasks.
- Phase 8 completes the E2E coverage milestone; ready for deployment phase.

---

### 2026-04-11 — Phase 7 complete: Shareable link + expiry countdown (T023–T024)

#### What was done

- T023: `middleware.ts` — Edge-compatible; matches `/requests/:id*`; checks `p2p-session`
  cookie by presence; redirects to `/login?next=/requests/<id>` when absent.
  Login page updated with `useSearchParams()` to read `?next=`; `isSafeReturnPath()`
  guard (must start with `/`, must not start with `//`) prevents open redirect;
  redirects to `next` on success or falls back to `/dashboard/outgoing`.
- T024: `components/ExpiryCountdown.tsx` — `"use client"` component; accepts `expiresAt`
  ISO string and `status`; returns `null` for non-PENDING status and when `ms <= 0`;
  ticks every second via `setInterval` — display-only, no server calls; inline versions
  removed from both dashboard pages and detail page.

#### Why it was done

- T023 completes AC12 (shareable link unauthenticated flow).
- T024 ensures EXPIRED badge and countdown are consistently rendered from the same
  component across all views; confirms display-only constraint is enforced.

#### Artifacts changed

- `middleware.ts` — new file (T023)
- `app/(auth)/login/page.tsx` — `?next=` param + open-redirect guard (T023)
- `components/ExpiryCountdown.tsx` — new file (T024)
- `app/(protected)/dashboard/outgoing/page.tsx` — uses shared component (T024)
- `app/(protected)/dashboard/incoming/page.tsx` — uses shared component (T024)
- `app/(protected)/requests/[id]/page.tsx` — uses shared component (T024)

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass.

#### Notes

- 0 corrections required. All outputs accepted as generated.
- Middleware does a cookie-presence check only (not session decryption) — sufficient for
  Edge Runtime; full session validation still happens in route handlers/pages.

---

### 2026-04-11 — Phase 6 complete: Request detail + action routes (T018–T022)

#### What was done

- T018: `GET /api/requests/[id]` — any authenticated user; 404 for unknown ID;
  `toPaymentRequestDTO()` applies `getEffectiveStatus()` on read.
- T019: `POST /api/requests/[id]/pay` — recipient only; conditional write
  `WHERE status='PENDING' AND expiresAt > NOW()` (CR1+CR2); `paidAt` set atomically;
  `count === 0` → 409; second `findUnique` for DTO (U3 pattern).
- T020: `POST /api/requests/[id]/decline` — same CR1+CR2 pattern; recipient only;
  sets `declinedAt`.
- T021: `POST /api/requests/[id]/cancel` — same CR1+CR2 pattern; requester only;
  sets `cancelledAt`.
- T022: `app/(protected)/requests/[id]/page.tsx` — client component; fetches
  `/api/requests/[id]` + `/api/auth/me` in parallel; role derived from
  `currentUserId === req.recipientId / req.requesterId`; action buttons shown only when
  `isPending && (isRecipient || isRequester)`; not-found state; inline action error with
  server state refresh on failure.

#### Why it was done

- Completes Phase 6 (AC2, AC3, AC4, AC6, AC7): full lifecycle UI and all action routes.
- Conditional write pattern (CR1+CR2) eliminates double-transition and expiration race.

#### Artifacts changed

- `app/api/requests/[id]/route.ts` — new (T018)
- `app/api/requests/[id]/pay/route.ts` — new (T019)
- `app/api/requests/[id]/decline/route.ts` — new (T020)
- `app/api/requests/[id]/cancel/route.ts` — new (T021)
- `app/(protected)/requests/[id]/page.tsx` — new (T022)

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass.

#### Notes

- 0 corrections required. All outputs accepted as generated.
- T019–T021 use identical conditional write structure; action-specific fields only differ.
- Role check in T022 is derived from DTO fields (`recipientId`, `requesterId`), not client props.

---

### 2026-04-11 — Phase 5 complete: Dashboard views + list APIs (T015–T017)

#### What was done

- T015: `GET /api/requests` (outgoing list) added to existing route file; new
  `app/api/requests/incoming/route.ts` for incoming list. Both query with
  `include: { requester, recipient }`, sort `createdAt DESC`, map via
  `toPaymentRequestDTO()` so `getEffectiveStatus()` is applied to every row — EXPIRED
  items appear in lists, not filtered.
- T016: `app/(protected)/dashboard/outgoing/page.tsx` and
  `app/(protected)/dashboard/incoming/page.tsx` — server components; `StatusBadge`
  with per-status colour mapping; `ExpiryCountdown` computed at render time from
  `expiresAt` (display-only, no polling); `amountDisplay` via DTO; tab nav between
  dashboards; empty state with CTA; row links to `/requests/[id]`.
- T017: `app/page.tsx` root redirect was already present from prior session; confirmed
  correct — auth → `/dashboard/outgoing`, unauth → `/login`.

#### Why it was done

- Completes Phase 5 (AC8, AC9): both dashboard views now visible and functional.
- List API endpoints required before dashboard pages can fetch data.

#### Artifacts changed

- `app/api/requests/route.ts` — `GET` handler added
- `app/api/requests/incoming/route.ts` — new file
- `app/(protected)/dashboard/outgoing/page.tsx` — new file
- `app/(protected)/dashboard/incoming/page.tsx` — new file
- `app/page.tsx` — already correct; no change

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass.

#### Notes

- 0 corrections required. All outputs accepted as generated.
- `ExpiryCountdown` is server-side render-time calculation — no client state, no polling.
- `formatCents` applied via DTO `amountDisplay` field throughout.

---

### 2026-04-11 — Phase 4 complete: Create request API + new request page (T013–T014)

#### What was done

- T013: `POST /api/requests` route — Zod validation with single-chain `amountDollars` transform
  (IG2), self-request check via UUID not email (IG1), 7-day expiry, returns DTO via
  `toPaymentRequestDTO()`; shared `lib/dto.ts` created ahead of T015–T022 reuse.
- T014: `app/(protected)/requests/new/page.tsx` — client form with dollar input (`inputMode="decimal"`,
  `$` prefix), optional note with char counter, client-side pre-validation mirroring server rules,
  field-level errors from Zod issues (400), form-level errors for 404 (unknown recipient) and
  422 (self-request), loading state, redirect to `/requests/[id]` on 201.

#### Why it was done

- Core create-request flow needed before dashboards and detail pages.
- `lib/dto.ts` extracted early to avoid DTO duplication across all request routes.

#### Artifacts changed

- `app/api/requests/route.ts` — new file (T013)
- `lib/dto.ts` — new file (shared DTO builder)
- `app/(protected)/requests/new/page.tsx` — new file (T014)

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass:
  markdownlint, prettier, eslint, `tsc --noEmit`, `prisma validate` + `prisma generate`.

#### Notes

- 0 corrections required. Both tasks accepted as generated.
- Self-request check uses `recipient.id === session.userId` (UUID), not email string — IG1 applied.
- Single Zod chain on `amountDollars` (IG2) applied directly in the route schema.

---

### 2026-04-11 — Phase 3 complete: Auth routes + login UI + session guard (T009–T012)

#### What was done

- **T009**: `POST /api/auth/login` — Zod validation (400 on bad fields), bcrypt.compare
  against stored hash, same-message 401 (no user enumeration), iron-session save before
  response, returns `{ user: { id, email, name } }`.
- **T010**: `POST /api/auth/logout` (session.destroy — full destruction, not expiry) and
  `GET /api/auth/me` (returns session user or 401).
- **T011**: `app/(auth)/login/page.tsx` — client component; email + password fields;
  loading state (`disabled` button + text swap); inline error paragraph on failure (no
  alert/toast); `router.push("/dashboard/outgoing")` on success.
- **T012**: `app/(protected)/layout.tsx` — async server component; `getSession()` then
  `redirect("/login")` if no session; `redirect()` from `next/navigation` (server-side,
  not client guard). Covers all routes under `(protected)/`.
- Ancillary: added `npm run typecheck` script; added `.env` to `.gitignore` (Prisma CLI
  reads `.env`, not `.env.local`); applied Prisma migration to Supabase via MCP and
  committed local migration file.

#### Why it was done

- Phase 3 is the auth prerequisite for all subsequent feature phases.
  No dashboard, request creation, or action route can be implemented without
  a working session + protected route guard.

#### Artifacts changed

- `app/api/auth/login/route.ts` — created
- `app/api/auth/logout/route.ts` — created
- `app/api/auth/me/route.ts` — created
- `app/(auth)/login/page.tsx` — created
- `app/(protected)/layout.tsx` — created
- `prisma/migrations/20260410000000_init/migration.sql` — created
- `package.json` — added `typecheck` script
- `.gitignore` — added `.env`
- `specs/001-p2p-payment-request/tasks.md` — T009–T012 marked ✓
- All commits pushed to `origin/feat/001-p2p-payment-request`

#### Validation

- `phase_closeout.sh` all 5 checks pass: markdownlint, prettier, ESLint, `tsc --noEmit`,
  `prisma validate`, `prisma generate`
- Prisma migration applied to Supabase via MCP; tables `User` and `PaymentRequest`
  confirmed present in `information_schema.tables`

#### Notes

- 0 corrections required this phase. All outputs accepted as generated.
- `prisma migrate resolve --applied 20260410000000_init` + `prisma db seed` still pending
  locally (requires DATABASE_URL in `.env`; seeding deferred until user adds password).
- Next step: Phase 4 — T013 `POST /api/requests` (create payment request); first route
  with real business logic (self-request check IG1, conditional write CR1+CR2).

---

### 2026-04-10 — Phase 2 complete: DB schema, seed, utilities, auth (T005–T008)

#### What was done

- **T005**: Replaced `prisma/schema.prisma` stub with full schema — `User`, `PaymentRequest`,
  `RequestStatus` enum (PENDING/PAID/DECLINED/CANCELLED/EXPIRED), all nullable timestamp
  fields (`paidAt`, `declinedAt`, `cancelledAt` as `DateTime?`), `amountMinorUnits` as `Int`,
  and 4 indexes (`requesterId`, `recipientId`, `status`, `expiresAt`). `prisma validate` clean
  (with dummy URL). `prisma generate` produced client. Migration deferred until `DATABASE_URL`
  is configured; schema and client generation verified.
- **T006**: Wrote `prisma/seed.ts` — Alice, Bob, Carol with bcrypt cost-10 `demo1234` hashes
  (upsert-safe for re-runs); AC5 fixture: `id=00000000-…-0001`, `status=PENDING`,
  `expiresAt=now()-24h` (per IG6 — must be PENDING not EXPIRED to exercise
  `getEffectiveStatus()`). Updated `README.md` with seed command and `docs/ASSUMPTIONS.md`
  with seed credentials.
- **T007**: Implemented `lib/prisma.ts` (global singleton, hot-reload safe), `lib/money.ts`
  (`parseDollars` single Zod chain per IG2, `formatCents`), `lib/requests.ts`
  (`getEffectiveStatus` — returns EXPIRED if PENDING + past expiresAt). Validated logic
  inline: `parseDollars("15.00")→1500`, `parseDollars("0")→throws`,
  `parseDollars("15.999")→throws`.
- **T008**: Replaced `lib/auth.ts` stub with full iron-session implementation — `SessionData`
  type (`userId`, `email`, `name`), `getSession()`, `requireSession()` (throws `Response(401)`
  if unauthenticated). Cookie options: `httpOnly: true`, `secure: prod only`, `sameSite: lax`,
  7-day maxAge.

#### Why it was done

- Phase 2 is the prerequisite for all feature implementation phases. Schema, seed, utilities,
  and auth helpers must exist before any route handler or UI component can be built.
- T005/T006: required before migration and E2E seeding.
- T007: `getEffectiveStatus` is the core expiration mechanism; all dashboard and action routes
  depend on it. Money utilities enforce the integer-minor-units contract.
- T008: `requireSession`/`getSession` are called by every protected route and server component.

#### Artifacts changed

- `prisma/schema.prisma` — full schema replacing stub
- `prisma/seed.ts` — created
- `lib/prisma.ts` — created
- `lib/money.ts` — created
- `lib/requests.ts` — created
- `lib/auth.ts` — full implementation replacing stub
- `README.md` — seed command added
- `docs/ASSUMPTIONS.md` — seed credentials documented
- `specs/001-p2p-payment-request/tasks.md` — T005–T008 marked ✓
- 4 commits pushed to `origin/feat/001-p2p-payment-request`

#### Validation

- `prisma validate` (with dummy DATABASE_URL): "The schema at prisma/schema.prisma is valid 🚀"
- `prisma generate`: client produced (v5.22.0)
- `tsc --noEmit`: 0 errors after each task
- `parseDollars` inline logic test: all 3 T007 cases pass
- All 4 commits passed pre-commit hook (markdownlint + prettier + ESLint clean)

#### Notes

- Migration (`prisma migrate dev`) deferred until `DATABASE_URL` is configured in `.env.local`.
  Schema and client generation are fully verified. No human corrections required this phase.
- Next step: T009 — `POST /api/auth/login` (Phase 3 — Auth); then T010 (logout), T011
  (login page UI).

---

### 2026-04-10 — Phase 1 bootstrap complete (T001–T004)

#### What was done

- **T001**: Scaffolded Next.js 14.2.35 App Router manually (create-next-app rejects
  non-empty dirs). TypeScript strict, Tailwind 3, ESLint 8, Prettier. Full App Router
  directory structure per plan: `(auth)/`, `(protected)/`, `api/` route groups plus
  `lib/`, `components/`, `prisma/`, `e2e-evidence/`. Dev server verified (`npm run dev`
  → ready in ~1.4s).
- **T002**: All runtime and dev dependencies installed and verified. Moved `@prisma/client`
  to `dependencies` (runtime). Added `ts-node` (seed script) and `prettier` (missing from
  initial list). Wrote `prisma/schema.prisma` stub manually — `prisma init` fails on
  Node 24 (isolated to that subcommand; `generate`/`migrate` unaffected). All four
  imports (`zod`, `iron-session`, `bcryptjs`, `@prisma/client`) verified via `tsc --noEmit`
  with zero errors. Updated README prerequisites with key deps table.
- **T003**: `playwright.config.ts` — `video: 'on'`, `trace: 'retain-on-failure'`,
  `baseURL` from `BASE_URL` env (default `http://localhost:3000`), Chromium only,
  `workers: 1`. `e2e/smoke.spec.ts` navigates to `/` and asserts `< 500`. Smoke test
  passed (1 passed, 4.1s); `test-results/.../video.webm` produced. Updated README E2E
  section with final run commands.
- **T004**: `.env.example` with `DATABASE_URL` (pgbouncer params for Vercel serverless),
  `SESSION_SECRET` (min 32 chars, generation note), `BASE_URL`. `.env.local` created
  locally and confirmed absent from `git status` (gitignored). README local dev section
  updated with `cp .env.example .env.local` and `openssl rand -hex 32` instructions.

#### Why it was done

- Phase 1 is the bootstrap prerequisite for all subsequent implementation tasks.
  No Phase 2 task (DB + utilities) can start without a working Next.js project,
  verified deps, E2E toolchain, and env configuration.

#### Artifacts changed

- `package.json`, `package-lock.json` — full dep list with corrected placement
- `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js` — project config
- `.eslintrc.json`, `.prettierrc.json`, `.prettierignore` — formatting/lint config
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx` — App Router root files
- `lib/auth.ts` — stub (full implementation T008)
- `prisma/schema.prisma` — datasource stub (full schema T005)
- `playwright.config.ts`, `e2e/smoke.spec.ts` — E2E toolchain
- `.env.example`, `.gitignore` (next-env.d.ts entry added)
- `README.md` — prerequisites, deps table, env setup, E2E run commands
- `docs/BUILD_NOTES.md` — two corrections documented
- `scripts/0-auto_fix_and_validate.sh` — ESLint glob detection fix (OR pattern)
- `specs/001-p2p-payment-request/tasks.md` — T001–T004 marked ✓

#### Validation

- `npm run dev` → Next.js 14.2.35 ready (smoke-verified)
- `tsc --noEmit` → 0 errors
- `npx playwright test e2e/smoke.spec.ts` → 1 passed; `video.webm` produced
- All commits passed pre-commit hook (markdownlint + prettier + ESLint clean)

#### Notes

- Three corrections applied vs. plan (all in BUILD_NOTES.md):
  1. `next.config.ts` → `next.config.js` (TS config is Next.js 15+)
  2. `autoprefixer` + `prettier` added to devDeps (missing from initial list)
  3. `prisma init` fails on Node 24 — schema written manually; pipeline unaffected
- Draft PR open: rcnsnr/lovie-afb-assignment#1 (feat/001-p2p-payment-request → main)
- All 4 Phase 1 commits pushed to `origin/feat/001-p2p-payment-request`
- Next step: T005 — full Prisma schema (`User`, `PaymentRequest`, `RequestStatus` enum,
  all indexes) + first migration

---

### 2026-04-09 14:00 — Planning baseline committed; feature branch created

#### What was done

- Fixed `.githooks/pre-commit` to filter `speckit-*` files before passing staged
  files to the auto-fix script. The find-command exclusion already applied in
  all-files mode; the hook was missing the same filter for explicit staged-file mode.
- Created `.gitignore` (node_modules, .next, .env.local, test-results, .vercel).
- Committed planning work in four logical phase commits on `main`:
  1. `chore(bootstrap)` — execution harness, skills, scripts, docs scaffold
  2. `docs(constitution)` — v1.0.0, all 5 principles, constraints, governance
  3. `spec(feature)` — spec.md (13 ACs), checklists (52 items), feature.json
  4. `plan(tech)` — plan.md, research.md, data-model.md, contracts/api.md,
     tasks.md (T001–T031)
- Created `feat/001-p2p-payment-request` branch from `main`.
- Pushed `main` and `feat/001-p2p-payment-request` to `origin`.
- Draft PR deferred: GitHub requires at least one commit ahead of `main`;
  PR opens after T001 lands on the feature branch.

#### Why it was done

- `/git-flow-guard` analysis identified that all pre-implementation work was
  untracked with no commits. Phase-separated commits make the spec-first workflow
  visible to reviewers and satisfy the preferred cadence in the skill.
- Feature branch created before implementation so all product code is isolated
  from the planning baseline.

#### Artifacts changed

- `.githooks/pre-commit` — added `grep -v '.claude/skills/speckit-'` filter
- `.gitignore` — created
- `main` branch — 4 commits pushed
- `feat/001-p2p-payment-request` — created and pushed (no impl commits yet)

#### Validation

- All four commits passed pre-commit hook (markdownlint + prettier clean)
- `git log --oneline` on `main`: 4 commits, correct order
- `git push` successful for both branches

#### Notes

- No implementation code in any commit. All committed artifacts are planning only.
- Next step: T001 — Next.js project init on `feat/001-p2p-payment-request`;
  draft PR opens after T001 commit.

---

### 2026-04-09 13:30 — Cross-artifact analysis complete (speckit-analyze)

#### What was done

- Ran `/speckit-analyze` across `spec.md`, `plan.md`, and `tasks.md`.
- Verified all 13 ACs have task coverage (100%).
- Verified no constitution violations across all 5 principles.
- Identified 6 findings: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 2 LOW.
- Key findings:
  - I1 (HIGH): T016 (Phase 5) depends on `ExpiryCountdown` component from T024 (Phase 7)
    — no dependency note in tasks. Risk: implementer hits a missing component mid-slice.
  - U3 (MEDIUM): Conditional write using `updateMany` returns `{count: number}`, not the
    updated record — a second `findUnique` is required to build the DTO response. Not
    noted in T019/T020/T021.
  - U2 (MEDIUM): `scripts/3-run_e2e_evidence.sh` referenced by T031 — existence
    unverified; no task creates it if missing.
  - U1 (MEDIUM): T024 conflates countdown implementation with E2E verification (T027's job).
  - A1/A2 (LOW): Minor wording ambiguities in T024 (file location) and T028 (error shape).

#### Why it was done

- `/speckit-analyze` is required by CLAUDE.md after `/speckit-tasks` and before
  `/speckit-implement`.
- Analysis catches ordering gaps and implementation ambiguities before they become bugs.

#### Artifacts changed

- None — `/speckit-analyze` is read-only by design. Remediation edits are pending user
  approval before being applied to `tasks.md`.

#### Validation

- All 13 ACs mapped to at least one task.
- All 5 constitution principles satisfied.
- No CRITICAL issues blocking implementation.

#### Notes

- Remediation edits for I1, U1, U2, U3, A1, A2 are small prose-only changes to
  `tasks.md`. User may approve and apply before starting T001.
- Next step: apply remediation edits (or skip and accept LOW risk), then start
  `/speckit-implement` at T001.

---

### 2026-04-09 13:00 — Task breakdown generated (speckit-tasks)

#### What was done

- Generated `specs/001-p2p-payment-request/tasks.md` with 31 numbered tasks (T001–T031)
  plus mandatory execution rules and dependency notes.
- Tasks organized into 9 phases:
  - Phase 1 (T001–T004): Bootstrap — Next.js init, dependencies, Playwright config, env vars
  - Phase 2 (T005–T008): DB + Utilities — Prisma schema + migration, seed script,
    lib/prisma, lib/money, lib/requests, lib/auth
  - Phase 3 (T009–T012): Auth — login/logout/me routes, login page, protected layout guard
  - Phase 4 (T013–T014): Create Request — POST /api/requests, create form page
  - Phase 5 (T015–T017): Dashboards — list routes, dashboard pages, root redirect
  - Phase 6 (T018–T022): Detail + Actions — GET detail, pay/decline/cancel routes, detail page
  - Phase 7 (T023–T024): Expiration + Shareable Link — effective status middleware,
    countdown component
  - Phase 8 (T025–T029): E2E Suite — 5 test files covering AC1–AC13
  - Phase 9 (T030–T031): Deployment + Evidence — Vercel config, evidence collection script

#### Why it was done

- `/speckit-tasks` is step 6 in the Spec-Kit workflow; required before `/speckit-analyze`
  and implementation begins.
- Task granularity matches the plan's execution lanes (implementation vs. debugging vs.
  docs) so each slice is thin, reviewable, and independently validatable.

#### Artifacts changed

- `specs/001-p2p-payment-request/tasks.md` — created (T001–T031 + mandatory finals)

#### Validation

- `bash scripts/0-auto_fix_and_validate.sh . specs/.../tasks.md`: markdownlint + prettier
  clean pass

#### Notes

- No implementation code written. All artifacts remain specification and planning.
- Next step: `/speckit-analyze` (codebase analysis before implementation begins).

---

## Initial Project Setup

### 2026-04-09 00:00 — V5 workflow bootstrap prepared

#### What was done

- Added project-local Claude Code workflow files.
- Added local skills for spec review, edge-case audit, implementation discipline, ship check, and git flow hygiene.
- Added condensed local standards for implementation defaults, fintech lifecycle, and change impact validation.
- Added lightweight automation for markdown linting, formatting, and pre-commit hygiene.

#### Why it was done

- The assignment requires a spec-driven, AI-native workflow.
- The repository needed a reviewer-friendly structure before implementation started.
- The workflow needed to stay lightweight and visible instead of becoming a hidden orchestration system.

#### Artifacts changed

- `CLAUDE.md`
- `.claude/skills/`
- `.specify/templates/overrides/`
- `docs/standards/`
- `docs/AI_PROCESS.md`
- `docs/ASSUMPTIONS.md`
- `docs/BUILD_NOTES.md`
- `docs/VIDEO_EVIDENCE_GUIDE.md`
- `scripts/`
- `.githooks/pre-commit`
- `.markdownlint.jsonc`

#### Validation

- markdownlint pass
- shell syntax pass
- auto-fix workflow smoke test pass
- git hook path configured

#### Notes

- Product implementation has not started yet.
- The next step is to run the actual Spec-Kit workflow, starting with constitution and specification.

---

### 2026-04-09 10:00 — Constitution ratified (v1.0.0)

#### What was done

- Filled all placeholder tokens in `.specify/memory/constitution.md`.
- Ratified five core principles: Spec-First Workflow, Money Safety, Lifecycle Integrity,
  Authorization Enforcement, Evidence-Driven Delivery.
- Added Technology and Architecture Constraints section.
- Added Development and Review Workflow section.
- Added Governance section with amendment procedure and semver versioning policy.
- Fixed auto-fix script to exclude third-party `speckit-*` SKILL.md files from markdown lint.

#### Why it was done

- Constitution is the first required step in the Spec-Kit workflow before specification begins.
- Principles were derived from CLAUDE.md priority order, implementation-defaults.md,
  fintech-request-lifecycle.md, and assumptions.
- The speckit-\* SKILL.md files (newly installed) have pre-existing MD041/MD040 violations
  that are not owned by this repo; the find exclusion prevents false lint failures.

#### Artifacts changed

- `.specify/memory/constitution.md` — v1.0.0, all placeholders resolved
- `scripts/0-auto_fix_and_validate.sh` — added `speckit-*` exclusion to find command

#### Validation

- `grep` for remaining bracket tokens: zero found
- `bash scripts/0-auto_fix_and_validate.sh .`: markdownlint and prettier clean pass

#### Notes

- No extensions.yml present; pre/post hooks skipped.
- Next step: run `/speckit-specify` to draft the feature spec.

---

### 2026-04-09 11:00 — Feature specification written (speckit-specify)

#### What was done

- Created `specs/001-p2p-payment-request/` feature directory.
- Wrote full feature spec at `specs/001-p2p-payment-request/spec.md` covering all
  mandatory sections: summary, goals, non-goals, actors, primary flows (F1–F8), screens,
  domain rules, money handling, lifecycle, authorization, expiration semantics, validation,
  error states, edge cases, 13 acceptance criteria, and reviewer notes.
- Persisted feature directory to `.specify/feature.json`.
- Created quality checklist at `specs/001-p2p-payment-request/checklists/requirements.md`.

#### Why it was done

- Specification is step 2 in the Spec-Kit workflow; no implementation decisions without a
  complete spec.
- Feature description was derived from README and CLAUDE.md project context (no user
  argument needed — project is fully defined).

#### Artifacts changed

- `specs/001-p2p-payment-request/spec.md` — initial spec, all sections populated
- `specs/001-p2p-payment-request/checklists/requirements.md` — all items passing
- `.specify/feature.json` — feature directory pointer

#### Validation

- Quality checklist: all items pass, zero [NEEDS CLARIFICATION] markers
- `bash scripts/0-auto_fix_and_validate.sh . specs/.../spec.md`: clean pass

#### Notes

- Spec derived entirely from existing project docs; no user input required.
- spec-review pass immediately followed; five fixes identified and applied.

---

### 2026-04-09 11:30 — Spec-review fixes applied + spec clarified (speckit-clarify)

#### What was done

- Applied five fixes from the spec-review pass:
  1. Observer field-visibility rule added to Authorization Rules.
  2. Not-found error state added to Error States.
  3. AC12 (not-found shareable link) added to Acceptance Criteria.
  4. Amount ceiling removed from Validation Rules (no arbitrary upper bound).
  5. AC13 (note length validation) added to Acceptance Criteria.
  6. Dashboard ordering (reverse-chronological) added to Domain Rules.
- Ran structured clarify scan; two material ambiguities identified and resolved:
  - Q1: Amount input format → users enter dollar value (e.g. "15.00"); system converts
    to minor units (cents) on submission.
  - Q2: Mock auth mechanism → email + fixed demo password (no real hashing or OAuth).
- Added `## Clarifications / ### Session 2026-04-09` section to spec with both Q/A bullets.
- Updated F1, Validation Rules, Screens/Views, and Reviewer Notes Assumptions to reflect
  clarification answers.

#### Why it was done

- spec-review is required by CLAUDE.md after `/speckit-specify`.
- Q1 resolves an implementation-impacting ambiguity in the create-request form and
  validation logic.
- Q2 resolves auth mechanism ambiguity that affects implementation and E2E test setup.
- Both answers provided by the user; AI recommendations were presented first.

#### Artifacts changed

- `specs/001-p2p-payment-request/spec.md` — spec-review fixes + clarifications integrated

#### Validation

- `grep` for [NEEDS CLARIFICATION]: zero found
- `bash scripts/0-auto_fix_and_validate.sh . specs/.../spec.md`: clean pass (markdownlint
  - prettier)

#### Notes

- Q2 answer (C: email + password) was a user override from the recommended option B
  (email-only). Documented as a human judgment correction.
- Next step: run `/speckit-checklist` to validate spec completeness before planning.

---

### 2026-04-09 00:10 — Spec-Kit Claude integration installed

#### What was done

- Installed Spec-Kit Claude integration files into the assignment repository.
- Added the local `execution-log-sync` skill.
- Updated `CLAUDE.md` so execution log updates are part of the workflow contract.

#### Why it was done

- The repository was missing the actual `/speckit-*` Claude skills, so the commands were unavailable.
- The assignment needs a durable reviewer-facing record of what was done and why.

#### Artifacts changed

- `.claude/skills/speckit-*/`
- `.specify/` generated integration files
- `.claude/skills/execution-log-sync/SKILL.md`
- `CLAUDE.md`

#### Validation

- `specify init --here --ai claude --force --no-git` completed successfully
- markdownlint pass for updated local docs and skills

#### Notes

- Claude Code may need a fresh session or repo reload to discover newly installed skills.
- The next step is to confirm `/speckit-constitution` resolves and then begin the real Spec-Kit flow.

---
