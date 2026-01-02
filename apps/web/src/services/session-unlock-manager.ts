import { toBase64, fromBase64, EncryptedEnvelopeCodec } from '@agam-space/core';
import {
  fetchSessionCryptoMaterial,
  Argon2idVersion,
  deriveKeyFromSecret,
  EncryptionRegistry,
} from '@agam-space/client';
import { usePreferencesStore } from '@/store/preferences.store';
import { idbSessionStore } from '@/storage/indexdb';

const CLIENT_SEED_KEY = 'agam_client_seed';
const STATIC_SALT = new Uint8Array(16);
const TAB_ID_KEY = 'agam_tab_id';

function getOrCreateTabId(): string {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

export class SessionUnlockManager {
  private static getOrCreateClientSeed(): Uint8Array | null {
    try {
      const stored = sessionStorage.getItem(CLIENT_SEED_KEY);
      if (stored) {
        return fromBase64(stored);
      }

      const seed = crypto.getRandomValues(new Uint8Array(32));
      sessionStorage.setItem(CLIENT_SEED_KEY, toBase64(seed));
      return seed;
    } catch {
      return null;
    }
  }

  private static async deriveEncryptionKey(
    nonce: string,
    seed: Uint8Array
  ): Promise<Uint8Array | null> {
    try {
      const nonceBytes = fromBase64(nonce);
      const keyMaterial = new Uint8Array(nonceBytes.length + seed.length);
      keyMaterial.set(nonceBytes, 0);
      keyMaterial.set(seed, nonceBytes.length);

      const { key } = await deriveKeyFromSecret(keyMaterial, STATIC_SALT, Argon2idVersion.session);
      return key;
    } catch {
      return null;
    }
  }

  private static async getDerivedSessionKey(): Promise<Uint8Array | null> {
    try {
      const seed = SessionUnlockManager.getOrCreateClientSeed();
      if (!seed) return null;

      const material = await fetchSessionCryptoMaterial();
      if (material.isNew || !material.nonce) return null;

      return await this.deriveEncryptionKey(material.nonce, seed);
    } catch {
      return null;
    }
  }

  static isSessionAutoUnlockEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return usePreferencesStore.getState().security?.sessionAutoUnlock ?? false;
  }

  static async saveCMKForAutoUnlock(cmk: Uint8Array): Promise<void> {
    if (!SessionUnlockManager.isSessionAutoUnlockEnabled()) return;

    try {
      const material = await fetchSessionCryptoMaterial();
      const seed = this.getOrCreateClientSeed();
      if (!seed || !material.nonce) return;

      const key = await this.deriveEncryptionKey(material.nonce, seed);
      if (!key) return;

      const envelope = await EncryptionRegistry.get().encrypt(cmk, key);
      const serialized = EncryptedEnvelopeCodec.serializeToTLV(envelope);
      const tabId = getOrCreateTabId();
      await idbSessionStore.storeEncryptedCMK(tabId, serialized);
    } catch {
      return;
    }
  }

  static async restoreCMKForAutoUnlock(): Promise<Uint8Array | null> {
    if (!SessionUnlockManager.isSessionAutoUnlockEnabled()) return null;

    try {
      const sessionKey = await SessionUnlockManager.getDerivedSessionKey();
      if (!sessionKey) {
        await this.clearAutoUnlockData();
        return null;
      }
      const tabId = getOrCreateTabId();
      const combined = await idbSessionStore.getEncryptedCMK(tabId);
      if (!combined || combined.length < 24) {
        await this.clearAutoUnlockData();
        return null;
      }
      const envelope = EncryptedEnvelopeCodec.deserializeFromTLV(combined);
      return await EncryptionRegistry.get().decrypt(envelope, sessionKey);
    } catch {
      await this.clearAutoUnlockData();
      return null;
    }
  }

  static async clearAutoUnlockData(clearAll: boolean = false): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(CLIENT_SEED_KEY);

      if (clearAll) {
        await idbSessionStore.clearAllEncryptedCMK();
        return;
      }

      const tabId = sessionStorage.getItem(TAB_ID_KEY);
      if (tabId) {
        await idbSessionStore.clearEncryptedCMK(tabId);
        sessionStorage.removeItem(TAB_ID_KEY);
      }
    } catch {
      return;
    }
  }
}
