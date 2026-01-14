import { bigint, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { ulidColumn, ulidPrimaryKey } from '../utils/ulid';

import { users } from './users';
import { InferSelectModel } from 'drizzle-orm';

/**
 * Folders table for hierarchical folder structure
 * Stores encrypted folder metadata and wrapped folder keys
 * parentId = null means this is a root-level folder
 * All folders are encrypted with their parent's folder key
 * Root-level folders are encrypted with the user's CMK
 */
export const folders = pgTable(
  'folders',
  {
    // Primary key
    id: ulidPrimaryKey(),

    // Foreign key to users table
    userId: ulidColumn('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Self-referencing foreign key for parent folder (null = root-level folder)
    parentId: ulidColumn('parent_id').references(() => folders.id, { onDelete: 'cascade' }),

    // Encrypted folder metadata
    metadataEncrypted: text('metadata_encrypted').notNull(),

    nameHash: text('name_hash').notNull(),

    size: bigint('size', { mode: 'number' }).default(0),

    // Wrapped folder key (encrypted with parent folder key or CMK for root)
    fkWrapped: text('fk_wrapped').notNull(),

    // Audit timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    status: text('status').notNull().default('active'),
  },
  table => ({
    userParentNameHashIdx: index('folders_user_parent_namehash_idx').on(
      table.userId,
      table.parentId,
      table.nameHash
    ),
    userStatusIdx: index('folders_user_status_idx').on(table.userId, table.status),
  })
);

// Type inference for TypeScript
export type FolderEntity = InferSelectModel<typeof folders>;
export type NewFolderEntity = typeof folders.$inferInsert;
