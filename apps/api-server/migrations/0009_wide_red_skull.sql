ALTER TABLE "user_keys" ADD COLUMN "identity_fingerprint" text;--> statement-breakpoint
ALTER TABLE "user_keys" ADD CONSTRAINT "user_keys_identity_fingerprint_unique" UNIQUE("identity_fingerprint");