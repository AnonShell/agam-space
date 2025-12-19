import { create } from 'zustand';
import { fetchMyQuota } from '@agam-space/client';

type QuotaState = {
  used: number | null;
  max: number | null;
  refresh: () => Promise<void>;
};

export const useUserQuotaStore = create<QuotaState>(set => ({
  used: null,
  max: null,
  refresh: async () => {
    const quota = await fetchMyQuota();
    set({
      used: quota.usedStorage,
      max: quota.totalStorageQuota ?? 0,
    });
  },
}));
