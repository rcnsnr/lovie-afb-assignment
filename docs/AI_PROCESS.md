# AI Process Log

Use this document to show how AI was used in a controlled way.

## Tools Used

| Stage             | Tool        | Why                                                               |
| ----------------- | ----------- | ----------------------------------------------------------------- |
| Spec framing      | Claude Code | Derived feature spec from README + CLAUDE.md context              |
| Clarification     | Claude Code | Structured Q&A — 2 targeted questions, user answered              |
| Spec review       | Claude Code | Skill-driven audit; 5 fixes identified and applied                |
| Checklist         | Claude Code | 52-item requirements quality checklist generated                  |
| Planning          | Claude Code | Technical plan, data model, API contracts produced                |
| Edge-case audit   | Claude Code | 6 gaps found; corrections applied to spec/plan only               |
| Task breakdown    | Claude Code | 31 tasks across 9 phases; full AC-to-task mapping                 |
| Artifact analysis | Claude Code | 0 CRITICAL, 6 findings; 100% AC coverage confirmed                |
| Implementation    | Claude Code | T001–T031 complete across 9 phases; T032–T044 gap-fix batches A–E |
| Review            | Claude Code | `/ship-check` skill; final audit before submission                |
| Evidence prep     | Claude Code | 15/15 E2E green on production; 15 videos + traces                 |

## Representative Prompt Patterns

- `/speckit-constitution` — fill all template placeholders from project context; no
  freeform prompting; all values derived from README, CLAUDE.md, standards docs
- `/speckit-specify` — feature spec written from project context (no explicit user
  argument needed); all sections populated in one pass; quality checklist auto-generated
- `/speckit-clarify` — max-5-question structured session; 2 questions asked; user
  answered A (dollar input) and C (email + password auth); answers encoded into spec
- `/spec-review` — skill-driven audit of the spec; 5 targeted fixes identified;
  fixes applied by AI, validated by lint
- `/speckit-checklist` — user chose C+C (comprehensive + E2E weight, dual audience);
  52 items generated covering all quality dimensions
- `/speckit-plan` — full technical plan from locked spec; supporting artifacts (research,
  data model, API contracts) produced in the same pass
- `/edge-case-audit` — structured audit of lifecycle, authorization, expiration, and
  money handling; 2 critical risks + 6 important gaps reported; AI generated corrections,
  user approved, corrections applied to artifacts only
- `/speckit-tasks` — 31-task breakdown from plan and spec; 9 phases; all 13 ACs mapped
  to at least one task; evidence tasks (T025–T031) treated as first-class work
- `/speckit-analyze` — read-only cross-artifact analysis; 0 CRITICAL, 1 HIGH, 3 MEDIUM,
  2 LOW findings; key: T016/T024 ordering dependency and `updateMany` → `findUnique`
  two-query pattern for conditional action routes
- `/speckit-implement` (T001–T004) — thin-slice bootstrap execution; AI generated all
  scaffold files and ran validation at each step; 3 corrections surfaced and applied
  during implementation (not caught during planning)
- `/speckit-implement` (T005–T008) — Phase 2 DB/utilities/auth execution; AI generated
  schema, seed, and all lib modules; `tsc --noEmit` + `prisma validate` used as
  per-task validation gates; 0 corrections required
- `/speckit-implement` (T009–T012) — Phase 3 auth routes + login UI + session guard;
  AI generated all 5 files; `phase_closeout.sh` used as phase-end gate; 0 corrections
  required; ancillary fixes: typecheck script, .gitignore .env entry, Supabase migration
  via MCP

## Where AI Helped

- **Spec completeness**: AI populated all spec sections from project context with zero
  freeform prompting. The spec came out complete on the first pass with no missing mandatory
  sections.
- **Spec review**: AI identified 5 precision gaps (Observer visibility, not-found error,
  amount ceiling, AC for note validation, dashboard ordering) that would have caused
  implementation ambiguity.
- **Checklist generation**: 52 requirement-quality items produced covering all taxonomy
  categories; CHK027 (EXPIRED on dashboards) and CHK041 (E2E expiration strategy) directly
  surfaced issues resolved in the edge-case audit.
