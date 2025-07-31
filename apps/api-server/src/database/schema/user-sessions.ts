import { index, inet, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { ulidColumn, ulidPrimaryKey } from '../utils/ulid';

import { users } from './users';

/**
 * User sessions table for authentication token management
 * Each session represents an active login from a specific device/browser
 *
 * SECURITY: Session tokens are hashed (SHA-256) before storage to prevent
 * session hijacking if database is compromised
 */
export const userSessions = pgTable(
  'user_sessions',
  {
    // Primary key - ULID for database performance and natural ordering
    id: ulidPrimaryKey(),

    // Secure session token hash - SHA-256 hash of the actual token for security
    tokenHash: text('token_hash').notNull().unique(),

    // Foreign key to users table
    userId: ulidColumn('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Device/browser identification
    deviceFingerprint: text('device_fingerprint'), // Optional device fingerprint from crypto package
    userAgent: text('user_agent'), // Browser/app user agent
    ipAddress: inet('ip_address'), // IP address for security monitoring

    // Session lifecycle
    expiresAt: timestamp('expires_at').notNull(),
    lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),

    // Audit timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    // Indexes for performance
    tokenHashIdx: index('user_sessions_token_hash_idx').on(table.tokenHash), // Index on token hash for fast auth lookups
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    expiresIdx: index('user_sessions_expires_idx').on(table.expiresAt),
    lastUsedIdx: index('user_sessions_last_used_idx').on(table.lastUsedAt),
  })
);

// Type inference for TypeScript
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
