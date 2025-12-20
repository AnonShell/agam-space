import { randomBytes } from 'crypto';
import { generateCmkChallenge, getSodium, verifyCmkChallenge } from '../src';
import { IdentityKeyManager } from '../src';

describe('cmkChallenge', () => {
  beforeAll(async () => {
    await getSodium();
  });

  describe('generateCmkChallenge', () => {
    it('should generate a valid challenge signature for a user', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp, signature } = await generateCmkChallenge(payload, keyPair.privateKey);
      expect(timestamp).toBeGreaterThan(Date.now() - 1000);
      expect(signature).toMatch(/^[A-Za-z0-9+/]+={0,2}$/); // Base64 format
      expect(signature.length).toBeGreaterThan(44);
    });
  });

  describe('verifyCmkChallenge', () => {
    it('should verify a valid challenge signature', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp, signature } = await generateCmkChallenge(payload, keyPair.privateKey);

      await verifyCmkChallenge(
        payload,
        signature,
        Buffer.from(keyPair.publicKey).toString('base64'),
        timestamp,
        30000 // 30 seconds max age
      );
    });

    it('should throw an error for an invalid signature', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp } = await generateCmkChallenge(payload, keyPair.privateKey);

      await expect(
        verifyCmkChallenge(
          payload,
          Buffer.from(randomBytes(44)).toString('base64'),
          Buffer.from(keyPair.publicKey).toString('base64'),
          timestamp,
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Invalid signature. Cannot verify key possession');
    });

    it('should throw an error for an expired challenge', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp, signature } = await generateCmkChallenge(payload, keyPair.privateKey);

      await expect(
        verifyCmkChallenge(
          payload,
          signature,
          Buffer.from(keyPair.publicKey).toString('base64'),
          timestamp - 60000, // 1 minute ago
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Challenge timestamp too old. Please retry with current timestamp.');
    });

    it('should throw an error for a future challenge', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { signature } = await generateCmkChallenge(payload, keyPair.privateKey);

      await expect(
        verifyCmkChallenge(
          payload,
          signature,
          Buffer.from(keyPair.publicKey).toString('base64'),
          Date.now() + 60000, // 1 minute in the future
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Challenge timestamp too far in the future.');
    });

    it('should throw an error for a mismatched userId', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp, signature } = await generateCmkChallenge(payload, keyPair.privateKey);

      await expect(
        verifyCmkChallenge(
          { userId: 'another-user' },
          signature,
          Buffer.from(keyPair.publicKey).toString('base64'),
          timestamp,
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Invalid signature. Cannot verify key possession');
    });

    it('should throw an error for a mismatched public key', async () => {
      const payload = { userId: 'test-user' };
      const keyPair1 = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const keyPair2 = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { timestamp, signature } = await generateCmkChallenge(payload, keyPair1.privateKey);

      await expect(
        verifyCmkChallenge(
          payload,
          signature,
          Buffer.from(keyPair2.publicKey).toString('base64'),
          timestamp,
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Invalid signature. Cannot verify key possession');
    });

    it('should handle edge case of zero timestamp', async () => {
      const payload = { userId: 'test-user' };
      const keyPair = await IdentityKeyManager.generateIdentityKeyPair(randomBytes(32));
      const { signature } = await generateCmkChallenge(payload, keyPair.privateKey);

      await expect(
        verifyCmkChallenge(
          payload,
          signature,
          Buffer.from(keyPair.publicKey).toString('base64'),
          0, // Zero timestamp
          30000 // 30 seconds max age
        )
      ).rejects.toThrow('Invalid timestamp. Must be a positive integer.');
    });
  });
});
