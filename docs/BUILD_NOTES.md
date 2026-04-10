# Build Notes

Use this file as a compact log of meaningful execution decisions.

## Important Manual Decisions

- Date: 2026-04-10
- Decision: Scaffolded Next.js manually instead of using `create-next-app`
- Reason: `create-next-app@14` rejects non-empty directories; the repo root already
  contained planning artifacts. Manual scaffold gives identical output with precise
  control over file contents.
- Impact: None — all generated files match `create-next-app` defaults exactly.
  `next@14.2.35`, `react@18`, `typescript@5`, `tailwindcss@3`, `eslint@8`.

## Patches Applied Because AI Output Was Weak

- Date: 2026-04-10
- Problem: `next.config.ts` is not supported in Next.js 14 (TypeScript config is a
  Next.js 15 feature). Dev server threw on startup.
- Correction: Renamed to `next.config.js` with JSDoc type annotation.
- Why it mattered: Dev server would not start without this fix.

- Date: 2026-04-10
- Problem: `prisma init` fails on Node 24 with `(0 , CSe.isError) is not a function`
  (bundled CLI incompatibility). Isolated to the `init` subcommand only.
- Correction: Wrote `prisma/schema.prisma` manually. `prisma generate`, `migrate`, and
  `db seed` all work correctly — only `prisma init` is affected.
- Why it mattered: Build pipeline (`prisma generate && prisma migrate deploy`) is
  unaffected; this is a developer ergonomics issue only.

## Spec / Implementation Drift Notes

None yet.

## Workflow Enhancements

- Date: 2026-04-10
- Decision: Added `scripts/phase_closeout.sh` and the `/phase-closeout` skill.
- Reason: Phase-end validation and reviewer-facing log sync were being done manually and
  were easy to forget. The new workflow standardizes closeout into one repeatable path.
- Impact: Phase boundaries now have a default validation + logging flow before commit/push.
