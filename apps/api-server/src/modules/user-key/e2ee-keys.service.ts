import {
  E2eeChallenge,
  ResetCmkPasswordRequest,
  ResetRecoveryKeyRequest,
  UserKeys,
  UserKeysSchema,
} from '@agam-space/shared-types';
import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '@/database';
import { userKeys, type UserKeysEntity } from '@/database';

import { ChallengeVerificationService } from './challenge-verification.service';
import { userKeysHistory } from '@/database/schema/user-keys-backups';
import { UserKeysSetupDto } from '@/modules/user-key/dto/e2ee-keys.types';

@Injectable()
export class E2eeKeysService {
  private readonly logger = new Logger(E2eeKeysService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
    private readonly challengeVerification: ChallengeVerificationService
  ) {}

  async setupCmk(userId: string, data: UserKeysSetupDto): Promise<UserKeys> {
    this.logger.log(`Setting up CMK for user: ${userId}`);

    const existingKeys = await this.findUserKeys(userId);
    if (existingKeys) {
      throw new ConflictException('User already has encryption setup');
    }

    const newKeys = await this.db
      .insert(userKeys)
      .values({
        userId,
        kdfMetadata: data.kdfMetadata,
        encryptionVersion: data.encryptionVersion,
        encCmkWithPassword: data.encCmkWithPassword,
        encCmkWithRecovery: data.encCmkWithRecovery,
        encRecoveryWithCmk: data.encRecoveryWithCmk,
        identityPublicKey: data.identityPublicKey,
      })
      .returning();

    this.logger.log(`CMK setup completed for user: ${userId}`);
    return this.toDto(newKeys[0]);
  }

  async findUserKeys(userId: string): Promise<UserKeys | undefined> {
    const keys = await this.db.select().from(userKeys).where(eq(userKeys.userId, userId));
    return keys.length > 0 ? this.toDto(keys[0]) : undefined;
  }

  async updateEncryptedCmkWithPassword(
    userId: string,
    request: ResetCmkPasswordRequest
  ): Promise<UserKeys> {
    this.logger.log(`Updating encrypted CMK with password for user: ${userId}`);

    return this.updateUserKeys(userId, {
      challengeData: request.challengeData,
      encCmkWithPassword: request.encCmkWithPassword,
    });
  }

  async resetRecoveryKey(userId: string, request: ResetRecoveryKeyRequest): Promise<UserKeys> {
    this.logger.log(`Resetting recovery key for user: ${userId}`);

    return this.updateUserKeys(userId, {
      challengeData: request.challengeData,
      encCmkWithRecovery: request.encCmkWithRecovery,
      encRecoveryWithCmk: request.encRecoveryWithCmk,
    });
  }

  async updateUserKeys(
    userId: string,
    data: {
      challengeData: E2eeChallenge;
      encCmkWithPassword?: string;
      encCmkWithRecovery?: string;
      encRecoveryWithCmk?: string;
    }
  ): Promise<UserKeys> {
    this.logger.log(`Updating user keys for user: ${userId}`);

    const dbKeys = await this.findUserKeys(userId);
    if (!dbKeys) {
      throw new BadRequestException('User keys not found');
    }

    const allowedUpdates: Partial<UserKeysEntity> = {};

    if (data.encCmkWithPassword) {
      allowedUpdates.encCmkWithPassword = data.encCmkWithPassword;
    } else if (data.encRecoveryWithCmk) {
      if (!data.encCmkWithRecovery) {
        throw new BadRequestException(
          'encCmkWithRecovery is required when updating encRecoveryWithCmk'
        );
      }
      allowedUpdates.encCmkWithRecovery = data.encCmkWithRecovery;
      allowedUpdates.encRecoveryWithCmk = data.encRecoveryWithCmk;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    await this.challengeVerification.verifyChallengeAndSignature({
      signature: data.challengeData.signature,
      timestamp: data.challengeData.timestamp,
      publicKey: dbKeys.identityPublicKey,
      payload: allowedUpdates,
    });

    const updatedUserKeys: UserKeysEntity = await this.db.transaction(async tx => {
      const historyEntry = await tx
        .insert(userKeysHistory)
        .values({
          userId,
          ...allowedUpdates,
        })
        .returning();

      if (historyEntry.length === 0) {
        throw new BadRequestException('Failed to store user keys in history');
      }

      this.logger.log(
        `Stored user keys in history for user: ${userId} with entry ID: ${historyEntry[0].id}`
      );

      const updatedKeys = await tx
        .update(userKeys)
        .set(allowedUpdates)
        .where(eq(userKeys.userId, userId))
        .returning();

      if (updatedKeys.length === 0) {
        throw new BadRequestException('Failed to update user keys');
      }

      return updatedKeys[0];
    });

    this.logger.log(
      `User keys updated successfully for user: ${userId}, for keys:`,
      Object.keys(allowedUpdates)
    );
    return this.toDto(updatedUserKeys);
  }

  async toDto(userKeys: UserKeysEntity): Promise<UserKeys> {
    return UserKeysSchema.parse(userKeys);
  }
}
