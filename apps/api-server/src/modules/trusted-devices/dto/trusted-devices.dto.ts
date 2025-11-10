import {
  DeviceInfoSchema,
  RegisterDeviceRequestSchema,
  RegisterDeviceResponseSchema,
  UnlockAssertionRequestSchema,
  UnlockChallengeRequestSchema,
  UnlockResponseSchema,
  UnlockChallengeResponseSchema,
} from '@agam-space/shared-types';
import { createZodDto } from 'nestjs-zod';

export class RegisterDeviceDto extends createZodDto(RegisterDeviceRequestSchema) {}
export class UnlockChallengeDto extends createZodDto(UnlockChallengeRequestSchema) {}
export class UnlockAssertionDto extends createZodDto(UnlockAssertionRequestSchema) {}
export class DeviceDto extends createZodDto(DeviceInfoSchema) {}
export class RegisterDeviceResponseDto extends createZodDto(RegisterDeviceResponseSchema) {}
export class UnlockResponseDto extends createZodDto(UnlockResponseSchema) {}
export class UnlockChallengeResponseDto extends createZodDto(UnlockChallengeResponseSchema) {}
