---
name: git-flow-guard
description: Enforces reviewer-friendly git history, commit cadence, and PR discipline for the fintech feature repository.
---

# Git Flow Guard

Use this skill whenever the current phase is changing, before making a commit, before opening or updating a PR, and before final submission.

## Objective

Keep repository history understandable to reviewers.
Make the thinking trail visible.
Avoid hiding work behind large squashed commits or chaotic commit noise.

## Required Repository Model

Assume this working model unless explicitly overridden:

- `main` contains only the lightweight bootstrap baseline and stable merges.
- `feat/<feature-name>` contains all feature-specific work.
- Draft PR is opened early and updated through the build.

## Mandatory Checks

Before approving the next git action, verify:

1. **Phase alignment**
   - current work matches the next expected phase
   - no unrelated scope is mixed into the pending changes

2. **Commit shape**
   - commit is not too large
   - commit message is phase-aware and descriptive
   - no `fix`, `update`, `final`, `tmp`, `wip` style low-signal message is used unless explicitly temporary and not pushed for review

3. **Artifact visibility**
   - spec changes are committed separately from implementation when possible
   - docs/evidence changes are visible
   - reviewer can see when assumptions, lifecycle decisions, and testing were introduced

4. **PR readability**
   - branch name is meaningful
   - PR summary reflects the current state truthfully
   - reviewer notes explain that a lightweight reusable execution harness was used, but product-specific decisions were created in this repository

5. **History hygiene**
   - do not squash away major thinking milestones
   - do not hide all work in one giant commit
   - small cleanup squashes are allowed only when they do not erase important phase boundaries

## Preferred Commit Cadence

Prefer separate commits for:

- bootstrap baseline
- constitution
- specification
- clarification
- implementation plan
- tasks breakdown
- E2E scaffolding
- each meaningful vertical slice
- docs/evidence
- final readiness

## Commit Message Pattern

Use conventional, phase-aware commit titles.
Examples:

- `chore(bootstrap): initialize spec-kit + claude execution harness`
- `docs(constitution): define project principles and delivery constraints`
- `spec(feature): add p2p payment request specification`
- `spec(clarify): resolve lifecycle, authz, and expiration ambiguities`
- `plan(tech): add implementation plan and architecture decisions`
- `plan(tasks): generate executable task breakdown`
- `feat(requests): implement request creation flow and persistence`
- `test(e2e): add playwright evidence coverage`
- `docs(evidence): add AI process and submission artifacts`

## PR Policy

A draft PR should exist before the repository becomes heavily code-centric.
It should contain:

- summary
- scope
- non-goals
- assumptions
- evidence plan
- reviewer note about the lightweight local harness

## Output Format

## Recommended Next Git Action

## Why

## Suggested Commit or PR Text

## Risks If Skipped
