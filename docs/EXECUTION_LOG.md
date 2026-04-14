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

### 2026-04-14 — Batch C-4: Main merge + 34/34 production E2E + submission docs (T055, T056)

#### What was done

- Fast-forwarded `main` from `72fc813` to `ad2bd6e` (8 commits covering
  Batch C-1 through C-3). Vercel auto-deploy to production completed
  with target `production` and deployment id `dpl_Ek4fiH8JfA72xAWuhQPaBu2UEmiR`.
- Ran the full 34-test Playwright suite against the public production URL
  (`https://lovie-afb-assignment.vercel.app`) — **34/34 pass in 183s**
  (3 min). This is the durable post-refactor validation (no Vercel SSO,
  no cookie-wipe artifacts, no bypass-token single-use issues).
- Re-collected evidence with `scripts/3-run_e2e_evidence.sh` and
  `--trace on`: 34 `.webm` + 34 `.zip` in `artifacts/`.
- Updated submission-facing docs:
  - `README.md`: Project Overview expanded to reflect AC14–AC32
    (filter/search, phone, pay simulation, contact card); Evidence
    section counts `15 → 34`; AI Workflow section adds the Opus/Sonnet
    effort lanes and the Vercel-MCP-backed Playwright bypass pattern.
  - `docs/EVIDENCE_INDEX.md`: counts `15 → 34` and scenario mapping for
    every AC from AC1 to AC32.
  - `docs/VIDEO_EVIDENCE_GUIDE.md`: adds `contact-summary-card-AC26-*`
    through `AC32-*` entries and the `expiration-AC5-server-*`
    server-side variant; counts corrected to 34.
  - `RELEASE_NOTES.md`: rewritten as v1.0 + v1.1 sections. v1.1 covers
    Batches D (filter/search AC14–19), E (pay sim AC24–25), F (phone
    AC20–23), and C (contact card AC26–32) with architectural notes on
    the FilterBar server-component refactor. Removed stale
    "known follow-ups" items that were delivered.
  - `docs/SUBMISSION_COVER_NOTE.md` (new): email-ready cover note with
    what-was-built summary, demo URL + credentials, evidence pointers,
    **hardest part of the assignment** (AC30 hydration race narrative),
    and **how AI helped / hindered** honest appraisal.
- Marked T055 and T056 `[x]` in `specs/001-p2p-payment-request/tasks.md`.

#### Validation

- `npm run build`: clean, 13 static pages.
- `bash scripts/phase_closeout.sh`: 5/5 pass (auto-fix, lint, typecheck,
  prisma validate, prisma generate).
- Production E2E: **34/34 green** in 183s.
- Production deploy verified reachable: `HTTP 200 /login`, ~1.5s
  first-byte.

#### Artifacts changed

- `specs/001-p2p-payment-request/tasks.md` (T055, T056 marked `[x]`)
- `README.md` (Project Overview, Evidence counts, AI Workflow)
- `docs/EVIDENCE_INDEX.md` (rewritten, 34-test mapping)
- `docs/VIDEO_EVIDENCE_GUIDE.md` (rewritten, 34-test packaging)
- `RELEASE_NOTES.md` (rewritten, v1.0 + v1.1)
- `docs/SUBMISSION_COVER_NOTE.md` (new)
- `docs/EXECUTION_LOG.md` (this entry)
- `docs/AI_PROCESS.md` (Phase 19)
- `artifacts/videos/*.webm` (34 fresh captures, replacing the Batch F
  snapshot of 27)
- `artifacts/traces/*.zip` (34 fresh traces)

#### Notes

- Public production URL has no SSO; the 8 Preview-only failures observed
  during earlier regression (all traced to `context.clearCookies()` wiping
  the Vercel bypass cookie) do not apply here. The 34/34 green is the
  correct and final validation.
- Evidence artifacts are tracked in git under `artifacts/` (intentional
  repo-visible bundle — `.gitignore` has `artifacts/` commented out).
  This keeps the reviewer one `git clone` away from the evidence.

---

### 2026-04-14 — Batch C-3: T054 E2E + FilterBar/SearchInput refactor

#### What was done

- Wrote `e2e/contact-summary-card.spec.ts` with 7 tests covering AC26-AC32
  (identity + metrics, zero/multi/empty match, AC30 status-filter
  persistence, mobile 375px, controls-surface wrapper).
- Root-caused and fixed a reproducible dev-mode race where
  `useSearchParams()` inside a Suspense boundary returned stale/null data
  at the moment of a client-side `router.push`, leaving URL unchanged
  after a filter-pill click (AC30 failure).
- **FilterBar → server component.** Removed `"use client"`, `useRouter`,
  `useSearchParams`, and `onClick`. Each pill is a `<Link href={...}>`
  computed on the server from `currentSearch` + target status. Works
  with or without JavaScript — no hydration timing window.
