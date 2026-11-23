ALTER TYPE "OtpPurpose" ADD VALUE 'contract_signature';

CREATE TABLE "vendor_contract_signatures" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "contract_version" VARCHAR(40) NOT NULL,
  "contract_hash" VARCHAR(64) NOT NULL,
  "contract_text" TEXT NOT NULL,
  "signer_name" VARCHAR(150) NOT NULL,
  "signer_role" VARCHAR(100) NOT NULL,
  "signature_text" VARCHAR(150) NOT NULL,
  "otp_challenge_id" UUID NOT NULL,
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(500),
  "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_contract_signatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_contract_signatures_vendor_id_contract_version_key"
  ON "vendor_contract_signatures"("vendor_id", "contract_version");
CREATE INDEX "vendor_contract_signatures_vendor_id_signed_at_idx"
  ON "vendor_contract_signatures"("vendor_id", "signed_at");

ALTER TABLE "vendor_contract_signatures"
  ADD CONSTRAINT "vendor_contract_signatures_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
