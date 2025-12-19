import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ExplorerRefreshStore {
  refreshFlags: Record<string, boolean>;
  triggerRefreshForFolder: (folderId: string) => void;
  getAndConsumeRefreshFlag: (folderId: string) => boolean;
}

export const useExplorerRefreshStore = create(
  subscribeWithSelector<ExplorerRefreshStore>((set, get) => ({
    refreshFlags: {},

    triggerRefreshForFolder: folderId => {
      const current = get().refreshFlags;
      set({ refreshFlags: { ...current, [folderId]: true } });
    },

    getAndConsumeRefreshFlag: folderId => {
      const current = get().refreshFlags;
      const should = current[folderId];
      if (should) {
        const updated = { ...current };
        delete updated[folderId];
        set({ refreshFlags: updated });
      }
      return !!should;
    },
  }))
);
