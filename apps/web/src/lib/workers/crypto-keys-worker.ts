import { CryptoKeyOperationsService, ICryptoKeyOperationsService } from '@agam-space/client';
import * as Comlink from 'comlink';

/**
 * Crypto Keys Worker
 * Implements ICryptoKeyOperationsService in isolated worker thread
 */
class CryptoKeysWorker implements ICryptoKeyOperationsService {
  private readonly cryptoService = new CryptoKeyOperationsService();

  async initKeys(keys: { cmk: Uint8Array; encIdentitySeed?: string }): Promise<void> {
    return this.cryptoService.initKeys(keys);
  }

  async signWithIdentity(message: Uint8Array): Promise<Uint8Array> {
    return this.cryptoService.signWithIdentity(message);
  }

  clearAll(): void {
    this.cryptoService.clearAll();
  }

  isInitialized(): boolean {
    return this.cryptoService.isInitialized();
  }

  async getCMK(): Promise<Uint8Array | null> {
    return this.cryptoService.getCMK();
  }

  async getIdentitySignPubKey(): Promise<Uint8Array | null> {
    return this.cryptoService.getIdentitySignPubKey();
  }

  async encryptAndEncodeWithCmk(data: Uint8Array): Promise<string> {
    return this.cryptoService.encryptAndEncodeWithCmk(data);
  }

  async decodeAndDecryptWithCmk(data: string): Promise<Uint8Array> {
    return this.cryptoService.decodeAndDecryptWithCmk(data);
  }

  async clear(): Promise<void> {
    this.clearAll();
  }
}

Comlink.expose(new CryptoKeysWorker());
