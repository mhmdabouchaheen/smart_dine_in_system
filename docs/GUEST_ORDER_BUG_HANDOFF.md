# Guest-Order Ownership & Order-Merging Bug — Investigation Handoff

> **Status:** NOT STARTED — WAITING FOR BUSINESS LOGIC CONFIRMATION
>
> **Investigator:** AI Agent (session: a7af6d5c-d5d6-40f0-898e-f79733def7ef)
>
> **Date:** 2026-07-14

---

## Bug Evidence

### Pre-Guest-Order MongoDB Document

```json
{
  "_id": { "$oid": "6a5680403f34f518dca3a864" },
  "tableId": { "$oid": "6a4e18930c84aa565d6ed24e" },
  "customerId": { "$oid": "6a5680263f34f518dca3a85f" },
  "customerIds": [{ "$oid": "6a5680263f34f518dca3a85f" }],
  "userIds": [],
  "items": [
    { "name": "Pasta", "quantity": 1, "unitPrice": 20 },
    { "name": "Truffle Mushroom Tart", "quantity": 1, "unitPrice": 18.5 }
  ],
  "status": "Pending",
  "totalAmount": 38.5,
  "paymentStatus": "Paid",
  "paymentMethod": "staff_assisted",
  "needsAssistance": true
}
```

### Post-Guest-Order MongoDB Document (same `_id`)

```json
{
  "_id": { "$oid": "6a5680403f34f518dca3a864" },
  "tableId": { "$oid": "6a4e18930c84aa565d6ed24e" },
  "customerId": { "$oid": "6a5680263f34f518dca3a85f" },
  "customerIds": [{ "$oid": "6a5680263f34f518dca3a85f" }],
  "userIds": [],
  "items": [
    { "name": "Pasta", "quantity": 2, "unitPrice": 20 },
    { "name": "Truffle Mushroom Tart", "quantity": 1, "unitPrice": 18.5 }
  ],
  "status": "Pending",
  "totalAmount": 58.5,
  "paymentStatus": "Paid",
  "paymentMethod": "staff_assisted",
  "needsAssistance": true
}
```

### Observed Behavior

1. A signed-in customer placed an order (Pasta + Truffle Mushroom Tart, $38.50, `paymentStatus: "Paid"`).
2. A **different session** browsed the site as a **guest** and ordered only **Pasta x 1 ($20)**.
3. Instead of creating a new order, the guest's Pasta was merged into the existing customer's order.
4. The original order `_id` (`6a5680403f34f518dca3a864`) and all customer ownership fields (`customerId`, `customerIds`) were **unchanged**.
5. `totalAmount` became $58.50 — arithmetic is correct for the merge, but the merge itself was wrong.
6. The order was mutated even though `paymentStatus` was already `"Paid"`.

---

## Current Architecture

### Tech Stack

- **Backend:** Node.js + Express + Mongoose (TypeScript) — `smart_dine_in/`
- **Frontend:** React + Vite (TypeScript) — `client/`
- **Auth:** HTTP-only cookie holding a JWT (`token`). `withCredentials: true` on all Axios requests.
- **Database:** MongoDB (Mongoose)

### Key Backend Files

| File | Role |
|---|---|
| `src/controllers/orderController.ts` | All order CRUD, the merge logic lives here |
| `src/models/Order.ts` | Mongoose schema for orders |
| `src/routes/orderRoutes.ts` | Express routes — **`POST /orders` has NO auth middleware** |
| `src/middlewares/authMiddleware.ts` | JWT cookie-based auth middleware |
| `src/controllers/authController.ts` | Login, logout, getCurrentUser |

### Key Frontend Files

| File | Role |
|---|---|
| `client/src/context/AuthContext.tsx` | Auth state; guest = synthetic `_id: "guest-${Date.now()}"` |
| `client/src/context/CartContext.tsx` | Cart state, `submitOrder`, `refreshActiveOrder` |
| `client/src/utils/session.ts` | `getCurrentTableId()` — reads from URL or `localStorage` |
| `client/src/services/api.ts` | Axios client; `createOrder`, `fetchTableOrders` |
| `client/src/components/OrderDrawer/OrderDrawer.tsx` | UI that calls `submitOrder` |
| `client/src/pages/Auth/Login.tsx` | "Continue as Guest" and login screen |

