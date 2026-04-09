# API Contracts: P2P Payment Request

All endpoints are Next.js App Router route handlers under `/app/api/`.
All requests and responses use JSON. All protected endpoints require a valid session
cookie (set by POST /api/auth/login). Unauthorized requests return 401.

---

## Auth Endpoints

### POST /api/auth/login

Authenticate with email and demo password. Sets a signed session cookie.

**Request body**:

```json
{
  "email": "alice@example.com",
  "password": "demo1234"
}
```

**Responses**:

- `200 OK` — session cookie set, returns `{ "user": { "id", "email", "name" } }`
- `400 Bad Request` — missing or malformed fields
- `401 Unauthorized` — invalid email or password

### POST /api/auth/logout

Clear the session cookie.

**Responses**:

- `200 OK` — cookie cleared

### GET /api/auth/me

Return the currently authenticated user.

**Responses**:

- `200 OK` — `{ "user": { "id", "email", "name" } }`
- `401 Unauthorized` — no valid session

---

## Request Endpoints

### POST /api/requests

Create a new payment request. Requires auth.

**Request body**:

```json
{
  "recipientEmail": "bob@example.com",
  "amountDollars": "15.00",
  "note": "Dinner split"
}
```

**Validation**:

- `recipientEmail`: valid email, must exist in DB, must not equal session user's email
- `amountDollars`: string matching `/^\d+(\.\d{1,2})?$/`, converted value > 0
- `note`: optional string, max 200 characters

**Responses**:

- `201 Created` — `{ "request": PaymentRequestDTO }`
- `400 Bad Request` — validation failure with field-level errors
- `404 Not Found` — recipient email not registered
- `422 Unprocessable` — self-request (requester = recipient)
- `401 Unauthorized` — no valid session

### GET /api/requests

List outgoing requests for the authenticated user. Sorted by createdAt DESC.

**Responses**:

- `200 OK` — `{ "requests": PaymentRequestDTO[] }`
- `401 Unauthorized`

### GET /api/requests/incoming

List incoming requests for the authenticated user. Sorted by createdAt DESC.

**Responses**:

- `200 OK` — `{ "requests": PaymentRequestDTO[] }`
- `401 Unauthorized`

### GET /api/requests/[id]

Get a single request by ID. Any authenticated user can view. Applies effective-status
computation (PENDING + expired → EXPIRED).

**Responses**:

- `200 OK` — `{ "request": PaymentRequestDTO }`
- `401 Unauthorized`
- `404 Not Found` — request ID does not exist

### POST /api/requests/[id]/pay

Transition a PENDING request to PAID. Recipient only.

**Responses**:

- `200 OK` — `{ "request": PaymentRequestDTO }` with status PAID
- `401 Unauthorized` — no session
- `403 Forbidden` — session user is not the recipient
- `404 Not Found` — request does not exist
- `409 Conflict` — request is not PENDING (or is expired)

### POST /api/requests/[id]/decline

Transition a PENDING request to DECLINED. Recipient only.

**Responses**:

- `200 OK` — `{ "request": PaymentRequestDTO }` with status DECLINED
- `401 Unauthorized`
- `403 Forbidden` — session user is not the recipient
- `404 Not Found`
- `409 Conflict` — request is not PENDING (or is expired)

### POST /api/requests/[id]/cancel

Transition a PENDING request to CANCELLED. Requester only.

**Responses**:

- `200 OK` — `{ "request": PaymentRequestDTO }` with status CANCELLED
- `401 Unauthorized`
- `403 Forbidden` — session user is not the requester
- `404 Not Found`
- `409 Conflict` — request is not PENDING (or is expired)

---

## PaymentRequestDTO Shape

```typescript
{
  id: string; // UUID
  requesterId: string;
  recipientId: string;
  requesterEmail: string;
  requesterName: string;
  recipientEmail: string;
  recipientName: string;
  amountDisplay: string; // "$15.00" — formatted cents
  amountMinorUnits: number; // 1500 — raw storage value
  note: string | null;
  status: "PENDING" | "PAID" | "DECLINED" | "CANCELLED" | "EXPIRED";
  expiresAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  paidAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
}
```

Note: `status` in the DTO reflects the effective status (EXPIRED if PENDING and past
`expiresAt`), not necessarily the raw DB value.
