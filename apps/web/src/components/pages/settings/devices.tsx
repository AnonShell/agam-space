'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTrustedDevicesStore } from '@/store/trusted-devices.store';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { TrustedDevicesService } from '@/services/trusted-devices.service';
import { ApiClientError } from '@agam-space/client';
import { toast } from 'sonner';
import { useAuth } from '@/store/auth';

export default function TrustedDevicesPage() {
  const { devices, fetchDevices } = useTrustedDevicesStore();
  const user = useAuth(s => s.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { e2eeKeys } = useE2eeKeys();
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    async function checkCurrentDevice() {
      if (!user?.id) {
        setCurrentDeviceId(null);
        return;
      }
      const deviceData = await TrustedDevicesService.getDeviceData(user.id);
      setCurrentDeviceId(deviceData?.deviceId || null);
    }
    checkCurrentDevice();
  }, [user?.id, devices]);

  const isCurrentDeviceRegistered = currentDeviceId && devices.some(d => d.id === currentDeviceId);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    if (!e2eeKeys || !e2eeKeys.encCmkWithPassword || !e2eeKeys.kdfMetadata?.salt) {
      setError('Encryption keys are not set up. Please log out and log back in.');
      setLoading(false);
      return;
    }
    try {
      await TrustedDevicesService.registerDeviceWithPassword({
        userId: user!.id,
        deviceName,
        password,
        e2eeKeys: {
          encCmkWithPassword: e2eeKeys.encCmkWithPassword,
          kdfMetadata: { salt: e2eeKeys.kdfMetadata.salt },
        },
        fetchDevices,
        setModalOpen,
        setPassword,
        setDeviceName,
      });
      const deviceData = await TrustedDevicesService.getDeviceData(user!.id);
      if (deviceData) {
        setCurrentDeviceId(deviceData.deviceId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (deviceId: string) => {
    const isCurrent = deviceId === currentDeviceId;
    try {
      await TrustedDevicesService.removeDevice(deviceId, user!.id);
      if (isCurrent) {
        setCurrentDeviceId(null);
      }
      await fetchDevices();
      toast.success('Device removed successfully!');
    } catch (err: unknown) {
      let message = 'Failed to remove device';
      if (ApiClientError.isApiClientError(err)) {
        const apiErr = err as ApiClientError;
        if (apiErr.isUnauthorized()) {
          message = 'Authentication failed. Please log out and log back in.';
        } else if (apiErr.isServerError()) {
          message = 'Server error occurred. Please try again later.';
        } else {
          message = apiErr.errorMessage || apiErr.message;
        }
      }
      toast.error(message);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-6'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold'>Trusted Devices</h2>
          </div>
        </div>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <div className='card'>
              <div className='card-header'>
                <div className='card-title'>Trusted Devices</div>
              </div>
              <div className='card-content'>
                {devices.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-20 text-center text-muted-foreground'>
                    {/* Icon for empty state, similar to explorer */}
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='w-12 h-12 mb-4 text-muted'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 12v1m0 4v1m-8-5v1m0 4v1m-4-8h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2zm0 0V6a2 2 0 012-2h8a2 2 0 012 2v2'
                      />
                    </svg>
                    <h2 className='text-lg font-semibold text-foreground'>
                      No trusted devices yet
                    </h2>
                    <p className='mb-4 text-sm max-w-md mx-auto'>
                      Register a device to enable quick and secure unlock using biometrics
                      (WebAuthn). Once set up, you won’t need to enter your master password every
                      time, just use your device’s biometric authentication. Your master key is
                      never stored in plaintext.{' '}
                      <a
                        href='/docs-private/security/device-unlock-flow'
                        target='_blank'
                        className='underline text-blue-600 hover:text-blue-800'
                      >
                        Learn more in our security docs
                      </a>
                      .
                    </p>
                    {!isCurrentDeviceRegistered && (
                      <Button onClick={() => setModalOpen(true)} variant='secondary'>
                        Register This Device
                      </Button>
                    )}
                    {isCurrentDeviceRegistered && (
                      <div className='mt-2 text-xs text-green-700'>
                        This device is already registered.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {!isCurrentDeviceRegistered && (
                      <Button onClick={() => setModalOpen(true)} className='mb-4'>
                        Register This Device
                      </Button>
                    )}
                    {isCurrentDeviceRegistered && (
                      <div className='mb-4 text-xs text-green-700'>
                        This device is already registered.
                      </div>
                    )}
                    <ul className='mt-4 space-y-2'>
                      {devices.map(device => {
                        const isCurrent = currentDeviceId === device.id;
                        return (
                          <li
                            key={device.id}
                            className='flex items-center justify-between border p-2 rounded'
                          >
                            <span className='flex items-center gap-2'>
                              {device.deviceName}
                              {isCurrent && (
                                <span
                                  className='px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 border border-green-300'
                                  title='This is your current device'
                                >
                                  Current Device
                                </span>
                              )}
                            </span>
                            <Button variant='destructive' onClick={() => handleRemove(device.id)}>
                              Remove
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Trusted Device</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              placeholder='Device Name'
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              disabled={loading}
              autoComplete='off'
            />
            <Input
              type='password'
              placeholder='Enter your master password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoComplete='new-password'
            />
            {error && <div className='text-red-500 text-sm'>{error}</div>}
            <Button onClick={handleRegister} disabled={loading || !password || !deviceName}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
