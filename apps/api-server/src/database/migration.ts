import { Logger } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import fs from 'fs';
import path from 'path';
import { DATABASE_CONNECTION } from './database.providers';

/**
 * Runs database migrations during app bootstrap
 * Uses the provider's database connection to ensure consistency
 */
export async function runMigrations(app: NestFastifyApplication): Promise<void> {
  const logger = new Logger('Migration');
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (isDev) {
      logger.log('🔄 Running database migrations...');
    }

    // Get database connection from provider (forces provider initialization)
    const db = app.get(DATABASE_CONNECTION);

    // Run embedded migrations using the provider's connection
    await migrate(db, {
      migrationsFolder: resolveMigrationsPath(),
      migrationsTable: 'drizzle_migrations',
    });

    if (isDev) {
      logger.log('✅ Database migrations completed');
    } else {
      logger.log('✅ Migrations applied');
    }
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

function resolveMigrationsPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'migrations'), // works in dev
    path.resolve(__dirname, '../migrations'), // works in dist
    path.resolve(__dirname, './migrations'), // if running from dist/migrations
  ];

  const valid = candidates.find(p => fs.existsSync(p));
  if (!valid) {
    throw new Error(`❌ Cannot find migrations folder. Tried:\n${candidates.join('\n')}`);
  }

  return valid;
}
