# AI Process Log

Use this document to show how AI was used in a controlled way.

## Tools Used

| Stage             | Tool        | Why                                                  |
| ----------------- | ----------- | ---------------------------------------------------- |
| Spec framing      | Claude Code | Derived feature spec from README + CLAUDE.md context |
| Clarification     | Claude Code | Structured Q&A — 2 targeted questions, user answered |
| Spec review       | Claude Code | Skill-driven audit; 5 fixes identified and applied   |
| Checklist         | Claude Code | 52-item requirements quality checklist generated     |
| Planning          | Claude Code | Technical plan, data model, API contracts produced   |
| Edge-case audit   | Claude Code | 6 gaps found; corrections applied to spec/plan only  |
| Task breakdown    | Claude Code | 31 tasks across 9 phases; full AC-to-task mapping    |
| Artifact analysis | Claude Code | 0 CRITICAL, 6 findings; 100% AC coverage confirmed   |
| Implementation    |             | Not started                                          |
| Review            |             | Not started                                          |
| Evidence prep     |             | Not started                                          |

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

## Manual Corrections

- **Q2 auth mechanism**: AI recommended email-only login; user chose email + password.
  Encoded into spec (`## Clarifications / Session 2026-04-09`).
- **Edge-case corrections**: AI generated the corrections; human reviewed and explicitly
  approved each before application. No code was written — all changes were to spec and
  plan artifacts.

## Notes for Reviewers

- All Spec-Kit phases ran in sequence: constitution → specify → clarify → checklist →
  plan → edge-case-audit. No phase was skipped.
- The clarifications section in `specs/001-p2p-payment-request/spec.md` records both
  AI-recommended and human-chosen answers with full Q&A trail.
- The spec-review and edge-case-audit outputs are preserved in this session's conversation
  history but their material decisions are encoded into the spec, plan, and this log.
- No implementation code has been written yet. All artifacts at this stage are
  specification, planning, and documentation.
- The regression watchlist (RW1–RW7) from the edge-case audit is recorded in
  `docs/EXECUTION_LOG.md` and anchored in the plan.

## Recent Updates

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
