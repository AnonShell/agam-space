import sodium from 'libsodium-wrappers-sumo';
import { getSodium } from './utils/sodium-loader';

export interface IdentityKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

const IDENTITY_KEY_V1_NAME = 'agam-space-identity-key-v1';

/** Generates Ed25519 identity keypair for signing */
export const IdentityKeyManager = {
  async generateIdentityKeyPair(cmk: Uint8Array): Promise<IdentityKeyPair> {
    const seed = (await getSodium()).crypto_generichash(32, cmk, IDENTITY_KEY_V1_NAME);
    const keypair = sodium.crypto_sign_seed_keypair(seed);
    return {
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    };
  },

  /**
   * Sign a message using the identity private key
   */
  async sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    return (await getSodium()).crypto_sign_detached(message, privateKey);
  },

  /**
   * Verify a signature using the identity public key
   */
  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    return (await getSodium()).crypto_sign_verify_detached(signature, message, publicKey);
  },
};
