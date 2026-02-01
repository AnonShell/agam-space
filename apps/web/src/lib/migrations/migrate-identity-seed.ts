import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { ClientRegistry, CmkManager, migrateIdentitySeedApi } from '@agam-space/client';
import { generateCmkChallenge, IdentityKeyManager, toBase64 } from '@agam-space/core';
import { Migration, ShouldRunResult } from './migration.interface';
import { logger } from '@/lib/logger';

export class IdentitySeedMigration implements Migration {
  getName(): string {
    return 'identity-seed-migration';
  }

  getDescription(): string {
    return 'Upgrading identity keys to use a new seed-based format.';
  }

  async shouldRun(): Promise<ShouldRunResult> {
    const e2eeKeys = useE2eeKeys.getState().e2eeKeys;

    return {
      shouldRun: !!e2eeKeys && !e2eeKeys.encIdentitySeed,
      permanent: true,
    };
  }

  async run(): Promise<void> {
    console.log('[IdentitySeedMigration] Starting migration...');

    const e2eeKeys = useE2eeKeys.getState().e2eeKeys;
    if (!e2eeKeys) {
      throw new Error('E2EE keys not available');
    }

    const identitySeed = IdentityKeyManager.generateIdentitySeed();

    const cryptoService = ClientRegistry.getCryptoKeyOperationsService();

    const encIdentitySeed = await ClientRegistry.getCryptoKeyOperationsService().encryptAndEncodeWithCmk(
      identitySeed
    );

    logger.debug('[IdentitySeedMigration]', 'Encrypted new identity seed with CMK');

    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const challengePayload = {
      encIdentitySeed,
      identityPublicKey: toBase64(identityKeys.signKey.publicKey),
      identityEncPubKey: toBase64(identityKeys.encKey.publicKey),
    };

    // Sign challenge with OLD identity key (in worker or main thread) via crypto service
    const challengeData = await generateCmkChallenge(
      challengePayload,
      new Uint8Array(), // Not used when signFunction is provided
      (message) => cryptoService.signWithIdentity(message)
    );
    console.log('[IdentitySeedMigration] Created challenge signed with old identity key');

    await migrateIdentitySeedApi({
      encIdentitySeed,
      identityPublicKey: toBase64(identityKeys.signKey.publicKey),
      identityEncPubKey: toBase64(identityKeys.encKey.publicKey),
      challengeData,
    });

    const cmk = await cryptoService.getCMK();
    if (!cmk) {
      throw new Error('CMK not available after migration');
    }

    await cryptoService.initKeys({
      cmk,
      encIdentitySeed,
    });

    const updatedE2eeKeys = {
      ...e2eeKeys,
      encIdentitySeed,
      identityPublicKey: toBase64(identityKeys.signKey.publicKey),
      identityEncPubKey: toBase64(identityKeys.encKey.publicKey),
    };
    useE2eeKeys.getState().setE2eeKeys(updatedE2eeKeys);

    console.log('[IdentitySeedMigration] Migration complete - new seed-based identity is now active');
  }
}
