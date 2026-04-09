---
name: implementation-guard
description: Guard meaningful implementation slices so they stay aligned with the spec, lifecycle rules, validation discipline, and reviewer-facing documentation obligations.
---

# Implementation Guard

## Purpose

Use this skill during implementation after the relevant Spec-Kit planning artifacts already exist.

This skill is not a planner.
This skill is not a replacement for Spec-Kit.
This skill is the lightweight implementation discipline layer for this repository.

---

## Use When

Use this skill when:

- implementing a meaningful task slice
- modifying request lifecycle behavior
- changing authorization-sensitive actions
- touching payment simulation logic
- changing expiration behavior
- fixing a bug that affects user-visible behavior
- updating code in a way that requires evidence or docs sync

Do not use this skill for:

- vague ideation before specification
- architecture exploration before planning
- cosmetic wording-only documentation edits

---

## Required Inputs

Before using this skill, confirm the relevant artifacts exist:

- current Spec-Kit spec
- current clarification decisions if any
- current plan
- current task slice
- current lifecycle and validation standards

If these are missing, stop and return the work to the planning or spec phase.

---

## Operating Rules

1. Implement only the current slice.
2. Do not mix unrelated refactors into the same change.
3. Do not patch symptoms before identifying root cause.
4. Keep authorization, money, and lifecycle logic explicit.
5. Prefer the simplest change that preserves reviewer readability.
6. If implementation forces a material behavior change, update the relevant spec and doc artifacts before continuing.

---

## Required Checks Before Editing

Check the current slice for:

- affected user flow
- affected lifecycle state or transition
- affected authorization rule
- affected validation rule
- expected docs updates
- expected E2E impact

Return this in a compact pre-edit note:

### Implementation slice

- Objective:
- Files expected to change:
- Impact surface:
- Expected validation:
- Docs to update:

---

## Execution Discipline

### Phase 1 — Understand

- restate the exact behavior being changed
- identify the source-of-truth artifact for that behavior
- identify the smallest implementation slice that can be validated safely

### Phase 2 — Implement

- make the smallest coherent code change
- preserve naming and structure clarity
- keep server-side rules near the mutation path

### Phase 3 — Validate

- run the repo auto-fix flow first when applicable
- run the most relevant checks for the slice
- prefer targeted tests and realistic E2E where applicable
- if validation is skipped, say so explicitly and explain why

### Phase 4 — Sync Docs and Evidence

- update assumptions if assumptions changed
- update build notes if tradeoffs or manual interventions matter
- update AI process notes if workflow behavior changed
- note whether E2E or trace evidence must be refreshed

---

## Root-Cause Rule

If the task is a bug fix:

- reproduce the issue first
- identify the root cause before proposing a fix
- compare the failing path versus the working path
- do not ship a blind patch

---

## Output Contract

Return:

### Pre-edit assessment

- Objective:
- Scope boundary:
- Impact surface:
- Validation plan:
- Docs impact:

### Implementation notes

- What changed:
- Why it changed:
- Any tradeoff taken:

### Validation receipt

- Checks run:
- Evidence produced:
- Explicit omissions:

### Docs sync

- Updated:
- Still needed:

### Recommended next step

- Next action:
- Suggested model:
- Suggested effort:
- Why:

---

## Guardrails

- Do not invent a new planning system.
- Do not hide uncertainty.
- Do not leave lifecycle or authorization assumptions implicit.
- Do not claim completion without a validation receipt.
- Do not let documentation drift behind behavioral changes.
