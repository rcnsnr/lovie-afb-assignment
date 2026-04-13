# Implementation Plan

## Summary

A P2P payment request web feature built as a Next.js modular monolith. Users create
payment requests by email or phone, amount (dollar input), and optional note. Recipients
can pay or decline. Requesters can cancel. All requests expire after 7 days. Mock auth
(email + demo password) with server-side authorization enforcement. No real money movement.
Deployed to Vercel with Supabase Postgres.

Both dashboards support status filtering (pill/tab buttons) and debounced counterparty
search (name, email, phone). The Pay action introduces a 2-3 second server-side delay
with a processing state and auto-dismissing success banner.

## Chosen Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode, no `any`)
- **ORM**: Prisma
- **Database**: Supabase Postgres
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Session**: iron-session (signed, encrypted cookie)
- **Testing**: Playwright (E2E)
- **Deployment**: Vercel (primary), Netlify (fallback)

## Why This Stack

- Next.js App Router gives SSR, route handlers, and middleware in one deployable unit —
  ideal for a modular monolith with shared auth context.
- Prisma makes the schema reviewable and migration-safe without raw SQL complexity.
- iron-session provides stateless, cookie-based sessions compatible with Vercel serverless
  without an external session store.
- Zod validates at the API boundary and serves as living documentation for request shapes.
- Tailwind avoids CSS file sprawl in a small feature.
- All choices are justified by the constitution; no speculative additions.

## Application Structure

```text
app/
  (auth)/
    login/page.tsx           ← login form
  (protected)/
    layout.tsx               ← auth guard: redirect to /login if no session
    dashboard/
      outgoing/page.tsx      ← list of requests sent; reads ?status= + ?search=
      incoming/page.tsx      ← list of requests received; reads ?status= + ?search=
    requests/
      new/page.tsx           ← create request form (email/phone toggle)
      [id]/page.tsx          ← request detail + action buttons + pay success banner
  api/
    auth/
      login/route.ts
      logout/route.ts
      me/route.ts
    requests/
      route.ts               ← POST (create, email or phone), GET (outgoing list + filter/search)
      incoming/route.ts      ← GET (incoming list + filter/search)
      [id]/
        route.ts             ← GET (detail)
        pay/route.ts         ← 2-3s delay before commit
        decline/route.ts
        cancel/route.ts
components/
  ExpiryCountdown.tsx        ← existing
  FilterBar.tsx              ← NEW: pill/tab status filter (client component)
  SearchInput.tsx            ← NEW: debounced search input (client component)
lib/
  auth.ts                    ← iron-session config, getSession helper
  money.ts                   ← parseDollars(), formatCents()
  prisma.ts                  ← singleton Prisma client
  requests.ts                ← getEffectiveStatus(), shared query helpers
  dto.ts                     ← toPaymentRequestDTO (adds phone fields)
prisma/
  schema.prisma              ← add phone field to User
  seed.ts                    ← seeds Alice, Bob, Carol (with phone numbers) + demo requests
```

## Data Model Plan

See `data-model.md` for full schema. Summary:

- **User**: id (UUID), email (unique), password (bcrypt), name, **phone (String? unique)**, createdAt
- **PaymentRequest**: id (UUID), requesterId, recipientId, amountMinorUnits (Int),
  note (String?), status (enum), expiresAt, createdAt, updatedAt, paidAt?,
  declinedAt?, cancelledAt?
- **RequestStatus enum**: PENDING, PAID, DECLINED, CANCELLED, EXPIRED

EXPIRED is computed on read (`status === PENDING && expiresAt < now()`), not stored
on passive reads. State-changing actions also re-check before executing.

**`phone` field addition** (new): nullable, unique String on User. Migration adds
`ALTER TABLE "User" ADD COLUMN "phone" TEXT UNIQUE`. Seed script populates Alice
(+15550001111), Bob (+15550002222), Carol (+15550003333). No normalization: stored
exactly as entered. Lookup is exact match (not substring) on the `phone` field.

## Route / API Shape

See `contracts/api.md` for full contract. Summary.

Note (IG4): the outgoing and incoming list endpoints apply `getEffectiveStatus()` to
every item in the result set before returning. EXPIRED items are included in the list
(not filtered), so users see their full request history. No client-side status filtering.

