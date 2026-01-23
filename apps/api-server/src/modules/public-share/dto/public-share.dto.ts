import { createZodDto } from 'nestjs-zod';
import {
  CreatePublicShareSchema,
  GetPublicShareKeyDetailsSchema,
  PublicShareDetailsSchema,
  PublicShareExternalDetailsSchema,
  PublicShareKeysSchema,
  PublicShareResponseSchema,
} from '@agam-space/shared-types';

export class CreatePublicShareDto extends createZodDto(CreatePublicShareSchema) {}

export class PublicShareDetailsDto extends createZodDto(PublicShareDetailsSchema) {}

export class PublicShareExternalDetailsDto extends createZodDto(PublicShareExternalDetailsSchema) {}

export class PublicShareKeysDto extends createZodDto(PublicShareKeysSchema) {}

export class PublicShareResponseDto extends createZodDto(PublicShareResponseSchema) {}

export class GetPublicShareKeyDetailsDto extends createZodDto(GetPublicShareKeyDetailsSchema) {}
