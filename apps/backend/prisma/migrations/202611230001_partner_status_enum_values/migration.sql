-- Add legacy enum values in their own migration so PostgreSQL commits them
-- before the following migration uses them as defaults or session roles.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE "VendorStatus" ADD VALUE IF NOT EXISTS 'pending';
