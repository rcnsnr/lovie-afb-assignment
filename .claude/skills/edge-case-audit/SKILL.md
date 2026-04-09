---
name: edge-case-audit
description: Audit the current feature for lifecycle, authorization, expiration, and failure-mode gaps before or during implementation.
---

# Purpose

Use this skill before implementation expands, and whenever lifecycle, authorization, payment simulation, or expiration behavior changes.

## Audit Focus

Audit for:

1. invalid status transitions
2. missing terminal-state behavior
3. duplicate-submit risks
4. inconsistent sender/recipient views
5. expired-request behavior gaps
6. authorization bypass paths
7. unsafe assumptions around mock auth
8. missing validation for amount/contact inputs
9. failure states not represented in UI or API behavior
10. edge cases that will break E2E reliability

## Output Contract

Return:

## Critical Risks

- ...

## Important Gaps

- ...

## Corrections

- exact rule or behavior to add or change
- where it should live: spec, plan, code, test, or docs

## Regression Watchlist

- cases that need explicit E2E or integration coverage

## Rules

- focus on correctness, not style
- assume reviewers will inspect lifecycle and auth closely
- prefer explicit rules over inferred behavior