| Method | Path                                   | Auth | Purpose                          |
| ------ | -------------------------------------- | ---- | -------------------------------- |
| POST   | /api/auth/login                        | —    | Set session cookie               |
| POST   | /api/auth/logout                       | —    | Clear session cookie             |
| GET    | /api/auth/me                           | ✓    | Current user                     |
| POST   | /api/requests                          | ✓    | Create request (email or phone)  |
| GET    | /api/requests?status=&search=          | ✓    | Outgoing list with filter/search |
| GET    | /api/requests/incoming?status=&search= | ✓    | Incoming list with filter/search |
| GET    | /api/requests/[id]                     | ✓    | Request detail                   |
| POST   | /api/requests/[id]/pay                 | ✓    | Pay (recipient only, 2-3s delay) |
| POST   | /api/requests/[id]/decline             | ✓    | Decline (recipient only)         |
| POST   | /api/requests/[id]/cancel              | ✓    | Cancel (requester only)          |

**Filter/search implementation**: The list endpoints accept `?status=` and `?search=`
query params. Filtering logic:

1. Fetch all records for the user from DB (with requester + recipient relations)
2. Map each through `getEffectiveStatus()` via `toPaymentRequestDTO`
3. Filter by effective status if `status != ALL`
4. Filter by search term with case-insensitive substring match on counterparty
   name, email, and phone (all three fields, OR semantics)
5. Return filtered result (reverse-chronological order preserved from DB sort)

This approach avoids the EXPIRED filter problem (cannot push to DB level) and keeps
filtering logic in a single place. Acceptable at demo scale.

## Auth Approach

- **Mechanism**: iron-session cookie (signed, encrypted, httpOnly, sameSite=lax)
- **Login**: POST /api/auth/login validates email against DB, compares bcrypt hash
- **Session payload**: `{ userId: string }`
- **Auth guard**: `(protected)/layout.tsx` calls `getSession()` server-side; redirects
  to /login on missing or invalid session
- **Demo credentials** (seeded):

  | Email               | Password |
  | ------------------- | -------- |
  | <alice@example.com> | demo1234 |
  | <bob@example.com>   | demo1234 |
  | <carol@example.com> | demo1234 |

- **Self-request check (IG1)**: after resolving the recipient User by email, compare
  `recipient.id !== session.userId` (UUID comparison, not email string). This prevents
  bypass via email case variants (e.g. "<Alice@example.com>" vs "<alice@example.com>").
- **No real security**: bcrypt is used for correctness/structure, not for actual security
  value in this demo context. Credentials are public.

## Money Handling Decision

- **Input**: user enters dollar value as a string (e.g. "15.00")
- **Validation (IG2)**: single Zod chain — no two-step validation:
  `z.string().regex(/^\d+(\.\d{1,2})?$/).transform(parseDollars).pipe(z.number().int().positive())`
  This rejects "0", "0.00", non-numeric strings, and values with more than 2 decimal
  places in one pass. `parseDollars` must not be called separately.
- **Storage**: `amountMinorUnits: Int` (cents; e.g. 1500 for $15.00)
- **Display**: `formatCents(cents)` → always `"$X.XX"` with 2 decimal places
- **Consistency rule**: `formatCents` is the single source of truth for display; used on
  create screen (confirmation), detail screen, and both dashboards without exception
- **No floats**: no `parseFloat`, no `toFixed` for storage, no division in business logic

## Phone Recipient Path

- **Create form** (`app/(protected)/requests/new/page.tsx`): add `identificationMethod`
  state (`'email' | 'phone'`). Toggle is a pair of buttons that switch between the two
  inputs. Only the active input is rendered. Switching clears the hidden field's state.
- **API body**: When phone is selected, submit `{ recipientPhone, amountDollars, note }`.
  When email is selected, submit `{ recipientEmail, amountDollars, note }` (unchanged).
- **POST /api/requests** (`app/api/requests/route.ts`): Update Zod schema to accept
  either `recipientEmail` or `recipientPhone` (exactly one, via `.refine()`). When
  phone path: look up `prisma.user.findUnique({ where: { phone } })`. Same 404/422
  response pattern as email path.
- **Self-request check**: use `recipient.id !== session.userId` (UUID comparison) for
  both email and phone paths — same guard already in place.
- **DTO update** (`lib/dto.ts`): add `requesterPhone: string | null` and
  `recipientPhone: string | null` sourced from `req.requester.phone` and
  `req.recipient.phone`.

## Dashboard Filter and Search