- **SearchInput → prop-based.** Replaced `useSearchParams` with
  `initialSearch` + `currentStatus` props; kept `router.replace` in
  debounced callback; dropped Suspense wrapper.
- Both dashboard pages now pass server-derived props so filter/search
  preservation is server-driven rather than client-hook-derived.
- `e2e/filter-search.spec.ts`: `getByRole("button")` → `getByRole("link")`
  for filter pills; `fill()` → `pressSequentially({ delay: 100 })` for
  search input; URL-assertion timeouts raised to 10s.
- Added `e2e/global-setup.ts` + `playwright.config.ts` wiring so E2E
  can run against Vercel Preview deployments via `BYPASS_URL` with
  `_vercel_share=<token>` — the setup captures the bypass cookie into
  `e2e/.auth/vercel-bypass.json` (gitignored) so all workers inherit
  authenticated state.
- Marked T054 [x] in `specs/001-p2p-payment-request/tasks.md`.

#### Validation

- Local dev: 7/7 pass on contact-summary-card in ~112s.
- Vercel Preview (commit 598c4d2):
  - contact-summary-card alone: 7/7 in ~40s.
  - **contact-summary-card + filter-search combined: 13/13 in 76s.**
- `npm run build`: clean, zero TS errors.
- `bash scripts/phase_closeout.sh`: 5/5 pass.

#### Notes

- The move from client + router.push → server component + Link is the
  durable fix; also reduces client JS bundle for the dashboard route.
- Preview E2E was 3× faster than local dev (76s vs 4-5min for the same
  13 tests) — Preview uses the prod build without on-demand compile.
  Future E2E runs should prefer Preview URLs.
- Vercel-bypass Playwright setup is reusable for any future Preview E2E.

---

### 2026-04-14 — Branch publish + Preview env fix (feat/contact-summary-card)

#### What was done

- Published `feat/contact-summary-card` to origin with upstream tracking (3
  commits: Batch C-1 foundation, Batch C-2 integration, docs closeout sync)
- Added Vercel Preview env vars scoped to `feat/contact-summary-card`:
  `DATABASE_URL` and `SESSION_SECRET` (same pattern as earlier branch-scoped
  preview setup for `feat/phone-filter-search-pay-simulation`)
- Ran `vercel redeploy` on the git-linked Preview deployment so the existing
  git-branch alias picks up the new env vars (new deployment
  `dpl_BbzchowouqmJwNhCm8e59nhwSRf4` is Ready)

#### Why it was done

- User reported "application error" on the Preview — same root cause as the
  previous branch: the git-triggered build happens before branch-scoped env
  vars are added, so runtime Prisma/iron-session init crashes. Fix is the same
  (add env + redeploy)

#### Artifacts changed

- Vercel project config (external state): new branch-scoped Preview env vars
- No local files changed; no new commits in this mini-phase

#### Validation

- `bash scripts/phase_closeout.sh` — 5/5 green
- `vercel inspect` on the redeployed deployment: status Ready, target preview
- Git-branch alias reachable: HTTP/2 401 from Vercel SSO (deployment protection
  layer responding — expected for unauthenticated curl; user's browser SSO
  passes through)

#### Notes

- Recurring pattern: every new feature branch needs branch-scoped Preview env
  vars added manually because `scripts/set-vercel-env.sh --include-preview`
  adds them to ALL preview branches (not branch-scoped). The manual workaround
  is `vercel env add KEY preview <branch-name> --force --yes`
- No code changes in this mini-phase — purely infra/deployment operation
- Working tree clean; branch in sync with origin after this phase

---

### 2026-04-14 — Batch C-2: Contact summary card dashboard integration (T051, T052, T053)

#### What was done

- T051: updated `app/(protected)/dashboard/outgoing/page.tsx` — imports
  `resolveMatchedContact` + `computeContactMetrics` from `lib/contact-metrics`,
  imports `ContactSummaryCard`; resolves the matched contact from `allDtos`
  (pre-status-filter) with direction `"outgoing"`; conditionally awaits
  `computeContactMetrics(session.userId, matchedContact.id)` when a single contact
  matches and search is non-empty; wraps `<FilterBar>`, `<SearchInput>`,
  `<ContactSummaryCard>`, and the empty-state paragraph in a surface div
  (`data-testid="controls-surface"`, slate-50/ring-slate-200 palette)
- T052: mirrored the same changes on `app/(protected)/dashboard/incoming/page.tsx`
  with direction `"incoming"` — counterparty is the requester
- T053: updated `components/FilterBar.tsx` active/inactive pill classes to the
  brand-adjacent palette: active `bg-blue-600 text-white shadow-sm`, inactive
  `bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100`

