import { generateFingerprint, getSodium } from '../src';
import { IdentityKeyManager } from '../src';

describe('generateFingerprint', () => {
  beforeAll(async () => {
    await getSodium();
  });

  it('should generate a 4-word fingerprint from Ed25519 public key', async () => {
    const identitySeed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const fingerprint = await generateFingerprint(identityKeys.signKey.publicKey);

    const words = fingerprint.split('-');
    expect(words).toHaveLength(4);

    words.forEach(word => {
      expect(word.length).toBeGreaterThan(0);
    });
  });

  it('should generate deterministic fingerprint for same public key', async () => {
    const identitySeed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const fingerprint1 = await generateFingerprint(identityKeys.signKey.publicKey);
    const fingerprint2 = await generateFingerprint(identityKeys.signKey.publicKey);

    expect(fingerprint1).toBe(fingerprint2);
  });

  it('should generate different fingerprints for different public keys', async () => {
    const seed1 = IdentityKeyManager.generateIdentitySeed();
    const seed2 = IdentityKeyManager.generateIdentitySeed();

    const keys1 = await IdentityKeyManager.generateIdentityKeys(seed1);
    const keys2 = await IdentityKeyManager.generateIdentityKeys(seed2);

    const fingerprint1 = await generateFingerprint(keys1.signKey.publicKey);
    const fingerprint2 = await generateFingerprint(keys2.signKey.publicKey);

    expect(fingerprint1).not.toBe(fingerprint2);
  });

  it('should generate fingerprint with valid EFF words', async () => {
    const identitySeed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const fingerprint = await generateFingerprint(identityKeys.signKey.publicKey);
    const words = fingerprint.split('-');

    // Each word should be lowercase letters only
    words.forEach(word => {
      expect(word).toMatch(/^[a-z]+$/);
    });
  });

  it('should generate human-readable fingerprint format', async () => {
    const identitySeed = IdentityKeyManager.generateIdentitySeed();
    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const fingerprint = await generateFingerprint(identityKeys.signKey.publicKey);

    // Should match format: word-word-word-word
    expect(fingerprint).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/);
  });

  it('should handle edge case with known public key', async () => {
    // Create a known test public key (32 bytes of zeros for testing)
    const testPublicKey = new Uint8Array(32).fill(0);

    const fingerprint = await generateFingerprint(testPublicKey);

    // Should still generate valid 4-word fingerprint
    const words = fingerprint.split('-');
    expect(words).toHaveLength(4);
    expect(fingerprint).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/);
  });

  it('should generate unique fingerprints for multiple users', async () => {
    const fingerprints = new Set<string>();
    const numUsers = 100;

    for (let i = 0; i < numUsers; i++) {
      const seed = IdentityKeyManager.generateIdentitySeed();
      const keys = await IdentityKeyManager.generateIdentityKeys(seed);
      const fingerprint = await generateFingerprint(keys.signKey.publicKey);

      fingerprints.add(fingerprint);
    }

    // All fingerprints should be unique
    expect(fingerprints.size).toBe(numUsers);
  });
});
