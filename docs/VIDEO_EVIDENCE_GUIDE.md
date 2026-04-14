# Video Evidence Guide

## Reviewer Goal

The reviewer does not need hours of raw screen recording.
The reviewer needs confidence that:

- the feature works
- the flow is reproducible
- the E2E suite is real
- the workflow was controlled
- AI usage was structured rather than careless

## Actual Evidence Pack (as delivered)

Artifacts are tracked in git under `artifacts/`. Re-collect with:

```bash
BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .
```

This produces **34 named `.webm` videos** and **34 named `.zip` traces** in
`artifacts/`:

- `artifacts/videos/happy-path-AC1-AC2-*.webm` — create request + pay flow
- `artifacts/videos/actions-AC3-*.webm`, `actions-AC4-*.webm`,
  `actions-Wrong-actor-*.webm` — decline, cancel, wrong-actor guard
- `artifacts/videos/expiration-AC5-*.webm`,
  `expiration-AC5-server-*.webm` — expired badge + server 409
- `artifacts/videos/authorization-AC6-*.webm`,
  `authorization-AC7-*.webm` — observer view + wrong actor (403)
- `artifacts/videos/validation-AC8-*.webm` …
  `validation-AC13-*.webm` — dashboard order, edge cases
- `artifacts/videos/filter-search-AC14-*.webm` …
  `filter-search-AC19-*.webm` — pills, search, combined filter, soft nav
- `artifacts/videos/phone-AC20-*.webm` … `phone-AC23-*.webm` — email/phone
  toggle, phone create, not-found, self-request
- `artifacts/videos/pay-simulation-AC24-*.webm`,
  `pay-simulation-AC25-*.webm` — spinner + success banner
- `artifacts/videos/contact-summary-card-AC26-*.webm` …
  `contact-summary-card-AC32-*.webm` — single-match identity + metrics,
  zero/multi/empty match variants, status-filter persistence, mobile
  375px layout, controls surface wrapper
- `artifacts/videos/smoke-*.webm` — baseline smoke
- `artifacts/traces/*.zip` — 34 matching traces, viewable at
  <https://trace.playwright.dev>

## Strong Evidence Pattern

The strongest pattern is:

- automated Playwright video
- automated Playwright trace
- short narrated walkthrough
- README links to evidence
- AI process log aligned with the evidence

## What the Walkthrough Should Show

4 to 8 minutes is enough.

Recommended structure:

1. open with scope and reviewer goal
2. show repository evidence
3. show Spec-Kit artifacts
4. show `CLAUDE.md` and local skills briefly
5. show the working product flow
6. run E2E
7. show produced video and trace files
8. explain 2-4 important tradeoffs
9. close with deployment/demo link

## What Not To Show

Do not waste time on:

- long terminal idle periods
- every prompt ever written
- unrelated setup noise
- framework lore
- broad architecture speeches
- global personal tooling unrelated to this repo

## Minimum Acceptable Walkthrough Script

- what was built
- how the workflow was structured
- where the spec lives
- how AI was used
- how correctness was checked
- where the reviewer can find evidence

## Packaging

Current final evidence layout:

```text
artifacts/
  videos/
    happy-path-AC1-AC2-...webm
    actions-AC3-...webm, actions-AC4-...webm, actions-Wrong-actor-...webm
    expiration-AC5-...webm, expiration-AC5-server-...webm
    authorization-AC6-...webm, authorization-AC7-...webm
    validation-AC8-...webm … validation-AC13-...webm
    filter-search-AC14-...webm … filter-search-AC19-...webm
    phone-AC20-...webm … phone-AC23-...webm
    pay-simulation-AC24-...webm, pay-simulation-AC25-...webm
    contact-summary-card-AC26-...webm … contact-summary-card-AC32-...webm
    smoke-...webm
  traces/
    (34 matching .zip files)
```

Optional extra evidence:

```text
artifacts/
  walkthrough/
    walkthrough-build-and-evidence.mp4
```

The narrated walkthrough is optional; the 34 automated E2E videos are the
reviewer evidence source of truth.
