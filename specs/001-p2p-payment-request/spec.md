# Feature Specification

## Summary

A consumer-facing web feature that lets one user request money from another user.
The requester creates a payment request by specifying a recipient (by email or phone), an
amount, and an optional note. The recipient receives the request and can pay, decline, or
let it expire. The requester can cancel their own pending requests. All requests have a
7-day expiration window enforced by the system. Both dashboards support filtering by
status and searching by counterparty. When paying a request, the system simulates payment
processing with a brief delay before confirming success.

## Clarifications

### Session 2026-04-09

- Q: How does the user enter the amount — dollar value or minor units (cents)? → A: Dollar
  value (e.g. "15.00"); the system converts to integer minor units (cents) on submission.
- Q: What is the mock auth mechanism — dropdown, email-only, or email + password? → A:
  Email + fixed demo password. Login form accepts a seeded email and a shared demo
  password; no real hashing or OAuth required.

### Session 2026-04-13

- Gap: Dashboard lists have no filtering or search capability. → Decision: Add a status
  filter (ALL/PENDING/PAID/DECLINED/CANCELLED/EXPIRED) and a free-text counterparty
  search to both incoming and outgoing dashboards. Filter and search state live in URL
  search params; no full page reload required.
- Gap: Recipient can only be identified by email. → Decision: Add phone number as an
  alternative identification method on the create form. A toggle selects Email or Phone;
  only the selected input is active. Phone resolves to a registered user the same way
  email does.
- Gap: The pay action gives no processing feedback. → Decision: The pay action introduces
  a 2-3 second server-side artificial delay to simulate payment rail latency. During this
  time the Pay button is disabled and a spinner is shown. On success, a distinct
  confirmation message is displayed before or alongside the PAID status badge.
- Gap: No explicit success confirmation after paying. → Covered by the pay simulation
  decision above; a success message is required, not just a status badge change.
- Q: What UI control type should the status filter use? → A: Horizontal row of pill/tab
  buttons with all 6 options visible; one-click selection, no dropdown required.
- Q: When does the search filter trigger — every keystroke, debounced, or on submit? → A:
  Debounced on keystroke; filters 300ms after the last keypress with no explicit submit.
- Q: How does the success confirmation banner dismiss? → A: Auto-dismisses after 5 seconds;
  user can also dismiss it manually via an X button.
- Q: What UX should the phone input field use — masking, country picker, or plain text? →
  A: Plain text input with a placeholder hint (e.g. "+15551234567"); no masking or
  country-code picker.
- Q: Does counterparty search match phone numbers in addition to name and email? → A: Yes;
  search matches counterparty name, email, and phone number.

### Session 2026-04-14

- Gap: Search filters the list but gives no at-a-glance view of who the matched contact
  is and how much history the current user has with them. → Decision: When the search
  input produces exactly one matched counterparty, render an inline contact summary card
  directly below the search input. The card shows that contact's identity (name, email,
  phone if available) and relationship-level metrics scoped to the current signed-in
  user only (not global system data).
- Gap: Dashboard controls area (filters, search, list header) feels flat and reduces
  scan-ability on mobile. → Decision: Apply a small, targeted UI polish to the controls
  area only — spacing, grouping of filter pills and search, surface containers, empty
  states, and the new contact summary card. No redesign of the full dashboard, no new
  design system, no theming framework.
- Gap: Color direction for the new surfaces is unspecified. → Decision: Soft, brand-adjacent
  palette — light slate / misty blue surfaces, deep navy text, gentle blue-to-cyan accents
  for primary emphasis. No full brand recreation; no logo or exact visual matching.
- Q: How should the card behave when the search term partially matches multiple contacts
  (e.g. typing "bo" and both "bob@…" and "boris@…" exist)? → A: Do not render the card
  when more than one distinct counterparty matches; keep list filtering active only.
  The card is only shown on exact single-contact match.
- Q: What metrics does the card show? → A: Total outgoing requests with this contact,
  total incoming requests with this contact, and three aggregated dollar totals scoped
  to the current user ↔ contact relationship: pending amount, paid amount, declined
  amount. Cancelled and expired requests are excluded from the dollar totals.