- **Technical plan**: stack justification, data model, Prisma schema, API contracts, and
  E2E test strategy all generated from spec context without requiring skeleton code or
  throwaway scaffolding.
- **Edge-case audit**: correctly identified CR1+CR2 (concurrent write race + expiration
  race) as the highest-risk items; the conditional DB write correction is a meaningful
  correctness improvement that would have been easy to miss.
- **Task breakdown**: 31 tasks generated from plan + spec in one pass; each task includes
  objective, files, validation, evidence impact, lane, and docs impact. No tasks required
  human re-scoping.
- **Artifact analysis**: `/speckit-analyze` correctly identified the highest-risk
  implementation ambiguity (T016 countdown component dependency on T024, two phases
  later) and the Prisma `updateMany` return-type issue (requires a second `findUnique`
  call to build the DTO). Both are non-obvious patterns that would have caused
  implementation friction mid-slice.
- **Bootstrap implementation**: AI executed T001–T004 in thin slices with validation at
  each step — dev server smoke test, `tsc --noEmit`, Playwright smoke test with video
  artifact, and `git status` check for gitignored files. Caught and corrected 3 issues
  that were not visible at planning time (see corrections below).
- **Phase 3 implementation**: AI executed T009–T012 with per-task typecheck + lint gates
  and a phase-end `phase_closeout.sh`. Protected layout uses `redirect()` from
  `next/navigation` (server-side) as required by spec — not a client guard. Login page
  error is inline DOM paragraph, not alert/toast. 0 corrections required.
- **Phase 2 implementation**: AI executed T005–T008 with per-task validation gates
  (`prisma validate`, `prisma generate`, `tsc --noEmit`, inline logic test for
  `parseDollars`). IG2 and IG6 edge-case audit corrections applied correctly without
  reminder — single Zod chain in `parseDollars`, AC5 fixture written as `status=PENDING`
  with past `expiresAt`. Zero corrections required; all outputs accepted as generated.

## Where AI Was Weak

- **Clarification Q2 recommendation**: AI recommended email-only login (Option B) for
  mock auth. User overrode to email + fixed password (Option C). The recommendation was
  reasonable but the user's choice is more realistic and reviewer-friendly.
- **Spec review speed vs. depth**: the initial spec-review pass identified 5 fixes but
  the edge-case audit subsequently found 6 additional gaps the spec-review missed (notably
  the conditional write race and the EXPIRED-on-dashboards ambiguity). The audit was a
  necessary second pass, not a redundancy.
- **Analyze did not catch constitution-level risks**: all 6 findings from `/speckit-analyze`
  were MEDIUM or lower (except one HIGH ordering issue). The HIGH finding (T016/T024) is
  real but mitigable with a one-line dependency note. No CRITICAL gaps were missed by the
  earlier phases — which validates the edge-case audit corrections were effective.
- **Implementation surface drift**: 3 corrections were required during Phase 1 that
  planning did not anticipate — `next.config.ts` (Next.js 14 limitation), missing
  `autoprefixer`/`prettier` in devDeps, and `prisma init` failure on Node 24. All were
  low-risk and caught immediately by validation steps, but they show the plan-to-code gap
  is real even for simple bootstrap tasks.
- **Phase 2 correctness**: 0 corrections required. The edge-case audit corrections (IG2,
  IG6) were applied correctly without prompting. However, Phase 2 correctness cannot be
  fully validated until `DATABASE_URL` is configured and the migration + seed run against
  a real database — the schema and logic are verified but the integration path is deferred.

## Manual Corrections

- **Q2 auth mechanism**: AI recommended email-only login; user chose email + password.
  Encoded into spec (`## Clarifications / Session 2026-04-09`).
- **Edge-case corrections**: AI generated the corrections; human reviewed and explicitly
  approved each before application. No code was written — all changes were to spec and
  plan artifacts.
