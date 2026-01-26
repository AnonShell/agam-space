import { createZodDto } from 'nestjs-zod';
import { CreateInviteRequestSchema, CreateInviteResponseSchema } from '@agam-space/shared-types';

export class CreateInviteRequestDto extends createZodDto(CreateInviteRequestSchema) {}

export class CreateInviteResponseDto extends createZodDto(CreateInviteResponseSchema) {}
