import { index, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';

export const inviteCodes = pgTable(
  'invite_codes',
  {
    id: text('id').primaryKey(),
    createdBy: varchar('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }),
    maxUses: integer('max_uses').notNull().default(1),
    currentUses: integer('current_uses').notNull().default(0),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    expiresAtIdx: index('idx_invite_codes_expires_at').on(table.expiresAt),
    createdByIdx: index('idx_invite_codes_created_by').on(table.createdBy),
  })
);

export type InviteCodeEntity = typeof inviteCodes.$inferSelect;
export type InviteCodeInsertEntity = typeof inviteCodes.$inferInsert;
