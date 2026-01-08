import { randomBytes, randomString, getSodium } from '../../src';

describe('random', () => {
  beforeAll(async () => {
    await getSodium();
  });

  describe('randomBytes', () => {
    it('should generate random bytes of default length', () => {
      const bytes = randomBytes();

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should generate random bytes of custom length', () => {
      const bytes = randomBytes(64);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(64);
    });

    it('should generate different values on each call', () => {
      const bytes1 = randomBytes(32);
      const bytes2 = randomBytes(32);

      expect(bytes1).not.toEqual(bytes2);
    });

    it('should handle small lengths', () => {
      const bytes = randomBytes(1);

      expect(bytes.length).toBe(1);
    });

    it('should handle large lengths', () => {
      const bytes = randomBytes(1024);

      expect(bytes.length).toBe(1024);
    });
  });

  describe('randomString', () => {
    it('should generate random string of default length', () => {
      const str = randomString();

      expect(typeof str).toBe('string');
      expect(str.length).toBeGreaterThan(0);
    });

    it('should generate different strings on each call', () => {
      const str1 = randomString();
      const str2 = randomString();

      expect(str1).not.toBe(str2);
    });

    it('should generate url-safe base64 string', () => {
      const str = randomString(32);

      expect(str).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should handle custom lengths', () => {
      const str16 = randomString(16);
      const str64 = randomString(64);

      expect(str16.length).toBeGreaterThan(0);
      expect(str64.length).toBeGreaterThan(0);
      expect(str64.length).toBeGreaterThan(str16.length);
    });
  });
});
