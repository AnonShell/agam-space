import { getDB } from './db';
import { STORE_NAMES } from './constants';

export const idbMigrationStore = {
  async isMigrationCompleted(migrationName: string): Promise<boolean> {
    try {
      const db = await getDB();
      const value = await db.get(STORE_NAMES.MIGRATIONS, migrationName);
      return !!value;
    } catch {
      return false;
    }
  },

  async markMigrationCompleted(migrationName: string): Promise<void> {
    try {
      const db = await getDB();
      await db.put(
        STORE_NAMES.MIGRATIONS,
        { name: migrationName, completedAt: Date.now() },
        migrationName
      );
    } catch (error) {
      console.error('[Migration] Failed to mark as completed:', error);
      throw error;
    }
  },

  async clearMigrationHistory(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear(STORE_NAMES.MIGRATIONS);
    } catch (error) {
      console.error('[Migration] Failed to clear history:', error);
      throw error;
    }
  },
};
