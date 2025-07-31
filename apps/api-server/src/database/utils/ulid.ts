import { text } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

/**
 * Generate a new ULID
 */
export function generateULID(): string {
  return ulid();
}

/**
 * Custom ULID column type for Drizzle ORM
 * Creates a text column with ULID default value
 */
export function ulidPrimaryKey(name = 'id') {
  return text(name)
    .primaryKey()
    .$defaultFn(() => generateULID());
}

/**
 * ULID column for foreign keys
 */
export function ulidColumn(name: string) {
  return text(name);
}
