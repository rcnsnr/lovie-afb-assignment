# Assumptions

Use this file to record bounded assumptions that affect scope, behavior, or review interpretation.

## Current Assumptions

- Single currency demo unless explicitly changed
- Email + password auth with bcrypt (cost 10); seeded users share `demo1234`; no registration UI
- Seeded users for stable demos and E2E: Alice (<alice@example.com>), Bob (<bob@example.com>),
  Carol (<carol@example.com>) — all share demo password `demo1234`; bcrypt cost factor 10
- Simulated payment rails
- No partial payments
- No request editing after creation
- No notifications beyond visible UI state
- No background jobs unless truly necessary

## Changes to Assumptions

- Date: 2026-04-12
- Change: "Deterministic mock email auth" replaced with bcrypt email+password auth
- Reason: Spec clarification (Q2) resolved to email+password with seeded credentials; a
  real password column and bcrypt compare were simpler and more realistic than a magic-link mock
- Impact: Login requires both email AND password; auth is real, not bypassed; session via iron-session cookie
