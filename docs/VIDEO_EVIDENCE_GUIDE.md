# Video Evidence Guide

## Reviewer Goal

The reviewer does not need hours of raw screen recording.
The reviewer needs confidence that:

- the feature works
- the flow is reproducible
- the E2E suite is real
- the workflow was controlled
- AI usage was structured rather than careless

## Recommended Evidence Pack

Produce these artifacts:

1. `artifacts/videos/e2e-happy-path.mp4`
2. `artifacts/videos/e2e-expired-request.mp4`
3. `artifacts/traces/trace.zip`
4. `artifacts/walkthrough/walkthrough-build-and-evidence.mp4`

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
