# Research Notes: P2P Payment Request

No NEEDS CLARIFICATION items in the spec. The stack, auth mechanism, money handling,
and lifecycle enforcement are all fully defined through constitution, clarifications,
and implementation-defaults.md. This file documents decisions and alternatives considered.

---

## Decision: Session / Auth Library

- **Decision**: `iron-session` (signed, encrypted cookie sessions) for mock auth
- **Rationale**: Zero-config, works with Next.js App Router route handlers and server
  components, no external auth provider needed. Deterministic — credentials are
  hardcoded in the seed. Avoids the complexity of NextAuth for a mock-only flow.
- **Alternatives considered**:
  - NextAuth: overkill for mock auth; adds provider configuration complexity
  - JWT in localStorage: not SSR-friendly and exposes tokens to XSS
  - Supabase Auth: adds platform coupling; constitution says use Supabase as Postgres only

## Decision: ORM and Migration

- **Decision**: Prisma ORM with `prisma migrate dev` (local) and `prisma migrate deploy`
  (production)
- **Rationale**: Type-safe schema, automatic migration files, Supabase Postgres compatible,
  easy to explain to reviewers. Prisma Client generates types that feed directly into
  strict TypeScript.
- **Alternatives considered**:
  - Drizzle ORM: viable but less familiar as a reviewer-friendly default
  - Raw SQL: correct but eliminates type safety without adding meaningful value

## Decision: Amount Conversion

- **Decision**: User enters dollar value (e.g. "15.00"); system converts to minor units
  (cents) server-side before storage. Display always formats as "$X.XX".
- **Rationale**: Consumer UX expectation (from clarification Q1). Conversion in a single
  utility function keeps all rounding behavior explicit.
- **Alternatives considered**:
  - Minor-unit input: technically safer but poor UX for consumers
- **Conversion utilities** (`lib/money.ts`):
  - `parseDollars(input: string): number` — validates format, returns cents
  - `formatCents(cents: number): string` — returns "$X.XX"

## Decision: Expiration Enforcement

- **Decision**: Implicit expiration evaluated on every server read. When a PENDING request
  has `expiresAt < now()`, the effective status returned is EXPIRED. No DB write needed
  on read; state-changing actions also re-check before executing.
- **Rationale**: Acceptable for demo scope; avoids background jobs entirely per constitution
  and non-goals. The limitation (stale dashboard counts between reads) is accepted and
  documented.
- **Alternatives considered**:
  - Background cron: overengineered for demo; adds infrastructure not needed
  - DB trigger: database-specific; harder to explain in review

## Decision: Zod Validation

- **Decision**: Zod schemas for all request bodies, validated server-side in route handlers
  before any DB operation.
- **Rationale**: Runtime type safety at the API boundary; schema doubles as documentation.
  Works well with TypeScript strict mode.

## Decision: Shareable Link

- **Decision**: Request UUID is the shareable link path segment: `/requests/[id]`
- **Rationale**: UUID v4 is unguessable by default, requires no separate token generation.
  The request ID serves as both the DB key and the link identifier.

## Decision: Phone Recipient Lookup

- **Decision**: Exact match on `User.phone` field via `prisma.user.findUnique({ where: { phone } })`.
  No normalization library; phone stored as entered (E.164-like format enforced by Zod).
- **Rationale**: Demo-scale simplicity. Seeded users have consistent E.164 format.
- **Alternatives considered**: libphonenumber-js normalization — adds dependency with no
  reviewer-visible benefit at demo scale.

## Decision: Dashboard Filter/Search Architecture

- **Decision**: Server component pages read `searchParams` from Next.js App Router props.
  Fetch all records, map to DTOs (applying `getEffectiveStatus`), then filter in application
  code. Client components (`FilterBar`, `SearchInput`) update URL params via
  `router.push/replace` triggering soft navigation.
- **Rationale**: EXPIRED filter must happen post-`getEffectiveStatus()` — a DB-level WHERE
  would miss implicitly expired PENDING rows. Application-level filter is correct and
  sufficient at demo scale.
- **Alternatives considered**: Full client component dashboards — more complex; server
  component hybrid is simpler and preserves the existing data-fetching pattern.

## Decision: Contact Card — No New API Endpoint

- **Decision**: Relationship metrics computed server-side in dashboard page server components
  via one additional `prisma.paymentRequest.findMany` query (both-direction, include requester
  and recipient). No new `/api/contacts` or `/api/metrics` endpoint.
- **Rationale**: Dashboard pages are already server components that call Prisma directly.
  A new API endpoint would require client-state management in pages that currently have none.
  Server-side computation keeps data access co-located with the page that needs it.
- **Alternatives considered**: GET /api/contacts?search= endpoint — unnecessary indirection
  at demo scale; adds a round-trip without architectural benefit.

## Decision: Contact Card — Shared Helper Module

- **Decision**: `lib/contact-metrics.ts` extracts `resolveMatchedContact` and
  `computeContactMetrics` to avoid duplication between outgoing and incoming dashboard pages.
- **Rationale**: Both pages share identical ~50-line detection + metrics logic. The extraction
  removes a single concrete duplication. Not a general utility library.
- **Alternatives considered**: Inline in each page — duplicates the same Prisma query and
  aggregate logic in two files; maintainability cost > abstraction cost.

## Decision: Contact Card — Detection Uses `allDtos` Not Status-Filtered Set

- **Decision**: Single-contact detection iterates `allDtos` (the full pre-status-filter DTO
  set for that dashboard direction), not the status-filtered subset.
- **Rationale**: AC30 requires the card to remain visible when the status filter changes.
  Using the status-filtered set would hide the card when the user switches to a status where
  no requests with that contact happen to appear.
- **Alternatives considered**: Detect from filtered set — fails AC30; contradicts spec F13
  step 7 ("card is independent of the active status filter").

## Decision: Pay Simulation Delay Placement

- **Decision**: `await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))`
  placed AFTER authorization checks and BEFORE the conditional `updateMany` write.
- **Rationale**: Delay only runs on authorized attempts. Conditional write still catches
  concurrent mutations and expiration races that occur during the delay window.

## Decision: Success Banner Dismiss

- **Decision**: Auto-dismiss after 5 seconds via `useEffect` + `setTimeout`. X button for
  manual dismiss. Separate `paySuccess` boolean state from `loading`.
- **Rationale**: 5 seconds is enough to read confirmation, aligns with E2E assertion
  windows, and doesn't permanently clutter the UI.
