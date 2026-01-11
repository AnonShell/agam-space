'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ExplorerPrefs = {
  view: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'modified' | 'created';
  sortDir: 'asc' | 'desc';
  groupFolders: boolean; // true = folders first, false = mixed with files
};

type SecurityPrefs = {
  sessionAutoUnlock: boolean;
  clearDeviceDataOnLogout: boolean;
};

type Preferences = {
  explorer: ExplorerPrefs;
  security: SecurityPrefs;
};

type Actions = {
  setExplorerView: (v: ExplorerPrefs['view']) => void;
  setExplorerSortBy: (v: ExplorerPrefs['sortBy']) => void;
  setExplorerSortDir: (v: ExplorerPrefs['sortDir']) => void;
  setExplorerGroupFolders: (v: boolean) => void;
  setExplorerPrefs: (p: Partial<ExplorerPrefs>) => void;
  setSessionAutoUnlock: (enabled: boolean) => void;
  setClearDeviceDataOnLogout: (enabled: boolean) => void;
};

const DEFAULT_PREFS: Preferences = {
  explorer: { view: 'grid', sortBy: 'name', sortDir: 'asc', groupFolders: true },
  security: { sessionAutoUnlock: false, clearDeviceDataOnLogout: false },
};

export const usePreferencesStore = create<Preferences & Actions>()(
  persist(
    set => ({
      ...DEFAULT_PREFS,
      setExplorerView: view => set(s => ({ explorer: { ...s.explorer, view } })),
      setExplorerSortBy: sortBy => set(s => ({ explorer: { ...s.explorer, sortBy } })),
      setExplorerSortDir: sortDir => set(s => ({ explorer: { ...s.explorer, sortDir } })),
      setExplorerGroupFolders: groupFolders =>
        set(s => ({ explorer: { ...s.explorer, groupFolders } })),
      setExplorerPrefs: p => set(s => ({ explorer: { ...s.explorer, ...p } })),
      setSessionAutoUnlock: sessionAutoUnlock =>
        set(s => ({ security: { ...s.security, sessionAutoUnlock } })),
      setClearDeviceDataOnLogout: clearDeviceDataOnLogout =>
        set(s => ({ security: { ...s.security, clearDeviceDataOnLogout } })),
    }),
    {
      name: 'preferences',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ explorer: s.explorer, security: s.security }),
      migrate: (persistedState: any, version: number) => {
        // Migrate from v1 to v2: add groupFolders property
        if (version === 1) {
          return {
            ...persistedState,
            explorer: {
              ...persistedState.explorer,
              groupFolders: true,
            },
          };
        }
        // Migrate from v2 to v3: add clearDeviceDataOnLogout property
        if (version === 2) {
          return {
            ...persistedState,
            security: {
              ...persistedState.security,
              clearDeviceDataOnLogout: false,
            },
          };
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Preferences>;
        return {
          ...currentState,
          explorer: {
            ...DEFAULT_PREFS.explorer,
            ...persisted?.explorer,
          },
          security: {
            ...DEFAULT_PREFS.security,
            ...persisted?.security,
          },
        };
      },
    }
  )
);
