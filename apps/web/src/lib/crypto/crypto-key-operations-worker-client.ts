import * as Comlink from 'comlink';
import { ICryptoKeyOperationsService } from '@agam-space/client';

/**
 * Worker API interface (matches worker implementation)
 */
interface CryptoKeysWorkerAPI extends ICryptoKeyOperationsService {
  clear(): Promise<void>;
}

/**
 * Client for CryptoKeyOperationsService running in a Web Worker
 */
export class CryptoKeyOperationsWorkerClient implements ICryptoKeyOperationsService {
  private worker: Worker | null = null;
  private workerApi: Comlink.Remote<CryptoKeysWorkerAPI> | null = null;

  async initKeys(keys: { cmk: Uint8Array; encIdentitySeed?: string }): Promise<void> {
    if (this.worker || this.workerApi) {
      this.clearAll();
    }

    this.worker = new Worker(new URL('../workers/crypto-keys-worker.ts', import.meta.url), {
      type: 'module',
      name: 'CryptoKeysWorker',
    });

    this.workerApi = Comlink.wrap<CryptoKeysWorkerAPI>(this.worker);

    await this.workerApi.initKeys(keys);
  }

  async signWithIdentity(message: Uint8Array): Promise<Uint8Array> {
    if (!this.workerApi) {
      throw new Error('Worker not initialized. Call initKeys() first.');
    }
    return this.workerApi.signWithIdentity(message);
  }

  clearAll(): void {
    if (this.workerApi) {
      try {
        this.workerApi.clear();
      } catch (_e) {
        // Ignore errors during cleanup
      }
      this.workerApi = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  isInitialized(): boolean {
    return this.workerApi !== null;
  }

  async getCMK(): Promise<Uint8Array | null> {
    if (!this.workerApi) {
      return null;
    }
    return this.workerApi.getCMK();
  }

  async getIdentitySignPubKey(): Promise<Uint8Array | null> {
    return this.workerApi?.getIdentitySignPubKey() || null;
  }

  async encryptAndEncodeWithCmk(data: Uint8Array): Promise<string> {
    if (!this.workerApi) {
      throw new Error('Worker not initialized. Call initKeys() first.');
    }
    return this.workerApi.encryptAndEncodeWithCmk(data);
  }

  async decodeAndDecryptWithCmk(data: string): Promise<Uint8Array> {
    if (!this.workerApi) {
      throw new Error('Worker not initialized. Call initKeys() first.');
    }
    return this.workerApi.decodeAndDecryptWithCmk(data);
  }
}
