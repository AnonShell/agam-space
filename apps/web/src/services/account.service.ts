import { changeLoginPasswordApi } from '@agam-space/client';
import { ChangeLoginPasswordRequest } from '@agam-space/shared-types';

export const AccountService = {
  async changeLoginPassword(currentPassword: string, newPassword: string): Promise<void> {
    const request: ChangeLoginPasswordRequest = {
      currentPassword,
      newPassword,
    };

    await changeLoginPasswordApi(request);
  },
};
