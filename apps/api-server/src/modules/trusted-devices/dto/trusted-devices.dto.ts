import {
  DeviceInfoSchema,
  RegisterDeviceRequestSchema,
  RegisterDeviceResponseSchema,
  RegisterChallengeRequestSchema,
  RegisterChallengeResponseSchema,
  UnlockAssertionRequestSchema,
  UnlockChallengeRequestSchema,
  UnlockResponseSchema,
  UnlockChallengeResponseSchema,
} from '@agam-space/shared-types';
import { createZodDto } from 'nestjs-zod';

export class RegisterDeviceDto extends createZodDto(RegisterDeviceRequestSchema) {}
export class RegisterChallengeRequestDto extends createZodDto(RegisterChallengeRequestSchema) {}
export class UnlockChallengeDto extends createZodDto(UnlockChallengeRequestSchema) {}
export class UnlockAssertionDto extends createZodDto(UnlockAssertionRequestSchema) {}
export class DeviceDto extends createZodDto(DeviceInfoSchema) {}
export class RegisterDeviceResponseDto extends createZodDto(RegisterDeviceResponseSchema) {}
export class RegisterChallengeResponseDto extends createZodDto(RegisterChallengeResponseSchema) {}
export class UnlockResponseDto extends createZodDto(UnlockResponseSchema) {}
export class UnlockChallengeResponseDto extends createZodDto(UnlockChallengeResponseSchema) {}
