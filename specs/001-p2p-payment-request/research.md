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