#### Why it was done

- AC26–AC32 require an inline contact summary card on both dashboards when search
  resolves to exactly one counterparty
- Detection deliberately runs against `allDtos` (not `statusFiltered`) so the card
  persists across status filter changes per AC30
- Empty-state paragraph lives inside the surface wrapper so the layout surface does
  not collapse on empty lists per AC32

#### Artifacts changed

- `app/(protected)/dashboard/outgoing/page.tsx` — detection call + await + surface wrapper + card render
- `app/(protected)/dashboard/incoming/page.tsx` — mirror of outgoing with direction `"incoming"`
- `components/FilterBar.tsx` — active + inactive pill className swap

#### Validation

- `bash scripts/phase_closeout.sh` — 5/5 green (required one markdownlint fix in
  `docs/AI_PROCESS.md` for duplicate H3 headings across phase sections)
- `npm run build` — compiled successfully; dashboard pages 1.21 kB → 1.23 kB from
  ContactSummaryCard import
- `npm run lint` — zero warnings
- SSR smoke-test via curl: AC26+AC27+AC28 (`?search=bob` renders card with phone
  `+15550002222` + 5 metric labels), AC29-a/b/c (zero match / multi match / empty
  search all hide card, surface still present), T052 mirror (Bob searching Alice
  renders card with phone `+15550001111`)
- Production regression: filter-search E2E suite **6/6 pass** against
  `lovie-afb-assignment.vercel.app` — confirms no regression in existing AC14–AC19
  behavior

#### Notes

- Local Playwright AC17/AC19 showed pre-existing flakiness (search-input fill not
  triggering URL change in debounce window); reproduced with my changes stashed,
  so not introduced by Batch C-2. Production runs confirm the tests are reliable
  against the deployed URL — defer final validation to Batch C-4 production run
- No API contract changes, no DB schema changes, no new routes
- Empty-state paragraph moved from being a sibling of the list to being inside the
  surface wrapper — this is the AC32 requirement and matches the plan addendum

---

### 2026-04-14 — Batch C-1: Contact summary card foundation (T049, T050)

#### What was done

- Added AC26–AC32 to `specs/001-p2p-payment-request/spec.md` via `/speckit-specify`
  (F13 flow, Session 2026-04-14 clarifications, new Screens/Views entries, 7 new ACs)
- Generated `specs/001-p2p-payment-request/checklists/contact-summary-card.md` — 15 items,
  all passing
- Extended `specs/001-p2p-payment-request/plan.md` with an addendum for AC26–AC32:
  single-contact detection algorithm, metrics query shape, ContactSummaryCard props,
  UI polish scope, task batches C-1 through C-4
- Extended `specs/001-p2p-payment-request/research.md` with 3 new decisions:
  no new API endpoint, shared helper module, detection from `allDtos` not filtered set
- Extended `specs/001-p2p-payment-request/tasks.md` with T049–T056 across Phases 16–19
- T049: created `lib/contact-metrics.ts` — `resolveMatchedContact(search, dtos, direction)`
  - `computeContactMetrics(userId, contactId)` + `ContactMetrics` type export
- T050: created `components/ContactSummaryCard.tsx` — pure server-safe display component,
  no client hooks, `data-testid="contact-summary-card"`, phone line omitted when null,
  `formatCents()` for all dollar amounts, desktop two-column / mobile stacked layout

#### Why it was done

- User requested a lightweight inline contact summary card on dashboards when search
  resolves to exactly one counterparty — reviewer-friendly UI enhancement
- Scope is deliberately additive: no new entities, no new API routes, no design system
- Batch C-1 establishes the foundation (new files) before touching dashboard pages in C-2

#### Artifacts changed

- `specs/001-p2p-payment-request/spec.md` — AC26–AC32 + F13 + Screens/Views added
- `specs/001-p2p-payment-request/plan.md` — AC26–AC32 addendum appended
- `specs/001-p2p-payment-request/research.md` — 3 new decision records
- `specs/001-p2p-payment-request/tasks.md` — T049–T056 added across Phases 16–19
- `specs/001-p2p-payment-request/checklists/contact-summary-card.md` — new, 15/15 passing
- `lib/contact-metrics.ts` (new)
- `components/ContactSummaryCard.tsx` (new)

#### Validation

- `bash scripts/phase_closeout.sh` — 5/5 green (lint, typecheck, prisma validate, prisma generate, auto-fix)
- `npm run build` — compiled successfully, zero TypeScript errors
- Dashboard page bundle sizes unchanged (new files have no consumers yet)

#### Notes

- Both new files compile in isolation; no dashboard page imports them yet — intentional
  boundary for Batch C-1 so the batch stops cleanly before integration
