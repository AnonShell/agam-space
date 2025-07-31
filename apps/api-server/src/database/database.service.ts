import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { AppConfigService } from '@/config/config.service';

import { DATABASE_CONNECTION } from './database.providers';
import * as schema from './schema';

/**
 * Database utility service providing health checks and database information
 * Uses proper NestJS dependency injection patterns
 */
@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_CONNECTION) public readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: AppConfigService
  ) {}

  /**
   * Health check - test database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRawQuery(query: string): Promise<unknown> {
    return this.db.execute(sql`${query}`);
  }

  /**
   * Get database configuration summary for logging
   */
  getDatabaseInfo() {
    const dbConfig = this.configService.getDatabase();
    return {
      type: 'postgresql',
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      maxConnections: dbConfig.maxConnections,
    };
  }
}
