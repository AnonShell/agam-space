import { randomBytes, getSodium } from '@agam-space/core';
import { XChaChaV1Strategy } from '../../src';

describe('XChaChaV1', () => {
  const strategy = new XChaChaV1Strategy();
  let testKey: Uint8Array;
  let testData: Uint8Array;

  beforeEach(() => {
    testKey = randomBytes(32);
    testData = new TextEncoder().encode('test message');
  });

  describe('encrypt', () => {
    it('should encrypt data', async () => {
      const envelope = await strategy.encrypt(testData, testKey);

      expect(envelope).toMatchObject({
        v: 1,
        n: expect.any(Uint8Array),
        c: expect.any(Uint8Array),
      });

      expect(envelope.c.length).toBeGreaterThan(0);
      expect(envelope.n.length).toBe(24);
    });

    it('should produce different ciphertexts for same input', async () => {
      const envelope1 = await strategy.encrypt(testData, testKey);
      const envelope2 = await strategy.encrypt(testData, testKey);

      expect(envelope1.n).not.toBe(envelope2.n);
      expect(envelope1.c).not.toBe(envelope2.c);
    });

    it('should throw on invalid key size', async () => {
      const invalidKey = new Uint8Array(16); // Too short
      await expect(strategy.encrypt(testData, invalidKey)).rejects.toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt what was encrypted', async () => {
      const envelope = await strategy.encrypt(testData, testKey);
      const decrypted = await strategy.decrypt(envelope, testKey);

      expect(Buffer.from(decrypted)).toEqual(Buffer.from(testData));
    });

    it('should throw on invalid key', async () => {
      const envelope = await strategy.encrypt(testData, testKey);
      const wrongKey = new Uint8Array(32).fill(2);

      await expect(strategy.decrypt(envelope, wrongKey)).rejects.toThrow();
    });

    it('should throw on tampered ciphertext', async () => {
      const envelope = await strategy.encrypt(testData, testKey);
      const tamperedEnvelope = {
        ...envelope,
        c: new Uint8Array(envelope.c.length).fill(0), // Tamper with ciphertext
      };

      await expect(strategy.decrypt(tamperedEnvelope, testKey)).rejects.toThrow();
    });

    it('should throw on invalid nonce length', async () => {
      const envelope = await strategy.encrypt(testData, testKey);
      const invalidEnvelope = {
        ...envelope,
        n: new Uint8Array(16), // Invalid nonce length
      };

      await expect(strategy.decrypt(invalidEnvelope, testKey)).rejects.toThrow();
    });
  });
});
