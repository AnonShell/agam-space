import { DATABASE_CONNECTION } from '@/database';
import { trustedDevices } from '@/database/schema/trusted-devices';
import {
  DeviceInfo,
  DeviceInfoSchema,
  RegisterDeviceRequest,
  TrustedDevice,
  TrustedDeviceSchema,
} from '@agam-space/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ulid } from 'ulid';

@Injectable()
export class TrustedDevicesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>) {}

  generateDeviceId(): string {
    return ulid();
  }

  // async createDevice(userId: string, newDevice: RegisterDeviceRequest): Promise<DeviceInfo> {
  //   // This method is now legacy and should not perform WebAuthn verification.
  //   // Use createDeviceFromWebAuthn for WebAuthn device registration.
  //   const values: any = {
  //     id: ulid(),
  //     userId: userId,
  //     credentialId: newDevice.credentialId,
  //     devicePublicKey: newDevice.devicePublicKey,
  //     unlockKey: newDevice.unlockKey,
  //     deviceName: newDevice.deviceName,
  //     counter: 0,
  //   };
  //   // Only set webauthnPublicKey if present
  //   if ('webauthnPublicKey' in newDevice && newDevice.webauthnPublicKey) {
  //     values.webauthnPublicKey = newDevice.webauthnPublicKey;
  //   }
  //   const [device] = await this.db
  //     .insert(trustedDevices)
  //     .values(values)
  //     .returning();
  //   return DeviceInfoSchema.parse(device);
  // }

  async createDeviceFromWebAuthn(
    userId: string,
    device: {
      credentialId: string;
      webauthnPublicKey: string;
      devicePublicKey: string;
      unlockKey: string;
      deviceName: string;
      counter: number;
    }
  ): Promise<DeviceInfo> {
    const [created] = await this.db
      .insert(trustedDevices)
      .values({
        id: ulid(),
        userId,
        credentialId: device.credentialId,
        webauthnPublicKey: device.webauthnPublicKey,
        devicePublicKey: device.devicePublicKey,
        unlockKey: device.unlockKey,
        deviceName: device.deviceName,
        counter: device.counter,
      })
      .returning();
    return DeviceInfoSchema.parse(created);
  }

  async getDeviceByCredentialId(credentialId: string): Promise<TrustedDevice | null> {
    const [device] = await this.db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.credentialId, credentialId))
      .limit(1);

    return device ? TrustedDeviceSchema.parse(device) : null;
  }

  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    const devices = await this.db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .orderBy(desc(trustedDevices.createdAt));

    return devices.map(device => DeviceInfoSchema.parse(device));
  }

  async updateLastUsed(deviceId: string): Promise<void> {
    await this.db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(eq(trustedDevices.id, deviceId));
  }

  async updateLastUsedAndCounter(deviceId: string, newCounter: number): Promise<void> {
    await this.db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date(), counter: newCounter })
      .where(eq(trustedDevices.id, deviceId));
  }

  async deleteDevice(userId: string, deviceId: string): Promise<boolean> {
    const result = await this.db
      .delete(trustedDevices)
      .where(and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, userId)));

    return result.length > 0;
  }

  async deleteAllUserDevices(userId: string): Promise<void> {
    await this.db.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
  }

  async getDeviceById(deviceId: string): Promise<TrustedDevice | null> {
    const [device] = await this.db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.id, deviceId))
      .limit(1);
    return device ? TrustedDeviceSchema.parse(device) : null;
  }

  async getDeviceByIdForUser(deviceId: string, userId: string): Promise<TrustedDevice | null> {
    const [device] = await this.db
      .select()
      .from(trustedDevices)
      .where(and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, userId)))
      .limit(1);
    return device ? TrustedDeviceSchema.parse(device) : null;
  }
}
