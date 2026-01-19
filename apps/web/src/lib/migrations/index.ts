import { Migration } from './migration.interface';
import { IdentitySeedMigration } from './migrate-identity-seed';

export const ALL_MIGRATIONS: Migration[] = [new IdentitySeedMigration()];

export { MigrationRunner } from './migration-runner';
export type { Migration, ShouldRunResult } from './migration.interface';
