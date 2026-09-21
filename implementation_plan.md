# Triveni Transports — Packers & Movers Digital Platform
## 7-Part Implementation Plan

> Built on: **Express/TypeScript** backend · **PostgreSQL + Prisma** · **Redis + BullMQ** · **Next.js** web · **React Native/Expo** mobile · **Socket.io** real-time

---

## Overview

The product is a full-stack digital platform for **Triveni Transports Packers & Movers** with three user types:

| Role | Interface |
|------|-----------|
| **Customer** | Next.js web + React Native (Expo) app |
| **Vendor / Driver** | React Native (Expo) app |
| **Super Admin** | Next.js web dashboard |

The system enables end-to-end booking lifecycle: instant estimates → itemized quotes → payment → job dispatch → on-site revisions → invoice.

---

## Monorepo Structure (pnpm + Turborepo)

```
triveni-transports/
├── apps/
│   ├── web/                  # Next.js — Customer web + Super Admin dashboard
│   ├── mobile-customer/      # Expo — Customer mobile app
│   ├── mobile-vendor/        # Expo — Vendor mobile app
│   └── backend/              # Express/TypeScript API
│       └── prisma/           # Schema + migrations
├── packages/
│   ├── shared-types/         # API types (request/response)
│   ├── shared-validation/    # Zod schemas (shared client + server)
│   ├── pricing-preview/      # Layer-1 estimate logic
│   └── config/               # Shared ESLint/TS config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Open Decisions Resolved Before Build

> [!IMPORTANT]
> The following TBD items from the tech spec (§13) need to be resolved before or during Part 3:

| Decision | Recommendation |
|----------|----------------|
| Geocoding provider | **Google Maps Platform** (best India coverage, distance matrix API) |
| WhatsApp/SMS provider | **MSG91** (India-first, best deliverability, lower cost) |
| Object storage | **Cloudinary** (for vendor/vehicle trust photos — Phase 1b) |
| Backend deployment | **Start combined** API + worker; split only under load |
| JWT TTLs | Access: **15 min**, Refresh: **30 days**, OTP: **10 min / 3 attempts** |
| Admin app | **Route-group inside web app** (`/admin` route group in Next.js) |

---

## Part 1 — Schema Design & Database Configuration

### Goal
Define the complete PostgreSQL schema via Prisma, configure the database connection, set up Redis, and establish the monorepo skeleton.

### Deliverables

#### [NEW] `triveni-transports/` (monorepo root)
Initialize pnpm workspace + Turborepo, install shared dev tooling (TypeScript, ESLint, Prettier).

---

#### [NEW] `apps/backend/prisma/schema.prisma`
Complete Prisma schema implementing all entities from Tech Spec §4:

**Identity & Auth (§4.1)**
- `Customer` — id, name, phone (unique), email?, saved_addresses (JSONB), push_token, created_at
- `Vendor` — id, name, phone (unique), status (active/suspended), service_areas (JSONB), push_token, created_at
- `AdminUser` — id, name, phone (unique), created_at
- `OtpChallenge` — id, phone, otp_hash, purpose (enum), attempts, expires_at, verified_at?, created_at; **index on (phone, expires_at)**
- `Session` — id, user_id, user_role (enum: customer/vendor/admin), refresh_token_hash, expires_at, revoked_at?, created_at

**Fleet & Pricing Config (§4.2)**
- `Vehicle` — id, vendor_id (FK), type, capacity_cft (Decimal), registration_number (unique), permit_expiry, fitness_cert_expiry, active
- `LocationZone` — id, name, zone_type (enum: core/extended), pincodes (JSONB), created_by, created_at
- `ZoneRate` — id, from_zone_id?, to_zone_id?, distance_band?, rate (Decimal 10,2), effective_from, effective_to?, created_by; **index on (from_zone_id, to_zone_id, effective_to)**
- `Item` — id, name, category, default_cft (Decimal), default_weight_kg (Decimal), base_handling_rate (Decimal 10,2), active, effective_from, effective_to?, created_by
- `PricingRule` — id, rule_type (enum: packing_tier_multiplier/labour_threshold/surcharge/addon), config_key, value (Decimal), effective_from, effective_to?, created_by
- `PricingAuditLog` — id, entity_type, entity_id, field_changed, old_value, new_value, changed_by (FK→AdminUser), reason?, changed_at; **append-only, no delete**

**Booking & Transactions (§4.3)**
- `Booking` — id, customer_id (FK), vendor_id? (FK), vehicle_id? (FK), status (enum: full FSM from PRD §11), pickup_address, drop_address, pickup_zone_id (FK), drop_zone_id (FK), distance_km (Decimal), configuration_type, floor_number, lift_available, scheduled_date, scheduled_slot, base_quote_amount (Decimal 10,2), final_amount (Decimal 10,2), **pricing_snapshot (JSONB)** — critical for non-retroactive pricing guarantee, created_at
- `BookingItem` — id, booking_id (FK), item_id? (FK), custom_name?, quantity, packing_tier (enum: lite/standard/premium), unit_price_applied (Decimal 10,2), line_total (Decimal 10,2), is_revision (default false)
- `BookingStatusHistory` — id, booking_id (FK), from_state, to_state, actor_id, actor_role, timestamp — **new addition** for full lifecycle reconstruction per §5.5
- `Revision` — id, booking_id (FK), description, amount_delta (Decimal 10,2), logged_by (FK→Vendor), status (enum: pending/approved/declined), approved_by? (FK→Customer), approved_at?, created_at
- `Payment` — id, booking_id (FK), razorpay_order_id, razorpay_payment_id? (unique), amount (Decimal 10,2), status (enum: created/captured/failed/refunded), type (enum: advance/final/refund), idempotency_key (unique), created_at
- `Notification` — id, booking_id? (FK), recipient_id, recipient_role (enum), channel (enum: sms/whatsapp/push), template, payload (JSONB), status (enum: queued/sent/failed), attempts (default 0), sent_at?, created_at

> [!NOTE]
> Money fields use `Decimal` (maps to `numeric(10,2)`) — never `Float`. All primary keys are UUIDs. Versioned tables use `effective_from`/`effective_to` (open-ended = current).

#### [NEW] `apps/backend/prisma/seed.ts`
Seed script: one AdminUser row, one Vendor row, three Vehicle rows, sample LocationZones and ZoneRates for Triveni's operating area.

#### [NEW] `apps/backend/src/config/env.ts`
Zod-validated environment loader — validates all 15 env vars at startup (fail-fast, no mid-request surprises per §11).

#### [NEW] `packages/shared-types/`
TypeScript type exports matching every Prisma model (auto-generated via `prisma-client-js` + hand-tuned API request/response shapes).

### Tech Choices
- PostgreSQL (Supabase or Neon for managed hosting)
- Redis (Upstash with keyspace notifications enabled — critical for §5.4 slot-lock expiry)
- Prisma ORM with TypeScript

### Verification After Part 1
```bash
pnpm install          # workspace resolves
prisma db push        # schema applied to dev DB
prisma db seed        # seed data inserted
prisma studio         # visual check of all tables
```
✅ All 16 tables created, relationships intact, seed data present, env validation passes.

---

## Part 2 — Backend (Express) APIs & Authentication

### Goal
Build the complete Express/TypeScript API server with all routes from Tech Spec §6, the booking state machine (§5.5), quote engine (§5.1–5.2), availability lock logic (§5.4), and revision flow (§5.6).

### Deliverables

#### [NEW] `apps/backend/src/server.ts`
Bootstrap: Express app + Socket.io attachment + BullMQ worker init + env validation + graceful shutdown.

#### [NEW] `apps/backend/src/modules/auth/`
- OTP request: rate-limited per phone (5 req/15 min), hashed OTP stored in `OtpChallenge`, dispatches SMS via notification queue
- OTP verify: bcrypt compare, 3-attempt lockout, creates Customer/Vendor on first login, issues JWT access (15 min) + refresh (30 days) token pair
- Refresh: rotate refresh token (old one revoked in `Session`), issue new pair
- Logout: revoke `Session.refresh_token_hash`

**Routes:** `POST /api/v1/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`

#### [NEW] `apps/backend/src/middleware/`
- `authGuard.ts` — verifies Bearer JWT, attaches `req.user = {id, role}`
- `rbacGuard.ts` — `requireRole(...roles)` factory, checks `req.user.role`
- `rateLimiter.ts` — Redis-backed rate limiter (ioredis + rate-limiter-flexible)
- `errorHandler.ts` — standard `{ error: { code, message, details? } }` format

#### [NEW] `apps/backend/src/modules/pricing/`
Implements §5.1 + §5.2:
- `instantEstimate(propertyType, pickup, drop)` → Layer-1 range from Redis cache
- `itemizedQuote(checklistInput)` → full 8-step Layer-2 calculation
  - Step 1: Zone charge lookup with distance-band fallback
  - Step 2-3: Goods subtotal per item × packing tier multiplier
  - Step 4: Labour charge (extra laborers formula)
  - Step 5: Surcharges (floor+no-lift, monsoon window, parking)
  - Step 6: Add-ons
  - Step 7: Total
  - Step 8: **Build pricing_snapshot JSONB** with all ZoneRate/Item/PricingRule IDs and values used

**Routes:** `POST /api/v1/quotes/instant-estimate` (Public), `POST /api/v1/quotes/itemized` (Customer)

#### [NEW] `apps/backend/src/modules/booking/`
- State machine with explicit allowed-transitions map (§5.5); every transition writes `BookingStatusHistory`
- `POST /api/v1/bookings/:id/hold` — Redis SETNX lock with 10-min TTL, broadcasts `slot_locked`
- `POST /api/v1/bookings/:id/confirm` — DB transaction: confirm Booking + delete Redis lock + broadcast `slot_confirmed`
- `POST /api/v1/bookings/:id/cancel` — policy check, state transition
- `GET /api/v1/bookings` — customer's own bookings (paginated)
- `GET /api/v1/bookings/:id` — role-scoped detail (customer sees own, vendor sees assigned, admin sees all)
- `GET /api/v1/bookings/:id/invoice` — serve pre-generated PDF from storage

#### [NEW] `apps/backend/src/modules/vendor-assign/`
Phase 1 implementation of `assignVendor(booking)`:
- Always returns the single configured vendor
- Picks smallest Vehicle with capacity_cft ≥ booking total CFT
- Flags second-trip line item if no vehicle is big enough

**Routes:** `GET /api/v1/vendor/jobs?date=`, `PATCH /api/v1/vendor/jobs/:id/status`, `POST /api/v1/vendor/bookings/manual`

#### [NEW] `apps/backend/src/modules/revisions/`
Implements §5.6 on-site revision flow:
- `POST /api/v1/bookings/:id/revisions` (Vendor) — runs §5.2 steps 2-3 on new items only, creates Revision row, moves booking to `REVISION_PENDING`
- `POST /api/v1/bookings/:id/revisions/:revisionId/approve` (Customer) — recalculates final_amount, returns to `IN_PROGRESS`
- `POST /api/v1/bookings/:id/revisions/:revisionId/decline` (Customer) — moves to `DISPUTED`
- `GET /api/v1/bookings/:id/revisions` — full revision history

#### [NEW] `apps/backend/src/modules/admin/`
Admin-only routes (§6.7, §6.8):
- CRUD for Zones, ZoneRates (versioned — new effective_from row, never in-place edit), Items, PricingRules
- Every write appends to `PricingAuditLog`
- `GET /admin/bookings` with filters (status, date range, vendor)
- `GET /admin/revisions?status=disputed` — dispute queue
- `GET /admin/reports/metrics` — dashboard stats

#### [NEW] `apps/backend/src/modules/availability/`
- Redis keyspace notification listener — auto-broadcasts `slot_released` on TTL expiry
- `GET /api/v1/availability/:vehicleId?date=` — REST snapshot for calendar init

### Booking State Machine (enforced server-side only)

```
REQUESTED → QUOTED → CONFIRMED → ASSIGNED → EN_ROUTE → 
ARRIVED → IN_PROGRESS ⇆ REVISION_PENDING → COMPLETED
         ↓           ↓
      CANCELLED    DISPUTED