- Q: Does the card interact with the active status filter? → A: The card's identity
  and metrics stay stable regardless of the status pill. The card is driven by the
  search query alone; metrics always reflect the full relationship, not the filtered
  view. The request list below the search continues to reflect both search and status.
- Q: What is the card's interaction model? → A: Inline, always expanded when shown.
  No modal, no drawer, no "expand" state. Dismisses automatically when the user clears
  the search or the search no longer matches exactly one contact.

## Goals

- Allow a user to create a payment request directed at another user by email address.
- Allow the recipient to pay or decline an incoming request.
- Allow the requester to cancel their own pending request.
- Enforce a 7-day expiration on all outstanding requests.
- Provide both requester and recipient with clear, up-to-date request status visibility.
- Make the feature usable on desktop and mobile browsers.
- Produce a publicly accessible demo with reproducible E2E evidence.
- Allow users to filter dashboard lists by effective status and search by counterparty
  name or email.
- Allow a requester to identify a recipient by phone number as an alternative to email.
- Simulate realistic payment processing latency when a recipient pays a request.
- Provide clear, explicit success confirmation after payment completion.
- Surface a lightweight inline contact summary (identity + current-user relationship
  metrics) when the dashboard search narrows to exactly one counterparty.
- Apply a small, targeted UI polish to the dashboard controls area so filtering,
  searching, and the new contact summary read as a coherent, visually grouped cluster.

## Non-Goals

- No real payment processing or actual money movement.
- No partial payments (the full requested amount must be paid or the request is declined).
- No editing a request after it is created.
- No notifications beyond what is visible in the UI (no email, push, or SMS alerts).
- No SMS or phone-based notifications — phone number is used only as an alternative
  recipient identifier, not as a notification or contact channel.
- No multi-currency support (single demo currency only).
- No background job scheduling or queue infrastructure.
- No support for requesting from or paying to anonymous or unauthenticated users.
- No global contact directory, address book, or CRM surface — the contact summary card
  is scoped to counterparties that already appear in the current user's request history
  (or are resolvable via the same matching rules the search already uses).
- No modal, drawer, or full-screen contact view as the default interaction; the card
  is inline only.
- No design system replacement or site-wide theming overhaul. The UI polish is scoped
  to the dashboard controls area and the new summary card.
- No brand logo integration, trademarked assets, or exact visual reproduction of any
  third-party landing page. The color direction is inspiration only.

## Actors

- **Requester** — the authenticated user who creates a payment request.
- **Recipient** — the authenticated user identified by the email address or phone number
  in the request.
- **Observer** — any authenticated user who views a request detail via a shareable link
  but is neither the requester nor the recipient.

## Primary Flows

### F1 — Create a payment request

1. Requester navigates to the create-request screen.
2. Requester selects a recipient identification method (Email or Phone) using a toggle.
   Only the selected input is visible. Requester enters the recipient's email or phone
   number, an amount in dollars (e.g. "15.00"), and an optional note (max 200 characters).
   The system converts the dollar amount to integer minor units (cents) before storing.
3. System validates input and creates the request in PENDING state with a 7-day
   expiry window calculated from creation time.
4. System generates a unique shareable link for the request.
5. Requester is redirected to the outgoing dashboard or request detail screen.

### F2 — View outgoing requests (requester dashboard)

1. Requester navigates to the outgoing requests dashboard.
2. System lists all requests the requester has created, with status and time remaining
   for PENDING requests.
3. Requester can open any request to see full detail.

### F3 — View incoming requests (recipient dashboard)

1. Recipient navigates to the incoming requests dashboard.
2. System lists all requests directed to the recipient's account, with status.
3. Recipient can open any request to take action.

### F4 — Pay a request

1. Recipient opens a PENDING incoming request.
2. Recipient clicks the Pay button.
3. The UI enters a processing state: Pay button is disabled, a spinner is visible, and
   the button text changes to indicate processing (e.g. "Processing payment…"). The
   Decline button is also disabled during processing.
4. Server introduces a 2-3 second artificial delay before committing the transition.
5. System transitions the request to PAID, records `paidAt`.
6. UI exits the processing state and displays a distinct success confirmation (e.g. a
   green success banner reading "Payment successful!") alongside the updated PAID status.
   The banner auto-dismisses after 5 seconds; the user can also dismiss it manually via
   an X button.
