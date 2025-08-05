import { verifyCmkChallenge } from '@agam-space/core';
import { Injectable, Logger } from '@nestjs/common';

export interface ChallengeVerificationData {
  timestamp: number;
  signature: string;
  payload: object;
  publicKey: string;
}

@Injectable()
export class ChallengeVerificationService {
  private readonly logger = new Logger(ChallengeVerificationService.name);

  private readonly MAX_TIMESTAMP_AGE_MS = 30_000;

  async verifyChallengeAndSignature(data: ChallengeVerificationData): Promise<void> {
    const { timestamp, signature, payload, publicKey } = data;

    this.logger.debug(`Verifying challenge and signature for identifier: ${payload}`);

    await verifyCmkChallenge(
      payload,
      signature,
      publicKey,
      timestamp,
      this.MAX_TIMESTAMP_AGE_MS
    );
  }
}