- `spec-readiness.md` checklist (52 items, legacy) was explicitly treated as a non-gate
  for this batch; `contact-summary-card.md` and `requirements.md` are the active signal
- Detection intentionally uses `allDtos` (pre-status-filter) so the card survives status
  filter changes per AC30 — the resolved contact's identity should not disappear just
  because the user toggled PENDING/PAID
- CANCELLED and EXPIRED explicitly excluded from dollar aggregates per F13 step 3; their
  counts still roll into `outgoingCount`/`incomingCount`

---

### 2026-04-14 — Batch F: E2E evidence collection (T045-T048)

#### What was done

- T045: `e2e/phone.spec.ts` — 4 tests: toggle visibility, phone create, not-found, self-request
- T046: `e2e/filter-search.spec.ts` — 6 tests: pill presence, PAID filter, EXPIRED seeded
  fixture, search "bob", combined filter+search, soft navigation (window marker)
- T047: `e2e/pay-simulation.spec.ts` — 2 tests: spinner+disabled during pay, success banner
  - no spinner on Decline
- T048: Merged feature branch to main, deployed to production, re-seeded production DB
  (phone numbers), ran 27/27 E2E green, collected 27 videos + 27 traces
- Fix: AC15 changed from `$15.00` to `$15.15` to avoid strict mode collision with
  happy-path data accumulated in the shared production DB

#### Why it was done

- T045-T047 provide Playwright video/trace evidence for all 12 new ACs (AC14-AC25)
- T048 is the final evidence collection against the production URL
- Re-seeding was required because existing users had NULL phone after the column was
  added via migration but seed hadn't been re-run on production

#### Artifacts changed

- `e2e/phone.spec.ts` (new)
- `e2e/filter-search.spec.ts` (new)
- `e2e/pay-simulation.spec.ts` (new)
- `docs/VIDEO_EVIDENCE_GUIDE.md` (updated artifact list to 27)
- `docs/AI_PROCESS.md` (updated to T032-T048, 27/27)
- `artifacts/videos/` (27 .webm files)
- `artifacts/traces/` (27 .zip files)

#### Validation

- `bash scripts/phase_closeout.sh` — 5/5 green
- 27/27 E2E tests pass against `lovie-afb-assignment.vercel.app`
- All commits pushed to both `main` and `feat/phone-filter-search-pay-simulation`

#### Notes

- First run had 3 failures: AC15 (strict mode collision), AC21/AC23 (NULL phone in prod DB)
- Both root causes were infra/data issues, not code bugs — fixed by unique amount + re-seed
- Feature branch and main are now in sync

---

### 2026-04-13 — Vercel preview deployment fix

#### What was done

- Synced `DATABASE_URL` and `SESSION_SECRET` to Vercel Preview scope, scoped to
  `feat/phone-filter-search-pay-simulation` branch (both were previously Production-only)
- Triggered a fresh preview redeploy — build succeeded
- Updated `scripts/set-vercel-env.sh` to use `npm exec -- vercel` instead of `npx vercel`
  (`npx vercel` resolves to the npm CLI in this npm version, not the Vercel CLI)

#### Why it was done

- Preview deployments were showing Application errors because env vars were absent in
  the Preview scope; the app cannot boot without `DATABASE_URL` and `SESSION_SECRET`
- Fixed proactively before T046-T048 to ensure the preview URL is testable during
  E2E evidence collection

#### Artifacts changed

- `scripts/set-vercel-env.sh` (CLI invocation patched)
- Vercel project config (env vars added to Preview scope via CLI — not a repo file)

#### Validation

- `npm exec -- vercel env ls` confirmed both vars present in Preview scope
- Preview redeploy completed successfully (green build, new preview URL generated)

#### Notes

- For future feature branches, `bash scripts/set-vercel-env.sh --include-preview`
  will sync both vars to the Preview scope automatically
- `DIRECT_URL` remains local-only and is intentionally excluded from Vercel (see
  existing BUILD_NOTES.md policy)

---

### 2026-04-13 — Batch E: pay simulation — delay, spinner, success banner (T043-T044)

#### What was done

- T043: Added 2–3s artificial delay to `POST /api/requests/[id]/pay` — `await new
Promise(r => setTimeout(r, 2000 + Math.random() * 1000))` inserted AFTER the 403
  authorization guard and BEFORE the conditional `updateMany` write. 403/404 paths
  remain immediate; the delay is only hit by authorized PENDING pay attempts. Decline
  and Cancel routes untouched. Decision documented in `docs/BUILD_NOTES.md`.
- T044: Updated `app/(protected)/requests/[id]/page.tsx` — added `currentAction` and
  `paySuccess` states. Pay button renders an `animate-spin` SVG (`data-testid="pay-spinner"`)
  with "Processing payment…" text while the pay request is in flight. On success,
  `paySuccess` is set to true; a green "Payment successful!" banner renders above the
  action area with a manual X dismiss button. A `useEffect` auto-clears `paySuccess`
  after 5000ms with timer cleanup on unmount. Decline and Cancel buttons are unchanged.
  `paySuccess` is reset at the start of any subsequent action call.

