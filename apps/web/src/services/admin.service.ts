import {
  updateUserStatus as updateUserStatusApi,
  updateUserQuota as updateUserQuotaApi,
} from '@agam-space/client';
import { UserStatus } from '@agam-space/shared-types';

export const AdminService = {
  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    await updateUserStatusApi(userId, { status });
  },

  async updateUserQuota(userId: string, totalStorageQuota: number): Promise<void> {
    await updateUserQuotaApi(userId, { totalStorageQuota });
  },
};