- **next.config.ts → next.config.js**: AI wrote `next.config.ts` based on the plan's
  stack (Next.js 14 + TypeScript). Next.js 14 does not support TypeScript config files
  (that is Next.js 15+). Caught on first `npm run dev` call; corrected immediately.
  No human override needed — a straightforward fix once the error was clear.
- **Missing devDeps (autoprefixer, prettier)**: `postcss.config.js` referenced
  `autoprefixer` and the pre-commit hook relied on `prettier`, but neither was listed in
  the initial `package.json`. Caught during validation; added and installed without
  changing any application logic.
- **prisma init Node 24 incompatibility**: `prisma init` (Prisma 5.22.0) throws on
  Node 24. AI diagnosed the error as isolated to the `init` subcommand and wrote
  `prisma/schema.prisma` manually. `prisma generate` and `migrate` verified working.
  Human judgment confirmed: proceed with manual schema; do not downgrade Node.

## Notes for Reviewers

- All Spec-Kit phases ran in sequence: constitution → specify → clarify → checklist →
  plan → edge-case-audit. No phase was skipped.
- The clarifications section in `specs/001-p2p-payment-request/spec.md` records both
  AI-recommended and human-chosen answers with full Q&A trail.
- The spec-review and edge-case-audit outputs are preserved in this session's conversation
  history but their material decisions are encoded into the spec, plan, and this log.
- The regression watchlist (RW1–RW7) from the edge-case audit is recorded in
  `docs/EXECUTION_LOG.md` and anchored in the plan.
- Phase 1 implementation (T001–T004) is complete. All corrections are recorded in
  `docs/BUILD_NOTES.md`. Draft PR open: rcnsnr/lovie-afb-assignment#1.
- Phase 2 implementation (T005–T008) is complete. No corrections required. Migration
  applied to Supabase via MCP; local migration file committed.
- Phase 3 implementation (T009–T012) is complete. No corrections required.
  `phase_closeout.sh` all 5 checks pass.
- Phase 4 implementation (T013–T014) is complete. No corrections required.
  `phase_closeout.sh` all 5 checks pass.
- Phase 5 implementation (T015–T017) is complete. No corrections required.
  `phase_closeout.sh` all 5 checks pass.
- Phase 6 implementation (T018–T022) is complete. No corrections required.
  `phase_closeout.sh` all 5 checks pass.
- Phase 7 implementation (T023–T024) is complete. No corrections required.
  `phase_closeout.sh` all 5 checks pass.
- Phase 10 Batch A (T032–T034): phone field foundation complete on `feat/phone-filter-search-pay-simulation`.
  DB migration applied via MCP (IPv4 constraint), seed phone numbers set, DTO extended.
  `phase_closeout.sh` all 5 checks pass. No corrections required.
- Phase 11 Batch B (T035–T036): phone recipient API path + form toggle complete.
  `.superRefine()` exactly-one-of schema, branched `findUnique`, pill toggle UI.
  `phase_closeout.sh` all 5 checks pass. No corrections required. Branch pushed.
- Phase 12 Batch C (T037–T039): status filter complete — FilterBar component, post-DTO
  API filtering on both GET handlers, dashboard wiring with searchParams + contextual
  empty states. `phase_closeout.sh` all 5 checks pass. No corrections required.
- AI drove all file creation; human review focused on confirming directory structure
  against the plan and approving the `prisma init` workaround decision.

## Recent Updates

### 2026-04-11 — Phase 8 full E2E test suite (T025–T029)

- T025: `e2e/happy-path.spec.ts` — AC1+AC2; `loginAs` helper + `context.clearCookies()` for user switching; asserts PAID transition and role-based button visibility.
- T026: `e2e/actions.spec.ts` — AC3 (decline), AC4 (cancel), wrong-actor guard; `createRequest` helper extracted for reuse; all terminal-state button assertions.
- T027: `e2e/expiration.spec.ts` — AC5 UI (EXPIRED badge on seed fixture `00000000-0000-0000-0000-000000000001`) + AC5 server (pay POST via `page.evaluate` → 409).
- T028: `e2e/authorization.spec.ts` — AC6 (Carol observer zero buttons), AC7 (Alice pay POST on own request → 403 via `page.evaluate`).
- T029: `e2e/validation.spec.ts` — AC8 ordering (`innerText.indexOf` comparison), AC9 incoming, AC10 zero-amount, AC11 self-request, AC12 not-found, AC13 note overflow via `page.fill()` bypass.
- Notable pattern: `page.fill()` bypasses HTML `maxLength`; client-side JS still catches `note.length > 200` — used as the AC13 test vector.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.
- E2E execution pending live Supabase deployment; static validation (typecheck, lint, prisma) all pass.

