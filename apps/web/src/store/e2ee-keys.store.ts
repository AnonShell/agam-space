import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserKeys } from '@agam-space/shared-types';

interface E2eeKeysStore {
  e2eeKeys: UserKeys | null;
  setE2eeKeys(keys: UserKeys): void;
  clear(): void;
}

export const useE2eeKeys = create<E2eeKeysStore>()(
  persist(
    set => ({
      e2eeKeys: null,
      setE2eeKeys: e2eeKeys => set({ e2eeKeys }),
      clear: () => set({ e2eeKeys: null }),
    }),
    {
      name: 'agam-e2ee-keys',
      version: 1,
    }
  )
);