---

## Signed-In Customer Flow

1. User visits `/login`, enters credentials.
2. `api.login()` calls `POST /api/auth/login`. Server sets an HTTP-only cookie `token` (JWT containing `{ id: customerId, role: "Customer" }`, 7-day expiry).
3. `AuthContext` sets `user = { _id: customerId, name, email, role: "customer" }`.
4. User adds items to cart then opens `OrderDrawer` and clicks checkout.
5. `CartContext.submitOrder()` runs:
   - Reads `getCurrentTableId()` from URL query param or `localStorage`.
   - Sets `customerId = user._id` (because `user.role === 'customer'`).
   - Sets `userId = undefined`.
   - Calls `api.createOrder({ tableId, items, customerId, ... })`.
6. `api.createOrder()` → `POST /api/orders` with body including `customerId`.
7. Backend `createOrder`:
   - Resolves `tableId` to a `Types.ObjectId`.
   - Looks for existing order: `Order.findOne({ tableId, status: { $in: ACTIVE_ORDER_STATUSES } })`.
   - If **none found** → creates new order with `customerId` and `customerIds`.
   - If **found** → merges items into existing order, updates `customerId`/`customerIds` if the incoming `customerId` is provided.
8. Order returned → stored in `localStorage` under key `noir_sel_active_order_id:{tableId}:{customerId}`.

---

## Guest Flow

1. User visits `/login`, clicks **"Continue as Guest"**.
2. `continueAsGuest()` in `AuthContext.tsx` (lines 68-79) creates a **synthetic, local-only** user object:
   ```ts
   { _id: `guest-${Date.now()}`, name: 'Guest', email: '', role: 'customer' }
   ```
   This exists **only in React state** (`useState`). No server call. No cookie set. No DB record created.
3. The existing HTTP-only cookie from any **previous customer session is NOT cleared** by `continueAsGuest()`. Only an explicit `logout()` (which calls `POST /api/auth/logout` → `res.clearCookie('token')`) clears it.
4. User adds items to cart and opens `OrderDrawer` → clicks checkout.
5. `CartContext.submitOrder()` runs:
   - Reads `getCurrentTableId()` from URL param or `localStorage` — **the same table ID used by the prior customer session persists in `localStorage`**.
   - Sets `customerId = user._id = "guest-{timestamp}"` (a non-ObjectId string).
   - Calls `api.createOrder({ tableId, customerId: "guest-{timestamp}", ... })`.
6. `api.createOrder()` → `POST /api/orders` with `withCredentials: true`, meaning **any still-valid customer JWT cookie is sent automatically** (though the route ignores it).
7. On the backend, `objectIdOrUndefined("guest-{timestamp}")` returns `undefined` because `"guest-{timestamp}"` is not a valid MongoDB ObjectId.
8. Backend `createOrder` runs the existing order lookup:
   ```ts
   Order.findOne({ tableId: tableObjectId, status: { $in: ACTIVE_ORDER_STATUSES } })
   ```
   - `tableId` matches the previous customer's order (from `localStorage`).
   - `paymentStatus: "Paid"` does **NOT** exclude the order — no payment filter exists.
   - The previous customer's order (`_id: 6a5680403f34f518dca3a864`) is selected.
   - Items are merged: Pasta quantity 1 → 2; total $38.50 → $58.50.
   - `customerObjectId` is `undefined` (invalid guest ID), so ownership fields (`customerId`, `customerIds`) are **not updated** — they remain the original customer's IDs.
   - Order saved under the original `_id`.
9. Response returned.

---

## Existing Order Lookup — Root Cause Location

**File:** `smart_dine_in/src/controllers/orderController.ts`
**Function:** `createOrder`
**Lines:** 101–104

```typescript
const existingOrder = await Order.findOne({
  tableId: tableObjectId,
  status: { $in: ACTIVE_ORDER_STATUSES },
}).session(session).sort({ createdAt: -1 });
```

Where:
```typescript
const ACTIVE_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'];
```

**This query has NO ownership filter whatsoever.** It selects any active order on the table, regardless of:
- `customerId` / `customerIds`
- `userId` / `userIds`
- `paymentStatus`
- Guest vs. authenticated session

