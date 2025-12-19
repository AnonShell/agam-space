import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DeviceCredentials = {
  userId: string;
  credentialId: string;
  deviceId: string;
  encryptedDevicePrivateKey: string;
  devicePublicKey: string;
};

export type DeviceCredentialsStore = {
  credentials: DeviceCredentials | null;
  setCredentials: (creds: DeviceCredentials) => void;
  clearCredentials: () => void;
  getCredentialsForUser: (userId: string) => DeviceCredentials | null;
};

export const useDeviceCredentialsStore = create<DeviceCredentialsStore>()(
  persist(
    (set, get) => ({
      credentials: null,
      setCredentials: creds => set({ credentials: creds }),
      clearCredentials: () => set({ credentials: null }),
      getCredentialsForUser: (userId: string) => {
        const creds = get().credentials;
        if (!creds) return null;
        return creds.userId === userId ? creds : null;
      },
    }),
    {
      name: 'trustedDevice',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        // Handle migration from v1 (no userId) to v2 (with userId)
        if (version < 2) {
          // Clear old credentials without userId for security
          return { credentials: null };
        }
        return persistedState as DeviceCredentialsStore;
      },
    }
  )
);
