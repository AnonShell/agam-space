import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { TrustedDevicesService } from './trusted-devices.service';
import { ulid } from 'ulid';
import { AppConfigService } from '@/config/config.service';
import { UnlockChallengeResponseDto } from './dto/trusted-devices.dto';
import { fromBase64Url } from '@agam-space/core';
import { RegisterDeviceRequest } from '@agam-space/shared-types';

interface ChallengeStore {
  [key: string]: {
    challenge: string;
    deviceId: string;
    userId: string;
    timestamp: number;
  };
}

@Injectable()
export class WebAuthnService {
  private challengeStore: ChallengeStore = {};
  constructor(
    private readonly trustedDevicesService: TrustedDevicesService,
    private readonly appConfigService: AppConfigService
  ) {}

  async generateUnlockChallenge(
    userId: string,
    deviceId: string
  ): Promise<UnlockChallengeResponseDto> {
    const device = await this.trustedDevicesService.getDeviceByIdForUser(deviceId, userId);
    if (!device) {
      throw new NotFoundException('Trusted device not found');
    }
    const { rpId } = this.appConfigService.getWebauthnConfig();
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      timeout: 60000,
      userVerification: 'preferred',
    });
    const challengeId = ulid();
    this.challengeStore[challengeId] = {
      challenge: options.challenge,
      deviceId,
      userId,
      timestamp: Date.now(),
    };
    return {
      options,
      challengeId,
      prfInput: device.prfInput || undefined, // Include prfInput for PRF-enabled devices
    };
  }

  async verifyUnlockAssertion({
    userId,
    deviceId,
    challengeId,
    authenticatorData,
    clientDataJSON,
    signature,
  }: {
    userId: string;
    deviceId: string;
    challengeId: string;
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
  }) {
    const device = await this.trustedDevicesService.getDeviceByIdForUser(deviceId, userId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    const challengeRecord = this.challengeStore[challengeId];
    if (
      !challengeRecord ||
      challengeRecord.deviceId !== deviceId ||
      challengeRecord.userId !== userId
    ) {
      throw new BadRequestException('Invalid or expired challenge');
    }
    const { rpId, origin } = this.appConfigService.getWebauthnConfig();

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: {
          id: device.credentialId,
          rawId: device.credentialId,
          response: {
            authenticatorData,
            clientDataJSON,
            signature,
          },
          type: 'public-key',
          clientExtensionResults: {},
        },
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        credential: {
          id: device.credentialId,
          publicKey: fromBase64Url(device.webauthnPublicKey),
          counter: typeof device.counter === 'number' ? device.counter : 0,
        },
      } as unknown as Parameters<typeof verifyAuthenticationResponse>[0]);
    } catch (error) {
      console.error(
        '[WebAuthn] Verification error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new UnauthorizedException(
        'WebAuthn authentication failed. Please try again with the correct authenticator.'
      );
    }

    if (!verification.verified) {
      throw new BadRequestException('WebAuthn signature verification failed.');
    }

    this.removeChallenge(challengeId);
    await this.trustedDevicesService.updateLastUsedAndCounter(
      device.id,
      verification.authenticationInfo.newCounter
    );
    return { unlockKey: device.unlockKey };
  }

  async generateRegistrationOptions(userId: string, userName: string) {
    const { rpId } = this.appConfigService.getWebauthnConfig();
    const rpName = 'Agam Space';
    const userIdBytes = Buffer.from(userId, 'utf-8');

    return generateRegistrationOptions({
      rpName,
      rpID: rpId,
      userID: userIdBytes,
      userName: userName,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });
  }

  async registerDeviceWithWebAuthn(userId: string, registerDevice: RegisterDeviceRequest) {
    const { rpId, origin } = this.appConfigService.getWebauthnConfig();

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: {
          id: registerDevice.credentialId,
          rawId: registerDevice.credentialId,
          response: {
            attestationObject: registerDevice.attestationObject,
            clientDataJSON: registerDevice.clientDataJSON,
          },
          type: 'public-key',
          clientExtensionResults: {},
        },
        expectedChallenge: registerDevice.challenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
      });
    } catch (error) {
      console.error(
        '[WebAuthn] Registration verification error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new BadRequestException('WebAuthn registration failed. Please try again.');
    }

    if (!verification.verified) {
      throw new BadRequestException(
        'WebAuthn registration verification failed. The attestation could not be verified.'
      );
    }

    const { id, publicKey, counter } = verification.registrationInfo.credential;
    return await this.trustedDevicesService.createDeviceFromWebAuthn(userId, {
      credentialId: id,
      webauthnPublicKey: Buffer.from(publicKey).toString('base64url'),
      devicePublicKey: registerDevice.devicePublicKey,
      prfInput: registerDevice.prfInput,
      unlockKey: registerDevice.unlockKey,
      encryptedCMK: registerDevice.encryptedCMK,
      deviceName: registerDevice.deviceName,
      counter,
    });
  }

  private removeChallenge(challengeId: string): void {
    delete this.challengeStore[challengeId];
  }
}
