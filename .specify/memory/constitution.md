<!--
## Sync Impact Report

- Version change: 0.0.0 → 1.0.0
- Type: MINOR (initial ratification — all sections populated from template)
- Modified principles: none (first ratification)
- Added sections:
  - Core Principles (I–V)
  - Technology and Architecture Constraints
  - Development and Review Workflow
  - Governance
- Removed sections: none
- Templates reviewed:
  - .specify/templates/overrides/plan-template.md ✅ aligned
  - .specify/templates/overrides/spec-template.md ✅ aligned
  - .specify/templates/overrides/tasks-template.md ✅ aligned
- Deferred TODOs: none
-->

# P2P Payment Request Constitution

## Core Principles

### I. Spec-First Workflow

Every feature MUST begin with a completed spec, clarification pass, and checklist before any
implementation starts. The Spec-Kit sequence is the authoritative delivery workflow. Skipping from
ambiguity directly into code is forbidden. If a plan or implementation decision changes intended
behavior, the spec and notes MUST be updated to reflect the change.

Rationale: Prevents invisible scope drift and keeps reviewer-facing reasoning explicit throughout
the build.

### II. Money Safety

All monetary values MUST be stored as integer minor units (e.g. cents). Floating-point money
persistence is forbidden. Amount validation MUST enforce a value greater than zero. Formatting
(display, creation form, dashboard) MUST be consistent across all views. No partial payments.
No post-creation amount editing.

Rationale: Monetary bugs are high-severity and often silent. Integer-only storage eliminates a
class of rounding and precision errors entirely.

### III. Lifecycle Integrity

Payment requests MUST follow the canonical state model: PENDING, PAID, DECLINED, CANCELLED,
EXPIRED. Only these transitions are allowed:

- PENDING → PAID
- PENDING → DECLINED
- PENDING → CANCELLED
- PENDING → EXPIRED

Terminal states (PAID, DECLINED, CANCELLED, EXPIRED) MUST remain terminal. No transition out of
a terminal state is permitted. Expiration MUST be enforced server-side. The countdown timer is
display-only and MUST NOT be the source of truth for expiration.

Rationale: Lifecycle correctness is a correctness guarantee for financial state, not a UX detail.
Broken transitions corrupt user trust and audit trails.

### IV. Authorization Enforcement

Mock email auth is acceptable for this assignment. Authorization rules are still mandatory and
MUST be enforced server-side regardless of auth mechanism. Rules:

- Only the recipient can pay or decline a PENDING request.
- Only the sender can cancel a PENDING request.
- Shareable links MUST NOT grant state-changing actions without session-level authorization.
- Client-only state MUST NOT be trusted for action authorization.

Rationale: Authorization failures in fintech produce real harm. Keeping rules explicit and
server-enforced prevents bypass via link sharing, direct API calls, or UI manipulation.

### V. Evidence-Driven Delivery

E2E tests and video artifacts are first-class deliverables, not post-build cleanup. Coverage MUST
include: request creation, incoming request action path, outgoing request visibility, expiration
behavior, and authorization-sensitive actions. A meaningful change without a validation receipt
is incomplete. If validation did not run, that omission MUST be stated explicitly.

Rationale: Reviewers cannot audit intent without reproducible evidence. Invisible fixes and
untested paths undermine the value of the entire delivery.

## Technology and Architecture Constraints

- Prefer a modular monolith. One deployable app.
- Do not introduce microservices, queues, websockets, or service splits without an
  assignment-specific need that cannot be met otherwise.
- Preferred stack: Next.js, TypeScript, Prisma, Supabase Postgres, Tailwind CSS, Playwright,
  Zod, Vercel.
- Strict TypeScript. Avoid `any`. Keep the dependency surface intentionally small.
- Supabase is used primarily as a managed Postgres provider. Broader platform features require
  explicit justification.
- Vercel is the primary deployment path. Netlify is an acceptable fallback, not the default.
- Do not treat Expo Go as the main delivery path.
- Keep the schema easy to explain during review. Avoid speculative schema complexity.

## Development and Review Workflow

- Follow the Spec-Kit sequence: constitution → specify → clarify → checklist → plan → tasks →
  analyze → implement.
- Use the model and effort controls defined in CLAUDE.md for each phase.
- After every meaningful change, produce a validation receipt: changed files, expected behavior,
  checks run, evidence produced, explicit omissions.
- Keep these docs current when behavior, assumptions, or tradeoffs change:
  - `README.md`
  - `docs/ASSUMPTIONS.md`
  - `docs/BUILD_NOTES.md`
  - `docs/AI_PROCESS.md`
  - `docs/EXECUTION_LOG.md`
  - E2E evidence references
- Do not leave reasoning only in chat history. Document it.
- Run `bash scripts/0-auto_fix_and_validate.sh .` after meaningful edits as standard hygiene.

## Governance

This constitution supersedes all other practices for this repository. Amendments require:

1. A stated reason for the change.
2. A version bump following semantic versioning:
   - MAJOR: backward-incompatible governance or principle removal/redefinition.
   - MINOR: new principle or section added or materially expanded.
   - PATCH: clarifications, wording, or non-semantic refinements.
3. An updated Sync Impact Report prepended as an HTML comment.
4. Updated `LAST_AMENDED_DATE`.

All PRs and reviews MUST verify compliance with these principles. Complexity MUST be justified
against the principles, not introduced by default. Use CLAUDE.md and `docs/standards/` for
runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