7. Both requester and recipient see the updated PAID status.

### F5 — Decline a request

1. Recipient opens a PENDING incoming request.
2. Recipient confirms the decline action.
3. System transitions the request to DECLINED, records `declinedAt`.
4. Both requester and recipient see the updated DECLINED status.

### F6 — Cancel a request

1. Requester opens one of their own PENDING requests.
2. Requester confirms the cancel action.
3. System transitions the request to CANCELLED, records `cancelledAt`.
4. Both requester and recipient see the updated CANCELLED status.

### F7 — Expiration

1. A PENDING request whose `expiresAt` timestamp is in the past is treated as EXPIRED
   by the system when any state-reading operation is performed on it.
2. Expiration is enforced server-side; the UI countdown is display-only.
3. An EXPIRED request cannot be paid, declined, or cancelled.

### F8 — View request via shareable link

1. Any user navigates to the shareable link.
2. If the viewer is the recipient and the request is PENDING, they can pay or decline.
3. If the viewer is the requester and the request is PENDING, they can cancel.
4. If the viewer is neither, the request detail is visible but no actions are available.
5. If the request is in a terminal state, it is visible but no actions are available.

### F9 — Filter dashboard by status

1. User navigates to either the outgoing or incoming dashboard.
2. A horizontal row of pill/tab buttons is visible with options: ALL (default), PENDING,
   PAID, DECLINED, CANCELLED, EXPIRED. All options are visible simultaneously; clicking
   a button selects it.
3. User selects a status value. The dashboard re-renders to show only requests whose
   effective status matches the selected value. Selecting ALL shows all requests.
4. Filter state is reflected in the URL search parameter `?status=`. Navigation between
   filter states uses Next.js soft navigation (no full page reload).
5. Reverse-chronological ordering is preserved within the filtered results.

### F10 — Search dashboard by counterparty

1. User navigates to either the outgoing or incoming dashboard.
2. A search input field is visible above the request list.
3. User types a search term. Filtering triggers on debounced keystroke (300ms after the
   last keypress; no explicit submit required). The list filters to requests whose
   counterparty name, email, or phone number contains the search term as a case-insensitive
   substring. On the outgoing dashboard the counterparty is the recipient; on the incoming
   dashboard it is the requester.
4. Search state is reflected in URL search parameter `?search=`. Navigation uses soft
   routing (no full page reload).
5. Search can be combined with the status filter; both params are active simultaneously.
6. Clearing the search term restores the full list (subject to any active status filter).
7. Reverse-chronological ordering is preserved within the results.

### F11 — Create a payment request via phone number

1. Requester navigates to the create-request screen and selects "Phone" on the
   identification method toggle.
2. The phone input field is shown; the email input is hidden. The phone field is a plain
   text input with a placeholder hint (e.g. "+15551234567"); no masking or country-code
   picker is used.
3. Requester enters the recipient's phone number, amount, and optional note.
4. System validates the phone format and resolves it to a registered user.
5. If the phone resolves to a registered user, the request is created identically to F1
   (PENDING state, 7-day expiry).
6. If no registered user has that phone number, the system returns a "recipient not found"
   error, identical to the email-not-found case.
7. Self-request via phone (resolves to the requester's own account) is rejected with the
   same inline error as the email self-request.

### F12 — Pay with processing simulation (see F4 for the full flow)

This flow is an extension of F4. Error branch:

1. If the server returns an error (e.g. 409 Conflict — the request expired or was acted
   upon during the artificial delay), the UI exits the processing state, shows the error
   message, and re-fetches the current request state to reflect the actual server state
   (e.g. EXPIRED or already PAID).
2. The Decline and Cancel actions are not affected by this simulation and execute
   immediately as in the original F5 and F6 flows.

### F13 — Inline contact summary on dashboard search

1. User is on either the outgoing or incoming dashboard and begins typing in the search
   input (same debounced behavior as F10).
2. The system evaluates the current search term against the set of counterparties
   reachable from the current user's request history on that dashboard (recipients on
   outgoing, requesters on incoming). Matching uses the same case-insensitive substring
   rules on name, email, and phone that F10 uses.