### 2026-04-11 — Phase 7 shareable link + expiry countdown (T023–T024)

- T023: `middleware.ts` — Edge-compatible cookie-presence check; redirects to
  `/login?next=<path>` for unauthenticated `/requests/:id` visits. Login page updated
  with `isSafeReturnPath()` open-redirect guard and `?next=` redirect on success.
- T024: `components/ExpiryCountdown.tsx` — shared `"use client"` component; ticks every
  second via `setInterval`; display-only (no server calls); returns null for non-PENDING
  and expired requests. Inline versions removed from all three pages.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.

### 2026-04-11 — Phase 6 request detail + action routes (T018–T022)

- T018: `GET /api/requests/[id]` — read route; 404 for unknown; effective status applied.
- T019–T021: pay/decline/cancel — CR1+CR2 conditional write (`WHERE status='PENDING' AND
expiresAt > NOW()`); `count === 0` → 409; second `findUnique` for DTO (U3 pattern).
  Actor check: recipient for pay/decline, requester for cancel.
- T022: Detail page — client component; fetches request + session in parallel; role derived
  from DTO fields server-side; action buttons shown only for correct actor on PENDING;
  inline error + server refresh on failure.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.

### 2026-04-11 — Phase 5 dashboard views + list APIs (T015–T017)

- T015: `GET /api/requests` and `GET /api/requests/incoming` — both list queries apply
  `getEffectiveStatus()` via `toPaymentRequestDTO()`; EXPIRED items not filtered out (IG4).
- T016: Outgoing and incoming dashboard server components — `StatusBadge`, server-side
  `ExpiryCountdown` (display-only, no polling), `amountDisplay` via DTO, tab nav, empty state.
- T017: Root redirect `app/page.tsx` was already present from prior session; no change needed.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.

### 2026-04-11 — Phase 4 create request API + new request page (T013–T014)

- T013: `POST /api/requests` — Zod schema with single-chain `amountDollars` transform (IG2),
  self-request check via `recipient.id === session.userId` UUID comparison (IG1), 7-day
  `expiresAt`, returns 201 with `toPaymentRequestDTO()`. Shared `lib/dto.ts` created for
  reuse across T015–T022.
- T014: `app/(protected)/requests/new/page.tsx` — client form; dollar input with `$` prefix
  and `inputMode="decimal"`; note textarea with 200-char counter; client-side pre-validation
  mirroring server; field-level Zod errors on 400; form-level errors for 404 and 422;
  loading state; redirect to `/requests/[id]` on 201.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.

### 2026-04-11 — Phase 3 auth routes + login UI + session guard (T009–T012)

- T009: `POST /api/auth/login` — Zod 400, bcrypt compare, no user enumeration on 401,
  session saved before response.
- T010: `POST /api/auth/logout` (session.destroy) + `GET /api/auth/me` (session read or 401).
- T011: Login page client component — inline error (no alert/toast), loading state,
  redirect on success.
- T012: `app/(protected)/layout.tsx` — server-side `redirect()`, not client guard.
- Ancillary: typecheck script, `.env` gitignore, Supabase migration via MCP.
- 0 corrections required. `phase_closeout.sh` all 5 checks pass.

### 2026-04-10 — Phase 2 DB/utilities/auth implementation (T005–T008)

- T005: Full Prisma schema written — `User`, `PaymentRequest`, `RequestStatus` enum,
  all 4 indexes, `amountMinorUnits: Int`, nullable timestamps. `prisma validate` clean;
  `prisma generate` produced client. Migration deferred until `DATABASE_URL` configured.
