import { useAuth } from '@/store/auth';
import {
  ApiClientError,
  ClientRegistry,
  fetchCurrentUserApi,
  fetchE2eeKeys,
  loginWithPassword,
  logoutApi,
} from '@agam-space/client';
import { useE2eeKeys } from '@/store/e2ee-keys.store';

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
    try {
      await logoutApi();
    } catch {}

    resetAllState();
  },
};

export function resetAllState() {
  // Clear session-specific state
  useAuth.getState().clear();
  useE2eeKeys.getState().clear();

  // Clear in-memory encryption keys
  ClientRegistry.getKeyManager().clearAll();
}