3. If the search term matches **exactly one distinct counterparty**, an inline contact
   summary card is rendered directly below the search input and above the request list.
   The card contains:
   - Identity fields: name, email, and phone (phone shown only when available).
   - Relationship metrics, all scoped to the current signed-in user ↔ this contact:
     - Total outgoing requests count (requests where current user is requester and this
       contact is recipient).
     - Total incoming requests count (requests where current user is recipient and this
       contact is requester).
     - Aggregated pending amount (sum of amounts across all effective-status PENDING
       requests in either direction).
     - Aggregated paid amount (sum of amounts across all PAID requests in either
       direction).
     - Aggregated declined amount (sum of amounts across all DECLINED requests in
       either direction).
   - Cancelled and EXPIRED requests are excluded from the dollar aggregates. Their
     counts are included in the total outgoing/incoming counts if relevant.
4. If the search term matches **multiple distinct counterparties**, no card is shown;
   the list-level filter behavior from F10 applies unchanged.
5. If the search term matches **no counterparty**, no card is shown; the list shows its
   existing "no results" empty state.
6. If the search input is **empty**, no card is shown; the dashboard renders the
   standard list view for the current status filter.
7. The card is independent of the active status filter. Identity and metrics do not
   change when the user toggles a status pill. The request list below continues to
   reflect both the search term and the selected status.
8. The card dismisses automatically when the search no longer resolves to a single
   counterparty or is cleared. There is no manual dismiss control.
9. Layout:
   - Desktop: card sits directly below the search input, full-width within the
     dashboard content container, identity fields on the left, metrics on the right.
   - Mobile: same card, stacked vertically — identity block first, then metrics block
     below. The card never pushes critical controls (status pills, search input)
     off-screen.

## Screens / Views

- **Create request screen** — form with an Email/Phone toggle for recipient identification
  (only the selected input is visible at a time), dollar-value amount (converted to cents
  on submit), and optional note.
- **Outgoing dashboard** — list of requests the authenticated user has created; includes a
  horizontal row of pill/tab buttons for status filtering
  (ALL/PENDING/PAID/DECLINED/CANCELLED/EXPIRED) and a free-text search field that filters
  by recipient name, email, or phone number (debounced, 300ms).
- **Incoming dashboard** — list of requests directed to the authenticated user; includes a
  horizontal row of pill/tab buttons for status filtering and a free-text search field
  that filters by requester name, email, or phone number (debounced, 300ms).
- **Request detail screen** — full details of a single request; includes action buttons
  conditional on viewer role and current request state. The Pay button enters a processing
  state (disabled + spinner) during payment simulation; on success, a green banner is shown
  that auto-dismisses after 5 seconds (or can be dismissed manually via X).
- **Dashboard controls area** (applies to both outgoing and incoming dashboards) — a
  visually grouped cluster containing the status filter pills, the search input, and
  (when present) the inline contact summary card. The area uses a soft, brand-adjacent
  color direction: light slate / misty blue surface backgrounds, deep navy text,
  blue-to-cyan accents for the active pill and primary emphasis. Empty states (no
  requests; no search results) are rendered inside the same visual container so the
  layout does not collapse when the list is empty.
- **Inline contact summary card** — lightweight card rendered inline below the search
  input on both dashboards when the search resolves to exactly one counterparty.
  Contains the contact's identity (name, email, phone when available) on the left and
  relationship metrics (outgoing count, incoming count, pending/paid/declined totals)
  on the right on desktop. On mobile the blocks stack vertically. The card uses the
  same soft surface treatment as the controls area and visually reads as a peer of the
  search input, not as a modal or floating overlay.

## Domain Rules

- A payment request belongs to exactly one requester and one recipient.
- The same email address (requester and recipient) cannot appear on both sides of the
  same request; a user cannot request money from themselves.
- Request amount must be a positive integer (minor units, e.g. cents). Zero and negative
  values are rejected.
- The optional note is limited to 200 characters. Empty string is treated as no note.
- Each request gets a unique, unguessable identifier that is used as the shareable link.
- Requests on both dashboards are displayed in reverse-chronological order (most recent
  first).
- A recipient may be identified by email or phone number; both resolve to the same User
  entity. The `recipientId` is stored regardless of the identification method used at
  creation time.
