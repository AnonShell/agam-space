import { randomBytes } from '@noble/ciphers/webcrypto';

import { deriveKeyFromSecret } from '../../src/crypto/argon2';

describe('deriveKeyFromSecret', () => {
  const password = new TextEncoder().encode('test-password');
  const salt = randomBytes(16);

  it('should derive a key with v1 parameters', async () => {
    const result = await deriveKeyFromSecret(password, salt);

    // Verify structure
    expect(result.key).toBeInstanceOf(Uint8Array);
    expect(result.key).toHaveLength(32);

    // Verify params match v1 preset
    expect(result.params).toEqual({
      opslimit: 3,
      memlimit: 65_536,
      hashLength: 32,
    });
  });

  it('should be deterministic with same inputs', async () => {
    const result1 = await deriveKeyFromSecret(password, salt);
    const result2 = await deriveKeyFromSecret(password, salt);

    expect(Buffer.from(result1.key)).toEqual(Buffer.from(result2.key));
  });

  it('should produce different outputs with different salts', async () => {
    const salt2 = randomBytes(16);
    const result1 = await deriveKeyFromSecret(password, salt);
    const result2 = await deriveKeyFromSecret(password, salt2);

    expect(Buffer.from(result1.key)).not.toEqual(Buffer.from(result2.key));
  });

  it('should throw on invalid version', async () => {
    // @ts-expect-error Testing invalid version
    await expect(deriveKeyFromSecret(password, salt, 'invalid')).rejects.toThrow();
  });
});
