# Fintech Request Lifecycle

## Canonical States

- PENDING
- PAID
- DECLINED
- CANCELLED
- EXPIRED

## Allowed Transitions

- PENDING -> PAID
- PENDING -> DECLINED
- PENDING -> CANCELLED
- PENDING -> EXPIRED

No other transitions are allowed.

## Rules

- terminal states remain terminal
- expiration is enforced server-side
- countdown is presentation only
- expired requests cannot be paid
- only the sender can cancel a pending request
- only the recipient can pay or decline
- shareable links must not grant state-changing powers without authorization

## Timestamps

- createdAt
- updatedAt
- expiresAt
- paidAt
- declinedAt
- cancelledAt