- Phone numbers are unique per user (like email) and optional (nullable). A user without
  a phone number cannot be found via phone lookup.
- EXPIRED status filtering must apply after `getEffectiveStatus()` computation — a
  database-level `WHERE status = 'EXPIRED'` would miss PENDING requests past `expiresAt`.

## Money Handling Rules

- Values are stored as integer minor units (e.g. 150 = $1.50).
- No floating-point money is persisted anywhere.
- The amount must be greater than zero.
- Display formatting must be consistent across create, detail, and dashboard views.
- Currency is fixed to a single demo currency for this assignment.

## Request Lifecycle

State model:

- PENDING
- PAID
- DECLINED
- CANCELLED
- EXPIRED

Allowed transitions:

- PENDING → PAID
- PENDING → DECLINED
- PENDING → CANCELLED
- PENDING → EXPIRED

No other transitions are allowed. Terminal states (PAID, DECLINED, CANCELLED, EXPIRED)
are permanent and cannot be reversed.

The PENDING → PAID transition includes a 2-3 second server-side artificial delay before
committing. The PENDING → DECLINED and PENDING → CANCELLED transitions are immediate.

## Authorization Rules

- Only the recipient can pay or decline a PENDING request.
- Only the requester can cancel a PENDING request.
- Shareable links do not grant state-changing powers without a valid authenticated session
  as the correct actor (requester or recipient).
- An authenticated user who is neither requester nor recipient (Observer) may view the
  request via a shareable link but cannot take any action. Observers may see all request
  fields (amount, note, status, timestamps). No field-level redaction is applied for
  Observers.
- Expiration is enforced server-side regardless of what the client presents.
- Client-only state must not be trusted for action authorization.

## Expiration Semantics

- Requests expire 7 days after creation (`createdAt + 7 days = expiresAt`).
- `expiresAt` is calculated and stored at creation time.
- Expiration is evaluated server-side on every state-reading or action request.
- A PENDING request past its `expiresAt` is treated as EXPIRED by the server; this
  transition is implicit (no explicit background job required for the demo scope).
- The countdown shown in the UI is derived from `expiresAt` and is display-only.
- An EXPIRED request cannot transition to any other state.

## Validation Rules

- **Amount**: required. The user enters a dollar value (e.g. "15.00"); the system
  converts it to integer minor units (cents) before storage. The entered value must be
  greater than zero. Zero and negative values are rejected at the form level.
- **Recipient email**: required when email method is selected; must be a valid email
  format; must not match the requester's own email.
- **Recipient phone**: required when phone method is selected; must match E.164-like
  format (`/^\+?[1-9]\d{6,14}$/`); must not resolve to the requester's own account.
- **Identification method**: exactly one of email or phone must be active. Both or neither
  being provided is rejected.
- **Note**: optional, maximum 200 characters.
- **Action preconditions**: pay and decline are only valid if the request is PENDING and
  not expired, and the actor is the recipient. Cancel is only valid if the request is
  PENDING and not expired, and the actor is the requester.
- **Status filter param**: must be one of ALL, PENDING, PAID, DECLINED, CANCELLED,
  EXPIRED. An invalid value defaults to ALL.
- **Search param**: free-text, trimmed. No minimum or maximum length. Empty value is
  treated as no filter. Filtering triggers on debounced keystroke (300ms); no explicit
  submit required. Matches counterparty name, email, and phone number.

## Error States

