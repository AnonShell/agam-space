import { IdentityKeyManager } from '../src';
import { randomBytes } from 'crypto';

describe('IdentityKeyManager', () => {
  it('should generate a valid X25519 keypair', async () => {
    const cmk = randomBytes(32);

    const keypair = await IdentityKeyManager.generateIdentityKeyPair(cmk);
    expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keypair.publicKey.length).toBe(32);
    expect(keypair.privateKey.length).toBe(64);

    expect(keypair.publicKey).not.toEqual(keypair.privateKey);
  });

  it('should generate the same keypair for the same input', async () => {
    const cmk = randomBytes(32);
    const keypair1 = await IdentityKeyManager.generateIdentityKeyPair(cmk);
    const keypair2 = await IdentityKeyManager.generateIdentityKeyPair(cmk);

    expect(keypair1.publicKey).toEqual(keypair2.publicKey);
    expect(keypair1.privateKey).toEqual(keypair2.privateKey);
  });

  it('should sign and verify a message', async () => {
    const cmk = randomBytes(32);
    const keypair = await IdentityKeyManager.generateIdentityKeyPair(cmk);

    const message = Buffer.from('Hello, world!');
    const signature = await IdentityKeyManager.sign(message, keypair.privateKey);

    const isValid = await IdentityKeyManager.verify(message, signature, keypair.publicKey);
    expect(isValid).toBe(true);
  });

  it('should fail to verify with an invalid signature', async () => {
    const cmk = randomBytes(32);
    const keypair = await IdentityKeyManager.generateIdentityKeyPair(cmk);

    const message = Buffer.from('Hello, world!');
    const invalidSignature = randomBytes(64);

    const isValid = await IdentityKeyManager.verify(message, invalidSignature, keypair.publicKey);
    expect(isValid).toBe(false);
  });

  it('should fail to verify with a different public key', async () => {
    const cmk1 = randomBytes(32);
    const cmk2 = randomBytes(32);
    const keypair1 = await IdentityKeyManager.generateIdentityKeyPair(cmk1);
    const keypair2 = await IdentityKeyManager.generateIdentityKeyPair(cmk2);

    const message = Buffer.from('Hello, world!');
    const signature = await IdentityKeyManager.sign(message, keypair1.privateKey);

    const isValid = await IdentityKeyManager.verify(message, signature, keypair2.publicKey);
    expect(isValid).toBe(false);
  });
});
