import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { ulidColumn } from '../utils/ulid';

import { users } from './users';

/**
 * User encryption keys table
 * Stores client-side encryption metadata - never stores actual keys
 * One-to-one relationship with users (userId is primary key)
 */
export const userKeys = pgTable('user_keys', {
  // Primary key - references user (one-to-one relationship)
  userId: ulidColumn('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  kdfMetadata: jsonb('kdf_metadata').notNull(),

  // Encryption version for future algorithm upgrades
  encryptionVersion: text('encryption_version').notNull().default('v1'),

  // Encrypted CMK with password
  encCmkWithPassword: text('enc_cmk_with_password').notNull(),
  // Encrypted CMK with recovery key
  encCmkWithRecovery: text('enc_cmk_with_recovery').notNull(),
  // Encrypted recovery key with CMK
  encRecoveryWithCmk: text('enc_recovery_with_cmk').notNull(),
  // Identity public key (base64 encoded)
  identityPublicKey: text('identity_public_key').notNull(),

  // Audit timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type inference for TypeScript
export type UserKeysEntity = typeof userKeys.$inferSelect;
export type NewUserKeys = typeof userKeys.$inferInsert;
