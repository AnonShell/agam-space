import { openDB, type IDBPDatabase } from 'idb';
import { STORE_NAMES } from './constants';

const DB_NAME = 'agam-storage';
const DB_VERSION = 3;

export interface AgamDB {
  [STORE_NAMES.SESSION_DATA]: {
    key: string;
    value: Uint8Array | string | number | object;
  };
  [STORE_NAMES.DEVICE_DATA]: {
    key: string;
    value: Uint8Array | string | number | object;
  };
  [STORE_NAMES.MIGRATIONS]: {
    key: string;
    value: { name: string; completedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<AgamDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<AgamDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AgamDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, _transaction) {
        console.log(`[IndexDB] Upgrading from v${oldVersion} to v${newVersion}`);

        // Create all stores if they don't exist
        Object.values(STORE_NAMES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`[IndexDB] Creating store: ${storeName}`);
            db.createObjectStore(storeName);
          }
        });
      },
    });
  }
  return dbPromise;
}
