import {
  ResetCmkPasswordRequestSchema,
  ResetRecoveryKeyRequestSchema,
  MigrateIdentitySeedRequestSchema,
  UserKeysSchema,
  UserKeysSetupSchema,
} from '@agam-space/shared-types';
import { createZodDto } from 'nestjs-zod';

export class UserKeysSetupDto extends createZodDto(UserKeysSetupSchema) {}

export class UserKeysDto extends createZodDto(UserKeysSchema) {}

export class ResetCmkPasswordRequestDto extends createZodDto(ResetCmkPasswordRequestSchema) {}

export class ResetRecoveryKeyRequestDto extends createZodDto(ResetRecoveryKeyRequestSchema) {}

export class MigrateIdentitySeedRequestDto extends createZodDto(MigrateIdentitySeedRequestSchema) {}
