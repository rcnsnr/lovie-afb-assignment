# Release Notes

<!-- markdownlint-disable MD024 -->

## v1.1 — 2026-04-14 (current)

### What ships

Built on top of v1.0. Extends the P2P payment request flow with four
scope additions driven by clarified acceptance criteria:

- **Status filter pills + dashboard search (Batch D, AC14–AC19)**
  - Six status pills render on outgoing and incoming dashboards
    (ALL / PENDING / PAID / DECLINED / CANCELLED / EXPIRED)
  - Debounced case-insensitive search across counterparty name, email,
    and phone with OR-logic matching
  - Combined `?status=` + `?search=` operates as intersection
  - Soft navigation — filter and search do not full-reload the page
  - FilterBar is a server component rendering `<Link>` elements; search
    is a client component wired to `router.replace` with a 300ms debounce
- **Phone as an alternative recipient contact (Batch F, AC20–AC23)**
  - `/requests/new` has an Email/Phone toggle; phone input accepts
    E.164-adjacent strings with normalization
  - Server validates presence, rejects unregistered phone numbers with
    an inline "recipient not found" message, and rejects self-requests
- **Explicit payment simulation (Batch E, AC24–AC25)**
  - `POST /api/requests/[id]/pay` sleeps 2–3s after the auth check and
    before the conditional write, so the UI can show a realistic
    spinner state
  - Pay button shows a spinner and is disabled during processing; a
    green "Payment successful!" banner appears alongside the PAID badge
    and auto-dismisses after 5s
  - Decline and cancel have no spinner — they remain immediate
- **Inline contact summary card (Batch C, AC26–AC32)**
  - When the dashboard search resolves to exactly one counterparty,
    a card appears above the request list with identity (name, email,
    optional phone) and relationship metrics (sent count, received
    count, pending $, paid $, declined $)
  - Detection runs on the pre-status-filter DTO list so the card
    persists across status-filter changes (AC30)
  - Card hides on zero matches, multi-match (2+ distinct counterparties),
    and empty search
  - Card stacks vertically at 375px — no horizontal scroll on mobile
  - Controls surface (pills + search + card) uses a soft
    brand-adjacent palette (slate background, blue-600 active pills)

### Architectural notes worth calling out

- **FilterBar is a server component** — this closes a reproducible dev-
  mode hydration race where a client-component `router.push` inside a
  `<Suspense>` boundary would read stale/null `useSearchParams()` at
  click time, leaving the URL unchanged and breaking AC30. Moving the
  pills to pure `<Link>` renders eliminated the race entirely and
  slightly reduced the client JS bundle for the dashboard route
- **SearchInput is prop-based**, not hook-based — it receives
  `initialSearch` and `currentStatus` from the server render; the
  debounced callback uses `router.replace` without depending on
  `useSearchParams`. Same benefit: no client-hook staleness surface

### Evidence

- 34/34 E2E tests pass against production
- `artifacts/videos/` — 34 `.webm` files, one per test
- `artifacts/traces/` — 34 `.zip` traces, replayable at
  <https://trace.playwright.dev>

---

## v1.0 — 2026-04-13

### What ships

- p2p payment request feature with create, detail, pay, decline, cancel,
  expiration, and observer flows (AC1–AC13)
- spec-first delivery package with spec, plan, tasks, assumptions, build
  notes, and AI process log
- Playwright E2E suite covering happy path, actions, authorization,
  expiration, validation, and smoke
- public Vercel deployment backed by Supabase Postgres

### Final hardening in this release

- made the GitHub repository public
- reduced Vercel production env scope to runtime-only secrets
- added baseline HTTP security headers
- added security audit and evidence index docs
- improved submission bundle packaging to include source, specs, docs,
  tests, prompts, and artifacts

### Completed follow-ups since v1.0

- ~~status filter + sender/recipient search on dashboards~~ — shipped in v1.1 (AC14–AC19)
- ~~phone as alternative recipient contact path~~ — shipped in v1.1 (AC20–AC23)
- ~~explicit 2–3 second payment simulation + success confirmation~~ — shipped in v1.1 (AC24–AC25)
- Contact summary card + UI polish — shipped in v1.1 (AC26–AC32)

### Open follow-ups

- upgrade Next.js to a patched release line and re-run full E2E
- optional narrated walkthrough video (automated videos currently serve
  as the reviewer evidence source of truth)