#### Why it was done

- AC24 requires visible pay processing latency and spinner; AC25 requires a success
  confirmation banner that auto-dismisses. Both are reviewer-facing evidence points.
- Delay is placed correctly to maintain lifecycle correctness: auth errors remain
  fast-fail; the simulated latency only applies to the actual payment operation.

#### Artifacts changed

- `app/api/requests/[id]/pay/route.ts` (delay added)
- `app/(protected)/requests/[id]/page.tsx` (spinner + success banner)
- `docs/BUILD_NOTES.md` (delay decision documented)

#### Validation

- `npm run build` — 0 TypeScript errors, 0 lint warnings
- `bash scripts/phase_closeout.sh` — 5/5 green
- Committed: `feat(T043-T044): pay simulation delay + spinner + success banner`
- Pushed: `feat/phone-filter-search-pay-simulation`

#### Notes

- `data-testid="pay-spinner"` attribute on the SVG aligns with T047 E2E locator requirements
- Timer cleanup via `useEffect` return prevents state updates on unmounted component

---

### 2026-04-13 — Batch D: search filter — API params, dashboard wiring, SearchInput (T040-T042)

#### What was done

- T040: Created `components/SearchInput.tsx` — `"use client"` debounced input; 300ms
  `useRef` timer; merges `?search=` into existing `URLSearchParams` (preserves `?status=`);
  `router.replace` avoids history spam; clears `search` param on empty input; cleanup on
  unmount
- T041: Updated `GET /api/requests` and `GET /api/requests/incoming` — both accept
  `?search=` param; filtering runs AFTER `toPaymentRequestDTO()` and AFTER status filter;
  case-insensitive substring match on counterparty name, email, phone; null phone guarded
  with `?? ""` to prevent `.toLowerCase()` crash; empty/missing search bypasses filter
- T042: Updated both dashboard server component pages — accept `searchParams.search` from
  Next.js App Router; same post-DTO search logic applied server-side; render `<SearchInput>`
  wrapped in `<Suspense fallback={null}>` (required for `useSearchParams` in App Router);
  combined `?status=PAID&search=bob` works correctly; contextual empty-state messages for
  search vs filter vs no-records

#### Why it was done

- T040-T042 complete the search slice of the gap-fix batch; search was the remaining
  user-facing feature listed in the assignment spec that was not yet wired
- URL-driven approach keeps both filter and search stateless and shareable
- Post-DTO filtering is correct because EXPIRED status is computed in `toPaymentRequestDTO`,
  not stored in the DB — a DB-level search would miss implicitly-expired rows

#### Artifacts changed

- `components/SearchInput.tsx` (new)
- `app/api/requests/route.ts` (search filter added)
- `app/api/requests/incoming/route.ts` (search filter added)
- `app/(protected)/dashboard/outgoing/page.tsx` (SearchInput + server-side search)
- `app/(protected)/dashboard/incoming/page.tsx` (SearchInput + server-side search)

#### Validation

- `npm run build` — 0 TypeScript errors, 0 lint warnings
- `bash scripts/phase_closeout.sh` — 5/5 green (markdownlint, prettier, eslint, tsc, prisma validate)
- Committed: `feat(T041-T042): wire search filter through API and both dashboards`
- Pushed: `feat/phone-filter-search-pay-simulation`

#### Notes

- Suspense boundary required because `SearchInput` uses `useSearchParams()` (Next.js 14
  App Router enforces this for client hooks used inside server components)
- Search empty-state message shows the raw query string for reviewer clarity

---

### 2026-04-13 — Batch C: status filter — component, API params, dashboard wiring (T037-T039)

#### What was done

- T037: Created `components/FilterBar.tsx` — `"use client"` component; 6 pills (ALL, PENDING, PAID, DECLINED, CANCELLED, EXPIRED); active pill filled blue, inactive outlined; `router.push` updates `?status=` (ALL removes the param); invalid `activeStatus` prop falls back to ALL; accepts `basePath` prop for reuse on both dashboards
- T038: Updated `GET /api/requests` and `GET /api/requests/incoming` — both now accept `NextRequest`; `?status=` param filtered AFTER `toPaymentRequestDTO()` so EXPIRED catches implicitly-expired PENDING rows; `VALID_STATUSES` allowlist; missing/invalid/ALL returns full array
- T039: Updated both dashboard server component pages — accept `searchParams.status` from Next.js App Router; same post-DTO filter logic; render `<FilterBar activeStatus basePath>`; contextual empty-state messages for filtered vs no-records state

