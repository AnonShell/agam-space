import {
  DeviceInfoArraySchema,
  RegisterDeviceRequest,
  RegisterDeviceResponseSchema,
  UnlockChallengeResponseSchema,
  UnlockResponseSchema,
} from '@agam-space/shared-types';
import { ClientRegistry } from '../init/client.registry';

export async function listTrustedDevices() {
  return ClientRegistry.getApiClient().fetchAndParse('/v1/devices', DeviceInfoArraySchema);
}

export async function registerTrustedDevice(data: RegisterDeviceRequest) {
  return ClientRegistry.getApiClient().fetchAndParse(
    '/v1/devices/register',
    RegisterDeviceResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
}

export async function removeTrustedDevice(deviceId: string) {
  return ClientRegistry.getApiClient().fetchRaw(`/v1/devices/${deviceId}`, {
    method: 'DELETE',
  });
}

export async function requestUnlockChallenge(deviceId: string) {
  return ClientRegistry.getApiClient().fetchAndParse(
    '/v1/devices/unlock/challenge',
    UnlockChallengeResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }
  );
}

export async function verifyUnlockAssertion(data: any) {
  return ClientRegistry.getApiClient().fetchAndParse('/v1/devices/unlock', UnlockResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getRegisterChallenge(
  deviceName: string
): Promise<{ deviceId: string; options: any }> {
  const response = await ClientRegistry.getApiClient().fetchRaw('/v1/devices/register/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceName }),
  });
  if (!response.ok) {
    throw new Error('Failed to get register challenge');
  }
  return await response.json();
}