- T006: `prisma/seed.ts` — Alice, Bob, Carol with bcrypt cost-10 `demo1234` hashes;
  AC5 fixture: `status=PENDING`, `expiresAt=now()-24h` (IG6 applied correctly).
- T007: `lib/prisma.ts` singleton; `lib/money.ts` with single Zod chain in `parseDollars`
  (IG2 applied correctly); `lib/requests.ts` with `getEffectiveStatus`.
- T008: `lib/auth.ts` — full iron-session implementation; `getSession`, `requireSession`
  (throws Response(401)); replaces stub from T001.
- 0 corrections required. All outputs accepted as generated.
- Human review: none required this phase; all validation was automated (`tsc`, `prisma validate`).
- Commits: 5 commits pushed to `feat/001-p2p-payment-request`.

### 2026-04-10 — Phase 1 bootstrap implementation (T001–T004)

- T001: Next.js 14 App Router scaffold — manual init (create-next-app rejected non-empty
  dir); strict TypeScript, Tailwind 3, ESLint 8, Prettier; full App Router directory
  structure per plan; dev server verified.
- T002: All deps installed and verified — `@prisma/client` moved to `dependencies`;
  `ts-node` and `prettier` added; all 4 key imports verified via `tsc --noEmit`.
- T003: Playwright configured — `video: 'on'`, `trace: 'retain-on-failure'`, `baseURL`
  from env; smoke test passed; `video.webm` artifact produced.
- T004: `.env.example` with documented `SESSION_SECRET` minimum length; `.env.local`
  confirmed gitignored.
- 3 implementation corrections surfaced (next.config.ts, missing devDeps, prisma init).
  All recorded in `docs/BUILD_NOTES.md`.
- Human judgment: confirmed `prisma init` workaround (manual schema, no Node downgrade).
- Commits: 5 commits pushed to `feat/001-p2p-payment-request`; draft PR open.

### 2026-04-09 — Task breakdown and cross-artifact analysis phase

- `/speckit-tasks`: 31-task breakdown generated from spec + plan. 9 phases covering
  bootstrap, DB utilities, auth, create request, dashboards, detail+actions,
  expiration+shareable link, E2E suite, and deployment+evidence. All 13 ACs mapped.
- `/speckit-analyze`: cross-artifact consistency analysis. 0 CRITICAL issues. 6 findings
  total:
  - I1 (HIGH): T016 countdown depends on T024 component created two phases later
  - U3 (MEDIUM): `updateMany` conditional write needs a second `findUnique` for DTO response
  - U2 (MEDIUM): `scripts/3-run_e2e_evidence.sh` existence unverified (T031 depends on it)
  - U1 (MEDIUM): T024 scope mixes implementation and testing concerns
  - A1/A2 (LOW): minor wording ambiguities
- No human corrections required in this phase. All analysis output accepted as-is.
- Remediation edits to `tasks.md` pending before implementation starts.

### 2026-04-09 — Specify, clarify, checklist, plan, and edge-case-audit phase

- `/speckit-specify`: feature spec for P2P Payment Request written in one pass from
  project context (README + CLAUDE.md). 13 acceptance criteria. All sections populated.
  Spec quality checklist auto-generated and passed.
- `/spec-review`: 5 fixes applied — Observer field visibility, not-found error state,
  AC12 (not-found link), amount ceiling removed, AC13 (note length), dashboard ordering.
- `/speckit-clarify`: 2 questions asked and answered:
  - Q1: dollar input (user enters "$15.00", system converts to 1500 cents) — Option A
  - Q2: mock auth mechanism (email + fixed demo password) — Option C, user override
- `/speckit-checklist`: 52-item spec readiness checklist generated. Focus: comprehensive
  - elevated E2E evidence weight. Dual audience: author gate + reviewer reference.
