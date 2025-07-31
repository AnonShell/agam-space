import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulidPrimaryKey } from '@/database/utils/ulid';

export const userKeysHistory = pgTable('user_keys_history', {
  id: ulidPrimaryKey(),

  userId: text('user_id').notNull(),
  encCmkWithPassword: text('enc_cmk_with_password'),
  encRecoveryWithCmk: text('enc_recovery_with_cmk'),
  encCmkWithRecovery: text('enc_cmk_with_recovery'),

  // Audit timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type inference for TypeScript
export type UserKeysHistory = typeof userKeysHistory.$inferSelect;
export type NewUserKeysHistory = typeof userKeysHistory.$inferInsert;
