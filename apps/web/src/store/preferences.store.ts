'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ExplorerPrefs = {
  view: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'updatedAt';
  sortDir: 'asc' | 'desc';
};

type SecurityPrefs = {
  sessionAutoUnlock: boolean;
};

type Preferences = {
  explorer: ExplorerPrefs;
  security: SecurityPrefs;
};

type Actions = {
  setExplorerView: (v: ExplorerPrefs['view']) => void;
  setExplorerSortBy: (v: ExplorerPrefs['sortBy']) => void;
  setExplorerSortDir: (v: ExplorerPrefs['sortDir']) => void;
  setExplorerPrefs: (p: Partial<ExplorerPrefs>) => void;
  setSessionAutoUnlock: (enabled: boolean) => void;
};

const DEFAULT_PREFS: Preferences = {
  explorer: { view: 'grid', sortBy: 'name', sortDir: 'asc' },
  security: { sessionAutoUnlock: false },
};

export const usePreferencesStore = create<Preferences & Actions>()(
  persist(
    set => ({
      ...DEFAULT_PREFS,
      setExplorerView: view => set(s => ({ explorer: { ...s.explorer, view } })),
      setExplorerSortBy: sortBy => set(s => ({ explorer: { ...s.explorer, sortBy } })),
      setExplorerSortDir: sortDir => set(s => ({ explorer: { ...s.explorer, sortDir } })),
      setExplorerPrefs: p => set(s => ({ explorer: { ...s.explorer, ...p } })),
      setSessionAutoUnlock: sessionAutoUnlock =>
        set(s => ({ security: { ...s.security, sessionAutoUnlock } })),
    }),
    {
      name: 'preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ explorer: s.explorer, security: s.security }),
    }
  )
);
