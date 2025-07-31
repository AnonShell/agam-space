import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AppConfigService } from '@/config/config.service';

import * as schema from './schema';

// Database injection token
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

/**
 * PostgreSQL database provider using Drizzle ORM
 * Standard NestJS factory pattern for dependency injection
 * Note: Migrations are run separately during app bootstrap in main.ts
 */
export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: async (configService: AppConfigService) => {
      const logger = new Logger('DatabaseProvider');
      const isDev = process.env.NODE_ENV === 'development';

      try {
        const dbConfig = configService.getDatabase();
        if (isDev) {
          logger.log('🔌 Connecting to PostgreSQL...');
        }

        // Build connection URL
        const encodedPassword = encodeURIComponent(dbConfig.password);
        const connectionUrl = `postgresql://${dbConfig.username}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

        // Create postgres client
        const client = postgres(connectionUrl, {
          max: dbConfig.maxConnections,
          idle_timeout: dbConfig.connectionTimeout / 1000,
          connect_timeout: 10,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          debug: false, // Suppress debug output
          // Suppress PostgreSQL notices (like "schema already exists")
          onnotice: () => {}, // Ignore notices to reduce log noise
        });

        // Create Drizzle instance with schema
        const db = drizzle(client, { schema });

        // Test connection
        await client`SELECT 1`;
        if (isDev) {
          logger.log('✅ PostgreSQL connected');
        } else {
          logger.log('✅ Database ready');
        }

        return db;
      } catch (error) {
        logger.error('❌ Database setup failed:', error);
        throw error;
      }
    },
    inject: [AppConfigService],
  },
];
