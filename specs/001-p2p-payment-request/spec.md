# Feature Specification

## Summary

A consumer-facing web feature that lets one user request money from another user.
The requester creates a payment request by specifying a recipient (by email), an amount,
and an optional note. The recipient receives the request and can pay, decline, or let it
expire. The requester can cancel their own pending requests. All requests have a 7-day
expiration window enforced by the system.

## Clarifications

### Session 2026-04-09

- Q: How does the user enter the amount — dollar value or minor units (cents)? → A: Dollar
  value (e.g. "15.00"); the system converts to integer minor units (cents) on submission.
- Q: What is the mock auth mechanism — dropdown, email-only, or email + password? → A:
  Email + fixed demo password. Login form accepts a seeded email and a shared demo
  password; no real hashing or OAuth required.

## Goals

- Allow a user to create a payment request directed at another user by email address.
- Allow the recipient to pay or decline an incoming request.
- Allow the requester to cancel their own pending request.
- Enforce a 7-day expiration on all outstanding requests.
- Provide both requester and recipient with clear, up-to-date request status visibility.
- Make the feature usable on desktop and mobile browsers.
- Produce a publicly accessible demo with reproducible E2E evidence.

## Non-Goals

- No real payment processing or actual money movement.
- No partial payments (the full requested amount must be paid or the request is declined).
- No editing a request after it is created.
- No notifications beyond what is visible in the UI (no email, push, or SMS alerts).
- No multi-currency support (single demo currency only).
- No background job scheduling or queue infrastructure.
- No support for requesting from or paying to anonymous or unauthenticated users.

## Actors

- **Requester** — the authenticated user who creates a payment request.
- **Recipient** — the authenticated user identified by the email address in the request.
- **Observer** — any authenticated user who views a request detail via a shareable link
  but is neither the requester nor the recipient.

## Primary Flows

### F1 — Create a payment request

1. Requester navigates to the create-request screen.
2. Requester enters recipient email, an amount in dollars (e.g. "15.00"), and an optional
   note (max 200 characters). The system converts the dollar amount to integer minor units
   (cents) before storing.
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
2. Recipient confirms the payment action.
3. System transitions the request to PAID, records `paidAt`.
4. Both requester and recipient see the updated PAID status.

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

## Screens / Views

- **Create request screen** — form for recipient email, dollar-value amount (converted to
  cents on submit), and optional note.
- **Outgoing dashboard** — list of requests the authenticated user has created.
- **Incoming dashboard** — list of requests directed to the authenticated user.
- **Request detail screen** — full details of a single request; includes action buttons
  conditional on viewer role and current request state.

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
- **Recipient email**: required, must be a valid email format, must not match the
  requester's own email.
- **Note**: optional, maximum 200 characters.
- **Action preconditions**: pay and decline are only valid if the request is PENDING and
  not expired, and the actor is the recipient. Cancel is only valid if the request is
  PENDING and not expired, and the actor is the requester.

## Error States

- Invalid form input: shown inline at field level; submission blocked.
- Recipient email not found: shown as a form error at submission time.
- Self-request (requester = recipient): rejected with an inline form error.
- Attempted action on non-PENDING request: server returns an error; UI reflects the
  current actual state.
- Attempted action by wrong actor: server rejects with an authorization error.
- Expired request action attempt: server returns an expired error; UI shows EXPIRED state.
- Request not found (invalid or nonexistent request ID in shareable link): the system
  returns a not-found response; the UI displays a clear not-found message with no action
  buttons.

## Edge Cases

- Recipient is not yet a registered user: request creation is blocked; requester must
  enter a valid registered email.
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

## Reviewer Notes

### Assumptions

- Auth is mock email + fixed demo password (no real OAuth, no secure hashing required).
  The login form accepts a known seeded email and a single shared demo password. Two or
  more pre-seeded demo users exist for stable E2E testing. Credentials are documented for
  reviewers and E2E setup.
- Payment rails are simulated (marking a request PAID does not move real money).
- Currency is USD for display purposes in this demo. Minor units are cents.
- Recipient must already be a registered user; no invite-by-email flow is in scope.
- The 7-day expiration window is exact from `createdAt`; no grace period.
- Implicit expiration (evaluated on read) is acceptable for demo scope; no background
  expiry scheduler is needed.
- The "unique, unguessable identifier" for shareable links is a UUID or equivalent.

### Intentional Simplifications

- No notifications (email, push, SMS) — state changes are only visible in the UI.
- No real payment processing — PAID state is cosmetic for the demo.
- No multi-currency — single fixed currency reduces demo complexity.
- No pagination on dashboards — acceptable for demo user counts.
- No request editing after creation — reduces lifecycle complexity.

### Prototype-Grade Boundaries

- Mock auth is used instead of a real identity provider.
- Database is a hosted Postgres instance (Supabase); no production-grade backup or
  failover is configured.
- E2E tests run against a locally seeded or demo environment, not a staging clone.
