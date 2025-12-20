import sodium from 'libsodium-wrappers-sumo';
import { EncryptionStrategy } from '../encryption/encryption-strategy';
import { EncryptedEnvelope } from '@agam-space/core';

export class XChaChaV1Strategy implements EncryptionStrategy {
  public readonly options = {
    algorithm: 'XChaCha20-Poly1305',
    nonceLength: 24,
  };

  async encrypt(plaintext: Uint8Array, key: Uint8Array): Promise<EncryptedEnvelope> {
    const nonce = sodium.randombytes_buf(this.options.nonceLength);
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      null,
      null,
      nonce,
      key
    );

    return {
      v: 1,
      n: nonce,
      c: ciphertext,
    };
  }

  async decrypt(envelope: EncryptedEnvelope, key: Uint8Array): Promise<Uint8Array> {
    if (envelope.n.length !== this.options.nonceLength) {
      throw new Error(
        `Invalid nonce length: expected ${this.options.nonceLength}, got ${envelope.n.length}`
      );
    }

    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      envelope.c,
      null,
      envelope.n,
      key
    );
  }
}
