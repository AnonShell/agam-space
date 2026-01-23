import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulidColumn } from '@/database/utils/ulid';
import { users } from '@/database/schema/users';
import { InferSelectModel } from 'drizzle-orm';

/**
 * Public shares table for public folder/file sharing
 */
export const publicShares = pgTable(
  'public_shares',
  {
    // Primary key - short random share ID used in URLs
    id: text('id').primaryKey(),

    // Owner user ID
    ownerId: ulidColumn('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Item being shared (folder or file)
    itemId: ulidColumn('item_id').notNull(),
    itemType: text('item_type').notNull(), // 'folder' or 'file'

    // Server-side share key
    serverShareKey: text('server_share_key').notNull(),

    // Wrapped file/folder key
    wrappedItemKey: text('wrapped_item_key').notNull(),

    // Optional password protection
    salt: text('salt'),
    passwordHash: text('password_hash'),

    // Optional expiry
    expiresAt: timestamp('expires_at'),

    // Audit timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    ownerIdx: index('public_shares_owner_idx').on(table.ownerId),
    itemIdx: index('public_shares_item_idx').on(table.itemId),
  })
);

export type PublicShareEntity = InferSelectModel<typeof publicShares>;
export type NewPublicShareEntity = Omit<PublicShareEntity, 'id' | 'createdAt' | 'updatedAt'>;
