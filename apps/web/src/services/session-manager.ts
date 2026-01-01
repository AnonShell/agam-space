import { toBase64, fromBase64 } from '@agam-space/core';
import { usePreferencesStore } from '@/store/preferences.store';

const SESSION_KEY = 'agam_cmk_session';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

interface SessionData {
  cmk: string;
  timestamp: number;
  userId: string;
}

export class SessionManager {
  static saveSession(cmk: Uint8Array, userId: string): void {
    if (typeof window === 'undefined') return;

    const persistEnabled = usePreferencesStore.getState().security?.persistCMKInSession ?? false;
    if (!persistEnabled) {
      return;
    }

    const sessionData: SessionData = {
      cmk: toBase64(cmk),
      timestamp: Date.now(),
      userId,
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  static restoreSession(userId: string): Uint8Array | null {
    if (typeof window === 'undefined') return null;

    const persistEnabled = usePreferencesStore.getState().security?.persistCMKInSession ?? false;
    if (!persistEnabled) {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const sessionData: SessionData = JSON.parse(stored);

      if (sessionData.userId !== userId) {
        this.clearSession();
        return null;
      }

      const age = Date.now() - sessionData.timestamp;
      if (age > SESSION_TIMEOUT_MS) {
        this.clearSession();
        return null;
      }

      return fromBase64(sessionData.cmk);
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return null;
    }
  }

  static hasValidSession(userId: string): boolean {
    return this.restoreSession(userId) !== null;
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
}
