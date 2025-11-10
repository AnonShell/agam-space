import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { ulidPrimaryKey } from '../utils/ulid';

/**
 * Users table for authentication and user management
 * Supports both local authentication and OIDC/SSO users
 */
export const users = pgTable(
  'users',
  {
    // Primary key - ULID for better performance and natural ordering
    id: ulidPrimaryKey(),

    // Authentication fields
    username: text('username').notNull().unique(),
    email: text('email').unique(), // Optional for OIDC users, required for email login
    passwordHash: text('password_hash'), // Nullable for OIDC-only users (includes salt and params)

    // User roles and permissions
    role: text('role').notNull().default('user'), // 'user', 'admin', 'owner'

    status: text('status').notNull().default('active'), // 'active', 'disabled', 'deleted'
    emailVerified: boolean('email_verified').notNull().default(false), // true if email is verified, false otherwise

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),

    // OIDC/SSO fields (optional)
    oidcProvider: text('oidc_provider'), // 'google', 'github', etc.
    oidcSubject: text('oidc_subject'), // Provider's unique user ID
  },
  table => ({
    // Indexes for performance
    usernameIdx: index('users_username_idx').on(table.username),
    emailIdx: index('users_email_idx').on(table.email),
    oidcIdx: index('users_oidc_idx').on(table.oidcProvider, table.oidcSubject),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

// Type inference for TypeScript
export type UserDB = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
