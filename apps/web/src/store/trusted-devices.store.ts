import { create } from 'zustand';
import { TrustedDevicesService } from '@/services/trusted-devices.service';

export interface TrustedDevice {
  id: string;
  deviceName: string;
  lastUsedAt?: string | null;
  credentialId: string;
}

interface TrustedDevicesStore {
  devices: TrustedDevice[];
  fetchDevices: () => Promise<void>;
  setDevices: (devices: TrustedDevice[]) => void;
  registerDevice: (params: {
    userId: string;
    deviceName: string;
    cmk: Uint8Array;
  }) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
}

export const useTrustedDevicesStore = create<TrustedDevicesStore>()((set, get) => ({
  devices: [],
  fetchDevices: async () => {
    const devices = await TrustedDevicesService.fetchDevices();
    set({ devices });
  },
  setDevices: devices => set({ devices }),
  registerDevice: async ({ userId, deviceName, cmk }) => {
    await TrustedDevicesService.registerDevice({ userId, deviceName, cmk });
    await get().fetchDevices();
  },
  removeDevice: async deviceId => {
    await TrustedDevicesService.removeDevice(deviceId);
    await get().fetchDevices();
  },
}));
