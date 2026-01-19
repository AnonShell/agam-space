import sodium from 'libsodium-wrappers-sumo';
import { getSodium } from './utils/sodium-loader';
import { randomBytes } from './crypto';

export interface IdentityKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface IdentityKeys {
  signKey: IdentityKeyPair;
  encKey: IdentityKeyPair;
}

const enum IdentityKeyName {
  SIGN_V1 = 'agam-space-identity-sign-key-v1',
  ENC_V1 = 'agam-space-identity-enc-key-v1',
}

export const IdentityKeyManager = {
  generateIdentitySeed(): Uint8Array {
    return randomBytes(32);
  },

  // Legacy method for backward compatibility - generates Ed25519 keypair from CMK
  // Used for old accounts that haven't migrated to seed-based identity yet
  async generateIdentityKeyPairWithCmk(cmk: Uint8Array): Promise<IdentityKeyPair> {
    const sodium_instance = await getSodium();
    const seed = sodium_instance.crypto_generichash(32, cmk, 'agam-space-identity-key-v1');
    const keypair = sodium.crypto_sign_seed_keypair(seed);
    return {
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    };
  },

  async generateIdentityKeys(identitySeed: Uint8Array): Promise<IdentityKeys> {
    const sodium_instance = await getSodium();
    const ed25519Seed = sodium_instance.crypto_generichash(
      32,
      identitySeed,
      IdentityKeyName.SIGN_V1
    );

    const x25519Seed = sodium_instance.crypto_generichash(32, identitySeed, IdentityKeyName.ENC_V1);

    const signKeyPair = sodium.crypto_sign_seed_keypair(ed25519Seed);
    const encKeyPair = sodium.crypto_box_seed_keypair(x25519Seed);

    return {
      signKey: {
        publicKey: signKeyPair.publicKey,
        privateKey: signKeyPair.privateKey,
      },
      encKey: {
        publicKey: encKeyPair.publicKey,
        privateKey: encKeyPair.privateKey,
      },
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
