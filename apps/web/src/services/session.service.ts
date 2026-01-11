import { useAuth } from '@/store/auth';
import { usePreferencesStore } from '@/store/preferences.store';
import {
  ApiClientError,
  ClientRegistry,
  fetchCurrentUserApi,
  fetchE2eeKeys,
  loginWithPassword,
  logoutApi,
} from '@agam-space/client';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { SessionUnlockManager } from './session-unlock-manager';
import { TrustedDevicesService } from './trusted-devices.service';
import { LogoutSync } from './cross-tab/logout-sync';

export const SessionService = {
  async bootstrap() {
    try {
      const user = await fetchCurrentUserApi();
      useAuth.getState().setUser(user);

      const userKeys = await fetchE2eeKeys();
      if (userKeys) {
        useE2eeKeys.getState().setE2eeKeys(userKeys);
      }
    } catch (error) {
      console.warn('Failed to bootstrap session:', error);

      if (ApiClientError.isApiClientError(error) && (error as ApiClientError).isUnauthorized()) {
        await SessionService.logout();
      }
    }
  },

  async login(email: string, password: string) {
    const response = await loginWithPassword(email, password);
    useAuth.getState().setUser(response.user);

    const userKeys = await fetchE2eeKeys();
    if (userKeys) {
      useE2eeKeys.getState().setE2eeKeys(userKeys);
    } else {
      useE2eeKeys.getState().clear();
    }
  },

  async logout() {
    const userId = useAuth.getState().user?.id;
    const { clearDeviceDataOnLogout } = usePreferencesStore.getState().security;

    // Clear device data BEFORE logout API call (while still authenticated)
    if (userId) {
      await TrustedDevicesService.checkAndClearDeviceDataOnLogout(userId, clearDeviceDataOnLogout);
    }

    try {
      await logoutApi();
    } catch {
      // Ignore logout API errors - still reset local state
    }

    LogoutSync.broadcastLogout();
    await resetAllState();
  },
};

export async function resetAllState() {
  useAuth.getState().clear();
  useE2eeKeys.getState().clear();

  ClientRegistry.getKeyManager().clearAll();

  SessionUnlockManager.clearAutoUnlockData().catch(() => {});
}
