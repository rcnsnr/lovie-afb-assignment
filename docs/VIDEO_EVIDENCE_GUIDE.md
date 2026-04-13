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

Artifacts are gitignored (binary files). Re-collect with:

```bash
BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .
```

This produces 27 named `.webm` videos and 27 named `.zip` traces in `artifacts/`:

- `artifacts/videos/happy-path-AC1-AC2-*.webm` — create request + pay flow
- `artifacts/videos/actions-AC3-*.webm`, `actions-AC4-*.webm` — decline + cancel
- `artifacts/videos/expiration-AC5-*.webm` — expired request badge + server 409
- `artifacts/videos/authorization-AC6-*.webm`, `authorization-AC7-*.webm` — observer + wrong actor
- `artifacts/videos/validation-AC8-*.webm` … `validation-AC13-*.webm` — dashboard order, edge cases
- `artifacts/videos/filter-search-AC14-*.webm` … `filter-search-AC19-*.webm` — pills, search, combined filter, soft nav
- `artifacts/videos/phone-AC20-*.webm` … `phone-AC23-*.webm` — email/phone toggle, phone create, not-found, self-request
- `artifacts/videos/pay-simulation-AC24-*.webm`, `pay-simulation-AC25-*.webm` — spinner + success banner
- `artifacts/traces/*.zip` — all 27 traces, viewable at <https://trace.playwright.dev>

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
    actions-AC3-...webm, actions-AC4-...webm
    expiration-AC5-...webm (x2)
    authorization-AC6-...webm, authorization-AC7-...webm
    validation-AC8-...webm ... validation-AC13-...webm
    filter-search-AC14-...webm ... filter-search-AC19-...webm
    phone-AC20-...webm ... phone-AC23-...webm
    pay-simulation-AC24-...webm, pay-simulation-AC25-...webm
    smoke-...webm
  traces/
    (27 matching .zip files)
```

Optional extra evidence:

```text
artifacts/
  walkthrough/
    walkthrough-build-and-evidence.mp4
```

The narrated walkthrough is optional; the 27 automated E2E videos are the reviewer evidence source of truth.