#### Why it was done

- Delivers AC14 (filter pills) and the server-side filter correctness requirement from the research doc (EXPIRED must be computed post-DTO, not at DB level)

#### Artifacts changed

- `components/FilterBar.tsx` (new)
- `app/api/requests/route.ts`
- `app/api/requests/incoming/route.ts`
- `app/(protected)/dashboard/outgoing/page.tsx`
- `app/(protected)/dashboard/incoming/page.tsx`
- `specs/001-p2p-payment-request/tasks.md` (T037-T039 marked complete)

#### Validation

- `bash scripts/phase_closeout.sh` → 5/5 checks green
- `npm run build` → 13/13 pages, TypeScript strict, zero errors; dashboard pages grew 566B → 873B (FilterBar client chunk expected)

---

### 2026-04-13 — Batch B: phone recipient API path + form toggle (T035-T036)

#### What was done

- T035: Extended `POST /api/requests` Zod schema — `recipientEmail` made optional, `recipientPhone` added with E.164-like regex `/^\+?[1-9]\d{6,14}$/`; `.superRefine()` enforces exactly-one-of (both or neither → 400 field-level error); handler branches `findUnique({ where: { phone } })` vs `findUnique({ where: { email } })`; 404 and 422 guards identical for both paths
- T036: Added `identificationMethod` state (`'email' | 'phone'`) to create-request form; pill toggle row above recipient input; switching clears the hidden field and resets error state; phone input uses `type="text"`, `inputMode="tel"`, placeholder `"+15551234567"`, client-side E.164-like format check; 404 message branches by active method; submit payload sends either `recipientEmail` or `recipientPhone`

#### Why it was done

- Completes the phone recipient creation path end-to-end (AC15, AC16, AC21)

#### Artifacts changed

- `app/api/requests/route.ts`
- `app/(protected)/requests/new/page.tsx`
- `specs/001-p2p-payment-request/tasks.md` (T035-T036 marked complete)

#### Validation

- `bash scripts/phase_closeout.sh` → 5/5 checks green
- `npm run build` → 13/13 pages, TypeScript strict, zero errors
- Branch pushed: `feat/phone-filter-search-pay-simulation`

---

### 2026-04-13 — Batch A: phone field foundation (T032-T034)

#### What was done

- Created feature branch `feat/phone-filter-search-pay-simulation` — all gap work isolated from `main`
- T032: Added `phone String? @unique` to `prisma/schema.prisma`; applied `ALTER TABLE "User" ADD COLUMN "phone" TEXT UNIQUE` via Supabase MCP (DIRECT_URL not reachable from local IPv4); local migration file `20260413000000_add_user_phone` added for history
- T033: Updated `prisma/seed.ts` — Alice `+15550001111`, Bob `+15550002222`, Carol `+15550003333`; `update` block added so re-seed is idempotent on existing users
- T034: Extended `PaymentRequestDTO` with `requesterPhone: string | null` and `recipientPhone: string | null`; `toPaymentRequestDTO()` maps `req.requester.phone ?? null` and `req.recipient.phone ?? null`

#### Why it was done

- Phone number is required for the phone-recipient lookup path (T035)
- DTO extension is required before search can match on phone (T040-T042)

#### Artifacts changed

- `prisma/schema.prisma`
- `prisma/migrations/20260413000000_add_user_phone/migration.sql`
- `prisma/seed.ts`
- `lib/dto.ts`
- `specs/001-p2p-payment-request/tasks.md` (T032-T034 marked complete)

#### Validation

- `bash scripts/phase_closeout.sh` → 5/5 checks green
- `npm run build` → 13/13 pages, TypeScript strict, no errors
- `npm run lint` → 0 warnings/errors
- `npm run typecheck` → clean
- `npx prisma validate` → schema valid

#### Notes

- DIRECT_URL (IPv6-only Supabase direct connection) not reachable from local IPv4 shell; migration applied via Supabase MCP instead; behavior is equivalent
- Project was bootstrapped with `prisma db push`, so `_prisma_migrations` table does not exist; local migration file is for audit trail only

---

### 2026-04-13 20:40 — Security audit + release hardening

#### What was done

- verified the GitHub repository is now publicly reachable
- audited the public Vercel deployment, env inventory, and runtime logs
- removed broad/default Preview env sync from `scripts/set-vercel-env.sh`
- kept `DIRECT_URL` local-only by default and documented the rule in repo docs
- added baseline HTTP security headers in `next.config.js`
- added release-facing docs: `docs/SECURITY_AUDIT.md`, `docs/EVIDENCE_INDEX.md`, `RELEASE_NOTES.md`
- improved the submission bundle script and added a reusable prompt for finishing remaining assignment gaps in another environment

