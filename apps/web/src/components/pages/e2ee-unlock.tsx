'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClientRegistry, CmkManager } from '@agam-space/client';
import { IdentityKeyManager, toBase64 } from '@agam-space/core';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { useDeviceCredentialsStore } from '@/store/device-credentials.store';
import { TrustedDevicesService } from '@/services/trusted-devices.service';
import { useAuth } from '@/store/auth'; // ✅ ADD: Need current user
import type { DeviceInfo } from '@agam-space/shared-types';

function getIdentityKeyPairFromCmk(cmk: Uint8Array) {
  return IdentityKeyManager.generateIdentityKeyPair(cmk);
}

export default function E2eeUnlockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { e2eeKeys } = useE2eeKeys();
  const user = useAuth(s => s.user);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/explorer';

  // ✅ FIX: Only show device unlock if credentials match current user
  const credentials = user ? useDeviceCredentialsStore.getState().getCredentialsForUser(user.id) : null;

  // Fetch latest trusted devices from backend before showing unlock button
  const [serverDevice, setServerDevice] = useState<DeviceInfo | null>(null);
  useEffect(() => {
    async function checkTrustedDevice() {
      if (!credentials) {
        setServerDevice(null);
        return;
      }
      const devices: DeviceInfo[] = await TrustedDevicesService.fetchDevices();
      const device = devices.find(d => d.id === credentials.deviceId);
      if (
        device &&
        credentials.credentialId === device.credentialId &&
        credentials.devicePublicKey === device.devicePublicKey
      ) {
        setServerDevice(device);
      } else {
        setServerDevice(null);
      }
    }
    checkTrustedDevice();
  }, [credentials]);

  const hasTrustedDevice = Boolean(
    credentials &&
    serverDevice &&
    credentials.credentialId &&
    credentials.encryptedDevicePrivateKey
  );

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
        e2eeKeys.kdfMetadata.salt);

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
      if (!credentials) {
        setError('No device credentials found');
        setLoading(false);
        return;
      }
      // Fetch latest trusted device from backend
      const devices: DeviceInfo[] = await TrustedDevicesService.fetchDevices();
      const device = devices.find(d => d.id === credentials.deviceId);
      if (!device) {
        setError('Device not found on server');
        setLoading(false);
        return;
      }
      // Use server-fetched encryptedCMK and devicePublicKey
      const cmk = await TrustedDevicesService.unlockWithDevice({
        credentialId: credentials.credentialId,
        encryptedDevicePrivateKey: credentials.encryptedDevicePrivateKey,
        encryptedCMK: device.encryptedCMK,
        deviceId: credentials.deviceId,
        devicePublicKey: device.devicePublicKey,
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
    const identifyKeyPair = await getIdentityKeyPairFromCmk(cmk);

    if(toBase64(identifyKeyPair.publicKey) !== e2eeKeys!.identityPublicKey) {
      console.log('Identity public key mismatch');
      return new Error('Identity public key mismatch');
    }

    ClientRegistry.getKeyManager().setCMK(cmk);
    ClientRegistry.getKeyManager().setIdentityKeyPair(identifyKeyPair);

    router.replace(redirectTo);
  }

  return (
    <div className="mx-auto max-w-sm mt-20 px-4 space-y-4">
      <h1 className="text-xl font-semibold text-center">Unlock Agam Space</h1>
      <div className="space-y-4">
        {hasTrustedDevice && (
          <Button
            type="button"
            onClick={handleDeviceUnlock}
            disabled={loading}
            className="w-full"
          >
            Unlock with this Device
          </Button>
        )}
        {hasTrustedDevice && (
          <div className="flex items-center my-2">
            <div className="flex-grow h-px bg-muted" />
            <span className="mx-2 text-muted-foreground text-xs font-medium">or</span>
            <div className="flex-grow h-px bg-muted" />
          </div>
        )}
        <form onSubmit={handleUnlock} className="space-y-4">
          <Input
            autoFocus
            type="password"
            placeholder="Enter your master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading || !password} className="w-full mb-2">
            Unlock with Master Password
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );

}
