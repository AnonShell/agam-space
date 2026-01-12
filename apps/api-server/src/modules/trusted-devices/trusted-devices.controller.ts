import { AuthRequired, CurrentUser } from '@/modules/auth/auth.decorator';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import {
  DeviceDto,
  RegisterDeviceDto,
  RegisterDeviceResponseDto,
  RegisterChallengeResponseDto,
  UnlockAssertionDto,
  UnlockChallengeDto,
  UnlockResponseDto,
  RegisterChallengeRequestDto,
} from '@/modules/trusted-devices/dto/trusted-devices.dto';
import { TrustedDevicesService } from '@/modules/trusted-devices/trusted-devices.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Inject,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebAuthnService } from './webauthn.service';

@ApiTags('Trusted Devices')
@ApiBearerAuth()
@AuthRequired()
@Controller('/devices')
export class TrustedDevicesController {
  constructor(
    private readonly trustedDevicesService: TrustedDevicesService,
    @Inject(WebAuthnService) private readonly webAuthnService: WebAuthnService
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'List user trusted devices' })
  @ApiResponse({
    status: 200,
    description: 'List of trusted devices',
    type: [DeviceDto],
  })
  async getDevices(@CurrentUser() user: AuthenticatedUser): Promise<DeviceDto[]> {
    return await this.trustedDevicesService.getUserDevices(user.id);
  }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new trusted device' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: RegisterDeviceResponseDto,
  })
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() registerDevice: RegisterDeviceDto
  ): Promise<RegisterDeviceResponseDto> {
    const device = await this.webAuthnService.registerDeviceWithWebAuthn(user.id, registerDevice);
    return {
      success: true,
      deviceId: device.id,
    };
  }

  @Post('/unlock/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request unlock challenge for device authentication' })
  @ApiResponse({
    status: 200,
    description: 'Challenge created',
    schema: {
      type: 'object',
      properties: {
        challenge: { type: 'string' },
        challengeId: { type: 'string' },
        timeout: { type: 'number' },
      },
    },
  })
  async createUnlockChallenge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnlockChallengeDto
  ) {
    return await this.webAuthnService.generateUnlockChallenge(user.id, dto.deviceId);
  }

  @Post('/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock using device authentication' })
  @ApiResponse({
    status: 200,
    description: 'Device authenticated, unlock key returned',
    type: UnlockResponseDto,
  })
  async unlockDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnlockAssertionDto
  ): Promise<UnlockResponseDto> {
    return await this.webAuthnService.verifyUnlockAssertion({
      userId: user.id,
      deviceId: dto.deviceId,
      challengeId: dto.challengeId,
      authenticatorData: dto.authenticatorData,
      clientDataJSON: dto.clientDataJSON,
      signature: dto.signature,
    });
  }

  @Delete('/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a trusted device' })
  @ApiResponse({
    status: 200,
    description: 'Device removed successfully',
  })
  async removeDevice(@CurrentUser() user: AuthenticatedUser, @Param('deviceId') deviceId: string) {
    await this.trustedDevicesService.deleteDevice(user.id, deviceId);
    // Always return success, even if device was not found or already deleted
    return { success: true };
  }

  @Post('/register/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration challenge for WebAuthn device' })
  @ApiResponse({
    status: 200,
    description: 'Registration challenge and deviceId',
    type: RegisterChallengeResponseDto,
  })
  async getRegisterChallenge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RegisterChallengeRequestDto
  ): Promise<RegisterChallengeResponseDto> {
    const deviceId = this.trustedDevicesService.generateDeviceId();
    const options = await this.webAuthnService.generateRegistrationOptions(
      user.id,
      user.username,
      deviceId,
      body.deviceName
    );
    return { deviceId, options };
  }
}
