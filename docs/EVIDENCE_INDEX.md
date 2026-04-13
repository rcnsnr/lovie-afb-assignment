# Evidence Index

## Summary

Current evidence set captured locally:

- 15 Playwright videos in `artifacts/videos/`
- 15 Playwright traces in `artifacts/traces/`
- no separate narrated walkthrough artifact yet

## Scenario Mapping

- happy path: `artifacts/videos/happy-path-AC1-AC2-*.webm` + matching trace zip
- actions: `artifacts/videos/actions-AC3-*.webm`, `actions-AC4-*.webm`, wrong-actor variant + matching traces
- expiration: `artifacts/videos/expiration-AC5-*.webm` + matching traces
- authorization: `artifacts/videos/authorization-AC6-*.webm`, `authorization-AC7-*.webm` + matching traces
- validation: `artifacts/videos/validation-AC8-*.webm` through `validation-AC13-*.webm` + matching traces
- smoke: `artifacts/videos/smoke-*.webm` + matching trace

## Re-collection Command

```bash
BASE_URL=https://lovie-afb-assignment.vercel.app bash scripts/3-run_e2e_evidence.sh .
```

## Reviewer Note

Artifacts are gitignored because they are binary outputs. The final release package bundles them from the local workspace when present.
