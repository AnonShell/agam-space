import { bigint, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

import { ulidColumn, ulidPrimaryKey } from '../utils/ulid';

import { folders } from './folders';
import { users } from './users';

/**
 * Files table for storing encrypted files
 * parentFolderId = null means file is at root level
 */
export const files = pgTable('files', {
  // Primary key
  id: ulidPrimaryKey(),

  // Foreign key to users table
  userId: ulidColumn('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Foreign key to folders table (null = root level)
  parentId: ulidColumn('parent_id').references(() => folders.id, {
    onDelete: 'cascade',
  }),

  nameHash: text('name_hash').notNull(),

  chunkCount: integer('chunk_count').notNull(),

  metadataEncrypted: text('metadata_encrypted').notNull(),

  // Wrapped file key (encrypted with parent folder key or CMK for root)
  fkWrapped: text('fk_wrapped').notNull(),

  // File status
  status: text('status').notNull().default('pending'),

  // File size in bytes
  approxSize: bigint('approx_size', { mode: 'number' }).notNull().default(0),

  // Audit timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * File chunks table for storing encrypted file content
 * Each file is split into chunks for efficient upload/download
 */
export const fileChunks = pgTable(
  'file_chunks',
  {
    // Composite primary key (fileId, index)
    fileId: ulidColumn('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    index: integer('index').notNull(),

    // Encrypted chunk size (actual bytes stored)
    approxSize: integer('approx_size').notNull(),

    // Checksum of the chunk
    checksum: text('checksum').notNull(),

    // Storage path relative to FILES_DIR (e.g., "u-xxx/d-xxx/f-xxx/0")
    storagePath: text('storage_path').notNull(),

    // Audit timestamps
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.fileId, table.index] }),
  })
);

// Type inference for TypeScript
export type FileEntity = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type FileChunk = typeof fileChunks.$inferSelect;
export type NewFileChunk = typeof fileChunks.$inferInsert;
