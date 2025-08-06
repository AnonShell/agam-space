import { bigint, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { ulidColumn } from '@/database/utils/ulid';
import { users } from './users';

export const userQuotaDBSchema = pgTable('user_quota', {
  userId: ulidColumn('user_id')
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  totalStorageQuota: bigint('total_storage_quota', { mode: 'number' }).notNull().default(0),
  usedStorage: bigint('used_storage', { mode: 'number' }).notNull().default(0),

  refreshedAt: timestamp('refreshed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserQuotaEntity = typeof userQuotaDBSchema.$inferSelect;
export type NewUserQuotaEntity = typeof userQuotaDBSchema.$inferInsert;
