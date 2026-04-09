# Data Model: P2P Payment Request

## Entities

### User

Represents an authenticated demo user.

| Field     | Type     | Notes                                |
| --------- | -------- | ------------------------------------ |
| id        | String   | UUID v4, primary key                 |
| email     | String   | Unique, used as login identifier     |
| password  | String   | Demo hash (bcryptjs, cost factor 10) |
| name      | String   | Display name                         |
| createdAt | DateTime | Auto-set on create                   |

Relationships:

- `sentRequests` — PaymentRequests where this user is the requester
- `receivedRequests` — PaymentRequests where this user is the recipient

### PaymentRequest

Represents a single P2P payment request from one user to another.

| Field            | Type          | Notes                                               |
| ---------------- | ------------- | --------------------------------------------------- |
| id               | String        | UUID v4, primary key, used in shareable link        |
| requesterId      | String        | FK → User.id                                        |
| recipientId      | String        | FK → User.id                                        |
| amountMinorUnits | Int           | Stored in cents (e.g. 1500 = $15.00)                |
| note             | String?       | Optional, max 200 chars, null if empty              |
| status           | RequestStatus | PENDING \| PAID \| DECLINED \| CANCELLED \| EXPIRED |
| expiresAt        | DateTime      | createdAt + 7 days, set at creation                 |
| createdAt        | DateTime      | Auto-set on create                                  |
| updatedAt        | DateTime      | Auto-updated on every write                         |
| paidAt           | DateTime?     | Set when transitioned to PAID                       |
| declinedAt       | DateTime?     | Set when transitioned to DECLINED                   |
| cancelledAt      | DateTime?     | Set when transitioned to CANCELLED                  |

Relationships:

- `requester` → User (via requesterId)
- `recipient` → User (via recipientId)

Indexes:

- `requesterId` — dashboard query for outgoing requests
- `recipientId` — dashboard query for incoming requests
- `status` — optional filter by state
- `expiresAt` — expiration boundary queries

### RequestStatus Enum

```text
PENDING
PAID
DECLINED
CANCELLED
EXPIRED
```

Note: EXPIRED is stored in the DB only when an explicit state-changing action is
attempted and the server re-checks expiry. Reads return the effective status computed
from `expiresAt < now()` without writing back. This is a deliberate demo simplification.

---

## Effective Status Computation

On every server-side read of a PaymentRequest:

```typescript
if (request.status === "PENDING" && request.expiresAt < new Date()) {
  return "EXPIRED";
}
return request.status;
```

This computation happens in a shared utility before any response is returned or action
is permitted. It is not persisted on read-only calls.

---

## Prisma Schema (target)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())

  sentRequests     PaymentRequest[] @relation("Requester")
  receivedRequests PaymentRequest[] @relation("Recipient")
}

model PaymentRequest {
  id               String        @id @default(uuid())
  requesterId      String
  recipientId      String
  amountMinorUnits Int
  note             String?
  status           RequestStatus @default(PENDING)
  expiresAt        DateTime
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  paidAt           DateTime?
  declinedAt       DateTime?
  cancelledAt      DateTime?

  requester User @relation("Requester", fields: [requesterId], references: [id])
  recipient User @relation("Recipient", fields: [recipientId], references: [id])

  @@index([requesterId])
  @@index([recipientId])
  @@index([status])
  @@index([expiresAt])
}

enum RequestStatus {
  PENDING
  PAID
  DECLINED
  CANCELLED
  EXPIRED
}
```

---

## Seed Users (demo)

| Name  | Email               | Password | Role in demo           |
| ----- | ------------------- | -------- | ---------------------- |
| Alice | <alice@example.com> | demo1234 | Default requester      |
| Bob   | <bob@example.com>   | demo1234 | Default recipient      |
| Carol | <carol@example.com> | demo1234 | Observer / third party |

All seeded with the same demo password for simplicity. E2E tests switch between Alice
and Bob as requester/recipient for the core happy paths.
