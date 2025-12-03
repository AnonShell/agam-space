-- Add size column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS "size" bigint DEFAULT 0;
