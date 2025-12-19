'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ExplorerPrefs = {
  view: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'updatedAt';
  sortDir: 'asc' | 'desc';
};

type Preferences = {
  explorer: ExplorerPrefs;
  // future: theme?: 'light'|'dark'; language?: 'en'|'nl'; etc.
};

type Actions = {
  setExplorerView: (v: ExplorerPrefs['view']) => void;
  setExplorerSortBy: (v: ExplorerPrefs['sortBy']) => void;
  setExplorerSortDir: (v: ExplorerPrefs['sortDir']) => void;
  setExplorerPrefs: (p: Partial<ExplorerPrefs>) => void;
};

const DEFAULT_PREFS: Preferences = {
  explorer: { view: 'grid', sortBy: 'name', sortDir: 'asc' },
};

export const usePreferencesStore = create<Preferences & Actions>()(
  persist(
    set => ({
      ...DEFAULT_PREFS,
      setExplorerView: view => set(s => ({ explorer: { ...s.explorer, view } })),
      setExplorerSortBy: sortBy => set(s => ({ explorer: { ...s.explorer, sortBy } })),
      setExplorerSortDir: sortDir => set(s => ({ explorer: { ...s.explorer, sortDir } })),
      setExplorerPrefs: p => set(s => ({ explorer: { ...s.explorer, ...p } })),
    }),
    {
      name: 'preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ explorer: s.explorer }), // only persist what we need for now
    }
  )
);