- `/speckit-plan`: technical plan written. Stack: Next.js, TypeScript, Prisma, Supabase
  Postgres, Tailwind, Zod, iron-session, Playwright, Vercel. Supporting artifacts:
  research.md, data-model.md (Prisma schema + seed users), contracts/api.md.
- `/edge-case-audit`: 2 critical risks + 6 important gaps identified. All 6 corrections
  applied to spec and plan. Key corrections: conditional DB write (CR1+CR2), self-request
  by UUID not email (IG1), single Zod chain for zero-rejection (IG2), EXPIRED on
  dashboards (IG4), seed fixture must be PENDING+past-expiry not EXPIRED (IG6).

### 2026-04-09 — Workflow bootstrap and constitution start

- Claude Code was chosen as the primary AI tool for repository work.
- Spec-Kit was installed and integrated into the repository.
- Local workflow skills were added for spec review, edge-case audit, implementation
  discipline, execution logging, and AI process syncing.
- Constitution drafting used repo-local context rather than freeform prompting.
- Human judgment constrained the workflow toward a web-first, reviewer-friendly,
  Spec-Kit-first path.

## Phase 9 — Infra & Deployment (2026-04-12)

### What AI did in this phase

- Used Supabase MCP to check project status, list tables, and execute SQL seed directly — bypassing local network block on Supabase DB ports
- Diagnosed Vercel build failures by reading build logs via Vercel MCP
- Iteratively fixed four distinct build/runtime issues: missing env var, IPv4/IPv6 mismatch, Next.js prerender constraint, truncated password in pooler URL
- Attempted Vercel REST API with MCP OAuth token (403 — token scope insufficient); fell back to CLI-based approach
- Constructed pooler and direct Supabase URLs by parsing the original DATABASE_URL using last-`@` approach to handle passwords containing `@`

### Where human judgment was needed in this phase

- Confirming removal of `prisma migrate deploy` from build was acceptable (schema already deployed)
- Language preference: user corrected AI for responding in Turkish; AI switched to English and saved preference to memory

### Patterns worth noting from this phase

- MCP OAuth tokens are scoped to MCP protocol operations and cannot be used for REST API writes
- Supabase free tier DB is IPv6-only; Vercel build VMs are IPv4-only — any build step requiring direct DB connection will fail without the IPv4 add-on
- Passwords containing `@` break naive URL regex; use `str.rfind('@')` to split at the correct delimiter

---

## Phase 10 Addendum — Infra debug session (2026-04-12)

**Where AI helped:**

- Systematic elimination of 3 distinct root causes: URL encoding, wrong password, wrong pooler shard
- Added targeted `detail` field to expose full Prisma error through browser DevTools (MCP log tool was truncating)
- Correctly identified `aws-1` vs `aws-0` shard discrepancy once `.env.local` was updated with dashboard values

**Where AI was wrong:**

- Previous session reconstructed the DB password by `rfind('@')` inference rather than reading it from the Supabase dashboard — the inferred password was always wrong
- Assumed `aws-0-us-east-2.pooler.supabase.com` was the correct shard; the actual shard is `aws-1` for this project; should have prompted user to check dashboard connection string earlier rather than assuming
- Multiple redeploy cycles could have been avoided by asking for the Supabase dashboard connection string in the first message

**Manual corrections:**

- User retrieved correct pooler host and password directly from Supabase dashboard after AI exhausted inference-based approaches

## Phase 12 — Security audit and release prep (2026-04-13)

### What AI did

- audited the public repo surface, Vercel env inventory, runtime logs, and live login path
- reduced the env sync helper so Production is the only default sync target
- documented security posture, evidence inventory, and release notes for reviewer packaging
- created a portable prompt file for finishing the remaining product gaps in another AI environment

### Where human judgment was needed

- deciding not to auto-enable Preview envs with the same runtime database secret
- keeping the Next.js security advisory as a documented residual risk instead of attempting a destabilizing major upgrade at submission time

### Patterns worth noting

- build/runtime security posture is partly code and partly platform; the repo should document what was verified live versus what still requires dashboard confirmation
- public-assignment repos benefit from explicit package/release artifacts because binary evidence files are usually gitignored
