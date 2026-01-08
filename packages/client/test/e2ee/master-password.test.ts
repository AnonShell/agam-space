import { CmkManager } from '../../src';
import { validateMasterPassword, decryptCmkWithPassword, resetMasterPassword } from '../../src';
import { UserKeysSetup } from '@agam-space/shared-types';
import { IdentityKeyManager, toBase64 } from '@agam-space/core';

const TEST_PASSWORD = 'TestPassword123!';
const WRONG_PASSWORD = 'WrongPassword456!';
const NEW_PASSWORD = 'NewPassword789!';

describe('master-password', () => {
  let userKeys: UserKeysSetup;
  let masterKey: Uint8Array;

  beforeEach(async () => {
    const cmkManager = new CmkManager();
    const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);

    masterKey = result.masterKey;
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

  describe('validateMasterPassword', () => {
    it('should validate correct master password', async () => {
      const isValid = await validateMasterPassword(TEST_PASSWORD, userKeys);
      expect(isValid).toBe(true);
    });

    it('should reject wrong master password', async () => {
      const isValid = await validateMasterPassword(WRONG_PASSWORD, userKeys);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const isValid = await validateMasterPassword('', userKeys);
      expect(isValid).toBe(false);
    });

    it('should verify identity public key matches', async () => {
      const isValid = await validateMasterPassword(TEST_PASSWORD, userKeys);
      expect(isValid).toBe(true);

      const cmk = await decryptCmkWithPassword(
        userKeys.encCmkWithPassword,
        TEST_PASSWORD,
        userKeys.kdfMetadata.salt
      );
      const identityKeyPair = await IdentityKeyManager.generateIdentityKeyPair(cmk!);
      expect(toBase64(identityKeyPair.publicKey)).toBe(userKeys.identityPublicKey);
    });

    it('should reject if identity public key mismatches', async () => {
      const tamperedUserKeys = {
        ...userKeys,
        identityPublicKey: 'invalid-public-key-base64',
      };
      const isValid = await validateMasterPassword(TEST_PASSWORD, tamperedUserKeys);
      expect(isValid).toBe(false);
    });
  });

  describe('decryptCmkWithPassword', () => {
    it('should decrypt CMK with correct password', async () => {
      const cmk = await decryptCmkWithPassword(
        userKeys.encCmkWithPassword,
        TEST_PASSWORD,
        userKeys.kdfMetadata.salt
      );

      expect(cmk).toBeInstanceOf(Uint8Array);
      expect(cmk!.length).toBe(32);
      expect(Buffer.from(cmk!).equals(masterKey)).toBe(true);
    });

    it('should return null for wrong password', async () => {
      const cmk = await decryptCmkWithPassword(
        userKeys.encCmkWithPassword,
        WRONG_PASSWORD,
        userKeys.kdfMetadata.salt
      );

      expect(cmk).toBeNull();
    });

    it('should return null for invalid encrypted data', async () => {
      const cmk = await decryptCmkWithPassword(
        'invalid-encrypted-data',
        TEST_PASSWORD,
        userKeys.kdfMetadata.salt
      );

      expect(cmk).toBeNull();
    });

    it('should return null for empty password', async () => {
      const cmk = await decryptCmkWithPassword(
        userKeys.encCmkWithPassword,
        '',
        userKeys.kdfMetadata.salt
      );

      expect(cmk).toBeNull();
    });
  });

  describe('resetMasterPassword', () => {
    let recoveryKey: string;

    beforeEach(async () => {
      const cmkManager = new CmkManager();
      const result = await cmkManager.bootstrapCmkWithPassword(TEST_PASSWORD);
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

    it('should fail with invalid recovery key', async () => {
      const result = await resetMasterPassword('invalid-recovery-key', NEW_PASSWORD, userKeys);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recovery key');
    });

    it('should fail with empty recovery key', async () => {
      const result = await resetMasterPassword('', NEW_PASSWORD, userKeys);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
