ALTER TABLE "trusted_devices" ADD COLUMN "webauthn_public_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD COLUMN "device_public_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "trusted_devices" DROP COLUMN IF EXISTS "public_key";