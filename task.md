# Triveni Transports — Build Task Tracker

## Part 1 — Schema Design & DB Config
- [x] Initialize monorepo (pnpm workspaces + Turborepo)
- [x] Create root package.json, pnpm-workspace.yaml, turbo.json
- [x] Create shared tsconfig base
- [x] Create packages/shared-types
- [x] Create packages/shared-validation
- [x] Create packages/pricing-preview
- [x] Create packages/config
- [x] Scaffold apps/backend (Express skeleton)
- [x] Write Prisma schema (all 17 models)
- [x] Write env.ts with Zod validation
- [x] Write prisma/seed.ts
- [x] Prisma client generated (prisma generate ✅)
- [x] Create apps/backend/.env

## Part 2 — Backend APIs & Auth
- [x] Express server bootstrap (middlewares, dummy routes)
- [x] Implement OTP Auth module (request, verify, JWT, MSG91, refresh, logout)
- [x] Middleware (authGuard, rbacGuard, rateLimiter, errorHandler)
- [ ] Pricing module (instantEstimate, itemizedQuote)
- [ ] Booking module (state machine, CRUD, hold/confirm)
- [ ] Vendor-assign module
- [ ] Revisions module
- [ ] Admin module (pricing CRUD, operations)
- [ ] Availability module

## Part 3 — External Service Integrations
- [ ] Razorpay (order creation + webhook)
- [ ] Google Maps (geocoding + distance)
- [ ] MSG91 (WhatsApp + SMS)
- [ ] Expo Push
- [ ] BullMQ jobs
- [ ] Socket.io gateway

## Part 4 — Email & Notifications
- [ ] Notification template library
- [ ] Channel priority logic
- [ ] Email via Resend
- [ ] Notification preferences API
- [ ] Admin notification visibility

## Part 5 — Frontend Web (Next.js)
- [x] Design system / CSS tokens
- [x] Customer landing + instant estimate
- [x] Quote flow
- [x] Booking detail + real-time status
- [x] Payment flow
- [x] Admin dashboard
- [x] Admin pricing pages
- [x] Admin audit log

## Part 6 — Mobile Apps
- [x] Customer app — auth flow
- [x] Customer app — quote + booking
- [x] Customer app — revision approval
- [x] Vendor app — auth flow
- [x] Vendor app — job calendar
- [x] Vendor app — status updates
- [x] Vendor app — on-site revision
- [x] Vendor app — offline queue

## Part 7 — Super Admin Dashboard
- [x] Metrics overview
- [x] Booking management
- [x] Pricing management UI
- [x] Audit log
- [x] Fleet management
- [x] Vendor management
- [x] Notifications management

