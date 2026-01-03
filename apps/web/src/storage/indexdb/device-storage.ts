import { getDB } from './db';
import { STORE_NAMES } from './constants';

export interface DeviceData {
  deviceId: string;
  credentialId: string;
  encryptedDevicePrivateKey: string;
  deviceSeed: string;
  devicePublicKey: string;
  salt: string;
}

export const idbDeviceStore = {
  deviceKey(userId: string): string {
    return `device-${userId}`;
  },

  async storeDeviceData(userId: string, data: DeviceData): Promise<void> {
    try {
      const db = await getDB();
      await db.put(STORE_NAMES.DEVICE_DATA, data, this.deviceKey(userId));
    } catch {
      return;
    }
  },

  async getDeviceData(userId: string): Promise<DeviceData | null> {
    try {
      const db = await getDB();
      const value = await db.get(STORE_NAMES.DEVICE_DATA, this.deviceKey(userId));
      return value ? (value as DeviceData) : null;
    } catch {
      return null;
    }
  },

  async clearDeviceData(userId: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(STORE_NAMES.DEVICE_DATA, this.deviceKey(userId));
    } catch {
      return;
    }
  },

  async clearAllDeviceData(): Promise<void> {
    try {
      const db = await getDB();
      const keys = await db.getAllKeys(STORE_NAMES.DEVICE_DATA);
      for (const key of keys) {
        await db.delete(STORE_NAMES.DEVICE_DATA, key);
      }
    } catch {
      return;
    }
  },
};