---

## Root Cause Evidence

### CONFIRMED — Bug 1: Order lookup is purely table-scoped with no ownership check

```typescript
// orderController.ts L101-104
const existingOrder = await Order.findOne({
  tableId: tableObjectId,
  status: { $in: ACTIVE_ORDER_STATUSES },
});
```

Any `createOrder` call for a given table finds the latest active order on that table, regardless of who placed it.

### CONFIRMED — Bug 2: Guest identity is a synthetic, non-persisted, non-ObjectId string

```typescript
// AuthContext.tsx L69-74
function continueAsGuest(): AuthUser {
  const guest: AuthUser = {
    _id: `guest-${Date.now()}`,  // not a valid ObjectId
    name: 'Guest',
    email: '',
    role: 'customer',
  }
  setUser(guest)  // React state only — no server call, no DB record
  return guest
}
```

Because `"guest-{timestamp}"` fails `Types.ObjectId.isValid()`, `objectIdOrUndefined()` returns `undefined`, so the guest contributes **no ownership identity** to the order.

### CONFIRMED — Bug 3: `continueAsGuest()` does NOT clear the previous session JWT cookie

`logout()` calls `await api.logout()` → `POST /api/auth/logout` → `res.clearCookie('token')`.
`continueAsGuest()` does **not call `logout()` first**. Consequence:

- If a user was previously signed in and clicks "Continue as Guest", the cookie persists.
- Every subsequent API call with `withCredentials: true` carries the prior customer's JWT.
- On page refresh, `AuthContext` calls `getCurrentUser()` → stale cookie → the customer identity is silently restored, destroying the guest session.

### CONFIRMED — Bug 4: `paymentStatus: "Paid"` orders are not excluded from the lookup

`ACTIVE_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served']` — no payment filter.
An order that is `status: "Pending"` but `paymentStatus: "Paid"` is still matched and mutated.

Additionally at line 122:
```typescript
existingOrder.paymentStatus = paymentStatus || existingOrder.paymentStatus;
```
If the new request sends `paymentStatus: "Pending"`, this **downgrades** an already-paid order back to "Pending".

### CONFIRMED — Bug 5: `tableId` persists in `localStorage` across sessions

```typescript
// session.ts L3-13
export const getCurrentTableId = (): string | null => {
  const params = new URLSearchParams(window.location.search)
  const tableFromUrl = params.get('table') || params.get('tableId')
  if (tableFromUrl) {
    localStorage.setItem(TABLE_STORAGE_KEY, tableFromUrl)
    return tableFromUrl
  }
  return localStorage.getItem(TABLE_STORAGE_KEY)
}
```

Once a table ID is recorded, it persists in `localStorage` indefinitely. A subsequent guest session on the same device inherits the same `tableId`, directly causing the wrong table-order to be targeted.

### CONFIRMED — Bug 6: `refreshActiveOrder()` is table-scoped, not owner-scoped

The `activeOrderStorageKey` is correctly user-scoped (includes `user._id`), but `refreshActiveOrder()` ignores it and fetches by table:

```typescript
// CartContext.tsx L139-166
async function refreshActiveOrder() {
  const tableId = getCurrentTableId()
  if (tableId) {
    const tableOrders = await api.fetchTableOrders(tableId)
    const tableOrder = tableOrders.find((order) => ACTIVE_STATUSES.includes(order.status))
    if (tableOrder) {
      setActiveOrder(tableOrder)  // assigns ANY active table order as "mine"
      localStorage.setItem(activeOrderStorageKey, tableOrder._id)
      return
    }
  }
  ...
}
```

A guest who opens the drawer will have the customer's order set as their `activeOrder`.

### STRONG EVIDENCE — `POST /orders` route has no auth middleware

```typescript
// orderRoutes.ts L15
router.route('/').post(createOrder);  // No authMiddleware attached
```

The endpoint is public. Any caller can supply any `customerId`/`userId` and the server takes it at face value.

### UNCONFIRMED — Whether stale cookie is actually consumed server-side

The order creation route does not use `authMiddleware`, so the stale cookie is sent but ignored on that specific call. However, `getCurrentUser()` (which does use `authMiddleware`) is called on every `AuthContext` mount, making the stale-cookie scenario possible on page refresh.

