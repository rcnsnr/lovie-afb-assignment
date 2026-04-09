---
name: execution-log-sync
description: Update docs/EXECUTION_LOG.md after each meaningful phase, decision, validation milestone, or implementation slice so the reviewer-facing execution trail stays current.
---

# Execution Log Sync

## Purpose

Use this skill to keep `docs/EXECUTION_LOG.md` current.

This skill should be used after:

- a completed Spec-Kit phase
- a meaningful architecture or stack decision
- a meaningful implementation slice
- a bug fix that changes behavior
- a major validation milestone
- a deployment or evidence milestone

---

## Operating Rules

1. Update the existing log instead of replacing it.
2. Keep entries concise and factual.
3. Record what changed, why it changed, and how it was validated.
4. Mention artifacts, not chat history.
5. If AI output was corrected by human judgment, note that clearly.
6. Do not invent work that did not happen.

---

## Required Entry Shape

Append a new entry using this structure:

### YYYY-MM-DD HH:MM — Phase or milestone

#### What was done

- ...

#### Why it was done

- ...

#### Artifacts changed

- ...

#### Validation

- ...

#### Notes

- ...

---

## Output Contract

Return:

### Execution log update

- Added entry: yes or no
- Section updated:
- Summary of entry:
- Follow-up log need:

### Recommended next step

- Next action:
- Suggested model:
- Suggested effort:
- Why:
