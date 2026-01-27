'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClientRegistry, CmkManager } from '@agam-space/client';
import { IdentityKeyManager, toBase64 } from '@agam-space/core';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { TrustedDevicesService } from '@/services/trusted-devices.service';
import { SessionUnlockManager } from '@/services/session-unlock-manager';
import { useAuth } from '@/store/auth';
import { MigrationRunner } from '@/lib/migrations';
import type { DeviceInfo } from '@agam-space/shared-types';
import { logger } from '@/lib/logger';

export default function E2eeUnlockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { e2eeKeys } = useE2eeKeys();
  const user = useAuth(s => s.user);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/explorer';

  const [serverDevice, setServerDevice] = useState<DeviceInfo | null>(null);
  const [hasDeviceData, setHasDeviceData] = useState(false);

  useEffect(() => {
    async function checkTrustedDevice() {
      if (!user?.id) {
        setServerDevice(null);
        setHasDeviceData(false);
        return;
      }

      const deviceData = await TrustedDevicesService.getDeviceData(user.id);
      if (!deviceData) {
        setHasDeviceData(false);
        setServerDevice(null);
        return;
      }

      setHasDeviceData(true);

      const devices: DeviceInfo[] = await TrustedDevicesService.fetchDevices();
      const device = devices.find(d => d.id === deviceData.deviceId);
      if (device && deviceData.credentialId === device.credentialId) {
        setServerDevice(device);
      } else {
        setServerDevice(null);
      }
    }
    checkTrustedDevice();
  }, [user?.id]);

  const hasTrustedDevice = Boolean(hasDeviceData && serverDevice);

  const handleUnlock = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!e2eeKeys || !e2eeKeys.encCmkWithPassword) {
      setError('Missing key material. Please login again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cmkManager = new CmkManager();
      const cmk = await cmkManager.decryptCmkWithPassword(
        e2eeKeys.encCmkWithPassword,
        password,
        e2eeKeys.kdfMetadata.salt
      );

      const initError = await initializeCmk(cmk);
      if (initError) {
        setError(initError.message);
        return;
      }
    } catch (err) {
      console.warn('Unlock failed:', err);
      setError('Invalid master password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceUnlock = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.id || !serverDevice) {
        setError('Device data not available');
        setLoading(false);
        return;
      }

      const cmk = await TrustedDevicesService.unlockWithDevice({
        userId: user.id,
        deviceId: serverDevice.id,
        encryptedCMK: serverDevice.encryptedCMK,
        devicePublicKey: serverDevice.devicePublicKey,
      });

      const initError = await initializeCmk(cmk);
      if (initError) {
        setError(initError.message);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Device unlock failed:', err);
      setError('Device unlock failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeCmk = async (cmk: Uint8Array) => {
    if (!user?.id) {
      return new Error('User not found');
    }

    ClientRegistry.getKeyManager().setCMK(cmk);

    // If user has new seed-based identity, decrypt and derive keys
    if (e2eeKeys?.encIdentitySeed) {
      const cmkManager = new CmkManager();
      const identitySeed = await cmkManager.decryptIdentitySeedWithCmk(
        e2eeKeys.encIdentitySeed,
        cmk
      );
      const identityKeys = await IdentityKeyManager.generateIdentityKeys(identitySeed);

      if (toBase64(identityKeys.signKey.publicKey) !== e2eeKeys.identityPublicKey) {
        logger.error('[E2EE Unlock]', 'Identity public key mismatch');
        return new Error('Identity public key mismatch');
      }

      ClientRegistry.getKeyManager().setIdentitySignKeyPair(identityKeys.signKey);
      ClientRegistry.getKeyManager().setIdentityEncKeyPair(identityKeys.encKey);
    } else {
      const legacyIdentityKeyPair = await IdentityKeyManager.generateIdentityKeyPairWithCmk(cmk);

      // Verify identity public key matches stored value
      if (toBase64(legacyIdentityKeyPair.publicKey) !== e2eeKeys!.identityPublicKey) {
        console.log('Identity public key mismatch');
        return new Error('Identity public key mismatch');
      }

      ClientRegistry.getKeyManager().setIdentitySignKeyPair(legacyIdentityKeyPair);
    }

    await SessionUnlockManager.saveCMKForAutoUnlock(cmk);

    // Check if migrations are needed
    const needsMigrations = await MigrationRunner.hasMigrations();

    if (needsMigrations) {
      router.replace(`/migrations?redirectTo=${encodeURIComponent(redirectTo)}`);
    } else {
      router.replace(redirectTo);
    }
  };

  return (
    <div className='mx-auto max-w-sm mt-20 px-4 space-y-4'>
      <h1 className='text-xl font-semibold text-center'>Unlock Agam Space</h1>
      <div className='space-y-4'>
        {hasTrustedDevice && (
          <Button type='button' onClick={handleDeviceUnlock} disabled={loading} className='w-full'>
            Unlock with this Device
          </Button>
        )}
        {hasTrustedDevice && (
          <div className='flex items-center my-2'>
            <div className='flex-grow h-px bg-muted' />
            <span className='mx-2 text-muted-foreground text-xs font-medium'>or</span>
            <div className='flex-grow h-px bg-muted' />
          </div>
        )}
        <form onSubmit={handleUnlock} className='space-y-4'>
          <Input
            autoFocus
            type='password'
            autoComplete='off'
            placeholder='Enter your master password'
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type='submit' disabled={loading || !password} className='w-full mb-2'>
            Unlock with Master Password
          </Button>
          {error && <p className='text-destructive text-sm'>{error}</p>}
        </form>
      </div>
    </div>
  );
}
