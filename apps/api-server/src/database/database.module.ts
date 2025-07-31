import { Global, Module } from '@nestjs/common';

import { databaseProviders } from './database.providers';
import { DatabaseService } from './database.service';

/**
 * Global Database Module
 * Provides Drizzle database connection throughout the application using proper NestJS patterns
 */
@Global()
@Module({
  providers: [...databaseProviders, DatabaseService],
  exports: [...databaseProviders, DatabaseService],
})
export class DatabaseModule {}
