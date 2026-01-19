import { Migration } from './migration.interface';
import { idbMigrationStore } from '@/storage/indexdb';
import { ALL_MIGRATIONS } from './index';
import { logger } from '@/lib/logger';

export interface MigrationProgressCallback {
  (description: string | null): void;
}

export class MigrationRunner {
  private static readonly logger = '[MigrationRunner]';

  static async hasMigrations(): Promise<boolean> {
    for (const migration of ALL_MIGRATIONS) {
      const isCompleted = await idbMigrationStore.isMigrationCompleted(migration.getName());
      if (isCompleted) continue;

      const result = await migration.shouldRun();
      if (result.shouldRun) {
        return true;
      }
    }

    return false;
  }

  static async runPending(
    migrations: Migration[],
    onProgress?: MigrationProgressCallback
  ): Promise<void> {
    logger.debug(MigrationRunner.name, `Starting migration check for ${migrations.length} migration(s)`);

    for (const migration of migrations) {
      const name = migration.getName();

      try {
        const isCompleted = await idbMigrationStore.isMigrationCompleted(name);
        if (isCompleted) {
          logger.debug(MigrationRunner.name, `Migration ${name} already completed, skipping`);
          continue;
        }

        const result = await migration.shouldRun();
        if (!result.shouldRun) {
          logger.debug(MigrationRunner.name, `Migration ${name} determined not needed, permanent: ${result.permanent}`);

          if (result.permanent) {
            await idbMigrationStore.markMigrationCompleted(name);
            logger.debug(MigrationRunner.name, `Migration ${name} marked as permanently completed`);
          }
          continue;
        }

        onProgress?.(migration.getDescription());
        await migration.run();

        await idbMigrationStore.markMigrationCompleted(name);
      } catch (error) {
        logger.error(MigrationRunner.name, `Migration ${name} failed`, error);
        throw error;
      }
    }

    onProgress?.(null);
    logger.debug(MigrationRunner.name, 'All pending migrations have been run');
  }
}
