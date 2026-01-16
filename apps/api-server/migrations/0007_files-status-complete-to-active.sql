-- Migrate all files with status 'complete' to 'active'
-- This is needed because we changed the file status enum value
UPDATE "files" SET "status" = 'active' WHERE "status" = 'complete';--> statement-breakpoint

