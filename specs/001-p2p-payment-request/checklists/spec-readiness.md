# Spec Readiness Checklist: P2P Payment Request

**Purpose**: Validate requirement quality, completeness, and E2E readiness before technical
planning. Serves as a pre-planning gate (author) and submission-time reviewer reference.
**Created**: 2026-04-09
**Feature**: [spec.md](../spec.md)
**Focus**: Comprehensive requirement quality + elevated E2E evidence coverage

---

## Requirement Completeness

- [ ] CHK001 — Are loading/in-progress UI states defined for the create-request form
      submission (while the request is being created)? [Completeness, Gap]
- [ ] CHK002 — Are loading states defined for the outgoing and incoming dashboard list
      views (while data is being fetched)? [Completeness, Gap]
- [ ] CHK003 — Are empty-state requirements defined for dashboards when the user has
      no requests yet? [Completeness, Gap, Spec §Screens/Views]
- [ ] CHK004 — Are post-action confirmation states defined for pay, decline, and cancel
      (what does the user see immediately after a successful action)? [Completeness,
      Spec §F4, §F5, §F6]
- [ ] CHK005 — Are requirements defined for where and how the shareable link is
      presented to the requester after creation? [Completeness, Spec §F1]
- [ ] CHK006 — Are login/logout requirements defined for the mock auth flow (what
      screens exist, what data is needed to log in)? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK007 — Is the accepted dollar-value input format precisely defined (e.g. is
      "15", "15.0", and "15.00" all accepted, or only "15.00")? [Clarity,
      Spec §Validation Rules, §Clarifications]
- [ ] CHK008 — Is "unique, unguessable identifier" for shareable links specified with
      enough precision to make implementation deterministic (e.g. UUID v4)? [Clarity,
      Spec §Domain Rules]
- [ ] CHK009 — Is the 7-day expiry window start point specified in a timezone-safe way
      (e.g. UTC timestamp)? [Clarity, Spec §Expiration Semantics]
- [ ] CHK010 — Is "confirms the action" (pay, decline, cancel) defined clearly enough
      to distinguish a single click from a two-step confirmation interaction? [Clarity,
      Spec §F4, §F5, §F6]
- [ ] CHK011 — Is "consistent display formatting" for money amounts quantified (e.g.
      always "$X.XX" with exactly two decimal places and a USD prefix)? [Clarity,
      Spec §Money Handling Rules]
- [ ] CHK012 — Is "inline error" defined to specify where validation errors appear
      relative to the triggering field? [Clarity, Spec §Error States]
- [ ] CHK013 — Is the behavior for amounts with more than two decimal places defined
      (e.g. "15.999" — rejected or rounded)? [Clarity, Edge Case, Spec §Validation Rules]

## Requirement Consistency

- [ ] CHK014 — Are the amount validation rules in §Validation Rules and §Domain Rules
      consistent with each other (both say positive, non-zero)? [Consistency,
      Spec §Validation Rules, §Domain Rules]
- [ ] CHK015 — Do the authorization actor rules in §Authorization Rules align exactly
      with the action preconditions stated in §Validation Rules? [Consistency,
      Spec §Authorization Rules, §Validation Rules]
- [ ] CHK016 — Are the terminal states listed in §Request Lifecycle consistent with
      the set of states referenced in §Error States and §Edge Cases? [Consistency,
      Spec §Request Lifecycle, §Error States]
- [ ] CHK017 — Is the Observer role consistently defined across §Actors, §Authorization
      Rules, and §F8 with no conflicting rules? [Consistency,
      Spec §Actors, §Authorization Rules, §F8]
- [ ] CHK018 — Is the shareable link access behavior in §F8 consistent with the
      authorization rules stated in §Authorization Rules (same actor/state checks)? [Consistency,
      Spec §F8, §Authorization Rules]

## Acceptance Criteria Quality

- [ ] CHK019 — Does AC5 specify the mechanism by which expiration is tested in E2E
      (e.g. time-travel fixture or seeded expired request) rather than waiting 7 days?
      [Measurability, Spec §AC5]
- [ ] CHK020 — Are AC8 and AC9 (dashboard visibility) specific enough to validate
      reverse-chronological ordering, not just presence? [Clarity, Spec §AC8, §AC9]
- [ ] CHK021 — Does AC7 (authorization error) define what the user-visible error
      response looks like, not just that an error occurs? [Clarity, Spec §AC7]
- [ ] CHK022 — Does AC10 (amount validation) cover dollar-value input format errors
      (e.g. alphabetic input, more than 2 decimal places) or only zero/negative? [Completeness,
      Spec §AC10]
- [ ] CHK023 — Is there an AC covering the correctness of dollar-to-cents conversion
      (e.g. $15.00 stored as 1500, not 15)? [Gap — no AC directly validates conversion
      accuracy]
- [ ] CHK024 — Are all 13 ACs traceable to at least one primary flow (F1–F8)?
      [Traceability, Gap]

## Lifecycle and State Requirements

- [ ] CHK025 — Is behavior defined for the exact boundary moment when
      `current_time == expiresAt` (is the request PENDING or EXPIRED at that instant)?
      [Clarity, Edge Case, Spec §Expiration Semantics]
- [ ] CHK026 — Are all five states defined from both the requester's and the
      recipient's perspective in the dashboard and detail views? [Completeness,
      Spec §Request Lifecycle]
- [ ] CHK027 — Is it specified whether EXPIRED requests appear in dashboards alongside
      other terminal-state requests or are filtered/hidden? [Completeness, Gap,
      Spec §Request Lifecycle]
