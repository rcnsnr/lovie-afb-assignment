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

This produces 15 named `.webm` videos and 15 named `.zip` traces in `artifacts/`:

- `artifacts/videos/happy-path-AC1-AC2-*.webm` — create request + pay flow
- `artifacts/videos/expiration-AC5-*.webm` — expired request badge + server 409
- `artifacts/videos/actions-AC3-*.webm`, `actions-AC4-*.webm` — decline + cancel
- `artifacts/videos/authorization-AC6-*.webm`, `authorization-AC7-*.webm` — observer + wrong actor
- `artifacts/traces/*.zip` — all 15 traces, viewable at <https://trace.playwright.dev>

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

Recommended final evidence layout:

```text
artifacts/
  videos/
    e2e-happy-path.mp4
    e2e-expired-request.mp4
  traces/
    trace.zip
  walkthrough/
    walkthrough-build-and-evidence.mp4
```

Link these from the project README.