```

### Verification After Part 2
```bash
# Run backend dev server
pnpm --filter backend dev

# Test with Postman/Thunder Client:
# POST /auth/otp/request → OTP logged (dev mode: console)
# POST /auth/otp/verify  → access + refresh tokens
# POST /quotes/instant-estimate → range estimate
# POST /quotes/itemized  → full breakdown
# POST /bookings/:id/hold → Redis lock set
```
✅ All 30+ endpoints responding, auth flow complete, state machine rejects invalid transitions with HTTP 409.

---

## Part 3 — External Service Integrations

### Goal
Wire up all four external services: Razorpay (payments), Google Maps (geocoding/distance), MSG91 (WhatsApp/SMS), and Expo Push (mobile notifications).

### Deliverables

#### [NEW] `apps/backend/src/modules/payments/`
**Razorpay Integration:**
- `POST /api/v1/payments/create-order` — server-side Razorpay order creation with idempotency key
- `POST /api/v1/webhooks/razorpay` — **signature-verified webhook** (HMAC-SHA256 on raw body); idempotent via `razorpay_payment_id`; only source of truth for "paid" status
- On capture: enqueue `booking-confirm` job → state transition + notification dispatch
- On failure: enqueue `payment-webhook-retry` job (§8)

> [!CAUTION]
> The webhook handler must verify `razorpay-signature` header BEFORE processing. Never trust client-side redirect callbacks for payment confirmation.

#### [NEW] `apps/backend/src/modules/geocoding/`
**Google Maps Platform:**
- Address → lat/lng geocoding with **per-address Redis cache** (reduces API cost)
- Zone matching: pincode lookup → fallback to point-in-polygon against GeoJSON boundaries
- Distance Matrix API call for driving distance between pickup and drop
- Hard fail (no guessing) on provider timeout — returns error for client retry per §5.3

#### [NEW] `apps/backend/src/modules/notifications/` (provider layer)
**MSG91 WhatsApp Business API + SMS:**
- Template-based WhatsApp message dispatch (booking confirmed, revision pending, payment receipt, etc.)
- Automatic SMS fallback on WhatsApp delivery failure (same MSG91 account)
- **Expo Push Notification Service:** token stored at login, batch push via `expo-server-sdk`

**Notification Templates (minimum set):**
| Template Key | Channel | Recipient |
|---|---|---|
| `booking_confirmed` | WhatsApp + Push | Customer |
| `booking_assigned` | WhatsApp + Push | Customer |
| `revision_pending` | WhatsApp + Push | Customer |
| `revision_resolved` | Push | Vendor |
| `job_assigned` | WhatsApp + Push | Vendor |
| `payment_captured` | WhatsApp | Customer |
| `booking_completed` | WhatsApp | Customer |

#### [NEW] `apps/backend/src/jobs/`
**BullMQ Queue Processors (§8):**
- `notifications` queue — renders template + dispatches via MSG91/Expo; retry 3× exponential backoff → dead-letter
- `invoice-generation` queue — triggered on `COMPLETED` transition; generates PDF using `pdfkit`; stores to Cloudinary/S3
- `payment-webhook-retry` queue — re-processes raw webhook payload with signature; idempotency prevents double-processing
- `reconciliation-layer1-refresh` — nightly cron; recomputes Layer-1 estimate reference table from real Layer-2 outcomes; writes to Redis cache

#### [NEW] `apps/backend/src/websocket/`
**Socket.io Gateway (§7):**
- JWT verification at handshake
- Room subscription: `availability:{vehicleId}:{date}` and `booking:{bookingId}`
- Role-gated: customers own-booking only, vendor assigned jobs, admin all
- Redis keyspace `__keyevent@0__:expired` → `slot_released` broadcast
- Events: `slot_locked`, `slot_released`, `slot_confirmed`, `booking_status_changed`, `revision_logged`, `revision_resolved`

### Verification After Part 3
```bash
# Test Razorpay with test credentials:
POST /payments/create-order → Razorpay order_id returned
# Simulate webhook with correct signature → booking confirmed

