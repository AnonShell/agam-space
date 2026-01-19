import { Migration, ShouldRunResult } from './migration.interface';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { IdentityKeyManager, toBase64, generateCmkChallenge } from '@agam-space/core';
import { ClientRegistry, CmkManager, migrateIdentitySeedApi } from '@agam-space/client';

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

    const cmk = ClientRegistry.getKeyManager().getCMK();
    if (!cmk) {
      throw new Error('CMK not available for seed encryption');
    }

    const cmkManager = new CmkManager();
    const encIdentitySeed = await cmkManager.encryptIdentitySeedWithCmk(identitySeed, cmk);

    const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

    const oldIdentityKeyPair = ClientRegistry.getKeyManager().getIdentitySignKeyPair();
    if (!oldIdentityKeyPair) {
      throw new Error('Old identity key not available for signing challenge');
    }

    const challengePayload = {
      encIdentitySeed,
      identityPublicKey: toBase64(identityKeys.signKey.publicKey),
      identityEncPubKey: toBase64(identityKeys.encKey.publicKey),
    };

    const challengeData = await generateCmkChallenge(challengePayload, oldIdentityKeyPair.privateKey);
    console.log('[IdentitySeedMigration] Created challenge signed with old identity key');

    await migrateIdentitySeedApi({
      encIdentitySeed,
      identityPublicKey: toBase64(identityKeys.signKey.publicKey),
      identityEncPubKey: toBase64(identityKeys.encKey.publicKey),
      challengeData,
    });

    ClientRegistry.getKeyManager().setIdentitySignKeyPair(identityKeys.signKey);
    ClientRegistry.getKeyManager().setIdentityEncKeyPair(identityKeys.encKey);

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