- **Architecture**: Dashboard pages remain Next.js server components. They receive
  `searchParams` props (`{ status?: string; search?: string }`) from Next.js App Router.
  Two new client components handle user interaction:
  - `components/FilterBar.tsx` — renders pill/tab buttons, calls
    `router.push/replace` to update `?status=` URL param (soft navigation)
  - `components/SearchInput.tsx` — renders text input, debounces 300ms with
    `useCallback` + `setTimeout`/`clearTimeout` pattern, calls
    `router.replace` to update `?search=` param
- **Server component pages** read `searchParams.status` and `searchParams.search`,
  fetch all records, pass DTOs through the filter/search logic, then render
  `<FilterBar>` + `<SearchInput>` + filtered list.
- **Filter logic** (in each dashboard page or a shared helper):

  ```typescript
  const filtered = dtos
    .filter((r) => (status === "ALL" || !status ? true : r.status === status))
    .filter((r) =>
      !search
        ? true
        : [counterparty.name, counterparty.email, counterparty.phone].some((v) =>
            v?.toLowerCase().includes(search.toLowerCase())
          )
    );
  ```

- **Empty state**: When `filtered.length === 0` and a filter/search is active, show
  "No requests match this filter." instead of the default "No requests yet." state.
- **URL param updates**: `FilterBar` uses `router.push` (adds history entry per F9 step 4);
  `SearchInput` uses `router.replace` (no history spam on every keystroke).

## Pay Simulation Delay

- **Location**: `app/api/requests/[id]/pay/route.ts`
- **Implementation**: Add `await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))`
  **before** the conditional Prisma write (after the authorization checks). This gives
  2000-3000ms delay. The random component makes it feel natural.
- **Placement note**: delay goes AFTER the 403 actor check and BEFORE the `updateMany`.
  This avoids wasting the delay on unauthorized attempts and preserves the concurrent-write
  safety of the conditional update.

## Pay Success Confirmation (Client)

- **Location**: `app/(protected)/requests/[id]/page.tsx`
- **New state**: `const [paySuccess, setPaySuccess] = useState(false)`
- **On pay success**: inside `handleAction('pay')` success branch, set `setPaySuccess(true)`.
  Keep existing `setReq(data.request)`.
- **Auto-dismiss**: `useEffect(() => { if (paySuccess) { const t = setTimeout(() => setPaySuccess(false), 5000); return () => clearTimeout(t); } }, [paySuccess])`
- **Banner render**: when `paySuccess` is true, render a green banner above the action area:

  ```tsx
  <div className="...green banner styles...">
    Payment successful!
    <button onClick={() => setPaySuccess(false)}>✕</button>
  </div>
  ```

- **Processing state**: The existing `loading` flag already sets button text to
  "Processing…" and `disabled`. Add a visual spinner inline (SVG or Tailwind `animate-spin`
  on a border element) next to the button text during Pay specifically (not Decline/Cancel).

## Lifecycle Integrity Decisions

- **Allowed transitions** (server-enforced before any state write):
  - PENDING → PAID (pay action, recipient only)
  - PENDING → DECLINED (decline action, recipient only)
  - PENDING → CANCELLED (cancel action, requester only)
  - PENDING → EXPIRED (implicit on read when expiresAt < now())
- **Terminal-state enforcement**: before executing any action, the server:
  1. Loads the request from DB
  2. Computes effective status (including expiration check)
  3. Rejects with 409 if status is not PENDING
- **Conditional write (CR1 + CR2)**: the DB write for pay/decline/cancel MUST use a
  conditional update: `WHERE id = ? AND status = 'PENDING' AND expiresAt > NOW()`.
  If `rowsAffected = 0`, return 409 — the request was already acted on or just expired
  between the read and the write. This eliminates double-transition from concurrent
  requests and the read-write expiration race.
- **Expiration enforcement**:
  - `expiresAt = createdAt + 7 days` — set at creation, UTC
  - `getEffectiveStatus(request)` in `lib/requests.ts` computes runtime status
  - Every route handler calls `getEffectiveStatus` before responding or acting
  - The countdown UI reads `expiresAt` from the response and derives display client-side
  - Expiration is never trusted from the client

## Execution Lanes

- **Planning / review lane**: opusplan, high effort — spec review, architecture choices,
  risk analysis, edge-case audit
- **Implementation lane**: sonnet, medium effort — thin implementation slices, routine code,
  most documentation updates