# Test geocoding:
POST /quotes/instant-estimate with Pune addresses → zone pair resolved

# Test notification:
# Booking confirmation → check WhatsApp delivery in MSG91 dashboard
# Expo push token registered → push received on device

# Test WebSocket:
# Connect with JWT, subscribe_availability → slot_locked event received on lock
```
✅ End-to-end booking flow works: quote → lock → pay (webhook) → confirm → push notification sent → invoice generated.

---

## Part 4 — Email & Notification Configuration

### Goal
Configure all notification templates, delivery rules, email (transactional), and the admin notification visibility layer.

### Deliverables

#### [MODIFY] `apps/backend/src/modules/notifications/`
**Full template library** in Handlebars/Mustache:
- WhatsApp templates (must be pre-approved by Meta via MSG91)
- SMS templates (DLT-registered for India)
- Push notification payloads with deep-link data for in-app navigation

**Delivery Channel Priority Logic:**
```
Push (if push_token exists AND app installed)
  → WhatsApp (primary, if WhatsApp opt-in)
    → SMS (fallback, always)
```

#### [NEW] `apps/backend/src/modules/email/`
**Email via Resend or SendGrid** (not in original spec — added for completeness):
- Booking confirmation email with itemized quote PDF attachment
- Invoice email on job completion
- Admin alerts: failed notifications, payment failures, dispute raised
- HTML templates using `react-email` or MJML

> [!NOTE]
> Email is a pragmatic addition to the spec — many customers will want a paper trail in their inbox. Uses Resend (simple API, generous free tier).

#### [NEW] Notification Preference Management
- `PATCH /api/v1/customers/me/preferences` — opt-in/out of WhatsApp, push
- Customer and vendor can manage their preferred channel; SMS always remains as final fallback (cannot be opted out for critical booking events)

#### [NEW] Admin Notification Visibility
- `GET /api/v1/admin/notifications` — list all notification records with status (queued/sent/failed)
- `POST /api/v1/admin/notifications/:id/retry` — manually retry failed notifications
- Dead-letter queue visibility in admin dashboard

#### Template Approval Workflow (India WhatsApp)
WhatsApp Business templates must be submitted to Meta for approval before going live. Pre-register these template names with MSG91:
- `booking_confirmed_v1`
- `revision_pending_v1`
- `payment_receipt_v1`
- `job_assignment_v1`

> [!WARNING]
> WhatsApp template approval can take 24–72 hours. Submit templates **before** starting Part 5 so they're ready by launch.

### Verification After Part 4
```bash
# Trigger a full booking flow in staging:
# 1. Customer gets booking_confirmed WhatsApp
# 2. Vendor gets job_assigned push notification
# 3. Admin sees all notification records in dashboard
# 4. Simulate MSG91 failure → SMS fallback fires
# 5. Check email inbox for booking confirmation + PDF
```
✅ All 7 notification templates delivered on correct channels; admin can see and retry failed notifications.

---

## Part 5 — Frontend: Customer & Admin Web (Next.js)

### Goal
Build the Next.js web application for customers (quote, booking, payment, tracking) and the super admin dashboard (pricing management, bookings, disputes, metrics).

### Tech Stack
- Next.js 14 App Router
- TypeScript
- Vanilla CSS (as per project standards) with CSS variables for design tokens
- `shared-types` and `shared-validation` packages
- `pricing-preview` package for client-side quote preview

### App Structure

```
apps/web/app/
├── (customer)/              # Public + authenticated customer routes
│   ├── page.tsx             # Landing page with instant estimate widget
│   ├── quote/page.tsx       # Itemized checklist → full quote
│   ├── booking/
│   │   ├── [id]/page.tsx    # Booking detail + real-time status
│   │   └── [id]/pay/page.tsx # Payment flow (Razorpay checkout)
│   ├── bookings/page.tsx    # My bookings list
│   └── trust/page.tsx       # Vendor/vehicle trust page (Phase 1b)
│
├── (admin)/                 # Admin-only routes (RBAC guarded)
│   ├── dashboard/page.tsx   # Metrics overview
│   ├── bookings/page.tsx    # All bookings with filters
│   ├── disputes/page.tsx    # Disputed revisions queue
│   ├── pricing/
│   │   ├── zones/page.tsx
│   │   ├── zone-rates/page.tsx
│   │   ├── items/page.tsx
│   │   └── rules/page.tsx
│   ├── audit-log/page.tsx
│   └── notifications/page.tsx
│
└── api/                     # Thin BFF routes only
```

### Key Pages & Components

#### Customer Landing (`/`)
- **Instant Estimate Widget** — property type selector, pickup/drop address inputs with autocomplete (Google Maps JS API), `pricing-preview` package for client-side range display
- Hero section with Triveni Transports branding
- How it works section
- Testimonials / trust signals

#### Quote Flow (`/quote`)
- Multi-step form: location details → inventory checklist (item catalog from `/catalog/items`) → packing tier selection → add-ons
- Real-time running total using `pricing-preview` (Layer-1 approximation)
- On submit: `POST /quotes/itemized` → redirect to booking payment page with locked quote

#### Booking Detail (`/booking/[id]`)
- Real-time status tracker (Socket.io `booking_status_changed` events)
- Itemized breakdown with pricing snapshot
- Revision pending UI — customer can approve/decline from browser
- Download invoice button (post-completion)

#### Payment Flow (`/booking/[id]/pay`)
- Razorpay checkout integration (Razorpay.js)
- Advance payment collection (% defined by admin config)
- Clear display of remaining balance due at completion

#### Admin Dashboard (`/admin/dashboard`)
- KPI cards: bookings today/week/month, revenue, avg quote value
- Booking status funnel chart
- Recent bookings feed with quick-action links

#### Admin Pricing Pages
- Zone rate management with versioning (effective date picker)
- Item catalog CRUD with rate history timeline
- Pricing rule sliders (packing multipliers, labour thresholds, surcharges)
- Audit log table (read-only, append-only view)

### Middleware & Auth
- `apps/web/middleware.ts` — route-group auth guard:
  - `/(customer)/*` — redirect to login if no session
  - `/(admin)/*` — redirect if not admin role

### Verification After Part 5
```bash
pnpm --filter web dev

# Walk through full customer flow:
# / → enter addresses → see instant estimate
# /quote → fill inventory → see itemized quote
# /booking/[id]/pay → complete Razorpay test payment
# /booking/[id] → see real-time status update when vendor updates job

# Admin flow:
# /admin/dashboard → metrics visible
# /admin/pricing/zone-rates → create new rate (effective next week)
# /admin/bookings → filter by status=DISPUTED → resolve dispute
```
✅ Full customer booking journey works end-to-end on web; admin can manage all pricing config with audit trail.

---

## Part 6 — Mobile Apps (React Native / Expo)

### Goal
Build two separate Expo apps: **Customer** (booking, tracking, revision approval) and **Vendor** (job calendar, status updates, on-site revisions).

### Shared Setup
- Expo SDK 51+, Expo Router (file-based routing)
- `shared-types` and `shared-validation` from monorepo
- `expo-notifications` for push token registration at login
- Socket.io client for real-time updates

---

### 6A — Customer Mobile App (`apps/mobile-customer/`)

```
app/
├── (auth)/
│   ├── login.tsx            # Phone input → OTP screen
│   └── otp.tsx              # OTP verify → home
├── (tabs)/
│   ├── home.tsx             # Quick quote entry + active booking card
│   ├── bookings.tsx         # My bookings list
│   └── profile.tsx          # Saved addresses, notification preferences
├── booking/
│   ├── quote.tsx            # Inventory checklist (item catalog)
│   ├── [id]/index.tsx       # Booking detail + live status tracker
│   ├── [id]/pay.tsx         # Razorpay checkout (WebView or SDK)
│   └── [id]/revision.tsx    # Approve/decline revision with cost delta
└── availability.tsx         # Vehicle/date availability calendar
```

**Key Features:**
- OTP login with auto-read SMS (Android)
- Instant estimate on home screen (offline-capable with cached rates)
- Live booking status with push notifications deeplink
- In-app revision approval (approve/decline with amount display)
- Booking history with invoice download (PDF viewer)

---

### 6B — Vendor Mobile App (`apps/mobile-vendor/`)

```
app/
├── (auth)/
│   ├── login.tsx            # Phone OTP (vendor role)
│   └── otp.tsx
├── (tabs)/
│   ├── calendar.tsx         # Job calendar grouped by vehicle + date
│   ├── today.tsx            # Today's active jobs
│   └── history.tsx          # Past jobs
├── job/
│   ├── [id]/index.tsx       # Job detail (customer info, items, pickup/drop)
│   ├── [id]/status.tsx      # Update job status (en_route/arrived/in_progress/complete)
│   ├── [id]/revision.tsx    # Add item screen → on-site revision flow
│   └── [id]/manual.tsx      # Create manual/phone-in booking
└── offline/
    └── queue.tsx            # View pending offline actions (§PRD 12)
```

**Key Features:**
- Offline action queue (PRD §12) — status updates queued locally when no signal, synced on reconnect
- Add-item screen reads live Item catalog, auto-calculates revision amount
- Manual booking creation (phone/walk-in) goes through same lock→confirm path as app bookings
- Push notifications for new job assignments

### Offline Support (Vendor App Only)
Per PRD §12, the vendor app must handle poor connectivity:
- Status updates stored in local SQLite (via `expo-sqlite`) when offline
- Sync queue processes on reconnect (network state listener)
- Conflict resolution: server state wins (vendor's queued update applies only if booking is still in expected state)

### Expo EAS Configuration
- EAS Build for iOS + Android
- OTA channel for JS-only fixes (avoids App Store review for minor patches)
- Separate production and staging build profiles

### Verification After Part 6
```bash
# Run on simulator:
npx expo start --filter mobile-customer
npx expo start --filter mobile-vendor

# Test customer app:
# Login → OTP → quote flow → payment → live status on booking detail screen

# Test vendor app:
# Login → view today's jobs → update status to EN_ROUTE → customer app updates live
# Add item (revision) → customer gets push notification → customer approves → 
#   vendor sees revision_resolved → vendor marks COMPLETED
# Turn off wifi → update status → turn on wifi → sync happens
```
✅ Both apps functional; vendor offline queue syncs correctly; real-time events flow between vendor and customer.

---

## Part 7 — Super Admin Dashboard

### Goal
Build a comprehensive super admin dashboard within the Next.js web app (`/admin` route group) providing full operational visibility and control.

> [!NOTE]
> The admin dashboard is a **route group inside the web app** (as decided above), not a separate deployable. Auth guard ensures only `role=admin` JWT can access these routes.

### Dashboard Sections

#### 7.1 — Overview / Metrics (`/admin/dashboard`)
- **KPI Cards:** Total bookings, Revenue (today/week/month/custom range), Average booking value, Cancellation rate, Dispute rate
- **Booking Status Funnel:** REQUESTED → QUOTED → CONFIRMED → ... → COMPLETED
- **Revenue Chart:** Daily/weekly bar chart
- **Live Activity Feed:** Real-time recent booking events (Socket.io admin room)
- Data source: `GET /admin/reports/metrics`

#### 7.2 — Booking Management (`/admin/bookings`)
- **Full bookings table** with filters: status, date range, vehicle, customer search
- **Quick actions per row:** View detail, Force status transition, Assign vehicle
- **Booking detail modal:** Full pricing breakdown, status history timeline, all revisions
- Dispute queue tab: `GET /admin/revisions?status=disputed` — manually resolve or escalate

#### 7.3 — Pricing Management (`/admin/pricing/`)
- **Zone Manager:** CRUD for LocationZone — name, type (core/extended), pincode list
- **Zone Rate Versioning:** Add new rate with effective_from date (never edits in place); rate history timeline per zone pair; visual rate calendar
- **Item Catalog:** CRUD with versioning; bulk import via CSV; category grouping
- **Pricing Rules:** Visual controls for packing tier multipliers (lite/standard/premium), labour thresholds, surcharge toggles (monsoon window, floor surcharge, parking), add-on rates
- Every save auto-appends to `PricingAuditLog`

#### 7.4 — Pricing Audit Log (`/admin/audit-log`)
- **Append-only read-only table:** entity_type, field changed, old → new value, changed_by, reason, timestamp
- Filters: date range, entity type, admin user
- Export to CSV for compliance

#### 7.5 — Fleet Management (`/admin/fleet`)
> [!NOTE]
> Addition to spec — needed for operational management.
- Vehicle list with permit_expiry and fitness_cert_expiry status badges (red if within 30 days)
- Availability calendar per vehicle (admin overlay view)
- Add/edit/deactivate vehicles

#### 7.6 — Vendor Management (`/admin/vendors`)
- Vendor profile view (service areas, status: active/suspended)
- Suspend/reactivate vendor
- View vendor's job history and performance

#### 7.7 — Notifications (`/admin/notifications`)
- All notification records: channel, template, status (queued/sent/failed), attempts, sent_at
- Retry failed notifications manually
- Dead-letter queue view
- WhatsApp template status (approved/pending)

#### 7.8 — Customer Management (`/admin/customers`)
- Customer list with search by name/phone
- Customer detail: booking history, saved addresses
- Manual booking creation on behalf of customer (walk-in support)

### Design System
The admin dashboard uses a consistent design language:
- Dark navy sidebar navigation
- Status badge components matching booking state machine states
- Data tables with sortable columns and pagination
- Toast notifications for action confirmations
- Responsive (usable on iPad for on-site management)

### Verification After Part 7
```bash
# Login as admin, visit /admin/dashboard
# → KPI cards show real booking data
# → Create a pricing rule change → verify PricingAuditLog entry created
# → View booking in DISPUTED status → admin resolves manually
# → Check fleet management → vehicle permit expiry warning visible
# → Retry a failed notification → notification marked sent
```
✅ Admin has full operational visibility and control; pricing audit trail is complete and read-only.

---

## Implementation Timeline Summary

| Part | Focus | Estimated Effort |
|------|-------|-----------------|
| **1** | Schema Design & DB Config | 3–4 days |
| **2** | Backend APIs & Authentication | 7–10 days |
| **3** | External Service Integrations | 4–5 days |
| **4** | Email & Notification Configuration | 2–3 days |
| **5** | Frontend Web (Next.js) | 8–12 days |
| **6** | Mobile Apps (React Native/Expo) | 10–14 days |
| **7** | Super Admin Dashboard | 5–7 days |
| | **Total** | **~6–9 weeks** |

## Verification at Each Milestone

Each part ends with a **working vertical slice** you can demo:
1. ✅ DB schema deployed, seed data visible in Prisma Studio
2. ✅ Full booking lifecycle via API (Postman) — no double-booking possible
3. ✅ Payment webhook → booking confirmed → push notification delivered
4. ✅ All 7 notification templates sent on correct channels with SMS fallback
5. ✅ Customer can book on web, admin can manage pricing
6. ✅ Vendor can update job status on mobile → customer sees it live
7. ✅ Admin has full dashboard with metrics, disputes, audit log

---

## Key Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Double-booking | Redis SETNX lock + PostgreSQL transaction — only one path to confirm |
| Rate retroactivity | `pricing_snapshot` JSONB on every booking — admin edits never touch past bookings |
| Payment fraud | Webhook signature verification + idempotency key — client redirects never trusted |
| WhatsApp template rejection | Submit templates to Meta 72h before needed; SMS fallback always works |
| Vendor offline | Local SQLite queue with server-wins conflict resolution |
| OTP spam abuse | Rate limiting per phone/IP (5 requests per 15 min) + attempt lockout |
