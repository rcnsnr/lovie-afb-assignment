---
name: spec-review
description: Review the current feature spec and clarification outputs for ambiguity, missing rules, weak acceptance criteria, and reviewer-facing clarity gaps.
---

# Purpose

Use this skill after specification and clarification to improve artifact quality before planning and implementation.

## Review Focus

Check the current spec and clarifications for:

1. ambiguous or conflicting behavior
2. missing acceptance criteria
3. missing lifecycle or status rules
4. missing authorization expectations
5. missing validation and error states
6. unclear non-goals
7. weak reviewer-facing clarity
8. assumptions that should be explicit instead of implicit

## Output Contract

Return:

## Findings

- [Critical] ...
- [Important] ...
- [Minor] ...

## Required Fixes

- exact section to update
- exact issue to resolve
- why it matters

## Safe-to-Proceed Verdict

- YES or NO
- short justification

## Rules

- be strict
- do not rewrite the entire spec unless necessary
- prefer targeted fixes
- do not add implementation stack detail unless it is needed for correctness
