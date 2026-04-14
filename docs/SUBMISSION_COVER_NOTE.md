# Submission Cover Note

## What was built

A small P2P payment request feature end-to-end: a logged-in user can
request money from another user by email or phone, see both sides of the
ledger on paired dashboards with status filters, live search, and an
inline contact summary card that appears when search narrows to a single
counterparty. Requests follow a server-enforced lifecycle (PENDING →
PAID / DECLINED / CANCELLED / EXPIRED), expire after 7 days, and the pay
flow includes a short deliberate 2–3s simulation with spinner and
success confirmation. The app is a Next.js 14 App Router modular monolith
on Vercel with a Supabase Postgres backend and iron-session cookies.

## Live demo

- URL: <https://lovie-afb-assignment.vercel.app>
- Credentials: `alice@example.com` / `demo1234`,
  `bob@example.com` / `demo1234`, `carol@example.com` / `demo1234`

## Where to find evidence

- `artifacts/videos/` — 34 Playwright `.webm` videos, one per test case,
  covering AC1–AC32 (plus the AC29 sub-variants and the AC5 server-side
  check). Collected against production on 2026-04-14.
- `artifacts/traces/` — 34 matching `.zip` traces, openable at
  <https://trace.playwright.dev> for step-by-step replay.
- `docs/EVIDENCE_INDEX.md` — test → artifact name mapping.
- `docs/VIDEO_EVIDENCE_GUIDE.md` — packaging notes and reviewer
  orientation.
- `RELEASE_NOTES.md` — v1.0 / v1.1 scope, architectural notes.
- `docs/EXECUTION_LOG.md` — dated execution trail (Phase 1 through
  Phase 18 of the build).
- `docs/AI_PROCESS.md` — phase-by-phase account of where AI did the work,
  where human judgment was applied, and patterns worth reusing.

## Hardest part of the assignment

Not the core lifecycle or the money-as-integer-minor-units discipline —
those were straightforward once clarified. The hardest part was a
**hydration-timing race that only appeared in AC30** (contact summary
card must remain visible when the user flips status filters).

The symptom was: local E2E would pass 6/7 contact-summary-card tests,
then fail AC30 because clicking a status pill left the URL unchanged.
The filter pill was a client-component button whose `onClick` called
`router.push`, and the client state it needed came from
`useSearchParams()` inside a `<Suspense>` boundary. In dev mode this
combination returned stale or null params at the precise moment the
click handler ran, so `router.push` either fired with the wrong URL or
was a no-op, and the card vanished.

The fix — diagnosed through a short hypothesis ladder (Suspense
rendering → stale `useSearchParams` → Playwright `fill()` vs React
`onChange` → hydration window) — was architectural: **convert FilterBar
to a server component rendering `<Link>` elements whose `href` is
computed on the server from `currentSearch` + target status**. Server
Links work with or without JavaScript, before or after hydration, and
have no dependency on a client hook. SearchInput got the same
prop-based treatment (`initialSearch`, `currentStatus` passed from the
server render instead of reading `useSearchParams()` on the client).

The tempting shortcut was to bump test timeouts or retry the click.
That would have papered over a latent race that would surface again
elsewhere. The architectural fix cost ~30 minutes more and closed the
issue properly; full details are in `docs/AI_PROCESS.md` Phase 18.

## How AI tools helped (and where they hindered)

**Helped, concretely:**

- **Spec-Kit workflow discipline.** The `/speckit-specify` →
  `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` sequence kept
  scope and assumptions explicit before any implementation. Every task
  carried its own validation method. When scope extended to AC26–AC32
  mid-build, re-running `/speckit-clarify` + `/speckit-checklist`
  surfaced the single/multi/zero/empty match matrix before I wrote a
  single line of detection logic.
- **Model-and-effort lane separation.** Planning and debugging on
  Opus 4.6 high-effort; implementation slices and doc cleanup on
  Sonnet 4.6 medium. This prevented burning Opus tokens on routine
  `.map` refactors and kept the heavy model available for the AC30
  diagnosis where it mattered.
- **MCP integration for Vercel.** Having the Vercel MCP server meant
  listing deployments, generating protected-Preview bypass URLs, and
  tailing build logs happened inside the agent loop, with no tab
  switching. This collapsed the Preview-testing iteration loop from
  minutes to seconds and was the reason I could validate the AC30 fix
  against Preview (13/13 in 76s) before promoting to `main`.
- **Automatic evidence collection.** `scripts/3-run_e2e_evidence.sh`
  runs the full suite with trace retention and writes per-test `.webm`
  and `.zip` files to `artifacts/` — one command, 34 reviewable artifacts.

**Hindered, honestly:**

- **Dev-mode flakiness masquerading as real bugs.** Early AC30 failures
  were indistinguishable from dev-server slowness and hydration timing
  artifacts. I spent extra time chasing the wrong hypothesis (test
  selectors, `fill()` vs `pressSequentially`) before the right model
  emerged. Lesson recorded: **prefer Vercel Preview for E2E validation
  whenever the question is "is this a real code bug?"** — Preview uses
  the production build, no on-demand compile, ~3× faster and closer to
  real browser behavior.
- **Assistant verbosity on documentation lanes.** Lower-effort Sonnet
  occasionally over-explained routine changes in doc commits; I trimmed
  several commit messages by hand. Not a blocker, just a recurring edit.
- **Vercel SSO + `context.clearCookies()` interaction.** Running full
  E2E against a protected Preview wipes the bypass cookie on every
  multi-user test. The agent correctly diagnosed this as an
  infrastructure artifact (not a regression) only after seeing the
  pattern in failures, and the final validation run had to be against
  the public production URL (no SSO) for 34/34 clean.

The overall signal: AI is strongest when it is bounded by Spec-Kit
artifacts and validated by automated E2E rather than trusted by
inspection. The bounds protect against plausible-looking code that
doesn't match the spec; the E2E protects against plausible-looking
behavior that doesn't match the product.
