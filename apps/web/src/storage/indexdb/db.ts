import { openDB, type IDBPDatabase } from 'idb';
import { STORE_NAMES } from './constants';

const DB_NAME = 'agam-storage';
const DB_VERSION = 2;

export interface AgamDB {
  [STORE_NAMES.SESSION_DATA]: {
    key: string;
    value: Uint8Array | string | number | object;
  };
  [STORE_NAMES.DEVICE_DATA]: {
    key: string;
    value: Uint8Array | string | number | object;
  };
}

let dbPromise: Promise<IDBPDatabase<AgamDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<AgamDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AgamDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        Object.values(STORE_NAMES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
      },
    });
  }
  return dbPromise;
}