---

## Payment-State Findings

The existing-order lookup in `createOrder` (lines 101-104) has no `paymentStatus` filter.

An order with `{ status: "Pending", paymentStatus: "Paid" }` **will be selected and mutated**:
- New items appended.
- Quantities of matching items incremented.
- `totalAmount` increased.
- `paymentStatus` may be downgraded if the incoming request sends `paymentStatus: "Pending"`.

Whether a "Paid" order should be immutable is an open business logic question (Q4 below).

---

## Identity Findings

### Guest Identity Mechanism

| Property | Value |
|---|---|
| Server-side guest record | None |
| Cookie for guest | None |
| guestId from server | None |
| sessionStorage use | None |
| localStorage use | Synthetic `_id` stored only in React state; tableId and cart stored in localStorage |
| Persistence across refresh | **None** — guest `_id` is lost on refresh; stale customer cookie may restore customer identity |

### Token / Cookie / Auth State Transitions

| Event | HTTP-only `token` cookie | React `user` state | Behavior on next `getCurrentUser()` |
|---|---|---|---|
| Customer logs in | Set (7-day JWT) | `{ _id: customerId, role: 'customer' }` | Returns customer |
| Customer calls `logout()` | Cleared | `null` | Returns 401 |
| "Continue as Guest" (no prior logout) | **Still set** | `{ _id: 'guest-{ts}', role: 'customer' }` | **Returns original customer** |
| Page refresh as guest (no prior logout) | **Still set** | Attempts `getCurrentUser()` first | Customer identity silently restored |

### localStorage Keys

| Key | Value | When cleared |
|---|---|---|
| `current_table_id` | Table number string | **Never explicitly cleared** |
| `noir_sel_active_order_id:{tableId}:{ownerId}` | Order `_id` | When order becomes inactive |
| `noir_sel_cart` | JSON cart items | When `clearCart()` is called |

---

## Questions for Product Owner

> All questions derive from concrete gaps in the current code. Do not answer from assumptions — the implementation depends on these answers.

### Q1 — Order ownership model at a table

Should one table ever share a single MongoDB order document between multiple people/sessions?

- (a) One order per table, shared by all guests and signed-in customers at that table
- (b) Each person/session gets their own independent order
- (c) One order per signed-in customer + one shared order for all guests at the table
- (d) Something else

### Q2 — Guest independence

Should a guest's order be completely independent of any signed-in customer's order on the same table?

### Q3 — Multiple guests at the same table

If two guests on separate devices are at Table 3, should they:

- (a) Share one guest order
- (b) Each get their own independent order
- (c) Be blocked from ordering if an active signed-in-customer order exists

### Q4 — Paid order mutability

A "Paid" order was mutated by this bug. What is the intended behavior for an order with `paymentStatus: "Paid"`?

- (a) Completely immutable — no new items, no re-opening, for anyone
- (b) Re-openable by the same customer to add more items
- (c) Re-openable by staff only
- (d) A new separate order is automatically created when someone tries to add items at that table

### Q5 — What constitutes a "finalized" order that must never be merged into?

- When `paymentStatus = "Paid"`?
- When `status = "Completed"` or `"Cancelled"`?
- Both?
- Another condition?

### Q6 — Same-session re-order merging

The same signed-in customer at the same table orders Pasta, then opens the drawer and orders Pasta again. Should the quantity increment in the existing order, or should a new order be created?

### Q7 — Cross-session re-order (same customer, different visit)

A signed-in customer's order is paid and marked complete. They return to the same table later. Should a new order be created, or should the previous order be reopened?

### Q8 — Guest identity persistence

Should a guest's session survive:

- (a) Only the current tab (lost on refresh)
- (b) Until the browser tab is closed (sessionStorage)
- (c) Across browser restarts (localStorage)
- (d) Server-side, via a generated anonymous token

### Q9 — After explicit logout, then "Continue as Guest"

If a signed-in customer logs out properly and then clicks "Continue as Guest":

- Should their previous (now-closed) order be visible to the guest?
- Should the guest be able to add items to that order?
- Should the previous order be completely hidden and the guest starts fresh?

