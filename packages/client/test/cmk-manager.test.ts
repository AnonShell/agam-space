import { CmkManager } from '../src';
import { encodeBase58, EncryptedEnvelopeCodec } from '@agam-space/core';

const TEST_PASSWORD = 'TestPassword123!';

describe('CmkManager', () => {
  let cmkManager: CmkManager;

  beforeEach(() => {
    cmkManager = new CmkManager();
  });

  it('should bootstrap CMK with password', async () => {
    const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);
    expect(result.masterKey).toBeInstanceOf(Uint8Array);
    expect(result.masterKey.length).toBe(32);

    expect(result.recoveryKey).toBeInstanceOf(Uint8Array);
    expect(result.recoveryKey.length).toBe(32);

    expect(result.identityPublicKey).toBeInstanceOf(Uint8Array);
    expect(result.identityPublicKey.length).toBe(32);

    expect(typeof result.encCmkWithPassword).toBe('string');
    expect(typeof result.encCmkWithRecovery).toBe('string');
    expect(typeof result.encRecoveryWithCmk).toBe('string');
    expect(result.kdfOptions.salt).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 encoded salt
    expect(result.kdfOptions.params).toMatchObject({
      opslimit: 3,
      memlimit: 65_536,
      hashLength: 32,
    });

    verifyEncryptedContent(result.encCmkWithPassword);
    verifyEncryptedContent(result.encCmkWithRecovery);
    verifyEncryptedContent(result.encRecoveryWithCmk);
    // verifyEncryptedContent(result.encIdentityPrivateKey);
  });

  // it('should throw error for invalid envelope format', async () => {
  //   const salt = Buffer.from(randomBytes(16)).toString('base64');
  //   await expect(
  //     cmkManager.decryptCmkWithPassword(
  //       'invalid-envelope',
  //       new TextEncoder().encode(TEST_PASSWORD),
  //       salt
  //     )
  //   ).rejects.toThrow('Invalid envelope format');
  // });

  it('should decrypt CMK with master password or recovery key', async () => {
    const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);

    let decryptedCmk = await cmkManager.decryptCmkWithPassword(
      result.encCmkWithPassword,
      TEST_PASSWORD,
      result.kdfOptions.salt
    );
    expect(Buffer.from(decryptedCmk).equals(result.masterKey)).toBe(true);

    decryptedCmk = await cmkManager.decryptCmkWithPassword(
      result.encCmkWithRecovery,
      result.recoveryKey,
      result.kdfOptions.salt
    );
    expect(Buffer.from(decryptedCmk).equals(result.masterKey)).toBe(true);

    const decryptedRecovery = await cmkManager.decryptRecoveryWithCmk(
      result.encRecoveryWithCmk,
      result.masterKey
    );

    expect(encodeBase58(decryptedRecovery)).toStrictEqual(result.recoveryKey);
  });

  it('should decrypt recovery key with CMK', async () => {
    const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);
    const decryptedRecovery = await cmkManager.decryptRecoveryWithCmk(
      result.encRecoveryWithCmk,
      result.masterKey
    );

    expect(encodeBase58(decryptedRecovery)).toStrictEqual(result.recoveryKey);
  });
});

function verifyEncryptedContent(content: string) {
  expect(typeof content).toBe('string');
  expect(content.length).toBeGreaterThan(0);

  const envelope = EncryptedEnvelopeCodec.deserialize(content);
  expect(envelope).toBeDefined();
}