- [ ] CHK028 — Are the timestamp fields (paidAt, declinedAt, cancelledAt) specified
      as user-visible data or as implementation-only storage fields? [Clarity,
      Spec §Request Lifecycle, §Screens/Views]

## Authorization Requirements

- [ ] CHK029 — Is it specified what happens when an unauthenticated user calls a
      state-changing endpoint directly (bypassing the UI)? [Completeness, Gap,
      Spec §Authorization Rules]
- [ ] CHK030 — Are requirements defined for what an Observer sees after a request
      transitions to a terminal state via a shareable link they previously bookmarked?
      [Coverage, Spec §F8, §Edge Cases]
- [ ] CHK031 — Is the mock auth credential exposure policy documented (where demo
      credentials are shown to reviewers and E2E setups)? [Completeness,
      Spec §Reviewer Notes §Assumptions]
- [ ] CHK032 — Is there a requirement specifying behavior when the viewer of a
      shareable link is logged in as a different user than the intended recipient?
      [Coverage, Spec §F8, §Authorization Rules]

## Money Handling Requirements

- [ ] CHK033 — Is the display format for amounts on the dashboard list view specified
      (full "$X.XX" or abbreviated for large values)? [Completeness, Gap,
      Spec §Money Handling Rules]
- [ ] CHK034 — Are requirements defined for how the currency symbol is consistently
      displayed across all views (always "$" prefix, no suffix)? [Completeness, Gap]
- [ ] CHK035 — Is the effective upper bound for dollar input defined at the form
      level (what happens when the user enters an extremely large number)? [Edge Case,
      Spec §Validation Rules]

## Error and Edge Case Coverage

- [ ] CHK036 — Are requirements defined for network or server failure during a
      state-changing action (pay, decline, cancel) — does the UI retry, show an error, or
      revert? [Coverage, Gap]
- [ ] CHK037 — Is the behavior specified when the shareable link target request ID
      exists but belongs to a completely different user's request (not the viewer's)?
      [Coverage, Spec §F8, §Authorization Rules]
- [ ] CHK038 — Are email matching rules defined with respect to case sensitivity
      (is "<user@example.com>" the same as "<USER@example.com>" for recipient lookup and
      self-request detection)? [Edge Case, Gap]

## E2E Evidence Requirements

- [ ] CHK039 — Are the seeded demo user credentials and fixture data documented or
      referenced so reviewers can reproduce the demo independently? [Completeness,
      Spec §Reviewer Notes, Gap]
- [ ] CHK040 — Are the E2E test scenarios explicitly mapped to ACs (AC1–AC13) so a
      reviewer can trace each test to a named requirement? [Traceability, Gap]
- [ ] CHK041 — Is the expiration test strategy defined — specifically how E2E tests
      simulate a past-expiry request without waiting 7 days (e.g. seeded fixture, time
      override, test-only backdating)? [Completeness, Gap, Spec §AC5]
- [ ] CHK042 — Are requirements defined for what the E2E video evidence must
      demonstrate (which user flows, which actor switches, which terminal states)? [Completeness,
      Gap, Spec §Goals]
- [ ] CHK043 — Are demo deployment environment requirements defined (demo URL,
      initial seed state, how to reset data between demo sessions)? [Completeness, Gap,
      Spec §Goals]
- [ ] CHK044 — Is the E2E test isolation strategy specified (does each test start
      from a clean seeded state or can tests share request data)? [Completeness, Gap]
- [ ] CHK045 — Are authorization-negative E2E tests required (wrong actor attempting
      pay, expired request action attempt, Observer attempting action)? [Coverage,
      Spec §AC5, §AC7, Gap]
- [ ] CHK046 — Is the shareable link E2E path specified — which actor generates the
      link, which actor uses it, and how the link is captured in the test context?
      [Completeness, Spec §F8, §F1, Gap]
- [ ] CHK047 — Is there a requirement for Playwright trace artifact collection so
      failures can be reviewed without re-running the full suite? [Completeness, Gap]
- [ ] CHK048 — Are the E2E test user credentials required to be different from each
      other (requester ≠ recipient) and documented so test roles are unambiguous? [Completeness,
      Spec §Reviewer Notes §Assumptions, Gap]

## Dependencies and Assumptions

- [ ] CHK049 — Is the assumption that recipients must already be registered users
      explicitly documented as an in-scope constraint (not a future extension)? [Assumption,
      Spec §Reviewer Notes]
- [ ] CHK050 — Is the implicit expiration approach (evaluated on read, no background
      job) documented with its known limitation (stale dashboard counts between reads)?
      [Assumption, Spec §Expiration Semantics, §Reviewer Notes]
- [ ] CHK051 — Are the demo database seeding requirements specified (minimum user
      count, initial request states, amount values needed for demo flows)? [Completeness, Gap]
- [ ] CHK052 — Is the "no pagination" simplification documented with an explicit
      assumption about maximum data volume (e.g. demo never exceeds N requests per user)?
      [Assumption, Spec §Reviewer Notes §Intentional Simplifications]

## Notes

- Items marked `[Gap]` indicate areas where the spec does not currently define the
  requirement. These may be intentional simplifications or genuine gaps requiring
  attention before planning.
- Items marked `[Assumption]` validate that existing assumptions are sufficiently
  explicit for a reviewer unfamiliar with the project context.
- E2E items (CHK039–CHK048) are weighted higher for this submission because
  reproducible evidence is a primary delivery goal.
- Check items off as completed: `[x]`
- Add inline notes for any items that require spec updates before proceeding.
