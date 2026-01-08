import { CmkManager } from '../../src';
import { retrieveRecoveryKey, validateRecoveryKey, decryptCmkWithRecovery } from '../../src';
import { UserKeysSetup } from '@agam-space/shared-types';

const TEST_PASSWORD = 'TestPassword123!';
const WRONG_PASSWORD = 'WrongPassword456!';

describe('recovery-key', () => {
  let userKeys: UserKeysSetup;
  let recoveryKey: string;
  let masterKey: Uint8Array;

  beforeEach(async () => {
    const cmkManager = new CmkManager();
    const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);

    masterKey = result.masterKey;
    recoveryKey = result.recoveryKey;
    userKeys = {
      encCmkWithPassword: result.encCmkWithPassword,
      encCmkWithRecovery: result.encCmkWithRecovery,
      encRecoveryWithCmk: result.encRecoveryWithCmk,
      identityPublicKey: result.identityPublicKey,
      encryptionVersion: 'v1',
      kdfMetadata: {
        version: 'v1',
        type: result.kdfOptions.type,
        salt: result.kdfOptions.salt,
        params: {
          iterations: result.kdfOptions.params.opslimit,
          memory: result.kdfOptions.params.memlimit,
          hashLength: result.kdfOptions.params.hashLength,
        },
      },
    };
  });

  describe('retrieveRecoveryKey', () => {
    it('should retrieve recovery key with correct password', async () => {
      const result = await retrieveRecoveryKey(TEST_PASSWORD, userKeys);

      expect(result.success).toBe(true);
      expect(result.recoveryKey).toBe(recoveryKey);
      expect(result.error).toBeUndefined();
    });

    it('should fail with wrong password', async () => {
      const result = await retrieveRecoveryKey(WRONG_PASSWORD, userKeys);

      expect(result.success).toBe(false);
      expect(result.recoveryKey).toBeUndefined();
      expect(result.error).toBe('Invalid master password');
    });

    it('should fail with empty password', async () => {
      const result = await retrieveRecoveryKey('', userKeys);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid master password');
    });
  });

  describe('validateRecoveryKey', () => {
    it('should validate correct recovery key', async () => {
      const isValid = await validateRecoveryKey(recoveryKey, userKeys);
      expect(isValid).toBe(true);
    });

    it('should reject invalid recovery key', async () => {
      const isValid = await validateRecoveryKey('invalid-recovery-key', userKeys);
      expect(isValid).toBe(false);
    });

    it('should reject empty recovery key', async () => {
      const isValid = await validateRecoveryKey('', userKeys);
      expect(isValid).toBe(false);
    });

    it('should handle recovery key with whitespace', async () => {
      const recoveryKeyWithSpace = ` ${recoveryKey} `;
      const isValid = await validateRecoveryKey(recoveryKeyWithSpace, userKeys);
      expect(isValid).toBe(true);
    });
  });

  describe('decryptCmkWithRecovery', () => {
    it('should decrypt CMK with valid recovery key', async () => {
      const cmk = await decryptCmkWithRecovery(recoveryKey, userKeys);

      expect(cmk).toBeInstanceOf(Uint8Array);
      expect(cmk!.length).toBe(32);
      expect(Buffer.from(cmk!).equals(masterKey)).toBe(true);
    });

    it('should return null for invalid recovery key', async () => {
      const cmk = await decryptCmkWithRecovery('invalid-recovery-key', userKeys);
      expect(cmk).toBeNull();
    });

    it('should return null for empty recovery key', async () => {
      const cmk = await decryptCmkWithRecovery('', userKeys);
      expect(cmk).toBeNull();
    });
  });
});
