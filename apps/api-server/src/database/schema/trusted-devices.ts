import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { ulidColumn, ulidPrimaryKey } from '../utils/ulid';
import { users } from './users';

/**
 * Trusted device credentials for biometric unlock
 *
 * SECURITY: This table stores the encrypted unlock key that allows access
 * to the user's CMK. The unlock key is only released after successful
 * device authentication (WebAuthn, PIN, hardware keys), maintaining
 * zero-knowledge security.
 *
 * The credential_id and public_key are used to verify authentication assertions.
 * The encrypted_unlock_key is the symmetric key that decrypts the device
 * private key stored locally on the client.
 */
export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: ulidPrimaryKey(),

    userId: ulidColumn('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    credentialId: text('credential_id').notNull().unique(),

    webauthnPublicKey: text('webauthn_public_key').notNull(),
    devicePublicKey: text('device_public_key').notNull(),

    unlockKey: text('unlock_key').notNull(),

    deviceName: text('device_name').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at'),

    counter: integer('counter').notNull().default(0),
  },
  table => ({
    userIdIdx: index('trusted_devices_user_id_idx').on(table.userId),
    credentialIdIdx: index('trusted_devices_credential_id_idx').on(table.credentialId),
    lastUsedIdx: index('trusted_devices_last_used_idx').on(table.lastUsedAt),

    userCreatedIdx: index('trusted_devices_user_created_idx').on(table.userId, table.createdAt),

    credentialIdUniqueIdx: uniqueIndex('trusted_devices_credential_id_unique_idx').on(
      table.credentialId
    ),
  })
);

export type TrustedDeviceEntity = typeof trustedDevices.$inferSelect;
export type NewTrustedDeviceEntity = typeof trustedDevices.$inferInsert;
