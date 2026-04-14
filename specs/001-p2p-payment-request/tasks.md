# Task Breakdown

## Execution Rules

- tasks should be thin and reviewable
- each task must have a validation method
- unrelated refactors are forbidden
- evidence-related tasks are first-class work, not last-minute cleanup
- each meaningful task should make docs impact explicit

---

## Phase 1 — Project Bootstrap

### T001 ✓

- objective: Initialise the Next.js 14 App Router project with TypeScript strict mode,
  Tailwind CSS, and ESLint. Establish the base directory structure per the plan.
- files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`,
  `app/layout.tsx`, `app/globals.css`
- validation: `npm run dev` starts without errors; TypeScript strict mode on; Tailwind
  utility classes apply in a smoke component
- evidence impact: none directly; enables all subsequent tasks
- recommended lane: implementation
- reasoning / effort: standard Next.js init; low risk; thin
- required review: confirm App Router structure matches plan (`(auth)/`, `(protected)/`,
  `api/` route groups)
- docs impact: update `docs/BUILD_NOTES.md` with chosen Next.js version and init command

### T002 ✓

- objective: Add and configure all required runtime dependencies: Prisma, iron-session,
  Zod, bcryptjs, and their TypeScript types.
- files: `package.json`, `prisma/` (directory created)
- validation: `npm install` succeeds; `npx prisma` resolves; `import { z } from 'zod'`
  compiles; `import { getIronSession } from 'iron-session'` compiles
- evidence impact: none directly
- recommended lane: implementation
- reasoning / effort: dependency install; no logic; minimal risk
- required review: confirm no extraneous packages added beyond the plan's list
- docs impact: update `README.md` prerequisites section with final package list

### T003 ✓

- objective: Configure Playwright for E2E tests — `playwright.config.ts` with
  `video: 'on'`, `trace: 'retain-on-failure'`, baseURL from env, and the `e2e/`
  directory structure. Add a smoke test that navigates to `/` and passes.
- files: `playwright.config.ts`, `e2e/smoke.spec.ts`
- validation: `npx playwright test e2e/smoke.spec.ts` passes; video artifact produced
  in `test-results/`
- evidence impact: confirms video artifact collection pipeline works before any
  feature tests are written
- recommended lane: implementation
- reasoning / effort: config only; no business logic; confirms evidence toolchain early
- required review: confirm video and trace output paths; confirm baseURL reads from env
- docs impact: update `README.md` E2E section with final run command

### T004 ✓

- objective: Add `.env.example` (with `DATABASE_URL`, `SESSION_SECRET`, `BASE_URL`)
  and `.env.local` for local dev. Confirm `.env.local` is in `.gitignore`.
- files: `.env.example`, `.env.local` (gitignored), `.gitignore`
- validation: `.env.example` committed; `.env.local` absent from `git status`; app
  starts with env vars set
- evidence impact: none directly; required for deployment correctness
- recommended lane: implementation
- reasoning / effort: config hygiene; zero logic
- required review: confirm SESSION_SECRET minimum length documented in `.env.example`
- docs impact: update `README.md` local dev section with env setup instructions

---

## Phase 2 — Database and Core Utilities

### T005 ✓

- objective: Write the Prisma schema — `User`, `PaymentRequest`, `RequestStatus` enum,
  all timestamp fields, indexes on `requesterId`, `recipientId`, `status`, `expiresAt`.
  Run first migration.
- files: `prisma/schema.prisma`, `prisma/migrations/` (generated)
- validation: `npx prisma migrate dev` succeeds; `npx prisma generate` produces client;
  Prisma Studio shows both tables with correct columns
- evidence impact: all E2E paths depend on schema correctness; a wrong schema invalidates
  all subsequent tasks
- recommended lane: implementation
- reasoning / effort: direct translation from `data-model.md`; medium risk (schema changes
  are disruptive later)
- required review: confirm `amountMinorUnits` is `Int` not `Float`; confirm all nullable
  timestamp fields are `DateTime?`; confirm enum matches spec exactly
- docs impact: none beyond what `data-model.md` already captures

### T006 ✓

- objective: Write `prisma/seed.ts` — seed Alice, Bob, Carol with `demo1234` bcrypt
  hashes, plus one PaymentRequest with `status = PENDING` and `expiresAt` set to
  24 hours ago UTC (AC5 fixture). Add `prisma.seed` script to `package.json`.
- files: `prisma/seed.ts`, `package.json`
- validation: `npx prisma db seed` succeeds; DB contains 3 users and 1 past-expiry
  request with `status = PENDING` and `expiresAt < now()`
- evidence impact: all E2E tests depend on seeded users; AC5 depends on the past-expiry
  fixture being written as PENDING (not EXPIRED — see IG6)
- recommended lane: implementation
- reasoning / effort: straightforward seeding; critical correctness requirement on the
  past-expiry fixture
- required review: confirm past-expiry fixture is `status = PENDING` with
  `expiresAt = now() - 24h`; confirm bcrypt cost factor 10
- docs impact: update `docs/ASSUMPTIONS.md` with seed user credentials; update
  `README.md` with seed command

### T007 ✓

- objective: Implement `lib/prisma.ts` (singleton Prisma client), `lib/money.ts`
  (`parseDollars`, `formatCents`), and `lib/requests.ts` (`getEffectiveStatus`).
- files: `lib/prisma.ts`, `lib/money.ts`, `lib/requests.ts`
- validation:
  - `parseDollars("15.00")` returns `1500`; `parseDollars("0")` throws; `parseDollars("15.999")` throws
  - `formatCents(1500)` returns `"$15.00"`; `formatCents(1)` returns `"$0.01"`
  - `getEffectiveStatus({ status: "PENDING", expiresAt: yesterday })` returns `"EXPIRED"`
  - `getEffectiveStatus({ status: "PENDING", expiresAt: tomorrow })` returns `"PENDING"`
  - `getEffectiveStatus({ status: "PAID", expiresAt: yesterday })` returns `"PAID"`
- evidence impact: `getEffectiveStatus` is the core expiration mechanism; AC5 depends on
  it being exercised by E2E, not bypassed
- recommended lane: implementation
- reasoning / effort: pure utility functions; high correctness value; testable in isolation
- required review: confirm Zod chain in `parseDollars`:
  `z.string().regex(...).transform(...).pipe(z.number().int().positive())`; no two-step
  validation
- docs impact: none

### T008 ✓

- objective: Implement `lib/auth.ts` — iron-session config (`SESSION_SECRET`, cookie
  options), `getSession(request)` helper, and `requireSession(request)` that throws
  a 401 Response if no session.
- files: `lib/auth.ts`
- validation: `getSession` returns null on an unauthenticated request; `requireSession`
  returns the session user on an authenticated request and throws a `Response(401)` on
  an unauthenticated one
- evidence impact: all protected routes depend on this; auth bypass would affect AC6, AC7
- recommended lane: implementation
- reasoning / effort: thin wrapper; low risk; iron-session is well-documented
- required review: confirm `sameSite: "lax"`, `httpOnly: true`, `secure: true` in
  production; confirm session type includes `userId: string`
- docs impact: none

---

## Phase 3 — Auth (US1)

**Story goal**: A user can log in with a seeded email and password, and log out. All
protected pages require a valid session.

### T009 ✓

- objective: Implement `POST /api/auth/login` — validate email + password with Zod,
  look up user by email, compare bcrypt hash, set iron-session cookie, return user.
- files: `app/api/auth/login/route.ts`
- validation: `POST /api/auth/login` with valid credentials returns 200 + user JSON +
  sets session cookie; with wrong password returns 401; with missing fields returns 400
- evidence impact: all E2E tests start with a login call; if this is flaky, all tests fail
- recommended lane: implementation
- reasoning / effort: thin route handler; standard auth pattern
- required review: confirm password is compared with `bcrypt.compare`, not plain equality;
  confirm session is written before response is returned
- docs impact: none

### T010 ✓

- objective: Implement `POST /api/auth/logout` and `GET /api/auth/me`.
- files: `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`
- validation: `POST /api/auth/logout` clears session cookie; `GET /api/auth/me` returns
  current user when authenticated, 401 when not
- evidence impact: logout used in E2E user-switching between Alice and Bob
- recommended lane: implementation
- reasoning / effort: two trivial route handlers
- required review: confirm logout destroys session (not just expires cookie)
- docs impact: none

### T011 ✓

- objective: Implement `app/(auth)/login/page.tsx` — login form with email + password
  fields, loading state, inline error on failure, redirect to `/dashboard/outgoing`
  on success.
- files: `app/(auth)/login/page.tsx`
- validation: login with valid credentials redirects to dashboard; with invalid
  credentials shows inline error without page reload; loading state visible during submit
- evidence impact: E2E smoke path depends on login UI working
- recommended lane: implementation
- reasoning / effort: standard form; Tailwind styling; no complex state
- required review: confirm form shows field-level error (not alert/toast) on bad creds
- docs impact: none

### T012 ✓

- objective: Implement `app/(protected)/layout.tsx` — server component that calls
  `requireSession`; redirects to `/login` on missing session.
- files: `app/(protected)/layout.tsx`
- validation: navigating to `/dashboard/outgoing` without a session redirects to `/login`;
  with a session renders the child page
- evidence impact: all E2E tests depend on this guard working correctly
- recommended lane: implementation
- reasoning / effort: thin layout; one server-side check
- required review: confirm redirect uses `redirect()` from `next/navigation` inside a
  server component, not a client-side guard
- docs impact: none

---

## Phase 4 — Create Payment Request (US2)

**Story goal**: An authenticated user can create a payment request with recipient email,
dollar amount, and optional note. The request is created in PENDING state with a 7-day
expiry. (AC1, AC10, AC11, AC13)

### T013 ✓

- objective: Implement `POST /api/requests` — Zod validation (amountDollars via single
  chain, recipientEmail, note max 200 chars), resolve recipient by email (404 if not
  found), self-request check by `recipient.id !== session.userId`, create request with
  `expiresAt = now + 7 days`, return `PaymentRequestDTO`.
- files: `app/api/requests/route.ts`
- validation:
  - valid payload → 201 + request in PENDING state with correct `expiresAt`
  - unknown recipient email → 404
  - self-request → 422
  - amount "0" → 400
  - amount "abc" → 400
  - note > 200 chars → 400
- evidence impact: AC1, AC10, AC11, AC13 all start here
- recommended lane: implementation
- reasoning / effort: most complex route — Zod chain + authorization + DB write; medium risk
- required review: confirm `recipient.id !== session.userId` (not email); confirm Zod
  chain uses `.transform(parseDollars).pipe(z.number().int().positive())`; confirm
  `expiresAt` is UTC
- docs impact: update `docs/BUILD_NOTES.md` if any deviation from plan

### T014 ✓

- objective: Implement `app/(protected)/requests/new/page.tsx` — create request form
  with recipient email, dollar-value amount, optional note. Show loading, success
  (redirect to detail page), and inline field errors.
- files: `app/(protected)/requests/new/page.tsx`
- validation: submitting valid form creates request and redirects to `/requests/[id]`;
  submitting zero amount shows inline error; submitting note > 200 chars shows inline
  error; submitting unknown email shows form-level error
- evidence impact: AC1 E2E covers this page
- recommended lane: implementation
- reasoning / effort: form with client-side validation mirroring server-side rules
- required review: confirm dollar-value input (not cents); confirm amount label makes
  the dollar format clear to the user
- docs impact: none

---

## Phase 5 — Dashboard Views (US3)

**Story goal**: An authenticated user can see their outgoing and incoming requests with
current statuses. EXPIRED requests appear in the list. (AC8, AC9)

### T015

- objective: Implement `GET /api/requests` (outgoing) and `GET /api/requests/incoming`
  — both apply `getEffectiveStatus()` to every item before returning; sort by
  `createdAt DESC`.
- files: `app/api/requests/route.ts` (GET handler added), `app/api/requests/incoming/route.ts`
- validation:
  - outgoing list returns only requests where `requesterId = session.userId`
  - incoming list returns only requests where `recipientId = session.userId`
  - PENDING + past `expiresAt` items return with status `EXPIRED` in the list
  - results are sorted newest-first
- evidence impact: AC8, AC9 E2E coverage; EXPIRED visibility on dashboard (IG4)
- recommended lane: implementation
- reasoning / effort: two list queries + effective-status mapping; low risk
- required review: confirm `getEffectiveStatus()` is applied to every item, not just
  on detail; confirm EXPIRED items are not filtered out
- docs impact: none

### T016

- objective: Implement `app/(protected)/dashboard/outgoing/page.tsx` and
  `app/(protected)/dashboard/incoming/page.tsx` — lists of requests with status badge,
  formatted amount, and countdown for PENDING requests. Link to detail page per row.
  Empty state message when no requests.
- files: `app/(protected)/dashboard/outgoing/page.tsx`,
  `app/(protected)/dashboard/incoming/page.tsx`
- validation: outgoing dashboard shows only the current user's sent requests; incoming
  shows only received; PENDING rows show a countdown derived from `expiresAt`; EXPIRED
  rows show EXPIRED badge
- evidence impact: AC8, AC9 E2E; visual evidence in Playwright video
- recommended lane: implementation
- reasoning / effort: two list pages; medium UI complexity (status badge + countdown)
- required review: confirm countdown is display-only (derived from `expiresAt`, not
  server polling); confirm `formatCents` used for amount display
- docs impact: none

### T017

- objective: Add root redirect — `app/page.tsx` redirects authenticated users to
  `/dashboard/outgoing` and unauthenticated users to `/login`.
- files: `app/page.tsx`
- validation: `/` redirects correctly for both auth states
- evidence impact: E2E start-of-test navigation lands correctly
- recommended lane: implementation
- reasoning / effort: two-line server component; trivial
- required review: none
- docs impact: update `README.md` with live demo URL once deployed

---

## Phase 6 — Request Detail and Actions (US4 + US5)

**Story goal**: The recipient can pay or decline a PENDING request. The requester can
cancel their own PENDING request. Wrong-actor and non-PENDING attempts are rejected.
(AC2, AC3, AC4, AC6, AC7)

### T018

- objective: Implement `GET /api/requests/[id]` — return full `PaymentRequestDTO`
  with effective status, 404 for nonexistent ID. Any authenticated user can view.
- files: `app/api/requests/[id]/route.ts`
- validation: valid ID → 200 + full DTO; nonexistent ID → 404; PENDING + past `expiresAt`
  → effective status EXPIRED in response
- evidence impact: AC12, shareable link, Observer path all depend on this
- recommended lane: implementation
- reasoning / effort: single read route; thin
- required review: confirm `getEffectiveStatus()` applied before returning; confirm 404
  (not 403) for any nonexistent ID regardless of auth status
- docs impact: none

### T019

- objective: Implement `POST /api/requests/[id]/pay` — recipient only; conditional
  write `WHERE id = ? AND status = 'PENDING' AND expiresAt > NOW()`; return 409 if
  rowsAffected = 0; set `paidAt`; return updated DTO.
- files: `app/api/requests/[id]/pay/route.ts`
- validation:
  - recipient pays PENDING request → 200 + status PAID
  - requester tries to pay own request → 403
  - second concurrent pay call after first succeeds → 409
  - pay attempt on EXPIRED request → 409
- evidence impact: AC2, AC7; concurrent-submit regression watchlist (RW1)
- recommended lane: implementation
- reasoning / effort: highest-risk route — conditional write required (CR1+CR2)
- required review: confirm `WHERE status = 'PENDING' AND expiresAt > NOW()` in the
  Prisma updateMany; confirm `rowsAffected` check; confirm `paidAt = now()` set atomically
- docs impact: update `docs/BUILD_NOTES.md` with conditional write pattern if Prisma
  raw query was needed

### T020

- objective: Implement `POST /api/requests/[id]/decline` — same conditional write
  pattern as T019; recipient only; set `declinedAt`.
- files: `app/api/requests/[id]/decline/route.ts`
- validation: same pattern as T019 for decline; wrong actor → 403; non-PENDING → 409
- evidence impact: AC3, AC7
- recommended lane: implementation
- reasoning / effort: parallel to T019; low marginal effort
- required review: same conditional write review as T019
- docs impact: none

### T021

- objective: Implement `POST /api/requests/[id]/cancel` — requester only; same
  conditional write pattern; set `cancelledAt`.
- files: `app/api/requests/[id]/cancel/route.ts`
- validation: requester cancels PENDING → 200 + CANCELLED; recipient tries → 403;
  non-PENDING → 409
- evidence impact: AC4, AC7
- recommended lane: implementation
- reasoning / effort: parallel to T019/T020
- required review: same conditional write review
- docs impact: none

### T022

- objective: Implement `app/(protected)/requests/[id]/page.tsx` — request detail view
  showing all fields, formatted amount, status badge, expiry countdown for PENDING.
  Action buttons shown conditionally: Pay + Decline if viewer is recipient and status
  is PENDING; Cancel if viewer is requester and status is PENDING; no buttons otherwise.
  Show not-found state for 404.
- files: `app/(protected)/requests/[id]/page.tsx`
- validation:
  - recipient sees Pay + Decline buttons on PENDING request
  - requester sees Cancel button on PENDING request
  - Observer sees no buttons
  - EXPIRED request shows EXPIRED badge, no buttons for any actor
  - nonexistent ID shows not-found message, no buttons
- evidence impact: AC2, AC3, AC4, AC6, AC7, AC12; visual evidence in Playwright video
- recommended lane: implementation
- reasoning / effort: most complex UI component — role-based conditional rendering
- required review: confirm role check is derived from session user vs. request fields
  (server-side, not client-only); confirm no action buttons shown for terminal states
- docs impact: none

---

## Phase 7 — Expiration and Shareable Link (US6 + US7)

**Story goal**: Expiration is enforced server-side and displayed in the UI. Shareable
links work for all actors including unauthenticated users (redirected to login with
return path). (AC5, AC6, AC12)

### T023

- objective: Add middleware (`middleware.ts`) to redirect unauthenticated requests for
  `/requests/[id]` to `/login?next=/requests/[id]`. Update login page to redirect to
  the `next` param after successful login.
- files: `middleware.ts`, `app/(auth)/login/page.tsx` (update)
- validation: unauthenticated visit to `/requests/abc-123` redirects to
  `/login?next=/requests/abc-123`; after login, redirected back to `/requests/abc-123`
- evidence impact: shareable link unauthenticated flow (spec Edge Cases)
- recommended lane: implementation
- reasoning / effort: Next.js middleware pattern; medium complexity (return-to URL param)
- required review: confirm `next` param is validated before redirect to prevent open
  redirect (must be a relative path starting with `/`)
- docs impact: none

### T024

- objective: Verify expiration enforcement end-to-end: the past-expiry seed fixture
  (PENDING + past `expiresAt`) returns EXPIRED from the API, shows EXPIRED badge in
  the UI, and shows no action buttons. Add a countdown component used in T016 and T022.
- files: `components/ExpiryCountdown.tsx` (or inline in page)
- validation: loading the seeded past-expiry request in the browser shows EXPIRED badge
  and no Pay/Decline/Cancel buttons; countdown shows positive time remaining for a
  fresh PENDING request and zero (or hidden) for an expired one
- evidence impact: AC5; this is the key expiration E2E path
- recommended lane: implementation
- reasoning / effort: countdown is display-only (no polling); uses `expiresAt` from DTO
- required review: confirm countdown is purely derived from `expiresAt` ISO string, not
  from any server-computed field; confirm no countdown shown for non-PENDING states
- docs impact: none

---

## Phase 8 — E2E Test Suite

**Story goal**: All 13 ACs have explicit Playwright coverage. Video and trace artifacts
are collected for reviewer evidence.

### T025 ✓

- objective: E2E test — happy path create + pay (AC1, AC2). Alice logs in, creates
  request to Bob for $15.00 with note "Dinner". Bob logs in, navigates to incoming
  dashboard, opens request, pays. Assert status = PAID on both dashboards.
- files: `e2e/happy-path.spec.ts`
- validation: test passes; video artifact shows the full flow; request in DB has
  status PAID and `paidAt` set
- evidence impact: primary video evidence for submission
- recommended lane: implementation
- reasoning / effort: most complete test; tests multiple pages and API calls
- required review: confirm Alice and Bob use different sessions (not shared state);
  confirm outgoing dashboard shows PAID after Bob pays
- docs impact: update `docs/VIDEO_EVIDENCE_GUIDE.md` with artifact path

### T026 ✓

- objective: E2E tests — decline (AC3) and cancel (AC4). Two separate test cases.
  Bob declines a request from Alice. Alice cancels her own request.
- files: `e2e/actions.spec.ts`
- validation: decline test → status DECLINED; cancel test → status CANCELLED; wrong
  actor (Alice tries to decline her own sent request) → action blocked
- evidence impact: AC3, AC4 coverage
- recommended lane: implementation
- reasoning / effort: parallel to T025; reuse login helpers
- required review: confirm DECLINED and CANCELLED are terminal — no further actions shown
- docs impact: none

### T027 ✓

- objective: E2E test — expiration (AC5). Load the pre-seeded past-expiry request
  (status=PENDING, expiresAt yesterday). Bob tries to pay → server rejects. Assert
  UI shows EXPIRED badge and no action buttons.
- files: `e2e/expiration.spec.ts`
- validation: test passes; `getEffectiveStatus()` is exercised (not bypassed by a
  pre-EXPIRED seed record); response status = EXPIRED; no action buttons in UI
- evidence impact: AC5; validates the core expiration enforcement path
- recommended lane: implementation
- reasoning / effort: depends on seed fixture correctness (T006); medium
- required review: confirm seed fixture has `status = PENDING` (not EXPIRED) before
  this test runs
- docs impact: none

### T028 ✓

- objective: E2E tests — authorization and Observer (AC6, AC7). Carol visits Alice's
  request via shareable link → sees detail, no action buttons. Alice tries to pay her
  own request via API → 403.
- files: `e2e/authorization.spec.ts`
- validation: Observer test → Carol sees all fields, zero action buttons; wrong-actor
  API test → 403 with meaningful error
- evidence impact: AC6, AC7
- recommended lane: implementation
- reasoning / effort: two tests; straightforward after login helper is in place
- required review: confirm Carol's session is set up independently from Alice/Bob
- docs impact: none

### T029 ✓

- objective: E2E tests — dashboards, validation, not-found (AC8, AC9, AC10, AC11,
  AC12, AC13). Outgoing dashboard shows correct requests in reverse-chronological order.
  Incoming dashboard shows correct requests. Amount "0" rejected. Self-request rejected.
  Note > 200 chars rejected. Nonexistent request ID shows not-found state.
- files: `e2e/validation.spec.ts`
- validation: all assertions pass; ordering verified by comparing `createdAt` of
  displayed rows; each validation rejection shows an inline error
- evidence impact: AC8–AC13 coverage
- recommended lane: implementation
- reasoning / effort: multiple assertions in one file; medium effort
- required review: confirm ordering test creates two requests at different timestamps
  and checks display order
- docs impact: none

---

## Phase 9 — Deployment and Evidence

### T030 ✓

- objective: Configure Vercel deployment — `vercel.json` if needed, `build` command
  includes `prisma generate && prisma migrate deploy`, set required env vars in Vercel
  dashboard (`DATABASE_URL`, `SESSION_SECRET`).
- files: `vercel.json` (if needed), `package.json` build script update
- validation: Vercel preview deployment succeeds; migrations run; app loads at preview URL
- evidence impact: live demo URL required for submission; README demo link
- recommended lane: implementation
- reasoning / effort: Vercel + Next.js + Prisma is a well-documented combination;
  main risk is DATABASE_URL connection string format for serverless
- required review: confirm `?pgbouncer=true&connect_timeout=10` in Supabase
  `DATABASE_URL` for serverless; confirm seed not run automatically on deploy
- docs impact: update `README.md` with demo URL; update `docs/BUILD_NOTES.md` with
  any deployment gotchas

### T031 ✓

- objective: Run `scripts/3-run_e2e_evidence.sh` against the deployed demo or local
  dev. Confirm video artifacts and Playwright traces are produced and stored in
  `e2e-evidence/`. Update evidence references in `README.md`.
- files: `e2e-evidence/` (artifact directory), `README.md`
- validation: `e2e-evidence/` contains `.webm` video files and `.zip` trace files;
  `README.md` evidence section links to artifact paths or external storage
- evidence impact: this is the evidence deliverable; without it, AC-level E2E coverage
  cannot be reviewed
- recommended lane: implementation
- reasoning / effort: evidence collection is first-class work; not cleanup
- required review: confirm all 13 ACs have at least one associated video frame visible;
  confirm trace files open in Playwright Trace Viewer
- docs impact: update `README.md` evidence section; update `docs/VIDEO_EVIDENCE_GUIDE.md`

---

## Mandatory Final Tasks

- finalize `README.md` — add demo URL, seed credentials, evidence links, local dev steps
- update `docs/AI_PROCESS.md` — implementation phase entries
- update `docs/ASSUMPTIONS.md` — any assumption changes during implementation
- update `docs/BUILD_NOTES.md` — manual decisions, AI corrections, deployment gotchas
- run full E2E suite against deployed demo
- collect video artifacts (`.webm`) in `e2e-evidence/`
- collect Playwright trace artifacts (`.zip`) in `e2e-evidence/`
- run `/ship-check` before final submission

---

## Phase 10 — Phone Field Foundation (AC20-AC23 prerequisite)

**Batch goal**: Add `phone` to the User model and DTO. No UI changes yet. Safe to
validate and stop here — existing tests must remain green. No downstream breakage risk.

### T032

- [x] T032 Add `phone String? @unique` to User model in `prisma/schema.prisma` and generate a new migration named `add_user_phone`
- objective: Extend the User model with an optional unique phone field. Create a Prisma
  migration that adds the column without touching existing rows.
- files: `prisma/schema.prisma`, `prisma/migrations/` (new migration directory)
- validation: `npx prisma migrate dev --name add_user_phone` succeeds; `npx prisma generate`
  produces updated client with `phone?: string | null` on User type; existing rows have
  `phone = NULL` (no data loss)
- evidence impact: prerequisite for AC20-AC23
- recommended lane: implementation
- reasoning / effort: schema-only change; no application logic; very low risk
- required review: confirm `@unique` and nullable (`String?`) are both on the field;
  confirm migration file adds `ALTER TABLE "User" ADD COLUMN "phone" TEXT`
- docs impact: update `specs/001-p2p-payment-request/data-model.md` Prisma schema block
  (already done in plan pass)

### T033

- [x] T033 Update `prisma/seed.ts` to set phone numbers on Alice, Bob, and Carol (+15550001111, +15550002222, +15550003333)
- objective: Give all three seeded demo users phone numbers so phone-lookup E2E tests
  have stable, known values.
- files: `prisma/seed.ts`
- validation: `npx prisma db seed` (or `DATABASE_URL=<direct> npx prisma db seed`) succeeds;
  `SELECT phone FROM "User"` returns three non-null rows; re-running seed is idempotent
  (upsert, not insert)
- evidence impact: required for AC21, AC22, AC23 E2E tests
- recommended lane: implementation
- reasoning / effort: data-only change; the seed already uses upsert; minimal risk
- required review: confirm seed uses `upsert` not `create` so re-runs don't fail on unique
  constraint; confirm phone values match spec (+15550001111 / +15550002222 / +15550003333)
- docs impact: update `specs/001-p2p-payment-request/data-model.md` Seed Users table (done)

### T034

- [x] T034 Add `requesterPhone: string | null` and `recipientPhone: string | null` to `PaymentRequestDTO` in `lib/dto.ts`
- objective: Expose requester and recipient phone numbers in the DTO so dashboards can
  include phone in search matching. No API or UI changes yet.
- files: `lib/dto.ts`
- validation: `npm run build` passes without TypeScript errors; `GET /api/requests/[id]`
  response includes `recipientPhone` and `requesterPhone` fields (null for users without
  phone, phone string for seeded users)
- evidence impact: prerequisite for US3 phone search
- recommended lane: implementation
- reasoning / effort: three-line change to interface + mapping function; very low risk
- required review: confirm both fields are sourced from `req.requester.phone ?? null` and
  `req.recipient.phone ?? null` (not hardcoded or computed); confirm TypeScript builds clean
- docs impact: none (contracts/api.md DTO section already updated)

---

**Batch checkpoint**: After T034, run `npm run build` and `npx playwright test e2e/smoke.spec.ts`.
All 15 existing E2E tests must remain green before continuing to T035.

---

## Phase 11 — Phone Recipient API and Form (AC20-AC23)

**Batch goal**: Accept `recipientPhone` on the create endpoint and wire up the
Email/Phone toggle in the form. After this batch: AC20-AC23 are implementable
in E2E (T045 in Phase 15).

### T035

- [x] T035 [US1] Update `POST /api/requests` in `app/api/requests/route.ts` to accept `recipientPhone` as an alternative to `recipientEmail`
- objective: Extend the create-request Zod schema and handler to accept exactly one of
  `recipientEmail` or `recipientPhone`. Phone path: validate format with
  `/^\+?[1-9]\d{6,14}$/`, look up user by exact phone match, apply same 404/422 guards
  as email path.
- files: `app/api/requests/route.ts`
- validation: `POST /api/requests` with `{ recipientPhone: "+15550002222", amountDollars: "10.00" }`
  creates a PENDING request for Bob; invalid format returns 400; unregistered phone returns
  404; own phone returns 422; both fields provided returns 400; neither provided returns 400
- evidence impact: AC21, AC22, AC23
- recommended lane: implementation
- reasoning / effort: Zod refine + one DB lookup path; medium; no data model changes needed
- required review: confirm self-request check uses `recipient.id !== session.userId` (UUID,
  not string comparison); confirm both fields in body at once is rejected; confirm
  `include: { requester: true, recipient: true }` on the final findUnique for DTO mapping
- docs impact: none (contracts/api.md already updated)

### T036

- [x] T036 [US1] Add Email/Phone toggle to the create request form in `app/(protected)/requests/new/page.tsx`
- objective: Add `identificationMethod` state (`'email' | 'phone'`). Render two toggle
  buttons; show only the active input. Phone input is plain text with placeholder
  "+15551234567". Switching toggle clears the hidden field's state. Submit sends
  `recipientPhone` or `recipientEmail` based on active mode.
- files: `app/(protected)/requests/new/page.tsx`
- validation: Toggle switches visible input; hidden field is cleared on toggle; submitting
  with phone sends `recipientPhone` in body; server returns created request; "recipient not
  found" error renders for unregistered phone; self-request error renders for own phone
- evidence impact: AC20
- recommended lane: implementation
- reasoning / effort: state + conditional render; medium; no new dependencies
- required review: confirm switching Email → Phone clears `recipientEmail` state (and vice
  versa); confirm phone field has `type="text"` and `inputMode="tel"` (not `type="tel"` to
  avoid browser masking); confirm placeholder is "+15551234567"
- docs impact: none

---

**Batch checkpoint**: After T036, manually test create form with phone in dev. Verify
existing email path still works. Optionally run `npx playwright test e2e/happy-path.spec.ts`
to confirm AC1/AC2 regression-free before continuing.

---

## Phase 12 — Dashboard Status Filter (AC14-AC16)

**Batch goal**: Pill/tab status filter on both dashboards, URL-driven, soft-navigation.
After this batch: AC14, AC15, AC16 verifiable manually and in E2E.

### T037

- [x] T037 [US2] Create `components/FilterBar.tsx` — horizontal pill buttons for status filter
- objective: Client component that renders 6 pill buttons (ALL, PENDING, PAID, DECLINED,
  CANCELLED, EXPIRED). The active pill is visually highlighted. Clicking a pill calls
  `router.push` to update `?status=` in the URL (removes param for ALL). Reads current
  active status from a prop passed by the parent page.
- files: `components/FilterBar.tsx`
- validation: Component renders 6 pills; clicking PENDING adds `?status=PENDING` to URL;
  clicking ALL removes the `?status=` param; active pill has distinct visual style
  (e.g. filled background vs outline); component is client-only (`"use client"`)
- evidence impact: AC14
- recommended lane: implementation
- reasoning / effort: pure UI component; no data fetching; low risk
- required review: confirm `router.push` is used (not `replace`) so filter navigation
  adds history entries; confirm ALL removes the param (not sets it to "ALL"); confirm
  `useSearchParams` or prop is used to determine current active state
- docs impact: none

### T038

- [x] T038 [US2] Update `GET /api/requests` and `GET /api/requests/incoming` in their route files to apply `?status=` filtering after `getEffectiveStatus()` computation
- objective: Accept `?status=` query param. Fetch all user records from DB (unchanged).
  Map to DTOs (which applies `getEffectiveStatus()`). Filter the DTO array by effective
  status. Return filtered result. ALL or missing param returns full array.
- files: `app/api/requests/route.ts`, `app/api/requests/incoming/route.ts`
- validation: `GET /api/requests?status=PAID` returns only requests with effective status PAID;
  `GET /api/requests?status=EXPIRED` includes PENDING rows past `expiresAt` (implicit expiry);
  `GET /api/requests?status=ALL` and missing param both return everything; invalid value
  defaults to ALL (no error)
- evidence impact: AC15, AC16
- recommended lane: implementation
- reasoning / effort: three-line filter in each handler; correctness of EXPIRED filter
  is the main review point
- required review: confirm filter is applied on the DTO array (after `getEffectiveStatus`)
  NOT on the raw Prisma result; confirm EXPIRED filter catches both `status='EXPIRED'` rows
  AND PENDING rows past expiresAt; confirm invalid status param silently defaults to ALL
- docs impact: none

### T039

- [x] T039 [US2] Update outgoing and incoming dashboard pages to read `searchParams.status`, pass to API fetch URL, and render `<FilterBar>` with current status value
- objective: Both server component pages receive `searchParams` from Next.js App Router.
  Pass `?status=` to the respective API fetch call. Pass the current status value to
  `<FilterBar>` as `activeStatus` prop. When the filtered result is empty, show "No
  requests match this filter." instead of the default empty state.
- files: `app/(protected)/dashboard/outgoing/page.tsx`,
  `app/(protected)/dashboard/incoming/page.tsx`
- validation: Clicking PAID pill renders only PAID requests in list; URL shows `?status=PAID`;
  no full page reload (Next.js soft navigation); clicking ALL restores full list; when
  filtered to a status with no matching requests, "No requests match this filter." text shown
- evidence impact: AC14, AC15, AC16 — full end-to-end
- recommended lane: implementation
- reasoning / effort: medium; requires passing searchParams to fetch URL; main risk is
  cache invalidation on filter change (Next.js revalidation)
- required review: confirm `<FilterBar>` receives `activeStatus` correctly; confirm empty
  state message is distinct from the "No requests yet" default empty state; confirm page
  re-renders correctly on filter change without full reload
- docs impact: none

---

**Batch checkpoint**: After T039, test filter on both dashboards manually. Verify EXPIRED
filter includes past-expiry requests. Run existing E2E to confirm no regressions.

---

## Phase 13 — Dashboard Search (AC17-AC19)

**Batch goal**: Debounced counterparty search on both dashboards, combinable with
status filter, URL-driven. After this batch: AC17, AC18, AC19 verifiable.

### T040

- [x] T040 [US3] Create `components/SearchInput.tsx` — debounced search input (300ms, router.replace)
- objective: Client component that renders a text input. On change, starts a 300ms
  debounce timer (clearing previous timer on each keystroke). After 300ms, calls
  `router.replace` to update `?search=` in the URL (removes param when empty). Reads
  current value from `searchParams.search` via prop or `useSearchParams`.
- files: `components/SearchInput.tsx`
- validation: Typing "bob" waits 300ms then updates URL to `?search=bob`; typing quickly
  only fires one URL update; clearing input removes `?search=` param; component is
  `"use client"`; does not clobber the existing `?status=` param when updating `?search=`
- evidence impact: AC17, AC19
- recommended lane: implementation
- reasoning / effort: debounce pattern with `useEffect` + `useRef` for timer; medium;
  preserving existing URL params is the main correctness point
- required review: confirm `router.replace` is used (not `push`) to avoid search history
  spam; confirm existing `?status=` param is preserved when updating `?search=` (use
  `URLSearchParams` to merge params, not replace the whole search string); confirm timer
  cleanup on unmount
- docs impact: none

### T041

- [x] T041 [US3] Update `GET /api/requests` and `GET /api/requests/incoming` to apply `?search=` filtering after status filter
- objective: Accept `?search=` query param. After status filtering, further filter the DTO
  array by case-insensitive substring match on the counterparty's name, email, and phone
  (OR logic). On outgoing dashboard the counterparty is the recipient; on incoming the
  counterparty is the requester. Empty or missing search param is treated as no filter.
- files: `app/api/requests/route.ts`, `app/api/requests/incoming/route.ts`
- validation: `GET /api/requests?search=bob` returns only requests where recipient name,
  email, or phone contains "bob" (case-insensitive); `GET /api/requests?search=+155` matches
  phone prefix; `GET /api/requests?status=PAID&search=bob` applies both filters; missing
  search returns all (subject to status filter); phone null values do not throw
- evidence impact: AC17, AC18
- recommended lane: implementation
- reasoning / effort: JS array filter after DTO mapping; small; phone null guard is
  the main correctness point
- required review: confirm null phone does not cause `.toLowerCase()` crash (guard with
  `?? ''`); confirm both params can combine correctly; confirm search runs on DTO fields
  (not raw DB fields) so phone is available
- docs impact: none

### T042

- [x] T042 [US3] Update outgoing and incoming dashboard pages to read `searchParams.search`, pass to API fetch URL, and render `<SearchInput>`
- objective: Both dashboard pages already read `searchParams` from Next.js App Router.
  Add `search` to the API fetch URL. Render `<SearchInput>` above the list, passing
  current search value. When both filter and search produce an empty result, show the
  same "No requests match this filter." message.
- files: `app/(protected)/dashboard/outgoing/page.tsx`,
  `app/(protected)/dashboard/incoming/page.tsx`
- validation: Typing in search box filters list after 300ms; combined with status filter
  both params active simultaneously; URL shows `?status=PENDING&search=bob` when both
  active; clearing search restores full filtered-by-status list; no full page reload
- evidence impact: AC17, AC18, AC19 — full end-to-end
- recommended lane: implementation
- reasoning / effort: additive to T039; main risk is correct param merging in fetch URL
- required review: confirm fetch URL builds `?status=X&search=Y` when both params present;
  confirm `<SearchInput>` is above `<FilterBar>` or adjacent (layout choice); confirm
  empty state handles combined filter+search correctly
- docs impact: none

---

**Batch checkpoint**: After T042, test search on both dashboards manually with status
filter active. Try searching by phone number. Run existing E2E to confirm no regressions.

---

## Phase 14 — Pay Simulation and Success Confirmation (AC24-AC25)

**Batch goal**: 2-3s pay delay on the server + spinner + auto-dismiss success banner
on the client. Thin and isolated — only two files touched.

### T043

- [x] T043 [US4] Add 2-3s artificial delay to `POST /api/requests/[id]/pay` in `app/api/requests/[id]/pay/route.ts`
- objective: Insert `await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))`
  AFTER the 403 authorization check and BEFORE the conditional `updateMany` write. This
  simulates payment rail latency without changing any business logic or state transitions.
- files: `app/api/requests/[id]/pay/route.ts`
- validation: A pay request takes 2-3 seconds to respond; 403 and 404 responses remain
  immediate (delay is not hit on those paths); 409 responses (expired/already acted)
  still work correctly after the delay; the conditional write still executes and returns
  correct result
- evidence impact: AC24
- recommended lane: implementation
- reasoning / effort: one line added in the correct position; extremely low risk; the
  main review point is placement (after auth, before write)
- required review: confirm delay is placed AFTER `if (existing.recipientId !== session.userId)`
  403 check and BEFORE `prisma.paymentRequest.updateMany`; confirm decline and cancel
  routes are NOT modified (they remain immediate per spec)
- docs impact: update `docs/BUILD_NOTES.md` with the delay decision

### T044

- [x] T044 [US4] Update request detail page `app/(protected)/requests/[id]/page.tsx` — add spinner to Pay button, add `paySuccess` state and auto-dismiss success banner
- objective: Three changes to the existing client component:
  (1) When `loading` is true and the action is `pay`, show an `animate-spin` SVG spinner
  inline in the Pay button alongside "Processing payment…" text.
  (2) Add `paySuccess` boolean state. On successful pay response, set `paySuccess(true)`.
  (3) Render a green banner when `paySuccess` is true: "Payment successful!" with an X
  button for manual dismiss. `useEffect` auto-sets `paySuccess(false)` after 5000ms.
  Decline and Cancel buttons are not modified.
- files: `app/(protected)/requests/[id]/page.tsx`
- validation: Clicking Pay shows spinner for ~2s; green banner appears on success with
  "Payment successful!" text; banner auto-disappears after 5s; X button dismisses it
  immediately; clicking Decline shows no spinner; action error (409) exits loading state
  and shows error message (unchanged behavior)
- evidence impact: AC24, AC25
- recommended lane: implementation
- reasoning / effort: state additions + useEffect; medium; main risk is the 5s timer
  cleanup on unmount and correct placement relative to existing action error handling
- required review: confirm `paySuccess` is reset to false when `fetchRequest()` is called
  again (e.g. on error re-fetch); confirm timer is cleared on component unmount via
  `useEffect` cleanup return; confirm spinner only appears during Pay (not Decline/Cancel);
  confirm banner renders above the action buttons area, not replacing them
- docs impact: none

---

**Batch checkpoint**: After T044, manually test the full pay flow in browser: click Pay,
observe spinner for 2-3s, observe green banner, wait 5s for auto-dismiss. Test X button.
Test Decline to confirm no spinner. Run `npx playwright test e2e/happy-path.spec.ts`
to confirm AC2 still passes (pay flow works end-to-end with the delay).

---

## Phase 15 — E2E Evidence for New Features (AC14-AC25)

**Story goal**: All 12 new ACs (AC14-AC25) have explicit Playwright coverage alongside
the existing 13. Video and trace artifacts collected for all.

### T045

- [x] T045 [US1] Write E2E tests for phone recipient in `e2e/phone.spec.ts` (AC20-AC23)
- objective: Four test cases:
  (AC20) Create form shows Email/Phone toggle; clicking Phone hides email input and shows
  phone input.
  (AC21) Alice creates a request via Bob's seeded phone (+15550002222); request appears
  as PENDING in outgoing dashboard.
  (AC22) Alice enters an unregistered phone; "recipient not found" error shown inline.
  (AC23) Alice enters her own phone (+15550001111); self-request rejection shown inline.
- files: `e2e/phone.spec.ts`
- validation: All 4 test cases pass; video artifacts show the form toggle and error states;
  AC21 test confirms created request ID exists in DB via dashboard appearance
- evidence impact: AC20-AC23 video evidence
- recommended lane: implementation
- reasoning / effort: follows existing login helper pattern; medium; uses Bob's seeded phone
- required review: confirm seeded phones match the values in seed.ts (T033); confirm
  AC21 test verifies PENDING status on outgoing dashboard (not just creation response);
  confirm test isolation (each test creates a fresh request)
- docs impact: update `docs/VIDEO_EVIDENCE_GUIDE.md` with new artifact paths

### T046

- [x] T046 [US2] [US3] Write E2E tests for filter and search in `e2e/filter-search.spec.ts` (AC14-AC19)
- objective: Six test cases:
  (AC14) Both outgoing and incoming dashboards show 6 pill buttons (ALL, PENDING, PAID,
  DECLINED, CANCELLED, EXPIRED).
  (AC15) Selecting PAID on outgoing shows only PAID requests; URL shows `?status=PAID`.
  (AC16) Selecting EXPIRED includes the pre-seeded past-expiry request.
  (AC17) Typing "bob" in search on outgoing dashboard filters to requests with Bob as
  recipient (by name or email).
  (AC18) Combining status=PENDING and search="bob" produces the correct intersection.
  (AC19) Filter + search changes do not cause full page reload (URL changes, list updates).
- files: `e2e/filter-search.spec.ts`
- validation: All 6 test cases pass; video artifacts show pill selection, URL param updates,
  and search behavior; AC16 uses the existing past-expiry seed fixture
- evidence impact: AC14-AC19 video evidence
- recommended lane: implementation
- reasoning / effort: builds on existing dashboard locator patterns; medium; AC16 re-uses
  the T006 seed fixture
- required review: confirm AC19 "no full page reload" is verified via URL param change
  without `page.reload()` being called (soft navigation); confirm AC16 uses the seeded
  past-expiry fixture (not a newly created expired request)
- docs impact: update `docs/VIDEO_EVIDENCE_GUIDE.md`

### T047

- [x] T047 [US4] Write E2E tests for pay simulation in `e2e/pay-simulation.spec.ts` (AC24-AC25)
- objective: Two test cases:
  (AC24) Alice creates a request; Bob opens it and clicks Pay; spinner is visible and
  Pay button is disabled; after ~2-3s the request transitions to PAID.
  (AC25) After payment, a green success banner containing "Payment successful!" is
  visible alongside the PAID status badge. Bob clicks Decline on a separate request —
  no spinner visible.
- files: `e2e/pay-simulation.spec.ts`
- validation: AC24: `page.locator('[data-testid="pay-spinner"]')` (or equivalent Tailwind
  `animate-spin` class locator) is visible between click and success; button is disabled
  during processing. AC25: banner with "Payment successful!" text is visible after
  success; Decline test completes without spinner class present.
- evidence impact: AC24-AC25 video evidence (the spinner + banner are the visual evidence)
- recommended lane: implementation
- reasoning / effort: medium; timing-sensitive test; use `page.waitForSelector` or
  Playwright's built-in `toBeVisible` with timeout
- required review: confirm spinner locator matches the actual element class/attribute
  used in T044 (coordinate with implementation); confirm test does not rely on exact
  2-3s delay (use `waitForSelector` with generous timeout, not `page.waitForTimeout`);
  confirm AC25 Decline test uses a fresh PENDING request
- docs impact: update `docs/VIDEO_EVIDENCE_GUIDE.md`

### T048

- [x] T048 Re-run full E2E evidence suite against production, collect artifacts for all 25 ACs, update README and docs
- objective: Run `BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .`
  after deploying all T032-T047 changes. Collect 25 video + 25 trace artifacts (15
  existing + 10 new from T045-T047 split across 3 spec files). Update README evidence
  section and `docs/VIDEO_EVIDENCE_GUIDE.md` with new artifact names.
- files: `artifacts/videos/` (new artifacts), `artifacts/traces/` (new traces),
  `README.md`, `docs/VIDEO_EVIDENCE_GUIDE.md`
- validation: All 25+ E2E tests pass against production deployment; `artifacts/videos/`
  contains named `.webm` files including `phone-AC20-AC23-*.webm`,
  `filter-search-AC14-AC19-*.webm`, `pay-simulation-AC24-AC25-*.webm`; README evidence
  section reflects 25 ACs
- evidence impact: primary submission evidence for new ACs
- recommended lane: implementation
- reasoning / effort: evidence collection is first-class work; deploy to Vercel first,
  seed phone numbers on production DB, then collect
- required review: confirm production DB has phone numbers seeded (T033 against
  production with DIRECT_URL); confirm all 25 tests pass before collecting artifacts;
  confirm `scripts/3-run_e2e_evidence.sh` handles the 3 new spec files correctly
- docs impact: `README.md` evidence status line updated to "25/25 tests pass";
  `docs/VIDEO_EVIDENCE_GUIDE.md` artifact list updated

---

## Phase 16 — Contact Summary Card Foundation (AC26-AC32) — Batch C-1

**Batch goal**: Create the two new modules — `lib/contact-metrics.ts` (detection + metrics
computation) and `components/ContactSummaryCard.tsx` (display component). No dashboard
page changes in this batch. After this batch: the card component is renderable in isolation
and TypeScript strict compilation passes.

**Batch checkpoint**: After T050, run `npm run build`. Zero TypeScript errors expected.
The new files have no import consumers yet — normal at this stage.

### T049

- [x] T049 [P] [US6] Create `lib/contact-metrics.ts` — resolveMatchedContact + computeContactMetrics helpers
- objective: Export two functions and one type:
  (1) `type ContactMetrics = { outgoingCount: number; incomingCount: number; pendingAmount: number; paidAmount: number; declinedAmount: number }`
  (2) `resolveMatchedContact(search: string, dtos: PaymentRequestDTO[], direction: "outgoing" | "incoming"): { id: string; name: string; email: string; phone: string | null } | null`
  — Builds a Map<contactId, contactIdentity> from `dtos` (outgoing: use recipient fields `recipientId/recipientName/recipientEmail/recipientPhone`; incoming: use requester fields). Applies F10 case-insensitive substring matching on name/email/phone (all three, OR logic). Returns the single matched contact if exactly one survives; otherwise returns null.
  (3) `computeContactMetrics(userId: string, contactId: string): Promise<ContactMetrics>`
  — Fetches all PaymentRequests `WHERE (requesterId=userId AND recipientId=contactId) OR (requesterId=contactId AND recipientId=userId)` via Prisma (include requester and recipient). Maps through `toPaymentRequestDTO` to get effective statuses. Returns `outgoingCount` (DTOs where requesterId === userId), `incomingCount` (DTOs where recipientId === userId), `pendingAmount` (sum of amountMinorUnits where effectiveStatus === "PENDING"), `paidAmount` (PAID), `declinedAmount` (DECLINED). CANCELLED and EXPIRED excluded from dollar aggregates.
- files: `lib/contact-metrics.ts`
- validation: `npm run build` passes with zero TypeScript errors; exported types and
  functions compile correctly; `ContactMetrics` type is exported and importable
- evidence impact: enables AC26-AC30
- recommended lane: implementation
- reasoning / effort: pure computation functions; no new dependencies; medium
- required review: confirm detection uses the input `dtos` array directly (single direction
  from the caller, already the full unfiltered allDtos); confirm CANCELLED and EXPIRED
  excluded from dollar aggregates; confirm `toPaymentRequestDTO` applied to metrics Prisma
  query result (not raw rows) so effective status drives aggregate computation; confirm
  function returns null on empty search string (caller passes `searchParam ?? ""`)
- docs impact: none

### T050

- [x] T050 [P] [US6] Create `components/ContactSummaryCard.tsx` — pure display component (no client hooks)
- objective: A plain TypeScript/JSX function component — no `"use client"`, no hooks, no
  data fetching. Props: `contact: { name: string; email: string; phone: string | null }` and
  `metrics: ContactMetrics` (import from `lib/contact-metrics.ts`).
  Outer div: `data-testid="contact-summary-card"` and
  `className="rounded-xl bg-white ring-1 ring-blue-100 shadow-sm p-4"`.
  Layout: `md:flex md:gap-6`; mobile default: `flex flex-col gap-3`.
  Identity block (left on desktop, first on mobile): name in `font-semibold text-slate-900`,
  email in `text-sm text-slate-600`, phone in `text-sm text-slate-500` — omit the phone
  element entirely when `contact.phone === null` (do not render a fallback dash for it).
  Metrics block (right on desktop, second on mobile): outgoing count labeled "Sent",
  incoming count labeled "Received", and dollar amounts for pending, paid, and declined
  using `formatCents()` from `lib/money.ts`. Labels in `text-xs text-slate-500`,
  values in `text-sm font-medium text-slate-900`.
- files: `components/ContactSummaryCard.tsx`
- validation: `npm run build` passes; no `"use client"` in the file; phone element
  absent when phone is null; amounts formatted as "$X.XX" via `formatCents()`
- evidence impact: AC26, AC27, AC28
- recommended lane: implementation
- reasoning / effort: pure display component; low risk; no state management
- required review: confirm no `"use client"` directive; confirm phone line omitted
  entirely (not shown as "—") when phone is null; confirm `data-testid="contact-summary-card"`
  on the outer div; confirm `formatCents` used for all dollar amounts
- docs impact: none

---

**Batch checkpoint**: After T050, run `npm run build`. Expect zero TypeScript errors.
No dashboard changes yet — proceed to Batch C-2.

---

## Phase 17 — Dashboard Integration + UI Polish (AC26-AC32) — Batch C-2

**Batch goal**: Wire the contact summary card into both dashboard server components and
apply the surface wrapper + active pill style to FilterBar. After this batch: AC26-AC32
are verifiable manually in the browser on both dashboards.

### T051

- [x] T051 [P] [US6] Update `app/(protected)/dashboard/outgoing/page.tsx` — single-contact detection, metrics fetch, ContactSummaryCard render, controls surface wrapper
- objective: Four additions to the existing outgoing dashboard server component:
  (1) Import `resolveMatchedContact`, `computeContactMetrics` from `lib/contact-metrics.ts`
  and `ContactSummaryCard` from `components/ContactSummaryCard.tsx`.
  (2) After computing `allDtos`, call `resolveMatchedContact(searchParam ?? "", allDtos, "outgoing")`.
  If result is non-null and `searchParam` is non-empty, call
  `const metrics = await computeContactMetrics(session.userId, matchedContact.id)`.
  (3) Wrap `<FilterBar>`, `<Suspense><SearchInput /></Suspense>`, and (conditionally)
  `<ContactSummaryCard>` in:
  `<div data-testid="controls-surface" className="mb-6 rounded-xl bg-slate-50 ring-1 ring-slate-200 shadow-sm p-4 space-y-3">`.
  (4) Move the empty-state paragraph inside the surface wrapper (render it after the controls
  group, before the request list div). This keeps the surface visible even on empty states.
  Render `<ContactSummaryCard contact={matchedContact} metrics={metrics} />` inside the
  wrapper when `matchedContact` is non-null.
- files: `app/(protected)/dashboard/outgoing/page.tsx`
- validation: Search "bob" → contact card visible below search; card shows Bob's name, email,
  phone; metrics labels visible; status filter change (click PENDING) does not remove the card;
  empty search shows no card; search "zzznomatch" shows no card; `npm run build` passes
- evidence impact: AC26, AC27, AC28, AC29, AC30, AC31, AC32
- recommended lane: implementation
- reasoning / effort: focused additions to existing server component; medium
- required review: confirm `resolveMatchedContact` receives `allDtos` (the full pre-status-filter
  set) so card persists across filter changes (AC30); confirm `computeContactMetrics` is only
  called when `matchedContact !== null && searchParam`; confirm `data-testid="controls-surface"`
  on the wrapper div; confirm empty-state paragraph is inside the surface wrapper
- docs impact: none

### T052

- [x] T052 [P] [US6] Update `app/(protected)/dashboard/incoming/page.tsx` — same contact detection, metrics, card, and surface wrapper as T051 (direction: "incoming")
- objective: Mirror T051 for the incoming dashboard. The only directional difference:
  pass `"incoming"` as the direction argument to `resolveMatchedContact`. Everything else
  is identical — same imports, same surface wrapper with `data-testid="controls-surface"`,
  same conditional card render, same empty-state placement inside the wrapper.
  Metrics perspective: `computeContactMetrics(session.userId, matchedContact.id)` — the
  `outgoingCount`/`incomingCount` values in the returned metrics are always from the current
  user's perspective, not the contact's perspective.
- files: `app/(protected)/dashboard/incoming/page.tsx`
- validation: Bob logs in, searches "alice" on incoming dashboard → contact card appears
  with Alice's name, email, phone, and relationship metrics scoped to Bob↔Alice;
  `npm run build` passes; surface wrapper present with correct `data-testid`
- evidence impact: AC26-AC32 (incoming dashboard coverage)
- recommended lane: implementation
- reasoning / effort: direct mirror of T051; low risk after T051 is validated
- required review: confirm direction argument is `"incoming"` in `resolveMatchedContact`;
  confirm `data-testid="controls-surface"` present; confirm no existing behavior changed
  (status filter, search filter, list order all unchanged)
- docs impact: none

### T053

- [x] T053 [US6] Update `components/FilterBar.tsx` — brand-adjacent active pill style (blue-600 active, slate inactive)
- objective: Update pill button className strings in FilterBar. Active pill (current status
  matches the pill's status): `bg-blue-600 text-white shadow-sm rounded-full px-3 py-1 text-sm font-medium`.
  Inactive pill: `bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 rounded-full px-3 py-1 text-sm`.
  The `router.push` logic, pill labels, and ALL/status branching are unchanged.
  No other files modified in this task.
- files: `components/FilterBar.tsx`
- validation: Active pill renders with blue-600 background and white text; inactive pills
  have white background with slate ring; `npm run build` passes; all 6 pills render;
  `npx playwright test e2e/filter-search.spec.ts` still passes (pill functionality unchanged)
- evidence impact: AC32
- recommended lane: implementation
- reasoning / effort: className string swap only; zero logic changes; minimal
- required review: confirm `router.push` logic untouched; confirm ALL 6 pill labels still
  render; confirm no Tailwind config changes needed (all standard utility classes)
- docs impact: none

---

**Batch checkpoint**: After T051-T053, open both dashboards in browser. Search "bob" on
outgoing — confirm surface wrapper visible, contact card present, blue active pill. Resize
to 375px (dev tools) — confirm card stacks vertically without horizontal scroll.
Run `npm run build`. Then run `npx playwright test e2e/filter-search.spec.ts` to confirm
no regression on AC14-AC19.

---

## Phase 18 — E2E Tests for Contact Summary Card (AC26-AC32) — Batch C-3

**Batch goal**: Full Playwright coverage for all 7 new ACs. After this batch: automated
evidence is ready; proceed to production deployment and evidence collection.

### T054

- [x] T054 [US6] Write E2E tests for contact summary card in `e2e/contact-summary-card.spec.ts` (AC26-AC32)
- objective: Seven named test cases using the existing `loginAs` helper pattern (Alice logs
  in as <alice@example.com> / demo1234):
  **Test 1 — AC26+AC27+AC28** "Single match shows contact card with identity and metrics":
  Alice searches "bob" on outgoing dashboard → `data-testid="contact-summary-card"` visible;
  "Bob" text visible; "<bob@example.com>" text visible; "+15550002222" text visible; at least
  one metric label ("Sent" or "Received") visible.
  **Test 2 — AC29-a** "Zero match hides card": Alice searches "zzznomatch" → card locator
  not visible.
  **Test 3 — AC29-b** "Multi-match hides card": Alice searches "example.com" → card locator
  not visible (all 3 seed users match "example.com").
  **Test 4 — AC29-c** "Empty search hides card": Navigate to `/dashboard/outgoing` with no
  search param → card locator not visible.
  **Test 5 — AC30** "Status filter change does not remove card": Alice searches "bob" → card
  visible; click "PENDING" pill; `expect(page).toHaveURL(/status=PENDING/)`; card still
  visible (`data-testid="contact-summary-card"`).
  **Test 6 — AC31** "Mobile 375px viewport — card visible without horizontal scroll":
  `await page.setViewportSize({ width: 375, height: 812 })`; search "bob"; card visible;
  `expect(await page.evaluate(() => document.documentElement.scrollWidth <= 375)).toBe(true)`.
  **Test 7 — AC32** "Controls surface wrapper present": navigate to `/dashboard/outgoing`;
  `page.locator('[data-testid="controls-surface"]')` is visible.
- files: `e2e/contact-summary-card.spec.ts`
- validation: `npx playwright test e2e/contact-summary-card.spec.ts` exits 0; all 7 tests
  pass; video artifacts produced in `test-results/`
- evidence impact: AC26-AC32 (primary E2E evidence)
- recommended lane: implementation
- reasoning / effort: standard Playwright patterns; main care is AC29-b search term matching
  all 3 seed users and AC31 scrollWidth assertion; medium
- required review: confirm AC29-b search term genuinely matches all 3 seed users (verify
  "example.com" appears in alice, bob, carol emails); confirm AC30 uses `toBeVisible` for
  card after pill click (not `toHaveCount`); confirm AC31 uses `document.documentElement.scrollWidth`
  not `document.body.scrollWidth`; confirm `loginAs` helper imported from filter-search.spec.ts
  pattern (not duplicated — extract to a shared helper file if needed)
- docs impact: update `docs/VIDEO_EVIDENCE_GUIDE.md` with new artifact names after passing

---

**Batch checkpoint**: After T054, run `npx playwright test e2e/contact-summary-card.spec.ts`.
All 7 tests must pass locally before proceeding to evidence collection.

---

## Phase 19 — Closeout + Evidence (AC26-AC32) — Batch C-4

**Batch goal**: Phase validation, docs sync, production deployment, and full evidence
collection for all 34 ACs (27 existing + 7 new).

### T055

- [x] T055 Run `bash scripts/phase_closeout.sh`, update `docs/EXECUTION_LOG.md` and `docs/AI_PROCESS.md` for the contact summary card batch
- objective: Phase closeout sequence:
  (1) Run `bash scripts/phase_closeout.sh` — build + lint + type check must all pass.
  (2) Append a new dated entry to `docs/EXECUTION_LOG.md` covering T049-T054:
  what was done (contact metrics helper, card component, dashboard integration, UI polish,
  E2E tests), why (spec AC26-AC32), artifacts changed, validation results.
  (3) Update `docs/AI_PROCESS.md` to reflect any new AI usage patterns in Batch C
  (spec-plan-tasks-implement workflow, speckit-plan addendum pattern).
- files: `docs/EXECUTION_LOG.md`, `docs/AI_PROCESS.md`
- validation: `bash scripts/phase_closeout.sh` exits 0 (5/5 checks green);
  EXECUTION_LOG has a new entry with today's date covering the Batch C scope
- evidence impact: reviewer-facing doc sync
- recommended lane: implementation (low effort)
- reasoning / effort: standard phase closeout; follows existing log format
- required review: confirm EXECUTION_LOG entry covers T049-T054 scope; confirm
  AI_PROCESS accurately reflects AI usage (not invented)
- docs impact: `docs/EXECUTION_LOG.md`, `docs/AI_PROCESS.md`

### T056

- [x] T056 Deploy to production, re-run full E2E evidence suite for all 34 ACs, update README and docs
- objective: Final evidence collection:
  (1) Merge or deploy `feat/contact-summary-card` to production on Vercel. Confirm
  `https://lovie-afb-assignment.vercel.app` serves the new contact card UI.
  (2) Confirm production DB seed is intact — Alice/Bob/Carol have phone numbers.
  Re-seed if needed: `DATABASE_URL=<pooler_url> npx prisma db seed`.
  (3) Run `BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .`
  All 34 E2E tests (27 existing + 7 new) must pass. Collect 34 `.webm` videos + 34
  `.zip` traces in `artifacts/`.
  (4) Update `README.md` evidence section to reflect "34/34 tests pass" and list the
  new `contact-summary-AC26-AC32` artifact names.
  (5) Update `docs/VIDEO_EVIDENCE_GUIDE.md` artifact list with the 5 new named videos
  from `contact-summary-card.spec.ts`.
- files: `artifacts/videos/` (5-7 new), `artifacts/traces/` (5-7 new), `README.md`,
  `docs/VIDEO_EVIDENCE_GUIDE.md`
- validation: All 34 tests pass against production; `artifacts/videos/` contains
  `contact-summary-AC26-AC28-*.webm`, `contact-summary-AC29-*.webm`,
  `contact-summary-AC30-*.webm`, `contact-summary-AC31-*.webm`,
  `contact-summary-AC32-*.webm`; README evidence count updated
- evidence impact: primary submission evidence for AC26-AC32
- recommended lane: implementation
- reasoning / effort: same deploy+seed+evidence pattern as T048; medium
- required review: confirm production deployment is live before running E2E; confirm
  all 34 tests pass (not just the 7 new ones); confirm README and guide both updated
- docs impact: `README.md`, `docs/VIDEO_EVIDENCE_GUIDE.md`
