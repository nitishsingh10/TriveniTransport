CREATE TYPE "ServiceType" AS ENUM ('packers_movers', 'transport');
CREATE TYPE "OnboardingStatus" AS ENUM ('draft', 'submitted', 'under_review', 'needs_changes', 'approved', 'rejected');
CREATE TYPE "VehicleVerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE "SupervisorStatus" AS ENUM ('invited', 'active', 'suspended');
CREATE TYPE "DocumentReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "vendors"
  ADD COLUMN "service_type" "ServiceType",
  ADD COLUMN "driver_license_expiry" DATE,
  ADD COLUMN "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'draft',
  ADD COLUMN "onboarding_data" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "review_notes" TEXT,
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_by_id" UUID;

ALTER TABLE "vendors" ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "vehicles"
  ADD COLUMN "verification_status" "VehicleVerificationStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "vehicles" ADD COLUMN "insurance_expiry" DATE;
ALTER TABLE "vehicles" ALTER COLUMN "active" SET DEFAULT false;
CREATE INDEX "idx_vendor_dispatch_eligibility" ON "vendors"("service_type", "status", "onboarding_status", "driver_license_expiry");
CREATE INDEX "idx_vehicle_dispatch_eligibility" ON "vehicles"("vendor_id", "active", "verification_status", "insurance_expiry");

ALTER TABLE "bookings"
  ADD COLUMN "service_type" "ServiceType" NOT NULL DEFAULT 'packers_movers',
  ADD COLUMN "supervisor_id" UUID;
UPDATE "bookings"
SET "service_type" = 'transport'
WHERE "pricing_snapshot" ->> 'serviceType' = 'transport';

-- A confirmed booking with a partner is already dispatched; use the explicit
-- assigned state so partner and admin queues do not label it as unassigned.
UPDATE "bookings"
SET "status" = 'ASSIGNED'
WHERE "vendor_id" IS NOT NULL AND "status" = 'CONFIRMED';

-- Classify existing partner accounts before partner login becomes service-specific.
-- Existing vendors with transport work and no P&M work move to the pickup/truck
-- app. Vehicle-only legacy accounts move there only when they have no P&M orders.
-- Remaining legacy partner accounts are treated as P&M and must still complete
-- service-specific verification before dispatch is enabled.
UPDATE "vendors" AS v
SET "service_type" = 'transport'
WHERE v."service_type" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "bookings" AS booking
    WHERE booking."vendor_id" = v."id" AND booking."service_type" = 'packers_movers'
  )
  AND (
    EXISTS (SELECT 1 FROM "vehicles" AS vehicle WHERE vehicle."vendor_id" = v."id")
    OR EXISTS (SELECT 1 FROM "bookings" AS booking WHERE booking."vendor_id" = v."id" AND booking."service_type" = 'transport')
  );
UPDATE "vendors" SET "service_type" = 'packers_movers' WHERE "service_type" IS NULL;
ALTER TABLE "vendors" ALTER COLUMN "service_type" SET NOT NULL;

ALTER TABLE "otp_challenges" ADD COLUMN "service_type" "ServiceType";

CREATE TABLE "supervisors" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "phone" VARCHAR(15) NOT NULL,
  "status" "SupervisorStatus" NOT NULL DEFAULT 'invited',
  "phone_verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "supervisors_phone_key" ON "supervisors"("phone");
CREATE INDEX "supervisors_vendor_id_status_idx" ON "supervisors"("vendor_id", "status");
ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD COLUMN "supervisor_id" UUID;
CREATE INDEX "sessions_supervisor_id_user_role_idx" ON "sessions"("supervisor_id", "user_role");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_supervisor_id_fkey"
  FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_supervisor_history" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "supervisor_id" UUID,
  "assigned_by_vendor_id" UUID NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_supervisor_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_supervisor_history_booking_id_assigned_at_idx"
  ON "booking_supervisor_history"("booking_id", "assigned_at");
ALTER TABLE "booking_supervisor_history" ADD CONSTRAINT "booking_supervisor_history_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_supervisor_history" ADD CONSTRAINT "booking_supervisor_history_supervisor_id_fkey"
  FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_supervisor_history" ADD CONSTRAINT "booking_supervisor_history_assigned_by_vendor_id_fkey"
  FOREIGN KEY ("assigned_by_vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "vendor_documents" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "document_type" VARCHAR(60) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "object_key" VARCHAR(500) NOT NULL,
  "status" "DocumentReviewStatus" NOT NULL DEFAULT 'pending',
  "review_notes" TEXT,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMP(3),
  "reviewed_by_admin_id" UUID,
  CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_documents_object_key_key" ON "vendor_documents"("object_key");
CREATE INDEX "vendor_documents_vendor_id_status_idx" ON "vendor_documents"("vendor_id", "status");
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_reviewed_by_admin_id_fkey"
  FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "vendor_review_history" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "admin_id" UUID NOT NULL,
  "from_status" "OnboardingStatus" NOT NULL,
  "to_status" "OnboardingStatus" NOT NULL,
  "notes" TEXT,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_review_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_review_history_vendor_id_changed_at_idx" ON "vendor_review_history"("vendor_id", "changed_at");
ALTER TABLE "vendor_review_history" ADD CONSTRAINT "vendor_review_history_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_review_history" ADD CONSTRAINT "vendor_review_history_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "bookings_service_type_status_scheduled_date_idx"
  ON "bookings"("service_type", "status", "scheduled_date");
CREATE INDEX "bookings_supervisor_id_scheduled_date_idx"
  ON "bookings"("supervisor_id", "scheduled_date");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supervisor_id_fkey"
  FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_status_history" ADD COLUMN "notes" TEXT;