#### Why it was done

- the repo is now public, so platform secret scope and reviewer-facing packaging needed a final hardening pass
- the previous docs still described a broader Vercel env footprint than the current secure runtime path needs

#### Artifacts changed

- `next.config.js`
- `scripts/set-vercel-env.sh`
- `.env.example`
- `README.md`
- `docs/BUILD_NOTES.md`
- `docs/VIDEO_EVIDENCE_GUIDE.md`
- `docs/SECURITY_AUDIT.md`
- `docs/EVIDENCE_INDEX.md`
- `RELEASE_NOTES.md`
- `prompts/remaining-gaps-fix-prompt.md`

#### Validation

- anonymous GitHub repo check → 200
- Vercel production env inventory → only `DATABASE_URL`, `SESSION_SECRET`
- Vercel production runtime log scan → no warning/error entries in inspected window
- `curl -I https://lovie-afb-assignment.vercel.app/login`
- `POST /api/auth/login` with seeded demo credentials → 200
- `npm audit --omit=dev --audit-level=high` → 1 high advisory in `next`

#### Notes

- the remaining security risk is the upstream `next@14.2.35` advisory set
- preview protection / firewall / source-map privacy still need dashboard-side confirmation

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

### 2026-04-12 12:55 — Phase 9: Infra fixes — Supabase seed, Vercel deployment, build repair

#### What was done

- Seeded Supabase DB via MCP SQL (Alice, Bob, Carol users + AC5 expired fixture); local `npx prisma db seed` was broken by Node 24 / zsh shell-quoting on `--compiler-options '{...}'`
- Fixed seed command: added `tsconfig.seed.json` (CommonJS, node moduleResolution); updated `package.json` to `ts-node --project tsconfig.seed.json`
- Diagnosed Vercel build failure (`DIRECT_URL` env var missing → Prisma P1012); set all three required env vars via Vercel CLI (`DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`)
- Fixed Vercel build failure: `prisma migrate deploy` uses DIRECT_URL which is IPv6-only on Supabase free tier — Vercel build VMs are IPv4-only; moved migrate to separate `npm run migrate` script; build command now `prisma generate && next build`
- Fixed Next.js static prerender error: `useSearchParams()` in `/login` required a Suspense boundary; extracted `LoginForm` component and wrapped in `<Suspense>`
- Fixed runtime 500 on Vercel login: DATABASE_URL password was truncated (16 chars vs correct 20) due to `@` in password breaking URL regex; replaced with correctly parsed value

#### Why it was done

- Supabase free tier had paused; project resumed but DB was empty — seed needed for E2E and demo
- Vercel deployment was in ERROR state blocking reviewer access to live demo
- IPv6/IPv4 mismatch is a documented Supabase free-tier constraint; migrate deploy must not run in CI build
- `useSearchParams` prerender error is a Next.js 14 App Router hard requirement

#### Artifacts changed

- `tsconfig.seed.json` (new)
- `package.json` — seed command and build script
- `scripts/set-vercel-env.sh` (new)
- `scripts/0-auto_fix_and_validate.sh` — exclude `test-results/`, `playwright-report/`, `artifacts/` from lint
- `.markdownlintignore` (new)
- `app/(auth)/login/page.tsx` — Suspense boundary for `useSearchParams`
- Vercel env vars: DATABASE_URL (pooler), DIRECT_URL (direct), SESSION_SECRET

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass (markdownlint, prettier, eslint, typecheck, prisma validate/generate)
- Vercel deployment `dpl_FKqctKmTAaKf2z1S4TrzewvxbwG4` → `readyState: READY`
- `/api/auth/login` returns 405 on GET (correct — route is live)
- Login endpoint returning 500 was traced to truncated DATABASE_URL password → fixed and redeployed

#### Notes

- Local E2E tests cannot reach Supabase DB directly (ISP blocks outbound port 5432 and 6543); E2E must be run from a network with DB access or via CI
- Re-run `bash scripts/3-run_e2e_evidence.sh .` after confirming login works on deployed URL to capture passing-flow artifacts

---

#### What was done

- Refreshed the Supabase database password in the local env files and re-synced Vercel production env vars using the updated credential.
- Rebuilt and redeployed the production Vercel deployment after the password refresh.
- Verified the deployed `/api/auth/login` endpoint now authenticates the seeded Alice user successfully.

#### Why it was done

- The previous blocker was a database authentication failure against Supabase from the deployed app.
- Production env sync needed to be refreshed with the corrected credential so the runtime could connect to the database again.

#### Artifacts changed

- `.env` and `.env.local` — updated the Supabase connection strings to use the refreshed database password.
- `scripts/set-vercel-env.sh` — simplified the env sync flow to use explicit `--value` arguments for production and preview attempts.
- `docs/BUILD_NOTES.md` — recorded the password refresh and successful redeploy.

