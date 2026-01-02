import { getDB } from './db';
import { STORE_NAMES } from './constants';

export const idbSessionStore = {
  encCmkKey(tabId: string): string {
    return `enc-cmk-${tabId}`;
  },
  async storeEncryptedCMK(tabId: string, encryptedCMK: Uint8Array): Promise<void> {
    try {
      const db = await getDB();
      await db.put(STORE_NAMES.SESSION_DATA, encryptedCMK, this.encCmkKey(tabId));
    } catch {
      return;
    }
  },

  async getEncryptedCMK(tabId: string): Promise<Uint8Array | null> {
    try {
      const db = await getDB();
      const value = await db.get(STORE_NAMES.SESSION_DATA, this.encCmkKey(tabId));
      return value || null;
    } catch {
      return null;
    }
  },

  async clearEncryptedCMK(tabId: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(STORE_NAMES.SESSION_DATA, this.encCmkKey(tabId));
    } catch {
      return;
    }
  },

  async clearAllEncryptedCMK(): Promise<void> {
    try {
      const db = await getDB();
      const keys = await db.getAllKeys(STORE_NAMES.SESSION_DATA);
      for (const key of keys) {
        await db.delete(STORE_NAMES.SESSION_DATA, key);
      }
    } catch {
      return;
    }
  },
};
