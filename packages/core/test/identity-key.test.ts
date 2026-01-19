import { getSodium, IdentityKeyManager } from '../src';
import { randomBytes } from 'crypto';

describe('IdentityKeyManager', () => {
  beforeAll(async () => {
    await getSodium();
  });

  it('should generate a random identity seed', () => {
    const seed1 = IdentityKeyManager.generateIdentitySeed();
    const seed2 = IdentityKeyManager.generateIdentitySeed();

    expect(seed1).toBeInstanceOf(Uint8Array);
    expect(seed1.length).toBe(32);
    expect(seed1).not.toEqual(seed2);
  });

  it('should generate both sign and encryption keys from a seed', async () => {
    const seed = IdentityKeyManager.generateIdentitySeed();

    const identityKeys = await IdentityKeyManager.generateIdentityKeys(seed);

    expect(identityKeys.signKey.publicKey).toBeInstanceOf(Uint8Array);
    expect(identityKeys.signKey.privateKey).toBeInstanceOf(Uint8Array);
    expect(identityKeys.encKey.publicKey).toBeInstanceOf(Uint8Array);
    expect(identityKeys.encKey.privateKey).toBeInstanceOf(Uint8Array);

    expect(identityKeys.signKey.publicKey.length).toBe(32);
    expect(identityKeys.signKey.privateKey.length).toBe(64);

    expect(identityKeys.encKey.publicKey.length).toBe(32);
    expect(identityKeys.encKey.privateKey.length).toBe(32);

    expect(identityKeys.signKey.publicKey).not.toEqual(identityKeys.encKey.publicKey);
    expect(identityKeys.signKey.privateKey).not.toEqual(identityKeys.encKey.privateKey);
  });

  it('should generate the same keys for the same seed', async () => {
    const seed = IdentityKeyManager.generateIdentitySeed();
    const keys1 = await IdentityKeyManager.generateIdentityKeys(seed);
    const keys2 = await IdentityKeyManager.generateIdentityKeys(seed);

    expect(keys1.signKey.publicKey).toEqual(keys2.signKey.publicKey);
    expect(keys1.signKey.privateKey).toEqual(keys2.signKey.privateKey);
    expect(keys1.encKey.publicKey).toEqual(keys2.encKey.publicKey);
    expect(keys1.encKey.privateKey).toEqual(keys2.encKey.privateKey);
  });

  it('should generate different keys for different seeds', async () => {
    const seed1 = IdentityKeyManager.generateIdentitySeed();
    const seed2 = IdentityKeyManager.generateIdentitySeed();
    const keys1 = await IdentityKeyManager.generateIdentityKeys(seed1);
    const keys2 = await IdentityKeyManager.generateIdentityKeys(seed2);

    expect(keys1.signKey.publicKey).not.toEqual(keys2.signKey.publicKey);
    expect(keys1.encKey.publicKey).not.toEqual(keys2.encKey.publicKey);
  });

  it('should sign and verify a message', async () => {
    const seed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(seed);

    const message = Buffer.from('Hello, world!');
    const signature = await IdentityKeyManager.sign(message, identityKeys.signKey.privateKey);

    const isValid = await IdentityKeyManager.verify(
      message,
      signature,
      identityKeys.signKey.publicKey
    );
    expect(isValid).toBe(true);
  });

  it('should fail to verify with an invalid signature', async () => {
    const seed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(seed);

    const message = Buffer.from('Hello, world!');
    const invalidSignature = randomBytes(64);

    const isValid = await IdentityKeyManager.verify(
      message,
      invalidSignature,
      identityKeys.signKey.publicKey
    );
    expect(isValid).toBe(false);
  });

  it('should fail to verify with a different public key', async () => {
    const seed1 = IdentityKeyManager.generateIdentitySeed();
    const seed2 = IdentityKeyManager.generateIdentitySeed();
    const keys1 = await IdentityKeyManager.generateIdentityKeys(seed1);
    const keys2 = await IdentityKeyManager.generateIdentityKeys(seed2);

    const message = Buffer.from('Hello, world!');
    const signature = await IdentityKeyManager.sign(message, keys1.signKey.privateKey);

    const isValid = await IdentityKeyManager.verify(message, signature, keys2.signKey.publicKey);
    expect(isValid).toBe(false);
  });
});
