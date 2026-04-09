# Task Breakdown

## Execution Rules

- tasks should be thin and reviewable
- each task must have a validation method
- unrelated refactors are forbidden
- evidence-related tasks are first-class work, not last-minute cleanup
- each meaningful task should make docs impact explicit

---

## Phase 1 — Project Bootstrap

### T001

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

### T002

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

### T003

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

### T004

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

### T005

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

### T006

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

### T007

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

### T008

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

### T009

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

### T010

- objective: Implement `POST /api/auth/logout` and `GET /api/auth/me`.
- files: `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`
- validation: `POST /api/auth/logout` clears session cookie; `GET /api/auth/me` returns
  current user when authenticated, 401 when not
- evidence impact: logout used in E2E user-switching between Alice and Bob
- recommended lane: implementation
- reasoning / effort: two trivial route handlers
- required review: confirm logout destroys session (not just expires cookie)
- docs impact: none

### T011

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

### T012

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

### T013

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

### T014

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

### T025

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

### T026

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

### T027

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

### T028

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

### T029

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

### T030

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

### T031

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
