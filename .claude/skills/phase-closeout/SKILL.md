---
name: phase-closeout
description: Run the standard phase-end validation flow, then sync execution and AI process logs before commit or push.
---

# Phase Closeout

## Purpose

Use this skill at the end of an implementation phase.

It is the standard closeout flow for:

- phase-end validation
- reviewer-facing log sync
- AI process sync
- ready-to-commit confirmation

---

## When To Use

Use after:

- a completed implementation phase
- a grouped milestone worth committing
- a phase-end bug-fix batch

Do not use for:

- every tiny edit
- pre-spec or pre-plan work
- exploratory debugging before a stable fix exists

---

## Phase Closeout Order

1. Run `bash scripts/phase_closeout.sh`
2. Update `docs/EXECUTION_LOG.md`
3. Update `docs/AI_PROCESS.md`
4. Return a concise closeout receipt with any explicit omissions

---

## Operating Rules

1. Do not claim the phase is closed if validation failed.
2. Keep the log factual and phase-scoped.
3. Record commit/push state only if it changed.
4. Explicitly note skipped checks.
5. If Prisma checks are skipped because Prisma is not in play yet, say so.

---

## Output Contract

Return:

### Phase closeout receipt

- Validation:
- Execution log:
- AI process log:
- Commit/push state:
- Explicit omissions:

### Recommended next step

- Next action:
- Suggested model:
- Suggested effort:
- Why:
