# Evidence Index

## Summary

Current evidence set, collected against production
(`https://lovie-afb-assignment.vercel.app`):

- 34 Playwright `.webm` videos in `artifacts/videos/` — one per test
- 34 matching Playwright `.zip` traces in `artifacts/traces/`
- no separate narrated walkthrough artifact; the automated videos are the
  reviewer evidence source of truth

Evidence is tracked in git under `artifacts/` (intentional repo-visible
bundle — `.gitignore` has `artifacts/` commented out).

## Scenario Mapping

Creation, action, and lifecycle:

- **happy path (AC1, AC2)**: `happy-path-AC1-AC2-*` — Alice creates request,
  Bob pays it
- **actions (AC3, AC4)**: `actions-AC3-*` (Bob declines), `actions-AC4-*`
  (Alice cancels), `actions-Wrong-actor-*` (Alice cannot decline her own
  sent request)
- **expiration (AC5)**: `expiration-AC5-*` (EXPIRED badge + no action
  buttons), `expiration-AC5-server-*` (Pay attempt on expired returns 409)
- **authorization (AC6, AC7)**: `authorization-AC6-*` (Carol is observer),
  `authorization-AC7-*` (Alice can't pay her own sent request — 403)

Validation and dashboard:

- **validation (AC8–AC13)**: `validation-AC8-*` (outgoing sorted most
  recent), `validation-AC9-*` (incoming dashboard), `validation-AC10-*`
  (amount zero rejected), `validation-AC11-*` (self-request rejected),
  `validation-AC12-*` (nonexistent ID shows not-found),
  `validation-AC13-*` (note over max length rejected)

Filter and search:

- **filter-search (AC14–AC19)**: `filter-search-AC14-*` (6 pills render),
  `filter-search-AC15-*` (PAID filter), `filter-search-AC16-*`
  (EXPIRED filter on incoming), `filter-search-AC17-*` (search by name),
  `filter-search-AC18-*` (combined filter + search), `filter-search-AC19-*`
  (soft navigation confirmed via window marker)

Phone recipient:

- **phone (AC20–AC23)**: `phone-AC20-*` (Email/Phone toggle),
  `phone-AC21-*` (create via phone), `phone-AC22-*` (unregistered phone
  shows inline error), `phone-AC23-*` (self-request via phone rejected)

Pay simulation:

- **pay-simulation (AC24, AC25)**: `pay-simulation-AC24-*` (spinner
  visible + button disabled during processing), `pay-simulation-AC25-*`
  (success banner after PAID; Decline has no spinner)

Contact summary card:

- **contact-summary-card (AC26–AC32)**: `contact-summary-card-AC26-*`
  (single match shows identity + metrics), three AC29 variants for
  zero/multi/empty match, `contact-summary-card-AC30-*` (status filter
  does not remove the card), `contact-summary-card-AC31-*` (mobile 375px
  stacked layout), `contact-summary-card-AC32-*` (controls surface
  wrapper rendered)

Smoke:

- **smoke**: `smoke-*` — app responds on `/`

## Re-collection Command

```bash
BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .
```

## Reviewer Note

Artifacts sit at repo root (`artifacts/`) for direct review. Each `.webm`
maps 1:1 to a test case, and each `.zip` opens in
<https://trace.playwright.dev> for step-by-step replay with timelines,
network calls, and DOM snapshots.
