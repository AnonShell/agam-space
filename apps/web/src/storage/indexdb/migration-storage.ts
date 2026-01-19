import { getDB } from './db';
import { STORE_NAMES } from './constants';

const ensureStoreExists = async (db: any, storeName: string) => {
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`[Migration] Store ${storeName} does not exist in database`);
    return false;
  }
  return true;
};

export const idbMigrationStore = {
  async isMigrationCompleted(migrationName: string): Promise<boolean> {
    try {
      const db = await getDB();
      const storeExists = await ensureStoreExists(db, STORE_NAMES.MIGRATIONS);
      if (!storeExists) {
        return false;
      }
      const value = await db.get(STORE_NAMES.MIGRATIONS, migrationName);
      return !!value;
    } catch (error) {
      console.error('[Migration] Error checking migration status:', error);
      return false;
    }
  },

  async markMigrationCompleted(migrationName: string): Promise<void> {
    try {
      const db = await getDB();
      const storeExists = await ensureStoreExists(db, STORE_NAMES.MIGRATIONS);
      if (!storeExists) {
        throw new Error(`Store ${STORE_NAMES.MIGRATIONS} does not exist`);
      }
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
      const storeExists = await ensureStoreExists(db, STORE_NAMES.MIGRATIONS);
      if (!storeExists) {
        console.warn('[Migration] Cannot clear history - store does not exist');
        return;
      }
      await db.clear(STORE_NAMES.MIGRATIONS);
    } catch (error) {
      console.error('[Migration] Failed to clear history:', error);
      throw error;
    }
  },
};
