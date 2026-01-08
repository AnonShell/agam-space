import { getSodium } from './utils/sodium-loader';

export interface DeviceKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** Generates X25519 device keypair for encryption */
export const DeviceKeyManager = {
  async generateDeviceKeyPair(): Promise<DeviceKeyPair> {
    const keypair = (await getSodium()).crypto_box_keypair();
    return {
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    };
  },

  /**
   * Encrypt data (e.g., CMK) with device public key (X25519)
   */
  async encryptWithDevicePublicKey(data: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    return (await getSodium()).crypto_box_seal(data, publicKey);
  },

  /**
   * Decrypt data (e.g., CMK) with device private key (X25519)
   */
  async decryptWithDevicePrivateKey(
    ciphertext: Uint8Array,
    publicKey: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    return (await getSodium()).crypto_box_seal_open(ciphertext, publicKey, privateKey);
  },
};
