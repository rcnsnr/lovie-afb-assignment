# Implementation Defaults

## Purpose

This file defines the condensed engineering defaults for this repository.
It keeps the useful quality rules visible without importing a large standards library.

---

## Scope

These defaults apply to:

- product code
- server actions or route handlers
- database schema and lifecycle logic
- frontend flows and forms
- utility scripts used during development or submission

These defaults do not attempt to cover:

- platform engineering
- Kubernetes
- IaC
- MCP governance
- multi-agent orchestration

---

## Architecture Defaults

- prefer a modular monolith
- prefer one deployable app
- keep UI, domain logic, persistence, and tests separable
- do not introduce microservices without a proven assignment-specific need
- do not add gateways, websockets, or queues unless the product clearly requires them

---

## Stack Defaults

Preferred stack:

- Next.js
- TypeScript
- Prisma
- Supabase Postgres
- Tailwind CSS
- Playwright
- Zod
- Vercel

Rules:

- use strict TypeScript
- avoid `any`
- keep the dependency surface intentionally small
- prefer tools that are easy for a reviewer to understand
- prefer web-first delivery unless there is a strong reason to do otherwise
- treat Netlify as fallback, not default
- do not treat Expo Go as the main delivery path

---

## Money and Lifecycle Defaults

- store money as integer minor units
- never persist money as float
- validate amount > 0
- keep formatting consistent across create, detail, and dashboard views
- enforce allowed state transitions server-side
- treat terminal states as terminal
- enforce expiration server-side

---

## Authorization Defaults

- mock auth is acceptable
- authorization is still mandatory
- only the recipient can pay or decline
- only the sender can cancel a pending request
- share links must not grant state-changing permission
- do not trust client-only state for action authorization

---

## Frontend and UX Defaults

- prefer responsive web delivery
- keep core flows obvious:
  - create request
  - review outgoing requests
  - review incoming requests
  - inspect request detail
  - act safely on request state
- every form and action must expose loading, success, and failure states
- avoid unnecessary page hops and long forms
- keep accessibility and keyboard navigation intact

---

## API and Data Handling Defaults

- prefer simple and explicit route or action boundaries
- return predictable validation and error responses
- keep mutation rules close to the server-side action that changes state
- surface meaningful errors during local development
- avoid magical cross-layer coupling

---

## Database Defaults

- use a relational model suitable for lifecycle-driven records
- prefer Supabase primarily as a managed Postgres provider unless broader platform features are clearly justified
- keep timestamps explicit:
  - createdAt
  - updatedAt
  - expiresAt
  - paidAt
  - declinedAt
  - cancelledAt
- index for expected dashboard and lookup queries
- keep the schema easy to explain during review
- avoid speculative schema complexity

---

## Testing Defaults

- treat E2E as first-class work, not post-build cleanup
- cover:
  - request creation
  - incoming request action path
  - outgoing request visibility
  - expiration behavior
  - authorization-sensitive actions
- prefer deterministic seeded users and fixture data
- if a bug appears, reproduce it before patching

---

## Debugging Defaults

- no fix without root-cause investigation first
- prefer a failing test or reproducible path before changing code
- compare working and failing paths explicitly
- keep build, test, and log noise isolated and summarized

---

## Documentation Defaults

Keep these current when behavior changes:

- `README.md`
- `docs/ASSUMPTIONS.md`
- `docs/BUILD_NOTES.md`
- `docs/AI_PROCESS.md`
- evidence references

Rules:

- document assumptions explicitly
- document deliberate simplifications honestly
- document where AI output was corrected by human judgment

---

## Script Defaults

If shell or Python scripts are added:

### Shell

- fail fast
- avoid destructive assumptions
- keep commands portable and explicit
- print what the script is doing

### Python

- use Python only for small utilities when it is the simplest choice
- keep scripts typed where practical
- keep entrypoints explicit
- avoid hidden environment coupling
- prefer deterministic CLI behavior

---

## Validation Receipt Rule

Every meaningful change should leave a small validation receipt containing:

- changed files
- expected behavior
- checks run
- evidence produced
- explicit omissions