### Q10 — Two signed-in customers at the same table

Customer A and Customer B both log in with their own accounts and sit at Table 3. Should they:

- (a) Share one order
- (b) Each have a fully independent order
- (c) See each other's orders but keep separate ownership
- (d) Something else

### Q11 — Table ID lifecycle

`tableId` currently persists in `localStorage` indefinitely. Should it be cleared:

- (a) Never (current behavior)
- (b) When the order is marked completed
- (c) On logout
- (d) After a time-based expiry

---

## User Answers

*(Answered 2026-07-14)*

**Q1:** (a) — One order per table, shared by everyone at that table

**Q2:** Yes — guest's order must be completely independent of signed-in customer's order

**Q3:** (a) — Multiple guests share one guest order per table

**Q4:** (c) — Paid orders can only be re-opened by staff

**Q5:** Both conditions must be true — `paymentStatus = "Paid"` AND `status = "Completed" or "Cancelled"`

**Q6:** Yes — increment quantity in the existing order (same customer, same table, same session)

**Q7:** Create a new order; the paid/completed old order stays in the DB for staff history

**Q8:** (b) — Guest session lives until the browser tab/window is closed (sessionStorage)

**Q9:** Completely fresh — guest has no visibility into or access to any prior customer order

**Q10:** (c) — Two signed-in customers at the same table see each other's orders but they contribute to one shared table order (their IDs tracked in `customerIds`)

**Q11:** (a) — tableId persists in localStorage indefinitely (no change needed)

---

## Implementation Status

> **IN PROGRESS — BUSINESS LOGIC CONFIRMED, IMPLEMENTATION PLAN BEING CREATED**

---

## Files Investigated

### Backend

| File | Purpose |
|---|---|
| `smart_dine_in/src/app.ts` | Express setup, routes, CORS |
| `smart_dine_in/src/controllers/orderController.ts` | **PRIMARY BUG LOCATION** — `createOrder`, lookup query |
| `smart_dine_in/src/controllers/authController.ts` | Login, logout, getCurrentUser, cookie management |
| `smart_dine_in/src/models/Order.ts` | Order schema — no ownership-enforcement constraints |
| `smart_dine_in/src/models/Customer.ts` | Customer schema — `isGuest` boolean exists but unused in ordering |
| `smart_dine_in/src/routes/orderRoutes.ts` | Confirms no auth middleware on `POST /orders` |
| `smart_dine_in/src/routes/authRoutes.ts` | Auth routes |
| `smart_dine_in/src/middlewares/authMiddleware.ts` | JWT verification — not used on order routes |

### Frontend

| File | Purpose |
|---|---|
| `client/src/App.tsx` | Route structure, provider tree |
| `client/src/context/AuthContext.tsx` | Guest identity creation, login, logout |
| `client/src/context/CartContext.tsx` | `submitOrder`, `refreshActiveOrder`, localStorage keys |
| `client/src/utils/session.ts` | `getCurrentTableId()` — localStorage persistence |
| `client/src/services/api.ts` | Axios client, `createOrder`, `fetchTableOrders` |
| `client/src/components/OrderDrawer/OrderDrawer.tsx` | UI that calls `submitOrder` |
| `client/src/components/Navbar/Navbar.tsx` | Logout button |
| `client/src/pages/Auth/Login.tsx` | "Continue as Guest" flow |
| `client/src/types/index.ts` | `AuthUser`, `OrderRecord`, `CreateOrderPayload` types |

---

## Technical Summary for Next Agent

The bug is fully traced. Implementation requires answers to Q1–Q11 first. Once answered, changes are needed in at minimum:

1. **`orderController.ts` lines 101–104** — add ownership/identity filter to the existing-order lookup.
2. **`AuthContext.tsx` lines 68–79 (`continueAsGuest`)** — either call `logout()` first, or issue a server-side guest token.
3. **`CartContext.tsx` lines 139–166 (`refreshActiveOrder`)** — filter by ownership, not just table.
4. **Possibly `session.ts`** — define when `tableId` should be cleared.
5. **Possibly a new guest session mechanism** — if guests need to be independently identified across requests.

Do not implement any of the above until Q1–Q11 are answered by the product owner.