- **Debugging lane**: opus, high effort — hard bugs, flaky E2E, lifecycle inconsistencies
- **Docs / cleanup lane**: sonnet, low-medium effort — README, AI process notes, assumptions

## High-Risk Decisions Requiring Strong Review

1. **Effective status computation** — `getEffectiveStatus` in `lib/requests.ts` is called
   on every read and action. Any bug here silently breaks expiration enforcement across the
   entire feature. Requires dedicated E2E coverage (AC5).

2. **Authorization checks in route handlers** — each of `/pay`, `/decline`, `/cancel` must
   verify both (a) current effective status = PENDING and (b) correct actor. Both checks
   must be independent server-side; missing either allows unauthorized state changes.

3. **Dollar-to-cents conversion** — `parseDollars` must correctly handle edge cases
   ("15", "15.0", "15.00", "0.01") and reject all invalid formats at the Zod layer
   before any DB write.

4. **Session cookie security** — iron-session secret must be a strong random value in
   production env vars; the demo uses a fixed secret only because credentials are public.

## E2E and Evidence Strategy

- **Test framework**: Playwright
- **Seed state**: `prisma/seed.ts` seeds Alice, Bob, Carol + one past-expiry fixture:
  a PaymentRequest with `status = PENDING` and `expiresAt = yesterday UTC`, requester
  Alice, recipient Bob, amount 500 cents ($5.00). The fixture is written as PENDING (not
  EXPIRED) so `getEffectiveStatus()` is exercised in E2E — a fixture written as EXPIRED
  would bypass the computation and produce a false-passing AC5 test (IG6).
- **User switching**: Playwright sets session by calling POST /api/auth/login with
  seeded credentials at the start of each test file's `beforeEach`
- **Happy path coverage** (AC1, AC2):
  - Alice logs in → creates request to Bob → Bob logs in → pays → both see PAID
- **Decline path** (AC3): Alice creates → Bob declines
- **Cancel path** (AC4): Alice creates → Alice cancels
- **Expiration path** (AC5): Alice loads the pre-seeded past-expiry request → Bob tries
  to pay → server rejects → UI shows EXPIRED
- **Authorization path** (AC7): Alice tries to pay her own request → 403
- **Dashboard coverage** (AC8, AC9): After creates and actions, verify list contents and ordering
- **Observer path** (AC6): Carol visits Alice→Bob request via shareable link → sees detail,
  no action buttons
- **Not-found path** (AC12): Navigate to `/requests/nonexistent-uuid` → not-found state
- **Video artifacts**: `use: { video: 'on' }` in Playwright config, retained for all tests
- **Trace artifacts**: `use: { trace: 'retain-on-failure' }` — full trace on failures
- **Evidence collection**: `scripts/3-run_e2e_evidence.sh` wraps Playwright run and copies
  artifacts to `e2e-evidence/`

## Deployment Strategy

- **Primary**: Vercel (Next.js native, serverless functions, automatic preview deployments)
- **Fallback**: Netlify (acceptable; requires Next.js adapter config)
- **Database**: Supabase Postgres (`DATABASE_URL` env var, Prisma connection pooling via
  `?pgbouncer=true&connect_timeout=10` for serverless)
- **Migrations**: `prisma migrate deploy` run as part of Vercel build step
- **Seed**: manual `npx prisma db seed` on first deploy; Vercel does not auto-seed
- **Env vars required**: `DATABASE_URL`, `SESSION_SECRET` (min 32 chars)
- **Demo URL**: added to README after first successful deployment

## Risks and Tradeoffs

| Risk                                               | Mitigation                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Implicit expiration creates stale dashboard counts | Documented assumption; acceptable for demo; note in ASSUMPTIONS.md |
| Serverless cold starts affect E2E timing           | Use Playwright `expect.poll` or retry on transient failures        |
| Prisma connection pooling with Supabase serverless | Use `pgbouncer=true` in DATABASE_URL; documented in BUILD_NOTES    |
| Seed data lost between deployments if DB reset     | Re-run seed script; document in README                             |
| bcrypt cost factor on serverless cold start        | Use cost 10 (acceptable latency); demo-only concern                |

## Non-Goals Preserved

- No real payment processing or money movement
- No notifications (email, push, SMS)
- No partial payments
- No post-creation editing
- No multi-currency
- No background jobs or queues
- No websockets or real-time updates
- No invite-by-email for unregistered recipients
- No pagination
