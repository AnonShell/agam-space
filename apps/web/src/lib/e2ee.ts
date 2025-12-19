import { CmkManager, setupE2eeKeysApi } from '@agam-space/client';
import { UserKeysSetup } from '@agam-space/shared-types';
import { useE2eeKeys } from '@/store/e2ee-keys.store';

export async function setupCmkWithPassword(password: string) {
  const cmkManager = new CmkManager();
  const result = await cmkManager.bootstrapCmkWithPassword(password);

  const payload: UserKeysSetup = {
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
    encryptionVersion: 'v1',
    encCmkWithPassword: result.encCmkWithPassword,
    encCmkWithRecovery: result.encCmkWithRecovery,
    encRecoveryWithCmk: result.encRecoveryWithCmk,
    identityPublicKey: result.identityPublicKey,
  };

  const userKeys = await setupE2eeKeysApi(payload);

  useE2eeKeys.getState().setE2eeKeys(userKeys);

  return {
    recoveryKey: result.recoveryKey,
  };
}