#### Validation

- `bash -n scripts/set-vercel-env.sh` — pass
- `bash scripts/set-vercel-env.sh --deploy` — pass for production sync and redeploy
- `npx vercel curl /api/auth/login --deployment https://lovie-afb-assignment-qvsmn2xa7-orcunsener-4857s-projects.vercel.app ...` — returns the Alice session payload

#### Notes

- Preview env var sync still returns `action_required` in the current Vercel CLI flow and is left for manual dashboard handling if preview deployments are needed.

---

### 2026-04-12 11:35 — Phase 10: Infra debug — pooler shard + credential fix

#### What was done

- Diagnosed persistent `FATAL: Tenant or user not found` from Supabase Supavisor
- Identified root causes through systematic elimination:
  1. Password `7Lg8yb7xyUOrYyJt@aws` contained literal `@` making the URL ambiguous; fixed with `%40` encoding
  2. `%40`-encoded URL decoded to correct password but Supavisor still rejected — password was wrong from the start (previous session reconstructed it by inference rather than reading from dashboard)
  3. Pooler host was `aws-0-us-east-2.pooler.supabase.com` but this project is sharded to `aws-1-us-east-2.pooler.supabase.com`
- User retrieved correct credentials and pooler host from Supabase dashboard
- `.env.local` updated with correct values: password `8cjR1Webab3D6Eff`, host `aws-1-us-east-2.pooler.supabase.com`
- Verified Vercel functions are IPv4-only (direct IPv6-only DB connection at `db.*.supabase.co:5432` timed out)
- Added explicit try/catch + `detail` field to login route for runtime error visibility

#### Why it was done

- Sign-in was broken on every deployment; MCP log truncation made the error hard to read
- The `detail` field exposed `FATAL: Tenant or user not found` and later `Can't reach database server` — two distinct errors that required different fixes

#### Artifacts changed

- `.env.local` — correct password and pooler host from Supabase dashboard
- `app/api/auth/login/route.ts` — try/catch with `detail` field for error visibility (temporary debug aid)

#### Validation

- `bash scripts/phase_closeout.sh` — all 5 checks pass
- Vercel env update with correct credentials + redeploy is the pending action

#### Notes

- Vercel env still has stale credentials from this session's last deploy; must update with correct values from `.env.local` before sign-in will work
- The debug `detail` field in the login response should be removed before final submission
- Supabase MCP log tool truncates message column — full errors only visible via browser DevTools on the `detail` response field

---

### 2026-04-12 21:30 — Phase 11: E2E evidence — 15/15 passing on production

#### What was done

- Fixed 6 E2E locator failures from the first evidence run (9/15 pass):
  1. Status badge strict mode violations (`PAID`, `DECLINED`, `CANCELLED`, `EXPIRED`): added `{ exact: true }` to all `getByText(STATUS)` assertions — Playwright's default case-insensitive substring match was also hitting timestamp labels ("Paid at", "Declined at", etc.)
  2. Accumulated test data: dashboard locators (`$15.00`, `$30.00`, `"First request"`) matched multiple entries from prior runs; added `.first()` to handle idempotent assertions
  3. AC13 note length validation: `maxLength={200}` on the textarea silently capped Playwright's `fill()` at 200 chars, preventing the `> 200` client-side check from firing; removed `maxLength` attribute (JS validation at 200-char boundary is the enforced limit)
- Deployed updated build to `https://lovie-afb-assignment.vercel.app`
- Re-ran `BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .`
- All 15 tests pass; 15 video artifacts + 15 trace artifacts collected in `artifacts/`

#### Why it was done

- T031 requires full E2E evidence against the production deployment
- Failures were test locator issues and one source bug (`maxLength`), not functional regressions

#### Artifacts changed

- `e2e/happy-path.spec.ts` — `{ exact: true }` on status badges; `.first()` on `$15.00`
- `e2e/actions.spec.ts` — `{ exact: true }` on all status badge assertions
- `e2e/expiration.spec.ts` — `{ exact: true }` on EXPIRED badge
- `e2e/validation.spec.ts` — `.first()` on `$30.00`, `"First request"`, `"Second request"`, PENDING; AC13 passes after `maxLength` removal
- `app/(protected)/requests/new/page.tsx` — removed `maxLength={200}` from note textarea
- `README.md` — evidence status updated to 15/15 on production
- `artifacts/videos/` — 15 `.webm` files from production run
- `artifacts/traces/` — 15 `.zip` files from production run

#### Validation

- `15 passed (1.2m)` from Playwright against `https://lovie-afb-assignment.vercel.app`

#### Notes

- debug `detail` field removed from login route earlier in this phase
- T031 is complete; all ACs have video + trace evidence
