# Prompt — Finish Remaining Assignment Gaps

Use this in another AI coding environment when you want to finish the last product gaps without re-planning the whole project.

```text
you are working in a nearly complete home-assignment repo for a p2p payment request app. do not redesign the architecture. keep the existing stack and patterns unless a change is strictly required.

repo goals:
- preserve the current next.js + prisma + supabase + iron-session + playwright setup
- keep docs and evidence reviewer-friendly
- avoid unrelated refactors
- validate each small slice before moving on

remaining product gaps to fix:
1. add dashboard filter by status for outgoing and incoming requests
2. add dashboard search by sender/recipient
3. support phone as an alternative recipient contact input path in the create flow and validation rules
4. add a real 2 to 3 second payment processing simulation and a clear success confirmation state after pay

constraints:
- keep money stored as integer minor units
- keep server-side authorization and expiration enforcement unchanged
- preserve current dto and effective-status patterns unless there is a clear bug
- keep the ui simple and assignment-friendly
- update spec/docs/readme/e2e whenever behavior changes

required workflow:
- inspect current spec, plan, tasks, and implementation before editing
- work in thin slices
- after each slice run:
  1. bash scripts/0-auto_fix_and_validate.sh .
  2. npm run lint && npm run typecheck && npx prisma validate && npx prisma generate && npm run build
- when a phase is done, update reviewer-facing docs and summarize exactly what changed

deliverables for this task:
- code changes
- updated e2e tests for the new filter/search/phone/simulation behavior
- updated spec/docs/readme
- short final summary listing what was fixed and any remaining tradeoffs
```