- Invalid form input: shown inline at field level; submission blocked.
- Recipient email not found: shown as a form error at submission time.
- Recipient phone not found: shown as a form error identical to the email-not-found case.
- Self-request via phone (phone resolves to requester's own account): rejected with the
  same inline error as the email self-request case.
- Self-request (requester = recipient): rejected with an inline form error.
- Attempted action on non-PENDING request: server returns an error; UI reflects the
  current actual state.
- Attempted action by wrong actor: server rejects with an authorization error.
- Expired request action attempt: server returns an expired error; UI shows EXPIRED state.
- Payment processing server error during delay (e.g. 409 Conflict — request expired or
  acted upon concurrently): UI exits processing state, shows error message, and re-fetches
  current request state to reflect actual server state.
- Request not found (invalid or nonexistent request ID in shareable link): the system
  returns a not-found response; the UI displays a clear not-found message with no action
  buttons.

## Edge Cases

- Recipient is not yet a registered user: request creation is blocked; requester must
  enter a valid registered email or phone.
- Simultaneous action attempts on the same request (e.g. two browser tabs): the first
  action succeeds; the second is rejected because the request is no longer PENDING.
- Request accessed via shareable link while in terminal state: displayed as read-only with
  clear terminal status; no action buttons shown.
- Shareable link accessed by unauthenticated user: redirected to login; after login,
  returned to the request detail. If the user authenticates as an account that is neither
  the requester nor the recipient, they are treated as an Observer: full request detail is
  visible, no action buttons are shown.
- EXPIRED requests appear in both dashboard lists (outgoing and incoming) alongside other
  terminal-state requests. The effective status (EXPIRED) is computed server-side and
  included in the list response — no client-side filtering.
- Status filter with no matching results: dashboard shows an empty-state message ("No
  requests match this filter"), not the default empty-dashboard state.
- Search with no matching results: same empty-state behavior as filter-with-no-results.
- Partial email substring match is expected: searching "alice" matches "<alice@example.com>".
- User has no phone number: cannot be found via phone lookup; the "recipient not found"
  error is returned, same as for an unregistered email.
- Toggling between Email and Phone clears the hidden field so stale input cannot be
  submitted.
- Status filter set to EXPIRED includes implicitly expired requests (PENDING status in DB
  with `expiresAt` in the past), not only rows with `status = 'EXPIRED'`.
- Concurrent pay during the artificial delay: the server uses a conditional write; the
  second attempt receives a 409 and the UI re-fetches the actual state.
- Expiration occurring during the pay delay: the conditional write detects the expired
  state and returns 409; the UI shows the EXPIRED status after re-fetch.

## Acceptance Criteria

- AC1: A requester can create a payment request with a valid recipient email, positive
  amount, and optional note. The request is created in PENDING state.
- AC2: A recipient can pay a PENDING incoming request. The request transitions to PAID.
- AC3: A recipient can decline a PENDING incoming request. The request transitions to
  DECLINED.
- AC4: A requester can cancel one of their own PENDING requests. The request transitions
  to CANCELLED.
- AC5: A request that has passed its `expiresAt` is treated as EXPIRED by the server.
  The recipient cannot pay or decline it. The requester cannot cancel it.
- AC6: A user who is neither requester nor recipient of a request can view it via the
  shareable link but cannot take any action.
- AC7: Attempting to pay, decline, or cancel a request when not the authorized actor
  results in an authorization error.
- AC8: The outgoing dashboard shows all requests created by the authenticated user with
  their current statuses.
- AC9: The incoming dashboard shows all requests directed to the authenticated user with
  their current statuses.
- AC10: Amount validation rejects zero, negative values, and non-integer inputs.
- AC11: Self-request (requesting from oneself) is rejected at creation time.
- AC12: Navigating to a shareable link with a nonexistent request ID results in a clear
  not-found state with no action buttons.
- AC13: A note longer than 200 characters is rejected at creation time with an inline
  error.
- AC14: Both outgoing and incoming dashboards show a horizontal row of pill/tab buttons for
  status filtering with options ALL (default), PENDING, PAID, DECLINED, CANCELLED, EXPIRED.
- AC15: Selecting a status value re-renders the dashboard showing only requests whose
  effective status matches; the URL `?status=` param reflects the selected value.
- AC16: The EXPIRED filter value includes PENDING requests past their `expiresAt`
  (implicitly expired), not only rows stored with `status = 'EXPIRED'`.
- AC17: Both dashboards show a search input; entering a term filters the list (debounced,
  300ms) to requests whose counterparty name, email, or phone number contains the term as
  a case-insensitive substring.
- AC18: Search and status filter are combinable simultaneously; clearing the search term
  restores the full list subject to any active status filter.
- AC19: Filter and search state updates do not cause a full page reload; URL params
  reflect both states.
- AC20: The create-request form shows an Email/Phone toggle; only the selected input is
  visible at a time.
- AC21: A request created via a valid phone number is functionally identical to an
  email-created request (PENDING state, 7-day expiry, same shareable link).
- AC22: Entering a phone number that belongs to no registered user returns a
  "recipient not found" inline error.
- AC23: Entering a phone number that resolves to the requester's own account is rejected
  with the same inline error as the email self-request case.
- AC24: Clicking Pay on a PENDING request enters a processing state: Pay button is
  disabled, a spinner is visible, and the state persists for approximately 2-3 seconds
  before resolving.
- AC25: After successful payment, a distinct success confirmation message is displayed
  alongside the PAID status badge. Decline and Cancel actions are not affected by the
  payment delay.
- AC26: When the dashboard search term resolves to exactly one counterparty on that
  dashboard, an inline contact summary card is rendered directly below the search
  input and above the request list. The card is not a modal and does not overlay any
  existing content.
- AC27: The contact summary card displays the matched contact's name, email, and
  phone number when available. If the contact has no phone on record, the phone line
  is omitted or shown as "—"; the card still renders.
- AC28: The contact summary card displays four relationship metrics scoped to the
  current signed-in user: total outgoing requests count (current user → contact),
  total incoming requests count (contact → current user), aggregated pending amount,
  and aggregated paid amount. A declined aggregate is also displayed. All dollar
  aggregates are presented in the same display format used elsewhere in the app.
- AC29: When the search term matches zero counterparties, or more than one distinct
  counterparty, or the search input is empty, the contact summary card is not shown.
  Clearing the search or broadening it to match multiple contacts removes the card.
- AC30: Changing the status filter while the contact card is visible does not change
  the card's identity fields or metrics. The card remains visible as long as the search
  term still resolves to exactly one counterparty. The request list below the card
  continues to reflect both the active status filter and the active search term.
- AC31: On a viewport of 375px width or smaller, the contact card stacks its identity
  block and metrics block vertically and remains fully visible without clipping or
  horizontal scroll. The status filter pills and the search input remain reachable
  without scrolling past the card.
- AC32: The dashboard controls area (status pills, search input, contact card when
  present) is rendered as a visually grouped cluster using the soft brand-adjacent
  palette (light slate / misty blue surfaces, deep navy text, blue-to-cyan accents).
  Empty-state messaging ("No results for …", "No requests yet") remains readable and
  is rendered within the same visual container.

## Reviewer Notes

### Assumptions

- Auth is mock email + fixed demo password (no real OAuth, no secure hashing required).
  The login form accepts a known seeded email and a single shared demo password. Two or
  more pre-seeded demo users exist for stable E2E testing. Credentials are documented for
  reviewers and E2E setup.
- Payment rails are simulated (marking a request PAID does not move real money).
- Currency is USD for display purposes in this demo. Minor units are cents.
- Recipient must already be a registered user; no invite-by-email or invite-by-phone flow
  is in scope.
- The 7-day expiration window is exact from `createdAt`; no grace period.
- Implicit expiration (evaluated on read) is acceptable for demo scope; no background
  expiry scheduler is needed.
- The "unique, unguessable identifier" for shareable links is a UUID or equivalent.
- Phone uses E.164-like format; no carrier validation or SMS verification is performed.
- At least two seeded demo users have phone numbers populated for E2E phone-lookup testing.
- Dashboard filter and search use server-side Prisma queries with `getEffectiveStatus()`
  post-processing for the EXPIRED case.

### Intentional Simplifications

- No notifications (email, push, SMS) — state changes are only visible in the UI.
- No real payment processing — PAID state is cosmetic for the demo.
- No multi-currency — single fixed currency reduces demo complexity.
- No pagination on dashboards — acceptable for demo user counts.
- No request editing after creation — reduces lifecycle complexity.
- The 2-3 second pay delay is a fixed server-side sleep, not real payment rails.
- Dashboard search is substring-based (no full-text index); sufficient at demo scale.
- Phone numbers are stored as plain strings with no normalization library.
- No phone masking or country-code picker — plain text input with placeholder hint
  (e.g. "+15551234567").

### Prototype-Grade Boundaries

- Mock auth is used instead of a real identity provider.
- Database is a hosted Postgres instance (Supabase); no production-grade backup or
  failover is configured.
- E2E tests run against a locally seeded or demo environment, not a staging clone.
